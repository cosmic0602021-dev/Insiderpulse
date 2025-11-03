import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Mail, UserPlus, Sparkles, Lock } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useLanguage } from '@/contexts/language-context';
const logoLight = '/Gemini_Generated_Image_wdqi0fwdqi0fwdqi.png';
const logoDark = '/insiderpulse_logo1.png';

export default function SignupPage() {
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !confirmPassword) {
      setError(t('auth.signup.errorAllFields'));
      return;
    }

    if (password.length < 8) {
      setError(t('auth.signup.errorPasswordLength'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.signup.errorPasswordMatch'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('auth.signup.errorInvalidEmail'));
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.signup(email, password);
      setSuccess(true);

      // Store email for verification
      localStorage.setItem('pendingVerificationEmail', email);

      setTimeout(() => {
        navigate('/verify-code');
      }, 1500);
    } catch (err: any) {
      setError(err.message || t('auth.signup.errorFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left side - Hero */}
      <div className="hidden md:flex flex-col justify-between bg-slate-900 p-12">
        <div>
          <img src={logoDark} alt="InsiderPulse" className="h-10 w-auto mb-16" />

          <div className="space-y-6 max-w-md">
            <h1 className="text-4xl font-bold text-white leading-tight">
              {t('auth.signup.heroTitle')}
            </h1>
            <p className="text-lg text-slate-400">
              {t('auth.signup.heroDesc')}
            </p>
          </div>

          <div className="mt-16 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{t('auth.login.realtimeData')}</h3>
                <p className="text-sm text-slate-400">{t('auth.login.realtimeDesc')}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded bg-blue-500/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{t('auth.login.verifiedInfo')}</h3>
                <p className="text-sm text-slate-400">{t('auth.login.verifiedDesc')}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded bg-amber-500/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{t('auth.login.smartAlerts')}</h3>
                <p className="text-sm text-slate-400">{t('auth.login.smartAlertsDesc')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          © 2024 InsiderPulse. All rights reserved.
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex items-center justify-center p-4 bg-white dark:bg-slate-950">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <div className="mb-3 flex justify-center">
              <img src={logoLight} alt="InsiderPulse" className="h-64 w-auto block dark:hidden" />
              <img src={logoDark} alt="InsiderPulse" className="h-64 w-auto hidden dark:block" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {t('auth.signup.title')}
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              {t('auth.signup.subtitle')}
            </p>
          </div>
          {success ? (
            <div className="space-y-6 py-12 text-center" data-testid="success-message">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  가입 완료!
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  이제 7일 무료 체험을 시작하세요
                </p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                  카드 등록 페이지로 이동 중...
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {error && (
                <Alert variant="destructive" data-testid="alert-error">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t('auth.signup.email')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('auth.login.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className="h-10"
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t('auth.signup.password')}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('auth.login.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="h-10"
                  data-testid="input-password"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t('auth.signup.confirmPassword')}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t('auth.login.passwordPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="h-10"
                  data-testid="input-confirm-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-10 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 font-medium"
                disabled={isLoading}
                data-testid="button-signup"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('auth.signup.creating')}
                  </>
                ) : (
                  t('auth.signup.button')
                )}
              </Button>

              <div className="text-center text-sm">
                <span className="text-slate-600 dark:text-slate-400">{t('auth.signup.haveAccount')}</span>{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-slate-900 dark:text-white font-medium hover:underline"
                  data-testid="button-login"
                >
                  {t('auth.signup.signIn')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
