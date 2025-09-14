import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, BellRing, Plus, TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react";
import type { InsiderTrade } from "@shared/schema";

interface Alert {
  id: string;
  type: 'VOLUME' | 'PRICE' | 'COMPANY' | 'TRADER';
  condition: string;
  value: number | string;
  isActive: boolean;
  name: string;
}

export default function Alerts() {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      type: 'VOLUME',
      condition: 'greater_than',
      value: 1000000,
      isActive: true,
      name: 'Large Trades Alert'
    },
    {
      id: '2', 
      type: 'COMPANY',
      condition: 'equals',
      value: 'Apple Inc',
      isActive: true,
      name: 'Apple Insider Activity'
    },
    {
      id: '3',
      type: 'TRADER',
      condition: 'contains',
      value: 'CEO',
      isActive: false,
      name: 'CEO Trades'
    }
  ]);

  const [newAlert, setNewAlert] = useState({
    type: 'VOLUME' as Alert['type'],
    condition: 'greater_than',
    value: '',
    name: ''
  });

  // Fetch recent trades to show alert matches
  const { data: trades = [], isLoading } = useQuery<InsiderTrade[]>({
    queryKey: ['/api/trades'],
    staleTime: 5 * 60 * 1000,
  });

  // Check which recent trades match alerts
  const getAlertMatches = () => {
    return trades.filter(trade => {
      return alerts.some(alert => {
        if (!alert.isActive) return false;
        
        switch (alert.type) {
          case 'VOLUME':
            return alert.condition === 'greater_than' && trade.totalValue > (alert.value as number);
          case 'COMPANY':
            return alert.condition === 'equals' && 
                   trade.companyName.toLowerCase().includes((alert.value as string).toLowerCase());
          case 'TRADER':
            return alert.condition === 'contains' && 
                   trade.traderTitle?.toLowerCase().includes((alert.value as string).toLowerCase());
          default:
            return false;
        }
      });
    }).slice(0, 10); // Show latest 10 matches
  };

  const alertMatches = getAlertMatches();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleAlert = (id: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, isActive: !alert.isActive } : alert
    ));
  };

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  const addAlert = () => {
    if (!newAlert.name || !newAlert.value) return;
    
    const alert: Alert = {
      id: Date.now().toString(),
      type: newAlert.type,
      condition: newAlert.condition,
      value: newAlert.type === 'VOLUME' ? parseFloat(newAlert.value) : newAlert.value,
      isActive: true,
      name: newAlert.name
    };
    
    setAlerts([...alerts, alert]);
    setNewAlert({ type: 'VOLUME', condition: 'greater_than', value: '', name: '' });
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'VOLUME': return <DollarSign className="h-4 w-4" />;
      case 'COMPANY': return <Target className="h-4 w-4" />;
      case 'TRADER': return <TrendingUp className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-alerts-title">
          {t('nav.alerts')}
        </h1>
        <p className="text-muted-foreground">
          {t('alerts.subtitle')}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Alert Management */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellRing className="h-5 w-5" />
                {t('alerts.active')} ({alerts.filter(a => a.isActive).length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('alerts.noAlerts')}</p>
                  <p className="text-sm">{t('alerts.createFirst')}</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border ${
                      alert.isActive ? 'bg-card' : 'bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          alert.isActive ? 'bg-primary/10' : 'bg-muted'
                        }`}>
                          {getAlertIcon(alert.type)}
                        </div>
                        <div>
                          <h4 className="font-medium">{alert.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {alert.type} {alert.condition.replace('_', ' ')} {alert.value}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={alert.isActive ? "default" : "secondary"}>
                          {alert.isActive ? t('alerts.active') : t('alerts.paused')}
                        </Badge>
                        <Switch
                          checked={alert.isActive}
                          onCheckedChange={() => toggleAlert(alert.id)}
                          data-testid={`toggle-alert-${alert.id}`}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAlert(alert.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          {t('general.delete')}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Create New Alert */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {t('alerts.createNew')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="alert-name">{t('alerts.alertName')}</Label>
                  <Input
                    id="alert-name"
                    placeholder={t('alerts.placeholder.name')}
                    value={newAlert.name}
                    onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
                    data-testid="input-alert-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alert-type">{t('alerts.alertType')}</Label>
                  <Select
                    value={newAlert.type}
                    onValueChange={(value: Alert['type']) => setNewAlert({ ...newAlert, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VOLUME">{t('alerts.type.volume')}</SelectItem>
                      <SelectItem value="COMPANY">{t('alerts.type.company')}</SelectItem>
                      <SelectItem value="TRADER">{t('alerts.type.trader')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="alert-condition">{t('alerts.condition')}</Label>
                  <Select
                    value={newAlert.condition}
                    onValueChange={(value) => setNewAlert({ ...newAlert, condition: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {newAlert.type === 'VOLUME' ? (
                        <>
                          <SelectItem value="greater_than">{t('alerts.condition.greaterThan')}</SelectItem>
                          <SelectItem value="less_than">{t('alerts.condition.lessThan')}</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="equals">{t('alerts.condition.equals')}</SelectItem>
                          <SelectItem value="contains">{t('alerts.condition.contains')}</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alert-value">{t('alerts.value')}</Label>
                  <Input
                    id="alert-value"
                    placeholder={
                      newAlert.type === 'VOLUME' 
                        ? "1000000" 
                        : newAlert.type === 'COMPANY'
                        ? "Apple Inc"
                        : "CEO"
                    }
                    value={newAlert.value}
                    onChange={(e) => setNewAlert({ ...newAlert, value: e.target.value })}
                    data-testid="input-alert-value"
                  />
                </div>
              </div>

              <Button onClick={addAlert} className="w-full" data-testid="button-add-alert">
                <Plus className="h-4 w-4 mr-2" />
                {t('alerts.createNew')}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Alert Matches */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('alerts.recentMatches')} ({alertMatches.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : alertMatches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t('alerts.noMatches')}</p>
                <p className="text-xs">{t('alerts.setupMatches')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alertMatches.map((trade) => (
                  <div
                    key={trade.id}
                    className="p-3 rounded-lg border bg-card hover-elevate"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {trade.tradeType === 'BUY' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <Badge variant={trade.tradeType === 'BUY' ? 'default' : 'destructive'} className="text-xs">
                        {trade.tradeType}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-sm">{trade.companyName}</h4>
                    <p className="text-xs text-muted-foreground">
                      {trade.traderName} • {trade.traderTitle}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm font-bold">
                        {formatCurrency(trade.totalValue)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(trade.filedDate)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}