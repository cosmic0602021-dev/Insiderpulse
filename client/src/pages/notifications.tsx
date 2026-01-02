import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Bell, BellOff, BellRing, Trash2, TrendingUp, TrendingDown, Smartphone, Globe, CheckCircle2, XCircle, Clock, Download, Share, Plus, MoreVertical } from "lucide-react";
import { resolveApiUrl } from "@/lib/queryClient";
import { ENV_CONFIG } from "@/lib/environment";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

// PWA 설치 상태 및 모바일 감지
function usePWAStatus() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // 모바일/태블릿 감지
    const userAgent = navigator.userAgent.toLowerCase();
    const mobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(userAgent);
    const ios = /iphone|ipad|ipod/i.test(userAgent);
    const android = /android/i.test(userAgent);

    setIsMobile(mobile);
    setIsIOS(ios);
    setIsAndroid(android);

    // PWA 설치 여부 확인
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isIOSStandalone);
    };
    checkInstalled();

    // Android: beforeinstallprompt 이벤트 감지
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const installPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  return { isInstalled, isMobile, isIOS, isAndroid, deferredPrompt, installPWA };
}

interface NotificationSubscription {
  id: string;
  ticker: string;
  companyName: string;
  platform: 'pwa' | 'appintos';
  notifyOnBuy: boolean;
  notifyOnSell: boolean;
  isActive: boolean;
  createdAt: string;
  lastNotifiedAt: string | null;
  notificationCount: number;
}

interface NotificationLog {
  id: string;
  title: string;
  body: string;
  platform: 'pwa' | 'appintos';
  status: 'sent' | 'failed' | 'pending';
  sentAt: string;
  errorMessage: string | null;
  metadata: {
    ticker?: string;
    tradeType?: string;
    tradeId?: string;
  };
}

export default function Notifications() {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isInstalled, isMobile, isIOS, isAndroid, deferredPrompt, installPWA } = usePWAStatus();

  // Fetch user's subscriptions
  const { data: subscriptionsData, isLoading: isLoadingSubscriptions } = useQuery<{ subscriptions: NotificationSubscription[]; count: number }>({
    queryKey: ['/api/notifications/subscriptions'],
    enabled: isAuthenticated,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Fetch notification history
  const { data: logsData, isLoading: isLoadingLogs } = useQuery<{ logs: NotificationLog[]; count: number; limit: number; offset: number }>({
    queryKey: ['/api/notifications/history'],
    enabled: isAuthenticated,
    staleTime: 1 * 60 * 1000,
  });

  const subscriptions = subscriptionsData?.subscriptions || [];
  const logs = logsData?.logs || [];

  // Toggle notification type (buy/sell)
  const toggleMutation = useMutation({
    mutationFn: async ({ subscriptionId, field, value }: { subscriptionId: string; field: 'notifyOnBuy' | 'notifyOnSell'; value: boolean }) => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(resolveApiUrl(`/api/notifications/preferences/${subscriptionId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          [field]: value,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/subscriptions'] });
      toast({
        title: '설정 변경됨',
        description: '알림 설정이 업데이트되었습니다.',
      });
    },
    onError: () => {
      toast({
        title: '오류 발생',
        description: '설정 변경에 실패했습니다.',
        variant: 'destructive',
      });
    },
  });

  // Unsubscribe mutation
  const unsubscribeMutation = useMutation({
    mutationFn: async (ticker: string) => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(resolveApiUrl('/api/notifications/subscribe'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...(ENV_CONFIG.isAppintos && { 'x-appintos-env': 'true' }),
        },
        body: JSON.stringify({
          ticker,
          companyName: '', // Required by API
          action: 'unsubscribe',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to unsubscribe');
      }

      return response.json();
    },
    onSuccess: (_data, ticker) => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/subscriptions'] });
      toast({
        title: '구독 해제됨',
        description: `${ticker} 알림이 해제되었습니다.`,
      });
    },
    onError: () => {
      toast({
        title: '오류 발생',
        description: '구독 해제에 실패했습니다.',
        variant: 'destructive',
      });
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };

  const formatRelativeTime = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ko });
  };

  const getPlatformIcon = (platform: 'pwa' | 'appintos') => {
    return platform === 'pwa' ? (
      <Globe className="h-4 w-4" />
    ) : (
      <Smartphone className="h-4 w-4" />
    );
  };

  const getPlatformLabel = (platform: 'pwa' | 'appintos') => {
    return platform === 'pwa' ? 'PWA 웹앱' : '앱인토스';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default" className="bg-green-600">전송 완료</Badge>;
      case 'failed':
        return <Badge variant="destructive">실패</Badge>;
      case 'pending':
        return <Badge variant="secondary">대기 중</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <BellOff className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
              <h2 className="text-2xl font-bold">로그인이 필요합니다</h2>
              <p className="text-muted-foreground">
                알림 센터를 이용하려면 로그인해주세요.
              </p>
              <Button onClick={() => window.location.href = '/login'}>
                로그인하기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Bell className="h-8 w-8" />
          알림 센터
        </h1>
        <p className="text-muted-foreground">
          구독 중인 종목과 알림 이력을 관리하세요.
        </p>
      </div>

      {/* PWA 설치 안내 - 모바일/태블릿에서만 표시 (PC에서는 표시 안함) */}
      {isMobile && !isInstalled && !ENV_CONFIG.isAppintos && (
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
          <CardContent className="py-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-amber-500 rounded-full flex-shrink-0">
                <Download className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2 text-amber-900 dark:text-amber-100">
                  📱 앱 설치로 푸시 알림 받기
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                  모바일에서 푸시 알림을 받으려면 앱을 홈 화면에 추가하세요.
                </p>

                {isIOS ? (
                  <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3 space-y-2">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      🍎 iPhone/iPad 설치 방법:
                    </p>
                    <ol className="text-sm text-amber-800 dark:text-amber-200 space-y-1 list-decimal list-inside">
                      <li className="flex items-center gap-2">
                        <span>Safari 하단의</span>
                        <Share className="h-4 w-4 inline" />
                        <span>공유 버튼 탭</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span>아래로 스크롤 후</span>
                        <Plus className="h-4 w-4 inline" />
                        <span>"홈 화면에 추가" 선택</span>
                      </li>
                      <li>오른쪽 상단 "추가" 탭</li>
                    </ol>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                      ⚠️ Safari 브라우저에서만 가능합니다
                    </p>
                  </div>
                ) : isAndroid ? (
                  <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3 space-y-2">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      🤖 Android 설치 방법:
                    </p>
                    {deferredPrompt ? (
                      <Button
                        onClick={installPWA}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        앱 설치하기
                      </Button>
                    ) : (
                      <ol className="text-sm text-amber-800 dark:text-amber-200 space-y-1 list-decimal list-inside">
                        <li className="flex items-center gap-2">
                          <span>Chrome 우측 상단</span>
                          <MoreVertical className="h-4 w-4 inline" />
                          <span>메뉴 버튼 탭</span>
                        </li>
                        <li>"홈 화면에 추가" 또는 "앱 설치" 선택</li>
                        <li>"설치" 버튼 탭</li>
                      </ol>
                    )}
                  </div>
                ) : (
                  <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      브라우저 메뉴에서 "홈 화면에 추가" 또는 "앱 설치"를 선택하세요.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Subscriptions Management */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Subscriptions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellRing className="h-5 w-5" />
                구독 중인 종목 ({subscriptions.filter(s => s.isActive).length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingSubscriptions ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-32" />
                  ))}
                </div>
              ) : subscriptions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">구독 중인 종목이 없습니다</p>
                  <p className="text-sm mb-4">거래 상세 모달에서 알림 버튼을 눌러 구독하세요</p>
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/live-trading'}
                  >
                    실시간 트레이드로 이동
                  </Button>
                </div>
              ) : (
                subscriptions.map((subscription) => (
                  <div
                    key={subscription.id}
                    className={`p-4 rounded-lg border transition-all ${
                      subscription.isActive
                        ? 'bg-card border-border'
                        : 'bg-muted/30 border-muted opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-full ${
                          subscription.isActive ? 'bg-primary/10' : 'bg-muted'
                        }`}>
                          {subscription.isActive ? (
                            <Bell className="h-5 w-5 text-primary" />
                          ) : (
                            <BellOff className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-lg">{subscription.ticker}</h4>
                            <Badge variant="outline" className="text-xs">
                              {getPlatformIcon(subscription.platform)}
                              <span className="ml-1">{getPlatformLabel(subscription.platform)}</span>
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {subscription.companyName}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              구독일: {new Date(subscription.createdAt).toLocaleDateString('ko-KR')}
                            </span>
                            <span>•</span>
                            <span>알림 {subscription.notificationCount}회</span>
                            {subscription.lastNotifiedAt && (
                              <>
                                <span>•</span>
                                <span>최근: {formatRelativeTime(subscription.lastNotifiedAt)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => unsubscribeMutation.mutate(subscription.ticker)}
                        disabled={unsubscribeMutation.isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Notification Type Toggles */}
                    <div className="pl-14 space-y-2 border-t pt-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <label className="text-sm font-medium">매수 알림</label>
                        </div>
                        <Switch
                          checked={subscription.notifyOnBuy}
                          onCheckedChange={(checked) =>
                            toggleMutation.mutate({
                              subscriptionId: subscription.id,
                              field: 'notifyOnBuy',
                              value: checked,
                            })
                          }
                          disabled={toggleMutation.isPending || !subscription.isActive}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-red-600" />
                          <label className="text-sm font-medium">매도 알림</label>
                        </div>
                        <Switch
                          checked={subscription.notifyOnSell}
                          onCheckedChange={(checked) =>
                            toggleMutation.mutate({
                              subscriptionId: subscription.id,
                              field: 'notifyOnSell',
                              value: checked,
                            })
                          }
                          disabled={toggleMutation.isPending || !subscription.isActive}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notification History */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              최근 알림 ({logs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingLogs ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium mb-1">알림 이력이 없습니다</p>
                <p className="text-xs">
                  구독 중인 종목의 거래가 발생하면<br />
                  알림이 전송됩니다
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      {getStatusIcon(log.status)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="font-medium text-sm line-clamp-1">
                            {log.title}
                          </h5>
                          {getStatusBadge(log.status)}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {log.body}
                        </p>
                        {log.metadata?.ticker && (
                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant="outline" className="text-xs">
                              {log.metadata.ticker}
                            </Badge>
                            {log.metadata.tradeType && (
                              <Badge
                                variant={log.metadata.tradeType === 'BUY' ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {log.metadata.tradeType}
                              </Badge>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatRelativeTime(log.sentAt)}
                        </p>
                        {log.errorMessage && (
                          <p className="text-xs text-red-600 mt-1 line-clamp-1">
                            오류: {log.errorMessage}
                          </p>
                        )}
                      </div>
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
