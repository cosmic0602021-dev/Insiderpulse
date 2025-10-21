import { useState, useEffect } from 'react';
import { X, Bell, Zap, Smartphone, Share2, Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const { t, language } = useLanguage();

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInstalled = localStorage.getItem('pwa-installed') === 'true';
    const isDismissed = localStorage.getItem('pwa-prompt-dismissed') === 'true';

    if (isStandalone) {
      localStorage.setItem('pwa-installed', 'true');
      return;
    }

    if (isInstalled || isDismissed) {
      return;
    }

    // Listen for the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show prompt after a short delay (better UX)
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For iOS/Safari, show prompt anyway since they don't support beforeinstallprompt
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if ((isIOS || isSafari) && !isStandalone && !isDismissed) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // For iOS/Safari, just close the prompt
      setShowPrompt(false);
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        localStorage.setItem('pwa-installed', 'true');
      }

      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Error installing PWA:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  const benefits = [
    {
      icon: <Bell className="h-5 w-5" />,
      title: t('pwa.benefits.notifications.title'),
      description: t('pwa.benefits.notifications.description')
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: t('pwa.benefits.fast.title'),
      description: t('pwa.benefits.fast.description')
    },
    {
      icon: <Smartphone className="h-5 w-5" />,
      title: t('pwa.benefits.access.title'),
      description: t('pwa.benefits.access.description')
    }
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleDismiss}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 z-50 animate-in slide-in-from-bottom duration-300">
        <div className="mx-auto max-w-md px-4 pb-safe">
          <div className="relative overflow-hidden rounded-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="p-5">
              {/* Header */}
              <div className="mb-5 text-center">
                <div className="mb-3 flex justify-center">
                  <img
                    src="/insiderpulse_logo2.png"
                    alt="InsiderPulse"
                    className="h-16 w-16 rounded-xl object-contain"
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {t('pwa.prompt.title')}
                </h3>
                <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg">
                  <p className="text-base font-bold text-white">
                    {t('pwa.prompt.subtitle')}
                  </p>
                </div>
              </div>

              {/* Benefits - Compact */}
              <div className="mb-4 space-y-2">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 p-2.5"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-blue-500/20">
                      <div className="text-blue-600 dark:text-blue-400">{benefit.icon}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {benefit.title}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* iOS Instructions */}
              {isIOS && (
                <div className="mb-4 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 p-4 border-2 border-blue-400 shadow-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                      <Share2 className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                      <Plus className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <p className="text-lg font-bold text-white leading-snug">
                    {t('pwa.ios.instruction')}
                  </p>
                </div>
              )}

              {/* Action button */}
              {!isIOS && (
                <button
                  onClick={handleInstall}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-base font-bold text-white shadow-xl shadow-blue-500/40 transition-all hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-[1.02]"
                >
                  {t('pwa.button.install')}
                </button>
              )}
            </div>

            {/* Decorative gradient */}
            <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-indigo-500/10 blur-3xl" />
          </div>
        </div>
      </div>
    </>
  );
}
