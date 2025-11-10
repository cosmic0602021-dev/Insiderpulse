import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import ThemeToggle from "@/components/theme-toggle";
import LanguageSelector from "@/components/language-selector";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { LanguageProvider, useLanguage } from "@/contexts/language-context";
import { AccessProvider } from "@/contexts/access-context";
import { AuthProvider } from "@/contexts/auth-context";
import { AuthModal } from "@/components/auth-modal";
import { useState, useEffect } from "react";
import LanguageSelection from "@/pages/language-selection";
import Dashboard from "@/pages/dashboard";
import Settings from "@/pages/settings";
import TradeDetail from "@/pages/trade-detail";
import Analytics from "@/pages/analytics";
import Search from "@/pages/search";
import LiveTrading from "@/pages/live-trading";
import Ranking from "@/pages/ranking";
import PasswordDemo from "@/pages/password-demo";
import EnhancedInsiderTradingDashboard from "@/components/EnhancedInsiderTradingDashboard";
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

function PublicRouter() {
  return (
    <Switch>
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
  const { t } = useLanguage();

  return (
    <Switch>
      <Route path="/trade/:tradeId" component={TradeDetail} />
      <Route path="/trades" component={LiveTrading} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/search" component={Search} />
      <Route path="/ranking" component={Ranking} />
      <Route path="/password-demo" component={PasswordDemo} />
      <Route path="/enhanced-dashboard" component={EnhancedInsiderTradingDashboard} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/settings" component={Settings} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { t, language } = useLanguage();
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const languageSelected = localStorage.getItem('language-selected');
    const savedLanguage = localStorage.getItem('language');

    if (languageSelected === 'true' || savedLanguage) {
      setHasSelectedLanguage(true);
    }
  }, []);

  const publicPaths = ['/', '/signup', '/login', '/forgot-password', '/reset-password', '/verify-code', '/verify-email', '/start-trial', '/premium-checkout'];
  const isPublicRoute = publicPaths.includes(location);

  if (!hasSelectedLanguage && !isPublicRoute) {
    return <LanguageSelection onLanguageSelected={() => setHasSelectedLanguage(true)} />;
  }

  if (isPublicRoute) {
    return <PublicRouter />;
  }

  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <header className="flex items-center justify-between p-2 sm:p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <SidebarTrigger data-testid="button-sidebar-toggle" className="flex-shrink-0" />
              <div className="text-xs sm:text-sm text-muted-foreground truncate hidden sm:block">
                {t('dashboard.lastUpdated')}: {new Date().toLocaleTimeString()}
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <LanguageSelector />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-x-hidden overflow-y-auto w-full">
            <AppRouter />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  // Keep-alive mechanism to prevent Replit autoscale spindown
  useEffect(() => {
    const keepAlive = async () => {
      try {
        await fetch('/api/health');
      } catch (error) {
        // Silently fail - health check is best effort
      }
    };

    // Ping health endpoint every 5 minutes
    const interval = setInterval(keepAlive, 5 * 60 * 1000);

    // Initial ping
    keepAlive();

    return () => clearInterval(interval);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <AccessProvider>
            <TooltipProvider>
              <AppContent />
              <AuthModal />
              <PWAInstallPrompt />
              <Toaster />
            </TooltipProvider>
          </AccessProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
