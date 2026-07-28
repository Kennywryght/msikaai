// ============================================
// IMAGE OPTIMIZATION SERVICE
// ============================================

class ImageService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  // Optimize image URL for different sizes
  getOptimizedUrl(url, options = {}) {
    if (!url) return null;
    
    const { width = 400, height = 400, quality = 80, format = 'webp' } = options;
    
    // If it's a Supabase storage URL, use their transformation API
    if (url.includes('supabase.co/storage')) {
      return `${url}?width=${width}&height=${height}&quality=${quality}&format=${format}`;
    }
    
    // If it's a remote URL, use a CDN or return as is
    return url;
  }

  // Generate responsive image srcset
  getSrcSet(url, sizes = [400, 800, 1200]) {
    if (!url) return '';
    
    return sizes
      .map(size => `${this.getOptimizedUrl(url, { width: size })} ${size}w`)
      .join(', ');
  }

  // Preload critical images
  preloadImages(images) {
    images.forEach(url => {
      if (!url) return;
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
    });
  }

  // Lazy load images with Intersection Observer
  setupLazyLoading() {
    if (typeof window === 'undefined') return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      observer.observe(img);
    });

    return observer;
  }

  // Compress image before upload
  async compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Compression failed'));
            }
          }, 'image/jpeg', quality);
        };
        
        img.onerror = reject;
      };
      
      reader.onerror = reject;
    });
  }

  // Cache image
  cacheImage(url, data) {
    this.cache.set(url, { data, timestamp: Date.now() });
  }

  getCachedImage(url) {
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    return null;
  }

  // Get image placeholder color
  getPlaceholderColor(url) {
    // Generate a deterministic color from the URL
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      hash = url.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ['#dbeafe', '#fef3c7', '#d1fae5', '#fce7f3', '#e0e7ff', '#f3e8ff'];
    return colors[Math.abs(hash) % colors.length];
  }

  // Get image dimensions from URL
  async getImageDimensions(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  // Check if image is cached
  isCached(url) {
    return this.cache.has(url);
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

export default new ImageService();