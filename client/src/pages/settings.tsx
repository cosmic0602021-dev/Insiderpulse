import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Languages, Palette, Bell, Monitor, Sun, Moon, BellOff, CreditCard, ExternalLink, Ticket, CheckCircle2 } from 'lucide-react';
import { useLanguage, type Language } from '@/contexts/language-context';
import { useState, useEffect } from 'react';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest } from '@/lib/queryClient';
import { RefreshAccountButton } from '@/components/refresh-account-button';

export default function Settings() {
  const { language, setLanguage, t } = useLanguage();
  const [theme, setTheme] = useState<string>('system');
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [isRedeemingCoupon, setIsRedeemingCoupon] = useState(false);
  const {
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'system';
    setTheme(savedTheme);
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Apply theme immediately
    const isDark = newTheme === 'dark' || 
      (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const languageOptions = [
    { value: 'en' as Language, label: t('settings.language.english'), flag: '🇺🇸' },
    { value: 'ko' as Language, label: t('settings.language.korean'), flag: '🇰🇷' },
    { value: 'ja' as Language, label: t('settings.language.japanese'), flag: '🇯🇵' },
    { value: 'zh' as Language, label: t('settings.language.chinese'), flag: '🇨🇳' },
  ];

  const themeOptions = [
    { value: 'light', label: t('settings.theme.light'), icon: Sun },
    { value: 'dark', label: t('settings.theme.dark'), icon: Moon },
    { value: 'system', label: t('settings.theme.system'), icon: Monitor },
  ];

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const subscription = await subscribe();
      if (subscription) {
        toast({
          title: t('notification.permission.title'),
          description: t('notification.settings.enabled'),
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to enable notifications',
          variant: 'destructive',
        });
      }
    } else {
      const success = await unsubscribe();
      if (success) {
        toast({
          title: t('notification.permission.title'),
          description: t('notification.settings.disabled'),
        });
      }
    }
  };

  const handleManageSubscription = async () => {
    setIsLoadingPortal(true);
    try {
      const response = await apiRequest('POST', '/api/create-portal-session', {});
      const data = await response.json();

      if (data.url) {
        // Redirect to Stripe Customer Portal
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL received');
      }
    } catch (error: any) {
      console.error('Error creating portal session:', error);
      toast({
        title: '오류',
        description: error.message || '구독 관리 페이지를 열 수 없습니다.',
        variant: 'destructive',
      });
      setIsLoadingPortal(false);
    }
  };

  const handleRedeemCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: '쿠폰 코드 입력',
        description: '쿠폰 코드를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setIsRedeemingCoupon(true);
    try {
      const response = await apiRequest('POST', '/api/coupon/redeem', {
        couponCode: couponCode.trim()
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: '쿠폰 적용 성공!',
          description: data.message,
        });
        setCouponCode('');

        // Refresh user data to show updated trial end date
        await refreshUser();
      } else {
        toast({
          title: '쿠폰 적용 실패',
          description: data.message,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error redeeming coupon:', error);
      toast({
        title: '오류',
        description: '쿠폰 적용 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsRedeemingCoupon(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-settings-title">
          {t('settings.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('settings.description')}
        </p>
      </div>

      <Separator />

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            {t('settings.language')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language-select">{t('placeholder.preferredLanguage')}</Label>
            <Select value={language} onValueChange={(value: Language) => setLanguage(value)}>
              <SelectTrigger id="language-select" data-testid="select-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languageOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} data-testid={`option-language-${option.value}`}>
                    <div className="flex items-center gap-2">
                      <span>{option.flag}</span>
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {t('settings.theme')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme-select">{t('settings.themeDescription')}</Label>
            <Select value={theme} onValueChange={handleThemeChange}>
              <SelectTrigger id="theme-select" data-testid="select-theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {themeOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value} data-testid={`option-theme-${option.value}`}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Management */}
      {user && user.stripeCustomerId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Current Plan</Label>
                  <p className="text-sm text-muted-foreground">
                    {user.subscriptionTier === 'insider_pro' ? 'Insider Pro' : 'Free Plan'}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    user.subscriptionStatus === 'active' ? 'text-green-600 dark:text-green-400' :
                    user.subscriptionStatus === 'canceled' ? 'text-orange-600 dark:text-orange-400' :
                    'text-slate-600 dark:text-slate-400'
                  }`}>
                    {user.subscriptionStatus === 'active' ? '✓ Active' :
                     user.subscriptionStatus === 'canceled' ? '⚠ Cancelled' :
                     user.subscriptionStatus === 'trialing' ? '🎁 Trial' :
                     'Inactive'}
                  </p>
                  {user.subscriptionEndDate && (
                    <p className="text-xs text-muted-foreground">
                      {user.subscriptionStatus === 'canceled' ? 'Access until: ' : 'Renews: '}
                      {new Date(user.subscriptionEndDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Manage your subscription, update payment methods, view invoices, or cancel your subscription through our secure payment portal.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  onClick={handleManageSubscription}
                  disabled={isLoadingPortal}
                  className="w-full"
                  variant="outline"
                >
                  {isLoadingPortal ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Manage Subscription
                    </>
                  )}
                </Button>
                <RefreshAccountButton className="w-full" />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                💡 Click "Refresh Account" if your subscription status doesn't update automatically
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-sm">
              <p className="text-blue-900 dark:text-blue-100 text-xs">
                💡 Tip: If you cancel your subscription, you'll keep access until the end of your billing period.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coupon Redemption - only show for trialing users */}
      {user && user.subscriptionStatus === 'trialing' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              쿠폰 등록
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user.usedCoupons && (user.usedCoupons as string[]).length > 0 ? (
              // User has already used a coupon
              <>
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950 p-4 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                        쿠폰 사용 완료
                      </p>
                      <p className="text-xs text-amber-800 dark:text-amber-200">
                        계정당 1개의 쿠폰만 사용 가능합니다. 이미 <strong>{(user.usedCoupons as string[])[0]}</strong> 쿠폰을 사용하셨습니다.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">사용한 쿠폰</Label>
                  <div className="flex flex-wrap gap-2">
                    {(user.usedCoupons as string[]).map((code) => (
                      <div
                        key={code}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-medium"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {code}
                      </div>
                    ))}
                  </div>
                  {user.couponExtensionDays && (
                    <p className="text-xs text-muted-foreground">
                      💡 무료체험 기간 {user.couponExtensionDays}일 연장됨
                    </p>
                  )}
                </div>
              </>
            ) : (
              // User has not used any coupon yet
              <>
                <div className="space-y-2">
                  <Label htmlFor="coupon-code">쿠폰 코드</Label>
                  <p className="text-sm text-muted-foreground">
                    쿠폰 코드를 입력하면 무료체험 기간이 3일 연장됩니다
                  </p>
                  <div className="flex gap-2">
                    <Input
                      id="coupon-code"
                      placeholder="쿠폰 코드 입력"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleRedeemCoupon();
                        }
                      }}
                      disabled={isRedeemingCoupon}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleRedeemCoupon}
                      disabled={isRedeemingCoupon || !couponCode.trim()}
                    >
                      {isRedeemingCoupon ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                          적용 중...
                        </>
                      ) : (
                        '적용'
                      )}
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3">
                  <p className="text-blue-900 dark:text-blue-100 text-xs">
                    💡 Tip: 계정당 1개의 쿠폰만 사용 가능합니다. 신중하게 선택하세요!
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notifications Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t('notification.settings.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isSupported ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BellOff className="h-4 w-4" />
              <span>Push notifications are not supported on this device</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications-toggle">
                    {t('notification.permission.title')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('notification.permission.description')}
                  </p>
                </div>
                <Switch
                  id="notifications-toggle"
                  checked={isSubscribed}
                  onCheckedChange={handleNotificationToggle}
                  disabled={isLoading}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-sm font-medium">Notification Types</Label>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{t('notification.type.trade')}</p>
                    <p className="text-xs text-muted-foreground">
                      Get notified of large insider trades
                    </p>
                  </div>
                  <Switch
                    disabled={!isSubscribed}
                    defaultChecked={true}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{t('notification.type.pattern')}</p>
                    <p className="text-xs text-muted-foreground">
                      Get notified of unusual trading patterns
                    </p>
                  </div>
                  <Switch
                    disabled={!isSubscribed}
                    defaultChecked={true}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{t('notification.type.digest')}</p>
                    <p className="text-xs text-muted-foreground">
                      Receive weekly summary of insider activity
                    </p>
                  </div>
                  <Switch
                    disabled={!isSubscribed}
                    defaultChecked={false}
                  />
                </div>
              </div>

              {isSubscribed && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-sm">
                  <p className="text-blue-900 dark:text-blue-100">
                    ✓ {t('notification.settings.enabled')}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button data-testid="button-save-settings">
          {t('general.save')}
        </Button>
      </div>
    </div>
  );
}