import React, { useState, useEffect } from 'react';
import { Language } from './types';
import { TRANSLATIONS } from '@/lib/translations';
import { Settings, Globe, Monitor, CreditCard, Bell, BellOff, DollarSign, CheckCircle2 } from 'lucide-react';
import { useCurrency, type Currency } from '@/contexts/currency-context';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ENV_CONFIG } from '@/lib/environment';

interface SettingsViewProps {
  lang: Language;
  setLang: (lang: Language) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ lang, setLang }) => {
  const t = TRANSLATIONS[lang].settings;
  const { currency, setCurrency } = useCurrency();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  // State
  const [theme, setTheme] = useState<string>('system');
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [isRefreshingAccount, setIsRefreshingAccount] = useState(false);

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'system';
    setTheme(savedTheme);
  }, []);

  // 테마 변경 핸들러
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    const isDark = newTheme === 'dark' ||
      (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // 계정 새로고침 핸들러
  const handleRefreshAccount = async () => {
    setIsRefreshingAccount(true);
    try {
      const success = await refreshUser();

      if (success) {
        toast({
          title: '계정 정보 갱신 완료',
          description: '최신 구독 정보로 업데이트되었습니다.',
        });
      } else {
        toast({
          title: '갱신 실패',
          description: '계정 정보를 불러올 수 없습니다.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Refresh account error:', error);
      toast({
        title: '오류',
        description: '계정 갱신 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshingAccount(false);
    }
  };

  // 구독관리 핸들러
  const handleManageSubscription = async () => {
    setIsLoadingPortal(true);
    try {
      const response = await apiRequest('POST', '/api/create-portal-session', {});
      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL received');
      }
    } catch (error: any) {
      console.error('Error creating portal session:', error);
      toast({
        title: '오류',
        description: '구독 관리 페이지를 열 수 없습니다.',
        variant: 'destructive',
      });
      setIsLoadingPortal(false);
    }
  };

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'ko', label: '한국어' },
    { code: 'ja', label: '日本語' },
    { code: 'zh', label: '中文' },
  ];

  const currencies: { code: Currency; label: string; symbol: string }[] = [
    { code: 'USD', label: 'US Dollar', symbol: '$' },
    { code: 'KRW', label: 'Korean Won', symbol: '₩' },
    { code: 'CNY', label: 'Chinese Yuan', symbol: '¥' },
    { code: 'JPY', label: 'Japanese Yen', symbol: '¥' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#050505]">
       <div className="p-6 border-b border-neutral-900">
            <h1 className="text-3xl font-light text-neutral-200 tracking-tight uppercase">{t.header}</h1>
            <p className="text-xs text-neutral-600 mt-1 mono uppercase tracking-widest">{t.subHeader}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6">
            
            {/* Language Settings */}
            <div className="bg-[#0a0a0a] border border-neutral-900 p-6 rounded-sm">
                 <div className="flex items-center gap-3 mb-4">
                    <Globe className="text-neutral-500" size={18} />
                    <h2 className="text-base font-bold text-neutral-300">{t.language}</h2>
                </div>
                <div className="relative">
                    <select 
                        value={lang} 
                        onChange={(e) => setLang(e.target.value as Language)}
                        className="w-full bg-[#050505] border border-neutral-800 text-neutral-300 p-3 text-sm focus:outline-none focus:border-neutral-600 appearance-none"
                    >
                        {languages.map(l => (
                            <option key={l.code} value={l.code}>{l.label}</option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-600 text-xs">▼</div>
                </div>
            </div>

            {/* Currency Settings */}
            <div className="bg-[#0a0a0a] border border-neutral-900 p-6 rounded-sm">
                 <div className="flex items-center gap-3 mb-4">
                    <DollarSign className="text-neutral-500" size={18} />
                    <h2 className="text-base font-bold text-neutral-300">Currency</h2>
                </div>
                <div className="relative">
                    <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as Currency)}
                        className="w-full bg-[#050505] border border-neutral-800 text-neutral-300 p-3 text-sm focus:outline-none focus:border-neutral-600 appearance-none"
                    >
                        {currencies.map(c => (
                            <option key={c.code} value={c.code}>{c.symbol} {c.label} ({c.code})</option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-600 text-xs">▼</div>
                </div>
            </div>

             {/* Theme Settings */}
             <div className="bg-[#0a0a0a] border border-neutral-900 p-6 rounded-sm">
                 <div className="flex items-center gap-3 mb-4">
                    <Monitor className="text-neutral-500" size={18} />
                    <h2 className="text-base font-bold text-neutral-300">{t.theme}</h2>
                </div>
                <div className="relative">
                    <select
                        value={theme}
                        onChange={(e) => handleThemeChange(e.target.value)}
                        className="w-full bg-[#050505] border border-neutral-800 text-neutral-300 p-3 text-sm focus:outline-none focus:border-neutral-600 appearance-none"
                    >
                       <option value="light">Light</option>
                       <option value="dark">Dark</option>
                       <option value="system">System Default</option>
                    </select>
                     <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-600 text-xs">▼</div>
                </div>
            </div>

            {/* Subscription Management Actions */}
            {ENV_CONFIG.isAppintos ? (
              <div className="bg-emerald-900/20 border border-emerald-900/50 p-6 rounded-sm">
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard className="text-emerald-500" size={18} />
                  <h2 className="text-base font-bold text-emerald-300">무료 서비스</h2>
                </div>
                <p className="text-sm text-emerald-200 leading-relaxed">
                  앱인토스에서는 InsiderPulse의 모든 기능을 무료로 이용하실 수 있습니다.
                </p>
              </div>
            ) : (
            <div className="bg-[#0a0a0a] border border-neutral-900 p-6 rounded-sm">
                 <div className="flex items-center gap-3 mb-2">
                    <CreditCard className="text-neutral-500" size={18} />
                    <h2 className="text-base font-bold text-neutral-300">{t.subManage}</h2>
                </div>

                <div className="flex justify-between items-center mb-6 text-xs border-b border-neutral-900 pb-4">
                    <span className="text-neutral-500">Current Plan: <span className="text-white">Insider Pro</span></span>
                    <span className="text-emerald-600">● Active</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={handleManageSubscription}
                        disabled={isLoadingPortal}
                        className="flex items-center justify-center gap-2 p-3 border border-neutral-800 hover:bg-neutral-900 text-neutral-300 text-xs uppercase tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoadingPortal ? (
                            <>
                                <div className="w-3 h-3 border-2 border-neutral-300 border-t-transparent rounded-full animate-spin"></div>
                                로딩중...
                            </>
                        ) : (
                            <>
                                <CreditCard size={14} /> {t.manage}
                            </>
                        )}
                    </button>
                     <button
                        onClick={handleRefreshAccount}
                        disabled={isRefreshingAccount}
                        className="flex items-center justify-center gap-2 p-3 border border-neutral-800 hover:bg-neutral-900 text-neutral-300 text-xs uppercase tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isRefreshingAccount ? (
                            <>
                                <div className="w-3 h-3 border-2 border-neutral-300 border-t-transparent rounded-full animate-spin"></div>
                                새로고침 중...
                            </>
                        ) : (
                            <>
                                <Settings size={14} /> {t.refresh}
                            </>
                        )}
                    </button>
                </div>

                <div className="mt-4 bg-indigo-900/20 border border-indigo-900/50 p-3 flex items-center gap-3">
                     <div className="w-1 h-1 bg-indigo-400 rounded-full animate-pulse"></div>
                     <p className="text-[10px] text-indigo-200">Tip: If you cancel your subscription, you'll keep access until the end of your billing period.</p>
                </div>
            </div>
            )}

             {/* Notification Settings */}
             <div className="bg-[#0a0a0a] border border-neutral-900 p-6 rounded-sm">
                 <div className="flex items-center gap-3 mb-4">
                    <Bell className="text-neutral-500" size={18} />
                    <h2 className="text-base font-bold text-neutral-300">{t.notifications}</h2>
                </div>
                <div className="flex items-center gap-3 text-neutral-600 p-4 bg-neutral-900/30 border border-neutral-900/50 border-dashed">
                    <BellOff size={16} />
                    <span className="text-xs">{t.push}</span>
                </div>
            </div>

            <div className="flex justify-end items-center gap-2 text-xs text-neutral-500">
                <CheckCircle2 size={12} className="text-emerald-500" />
                <span>{lang === 'ko' ? '변경사항이 자동으로 저장됩니다' : 'Changes saved automatically'}</span>
            </div>
        </div>
    </div>
  );
};

export default SettingsView;