// mobile/src/components/LazyImage.jsx
import React, { useState, useEffect, useRef } from 'react';
import LoadingSpinner from './LoadingSpinner';

const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  style = {}, 
  placeholder = null,
  fallback = null,
  onLoad = null,
  onError = null,
  width = '100%',
  height = 'auto',
  objectFit = 'cover',
  lazy = true,
  blur = true
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy) {
      setIsInView(true);
      return;
    }

    if (!imgRef.current) return;

    const options = {
      root: null,
      rootMargin: '50px',
      threshold: 0.01
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (observerRef.current) {
            observerRef.current.disconnect();
          }
        }
      });
    }, options);

    observerRef.current.observe(imgRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [lazy]);

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    setHasError(true);
    if (onError) onError();
  };

  const styles = {
    container: {
      width: width,
      height: height,
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: '#f1f5f9',
      borderRadius: 'inherit',
      ...style
    },
    image: {
      width: '100%',
      height: '100%',
      objectFit: objectFit,
      opacity: isLoaded ? 1 : 0,
      transition: 'opacity 0.3s ease-in-out',
      display: 'block',
      ...(blur && isLoaded ? {} : { filter: 'blur(8px) scale(1.05)' }),
    },
    placeholder: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f1f5f9',
      zIndex: 1,
    },
    shimmer: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      zIndex: 1,
    }
  };

  if (!isInView) {
    return (
      <div ref={imgRef} style={styles.container} className={className}>
        <div style={styles.placeholder}>
          {placeholder || <LoadingSpinner size="sm" fullScreen={false} message="" />}
        </div>
        <style>{`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={styles.container} className={className}>
      {!isLoaded && !hasError && (
        <div style={styles.shimmer} />
      )}
      
      {!isLoaded && !hasError && (
        <div style={styles.placeholder}>
          {placeholder || <LoadingSpinner size="sm" fullScreen={false} message="" />}
        </div>
      )}
      
      {!hasError ? (
        <img
          src={src}
          alt={alt}
          style={styles.image}
          onLoad={handleLoad}
          onError={handleError}
          loading={lazy ? 'lazy' : 'eager'}
          decoding="async"
        />
      ) : (
        <div style={styles.placeholder}>
          {fallback || (
            <div style={{ textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: '32px' }}>🖼️</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>Image unavailable</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LazyImage;