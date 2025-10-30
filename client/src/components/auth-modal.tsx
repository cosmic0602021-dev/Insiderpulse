import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, X } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';

export function AuthModal() {
  const { showAuthModal, authModalMode, login, closeAuthModal } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>(authModalMode);

  // Sync mode with authModalMode
  useEffect(() => {
    setMode(authModalMode);
  }, [authModalMode]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!showAuthModal) {
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setError('');
    }
  }, [showAuthModal]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError(t('auth.login.errorRequired'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.login(email, password);

      if (response.success && response.user && response.token) {
        login(response.user, response.token);
        closeAuthModal();
      } else {
        setError(response.message || t('auth.login.errorFailed'));
      }
    } catch (err: any) {
      setError(err.message || t('auth.login.errorFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
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
      const response = await apiClient.signup(email, password);

      if (response.success) {
        // Show success message and prompt to check email
        alert(t('auth.signup.successDesc'));
        closeAuthModal();
      } else {
        setError(response.message || t('auth.signup.errorFailed'));
      }
    } catch (err: any) {
      setError(err.message || t('auth.signup.errorFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!showAuthModal) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-md p-6 relative">
        {/* Close button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">
            {mode === 'login' ? t('auth.login.title') : t('auth.signup.title')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {mode === 'login' ? t('auth.login.subtitle') : t('auth.signup.subtitle')}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.login.email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('auth.login.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.login.password')}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t('auth.login.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('auth.signup.confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t('auth.login.passwordPlaceholder')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === 'login' ? t('auth.login.signingIn') : t('auth.signup.creating')}
              </>
            ) : (
              mode === 'login' ? t('auth.login.button') : t('auth.signup.button')
            )}
          </Button>
        </form>

        {/* Switch mode */}
        <div className="mt-6 text-center text-sm">
          {mode === 'login' ? (
            <p className="text-muted-foreground">
              {t('auth.login.noAccount')}{' '}
              <button
                onClick={() => setMode('signup')}
                className="text-primary font-semibold hover:underline"
              >
                {t('auth.login.signUp')}
              </button>
            </p>
          ) : (
            <p className="text-muted-foreground">
              {t('auth.signup.haveAccount')}{' '}
              <button
                onClick={() => setMode('login')}
                className="text-primary font-semibold hover:underline"
              >
                {t('auth.signup.signIn')}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
