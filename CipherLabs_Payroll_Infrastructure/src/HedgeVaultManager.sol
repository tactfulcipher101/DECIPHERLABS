// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// NOTE: Upgradeability disabled for testnet. Using standard Ownable.
// import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IDeCipherLabs_PayrollFactory.sol";
import "./interfaces/ISwapRouter.sol";

contract HedgeVaultManager is
    // NOTE: Upgradeability disabled for testnet
    // OwnableUpgradeable, UUPSUpgradeable,
    Ownable,
    ReentrancyGuard
{
    using SafeERC20 for IERC20;

    // Risk configuration
    enum RiskLevel {
        CONSERVATIVE, // 80% stable, 20% volatile
        MODERATE, // 60% stable, 40% volatile
        AGGRESSIVE // 40% stable, 60% volatile
    }

    struct HedgeVault {
        address employee;
        address volatileToken;
        address stableToken;
        RiskLevel riskLevel;
        uint256 volatileAllocation; // basis points
        uint256 stableAllocation; // basis points
        uint256 lastRebalance;
        bool enabled;
        uint256 volatilityThreshold; // basis points
    }

    struct VaultConfig {
        uint256 minRebalanceInterval;
        address defaultStableToken;
        uint256 performanceFeeBps;
        address feeRecipient;
        bool systemEnabled;
    }

    // EIP-7201 Namespaced Storage Layout
    bytes32 private constant STORAGE_SLOT =
        keccak256("decipherlabs.hedgevault.storage");

    struct HedgeVaultStorage {
        // System configuration
        VaultConfig config;
        // Mapping of employee address to their hedge vault
        mapping(address => HedgeVault) hedgeVaults;
    }
    // NOTE: Upgradeability gap disabled for testnet
    // uint256[49] __gap;

    // NOTE: Upgradeability disabled for testnet
    /*
    constructor() {
        _disableInitializers();
    }
    */
    IDeCipherLabs_PayrollFactory public factory;
    ISwapRouter public swapRouter;
    uint24 public constant POOL_FEE = 3000; // 0.3% fee tier for Uniswap

    constructor() Ownable(msg.sender) {
        // Owner set in constructor for testnet
    }

    function setFactory(address _factory) external onlyOwner {
        factory = IDeCipherLabs_PayrollFactory(_factory);
    }

    function setSwapRouter(address _swapRouter) external onlyOwner {
        swapRouter = ISwapRouter(_swapRouter);
    }

    function _getStorage() private pure returns (HedgeVaultStorage storage s) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            s.slot := slot
        }
    }

    modifier onlyFactoryOrOwner() {
        require(
            msg.sender == owner() ||
                (address(factory) != address(0) &&
                    factory.isPayroll(msg.sender)),
            "Not factory or owner"
        );
        _;
    }

    // Events
    event HedgeVaultEnabled(
        address indexed employee,
        address volatileToken,
        address stableToken,
        RiskLevel riskLevel
    );

    event HedgeVaultUpdated(
        address indexed employee,
        uint256 volatileAllocation,
        uint256 stableAllocation
    );

    event VaultRebalanced(
        address indexed employee,
        uint256 volatileAmount,
        uint256 stableAmount
    );

    event DepositReceived(
        address indexed employee,
        address indexed token,
        uint256 amount
    );

    event Withdrawal(
        address indexed employee,
        address indexed token,
        uint256 amount
    );

    event PerformanceFeeCharged(address indexed employee, uint256 feeAmount);

    event TokenSwapped(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address indexed recipient
    );

    // NOTE: Upgradeability disabled for testnet
    /*
    function initialize(
        address _defaultStableToken,
        address _feeRecipient
    ) external initializer {
        require(_defaultStableToken != address(0), "Invalid stable token");
        require(_feeRecipient != address(0), "Invalid fee recipient");

        __Ownable_init(msg.sender);
        // UUPSUpgradeable has no initializer.

        transferOwnership(msg.sender);

        HedgeVaultStorage storage s = _getStorage();

        s.config = VaultConfig({
            minRebalanceInterval: 1 hours,
            defaultStableToken: _defaultStableToken,
            performanceFeeBps: 25,
            feeRecipient: _feeRecipient,
            systemEnabled: true
        });

        _disableInitializers();
    }
    */

    // Testnet version: Direct initialization
    function initialize(
        address _defaultStableToken,
        address _feeRecipient,
        address _factory
    ) external {
        require(_defaultStableToken != address(0), "Invalid stable token");
        require(_feeRecipient != address(0), "Invalid fee recipient");
        // Prevent re-initialization by checking if already initialized
        require(
            owner() == address(0) || owner() == msg.sender,
            "Already initialized or not owner"
        );

        // Set owner to caller
        transferOwnership(msg.sender);

        // Set factory reference
        factory = IDeCipherLabs_PayrollFactory(_factory);

        HedgeVaultStorage storage s = _getStorage();

        s.config = VaultConfig({
            minRebalanceInterval: 1 hours,
            defaultStableToken: _defaultStableToken,
            performanceFeeBps: 25,
            feeRecipient: _feeRecipient,
            systemEnabled: true
        });
    }

    /**
     * @notice Initialize a hedge vault
     * @param employee Employee address
     * @param volatileToken Volatile token address
     * @param stableToken Stable token address (optional)
     * @param riskLevel Risk preference
     * @param volatilityThreshold Rebalance threshold (bps)
     */
    function initializeHedgeVault(
        address employee,
        address volatileToken,
        address stableToken,
        RiskLevel riskLevel,
        uint256 volatilityThreshold
    ) external onlyFactoryOrOwner {
        require(employee != address(0), "Invalid employee address");
        require(volatileToken != address(0), "Invalid volatile token");
        require(riskLevel <= RiskLevel.AGGRESSIVE, "Invalid risk level");

        HedgeVaultStorage storage s = _getStorage();

        // Use default stable token if none provided
        if (stableToken == address(0)) {
            stableToken = s.config.defaultStableToken;
        }

        // Set default allocations based on risk level
        (
            uint256 volatileAlloc,
            uint256 stableAlloc
        ) = _getAllocationByRiskLevel(riskLevel);

        HedgeVault storage vault = s.hedgeVaults[employee];
        vault.employee = employee;
        vault.volatileToken = volatileToken;
        vault.stableToken = stableToken;
        vault.riskLevel = riskLevel;
        vault.volatileAllocation = volatileAlloc;
        vault.stableAllocation = stableAlloc;
        vault.lastRebalance = block.timestamp;
        vault.enabled = true;
        vault.volatilityThreshold = volatilityThreshold; // e.g., 500 = 5% threshold

        emit HedgeVaultEnabled(employee, volatileToken, stableToken, riskLevel);
    }

    /**
     * @notice Update hedge vault configuration
     * @param volatileAllocation Volatile allocation (bps)
     * @param stableAllocation Stable allocation (bps)
     */
    function updateHedgeVault(
        uint256 volatileAllocation,
        uint256 stableAllocation
    ) external {
        HedgeVaultStorage storage s = _getStorage();
        HedgeVault storage vault = s.hedgeVaults[msg.sender];
        require(vault.enabled, "Vault not enabled");
        require(vault.employee == msg.sender, "Not vault owner");

        // Validate that allocations sum to 100%
        require(
            volatileAllocation + stableAllocation == 10000,
            "Invalid allocation"
        );

        vault.volatileAllocation = volatileAllocation;
        vault.stableAllocation = stableAllocation;
        vault.lastRebalance = block.timestamp;

        emit HedgeVaultUpdated(
            msg.sender,
            volatileAllocation,
            stableAllocation
        );
    }

    /**
     * @notice Process payment through hedge vault
     * @param employee Employee address
     * @param token Payment token
     * @param amount Payment amount
     */
    function processPayment(
        address employee,
        address token,
        uint256 amount
    )
        external
        nonReentrant
        returns (uint256 stableReceived, uint256 volatileReceived)
    {
        // Only payroll contracts from the factory should be able to call this
        // Note: Verification logic simplified for testing; for production, additional checks are needed
        HedgeVaultStorage storage s = _getStorage();
        HedgeVault storage vault = s.hedgeVaults[employee];
        require(vault.enabled, "Vault not enabled");
        require(amount > 0, "Amount must be greater than 0");

        emit DepositReceived(employee, token, amount);

        // Calculate allocation amounts
        uint256 stableAmount = (amount * vault.stableAllocation) / 10000;
        uint256 volatileAmount = (amount * vault.volatileAllocation) / 10000;

        // Send stable portion
        if (stableAmount > 0) {
            if (token == vault.stableToken) {
                // Already have stable token, send directly
                IERC20(vault.stableToken).safeTransfer(
                    vault.employee,
                    stableAmount
                );
            } else {
                // Need to swap to stable token
                stableAmount = _swapTokens(
                    token,
                    vault.stableToken,
                    stableAmount,
                    vault.employee
                );
            }
            stableReceived = stableAmount;
        }

        // Send volatile portion
        if (volatileAmount > 0) {
            if (token == vault.volatileToken) {
                // Already have volatile token, send directly
                IERC20(vault.volatileToken).safeTransfer(
                    vault.employee,
                    volatileAmount
                );
            } else {
                // Need to swap to volatile token
                volatileAmount = _swapTokens(
                    token,
                    vault.volatileToken,
                    volatileAmount,
                    vault.employee
                );
            }
            volatileReceived = volatileAmount;
        }

        // Check if rebalancing is needed based on volatility
        _checkAndRebalance(vault);

        return (stableReceived, volatileReceived);
    }

    /**
     * @notice Internal function to swap tokens via DEX
     * @param tokenIn Token to swap from
     * @param tokenOut Token to swap to
     * @param amountIn Amount of tokenIn to swap
     * @param recipient Address to receive swapped tokens
     * @return amountOut Amount of tokenOut received
     */
    function _swapTokens(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        address recipient
    ) internal returns (uint256 amountOut) {
        require(address(swapRouter) != address(0), "Swap router not set");
        require(amountIn > 0, "Amount must be greater than 0");

        // Approve swap router to spend tokens
        IERC20(tokenIn).forceApprove(address(swapRouter), amountIn);

        // Prepare swap parameters
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: POOL_FEE,
                recipient: recipient,
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: 0, // Note: Slippage protection disabled for demo environment
                sqrtPriceLimitX96: 0
            });

        // Execute swap
        amountOut = swapRouter.exactInputSingle(params);

        emit TokenSwapped(tokenIn, tokenOut, amountIn, amountOut, recipient);

        return amountOut;
    }

    /**
     * @notice Manually rebalance vault
     * @param employee Employee address
     */
    function rebalanceVault(address employee) external nonReentrant {
        HedgeVaultStorage storage s = _getStorage();
        HedgeVault storage vault = s.hedgeVaults[employee];
        require(vault.enabled, "Vault not enabled");

        // Check minimum rebalance interval
        require(
            block.timestamp >=
                vault.lastRebalance + s.config.minRebalanceInterval,
            "Rebalance too soon"
        );

        _performRebalance(vault);
    }

    /**
     * @notice Get vault balances
     * @param employee Employee address
     * @return stableBalance Stable token balance
     * @return volatileBalance Volatile token balance
     */
    function getVaultBalance(
        address employee
    ) external view returns (uint256 stableBalance, uint256 volatileBalance) {
        HedgeVaultStorage storage s = _getStorage();
        HedgeVault storage vault = s.hedgeVaults[employee];
        if (!vault.enabled) {
            return (0, 0);
        }

        stableBalance = IERC20(vault.stableToken).balanceOf(address(this));
        volatileBalance = IERC20(vault.volatileToken).balanceOf(address(this));
    }

    /**
     * @notice Get vault configuration
     * @param employee Employee address
     * @return vault Vault struct
     */
    function getVault(
        address employee
    ) external view returns (HedgeVault memory vault) {
        HedgeVaultStorage storage s = _getStorage();
        return s.hedgeVaults[employee];
    }

    /**
     * @notice Toggle hedge vault
     * @param employee Employee address
     * @param enabled Enable status
     */
    function toggleHedgeVault(
        address employee,
        bool enabled
    ) external onlyOwner {
        HedgeVaultStorage storage s = _getStorage();
        HedgeVault storage vault = s.hedgeVaults[employee];
        require(vault.employee != address(0), "Vault not initialized");

        vault.enabled = enabled;
    }

    /**
     * @notice Update system configuration
     */
    function updateConfig(
        uint256 minRebalanceInterval,
        address defaultStableToken,
        uint256 performanceFeeBps,
        address feeRecipient,
        bool systemEnabled
    ) external onlyOwner {
        HedgeVaultStorage storage s = _getStorage();
        s.config.minRebalanceInterval = minRebalanceInterval;
        s.config.defaultStableToken = defaultStableToken;
        s.config.performanceFeeBps = performanceFeeBps;
        s.config.feeRecipient = feeRecipient;
        s.config.systemEnabled = systemEnabled;
    }

    /**
     * @notice Allocate to stable token
     */
    function _allocateStableAmount(
        HedgeVault storage vault,
        address token,
        uint256 amount
    ) internal returns (uint256 allocated) {
        if (amount > 0) {
            // Calculate how much should go to stable allocation
            allocated = (amount * vault.stableAllocation) / 10000;

            // Transfer the allocated stable tokens to the employee
            if (allocated > 0) {
                IERC20(token).safeTransfer(vault.employee, allocated);
            }
        } else {
            allocated = 0;
        }
    }

    /**
     * @notice Allocate to volatile token
     */
    function _allocateVolatileAmount(
        HedgeVault storage vault,
        address token,
        uint256 amount
    ) internal returns (uint256 allocated) {
        if (amount > 0) {
            // Calculate how much should go to volatile allocation
            allocated = (amount * vault.volatileAllocation) / 10000;

            // Transfer the allocated volatile tokens to the employee
            if (allocated > 0) {
                IERC20(token).safeTransfer(vault.employee, allocated);
            }
        } else {
            allocated = 0;
        }
    }

    /**
     * @notice Check and perform rebalance
     */
    function _checkAndRebalance(HedgeVault storage vault) internal {
        // Check if rebalance is needed based on volatility threshold
        if (_shouldRebalance(vault)) {
            _performRebalance(vault);
        }
    }

    /**
     * @notice Check if rebalance is needed
     */
    function _shouldRebalance(
        HedgeVault storage vault
    ) internal view returns (bool) {
        HedgeVaultStorage storage s = _getStorage();

        // Check minimum time since last rebalance
        if (
            block.timestamp <
            vault.lastRebalance + s.config.minRebalanceInterval
        ) {
            return false;
        }

        // Note: MVP implementation skips complex rebalancing checks
        return false;
    }

    /**
     * @notice Perform rebalance
     */
    function _performRebalance(HedgeVault storage vault) internal {
        // Note: Swap logic placeholder for MVP

        vault.lastRebalance = block.timestamp;

        emit VaultRebalanced(vault.employee, 0, 0);
    }

    /**
     * @notice Get allocations by risk level
     */
    function _getAllocationByRiskLevel(
        RiskLevel riskLevel
    ) internal pure returns (uint256 volatileAlloc, uint256 stableAlloc) {
        if (riskLevel == RiskLevel.CONSERVATIVE) {
            return (2000, 8000); // 20% volatile, 80% stable
        } else if (riskLevel == RiskLevel.MODERATE) {
            return (4000, 6000); // 40% volatile, 60% stable
        } else {
            // AGGRESSIVE
            return (6000, 4000); // 60% volatile, 40% stable
        }
    }

    /**
     * @notice Emergency withdrawal
     */
    function emergencyWithdraw(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        IERC20(token).safeTransfer(to, amount);
    }

    // NOTE: Upgradeability commented out for testnet deployment
    // Original function for upgradeable contract:
    /*
    // Upgrade authorization - only owner can upgrade
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        // Only owner can upgrade
    }
    */
}
