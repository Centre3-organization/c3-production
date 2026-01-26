import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

// Supported languages
export const supportedLanguages = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
] as const;

export type LanguageCode = typeof supportedLanguages[number]['code'];

// Get language direction
export const getLanguageDirection = (lang: string): 'ltr' | 'rtl' => {
  const language = supportedLanguages.find(l => l.code === lang);
  return language?.dir || 'ltr';
};

// Initialize i18next
i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Default language
    fallbackLng: 'en',
    
    // Supported languages
    supportedLngs: supportedLanguages.map(l => l.code),
    
    // Debug mode (disable in production)
    debug: import.meta.env.DEV,
    
    // Interpolation settings
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // Backend configuration for loading translation files
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    
    // Language detection configuration
    detection: {
      // Order of language detection methods
      order: ['localStorage', 'navigator', 'htmlTag'],
      
      // Keys to look for in localStorage
      lookupLocalStorage: 'centre3_language',
      
      // Cache user language in localStorage
      caches: ['localStorage'],
    },
    
    // React-specific settings
    react: {
      useSuspense: true,
    },
  });

// Function to change language and update document direction
export const changeLanguage = async (lang: LanguageCode) => {
  await i18n.changeLanguage(lang);
  
  // Update document direction for RTL support
  const dir = getLanguageDirection(lang);
  document.documentElement.dir = dir;
  document.documentElement.lang = lang;
  
  // Store preference
  localStorage.setItem('centre3_language', lang);
};

// Initialize document direction based on current language
const initDirection = () => {
  const currentLang = i18n.language || 'en';
  const dir = getLanguageDirection(currentLang);
  document.documentElement.dir = dir;
  document.documentElement.lang = currentLang;
};

// Set initial direction when i18n is ready
i18n.on('initialized', initDirection);
i18n.on('languageChanged', (lang) => {
  const dir = getLanguageDirection(lang);
  document.documentElement.dir = dir;
  document.documentElement.lang = lang;
});

export default i18n;
