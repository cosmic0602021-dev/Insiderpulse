import { useState, useEffect } from "react";
import { BarChart3, Home, TrendingUp, AlertCircle, Settings, Search, Bell, Star, Crown, LogOut, User, X } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "wouter";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { hasPremiumAccess } from "@/lib/subscription-utils";
const logoLight = '/Gemini_Generated_Image_wdqi0fwdqi0fwdqi.png';
const logoDark = '/insiderpulse_logo1.png';

const getMenuItems = (t: (key: string) => string) => [
  {
    title: "Live Trading",
    url: "/trades",
    icon: TrendingUp,
    key: 'live-trades'
  },
  {
    title: "Top Stocks",
    url: "/ranking",
    icon: Star,
    key: 'ranking'
  },
];

interface WatchlistItem {
  ticker: string;
  companyName: string;
  addedAt: string;
}

export function AppSidebar() {
  const [location] = useLocation();
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

  // Load watchlist from localStorage
  useEffect(() => {
    const loadWatchlist = () => {
      try {
        const saved = localStorage.getItem('watchlist');
        if (saved) {
          setWatchlist(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Failed to load watchlist:', error);
      }
    };

    loadWatchlist();

    // Listen for storage changes (when watchlist is updated elsewhere)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'watchlist' && e.newValue) {
        try {
          setWatchlist(JSON.parse(e.newValue));
        } catch (error) {
          console.error('Failed to parse watchlist from storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events from the same window
    const handleWatchlistUpdate = () => {
      loadWatchlist();
    };
    window.addEventListener('watchlistUpdate', handleWatchlistUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('watchlistUpdate', handleWatchlistUpdate);
    };
  }, []);

  const handleRemoveFromWatchlist = (ticker: string) => {
    const updated = watchlist.filter(item => item.ticker !== ticker);
    setWatchlist(updated);
    localStorage.setItem('watchlist', JSON.stringify(updated));
    window.dispatchEvent(new Event('watchlistUpdate'));
  };

  const handleToggleAlert = (e: React.MouseEvent, ticker: string, companyName: string) => {
    e.stopPropagation();

    try {
      // Get existing alerts from localStorage
      const savedAlerts = localStorage.getItem('insiderAlerts');
      const alerts = savedAlerts ? JSON.parse(savedAlerts) : [];

      // Check if alert already exists for this ticker
      const existingAlertIndex = alerts.findIndex((alert: any) =>
        alert.ticker === ticker && alert.type === 'COMPANY'
      );

      if (existingAlertIndex >= 0) {
        // Toggle the alert's active status
        alerts[existingAlertIndex].isActive = !alerts[existingAlertIndex].isActive;
        localStorage.setItem('insiderAlerts', JSON.stringify(alerts));
      } else {
        // Create new alert
        const newAlert = {
          id: Date.now().toString(),
          type: 'COMPANY',
          condition: 'equals',
          value: companyName,
          ticker: ticker,
          isActive: true,
          name: `${companyName} (${ticker}) 거래 알림`,
          createdAt: new Date().toISOString()
        };
        alerts.push(newAlert);
        localStorage.setItem('insiderAlerts', JSON.stringify(alerts));
      }

      // Trigger update
      window.dispatchEvent(new Event('watchlistUpdate'));
    } catch (error) {
      console.error('Failed to toggle alert:', error);
    }
  };

  const isAlertActive = (ticker: string): boolean => {
    try {
      const savedAlerts = localStorage.getItem('insiderAlerts');
      if (!savedAlerts) return false;

      const alerts = JSON.parse(savedAlerts);
      const alert = alerts.find((a: any) => a.ticker === ticker && a.type === 'COMPANY');
      return alert?.isActive || false;
    } catch (error) {
      return false;
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const menuItems = getMenuItems(t);

  return (
    <Sidebar data-testid="app-sidebar">
      <SidebarHeader className="p-0">
        <div className="flex items-center justify-center -my-2">
          <img
            src={logoLight}
            alt="InsiderPulse"
            className="block dark:hidden h-[163px] md:h-[204px] w-auto object-contain"
            data-testid="app-logo-light"
          />
          <img
            src={logoDark}
            alt="InsiderPulse"
            className="hidden dark:block h-[163px] md:h-[204px] w-auto object-contain"
            data-testid="app-logo-dark"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton 
                    asChild 
                    data-active={location === item.url}
                    data-testid={`sidebar-nav-${item.key}`}
                  >
                    <Link href={item.url} onClick={() => {
                      console.log(`Navigation to ${item.title} clicked`);
                    }}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge className="ml-auto h-5 w-auto text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Watchlist ({watchlist.length})</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-1">
              {watchlist.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4">
                  No stocks in watchlist.<br />
                  Add stocks from Live Trading.
                </div>
              ) : (
                watchlist.map((item) => (
                  <div
                    key={item.ticker}
                    className="group flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer"
                    data-testid={`watchlist-${item.ticker.toLowerCase()}`}
                  >
                    <div
                      className="flex-1 flex flex-col min-w-0"
                      onClick={() => navigate('/trades')}
                    >
                      <span className="text-sm font-medium">{item.ticker}</span>
                      <span className="text-xs text-muted-foreground truncate">{item.companyName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-6 w-6 p-0 ${isAlertActive(item.ticker) ? 'text-blue-500' : 'opacity-0 group-hover:opacity-100'}`}
                        onClick={(e) => handleToggleAlert(e, item.ticker, item.companyName)}
                        title={isAlertActive(item.ticker) ? '알림 활성화됨' : '알림 설정'}
                      >
                        <Bell className={`h-3 w-3 ${isAlertActive(item.ticker) ? 'fill-current' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFromWatchlist(item.ticker);
                        }}
                        title="제거"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-3">
        {/* User Info */}
        {user && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.email}</p>
              <p className="text-xs text-muted-foreground">
                {user.subscriptionTier === 'insider_pro' ? 'Pro' : 'Free'}
              </p>
            </div>
          </div>
        )}

        {/* Only show upgrade button for users without premium access */}
        {user && !hasPremiumAccess(user) && (
          <Button
            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold"
            asChild
            data-testid="button-upgrade-premium"
          >
            <Link href="/premium-checkout" onClick={() => {
              console.log('[APP SIDEBAR] Upgrade button clicked. User:', {
                tier: user.subscriptionTier,
                status: user.subscriptionStatus,
                hasPremium: hasPremiumAccess(user)
              });
            }}>
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Premium
            </Link>
          </Button>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 bg-chart-2 rounded-full animate-pulse"></div>
          <span>Live data feed active</span>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="justify-start text-xs flex-1"
            asChild
            data-testid="button-settings"
          >
            <Link href="/settings" onClick={() => console.log('Settings clicked')}>
              <Settings className="h-3 w-3 mr-2" />
              {t('nav.settings')}
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start text-xs"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="h-3 w-3" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}