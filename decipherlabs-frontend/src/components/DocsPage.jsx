import React from 'react';
import { ArrowLeft, Book, FileText, TestTube, ExternalLink, ChevronRight, Sparkles } from 'lucide-react';

const DocsPage = ({ onNavigate }) => {
    const docs = [
        {
            id: 'whitepaper',
            title: 'Whitepaper',
            icon: Book,
            description: 'Technical architecture, hedge vault mechanism, and protocol details',
            color: 'from-blue-500 to-cyan-500',
            badge: 'Technical'
        },
        {
            id: 'user-guide',
            title: 'User Guide',
            icon: FileText,
            description: 'Complete guide for using DeCipherLabs Payroll platform',
            color: 'from-purple-500 to-pink-500',
            badge: 'Getting Started'
        },
        {
            id: 'testing',
            title: 'Testing Guide',
            icon: TestTube,
            description: 'Comprehensive testing instructions for all features',
            color: 'from-green-500 to-emerald-500',
            badge: 'QA'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <button
                    onClick={() => onNavigate('landing')}
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors mb-12 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Home</span>
                </button>

                {/* Hero Section */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-6">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-blue-400 font-medium">Phase 1 Complete</span>
                    </div>
                    <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent mb-6 animate-gradient">
                        Documentation
                    </h1>
                    <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        Everything you need to know about DeCipherLabs Payroll - the most affordable Web3 payroll solution
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-all">
                        <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">1%</div>
                        <div className="text-slate-400 text-sm">Service Fee</div>
                    </div>
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-green-500/50 transition-all">
                        <div className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">3</div>
                        <div className="text-slate-400 text-sm">Risk Levels</div>
                    </div>
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-purple-500/50 transition-all">
                        <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">100%</div>
                        <div className="text-slate-400 text-sm">On-Chain</div>
                    </div>
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-orange-500/50 transition-all">
                        <div className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-2">Base</div>
                        <div className="text-slate-400 text-sm">Network</div>
                    </div>
                </div>

                {/* Documentation Cards */}
                <div className="mb-16">
                    <h2 className="text-3xl font-bold text-white mb-8">Browse Documentation</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {docs.map(doc => (
                            <button
                                key={doc.id}
                                onClick={() => onNavigate(doc.id)}
                                className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700 hover:border-slate-600 rounded-2xl p-8 transition-all hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/10 text-left overflow-hidden"
                            >
                                {/* Gradient overlay on hover */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${doc.color} opacity-0 group-hover:opacity-5 transition-opacity`}></div>

                                {/* Badge */}
                                <div className="absolute top-4 right-4">
                                    <span className="text-xs font-semibold text-slate-500 bg-slate-700/50 px-2 py-1 rounded-full">
                                        {doc.badge}
                                    </span>
                                </div>

                                {/* Icon */}
                                <div className={`relative w-16 h-16 bg-gradient-to-br ${doc.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                                    <doc.icon className="w-8 h-8 text-white" />
                                </div>

                                {/* Content */}
                                <h3 className="relative text-2xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-blue-400 group-hover:to-cyan-400 transition-all">
                                    {doc.title}
                                </h3>
                                <p className="relative text-slate-300 mb-6 leading-relaxed">{doc.description}</p>

                                {/* CTA */}
                                <div className="relative flex items-center text-blue-400 group-hover:text-blue-300 font-medium">
                                    <span className="mr-2">Read documentation</span>
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quick Links */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8">
                    <h2 className="text-2xl font-bold text-white mb-6">Quick Links</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <a
                            href="https://sepolia.basescan.org/address/0xd0798b082b29E00D4Ecb0682E896D72181fa7873"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-blue-500/50 rounded-xl transition-all"
                        >
                            <span className="text-slate-300 group-hover:text-white transition-colors">Factory Contract</span>
                            <ExternalLink className="w-4 h-4 text-blue-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </a>
                        <a
                            href="https://sepolia.basescan.org/address/0x535D567552cBe22dc97a9C231fFa9B2Ba36903C3"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-blue-500/50 rounded-xl transition-all"
                        >
                            <span className="text-slate-300 group-hover:text-white transition-colors">HedgeVaultManager</span>
                            <ExternalLink className="w-4 h-4 text-blue-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </a>
                        <a
                            href="https://twitter.com/DeCipherLabs_HQ"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-blue-500/50 rounded-xl transition-all"
                        >
                            <span className="text-slate-300 group-hover:text-white transition-colors">Twitter / X</span>
                            <ExternalLink className="w-4 h-4 text-blue-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </a>
                        <a
                            href="mailto:decipherlabshq@gmail.com"
                            className="group flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-blue-500/50 rounded-xl transition-all"
                        >
                            <span className="text-slate-300 group-hover:text-white transition-colors">Contact Support</span>
                            <ExternalLink className="w-4 h-4 text-blue-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </a>
                    </div>
                </div>
            </div>

            <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
        </div>
    );
};

export default DocsPage;
