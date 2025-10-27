import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';

export default function VerifyEmail() {
  const [, navigate] = useLocation();
  const [, params] = useRoute('/verify-email');
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already-verified'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('인증 토큰이 없습니다');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email/${token}`);
        const data = await response.json();

        if (data.success) {
          if (data.alreadyVerified) {
            setStatus('already-verified');
            setMessage(data.message);
          } else {
            setStatus('success');
            setMessage(data.message);
          }
        } else {
          setStatus('error');
          setMessage(data.message || '이메일 인증에 실패했습니다');
        }
      } catch (error) {
        console.error('Email verification error:', error);
        setStatus('error');
        setMessage('이메일 인증 중 오류가 발생했습니다');
      }
    };

    verifyEmail();
  }, []);

  const handleGoToLogin = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md" data-testid="card-verify-email">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'loading' && (
              <div className="p-3 rounded-full bg-primary/10" data-testid="icon-loading">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="p-3 rounded-full bg-green-500/10" data-testid="icon-success">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
            )}
            {status === 'already-verified' && (
              <div className="p-3 rounded-full bg-blue-500/10" data-testid="icon-already-verified">
                <Mail className="h-12 w-12 text-blue-500" />
              </div>
            )}
            {status === 'error' && (
              <div className="p-3 rounded-full bg-destructive/10" data-testid="icon-error">
                <XCircle className="h-12 w-12 text-destructive" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl" data-testid="text-title">
            {status === 'loading' && '이메일 인증 중...'}
            {status === 'success' && '인증 완료!'}
            {status === 'already-verified' && '이미 인증됨'}
            {status === 'error' && '인증 실패'}
          </CardTitle>
          <CardDescription data-testid="text-message">
            {status === 'loading' && '잠시만 기다려주세요...'}
            {(status === 'success' || status === 'already-verified' || status === 'error') && message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(status === 'success' || status === 'already-verified') && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-muted-foreground text-center">
                  이제 InsiderPulse의 모든 기능을 사용할 수 있습니다
                </p>
              </div>
              <Button 
                onClick={handleGoToLogin} 
                className="w-full"
                data-testid="button-go-login"
              >
                로그인 페이지로 이동
              </Button>
            </div>
          )}
          {status === 'error' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-muted-foreground text-center">
                  인증 링크가 만료되었거나 유효하지 않습니다
                </p>
              </div>
              <Button 
                onClick={handleGoToLogin} 
                variant="outline"
                className="w-full"
                data-testid="button-back-login"
              >
                로그인 페이지로 돌아가기
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
