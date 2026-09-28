// mobile/src/components/Logo.jsx
//
// Single source of truth for the Kumsika logo across the app.
//
// Usage:
//   <Logo />                            full wordmark, size 44
//   <Logo size={120} />                 full wordmark at 120px
//   <Logo variant="symbol" size={32} /> symbol only (the K)
//   <Logo href="/landing" />            wrapped in a React Router link
//   <Logo clickable={false} />          bare image, no link
//
// The full logo file already includes the "Kumsika" wordmark and
// tagline, so callers should NOT add separate text next to it.

import React from 'react';
import { Link } from 'react-router-dom';

const LOGO_FULL_SRC   = '/kumsika-logo.png';
const LOGO_SYMBOL_SRC = '/kumsika-symbol.png';

const Logo = ({
  variant = 'full',
  size,
  href,
  clickable,
  className = '',
  style = {},
  alt,
  ...rest
}) => {
  const src = variant === 'symbol' ? LOGO_SYMBOL_SRC : LOGO_FULL_SRC;

  const defaultSize = variant === 'symbol' ? 40 : 44;
  const finalSize = size || defaultSize;

  const img = (
    <img
      src={src}
      alt={alt || (variant === 'symbol' ? 'Kumsika' : 'Kumsika — Buy, Sell, Grow')}
      className={`kumsika-logo kumsika-logo-${variant} ${className}`}
      style={{
        display: 'block',
        height: `${finalSize}px`,
        width: 'auto',
        maxWidth: '100%',
        objectFit: 'contain',
        userSelect: 'none',
        WebkitUserDrag: 'none',
        ...style,
      }}
      draggable={false}
      {...rest}
    />
  );

  // If `clickable` is explicitly false, never wrap.
  // If `href` is provided, wrap in a Link.
  // Otherwise: full logo → clickable by default, symbol → not.
  const shouldLink =
    clickable === false
      ? false
      : href
      ? true
      : clickable === true
      ? true
      : variant === 'full';

  if (shouldLink) {
    return (
      <Link
        to={href || '/landing'}
        className="kumsika-logo-link"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          textDecoration: 'none',
          flexShrink: 0,
        }}
        aria-label="Kumsika home"
      >
        {img}
      </Link>
    );
  }

  return img;
};

export default Logo;