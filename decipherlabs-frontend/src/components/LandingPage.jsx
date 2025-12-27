import React, { useState, useEffect } from 'react';
import { Rocket, Shield, Zap, Users, ChevronRight, Github, Twitter, Menu, X } from 'lucide-react';

const DeCipherLabsLanding = (props) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isFactoryOwner, setIsFactoryOwner] = useState(false);

  const onNavigate = props.onNavigate;
  const account = props.account;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if connected account is factory owner
  useEffect(() => {
    const checkFactoryOwner = async () => {
      if (!account || !window.ethereum) {
        setIsFactoryOwner(false);
        return;
      }

      try {
        const { ethers } = await import('ethers');
        const { FACTORY_ADDRESS } = await import('../utils/web3');
        const PayrollFactoryABI = (await import('../contracts/PayrollFactory.json')).default;

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const factoryContract = new ethers.Contract(FACTORY_ADDRESS, PayrollFactoryABI, provider);
        const owner = await factoryContract.owner();

        setIsFactoryOwner(owner.toLowerCase() === account.toLowerCase());
      } catch (err) {
        console.error('Error checking factory owner:', err);
        setIsFactoryOwner(false);
      }
    };

    checkFactoryOwner();
  }, [account]);

  const handleLaunchPayroll = (e) => {
    if (e) e.preventDefault();
    console.log('Navigating to payroll dashboard');
    if (typeof onNavigate !== 'function') {
      console.error('onNavigate is not a function:', onNavigate);
      return;
    }
    onNavigate('payroll');
  };

  const protocols = [
    {
      name: 'DeCipherLabs Payroll',
      description: 'Intelligent on-chain payroll with integrated volatility hedging. Protect your team\'s purchasing power with automatic risk management for standard liquid assets.',
      status: 'Live',
      icon: Users,
      gradient: 'bg-blue-600'
    },
    {
      name: 'Treasury Automation',
      description: 'Smart contract-based treasury and accounting management for efficient fund tracking.',
      status: 'Coming Soon',
      icon: Zap,
      gradient: 'bg-slate-700'
    },
    {
      name: 'Security Auditing Suite',
      description: 'Blockchain security and code auditing infrastructure to ensure protocol safety.',
      status: 'Coming Soon',
      icon: Shield,
      gradient: 'bg-indigo-600'
    }
  ];

  const features = [
    {
      icon: Zap,
      title: 'Volatility Hedge',
      description: 'Integrated Hedge Vaults protect employee salaries from market crashes by automatically rebalancing into stable assets.'
    },
    {
      icon: Shield,
      title: 'Purchase Protection',
      description: 'Ensure your workers receive the full value of their work, regardless of cryptomarket volatility.'
    },
    {
      icon: Users,
      title: 'Smart Disbursements',
      description: 'Pay in standard liquid ERC-20 tokens with automatic routing to minimize risk and avoid devaluation.'
    },
    {
      icon: Rocket,
      title: 'Wealth Infrastructure',
      description: 'Direct peer-to-peer infrastructure that bypasses legacy banking and protects organizational wealth.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-slate-900/95 backdrop-blur-lg border-b border-slate-800' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-2xl flex items-center justify-center">
                <Rocket className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white">
                DeCipherLabs
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#ecosystem" onClick={(e) => { e.preventDefault(); document.getElementById('ecosystem')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-blue-400 transition-colors">Ecosystem</a>
              <a href="#features" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-blue-400 transition-colors">Features</a>
              <a href="#about" onClick={(e) => { e.preventDefault(); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-blue-400 transition-colors">About</a>
              <button onClick={() => onNavigate('docs')} className="hover:text-blue-400 transition-colors">Documentation</button>
              <button onClick={() => onNavigate('faucet')} className="px-4 py-2 bg-emerald-600/20 border border-emerald-600/50 rounded-2xl hover:bg-emerald-600/30 transition-colors text-emerald-400 font-medium">
                Get Test Tokens
              </button>

              {account ? (
                <div className="flex items-center space-x-4">
                  <div className="px-3 py-1.5 bg-slate-800/50 rounded-2xl border border-slate-700">
                    <span className="text-xs text-slate-400">Connected: </span>
                    <span className="text-sm text-white font-mono">{account.slice(0, 6)}...{account.slice(-4)}</span>
                  </div>
                  <button
                    onClick={handleLaunchPayroll}
                    className="px-6 py-2 bg-blue-600 rounded-2xl hover:bg-blue-500 transition-all flex items-center space-x-2"
                  >
                    <span>Launch App</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={async () => {
                    if (window.ethereum) {
                      try {
                        await window.ethereum.request({ method: 'eth_requestAccounts' });
                        window.location.reload();
                      } catch (err) {
                        console.error('Failed to connect wallet:', err);
                      }
                    } else {
                      alert('Please install MetaMask!');
                    }
                  }}
                  className="px-6 py-2 bg-blue-600 rounded-2xl hover:bg-blue-500 transition-all flex items-center space-x-2"
                >
                  <span>Connect Wallet</span>
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900/95 backdrop-blur-lg border-t border-slate-800">
            <div className="px-4 py-4 space-y-4">
              <a href="#ecosystem" onClick={(e) => { e.preventDefault(); document.getElementById('ecosystem')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }} className="block hover:text-blue-400 transition-colors">Ecosystem</a>
              <a href="#features" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }} className="block hover:text-blue-400 transition-colors">Features</a>
              <a href="#about" onClick={(e) => { e.preventDefault(); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }} className="block hover:text-blue-400 transition-colors">About</a>
              <button onClick={handleLaunchPayroll} className="w-full px-6 py-2 bg-blue-600 rounded-2xl hover:bg-blue-500 transition-colors flex items-center justify-center space-x-2">
                <span>Launch App</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block mb-4 px-4 py-2 bg-slate-800 border border-slate-700 rounded-full text-sm text-slate-300">
            Payroll infrastructure for Web3 teams
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white leading-tight">
            Protect Your
            <br />
            Team's Wealth
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
            The first payroll infrastructure designed to hedge against crypto volatility, ensuring your team's salary value is always protected and never devalued.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleLaunchPayroll}
              className="px-8 py-4 bg-blue-600 rounded-full hover:bg-blue-500 transition-all flex items-center space-x-2 text-lg font-semibold shadow-lg shadow-blue-500/20"
            >
              <span>Secure Your Payroll</span>
              <ChevronRight className="w-5 h-5" />
            </button>
            <a
              href="#ecosystem"
              onClick={(e) => { e.preventDefault(); document.getElementById('ecosystem')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="px-8 py-4 border-2 border-slate-700 rounded-full hover:bg-slate-800 transition-all flex items-center space-x-2 text-lg"
            >
              <span>Explore Ecosystem</span>
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-4xl mx-auto">
            <div className="p-6 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-3xl">
              <div className="text-4xl font-bold text-white mb-2">100%</div>
              <div className="text-slate-400">Salary Value Hedge</div>
            </div>
            <div className="p-6 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-3xl">
              <div className="text-4xl font-bold text-white mb-2">Stable</div>
              <div className="text-slate-400">Purchasing Power</div>
            </div>
            <div className="p-6 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-3xl">
              <div className="text-4xl font-bold text-white mb-2">Real-Time</div>
              <div className="text-slate-400">Volatility Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem Section */}
      <section id="ecosystem" className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              DeCipherLabs Ecosystem
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              A suite of interoperable protocols designed to automate organizational finance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {protocols.map((protocol, index) => (
              <div
                key={index}
                className="group relative p-8 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl hover:border-slate-700 transition-all duration-300"
              >
                <div className={`absolute inset-0 ${protocol.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity`}></div>

                <div className="relative">
                  <div className={`w-16 h-16 ${protocol.gradient} rounded-3xl flex items-center justify-center mb-6`}>
                    <protocol.icon className="w-8 h-8" />
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold">{protocol.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${protocol.status === 'Live'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                      : 'bg-slate-700/50 text-slate-400 border border-slate-600/50'
                      }`}>
                      {protocol.status}
                    </span>
                  </div>

                  <p className="text-slate-400 mb-6">{protocol.description}</p>

                  {protocol.status === 'Live' ? (
                    <button
                      onClick={handleLaunchPayroll}
                      className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <span>Launch App</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="inline-flex items-center space-x-2 text-slate-500">
                      <span>Coming Soon</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-20 px-4 sm:px-6 lg:px-8 bg-slate-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              Why DeCipherLabs?
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Built for Web3 organizations, DAOs, and forward-thinking companies
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-slate-900/30 backdrop-blur-sm border border-slate-800 rounded-3xl hover:border-slate-700 transition-all"
              >
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              About DeCipherLabs
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Building secure, transparent, and automated financial infrastructure for the decentralized economy.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Description Card */}
            <div className="lg:col-span-2 group">
              <div className="h-full bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-8 hover:border-slate-700 transition-all duration-300">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-12 h-12 bg-blue-600 rounded-3xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Our Mission</h3>
                    <p className="text-slate-300">
                      Automate organizational finance with security and transparency at the core.
                    </p>
                  </div>
                </div>

                <p className="text-slate-300 mb-6 text-lg leading-relaxed">
                  DeCipherLabs builds secure, transparent, and automated financial infrastructure for organizations and DAOs.
                  Our flagship protocol, DeCipherLabs Payroll, makes on-chain salary disbursement simple, auditable, and programmable.
                </p>

                <div className="flex flex-wrap gap-4 pt-4">
                  <div className="flex-1 min-w-[200px] bg-slate-800/30 p-4 rounded-3xl border border-slate-700">
                    <h4 className="font-semibold text-blue-300 mb-2">Vision</h4>
                    <p className="text-slate-400 text-sm">Payroll automation today; more innovative on-chain financial products coming soon.</p>
                  </div>
                  <div className="flex-1 min-w-[200px] bg-slate-800/30 p-4 rounded-3xl border border-slate-700">
                    <h4 className="font-semibold text-blue-300 mb-2">Get Involved</h4>
                    <p className="text-slate-400 text-sm">Follow our updates on X and join early testing on testnets.</p>
                  </div>
                </div>

                {/* Founder Dashboard Link - Only visible to factory owner */}
                {isFactoryOwner && (
                  <div className="mt-8">
                    <div className="flex justify-center">
                      <button
                        onClick={() => onNavigate('treasury')}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-2xl text-white transition-all transform hover:scale-105 flex items-center space-x-2"
                      >
                        <Shield className="w-5 h-5" />
                        <span>Founder Dashboard</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 text-center mt-2">
                      For platform administrators and treasury management
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Floating Cards - Current Features */}
            <div className="space-y-6">
              <div className="group/card bg-slate-900/70 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-300">
                <div className="w-10 h-10 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover/card:scale-110 transition-transform">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Flexible Payments</h3>
                <p className="text-slate-400 text-sm">Support for ETH and major stablecoins (USDC, USDT, DAI)</p>
              </div>

              <div className="group/card bg-slate-900/70 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-300">
                <div className="w-10 h-10 bg-slate-700 rounded-2xl flex items-center justify-center mb-4 group-hover/card:scale-110 transition-transform">
                  <Zap className="w-5 h-5 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Payment Schedules</h3>
                <p className="text-slate-400 text-sm">Weekly, bi-weekly, or monthly payment cycles</p>
              </div>

              <div className="group/card bg-slate-900/70 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-300">
                <div className="w-10 h-10 bg-emerald-600/20 rounded-2xl flex items-center justify-center mb-4 group-hover/card:scale-110 transition-transform">
                  <Shield className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Tax Management</h3>
                <p className="text-slate-400 text-sm">Automated tax withholding and reporting</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        {/* Roadmap Section */}
        <section id="roadmap" className="relative py-20 px-4 sm:px-6 lg:px-8 bg-slate-950/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
                DeCipherLabs Roadmap
              </h2>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                Our journey to revolutionize organizational finance
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="p-6 bg-slate-900/30 backdrop-blur-sm border border-emerald-600/50 rounded-3xl">
                <div className="mb-4">
                  <span className="text-emerald-400 font-semibold">Phase 1</span>
                  <h3 className="text-xl font-bold mt-2">Core Infrastructure</h3>
                </div>
                <ul className="space-y-2 text-slate-300">
                  <li>✓ Multi-token payments</li>
                  <li>✓ Employee management</li>
                  <li>✓ Batch operations</li>
                  <li>✓ Basic admin controls</li>
                  <li>✓ Volatility Hedge Vaults MVP</li>
                </ul>
              </div>

              <div className="p-6 bg-slate-900/30 backdrop-blur-sm border border-slate-800 rounded-3xl">
                <div className="mb-4">
                  <span className="text-blue-400 font-semibold">Phase 2</span>
                  <h3 className="text-xl font-bold mt-2">Advanced Payments</h3>
                </div>
                <ul className="space-y-2 text-slate-300">
                  <li>Enhanced Salary Protection</li>
                  <li>Custom Payment Schedules</li>
                  <li>Advanced Treasury Management</li>
                  <li>Multi-sig Support</li>
                  <li>Enhanced Volatility Hedging</li>
                </ul>
              </div>

              <div className="p-6 bg-slate-900/30 backdrop-blur-sm border border-slate-800 rounded-3xl">
                <div className="mb-4">
                  <span className="text-blue-400 font-semibold">Phase 3</span>
                  <h3 className="text-xl font-bold mt-2">Financial Integration</h3>
                </div>
                <ul className="space-y-2 text-slate-300">
                  <li>DeFi Yield Generation</li>
                  <li>Cross-chain Operations</li>
                  <li>Tax Automation</li>
                  <li>Compliance Tools</li>
                  <li>Advanced Risk Management</li>
                </ul>
              </div>

              <div className="p-6 bg-slate-900/30 backdrop-blur-sm border border-slate-800 rounded-3xl">
                <div className="mb-4">
                  <span className="text-blue-400 font-semibold">Phase 4</span>
                  <h3 className="text-xl font-bold mt-2">Full Financial Suite</h3>
                </div>
                <ul className="space-y-2 text-slate-300">
                  <li>Options-based Protection</li>
                  <li>DAO Integration</li>
                  <li>Employee Benefits</li>
                  <li>Investment Options</li>
                  <li>Advanced DeFi Integrations</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-3xl">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your Payroll?
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Join the future of decentralized finance. Launch your payroll system today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleLaunchPayroll}
                className="px-8 py-4 bg-blue-600 rounded-2xl hover:bg-blue-500 transition-all text-lg font-semibold"
              >
                Get Started
              </button>
              <a href="https://github.com/decipherlabs" className="px-8 py-4 border-2 border-slate-700 rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center space-x-2 text-lg">
                <Github className="w-5 h-5" />
                <span>View Docs</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-slate-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-2xl flex items-center justify-center">
                  <Rocket className="w-5 h-5" />
                </div>
                <span className="text-xl font-bold">DeCipherLabs</span>
              </div>
              <p className="text-slate-400 mb-4">
                Building secure, transparent, and automated financial infrastructure for the decentralized economy.
              </p>
              <div className="flex space-x-4">
                <a href="https://x.com/DecipherLabs_HQ" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-800 rounded-2xl flex items-center justify-center hover:bg-blue-600 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a href="https://github.com/decipherlabs" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-800 rounded-2xl flex items-center justify-center hover:bg-blue-600 transition-colors">
                  <Github className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-4">Products</h4>
              <ul className="space-y-2 text-slate-400">
                <li><button onClick={handleLaunchPayroll} className="hover:text-blue-400 transition-colors">Payroll</button></li>
                <li><span className="text-slate-500">Treasury (Soon)</span></li>
                <li><span className="text-slate-500">Security (Soon)</span></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-slate-400">
                <li><button onClick={() => onNavigate('whitepaper')} className="hover:text-blue-400 transition-colors">Whitepaper</button></li>
                <li><button onClick={() => onNavigate('user-guide')} className="hover:text-blue-400 transition-colors">User Guide</button></li>
                <li><button onClick={() => onNavigate('testing')} className="hover:text-blue-400 transition-colors">Testing Guide</button></li>
                <li><button onClick={() => onNavigate('docs')} className="hover:text-blue-400 transition-colors">All Documentation</button></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-800 text-center text-slate-400">
            <p>&copy; 2025 DeCipherLabs. Built on Base Network.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DeCipherLabsLanding;