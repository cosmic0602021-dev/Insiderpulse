import { useState, useEffect } from "react";
import { LayoutDashboard, Activity, User, Settings, Power, X, LogIn, Bell, Crown, Star } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "wouter";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { hasPremiumAccess } from "@/lib/subscription-utils";

const getMenuItems = () => [
  {
    title: "Live Trading",
    url: "/trades",
    icon: Activity,
    key: 'live-trades'
  },
  {
    title: "Top Stocks",
    url: "/ranking",
    icon: LayoutDashboard,
    key: 'ranking'
  },
  {
    title: "Profile",
    url: "/profile",
    icon: User,
    key: 'profile'
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
  const { user, logout, isAuthenticated, openAuthModal } = useAuth();
  const [, navigate] = useLocation();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

  // Check if user has premium access
  const isPro = user ? hasPremiumAccess(user) : false;

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
      const savedAlerts = localStorage.getItem('insiderAlerts');
      const alerts = savedAlerts ? JSON.parse(savedAlerts) : [];

      const existingAlertIndex = alerts.findIndex((alert: any) =>
        alert.ticker === ticker && alert.type === 'COMPANY'
      );

      if (existingAlertIndex >= 0) {
        alerts[existingAlertIndex].isActive = !alerts[existingAlertIndex].isActive;
        localStorage.setItem('insiderAlerts', JSON.stringify(alerts));
      } else {
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
    navigate('/');
  };

  const handleLoginClick = () => {
    if (openAuthModal) {
      openAuthModal('login');
    } else {
      navigate('/login');
    }
  };

  const menuItems = getMenuItems();

  return (
    <Sidebar data-testid="app-sidebar" className="bg-[#050505] border-r border-neutral-900">
      <SidebarHeader className="p-6 border-b border-neutral-900">
        <div>
          <h1 className="text-xl font-black text-neutral-200 tracking-tighter uppercase">
            Insider<span className="text-neutral-600">Pulse</span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] bg-neutral-900 text-neutral-500 px-1 py-0.5 font-mono">SIGNAL_PRO_V2.4</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-[#050505]">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[9px] font-bold text-neutral-700 uppercase px-4 mb-2 tracking-widest">
            Modules
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    asChild
                    data-active={location === item.url}
                    data-testid={`sidebar-nav-${item.key}`}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-xs font-medium transition-all border-l-2 rounded-none ${
                      location === item.url
                        ? 'bg-neutral-900/50 text-neutral-200 border-neutral-500'
                        : 'text-neutral-600 hover:text-neutral-400 border-transparent hover:bg-neutral-900/20'
                    }`}
                  >
                    <Link href={item.url}>
                      <item.icon size={14} />
                      <span className="uppercase tracking-wide">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[9px] font-bold text-neutral-700 uppercase px-4 mb-2 tracking-widest mt-8">
            Watchlist ({watchlist.length})
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-4 py-4 border border-neutral-900/50 mx-2 bg-neutral-900/20">
              {watchlist.length === 0 ? (
                <p className="text-[10px] text-neutral-600 font-mono text-center">
                  No stocks tracked.<br />
                  Add from Live Trading.
                </p>
              ) : (
                <div className="space-y-2">
                  {watchlist.slice(0, 5).map((item) => (
                    <div
                      key={item.ticker}
                      className="group flex items-center justify-between p-2 hover:bg-neutral-900/40 cursor-pointer transition-colors"
                      onClick={() => navigate('/trades')}
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-neutral-300 font-mono">{item.ticker}</span>
                        <p className="text-[9px] text-neutral-600 truncate">{item.companyName}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className={`p-1 ${isAlertActive(item.ticker) ? 'text-emerald-500' : 'text-neutral-600 hover:text-neutral-400'}`}
                          onClick={(e) => handleToggleAlert(e, item.ticker, item.companyName)}
                        >
                          <Bell size={10} className={isAlertActive(item.ticker) ? 'fill-current' : ''} />
                        </button>
                        <button
                          className="p-1 text-neutral-600 hover:text-rose-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFromWatchlist(item.ticker);
                          }}
                        >
                          <X size={10} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {watchlist.length > 5 && (
                    <p className="text-[9px] text-neutral-600 text-center mt-2">
                      +{watchlist.length - 5} more
                    </p>
                  )}
                </div>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-neutral-900 bg-[#080808]">
        {isAuthenticated && user ? (
          <>
            <div className="flex items-center gap-3 px-3 py-2 mb-2 border border-neutral-900 bg-[#050505]">
              <div className={`w-2 h-2 rounded-full ${isPro ? 'bg-emerald-900' : 'bg-amber-900'}`}></div>
              <div className="overflow-hidden flex-1">
                <div className="text-[10px] font-medium text-neutral-400 truncate font-mono">
                  {user.email?.split('@')[0] || 'USER'}
                </div>
                <div className={`text-[9px] uppercase font-bold ${isPro ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {isPro ? 'INSIDER PRO' : 'OUTSIDER'}
                </div>
              </div>
            </div>

            {!isPro && (
              <Button
                className="w-full mb-3 bg-amber-600 hover:bg-amber-500 text-black text-[10px] font-bold uppercase tracking-widest py-2"
                asChild
                data-testid="button-upgrade-premium"
              >
                <Link href="/premium-checkout">
                  <Crown size={12} className="mr-2" />
                  Upgrade to Insider
                </Link>
              </Button>
            )}

            <div className="flex items-center justify-between px-2 text-neutral-600 mt-3">
              <Link href="/settings">
                <button
                  className={`hover:text-neutral-300 transition-colors ${location === '/settings' ? 'text-white' : ''}`}
                >
                  <Settings size={14} />
                </button>
              </Link>
              <button onClick={handleLogout} className="hover:text-rose-500 transition-colors">
                <Power size={14} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between px-2">
            <div className="text-[10px] font-medium text-neutral-500 font-mono uppercase">Guest Access</div>
            <button
              onClick={handleLoginClick}
              className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-wide border border-emerald-900/30 bg-emerald-900/10 px-3 py-1.5 rounded hover:bg-emerald-900/20 transition-colors"
            >
              <LogIn size={12} />
              Login
            </button>
          </div>
        )}

        <div className="mt-3 flex items-center gap-2 text-[9px] text-neutral-700 px-2">
          <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse"></div>
          <span className="font-mono uppercase tracking-wider">Live feed active</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
