import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, TrendingUp, Shield, Zap } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
const logoLight = '/Gemini_Generated_Image_wdqi0fwdqi0fwdqi.png';
const logoDark = '/insiderpulse_logo1.png';

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.login(email, password);

      if (response.success && response.user && response.token) {
        // Save to auth context
        login(response.user, response.token);

        // Redirect to home
        navigate('/');
      } else {
        setError(response.message || '로그인에 실패했습니다');
      }
    } catch (err: any) {
      setError(err.message || '로그인에 실패했습니다');
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
              다시 오신 것을
              <br />
              환영합니다
            </h1>
            <p className="text-lg text-slate-400">
              내부자 거래 데이터로 스마트한 투자를 이어가세요
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
              로그인
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              계정에 로그인하여 계속하세요
            </p>
          </div>

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
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  비밀번호
                </Label>
                <button
                  type="button"
                  className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  onClick={() => {/* TODO: 비밀번호 찾기 */}}
                >
                  비밀번호를 잊으셨나요?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                  로그인 중...
                </>
              ) : (
                '로그인'
              )}
            </Button>

            <div className="text-center text-sm">
              <span className="text-slate-600 dark:text-slate-400">계정이 없으신가요?</span>{' '}
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="text-slate-900 dark:text-white font-medium hover:underline"
              >
                회원가입
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
