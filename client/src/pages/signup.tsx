import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle, TrendingUp, Sparkles, Shield, Zap } from 'lucide-react';
import { apiClient } from '@/lib/api';
const logoLight = '/Gemini_Generated_Image_wdqi0fwdqi0fwdqi.png';
const logoDark = '/insiderpulse_logo1.png';

export default function SignupPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email || !password || !confirmPassword) {
      setError('모든 필드를 입력해주세요');
      return;
    }

    if (password.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다');
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('유효한 이메일 주소를 입력해주세요');
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.signup(email, password);
      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || '회원가입에 실패했습니다');
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
              내부자들의 투자,
              <br />
              데이터로 따라가세요
            </h1>
            <p className="text-lg text-slate-400">
              SEC 공식 파일링 기반 실시간 내부자 거래 추적
            </p>
          </div>

          <div className="mt-16 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-semibold text-white">실시간 데이터</h3>
                <p className="text-sm text-slate-400">지연 없는 즉시 업데이트</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded bg-blue-500/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-white">검증된 정보</h3>
                <p className="text-sm text-slate-400">SEC 공식 문서 기반</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded bg-amber-500/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold text-white">스마트 알림</h3>
                <p className="text-sm text-slate-400">맞춤형 거래 알림</p>
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
              계정 만들기
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              무료로 시작하세요. 카드 등록 불필요.
            </p>
          </div>
          {success ? (
            <div className="space-y-6 py-12 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  가입 완료
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  로그인 페이지로 이동합니다...
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  이메일
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  비밀번호
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="8자 이상"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  비밀번호 확인
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="비밀번호 재입력"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="h-10"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-10 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    가입 중...
                  </>
                ) : (
                  '계정 만들기'
                )}
              </Button>

              <div className="text-center text-sm">
                <span className="text-slate-600 dark:text-slate-400">이미 계정이 있으신가요?</span>{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-slate-900 dark:text-white font-medium hover:underline"
                >
                  로그인
                </button>
              </div>

              <p className="text-xs text-center text-slate-500 dark:text-slate-400 pt-4 border-t">
                가입하면{' '}
                <a href="#" className="underline hover:text-slate-900 dark:hover:text-white">이용약관</a>
                {' '}및{' '}
                <a href="#" className="underline hover:text-slate-900 dark:hover:text-white">개인정보처리방침</a>
                에 동의하게 됩니다
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
