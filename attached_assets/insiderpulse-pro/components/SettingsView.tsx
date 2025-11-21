import React from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../utils';
import { Settings, Globe, Monitor, CreditCard, Bell, BellOff } from 'lucide-react';

interface SettingsViewProps {
  lang: Language;
  setLang: (lang: Language) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ lang, setLang }) => {
  const t = TRANSLATIONS[lang].settings;

  const languages: { code: Language; label: string }[] = [
    { code: 'EN', label: 'English' },
    { code: 'KO', label: '한국어' },
    { code: 'JA', label: '日本語' },
    { code: 'ZH', label: '中文' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#050505]">
       <div className="p-6 border-b border-neutral-900">
            <h1 className="text-3xl font-light text-neutral-200 tracking-tight uppercase">{t.header}</h1>
            <p className="text-xs text-neutral-600 mt-1 mono uppercase tracking-widest">{t.subHeader}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6">
            
            {/* Language Settings */}
            <div className="bg-[#0a0a0a] border border-neutral-900 p-6 rounded-sm">
                 <div className="flex items-center gap-3 mb-4">
                    <Globe className="text-neutral-500" size={18} />
                    <h2 className="text-base font-bold text-neutral-300">{t.language}</h2>
                </div>
                <div className="relative">
                    <select 
                        value={lang} 
                        onChange={(e) => setLang(e.target.value as Language)}
                        className="w-full bg-[#050505] border border-neutral-800 text-neutral-300 p-3 text-sm focus:outline-none focus:border-neutral-600 appearance-none"
                    >
                        {languages.map(l => (
                            <option key={l.code} value={l.code}>{l.label}</option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-600 text-xs">▼</div>
                </div>
            </div>

             {/* Theme Settings */}
             <div className="bg-[#0a0a0a] border border-neutral-900 p-6 rounded-sm">
                 <div className="flex items-center gap-3 mb-4">
                    <Monitor className="text-neutral-500" size={18} />
                    <h2 className="text-base font-bold text-neutral-300">{t.theme}</h2>
                </div>
                <div className="relative">
                    <select 
                        className="w-full bg-[#050505] border border-neutral-800 text-neutral-300 p-3 text-sm focus:outline-none focus:border-neutral-600 appearance-none"
                        disabled
                    >
                       <option>System Default (Dark)</option>
                    </select>
                     <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-600 text-xs">▼</div>
                </div>
            </div>

            {/* Subscription Management Actions */}
            <div className="bg-[#0a0a0a] border border-neutral-900 p-6 rounded-sm">
                 <div className="flex items-center gap-3 mb-2">
                    <CreditCard className="text-neutral-500" size={18} />
                    <h2 className="text-base font-bold text-neutral-300">{t.subManage}</h2>
                </div>
                
                <div className="flex justify-between items-center mb-6 text-xs border-b border-neutral-900 pb-4">
                    <span className="text-neutral-500">Current Plan: <span className="text-white">Insider Pro</span></span>
                    <span className="text-emerald-600">● Active</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button className="flex items-center justify-center gap-2 p-3 border border-neutral-800 hover:bg-neutral-900 text-neutral-300 text-xs uppercase tracking-wide transition-colors">
                        <CreditCard size={14} /> {t.manage}
                    </button>
                     <button className="flex items-center justify-center gap-2 p-3 border border-neutral-800 hover:bg-neutral-900 text-neutral-300 text-xs uppercase tracking-wide transition-colors">
                        <Settings size={14} /> {t.refresh}
                    </button>
                </div>
                
                <div className="mt-4 bg-indigo-900/20 border border-indigo-900/50 p-3 flex items-center gap-3">
                     <div className="w-1 h-1 bg-indigo-400 rounded-full animate-pulse"></div>
                     <p className="text-[10px] text-indigo-200">Tip: If you cancel your subscription, you'll keep access until the end of your billing period.</p>
                </div>
            </div>

             {/* Notification Settings */}
             <div className="bg-[#0a0a0a] border border-neutral-900 p-6 rounded-sm">
                 <div className="flex items-center gap-3 mb-4">
                    <Bell className="text-neutral-500" size={18} />
                    <h2 className="text-base font-bold text-neutral-300">{t.notifications}</h2>
                </div>
                <div className="flex items-center gap-3 text-neutral-600 p-4 bg-neutral-900/30 border border-neutral-900/50 border-dashed">
                    <BellOff size={16} />
                    <span className="text-xs">{t.push}</span>
                </div>
            </div>

            <div className="flex justify-end">
                <button className="bg-white text-black px-6 py-2 text-xs font-bold uppercase hover:bg-neutral-200 transition-colors">
                    {t.save}
                </button>
            </div>
        </div>
    </div>
  );
};

export default SettingsView;