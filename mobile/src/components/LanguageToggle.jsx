import React, { useState } from 'react';
import { useTranslation } from '../context/TranslationContext';

const LanguageToggle = () => {
  const { language, changeLanguage, t } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);
  
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ny', name: 'Chichewa' }
  ];
  
  const currentLanguage = languages.find(l => l.code === language) || languages[0];

  const containerStyle = {
    position: 'relative',
    display: 'inline-block'
  };

  const buttonStyle = {
    padding: '6px 12px',
    backgroundColor: 'transparent',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#374151'
  };

  const dropdownStyle = {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '4px',
    backgroundColor: 'white',
    borderRadius: '6px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    border: '1px solid #e5e7eb',
    zIndex: 1000,
    minWidth: '140px'
  };

  const itemStyle = {
    padding: '10px 16px',
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    width: '100%',
    textAlign: 'left',
    fontSize: '14px',
    color: '#374151',
    borderBottom: '1px solid #f3f4f6'
  };

  const itemActiveStyle = {
    ...itemStyle,
    backgroundColor: '#dbeafe',
    fontWeight: '600',
    color: '#1e40af'
  };

  return (
    <div style={containerStyle}>
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        style={buttonStyle}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        🌐 {currentLanguage.name}
        <span style={{ fontSize: '10px', color: '#6b7280' }}>
          {showDropdown ? '▲' : '▼'}
        </span>
      </button>

      {showDropdown && (
        <>
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999
            }}
            onClick={() => setShowDropdown(false)}
          />
          <div style={dropdownStyle}>
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  changeLanguage(lang.code);
                  setShowDropdown(false);
                }}
                style={language === lang.code ? itemActiveStyle : itemStyle}
                onMouseEnter={(e) => {
                  if (language !== lang.code) {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (language !== lang.code) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {lang.name} {language === lang.code && '✅'}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageToggle;