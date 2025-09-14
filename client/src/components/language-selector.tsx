import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Languages } from "lucide-react";
import { useLanguage, type Language } from "@/contexts/language-context";

const languageOptions = [
  { value: 'en' as Language, label: 'English', flag: '🇺🇸' },
  { value: 'ko' as Language, label: '한국어', flag: '🇰🇷' },
  { value: 'ja' as Language, label: '日本語', flag: '🇯🇵' },
  { value: 'zh' as Language, label: '中文', flag: '🇨🇳' },
];

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  
  const currentLanguage = languageOptions.find(opt => opt.value === language);

  const handleLanguageChange = (newLanguage: Language) => {
    console.log('Language changed to:', newLanguage);
    setLanguage(newLanguage);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          data-testid="button-language-selector"
        >
          <span className="text-lg" role="img" aria-label={currentLanguage?.label}>
            {currentLanguage?.flag || '🌐'}
          </span>
          <span className="sr-only">Select language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {languageOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleLanguageChange(option.value)}
            className={`flex items-center gap-3 cursor-pointer ${
              language === option.value ? 'bg-accent' : ''
            }`}
            data-testid={`language-option-${option.value}`}
          >
            <span className="text-lg" role="img" aria-label={option.label}>
              {option.flag}
            </span>
            <span className="font-medium">{option.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}