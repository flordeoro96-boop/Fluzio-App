import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../locales/en.json';
import es from '../locales/es.json';
import fr from '../locales/fr.json';

i18n
  .use(LanguageDetector) // Automatically detect user's language
  .use(initReactI18next) // Pass i18n to react-i18next
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr }
    },
    fallbackLng: 'en', // Fallback language if detection fails
    debug: false,
    interpolation: {
      escapeValue: false // React already escapes values
    },
    detection: {
      // Order of language detection methods - localStorage FIRST for persistence
      order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage'], // Cache user's language preference
      lookupLocalStorage: 'fluzio_language'
    }
  });

// On init, ensure saved language is applied
const savedLanguage = localStorage.getItem('fluzio_language');
if (savedLanguage && ['en', 'es', 'fr'].includes(savedLanguage)) {
  i18n.changeLanguage(savedLanguage);
}

export default i18n;
