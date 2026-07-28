import React, { createContext, useState, useContext, useEffect } from 'react';
import { getTranslation } from '../translations';

const TranslationContext = createContext();

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider');
  }
  return context;
};

export const TranslationProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('msikaai_language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('msikaai_language', language);
  }, [language]);

  const t = (key, params = {}) => {
    return getTranslation(language, key, params);
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
  };

  const value = {
    language,
    t,
    changeLanguage,
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};