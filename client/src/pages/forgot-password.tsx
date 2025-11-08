import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useLanguage } from '@/contexts/language-context';

const logoLight = '/Gemini_Generated_Image_wdqi0fwdqi0fwdqi.png';
const logoDark = '/insiderpulse_logo1.png';

export default function ForgotPasswordPage() {
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError(t('auth.forgotPassword.errorEmailRequired'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.requestPasswordReset(email);

      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.message || t('auth.forgotPassword.errorFailed'));
      }
    } catch (err: any) {
      setError(err.message || t('auth.forgotPassword.errorFailed'));
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
              {t('auth.forgotPassword.title')}
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {t('auth.forgotPassword.description')}
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
                  {t('auth.forgotPassword.successMessage')}
                </AlertDescription>
              </Alert>
            )}

            {!success ? (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <Label htmlFor="email">{t('auth.forgotPassword.emailLabel')}</Label>
                  <div className="mt-2">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full"
                      placeholder={t('auth.forgotPassword.emailPlaceholder')}
                    />
                  </div>
                </div>

                <div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('auth.forgotPassword.sending')}
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        {t('auth.forgotPassword.sendButton')}
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    className="flex items-center text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                    onClick={() => navigate('/login')}
                  >
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    {t('auth.forgotPassword.backToLogin')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('auth.forgotPassword.checkEmail')}
                </p>
                <Button
                  variant="outline"
                  onClick={() => navigate('/login')}
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('auth.forgotPassword.backToLogin')}
                </Button>
              </div>
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
              {t('auth.forgotPassword.secureReset')}
            </h3>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Mail className="h-8 w-8 text-white opacity-90" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white">
                    {t('auth.forgotPassword.feature1Title')}
                  </h4>
                  <p className="mt-2 text-indigo-100">
                    {t('auth.forgotPassword.feature1Description')}
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
