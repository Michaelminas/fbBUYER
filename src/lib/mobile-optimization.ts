// Mobile optimization and Progressive Web App (PWA) utilities
import { analytics } from './analytics';
import { useState, useEffect } from 'react';

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screen: {
    width: number;
    height: number;
    ratio: number;
  };
  connection: {
    type: string;
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
  performance: {
    memory: number;
    cores: number;
  };
}

class MobileOptimizer {
  private static instance: MobileOptimizer;
  private deviceInfo: DeviceInfo | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializeDeviceDetection();
    }
  }

  static getInstance(): MobileOptimizer {
    if (!MobileOptimizer.instance) {
      MobileOptimizer.instance = new MobileOptimizer();
    }
    return MobileOptimizer.instance;
  }

  private initializeDeviceDetection() {
    const screen = window.screen;
    const nav = navigator as any;
    
    this.deviceInfo = {
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      isTablet: /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent),
      isDesktop: !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      screen: {
        width: screen.width,
        height: screen.height,
        ratio: window.devicePixelRatio || 1
      },
      connection: {
        type: nav.connection?.type || 'unknown',
        effectiveType: nav.connection?.effectiveType || 'unknown',
        downlink: nav.connection?.downlink || 0,
        rtt: nav.connection?.rtt || 0
      },
      performance: {
        memory: (performance as any).memory?.usedJSHeapSize || 0,
        cores: navigator.hardwareConcurrency || 1
      }
    };

    // Track device info
    analytics.track({
      event: 'device_detected',
      category: 'performance',
      action: 'device_info',
      properties: this.deviceInfo
    });
  }

  getDeviceInfo(): DeviceInfo | null {
    return this.deviceInfo;
  }

  // Optimize images based on device capabilities
  optimizeImageUrl(baseUrl: string, options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png';
  } = {}): string {
    if (!this.deviceInfo) return baseUrl;

    const { width, height, quality = 80, format = 'webp' } = options;
    const ratio = this.deviceInfo.screen.ratio;
    
    // Adjust dimensions for device pixel ratio
    const optimizedWidth = width ? Math.round(width * ratio) : undefined;
    const optimizedHeight = height ? Math.round(height * ratio) : undefined;
    
    // For slow connections, reduce quality
    const connectionQuality = this.deviceInfo.connection.effectiveType;
    const adjustedQuality = connectionQuality === 'slow-2g' || connectionQuality === '2g' 
      ? Math.min(quality, 60) 
      : quality;

    // Build optimized URL (this would integrate with your image service)
    const params = new URLSearchParams();
    if (optimizedWidth) params.set('w', optimizedWidth.toString());
    if (optimizedHeight) params.set('h', optimizedHeight.toString());
    params.set('q', adjustedQuality.toString());
    params.set('f', format);

    return `${baseUrl}?${params.toString()}`;
  }

  // Lazy loading with intersection observer
  initializeLazyLoading() {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          if (src) {
            img.src = this.optimizeImageUrl(src, {
              width: img.width || 800,
              quality: this.deviceInfo?.connection.effectiveType === '4g' ? 90 : 70
            });
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        }
      });
    }, {
      rootMargin: '100px' // Load images 100px before they come into view
    });

    // Observe all lazy images
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }

  // Preload critical resources based on connection
  preloadCriticalResources() {
    if (!this.deviceInfo) return;

    const { connection } = this.deviceInfo;
    
    // Only preload on fast connections
    if (connection.effectiveType === '4g' || connection.downlink > 1) {
      // Preload critical CSS
      const criticalCSS = document.createElement('link');
      criticalCSS.rel = 'preload';
      criticalCSS.as = 'style';
      criticalCSS.href = '/css/critical.css';
      document.head.appendChild(criticalCSS);

      // Preload key fonts
      const fontPreload = document.createElement('link');
      fontPreload.rel = 'preload';
      fontPreload.as = 'font';
      fontPreload.href = '/fonts/main.woff2';
      fontPreload.crossOrigin = 'anonymous';
      document.head.appendChild(fontPreload);
    }
  }

  // Install service worker for PWA functionality
  async installServiceWorker(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration.scope);
      
      // Track PWA installation
      analytics.track({
        event: 'pwa_service_worker_installed',
        category: 'pwa',
        action: 'install'
      });

      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  // Handle PWA install prompt
  handlePWAInstall() {
    let deferredPrompt: any = null;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      
      // Show custom install button
      const installBtn = document.getElementById('pwa-install-btn');
      if (installBtn) {
        installBtn.style.display = 'block';
        installBtn.addEventListener('click', () => {
          if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult: any) => {
              analytics.track({
                event: 'pwa_install_prompt',
                category: 'pwa',
                action: 'prompt_result',
                label: choiceResult.outcome
              });
              deferredPrompt = null;
            });
          }
        });
      }
    });

    // Track when PWA is actually installed
    window.addEventListener('appinstalled', () => {
      analytics.track({
        event: 'pwa_installed',
        category: 'pwa',
        action: 'installed'
      });
    });
  }

  // Optimize touch interactions for mobile
  optimizeTouchInteractions() {
    if (!this.deviceInfo?.isMobile) return;

    // Add touch feedback to interactive elements
    const interactiveElements = document.querySelectorAll('button, a, [role="button"]');
    
    interactiveElements.forEach(element => {
      element.addEventListener('touchstart', () => {
        element.classList.add('touch-active');
      });
      
      element.addEventListener('touchend', () => {
        setTimeout(() => {
          element.classList.remove('touch-active');
        }, 150);
      });
    });

    // Prevent zoom on double tap for input fields
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('touchend', (e) => {
        e.preventDefault();
        (e.target as HTMLElement).focus();
      });
    });
  }

  // Performance monitoring for mobile
  startPerformanceMonitoring() {
    if (typeof window === 'undefined') return;

    // Monitor scroll performance
    let lastScrollTime = 0;
    let scrollCount = 0;
    
    window.addEventListener('scroll', () => {
      const now = performance.now();
      scrollCount++;
      
      if (now - lastScrollTime > 1000) { // Every second
        const fps = scrollCount;
        if (fps < 30) { // Poor scroll performance
          analytics.track({
            event: 'poor_scroll_performance',
            category: 'performance',
            action: 'scroll_fps',
            value: fps
          });
        }
        scrollCount = 0;
        lastScrollTime = now;
      }
    });

    // Monitor memory usage
    setInterval(() => {
      if ((performance as any).memory) {
        const memory = (performance as any).memory;
        const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        
        if (usagePercent > 80) { // High memory usage
          analytics.track({
            event: 'high_memory_usage',
            category: 'performance',
            action: 'memory_warning',
            value: usagePercent
          });
        }
      }
    }, 30000); // Every 30 seconds
  }

  // Network-aware loading
  loadBasedOnNetwork() {
    if (!this.deviceInfo) return;

    const { connection } = this.deviceInfo;
    
    // Disable heavy features on slow connections
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      // Disable animations
      document.body.classList.add('reduce-motion');
      
      // Load minimal images
      document.querySelectorAll('img').forEach(img => {
        if (img.dataset.lowRes) {
          img.src = img.dataset.lowRes;
        }
      });
      
      // Disable autoplay videos
      document.querySelectorAll('video[autoplay]').forEach(video => {
        (video as HTMLVideoElement).autoplay = false;
      });
    }
  }

  // Initialize all mobile optimizations
  initialize() {
    if (typeof window === 'undefined') return;

    this.initializeLazyLoading();
    this.preloadCriticalResources();
    this.installServiceWorker();
    this.handlePWAInstall();
    this.optimizeTouchInteractions();
    this.startPerformanceMonitoring();
    this.loadBasedOnNetwork();

    console.log('📱 Mobile optimizations initialized');
  }
}

export const mobileOptimizer = MobileOptimizer.getInstance();

// React hook for device info
export function useDeviceInfo() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

  useEffect(() => {
    setDeviceInfo(mobileOptimizer.getDeviceInfo());
  }, []);

  return deviceInfo;
}

// Utility function to check if device is mobile
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Utility to get optimal image size for device
export function getOptimalImageSize(baseWidth: number, baseHeight: number) {
  const deviceInfo = mobileOptimizer.getDeviceInfo();
  if (!deviceInfo) return { width: baseWidth, height: baseHeight };

  const { screen, isMobile } = deviceInfo;
  
  if (isMobile) {
    const maxWidth = Math.min(screen.width, 800);
    const ratio = maxWidth / baseWidth;
    return {
      width: Math.round(baseWidth * ratio),
      height: Math.round(baseHeight * ratio)
    };
  }

  return { width: baseWidth, height: baseHeight };
}