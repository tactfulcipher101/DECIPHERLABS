// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// NOTE: Upgradeability disabled for testnet. Using standard Ownable for now.
// import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IDeCipherLabs_PayrollFactory.sol";

interface IHedgeVaultManager {
    function processPayment(
        address employee,
        address token,
        uint256 amount
    ) external returns (uint256 stableReceived, uint256 volatileReceived);
    function getVaultBalance(
        address employee
    ) external view returns (uint256 stableBalance, uint256 volatileBalance);
    function rebalanceVault(address employee) external;
    function initializeHedgeVault(
        address employee,
        address volatileToken,
        address stableToken,
        uint8 riskLevel,
        uint256 volatilityThreshold
    ) external;
}

// Main payroll contract
contract DeCipherLabsPayroll is
    // NOTE: Upgradeability disabled for testnet
    // OwnableUpgradeable, UUPSUpgradeable,
    Ownable,
    ReentrancyGuard
{
    using SafeERC20 for IERC20;

    enum PayTokenType {
        NATIVE,
        ERC20
    }
    enum Frequency {
        WEEKLY, // Production: Pay every 7 days
        BIWEEKLY, // Production: Pay every 14 days
        MONTHLY, // Production: Pay every 30 days
        HOURLY, // Production: Pay every hour (for contractors)
        MINUTELY, // Testing only: Used for rapid testing cycles
        CUSTOM // Production: Custom interval in seconds
    }
    enum RiskLevel {
        CONSERVATIVE,
        MODERATE,
        AGGRESSIVE
    }

    // Volatility hedge configuration
    struct HedgeConfig {
        bool enabled;
        RiskLevel riskLevel;
        uint256 volatilityThreshold; // basis points
        uint256 volatileAllocation; // basis points
        uint256 stableAllocation; // basis points
    }

    struct Employee {
        address wallet;
        PayTokenType tokenType;
        address tokenAddress;
        uint256 salaryPerPeriod;
        Frequency frequency;
        uint64 customFrequency;
        uint64 nextPayTimestamp;
        uint16 taxBps;
        bool active;
        uint256 owed;
        HedgeConfig hedgeConfig; // Phase 1 MVP feature
        bool advanceAuthorized; // Whether this employee can request advances
    }

    // Payment tracking
    struct PaymentRecord {
        uint256 timestamp;
        uint256 amount;
        address token;
        bool isBonus;
        string memo;
    }

    // EIP-7201 Namespaced Storage Layout
    bytes32 private constant STORAGE_SLOT =
        keccak256("decipherlabs.payroll.storage");

    struct PayrollStorage {
        // Factory reference
        IDeCipherLabs_PayrollFactory factory;
        // Core state variables
        address companyOwner;
        address admin;
        bool paused;
        uint256 maxEmployeesPerBatch;
        bool taxEnabled;
        address taxRecipient;
        uint256 totalPaymentsMade;
        uint256 totalAmountPaid;
        // Mappings
        mapping(address => Employee) employees;
        mapping(address => bool) isAdmins;
        mapping(address => PaymentRecord[]) paymentHistory;
        mapping(address => mapping(uint256 => uint256)) advancesTaken; // employee -> period -> amount
        address[] employeeList;
    }
    // NOTE: Upgradeability gap disabled for testnet
    // uint256[42] __gap;

    // NOTE: Upgradeability disabled for testnet
    /*
    constructor() {
        _disableInitializers();
    }
    */
    constructor() Ownable(msg.sender) {
        // Owner set in constructor for testnet
    }

    function _getStorage() private pure returns (PayrollStorage storage s) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            s.slot := slot
        }
    }

    function getEmployee(
        address _employee
    )
        external
        view
        returns (
            address wallet,
            uint8 tokenType,
            address tokenAddress,
            uint256 salaryPerPeriod,
            uint8 frequency,
            uint64 customFrequency,
            uint64 nextPayTimestamp,
            uint16 taxBps,
            bool active,
            uint256 owed
        )
    {
        PayrollStorage storage s = _getStorage();
        Employee storage emp = s.employees[_employee];
        return (
            emp.wallet,
            uint8(emp.tokenType),
            emp.tokenAddress,
            emp.salaryPerPeriod,
            uint8(emp.frequency),
            emp.customFrequency,
            emp.nextPayTimestamp,
            emp.taxBps,
            emp.active,
            emp.owed
        );
    }

    function getEmployeeList() external view returns (address[] memory) {
        PayrollStorage storage s = _getStorage();
        return s.employeeList;
    }

    event AdminAdded(address indexed who);
    event AdminRemoved(address indexed who);
    event TaxToggled(bool enabled);
    event TaxRecipientUpdated(address previous, address recipient);
    event PaymentSkipped(
        address indexed wallet,
        uint256 timestamp,
        string reason
    );
    event EmergencyWithdraw(address indexed to, address token, uint256 amount);
    event BonusPaid(
        address indexed to,
        address token,
        uint256 amount,
        string memo
    );
    event PaymentProcessed(
        address indexed employee,
        uint256 amount,
        address token
    );
    event EmployeeAdded(
        address indexed employee,
        uint256 salary,
        address token
    );
    event EmployeeRemoved(address indexed employee);
    event EmployeeReactivated(address indexed employee);
    event HedgeVaultConfigured(
        address indexed employee,
        RiskLevel riskLevel,
        uint256 volatilityThreshold
    );
    event ServiceFeePaid(
        address indexed treasury,
        uint256 amount,
        address token
    );

    modifier onlyAdmin() {
        PayrollStorage storage s = _getStorage();
        require(s.isAdmins[msg.sender] || owner() == msg.sender, "not-admin");
        _;
    }

    modifier whenNotPaused() {
        PayrollStorage storage s = _getStorage();
        require(!s.paused, "paused");
        _;
    }

    // NOTE: Upgradeability disabled for testnet
    /*
    function initialize(
        address _companyOwner,
        address _taxRecipient,
        address _factory
    ) external initializer {
        require(_factory != address(0), "factory-zero");

        __Ownable_init(msg.sender);
        // UUPSUpgradeable has no initializer.

        transferOwnership(_companyOwner);

        PayrollStorage storage s = _getStorage();
        s.factory = IDeCipherLabs_PayrollFactory(_factory);

        s.companyOwner = _companyOwner;
        s.taxRecipient = _taxRecipient;
        s.admin = _companyOwner;
        s.maxEmployeesPerBatch = 50;
    }
    */

    function initialize(
        address _companyOwner,
        address _taxRecipient,
        address _factory
    ) external {
        require(_factory != address(0), "factory-zero");
        // Prevent re-initialization by checking if already initialized
        require(
            owner() == address(0) || owner() == msg.sender,
            "Already initialized or not owner"
        );

        // Set owner to provided company owner (transfer ownership)
        transferOwnership(_companyOwner);

        // Initialize storage
        PayrollStorage storage s = _getStorage();
        s.factory = IDeCipherLabs_PayrollFactory(_factory);

        s.companyOwner = _companyOwner;
        s.taxRecipient = _taxRecipient;
        s.admin = _companyOwner;
        s.maxEmployeesPerBatch = 50;
    }

    /* ========== ADMIN FUNCTIONS ========== */

    function addAdmin(address who) external onlyOwner {
        require(who != address(0), "zero");
        PayrollStorage storage s = _getStorage();
        s.isAdmins[who] = true;
        emit AdminAdded(who);
    }

    function removeAdmin(address who) external onlyOwner {
        PayrollStorage storage s = _getStorage();
        s.isAdmins[who] = false;
        emit AdminRemoved(who);
    }

    function toggleTax(bool enabled) external onlyAdmin {
        PayrollStorage storage s = _getStorage();
        s.taxEnabled = enabled;
        emit TaxToggled(enabled);
    }

    function setTaxRecipient(address recipient) external onlyAdmin {
        require(recipient != address(0), "invalid recipient");
        PayrollStorage storage s = _getStorage();
        address previous = s.taxRecipient;
        s.taxRecipient = recipient;
        emit TaxRecipientUpdated(previous, recipient);
    }

    function setMaxEmployeesPerBatch(uint256 n) external onlyOwner {
        PayrollStorage storage s = _getStorage();
        s.maxEmployeesPerBatch = n;
    }

    function emergencyWithdraw(
        address token,
        uint256 amount
    ) external onlyOwner {
        PayrollStorage storage s = _getStorage();
        if (token == address(0)) {
            (bool success, ) = payable(msg.sender).call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(token).safeTransfer(msg.sender, amount);
        }
        emit EmergencyWithdraw(msg.sender, token, amount);
    }

    /**
     * @notice Fund contract with ETH
     * @dev Deducts 1% service fee
     */
    function fundWithETH() external payable onlyOwner {
        require(msg.value > 0, "Must send ETH");

        PayrollStorage storage s = _getStorage();
        uint16 feeBps = s.factory.decipherlabsFeeBps();
        address treasury = s.factory.decipherlabsTreasury();

        // Calculate fee from total sent
        // If user sends 1010, fee = 10, remaining = 1000
        uint256 feeAmount = (msg.value * feeBps) / (10000 + feeBps);
        uint256 remainingAmount = msg.value - feeAmount;

        // Send fee to treasury
        if (feeAmount > 0 && treasury != address(0)) {
            (bool sent, ) = payable(treasury).call{value: feeAmount}("");
            require(sent, "Failed to send service fee");
            emit ServiceFeePaid(treasury, feeAmount, address(0));
        }

        // Remaining ETH stays in contract for payroll
        // Event emitted for tracking
    }

    /**
     * @notice Fund contract with ERC20 tokens
     * @dev Deducts 1% service fee
     * @param token ERC20 token address
     * @param amount Total amount including fee
     */
    function fundWithERC20(address token, uint256 amount) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(amount > 0, "Amount must be greater than 0");

        PayrollStorage storage s = _getStorage();
        uint16 feeBps = s.factory.decipherlabsFeeBps();
        address treasury = s.factory.decipherlabsTreasury();

        // Calculate fee from total sent
        // If user sends 1010, fee = 10, remaining = 1000
        uint256 feeAmount = (amount * feeBps) / (10000 + feeBps);
        uint256 remainingAmount = amount - feeAmount;

        // Transfer total amount from sender to this contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // Send fee to treasury
        if (feeAmount > 0 && treasury != address(0)) {
            IERC20(token).safeTransfer(treasury, feeAmount);
            emit ServiceFeePaid(treasury, feeAmount, token);
        }

        // Remaining tokens stay in contract for payroll
    }

    /**
     * @notice Pay a bonus to an employee
     */
    function payBonus(
        address employee,
        uint256 amount,
        string memory memo
    ) external onlyAdmin whenNotPaused {
        PayrollStorage storage s = _getStorage();
        Employee storage emp = s.employees[employee];
        require(emp.active, "not-active");

        if (emp.tokenType == PayTokenType.NATIVE) {
            (bool sent, ) = payable(emp.wallet).call{value: amount}("");
            require(sent, "Failed to send Ether");
        } else {
            IERC20(emp.tokenAddress).safeTransfer(emp.wallet, amount);
        }

        s.paymentHistory[employee].push(
            PaymentRecord({
                timestamp: block.timestamp,
                amount: amount,
                token: emp.tokenAddress,
                isBonus: true,
                memo: memo
            })
        );

        emit BonusPaid(emp.wallet, emp.tokenAddress, amount, memo);
    }

    /**
     * @notice Add a new employee
     * @param wallet Employee wallet address
     * @param tokenAddress Payment token address (zero for native)
     * @param salaryPerPeriod Salary per period
     * @param frequency Payment frequency
     * @param customFrequency Custom frequency in seconds
     * @param taxBps Tax in basis points
     */
    function addEmployee(
        address wallet,
        address tokenAddress,
        uint256 salaryPerPeriod,
        Frequency frequency,
        uint64 customFrequency,
        uint16 taxBps
    ) external onlyOwner {
        require(wallet != address(0), "invalid wallet");
        PayrollStorage storage s = _getStorage();
        require(s.employees[wallet].wallet == address(0), "employee exists");

        // Create employee record
        Employee storage emp = s.employees[wallet];
        emp.wallet = wallet;
        emp.tokenType = tokenAddress == address(0)
            ? PayTokenType.NATIVE
            : PayTokenType.ERC20;
        emp.tokenAddress = tokenAddress;
        emp.salaryPerPeriod = salaryPerPeriod;
        emp.frequency = frequency;
        emp.customFrequency = customFrequency;
        emp.taxBps = taxBps;
        emp.active = true;
        emp.nextPayTimestamp = uint64(
            block.timestamp + _getPeriodDuration(frequency, customFrequency)
        );

        emp.advanceAuthorized = false; // Default to not authorized
        s.employeeList.push(wallet);
        emit EmployeeAdded(wallet, salaryPerPeriod, tokenAddress);
    }

    /**
     * @notice Remove an employee (set inactive)
     * @param wallet Employee wallet address
     */
    function removeEmployee(address wallet) external onlyOwner {
        PayrollStorage storage s = _getStorage();
        Employee storage emp = s.employees[wallet];
        require(emp.active, "employee not active");
        emp.active = false;
        emit EmployeeRemoved(wallet);
    }

    /**
     * @notice Permanently delete an employee
     * @param wallet Employee wallet address
     */
    function deleteEmployeePermanently(address wallet) external onlyOwner {
        PayrollStorage storage s = _getStorage();
        Employee storage emp = s.employees[wallet];
        require(emp.wallet != address(0), "employee does not exist");

        // Remove from employee list array
        for (uint256 i = 0; i < s.employeeList.length; i++) {
            if (s.employeeList[i] == wallet) {
                // Move the last element to this position and pop
                s.employeeList[i] = s.employeeList[s.employeeList.length - 1];
                s.employeeList.pop();
                break;
            }
        }

        // Delete employee data
        delete s.employees[wallet];

        emit EmployeeRemoved(wallet);
    }

    /**
     * @notice Process payment for an employee
     * @param employee Employee wallet address
     */
    function processPayment(address employee) external nonReentrant {
        PayrollStorage storage s = _getStorage();
        Employee storage emp = s.employees[employee];
        require(emp.active, "employee not active");
        require(block.timestamp >= emp.nextPayTimestamp, "not due");
        // Ensure this function doesn't accidentally process payments through hedge vault
        require(
            !emp.hedgeConfig.enabled,
            "use processPaymentWithHedge for hedge vault employees"
        );

        uint256 taxAmount = (emp.salaryPerPeriod * emp.taxBps) / 10000;
        uint256 netAmount = emp.salaryPerPeriod - taxAmount;

        // Handle salary advances - deduct any owed amount from this payment
        uint256 currentPeriod = block.timestamp /
            _getPeriodDuration(emp.frequency, emp.customFrequency);

        uint256 advanceToDeduct = s.advancesTaken[employee][currentPeriod];
        uint256 amountToSend = netAmount;

        // Only deduct advances if there was an advance taken this period
        if (advanceToDeduct > 0 && emp.owed > 0) {
            uint256 deduction = advanceToDeduct;
            if (deduction > emp.owed) {
                deduction = emp.owed; // Don't deduct more than owed
            }
            if (deduction > netAmount) {
                deduction = netAmount; // Don't deduct more than payment
            }

            amountToSend = netAmount - deduction;
            s.advancesTaken[employee][currentPeriod] -= deduction;
            emp.owed -= deduction;
        }

        // Update payment record and internal state first (effects before interactions)
        s.paymentHistory[employee].push(
            PaymentRecord({
                timestamp: block.timestamp,
                amount: amountToSend,
                token: emp.tokenAddress,
                isBonus: false,
                memo: "Regular payment"
            })
        );

        s.totalPaymentsMade++;
        s.totalAmountPaid += netAmount;

        // Update next payment timestamp
        emp.nextPayTimestamp = uint64(
            block.timestamp +
                _getPeriodDuration(emp.frequency, emp.customFrequency)
        );

        // Process external transfers (interactions after effects)
        if (emp.tokenType == PayTokenType.NATIVE) {
            (bool sent, ) = payable(emp.wallet).call{value: amountToSend}("");
            require(sent, "Failed to send Ether");
        } else {
            IERC20(emp.tokenAddress).safeTransfer(emp.wallet, amountToSend);
        }

        // Handle tax withholding
        if (s.taxEnabled && s.taxRecipient != address(0)) {
            if (emp.tokenType == PayTokenType.NATIVE) {
                (bool sent, ) = payable(s.taxRecipient).call{value: taxAmount}(
                    ""
                );
                require(sent, "Failed to send tax");
            } else {
                IERC20(emp.tokenAddress).safeTransfer(
                    s.taxRecipient,
                    taxAmount
                );
            }
        }

        emit PaymentProcessed(employee, amountToSend, emp.tokenAddress);
    }

    /**
     * @notice Configure hedge vault settings
     */
    function configureHedgeVault(
        address employee,
        RiskLevel riskLevel,
        uint256 volatilityThreshold,
        address volatileToken,
        address stableToken
    ) external onlyAdmin {
        PayrollStorage storage s = _getStorage();
        Employee storage emp = s.employees[employee];
        require(emp.active, "employee not active");

        // Enable hedge vault and save their risk preferences
        emp.hedgeConfig.enabled = true;
        emp.hedgeConfig.riskLevel = riskLevel;
        emp.hedgeConfig.volatilityThreshold = volatilityThreshold;

        // Split salary between volatile and stable tokens
        if (riskLevel == RiskLevel.CONSERVATIVE) {
            emp.hedgeConfig.volatileAllocation = 2000; // 20% volatile
            emp.hedgeConfig.stableAllocation = 8000; // 80% stable
        } else if (riskLevel == RiskLevel.MODERATE) {
            emp.hedgeConfig.volatileAllocation = 4000; // 40% volatile
            emp.hedgeConfig.stableAllocation = 6000; // 60% stable
        } else {
            // AGGRESSIVE
            emp.hedgeConfig.volatileAllocation = 6000; // 60% volatile
            emp.hedgeConfig.stableAllocation = 4000; // 40% stable
        }

        // Initialize the vault in the HedgeVaultManager
        address hedgeVaultManagerAddr = s.factory.hedgeVaultManager();
        require(
            hedgeVaultManagerAddr != address(0),
            "hedge vault manager not set"
        );

        IHedgeVaultManager hedgeVault = IHedgeVaultManager(
            hedgeVaultManagerAddr
        );

        // Initialize with explicit token addresses
        hedgeVault.initializeHedgeVault(
            employee,
            volatileToken,
            stableToken,
            uint8(riskLevel), // risk level enum cast to uint8
            volatilityThreshold
        );
        emit HedgeVaultConfigured(employee, riskLevel, volatilityThreshold);
    }

    /**
     * @notice Enable/disable hedge vault
     * @param employee Employee wallet address
     * @param enabled Enable status
     */
    function toggleHedgeVault(
        address employee,
        bool enabled
    ) external onlyAdmin {
        PayrollStorage storage s = _getStorage();
        Employee storage emp = s.employees[employee];
        require(emp.active, "employee not active");

        emp.hedgeConfig.enabled = enabled;
    }

    /**
     * @notice Update hedge vault settings
     * @param riskLevel Risk preference
     * @param volatilityThreshold Rebalance threshold (bps)
     */
    function updateHedgeVaultConfig(
        RiskLevel riskLevel,
        uint256 volatilityThreshold
    ) external {
        PayrollStorage storage s = _getStorage();
        Employee storage emp = s.employees[msg.sender];
        require(emp.active, "employee not active");
        require(emp.hedgeConfig.enabled, "hedge vault not enabled");

        emp.hedgeConfig.riskLevel = riskLevel;
        emp.hedgeConfig.volatilityThreshold = volatilityThreshold;

        // Adjust portfolio split
        if (riskLevel == RiskLevel.CONSERVATIVE) {
            emp.hedgeConfig.volatileAllocation = 2000; // 20% volatile
            emp.hedgeConfig.stableAllocation = 8000; // 80% stable
        } else if (riskLevel == RiskLevel.MODERATE) {
            emp.hedgeConfig.volatileAllocation = 4000; // 40% volatile
            emp.hedgeConfig.stableAllocation = 6000; // 60% stable
        } else {
            // AGGRESSIVE
            emp.hedgeConfig.volatileAllocation = 6000; // 60% volatile
            emp.hedgeConfig.stableAllocation = 4000; // 40% stable
        }

        emit HedgeVaultConfigured(msg.sender, riskLevel, volatilityThreshold);
    }

    /**
     * @notice Reactivate an inactive employee
     * @param employee Employee wallet address
     */
    function reactivateEmployee(address employee) external onlyOwner {
        PayrollStorage storage s = _getStorage();
        Employee storage emp = s.employees[employee];
        require(!emp.active, "employee already active");

        emp.active = true;
        emit EmployeeReactivated(employee);
    }

    /**
     * @notice Process payment immediately (bypass due date)
     * @param employee Employee wallet address
     */
    function forceProcessPayment(
        address employee
    ) external onlyAdmin nonReentrant {
        // Use the internal function with isForced = true to bypass time checks
        _processPaymentInternal(employee, true); // true = forced payment
    }

    /**
     * @notice Process payment through hedge vault
     * @param employee Employee wallet address
     */
    function processPaymentWithHedge(
        address employee
    ) external onlyAdmin nonReentrant {
        PayrollStorage storage s = _getStorage();
        Employee storage emp = s.employees[employee];
        require(emp.active, "employee not active");
        require(block.timestamp >= emp.nextPayTimestamp, "not due");

        _processPaymentInternal(employee, false); // false = not forced
    }

    /**
     * @notice Get payment period duration
     */
    function _getPeriodDuration(
        Frequency frequency,
        uint64 customFrequency
    ) private pure returns (uint256) {
        return
            frequency == Frequency.CUSTOM
                ? customFrequency
                : frequency == Frequency.WEEKLY
                    ? 1 weeks
                    : frequency == Frequency.BIWEEKLY
                        ? 2 weeks
                        : frequency == Frequency.HOURLY
                            ? 1 hours
                            : frequency == Frequency.MINUTELY
                                ? 1 minutes
                                : 30 days; // Default to monthly if invalid
    }

    /**
     * @notice Internal payment processing logic
     */
    function _processPaymentInternal(address employee, bool isForced) internal {
        PayrollStorage storage s = _getStorage();
        Employee storage emp = s.employees[employee];
        require(emp.active, "employee not active");

        // Only check timing if this is NOT a forced payment
        if (!isForced) {
            require(block.timestamp >= emp.nextPayTimestamp, "not due");
        }

        uint256 taxAmount = (emp.salaryPerPeriod * emp.taxBps) / 10000;
        uint256 netAmount = emp.salaryPerPeriod - taxAmount;

        // Handle salary advances - deduct any owed amount from this payment
        uint256 currentPeriod = block.timestamp /
            _getPeriodDuration(emp.frequency, emp.customFrequency);

        uint256 advanceToDeduct = s.advancesTaken[employee][currentPeriod];
        uint256 amountToSend = netAmount;

        // Only deduct advances if there was an advance taken this period
        if (advanceToDeduct > 0 && emp.owed > 0) {
            uint256 deduction = advanceToDeduct;
            if (deduction > emp.owed) {
                deduction = emp.owed; // Don't deduct more than owed
            }
            if (deduction > netAmount) {
                deduction = netAmount; // Don't deduct more than payment
            }

            amountToSend = netAmount - deduction;
            s.advancesTaken[employee][currentPeriod] -= deduction;
            emp.owed -= deduction;
        }

        // Update payment record and internal state first (effects before interactions)
        s.paymentHistory[employee].push(
            PaymentRecord({
                timestamp: block.timestamp,
                amount: amountToSend,
                token: emp.tokenAddress,
                isBonus: false,
                memo: isForced
                    ? "Forced hedge vault payment"
                    : "Hedge vault payment"
            })
        );

        s.totalPaymentsMade++;
        s.totalAmountPaid += netAmount;

        // Only update next payment timestamp if this is NOT a forced payment
        // For forced payments, keep the original schedule intact
        if (!isForced) {
            emp.nextPayTimestamp = uint64(
                block.timestamp +
                    _getPeriodDuration(emp.frequency, emp.customFrequency)
            );
        }

        // Process external transfers (interactions after effects)
        if (emp.hedgeConfig.enabled) {
            // Route payment through HedgeVaultManager for proper allocation
            address hedgeVaultManagerAddr = s.factory.hedgeVaultManager();
            require(
                hedgeVaultManagerAddr != address(0),
                "hedge vault manager not set"
            );

            IHedgeVaultManager hedgeVault = IHedgeVaultManager(
                hedgeVaultManagerAddr
            );

            // Transfer the amount to be processed to the hedge vault manager
            if (emp.tokenType == PayTokenType.ERC20) {
                IERC20(emp.tokenAddress).safeTransfer(
                    hedgeVaultManagerAddr,
                    amountToSend
                );
            } else {
                // For native tokens, we need to handle differently since the hedge vault
                // might need to use the payment as a funding mechanism
                // For now, we'll process directly with the hedge vault
                (bool sent, ) = payable(hedgeVaultManagerAddr).call{
                    value: amountToSend
                }("");
                require(sent, "Failed to send to hedge vault manager");
            }

            // Process payment through hedge vault which will allocate between stable/volatile
            (uint256 stableReceived, uint256 volatileReceived) = hedgeVault
                .processPayment(employee, emp.tokenAddress, amountToSend);

            // Emit event to track where funds went
            // The hedge vault will manage the distribution according to employee's preferences

            // Tax handling for hedge vault payments
            if (s.taxEnabled && s.taxRecipient != address(0)) {
                // For simplicity, tax is still handled separately from hedge vault management
                if (emp.tokenType == PayTokenType.NATIVE) {
                    (bool sent, ) = payable(s.taxRecipient).call{
                        value: taxAmount
                    }("");
                    require(sent, "Failed to send tax");
                } else {
                    IERC20(emp.tokenAddress).safeTransfer(
                        s.taxRecipient,
                        taxAmount
                    );
                }
            }
        } else {
            // Process normal payment if hedge vault is not enabled
            if (emp.tokenType == PayTokenType.NATIVE) {
                (bool sent, ) = payable(emp.wallet).call{value: amountToSend}(
                    ""
                );
                require(sent, "Failed to send Ether");
            } else {
                IERC20(emp.tokenAddress).safeTransfer(emp.wallet, amountToSend);
            }

            // Handle tax withholding (applied to the original net amount, not post-advance)
            if (s.taxEnabled && s.taxRecipient != address(0)) {
                if (emp.tokenType == PayTokenType.NATIVE) {
                    (bool sent, ) = payable(s.taxRecipient).call{
                        value: taxAmount
                    }("");
                    require(sent, "Failed to send tax");
                } else {
                    IERC20(emp.tokenAddress).safeTransfer(
                        s.taxRecipient,
                        taxAmount
                    );
                }
            }
        }

        emit PaymentProcessed(employee, amountToSend, emp.tokenAddress);
    }

    /**
     * @notice Toggle advance authorization for an employee (admin function)
     * @param employee The employee's address
     * @param authorized Whether to authorize advances for this employee
     */
    function setAdvanceAuthorization(
        address employee,
        bool authorized
    ) external onlyAdmin {
        PayrollStorage storage s = _getStorage();
        Employee storage emp = s.employees[employee];
        require(emp.active, "employee not active");

        emp.advanceAuthorized = authorized;
    }

    /**
     * @notice Request a salary advance (Phase 1 MVP feature)
     * @param amount Amount requested
     */
    function requestAdvance(uint256 amount) external {
        PayrollStorage storage s = _getStorage();
        Employee storage emp = s.employees[msg.sender];
        require(emp.active, "employee not active");
        require(emp.advanceAuthorized, "advance not authorized for employee");

        uint256 currentPeriod = block.timestamp /
            _getPeriodDuration(emp.frequency, emp.customFrequency);

        uint256 maxAdvance = (emp.salaryPerPeriod * 5000) / 10000; // Max 50% of salary advance
        require(amount > 0, "advance must be greater than 0");
        require(amount <= maxAdvance, "advance too large");
        require(
            s.advancesTaken[msg.sender][currentPeriod] + amount <= maxAdvance,
            "advance limit reached"
        );
        require(
            emp.owed + amount <= maxAdvance,
            "total owed exceeds advance limit"
        );

        // Record the advance - future salary payments will automatically deduct this
        s.advancesTaken[msg.sender][currentPeriod] += amount;
        emp.owed += amount;

        if (emp.tokenType == PayTokenType.NATIVE) {
            (bool sent, ) = payable(msg.sender).call{value: amount}("");
            require(sent, "Failed to send Ether");
        } else {
            IERC20(emp.tokenAddress).safeTransfer(msg.sender, amount);
        }
    }

    // NOTE: Upgradeability commented out for testnet deployment
    // Original function for upgradeable contract:
    /*
    // Upgrade authorization - only owner can upgrade
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        // Only owner can upgrade
    }
    */

    // Receive ETH with automatic fee deduction
    // This prevents fee bypass by charging on ALL incoming ETH
    receive() external payable {
        PayrollStorage storage s = _getStorage();
        address hedgeVaultManagerAddr = s.factory.hedgeVaultManager();

        // Don't charge fee if it's the HedgeVaultManager returning funds
        if (msg.sender == hedgeVaultManagerAddr) {
            return; // Accept without fee
        }

        // Charge fee on all other incoming ETH (prevents burner wallet bypass)
        uint16 feeBps = s.factory.decipherlabsFeeBps();
        address treasury = s.factory.decipherlabsTreasury();

        // Calculate and send fee
        uint256 feeAmount = (msg.value * feeBps) / (10000 + feeBps);
        uint256 remainingAmount = msg.value - feeAmount;

        if (feeAmount > 0 && treasury != address(0)) {
            (bool sent, ) = payable(treasury).call{value: feeAmount}("");
            require(sent, "Failed to send service fee");
            emit ServiceFeePaid(treasury, feeAmount, address(0));
        }

        // Emit event to track remaining funds added to contract
        emit PaymentProcessed(address(0), remainingAmount, address(0)); // Using 0x0 as employee for funding events
    }

    // Fallback function - also charge fee on all incoming ETH
    fallback() external payable {
        PayrollStorage storage s = _getStorage();
        address hedgeVaultManagerAddr = s.factory.hedgeVaultManager();

        // Don't charge fee if it's the HedgeVaultManager
        if (msg.sender == hedgeVaultManagerAddr) {
            return;
        }

        uint16 feeBps = s.factory.decipherlabsFeeBps();
        address treasury = s.factory.decipherlabsTreasury();

        uint256 feeAmount = (msg.value * feeBps) / (10000 + feeBps);

        if (feeAmount > 0 && treasury != address(0)) {
            (bool sent, ) = payable(treasury).call{value: feeAmount}("");
            require(sent, "Failed to send service fee");
            emit ServiceFeePaid(treasury, feeAmount, address(0));
        }
    }
}
