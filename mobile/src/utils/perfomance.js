// ============================================
// PERFORMANCE UTILITIES
// ============================================

// Debounce: Delay execution until after wait time
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle: Limit execution rate
export const throttle = (func, limit = 300) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Batch updates
export const batch = (func, wait = 100) => {
  let timeout;
  let items = [];
  
  return function executedFunction(item) {
    items.push(item);
    if (timeout) return;
    
    timeout = setTimeout(() => {
      func(items);
      items = [];
      timeout = null;
    }, wait);
  };
};

// Memoize: Cache function results
export const memoize = (func) => {
  const cache = new Map();
  
  return function executedFunction(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = func(...args);
    cache.set(key, result);
    return result;
  };
};

// Performance measurement
export const measurePerformance = (name) => {
  if (process.env.NODE_ENV === 'development') {
    const start = performance.now();
    return () => {
      const end = performance.now();
      console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
    };
  }
  return () => {};
};

// Lazy load component
export const lazyLoad = (importFunc) => {
  return React.lazy(() => {
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        resolve(importFunc());
      }, 100);
    });
  });
};

// Virtual scroll helper
export const getVisibleItems = (items, scrollTop, containerHeight, itemHeight) => {
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  
  return {
    startIndex,
    endIndex,
    visibleItems: items.slice(startIndex, endIndex),
    offsetY: startIndex * itemHeight
  };
};

// Performance observer
export const observePerformance = () => {
  if (typeof window === 'undefined') return;
  
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.entryType === 'largest-contentful-paint') {
        console.log('📊 LCP:', entry.startTime, 'ms');
      }
      if (entry.entryType === 'first-input') {
        console.log('📊 FID:', entry.startTime, 'ms');
      }
      if (entry.entryType === 'layout-shift') {
        console.log('📊 CLS:', entry.value);
      }
    });
  });
  
  observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
  
  return observer;
};