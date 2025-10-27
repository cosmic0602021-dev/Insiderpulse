import { useState, useEffect } from "react";
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
  ticker?: string;
  createdAt?: string;
}

export default function Alerts() {
  const { t } = useLanguage();
  // localStorage에서 알림 로드
  const [alerts, setAlerts] = useState<Alert[]>(() => {
    try {
      const savedAlerts = localStorage.getItem('insiderAlerts');
      return savedAlerts ? JSON.parse(savedAlerts) : [];
    } catch (error) {
      console.error('Failed to load alerts from localStorage:', error);
      return [];
    }
  });

  const [newAlert, setNewAlert] = useState({
    type: 'VOLUME' as Alert['type'],
    condition: 'greater_than',
    value: '',
    name: ''
  });

  // alerts가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    try {
      localStorage.setItem('insiderAlerts', JSON.stringify(alerts));
    } catch (error) {
      console.error('Failed to save alerts to localStorage:', error);
    }
  }, [alerts]);

  // Fetch recent trades to show alert matches
  const { data: tradesResponse, isLoading } = useQuery<{ trades: InsiderTrade[], accessLevel: any }>({
    queryKey: ['/api/trades'],
    staleTime: 5 * 60 * 1000,
  });

  const trades = tradesResponse?.trades || [];

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

          {/* 알림 생성은 실시간 트레이드 페이지에서만 가능 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                알림 추가하기
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 space-y-3">
                <div className="flex justify-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    실시간 트레이드에서 알림 설정
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    관심있는 종목의 거래 상세 정보에서 알림 아이콘을 눌러 설정하세요
                  </p>
                </div>
                <Button
                  onClick={() => window.location.href = '/live-trading'}
                  className="mt-2"
                  variant="outline"
                >
                  실시간 트레이드로 이동
                </Button>
              </div>
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