import { useState } from 'react';
import { useLanguage, type Language } from '@/contexts/language-context';
import { Check } from 'lucide-react';

interface LanguageSelectionProps {
  onLanguageSelected?: () => void;
}

export default function LanguageSelection({ onLanguageSelected }: LanguageSelectionProps) {
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

    // Notify parent component after short delay
    setTimeout(() => {
      if (onLanguageSelected) {
        onLanguageSelected();
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/insiderpulse_logo1.png"
            alt="InsiderPulse Pro"
            className="h-56 mx-auto mb-6"
          />
          <p className="text-gray-200 text-lg font-medium">
            Select your language
          </p>
        </div>

        {/* Language Selection Cards */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-6">
          <div className="space-y-3">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  selectedLang === lang.code
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-gray-700 hover:border-green-500/50 hover:bg-gray-700/50'
                }`}
              >
                {/* Flag */}
                <div className="text-4xl">{lang.flag}</div>

                {/* Language Info */}
                <div className="flex-1 text-left">
                  <div className="font-semibold text-white">
                    {lang.nativeName}
                  </div>
                  <div className="text-sm text-gray-400">
                    {lang.name}
                  </div>
                </div>

                {/* Check Icon */}
                {selectedLang === lang.code && (
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            You can change this later in settings
          </div>
        </div>
      </div>
    </div>
  );
}
