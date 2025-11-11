import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Mail, UserPlus, Sparkles, Lock, TrendingUp, Shield, Zap, CheckCircle, ArrowLeft } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
const logoLight = '/Gemini_Generated_Image_wdqi0fwdqi0fwdqi.png';
const logoDark = '/insiderpulse_logo1.png';

export default function SignupPage() {
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'signup' | 'verify' | 'success'>('signup');

  // Verification code states
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (mode === 'verify' && code.every(digit => digit !== '') && !isLoading) {
      handleVerifyCode();
    }
  }, [code, mode, isLoading]);

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

      // Switch to verification mode instead of navigating away
      setMode('verify');
      setCode(['', '', '', '', '', '']);
      // Focus first input after a brief delay to ensure render
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setError(err.message || t('auth.signup.errorFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle verification code input change
  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newCode = [...code];
    newCode[index] = value.slice(-1); // Only take last character
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace in verification code
  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste in verification code
  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...code];

    pastedData.split('').forEach((digit, index) => {
      if (index < 6) {
        newCode[index] = digit;
      }
    });

    setCode(newCode);

    // Focus last filled input or first empty
    const nextEmptyIndex = newCode.findIndex(c => !c);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
  };

  // Submit verification code
  const handleVerifyCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');

    const codeString = code.join('');
    if (codeString.length !== 6) {
      setError(t('auth.verifyCode.errorEnterAll'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: codeString }),
      });

      const data = await response.json();

      if (data.success) {
        setMode('success');
        // Auto-login after successful verification
        setTimeout(async () => {
          try {
            const loginResponse = await apiClient.login(email, password);
            if (loginResponse.success && loginResponse.user && loginResponse.token) {
              login(loginResponse.user, loginResponse.token);
              navigate('/trades');
            }
          } catch (err) {
            console.error('Auto-login failed:', err);
            // Redirect to login page if auto-login fails
            navigate('/login');
          }
        }, 1500);
      } else {
        setError(data.message || t('auth.verifyCode.errorFailed'));
      }
    } catch (err: any) {
      setError(err.message || t('auth.verifyCode.errorFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Resend verification code
  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    setIsResending(true);
    setError('');

    try {
      const response = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setResendCooldown(60);
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setError(data.message || t('auth.verifyCode.errorResend'));
      }
    } catch (err: any) {
      setError(err.message || t('auth.verifyCode.errorResend'));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left side - Hero */}
      <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600 p-12">
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
              <div className="w-12 h-12 rounded bg-pink-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-pink-500" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{t('auth.login.realtimeData')}</h3>
                <p className="text-sm text-slate-400">{t('auth.login.realtimeDesc')}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded bg-cyan-500/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-cyan-500" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{t('auth.login.verifiedInfo')}</h3>
                <p className="text-sm text-slate-400">{t('auth.login.verifiedDesc')}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded bg-violet-500/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-violet-500" />
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
          {/* Success View */}
          {mode === 'success' ? (
            <div className="space-y-6 py-12 text-center" data-testid="success-message">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {t('auth.verifyCode.successTitle')}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {t('auth.verifyCode.successDesc')}
                </p>
              </div>
            </div>
          ) : mode === 'verify' ? (
            /* Verification Code View */
            <>
              <div className="mb-6">
                <div className="mb-3 flex justify-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500">
                    <Mail className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">
                  {t('auth.verifyCode.title')}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-center text-sm">
                  <strong>{email}</strong>{t('auth.verifyCode.subtitle')}<br />
                  {t('auth.verifyCode.enterCode')}
                </p>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-4" data-testid="alert-error">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleVerifyCode} className="space-y-6">
                <div className="flex justify-center gap-2">
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="\d*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(index, e)}
                      onPaste={handleCodePaste}
                      disabled={isLoading}
                      className="w-12 h-14 text-center text-2xl font-bold border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                  {t('auth.verifyCode.codeValid')}
                </p>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-10 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium"
                  disabled={isLoading || code.join('').length !== 6}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('auth.verifyCode.verifying')}
                    </>
                  ) : (
                    t('auth.verifyCode.verify')
                  )}
                </Button>

                {/* Resend */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || isResending}
                    className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 font-medium disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
                        {t('auth.verifyCode.resending')}
                      </>
                    ) : resendCooldown > 0 ? (
                      t('auth.verifyCode.resendIn', { seconds: resendCooldown })
                    ) : (
                      t('auth.verifyCode.resendCode')
                    )}
                  </button>
                </div>

                {/* Back Button */}
                <div className="text-center pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {t('auth.verifyCode.backToSignup')}
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* Signup Form View */
            <>
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
            </>
          )}

          {mode === 'signup' && (
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
                className="w-full h-10 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium"
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
                  className="text-purple-600 dark:text-purple-400 font-medium hover:underline"
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
