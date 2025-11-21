import { useState, useEffect } from 'react';
import { X, Bell, Zap, Smartphone, Share2, Plus, Download, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { useLocation } from 'wouter';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const { t } = useLanguage();
  const [location] = useLocation();

  useEffect(() => {
    // Only show on /trades page
    if (location !== '/trades') {
      return;
    }

    // Check if card has been registered (payment completed)
    const cardRegistered = localStorage.getItem('card-registered') === 'true';
    if (!cardRegistered) {
      return;
    }

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
  }, [location]);

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
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (!showPrompt) return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  const benefits = [
    {
      icon: <Bell className="h-4 w-4" />,
      title: t('pwa.benefits.notifications.title'),
      description: t('pwa.benefits.notifications.description')
    },
    {
      icon: <Zap className="h-4 w-4" />,
      title: t('pwa.benefits.fast.title'),
      description: t('pwa.benefits.fast.description')
    },
    {
      icon: <Smartphone className="h-4 w-4" />,
      title: t('pwa.benefits.access.title'),
      description: t('pwa.benefits.access.description')
    }
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleDismiss}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 z-50 animate-in slide-in-from-bottom duration-300">
        <div className="mx-auto max-w-md px-4 pb-4">
          <div className="relative overflow-hidden bg-[#080808] border border-neutral-800 shadow-[0_0_50px_rgba(0,0,0,0.9)]">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute right-3 top-3 z-10 p-1.5 text-neutral-500 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="p-6 border-b border-neutral-900 text-center bg-[#0a0a0a]">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-neutral-900 rounded-full flex items-center justify-center border border-neutral-800 relative">
                  <div className="absolute inset-0 rounded-full border border-emerald-900 animate-ping opacity-20"></div>
                  <ShieldCheck size={24} className="text-emerald-500" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight uppercase mb-2">
                {t('pwa.prompt.title')}
              </h3>
              <p className="text-xs text-neutral-500 font-mono">
                {t('pwa.prompt.subtitle')}
              </p>
            </div>

            <div className="p-5">
              {/* Benefits */}
              <div className="mb-5 space-y-2">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-neutral-900/50 border border-neutral-800"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-emerald-900/30 border border-emerald-900/50">
                      <div className="text-emerald-500">{benefit.icon}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-neutral-200 uppercase tracking-wide">
                        {benefit.title}
                      </h4>
                      <p className="text-[10px] text-neutral-500 font-mono truncate">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* iOS Instructions */}
              {isIOS && (
                <div className="mb-5 p-4 bg-neutral-900/30 border border-neutral-800">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center bg-emerald-900/30 border border-emerald-900/50">
                      <Share2 className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="flex items-center">
                      <span className="text-neutral-600 mx-2">→</span>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center bg-emerald-900/30 border border-emerald-900/50">
                      <Plus className="h-5 w-5 text-emerald-500" />
                    </div>
                  </div>
                  <p className="text-xs text-neutral-300 font-mono leading-relaxed">
                    {t('pwa.ios.instruction')}
                  </p>
                </div>
              )}

              {/* Action button */}
              {!isIOS && (
                <button
                  onClick={handleInstall}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-black font-bold uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2"
                >
                  <Download size={14} />
                  {t('pwa.button.install')}
                </button>
              )}

              {/* Skip text */}
              <button
                onClick={handleDismiss}
                className="w-full mt-3 text-center text-[10px] text-neutral-600 hover:text-neutral-400 transition-colors uppercase tracking-wider font-mono"
              >
                나중에 하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
