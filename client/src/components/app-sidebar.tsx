import { BarChart3, Home, TrendingUp, AlertCircle, Settings, Search, Bell } from "lucide-react";
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
import { useLocation } from "wouter";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Live Trades",
    url: "/trades",
    icon: TrendingUp,
    badge: "12"
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Alerts",
    url: "/alerts",
    icon: Bell,
    badge: "3"
  },
  {
    title: "Search",
    url: "/search",
    icon: Search,
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

  return (
    <Sidebar data-testid="app-sidebar">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">InsiderTrack</h2>
            <p className="text-xs text-muted-foreground">Pro Analytics</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    data-active={location === item.url}
                    data-testid={`sidebar-nav-${item.title.toLowerCase().replace(' ', '-')}`}
                  >
                    <a href={item.url} onClick={(e) => {
                      e.preventDefault();
                      console.log(`Navigation to ${item.title} clicked`);
                    }}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge className="ml-auto h-5 w-auto text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </a>
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

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 bg-chart-2 rounded-full animate-pulse"></div>
          <span>Live data feed active</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="justify-start text-xs"
          onClick={() => console.log('Settings clicked')}
          data-testid="button-settings"
        >
          <Settings className="h-3 w-3 mr-2" />
          Settings
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}