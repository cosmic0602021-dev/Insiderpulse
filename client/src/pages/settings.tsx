import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Languages, Palette, Bell, Monitor, Sun, Moon, BellOff } from 'lucide-react';
import { useLanguage, type Language } from '@/contexts/language-context';
import { useState, useEffect } from 'react';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { language, setLanguage, t } = useLanguage();
  const [theme, setTheme] = useState<string>('system');
  const { toast } = useToast();
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