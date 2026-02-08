import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { supportedLanguages, changeLanguage, type LanguageCode } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface LanguageSelectorProps {
  variant?: 'default' | 'minimal' | 'icon-only';
  className?: string;
  /** Use modal mode for dropdowns inside fixed/absolute positioned containers */
  modal?: boolean;
}

export function LanguageSelector({ variant = 'default', className, modal = false }: LanguageSelectorProps) {
  const { i18n, t } = useTranslation();
  const currentLang = supportedLanguages.find(l => l.code === i18n.language) || supportedLanguages[0];

  const handleLanguageChange = async (langCode: LanguageCode) => {
    await changeLanguage(langCode);
  };

  if (variant === 'icon-only') {
    return (
      <DropdownMenu modal={modal}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-9 w-9', className)}
            aria-label={t('language.selectLanguage')}
          >
            <Globe className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="min-w-[140px] z-[9999] bg-popover"
          sideOffset={5}
        >
          {supportedLanguages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={cn(
                'cursor-pointer justify-between',
                i18n.language === lang.code && 'bg-accent'
              )}
            >
              <span>{lang.nativeName}</span>
              {i18n.language === lang.code && (
                <span className="text-primary">✓</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === 'minimal') {
    return (
      <DropdownMenu modal={modal}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn('gap-1.5 px-2', className)}
          >
            <Globe className="h-4 w-4" />
            <span className="text-sm font-medium uppercase">{currentLang.code}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="min-w-[140px] z-[9999] bg-popover"
          sideOffset={5}
        >
          {supportedLanguages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={cn(
                'cursor-pointer justify-between',
                i18n.language === lang.code && 'bg-accent'
              )}
            >
              <span>{lang.nativeName}</span>
              {i18n.language === lang.code && (
                <span className="text-primary">✓</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Default variant with full language name
  return (
    <DropdownMenu modal={modal}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('gap-2', className)}
        >
          <Globe className="h-4 w-4" />
          <span>{currentLang.nativeName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="min-w-[160px] z-[9999] bg-popover"
        sideOffset={5}
      >
        {supportedLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={cn(
              'cursor-pointer justify-between',
              i18n.language === lang.code && 'bg-accent'
            )}
          >
            <div className="flex flex-col">
              <span className="font-medium">{lang.nativeName}</span>
              <span className="text-xs text-[#6B6B6B]">{lang.name}</span>
            </div>
            {i18n.language === lang.code && (
              <span className="text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Simple toggle button for switching between EN and AR
export function LanguageToggle({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  
  const toggleLanguage = async () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    await changeLanguage(newLang as LanguageCode);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className={cn('gap-1.5 px-2 font-medium', className)}
    >
      <Globe className="h-4 w-4" />
      <span>{i18n.language === 'en' ? 'AR' : 'EN'}</span>
    </Button>
  );
}
