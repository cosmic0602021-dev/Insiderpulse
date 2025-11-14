import { useState } from 'react';
import { useLanguage, type Language } from '@/contexts/language-context';
import { Check, TrendingUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface LanguageSelectionModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LanguageSelectionModal({ open, onClose }: LanguageSelectionModalProps) {
  const { setLanguage } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<Language | null>(null);

  const languages = [
    {
      code: 'en' as Language,
      name: 'English',
      nativeName: 'English',
      flag: '🇺🇸',
    },
    {
      code: 'ko' as Language,
      name: 'Korean',
      nativeName: '한국어',
      flag: '🇰🇷',
    },
    {
      code: 'ja' as Language,
      name: 'Japanese',
      nativeName: '日本語',
      flag: '🇯🇵',
    },
    {
      code: 'zh' as Language,
      name: 'Chinese',
      nativeName: '中文',
      flag: '🇨🇳',
    },
  ];

  const handleLanguageSelect = (lang: Language) => {
    setSelectedLang(lang);
    setLanguage(lang);
    localStorage.setItem('language-selected', 'true');

    // Close modal after short delay for visual feedback
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md bg-[#0a0a0f]/95 backdrop-blur-2xl border-white/10">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-center text-white">
            Select Your Language
          </DialogTitle>
          <DialogDescription className="text-center text-slate-400">
            Choose your preferred language for the best experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageSelect(lang.code)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                selectedLang === lang.code
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                  : 'border-white/10 hover:border-emerald-500/50 hover:bg-white/5'
              }`}
            >
              {/* Flag */}
              <div className="text-4xl">{lang.flag}</div>

              {/* Language Info */}
              <div className="flex-1 text-left">
                <div className="font-semibold text-white text-lg">
                  {lang.nativeName}
                </div>
                <div className="text-sm text-slate-400">
                  {lang.name}
                </div>
              </div>

              {/* Check Icon */}
              {selectedLang === lang.code && (
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          You can change this anytime in settings
        </div>
      </DialogContent>
    </Dialog>
  );
}
