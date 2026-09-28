// mobile/src/styles/theme.js
// ============================================================
// KUMSIKA THEME — v2 (Kumsika brand applied)
// JS mirror of tokens.css. Keep in sync.
// ============================================================

export const theme = {
  brand: {
    orange: '#FF5C23',
    navy:   '#0A2472',
    blue:   '#C8F3FF',
  },

  color: {
    primary:          '#0A2472',
    primaryHover:     '#081C5C',
    primaryTint:      'rgba(10, 36, 114, 0.08)',
    primaryLight:     '#1B2F82',

    accent:           '#FF5C23',
    accentHover:      '#E64A15',
    accentTint:       'rgba(255, 92, 35, 0.10)',
    accentSoft:       '#FFE8DE',

    secondary:        '#00B8E6',
    secondaryHover:   '#0092B8',
    secondaryTint:    'rgba(200, 243, 255, 0.5)',

    bg:               '#F8FAFC',
    bgSoft:           '#EEF1FA',
    surface:          '#FFFFFF',
    surfaceAlt:       '#F1F5F9',
    overlay:          'rgba(10, 36, 114, 0.55)',

    text:             '#0F172A',
    textSecondary:    '#475569',
    textMuted:        '#94A3B8',
    textInverse:      '#FFFFFF',

    border:           '#E2E8F0',
    borderStrong:     '#CBD5E1',
    divider:          'rgba(226, 232, 240, 0.7)',

    success:          '#10B981',
    successBg:        '#D1FAE5',
    warning:          '#F59E0B',
    warningBg:        '#FEF3C7',
    error:            '#DC2626',
    errorBg:          '#FEE2E2',
    info:             '#0A2472',
    infoBg:           '#EEF1FA',

    premium:          '#FF5C23',
    premiumDark:      '#E64A15',
    premiumLight:     '#FFE8DE',
    fire:             '#EA580C',
    fireBg:           '#FFF3E0',
  },

  font: {
    sans:  "'Work Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    serif: "'Fraunces', Georgia, 'Times New Roman', serif",
    mono:  "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
  },

  radius: {
    xs: '4px', sm: '6px', md: '8px', lg: '10px', xl: '12px',
    '2xl': '16px', '3xl': '20px', full: '9999px',
  },

  shadow: {
    xs: '0 1px 2px rgba(10, 36, 114, 0.04)',
    sm: '0 1px 3px rgba(10, 36, 114, 0.06), 0 1px 2px rgba(10, 36, 114, 0.04)',
    md: '0 4px 12px rgba(10, 36, 114, 0.08)',
    lg: '0 8px 24px rgba(10, 36, 114, 0.10)',
    xl: '0 12px 32px rgba(10, 36, 114, 0.14)',
    '2xl': '0 24px 60px rgba(10, 36, 114, 0.20)',
    primary: '0 6px 16px rgba(10, 36, 114, 0.25)',
    accent:  '0 6px 16px rgba(255, 92, 35, 0.25)',
    error:   '0 6px 16px rgba(220, 38, 38, 0.25)',
  },

  transition: {
    fast: '150ms ease',
    base: '250ms ease',
    slow: '350ms cubic-bezier(0.2, 0.9, 0.2, 1)',
  },
};

export const gradients = {
  primary: `linear-gradient(135deg, ${theme.color.primary} 0%, ${theme.color.primaryHover} 100%)`,
  accent:  `linear-gradient(135deg, ${theme.color.accent} 0%, ${theme.color.accentHover} 100%)`,
  premium: `linear-gradient(135deg, ${theme.color.premium} 0%, ${theme.color.premiumDark} 100%)`,
  navy:    `linear-gradient(135deg, #0A2472 0%, #040D2E 100%)`,
  blue:    `linear-gradient(135deg, #33CCFF 0%, #00B8E6 100%)`,
};

export default theme;