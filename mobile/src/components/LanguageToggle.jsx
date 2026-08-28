// mobile/src/components/LanguageToggle.jsx
import React, { useState } from 'react';
import { useTranslation } from '../context/TranslationContext';

const LanguageToggle = () => {
  const { language, changeLanguage, t } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);
  
  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ny', name: 'Chichewa', flag: '🇲🇼' }
  ];
  
  const currentLanguage = languages.find(l => l.code === language) || languages[0];

  return (
    <div className="relative inline-block">
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-lavender-tonic hover:bg-gray-50 transition-all text-sm font-medium text-gray-600"
      >
        <span>{currentLanguage.flag}</span>
        <span>{currentLanguage.name}</span>
        <svg 
          className={`w-3 h-3 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 z-50 bg-white rounded-xl shadow-xl border border-gray-100 min-w-[160px] py-1 animate-slide-down origin-top-right">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  changeLanguage(lang.code);
                  setShowDropdown(false);
                }}
                className={`
                  w-full text-left px-4 py-2.5 text-sm transition-colors
                  ${language === lang.code 
                    ? 'bg-lavender-tonic/20 text-champion-blue font-semibold' 
                    : 'text-gray-600 hover:bg-gray-50'}
                  flex items-center gap-2
                `}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
                {language === lang.code && (
                  <span className="ml-auto text-lavender-tonic">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageToggle;