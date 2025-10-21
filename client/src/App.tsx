import { Switch, Route } from "wouter";
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
import { useState, useEffect } from "react";
import LanguageSelection from "@/pages/language-selection";
import Dashboard from "@/pages/dashboard";
import Settings from "@/pages/settings";
import TradeDetail from "@/pages/trade-detail";
import Analytics from "@/pages/analytics";
import Alerts from "@/pages/alerts";
import Search from "@/pages/search";
import LiveTrading from "@/pages/live-trading";
import Ranking from "@/pages/ranking";
import PasswordDemo from "@/pages/password-demo";
import EnhancedInsiderTradingDashboard from "@/components/EnhancedInsiderTradingDashboard";
import PremiumCheckout from "@/pages/premium-checkout";
import PaymentSuccess from "@/pages/payment-success";
import NotFound from "@/pages/not-found";

function Router() {
  const { t } = useLanguage();
  
  return (
    <Switch>
      <Route path="/" component={LiveTrading} />
      <Route path="/trade/:tradeId" component={TradeDetail} />
      <Route path="/trades" component={LiveTrading} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/alerts" component={Alerts} />
      <Route path="/search" component={Search} />
      <Route path="/ranking" component={Ranking} />
      <Route path="/password-demo" component={PasswordDemo} />
      <Route path="/enhanced-dashboard" component={EnhancedInsiderTradingDashboard} />
      <Route path="/premium-checkout" component={PremiumCheckout} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { t, language } = useLanguage();
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);

  useEffect(() => {
    // Check if user has already selected a language
    const languageSelected = localStorage.getItem('language-selected');
    const savedLanguage = localStorage.getItem('language');

    if (languageSelected === 'true' || savedLanguage) {
      setHasSelectedLanguage(true);
    }
  }, []);


  // Show language selection screen if user hasn't selected a language
  if (!hasSelectedLanguage) {
    return <LanguageSelection onLanguageSelected={() => setHasSelectedLanguage(true)} />;
  }

  // Custom sidebar width for financial dashboard
  const style = {
    "--sidebar-width": "18rem",       // 288px for better content
    "--sidebar-width-icon": "4rem",   // default icon width
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div className="text-sm text-muted-foreground">
                {t('dashboard.lastUpdated')}: {new Date().toLocaleTimeString()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSelector />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <AppContent />
          <PWAInstallPrompt />
          <Toaster />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
