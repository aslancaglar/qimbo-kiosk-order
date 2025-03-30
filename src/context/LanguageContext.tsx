
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { en } from '../translations/en';
import { fr } from '../translations/fr';

type Translations = typeof en;

interface LanguageContextType {
  language: string;
  t: Translations;
  changeLanguage: (lang: string) => void;
}

const defaultValue: LanguageContextType = {
  language: 'en',
  t: en,
  changeLanguage: () => {},
};

const LanguageContext = createContext<LanguageContextType>(defaultValue);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<string>(() => {
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || 'en';
  });
  
  const [translations, setTranslations] = useState<Translations>(language === 'en' ? en : fr);

  useEffect(() => {
    const translations = language === 'en' ? en : fr;
    setTranslations(translations);
    localStorage.setItem('language', language);
  }, [language]);

  const changeLanguage = (lang: string) => {
    setLanguage(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, t: translations, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
