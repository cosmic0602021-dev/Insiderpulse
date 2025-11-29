
import React from 'react';
import { LayoutDashboard, Activity, User, Settings, Power, X, LogIn } from 'lucide-react';
import { View, Language } from './types';
import { TRANSLATIONS } from '@/lib/translations';

interface SidebarProps {
  activeView: View;
  onChangeView: (view: View) => void;
  lang: Language;
  isPro: boolean;
  isAuthenticated: boolean;
  userEmail?: string;
  onLoginClick: () => void;
  onLogout: () => void;
  onCloseMobile?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onChangeView, lang, isPro, isAuthenticated, userEmail, onLoginClick, onLogout, onCloseMobile }) => {
  const t = TRANSLATIONS[lang].sidebar;
  const common = TRANSLATIONS[lang].common;

  return (
    <div className="w-64 h-full bg-[#050505] border-r border-neutral-900 flex flex-col">
      <div className="p-6 border-b border-neutral-900 flex items-center justify-between">
        <div>
            <h1 className="text-xl font-black text-neutral-200 tracking-tighter uppercase">
            Insider<span className="text-neutral-600">Pulse</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] bg-neutral-900 text-neutral-500 px-1 py-0.5">SIGNAL_PRO_V2.4</span>
            </div>
        </div>
        {/* Close Button - Mobile Only */}
        {onCloseMobile && (
            <button onClick={onCloseMobile} className="md:hidden text-neutral-600 hover:text-white transition-colors">
                <X size={20} />
            </button>
        )}
      </div>

      <div className="flex-1 px-2 py-6 space-y-1">
        <div className="text-[9px] font-bold text-neutral-700 uppercase px-4 mb-2 tracking-widest">{t.modules}</div>
        
        <NavButton 
            active={activeView === View.LIVE_TRADING} 
            onClick={() => onChangeView(View.LIVE_TRADING)}
            icon={<Activity size={14} />}
            label={t.live}
        />
        <NavButton 
            active={activeView === View.TOP_STOCKS} 
            onClick={() => onChangeView(View.TOP_STOCKS)}
            icon={<LayoutDashboard size={14} />}
            label={t.analysis}
        />
        <NavButton 
            active={activeView === View.PROFILE} 
            onClick={() => onChangeView(View.PROFILE)}
            icon={<User size={14} />}
            label={t.config}
        />
        
        <div className="mt-8 text-[9px] font-bold text-neutral-700 uppercase px-4 mb-2 tracking-widest">{t.watched}</div>
        <div className="px-4 py-4 border border-neutral-900/50 mx-2 bg-neutral-900/20">
            <p className="text-[10px] text-neutral-600 mono text-center">{t.noData}</p>
        </div>
      </div>

      <div className="p-4 border-t border-neutral-900 bg-[#080808]">
        {isAuthenticated ? (
            <>
                <div className="flex items-center gap-3 px-3 py-2 mb-2 border border-neutral-900 bg-[#050505]">
                    <div className={`w-2 h-2 rounded-full ${isPro ? 'bg-emerald-900' : 'bg-amber-900'}`}></div>
                    <div className="overflow-hidden">
                        <div className="text-[10px] font-medium text-neutral-400 truncate mono">{userEmail || 'Unknown User'}</div>
                        <div className={`text-[9px] uppercase font-bold ${isPro ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {isPro ? common.tierPro : common.tierFree}
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between px-2 text-neutral-600 mt-3">
                    <button 
                        onClick={() => onChangeView(View.SETTINGS)}
                        className={`hover:text-neutral-300 transition-colors ${activeView === View.SETTINGS ? 'text-white' : ''}`}
                    >
                        <Settings size={14} />
                    </button>
                    <button onClick={onLogout} className="hover:text-rose-900 transition-colors"><Power size={14} /></button>
                </div>
            </>
        ) : (
            <div className="flex items-center justify-between px-2">
                <div className="text-[10px] font-medium text-neutral-500 mono uppercase">Guest Access</div>
                <button 
                    onClick={onLoginClick}
                    className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-wide border border-emerald-900/30 bg-emerald-900/10 px-3 py-1.5 rounded hover:bg-emerald-900/20 transition-colors"
                >
                    <LogIn size={12} />
                    Login
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2 text-xs font-medium transition-all border-l-2 ${
        active 
          ? 'bg-neutral-900/50 text-neutral-200 border-neutral-500' 
          : 'text-neutral-600 hover:text-neutral-400 border-transparent hover:bg-neutral-900/20'
      }`}
    >
      {icon}
      <span className="uppercase tracking-wide">{label}</span>
    </button>
);

export default Sidebar;
