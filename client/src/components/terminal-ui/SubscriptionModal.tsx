
import React, { useState } from 'react';
import { Language } from './types';
import { TRANSLATIONS } from '@/lib/translations';
import { X, ShieldCheck, Check, Zap, Lock, CreditCard, TrendingUp } from 'lucide-react';

interface SubscriptionModalProps {
  lang: Language;
  onClose: () => void;
  onUpgrade: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ lang, onClose, onUpgrade }) => {
  const t = TRANSLATIONS[lang].upgrade;
  const common = TRANSLATIONS[lang].common;
  
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  const handleUpgradeClick = () => {
    onClose();
    window.location.href = '/premium-checkout';
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/95 backdrop-blur-sm animate-in fade-in duration-300">
      
      <div className="flex min-h-screen items-center justify-center p-4 md:p-6 py-10">
          {/* Modal Container */}
          <div className="relative w-full max-w-4xl bg-[#080808] border border-neutral-800 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden rounded-sm my-auto">
            
            {/* Close Button */}
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors z-30 p-2 bg-black/50 rounded-full"
            >
                <X size={20} />
            </button>

            {/* Header Section */}
            <div className="p-8 border-b border-neutral-900 text-center bg-[#0a0a0a]">
                <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 bg-neutral-900 rounded-full flex items-center justify-center border border-neutral-800 relative">
                        <div className="absolute inset-0 rounded-full border border-emerald-900 animate-ping opacity-20"></div>
                        <ShieldCheck size={24} className="text-emerald-500" />
                    </div>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight uppercase mb-2">
                    {t.header}
                </h2>
                <p className="text-sm text-neutral-500 font-mono">
                    {t.subHeader}
                </p>
            </div>

            {/* Billing Toggle */}
            <div className="flex justify-center py-6 bg-[#080808]">
                <div className="bg-neutral-900 p-1 rounded flex border border-neutral-800 relative">
                    <button 
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-6 py-2 text-xs font-bold uppercase tracking-wider rounded-sm transition-all ${billingCycle === 'monthly' ? 'bg-neutral-700 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'}`}
                    >
                        {t.monthly}
                    </button>
                    <button 
                        onClick={() => setBillingCycle('yearly')}
                        className={`px-6 py-2 text-xs font-bold uppercase tracking-wider rounded-sm transition-all flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-emerald-900 text-emerald-100 shadow-sm' : 'text-neutral-500 hover:text-neutral-300'}`}
                    >
                        {t.yearly}
                        <span className="text-[9px] bg-emerald-500 text-black px-1.5 py-0.5 rounded font-bold">{t.save}</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row border-t border-neutral-900">
                
                {/* Left Column: The Offering */}
                <div className="w-full md:w-1/2 p-8 border-r-0 md:border-r border-b md:border-b-0 border-neutral-900 bg-[#080808]">
                    <div className="mb-8">
                        <div className="text-xs text-neutral-500 uppercase tracking-wider mb-2 font-bold flex items-center gap-2">
                            <Zap size={12} className="text-emerald-500" /> 
                            {common.tierPro} {t.secData}
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-5xl font-black text-white tracking-tighter text-emerald-500">
                                {billingCycle === 'monthly' ? t.priceMonthly : t.priceYearly}
                            </span>
                            <span className="text-neutral-500 text-sm font-mono mb-1">
                                {billingCycle === 'monthly' ? t.periodMonthly : t.periodYearly}
                            </span>
                        </div>
                        {billingCycle === 'yearly' && (
                            <div className="text-[10px] text-neutral-500 mt-2 font-mono border-l-2 border-neutral-800 pl-2">
                                ≈ $9/month (Save $56 annually)
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        {t.features.map((feat: string, i: number) => (
                            <div key={i} className="flex items-start gap-3 text-sm text-neutral-300 group">
                                <div className="mt-0.5 w-4 h-4 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center group-hover:border-emerald-800 transition-colors">
                                    <Check size={10} className="text-emerald-500" />
                                </div>
                                <span className="text-neutral-400 group-hover:text-neutral-200 transition-colors text-xs leading-relaxed">{feat}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: The Checkout Summary */}
                <div className="w-full md:w-1/2 p-8 bg-[#050505] flex flex-col">
                    <div className="flex items-center gap-2 mb-6">
                        <CreditCard size={16} className="text-neutral-500" />
                        <span className="text-sm font-bold text-neutral-300 uppercase tracking-wide">{t.trial}</span>
                    </div>

                    <div className="bg-neutral-900/30 border border-neutral-800 p-6 rounded-sm mb-6 space-y-3">
                        <div className="flex justify-between text-xs">
                            <span className="text-neutral-500">{t.secData}</span>
                            <span className="text-white font-bold">{common.tierPro} ({billingCycle === 'monthly' ? t.monthly : t.yearly})</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-neutral-500">Free Trial</span>
                            <span className="text-emerald-500 font-bold">{billingCycle === 'monthly' ? t.trial3Badge : t.trial7Badge}</span>
                        </div>
                        <div className="h-[1px] bg-neutral-800 my-2"></div>
                        <div className="flex justify-between text-xs">
                            <span className="text-neutral-500">After Trial</span>
                            <span className="text-white font-mono">{billingCycle === 'monthly' ? t.afterTrial3 : t.afterTrial7}</span>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 mb-6 p-3 bg-neutral-900/20 border border-neutral-900 rounded">
                        <div className="mt-0.5">
                            <input type="checkbox" defaultChecked className="accent-emerald-600 bg-neutral-900 border-neutral-700" />
                        </div>
                        <p className="text-[10px] text-neutral-500 leading-relaxed">
                            {t.terms}
                        </p>
                    </div>

                    <button 
                        onClick={handleUpgradeClick}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-black font-bold uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 mt-auto"
                    >
                        <div className="w-4 h-4 border-2 border-black rounded-full border-t-transparent animate-spin hidden"></div>
                        {billingCycle === 'monthly' ? t.trial3 : t.trial7}
                    </button>

                    <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-neutral-600">
                        <Lock size={10} />
                        {t.secure}
                    </div>
                </div>
            </div>
            
            {/* Footer Strip */}
            <div className="bg-[#050505] border-t border-neutral-900 p-3 flex justify-center md:justify-between items-center text-[9px] text-neutral-600 uppercase tracking-wider px-8">
                <div className="flex items-center gap-2">
                    <TrendingUp size={10} />
                    {t.secDesc}
                </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
