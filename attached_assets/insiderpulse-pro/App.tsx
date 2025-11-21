
import React, { useState, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import LiveTrading from './components/LiveTrading';
import TopStocks from './components/TopStocks';
import TradeModal from './components/TradeModal';
import ProfileView from './components/ProfileView';
import SettingsView from './components/SettingsView';
import AuthView from './components/AuthView';
import SubscriptionModal from './components/SubscriptionModal';
import LandingPage from './components/LandingPage';
import { View, Trade, Language } from './types';
import { generateTrades, generateRecommendations, TRANSLATIONS } from './utils';
import { Globe, Shield, ShieldCheck, Menu } from 'lucide-react';

const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPro, setIsPro] = useState(false); // Default to Outsider (False)
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const [activeView, setActiveView] = useState<View>(View.LIVE_TRADING);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [language, setLanguage] = useState<Language>('EN');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const trades = useMemo(() => generateTrades(30), []);
  const recommendations = useMemo(() => generateRecommendations(), []);
  
  const t = TRANSLATIONS[language];

  const languages: { code: Language; label: string }[] = [
    { code: 'EN', label: 'English' },
    { code: 'KO', label: '한국어' },
    { code: 'JA', label: '日本語' },
    { code: 'ZH', label: '中文' },
  ];

  // Handle Logic for Upgrade/Auth Triggers
  const handleTriggerAction = () => {
      if (!isAuthenticated) {
          setShowAuthModal(true);
      } else {
          setShowUpgradeModal(true);
      }
  };

  const handleLoginSuccess = () => {
      setIsAuthenticated(true);
      setShowAuthModal(false);
      // Optional: automatically show upgrade modal after login if that was the intent
      // setShowUpgradeModal(true); 
  };

  const handleUpgrade = () => {
      setIsPro(true);
      setShowUpgradeModal(false);
  };

  const handleRedeemCoupon = () => {
      setIsPro(true);
      // In a real app, we would also sync this extension with the backend
  };

  if (showLanding) {
      return <LandingPage onEnter={() => setShowLanding(false)} />;
  }

  return (
    <div className="flex h-screen w-screen bg-[#050505] text-neutral-300 font-sans overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#050505] transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0 shadow-[0_0_50px_rgba(0,0,0,0.5)] border-r border-neutral-800' : '-translate-x-full'}`}>
        <Sidebar 
            activeView={activeView} 
            onChangeView={(view) => {
                setActiveView(view);
                setIsMobileMenuOpen(false);
            }} 
            lang={language} 
            isPro={isPro}
            isAuthenticated={isAuthenticated}
            onLoginClick={() => setShowAuthModal(true)}
            onLogout={() => setIsAuthenticated(false)}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
        />
      </div>
      
      <div className="flex-1 flex flex-col relative bg-[#050505] w-full min-w-0">
        {/* Top Bar Status - Minimalist Terminal Header */}
        <div className="h-10 border-b border-neutral-900 flex items-center justify-between px-4 md:px-6 text-[10px] tracking-widest text-neutral-600 uppercase select-none bg-[#050505] relative z-30">
             <div className="flex items-center gap-4 md:gap-6">
                 {/* Mobile Menu Toggle */}
                 <button 
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="md:hidden text-neutral-400 hover:text-white transition-colors"
                 >
                     <Menu size={16} />
                 </button>

                 <span className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isPro ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                    <span className="hidden sm:inline">SYSTEM: {isPro ? t.common.systemPro : t.common.systemFree}</span>
                    <span className="sm:hidden">{isPro ? t.common.tierPro : t.common.tierFree}</span>
                 </span>
                 <span className="hidden md:inline">LATENCY: {isPro ? t.common.latencyPro : t.common.latencyFree}</span>
             </div>
             <div className="flex items-center gap-4 md:gap-6 mono">
                 {/* Tier Toggle / Status */}
                 <button 
                    onClick={() => isPro ? setIsPro(false) : handleTriggerAction()}
                    className={`flex items-center gap-2 transition-colors ${isPro ? 'text-emerald-500' : 'text-amber-600 hover:text-amber-500'}`}
                 >
                     {isPro ? <ShieldCheck size={10} /> : <Shield size={10} />}
                     <span className="hidden sm:inline">{isPro ? t.common.licenseActive : t.common.licenseFree}</span>
                 </button>

                 {/* Language Selector */}
                 <div className="relative">
                     <button 
                        onClick={() => setShowLangMenu(!showLangMenu)}
                        className="flex items-center gap-2 hover:text-neutral-300 transition-colors focus:outline-none"
                     >
                         <Globe size={10} />
                         <span className="text-neutral-400">{language}</span>
                     </button>

                     {showLangMenu && (
                         <div className="absolute right-0 top-full mt-2 w-24 bg-[#0a0a0a] border border-neutral-800 shadow-xl flex flex-col py-1 z-50">
                             {languages.map((lang) => (
                                 <button
                                    key={lang.code}
                                    onClick={() => {
                                        setLanguage(lang.code);
                                        setShowLangMenu(false);
                                    }}
                                    className={`px-3 py-2 text-left text-[10px] hover:bg-neutral-900 transition-colors ${language === lang.code ? 'text-emerald-500' : 'text-neutral-400'}`}
                                 >
                                     {lang.label}
                                 </button>
                             ))}
                         </div>
                     )}
                 </div>
             </div>
        </div>

        <div className="flex-1 overflow-hidden relative w-full">
             {activeView === View.LIVE_TRADING && (
                <LiveTrading data={trades} onSelectTrade={setSelectedTrade} lang={language} isPro={isPro} onUpgrade={handleTriggerAction} />
             )}
             {activeView === View.TOP_STOCKS && (
                <TopStocks data={recommendations} lang={language} isPro={isPro} onUpgrade={handleTriggerAction} onSelectTrade={setSelectedTrade} />
             )}
             {activeView === View.PROFILE && (
                <ProfileView lang={language} isPro={isPro} onRedeemCoupon={handleRedeemCoupon} />
             )}
             {activeView === View.SETTINGS && (
                <SettingsView lang={language} setLang={setLanguage} />
             )}
        </div>
      </div>

      {/* MODALS */}

      {selectedTrade && (
        <TradeModal trade={selectedTrade} onClose={() => setSelectedTrade(null)} lang={language} />
      )}

      {showAuthModal && (
        <div className="fixed inset-0 z-[100] bg-black animate-in fade-in duration-200">
            <AuthView lang={language} onLogin={handleLoginSuccess} onClose={() => setShowAuthModal(false)} />
        </div>
      )}

      {showUpgradeModal && (
        <SubscriptionModal lang={language} onClose={() => setShowUpgradeModal(false)} onUpgrade={handleUpgrade} />
      )}
    </div>
  );
};

export default App;
