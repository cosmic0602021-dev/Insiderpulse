import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useLanguage } from '@/contexts/language-context';

const logoLight = '/Gemini_Generated_Image_wdqi0fwdqi0fwdqi.png';
const logoDark = '/insiderpulse_logo1.png';

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Get token from URL query params
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError(t('auth.resetPassword.errorNoToken'));
    }
  }, [t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!newPassword || !confirmPassword) {
      setError(t('auth.resetPassword.errorRequired'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('auth.resetPassword.errorTooShort'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('auth.resetPassword.errorMismatch'));
      return;
    }

    if (!token) {
      setError(t('auth.resetPassword.errorNoToken'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.resetPassword(token, newPassword);

      if (response.success) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(response.message || t('auth.resetPassword.errorFailed'));
      }
    } catch (err: any) {
      setError(err.message || t('auth.resetPassword.errorFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <img
              className="h-12 w-auto dark:hidden"
              src={logoLight}
              alt="InsiderPulse"
            />
            <img
              className="h-12 w-auto hidden dark:block"
              src={logoDark}
              alt="InsiderPulse"
            />
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {t('auth.resetPassword.title')}
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {t('auth.resetPassword.description')}
            </p>
          </div>

          <div className="mt-8">
            {error && (
              <Alert className="mb-4 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <AlertDescription className="text-red-600 dark:text-red-400">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-600 dark:text-green-400">
                  {t('auth.resetPassword.successMessage')}
                </AlertDescription>
              </Alert>
            )}

            {!success && (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <Label htmlFor="newPassword">{t('auth.resetPassword.newPasswordLabel')}</Label>
                  <div className="mt-2">
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="block w-full"
                      placeholder={t('auth.resetPassword.newPasswordPlaceholder')}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">{t('auth.resetPassword.confirmPasswordLabel')}</Label>
                  <div className="mt-2">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full"
                      placeholder={t('auth.resetPassword.confirmPasswordPlaceholder')}
                    />
                  </div>
                </div>

                <div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || !token}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('auth.resetPassword.resetting')}
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        {t('auth.resetPassword.resetButton')}
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                    onClick={() => navigate('/login')}
                  >
                    {t('auth.resetPassword.backToLogin')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Right side - Features */}
      <div className="hidden lg:block relative flex-1 bg-gradient-to-br from-indigo-600 to-purple-700">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative h-full flex flex-col justify-center px-12">
          <div className="space-y-8">
            <h3 className="text-3xl font-bold text-white">
              {t('auth.resetPassword.secureAccount')}
            </h3>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Lock className="h-8 w-8 text-white opacity-90" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white">
                    {t('auth.resetPassword.feature1Title')}
                  </h4>
                  <p className="mt-2 text-indigo-100">
                    {t('auth.resetPassword.feature1Description')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
