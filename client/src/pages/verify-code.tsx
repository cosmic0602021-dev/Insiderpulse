import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle, Mail, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

export default function VerifyCode() {
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Get email from navigation state or localStorage
  useEffect(() => {
    const storedEmail = localStorage.getItem('pendingVerificationEmail');
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      // If no email found, redirect to signup
      navigate('/signup');
    }
  }, [navigate]);

  // Handle input change
  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newCode = [...code];
    newCode[index] = value.slice(-1); // Only take last character
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
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

  // Submit verification
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');

    const codeString = code.join('');
    if (codeString.length !== 6) {
      setError('6자리 코드를 모두 입력해주세요');
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
        setSuccess(true);
        localStorage.removeItem('pendingVerificationEmail');

        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.message || '인증에 실패했습니다');
      }
    } catch (err: any) {
      setError(err.message || '인증에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend code
  const handleResend = async () => {
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
        setError(data.message || '코드 재발송에 실패했습니다');
      }
    } catch (err: any) {
      setError(err.message || '코드 재발송에 실패했습니다');
    } finally {
      setIsResending(false);
    }
  };

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (code.every(digit => digit !== '') && !isLoading) {
      handleSubmit();
    }
  }, [code, isLoading]);

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              인증 완료!
            </h2>
            <p className="text-slate-600">
              이메일 인증이 완료되었습니다.<br />
              로그인 페이지로 이동 중...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 mb-4">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              이메일 인증
            </h1>
            <p className="text-slate-600 text-sm">
              <strong>{email}</strong>으로 발송된<br />
              6자리 인증 코드를 입력하세요
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Code Input */}
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  disabled={isLoading}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {/* Info */}
            <p className="text-center text-sm text-slate-500">
              코드가 10분 동안 유효합니다
            </p>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium h-11"
              disabled={isLoading || code.join('').length !== 6}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  인증 중...
                </>
              ) : (
                '인증하기'
              )}
            </Button>

            {/* Resend */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || isResending}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                {isResending ? (
                  <>
                    <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
                    전송 중...
                  </>
                ) : resendCooldown > 0 ? (
                  `${resendCooldown}초 후 재발송 가능`
                ) : (
                  '코드 재발송'
                )}
              </button>
            </div>

            {/* Back Button */}
            <div className="text-center pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                회원가입으로 돌아가기
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
