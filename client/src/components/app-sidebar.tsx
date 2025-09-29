import { BarChart3, Home, TrendingUp, AlertCircle, Settings, Search, Bell, Star, Crown } from "lucide-react";
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
import logoLight from "@assets/Gemini_Generated_Image_wdqi0fwdqi0fwdqi-Photoroom_1757888880167.png";
import logoDark from "@assets/inverted_with_green_1757888880166.png";

const getMenuItems = (t: (key: string) => string) => [
  {
    title: "Live Trading",
    url: "/trades",
    icon: TrendingUp,
    key: 'live-trades'
  },
  {
    title: "Alerts",
    url: "/alerts",
    icon: Bell,
    key: 'alerts'
  },
  {
    title: "Top Stocks",
    url: "/ranking",
    icon: Star,
    key: 'ranking'
  },
];

const watchlistItems = [
  { name: "AAPL", change: "+2.1%", positive: true },
  { name: "MSFT", change: "+1.8%", positive: true },
  { name: "TSLA", change: "-0.9%", positive: false },
  { name: "NVDA", change: "+3.2%", positive: true },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { t } = useLanguage();
  const menuItems = getMenuItems(t);

  return (
    <Sidebar data-testid="app-sidebar">
      <SidebarHeader className="p-0">
        <div className="flex items-center justify-center -my-2">
          <img 
            src={logoLight} 
            alt="InsiderPulse"
            className="block dark:hidden h-48 md:h-60 w-auto object-contain"
            data-testid="app-logo-light"
          />
          <img 
            src={logoDark} 
            alt="InsiderPulse"
            className="hidden dark:block h-48 md:h-60 w-auto object-contain"
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
          <SidebarGroupLabel>Watchlist</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-2">
              {watchlistItems.map((item) => (
                <div 
                  key={item.name}
                  className="flex items-center justify-between p-2 rounded-md hover-elevate cursor-pointer"
                  onClick={() => console.log(`Watchlist item ${item.name} clicked`)}
                  data-testid={`watchlist-${item.name.toLowerCase()}`}
                >
                  <span className="text-sm font-mono">{item.name}</span>
                  <span className={`text-xs ${
                    item.positive ? 'text-chart-2' : 'text-destructive'
                  }`}>
                    {item.change}
                  </span>
                </div>
              ))}
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start text-xs"
                onClick={() => console.log('Add symbol clicked')}
                data-testid="button-add-symbol"
              >
                + Add Symbol
              </Button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-3">
        <Button 
          className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold"
          asChild
          data-testid="button-upgrade-premium"
        >
          <Link href="/premium-checkout" onClick={() => console.log('Premium checkout clicked')}>
            <Crown className="h-4 w-4 mr-2" />
            Upgrade to Premium
          </Link>
        </Button>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 bg-chart-2 rounded-full animate-pulse"></div>
          <span>Live data feed active</span>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="justify-start text-xs"
          asChild
          data-testid="button-settings"
        >
          <Link href="/settings" onClick={() => console.log('Settings clicked')}>
            <Settings className="h-3 w-3 mr-2" />
            {t('nav.settings')}
          </Link>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}