import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, X, Mail, CheckCircle, ArrowLeft, Lock, Globe, ShieldCheck, ArrowRight } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';

export function AuthModal() {
  const [, navigate] = useLocation();
  const { showAuthModal, authModalMode, login, closeAuthModal } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'signup' | 'verify'>(authModalMode);

  // Verification code states
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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
      setCode(['', '', '', '', '', '']);
      setVerificationSuccess(false);
    }
  }, [showAuthModal]);

  // Cooldown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

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
        login(response.user as any, response.token);
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
        // Switch to verification mode instead of closing modal
        setMode('verify');
        setCode(['', '', '', '', '', '']);
        // Focus first input after a brief delay to ensure render
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 100);
      } else {
        setError(response.message || t('auth.signup.errorFailed'));
      }
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
        setVerificationSuccess(true);
        // Auto-login after successful verification
        setTimeout(async () => {
          try {
            const loginResponse = await apiClient.login(email, password);
            if (loginResponse.success && loginResponse.user && loginResponse.token) {
              login(loginResponse.user as any, loginResponse.token);
              closeAuthModal();
            }
          } catch (err) {
            console.error('Auto-login failed:', err);
            // Still close modal, user can login manually
            closeAuthModal();
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

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (mode === 'verify' && code.every(digit => digit !== '') && !isLoading) {
      handleVerifyCode();
    }
  }, [code, mode, isLoading]);

  if (!showAuthModal) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#080808] border border-neutral-800 rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.8)] w-full max-w-md p-6 relative">
        {/* Close button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-neutral-600 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Verification Success View */}
        {verificationSuccess ? (
          <div className="space-y-6 py-12 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-emerald-900/50 border border-emerald-900 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-emerald-500" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-neutral-200 mb-2 uppercase tracking-wide">
                {t('auth.verifyCode.successTitle')}
              </h3>
              <p className="text-neutral-500 text-sm font-mono">
                {t('auth.verifyCode.successDesc')}
              </p>
            </div>
          </div>
        ) : mode === 'verify' ? (
          /* Verification Code View */
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 mb-4">
                <Mail className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-neutral-200 uppercase tracking-wide">
                {t('auth.verifyCode.title')}
              </h2>
              <p className="text-sm text-neutral-500 font-mono">
                <strong className="text-neutral-300">{email}</strong>{t('auth.verifyCode.subtitle')}<br />
                {t('auth.verifyCode.enterCode')}
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Code Input */}
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
                    className="w-12 h-14 text-center text-2xl font-bold font-mono border border-neutral-800 rounded focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-[#0a0a0a] text-neutral-200"
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              <p className="text-center text-sm text-neutral-600 font-mono">
                {t('auth.verifyCode.codeValid')}
              </p>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-emerald-900/20 hover:bg-emerald-900/30 border border-emerald-900/50 text-emerald-500 font-bold uppercase tracking-widest py-3 text-xs"
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
                  className="text-sm text-emerald-600 hover:text-emerald-500 font-medium disabled:text-neutral-600 disabled:cursor-not-allowed font-mono"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
                      {t('auth.verifyCode.resending')}
                    </>
                  ) : resendCooldown > 0 ? (
                    `${t('auth.verifyCode.resendIn')} ${resendCooldown}s`
                  ) : (
                    t('auth.verifyCode.resendCode')
                  )}
                </button>
              </div>

              {/* Back Button */}
              <div className="text-center pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-sm text-neutral-500 hover:text-neutral-300 inline-flex items-center gap-1 font-mono"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t('auth.verifyCode.backToSignup')}
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Login/Signup Form View */
          <>
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="w-16 h-16 mx-auto bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center mb-6">
                <Lock className="h-6 w-6 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-neutral-200 uppercase tracking-wide">
                {mode === 'login' ? t('auth.login.title') : t('auth.signup.title')}
              </h2>
              <p className="text-sm text-neutral-500 font-mono">
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
            <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-neutral-400 text-xs uppercase tracking-wider">{t('auth.login.email')}</Label>
                <div className="relative">
                  <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('auth.login.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="bg-[#0a0a0a] border-neutral-800 text-neutral-200 pl-10 font-mono placeholder:text-neutral-700 focus:border-emerald-600 focus:ring-emerald-600/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-neutral-400 text-xs uppercase tracking-wider">{t('auth.login.password')}</Label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      className="text-[10px] text-neutral-500 hover:text-neutral-300"
                      onClick={() => {
                        closeAuthModal();
                        navigate('/forgot-password');
                      }}
                    >
                      {t('auth.login.forgotPassword')}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={t('auth.login.passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="bg-[#0a0a0a] border-neutral-800 text-neutral-200 pl-10 font-mono placeholder:text-neutral-700 focus:border-emerald-600 focus:ring-emerald-600/20"
                  />
                </div>
              </div>

              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-neutral-400 text-xs uppercase tracking-wider">{t('auth.signup.confirmPassword')}</Label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder={t('auth.login.passwordPlaceholder')}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      className="bg-[#0a0a0a] border-neutral-800 text-neutral-200 pl-10 font-mono placeholder:text-neutral-700 focus:border-emerald-600 focus:ring-emerald-600/20"
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-emerald-900/20 hover:bg-emerald-900/30 border border-emerald-900/50 text-emerald-500 font-bold uppercase tracking-widest py-3 text-xs mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === 'login' ? t('auth.login.signingIn') : t('auth.signup.creating')}
                  </>
                ) : (
                  <>
                    {mode === 'login' ? t('auth.login.button') : t('auth.signup.button')}
                    <ArrowRight size={14} className="ml-2" />
                  </>
                )}
              </Button>
            </form>

            {/* Switch mode */}
            <div className="mt-8 flex justify-between items-center border-t border-neutral-800 pt-6">
              <button
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors uppercase tracking-wider font-bold"
              >
                {mode === 'login' ? t('auth.login.noAccount') : t('auth.signup.haveAccount')}
              </button>

              <div className="flex items-center gap-2 text-neutral-700">
                <ShieldCheck size={12} />
                <span className="text-[9px] font-mono">AES-256</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
