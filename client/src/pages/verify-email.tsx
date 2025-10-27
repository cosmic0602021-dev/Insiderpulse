import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

export default function VerifyEmail() {
  const [, navigate] = useLocation();
  const [, params] = useRoute('/verify-email');
  const { t } = useLanguage();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already-verified'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage(t('auth.verify.noToken'));
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
          setMessage(data.message || t('auth.verify.error'));
        }
      } catch (error) {
        console.error('Email verification error:', error);
        setStatus('error');
        setMessage(t('auth.verify.error'));
      }
    };

    verifyEmail();
  }, [t]);

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
            {status === 'loading' && t('auth.verify.verifying')}
            {status === 'success' && t('auth.verify.success')}
            {status === 'already-verified' && t('auth.verify.alreadyVerified')}
            {status === 'error' && t('auth.verify.error')}
          </CardTitle>
          <CardDescription data-testid="text-message">
            {status === 'loading' && t('auth.verify.loading')}
            {(status === 'success' || status === 'already-verified' || status === 'error') && message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(status === 'success' || status === 'already-verified') && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-muted-foreground text-center">
                  {t('auth.verify.successDesc')}
                </p>
              </div>
              <Button 
                onClick={handleGoToLogin} 
                className="w-full"
                data-testid="button-go-login"
              >
                {t('auth.verify.goToLogin')}
              </Button>
            </div>
          )}
          {status === 'error' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-muted-foreground text-center">
                  {t('auth.verify.errorDesc')}
                </p>
              </div>
              <Button 
                onClick={handleGoToLogin} 
                variant="outline"
                className="w-full"
                data-testid="button-back-login"
              >
                {t('auth.verify.backToLogin')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
