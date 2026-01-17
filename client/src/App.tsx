import { Switch, Route, useLocation } from "wouter";
import { queryClient, resolveApiUrl } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { LanguageProvider, useLanguage, type Language } from "@/contexts/language-context";
import { CurrencyProvider } from "@/contexts/currency-context";
import { AccessProvider } from "@/contexts/access-context";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { AdMobProvider } from "@/contexts/admob-context";
import { ENV_CONFIG } from "@/lib/environment";
import { useState, useEffect } from "react";
import { Globe, Shield, ShieldCheck, Menu, X, LayoutDashboard, Activity, User, Cog } from 'lucide-react';
// LanguageSelection removed - now using automatic IP-based language detection
import { CurrencySelector } from "@/components/currency-selector";
import Dashboard from "@/pages/dashboard";
import Settings from "@/pages/settings";
import TradeDetail from "@/pages/trade-detail";
import Analytics from "@/pages/analytics";
import Search from "@/pages/search";
import LiveTrading from "@/pages/live-trading";
import LiveTradingTerminal from "@/pages/live-trading-terminal";
import Ranking from "@/pages/ranking";
import PasswordDemo from "@/pages/password-demo";
// EnhancedInsiderTradingDashboard removed for App Store compliance - contained investment advice language
import PremiumCheckout from "@/pages/premium-checkout";
import PaymentSuccess from "@/pages/payment-success";
import SignupPage from "@/pages/signup";
import LoginPage from "@/pages/login";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import VerifyEmail from "@/pages/verify-email";
import VerifyCode from "@/pages/verify-code";
import StartTrialPage from "@/pages/start-trial";
import NotFound from "@/pages/not-found";
import AdminDashboard from "@/pages/admin-dashboard";
import LandingPage from "@/pages/landing";
import ProfilePage from "@/pages/profile";
import TerminalSidebar from "@/components/terminal-ui/Sidebar";
import ProfileView from '@/components/terminal-ui/ProfileView';
import TerminalSettingsView from '@/components/terminal-ui/SettingsView';
import TopStocksTerminal from '@/pages/top-stocks-terminal';
import { View } from "@/components/terminal-ui/types";
import { TRANSLATIONS } from "@/lib/translations";
import { AuthModal } from "@/components/auth-modal";
import { DisclaimerModal } from "@/components/disclaimer-modal";
import DebugNetwork from "@/pages/debug-network";
import Notifications from "@/pages/notifications";
import { NotificationDropdown } from "@/components/notification-dropdown";

function PublicRouter() {
  return (
    <Switch>
      <Route path="/debug" component={DebugNetwork} />
      <Route path="/" component={LandingPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/verify-code" component={VerifyCode} />
      <Route path="/start-trial" component={StartTrialPage} />
      <Route path="/premium-checkout" component={PremiumCheckout} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/trade/:tradeId" component={TradeDetail} />
      <Route path="/trades" component={LiveTrading} />
      <Route path="/terminal" component={LiveTradingTerminal} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/search" component={Search} />
      <Route path="/ranking" component={Ranking} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/password-demo" component={PasswordDemo} />
      {/* Enhanced dashboard removed for App Store compliance */}
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/settings" component={Settings} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { language, setLanguage, hasInitialized } = useLanguage();
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const [location, setLocation] = useLocation();
  const [activeView, setActiveView] = useState<View>(
    ENV_CONFIG.isAppintos ? View.TOP_STOCKS : View.LIVE_TRADING
  );
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Convert language format: 'en' -> 'en', 'ko' -> 'ko', etc.
  const terminalLang = language as Language;
  const t = TRANSLATIONS[terminalLang]?.common || TRANSLATIONS.en.common;

  // Check if user is Pro (has active subscription or active trial)
  const isPro = user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trialing';

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'ko', label: '한국어' },
    { code: 'ja', label: '日本語' },
    { code: 'zh', label: '中文' },
  ];

  // Map View to route paths
  const handleViewChange = (view: View) => {
    setActiveView(view);
    setIsMobileMenuOpen(false);
    
    switch (view) {
      case View.LIVE_TRADING:
        setLocation('/dashboard');
        break;
      case View.TOP_STOCKS:
        setLocation('/ranking');
        break;
      case View.PROFILE:
        setLocation('/profile');
        break;
      case View.SETTINGS:
        setLocation('/settings');
        break;
      case View.NOTIFICATIONS:
        setLocation('/notifications');
        break;
    }
  };

  // Sync activeView with current location
  useEffect(() => {
    if (location.startsWith('/dashboard') || location.startsWith('/trades')) {
      setActiveView(View.LIVE_TRADING);
    } else if (location.startsWith('/ranking')) {
      setActiveView(View.TOP_STOCKS);
    } else if (location.startsWith('/profile')) {
      setActiveView(View.PROFILE);
    } else if (location.startsWith('/settings')) {
      setActiveView(View.SETTINGS);
    } else if (location.startsWith('/notifications')) {
      setActiveView(View.NOTIFICATIONS);
    }
  }, [location]);

  // 라우트 변경 시 캐시 무효화 제거 - 성능 최적화
  // React Query가 staleTime 기반으로 자동 관리하도록 위임

  const publicPaths = ['/', '/signup', '/login', '/forgot-password', '/reset-password', '/verify-code', '/verify-email', '/start-trial', '/premium-checkout'];
  const isPublicRoute = publicPaths.includes(location);

  // 언어 초기화 대기 화면 - hasInitialized가 이제 항상 true이므로 표시되지 않음
  // (IP 감지는 백그라운드에서 실행, 브라우저 언어로 즉시 렌더링)

  if (isPublicRoute) {
    return <PublicRouter />;
  }

  const handleTriggerAction = () => {
    if (!isAuthenticated) {
      openAuthModal('login');
    } else {
      // Navigate to premium checkout for upgrade
      setLocation('/premium-checkout');
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#050505] text-neutral-300 font-sans overflow-hidden">

      {/* Mobile Sidebar Overlay - 앱인토스에서는 숨김 */}
      {!ENV_CONFIG.isAppintos && isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container - 앱인토스에서는 숨김 (토스 공통 내비게이션 사용) */}
      {!ENV_CONFIG.isAppintos && (
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#050505] transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0 shadow-[0_0_50px_rgba(0,0,0,0.5)] border-r border-neutral-800' : '-translate-x-full'}`}>
          <TerminalSidebar
            activeView={activeView}
            onChangeView={handleViewChange}
            lang={terminalLang}
            isPro={isPro}
            isAuthenticated={isAuthenticated}
            userEmail={user?.email}
            onLoginClick={() => openAuthModal('login')}
            onLogout={logout}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col relative bg-[#050505] w-full min-w-0">
        {/* Top Bar Status - 앱인토스에서는 숨김 (토스 공통 내비게이션 사용) */}
        {!ENV_CONFIG.isAppintos && (
        <div className="h-10 border-b border-neutral-900 flex items-center justify-between px-4 md:px-6 text-[10px] tracking-widest text-neutral-600 uppercase select-none bg-[#050505] relative z-30">
          <div className="flex items-center gap-4 md:gap-6">
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden text-neutral-400 hover:text-white transition-colors"
              data-testid="button-mobile-menu"
            >
              <Menu size={16} />
            </button>

            <span className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isPro ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              <span className="hidden sm:inline">SYSTEM: {isPro ? t.systemPro : t.systemFree}</span>
              <span className="sm:hidden">{isPro ? t.tierPro : t.tierFree}</span>
            </span>
            <span className="hidden md:inline">LATENCY: {isPro ? t.latencyPro : t.latencyFree}</span>
          </div>
          <div className="flex items-center gap-4 md:gap-6 mono">
            {/* Tier Toggle / Status */}
            <button 
              onClick={handleTriggerAction}
              className={`flex items-center gap-2 transition-colors ${isPro ? 'text-emerald-500' : 'text-amber-600 hover:text-amber-500'}`}
              data-testid="button-upgrade-status"
            >
              {isPro ? <ShieldCheck size={10} /> : <Shield size={10} />}
              <span className="hidden sm:inline">{isPro ? t.licenseActive : t.licenseFree}</span>
            </button>

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-2 hover:text-neutral-300 transition-colors focus:outline-none"
                data-testid="button-language-selector"
              >
                <Globe size={10} />
                <span className="text-neutral-400">{language.toUpperCase()}</span>
              </button>

              {showLangMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowLangMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-24 bg-[#0a0a0a] border border-neutral-800 shadow-xl flex flex-col py-1 z-50">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setShowLangMenu(false);
                        }}
                        className={`px-3 py-2 text-left text-[10px] hover:bg-neutral-900 transition-colors ${language === lang.code ? 'text-emerald-500' : 'text-neutral-400'}`}
                        data-testid={`button-language-${lang.code}`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Notification Bell */}
            <NotificationDropdown
              onNavigateToNotifications={() => setActiveView(View.NOTIFICATIONS)}
            />

            {/* Currency Selector */}
            <CurrencySelector />
          </div>
        </div>
        )}

        <div className="flex-1 overflow-hidden relative w-full">
          <main className="h-full overflow-hidden w-full">
            {activeView === View.LIVE_TRADING && (
              <LiveTradingTerminal />
            )}
            {activeView === View.TOP_STOCKS && (
              <TopStocksTerminal />
            )}
            {activeView === View.PROFILE && (
              <ProfileView lang={terminalLang} />
            )}
            {activeView === View.SETTINGS && (
              <TerminalSettingsView lang={terminalLang} setLang={(lang) => setLanguage(lang as 'en' | 'ko' | 'ja' | 'zh')} />
            )}
            {activeView === View.NOTIFICATIONS && (
              <Notifications />
            )}
          </main>
        </div>

        {/* 하단 탭 네비게이션 - 모바일에서 항상 표시 (앱인토스 + 웹) */}
        <div className={`${ENV_CONFIG.isAppintos ? '' : 'md:hidden'} h-14 mx-4 mb-4 rounded-2xl shadow-2xl shadow-black/50 backdrop-blur-md bg-[#0a0a0a]/90 border border-neutral-800/50 flex items-center justify-around px-2 shrink-0`}>
          <button
            onClick={() => handleViewChange(View.TOP_STOCKS)}
            className={`flex flex-col items-center gap-1 px-4 py-2 ${activeView === View.TOP_STOCKS ? 'text-emerald-500' : 'text-neutral-500'}`}
          >
            <LayoutDashboard size={20} />
            <span className="text-[10px]">{TRANSLATIONS[terminalLang]?.nav?.topStocks || '상위'}</span>
          </button>
          <button
            onClick={() => handleViewChange(View.LIVE_TRADING)}
            className={`flex flex-col items-center gap-1 px-4 py-2 ${activeView === View.LIVE_TRADING ? 'text-emerald-500' : 'text-neutral-500'}`}
          >
            <Activity size={20} />
            <span className="text-[10px]">{TRANSLATIONS[terminalLang]?.nav?.live || '실시간'}</span>
          </button>
          <button
            onClick={() => handleViewChange(View.PROFILE)}
            className={`flex flex-col items-center gap-1 px-4 py-2 ${activeView === View.PROFILE ? 'text-emerald-500' : 'text-neutral-500'}`}
          >
            <User size={20} />
            <span className="text-[10px]">{TRANSLATIONS[terminalLang]?.nav?.profile || '프로필'}</span>
          </button>
          <button
            onClick={() => handleViewChange(View.SETTINGS)}
            className={`flex flex-col items-center gap-1 px-4 py-2 ${activeView === View.SETTINGS ? 'text-emerald-500' : 'text-neutral-500'}`}
          >
            <Cog size={20} />
            <span className="text-[10px]">{TRANSLATIONS[terminalLang]?.nav?.settings || '설정'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  // Keep-alive mechanism to prevent Replit autoscale spindown
  // 초기 ping은 5초 후에 실행 (앱 로딩 속도 최적화)
  useEffect(() => {
    const keepAlive = async () => {
      try {
        await fetch(resolveApiUrl('/api/health'));
      } catch (error) {
        // Silently fail - health check is best effort
      }
    };

    // Ping health endpoint every 2 minutes (reduced from 5 to prevent cold starts)
    const interval = setInterval(keepAlive, 2 * 60 * 1000);

    // 초기 ping은 5초 지연 (앱 렌더링 우선)
    const initialDelay = setTimeout(keepAlive, 5000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <CurrencyProvider>
            <AccessProvider>
              {ENV_CONFIG.isAppintos ? (
                <AdMobProvider>
                  <TooltipProvider>
                    <AppContent />
                    <DisclaimerModal />
                    <AuthModal />
                    <PWAInstallPrompt />
                    <Toaster />
                  </TooltipProvider>
                </AdMobProvider>
              ) : (
                <TooltipProvider>
                  <AppContent />
                  <DisclaimerModal />
                  <AuthModal />
                  <PWAInstallPrompt />
                  <Toaster />
                </TooltipProvider>
              )}
            </AccessProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
