import React from 'react';

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: Date;
  context?: Record<string, any>;
}

export interface ErrorEvent {
  error: Error;
  context?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  sessionId?: string;
}

class MonitoringService {
  private static instance: MonitoringService;
  private performanceObserver?: PerformanceObserver;
  private errorBoundaryCount = 0;

  private constructor() {
    this.initializePerformanceTracking();
    this.initializeErrorTracking();
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private initializePerformanceTracking() {
    if (typeof window === 'undefined') return;

    // Track Core Web Vitals
    this.trackCLS();
    this.trackFID();
    this.trackLCP();
    this.trackFCP();
    this.trackTTFB();

    // Track custom performance metrics
    this.trackNavigationTiming();
    this.trackResourceTiming();
  }

  private trackCLS() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
    });

    try {
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      
      // Report CLS after page becomes hidden or on page unload
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.reportMetric({
            name: 'CLS',
            value: clsValue,
            timestamp: new Date()
          });
        }
      });
    } catch (e) {
      console.warn('CLS tracking not supported');
    }
  }

  private trackFID() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const firstInput = entry as any; // Type assertion for FID
        this.reportMetric({
          name: 'FID',
          value: firstInput.processingStart - firstInput.startTime,
          timestamp: new Date()
        });
      }
    });

    try {
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch (e) {
      console.warn('FID tracking not supported');
    }
  }

  private trackLCP() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.reportMetric({
        name: 'LCP',
        value: lastEntry.startTime,
        timestamp: new Date()
      });
    });

    try {
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      console.warn('LCP tracking not supported');
    }
  }

  private trackFCP() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    const fcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.reportMetric({
            name: 'FCP',
            value: entry.startTime,
            timestamp: new Date()
          });
        }
      }
    });

    try {
      fcpObserver.observe({ type: 'paint', buffered: true });
    } catch (e) {
      console.warn('FCP tracking not supported');
    }
  }

  private trackTTFB() {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navTiming) {
        this.reportMetric({
          name: 'TTFB',
          value: navTiming.responseStart - navTiming.requestStart,
          timestamp: new Date()
        });
      }
    });
  }

  private trackNavigationTiming() {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navTiming) {
        const metrics = {
          domContentLoaded: navTiming.domContentLoadedEventEnd - navTiming.domContentLoadedEventStart,
          domInteractive: navTiming.domInteractive,
          pageLoad: navTiming.loadEventEnd,
          dnsLookup: navTiming.domainLookupEnd - navTiming.domainLookupStart,
          tcpConnect: navTiming.connectEnd - navTiming.connectStart,
          request: navTiming.responseEnd - navTiming.requestStart
        };

        Object.entries(metrics).forEach(([name, value]) => {
          this.reportMetric({
            name: `navigation_${name}`,
            value,
            timestamp: new Date()
          });
        });
      }
    });
  }

  private trackResourceTiming() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    const resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resource = entry as PerformanceResourceTiming;
        if (resource.duration > 1000) { // Track slow resources (>1s)
          this.reportMetric({
            name: 'slow_resource',
            value: resource.duration,
            timestamp: new Date(),
            context: {
              name: resource.name,
              initiatorType: resource.initiatorType,
              transferSize: resource.transferSize
            }
          });
        }
      }
    });

    try {
      resourceObserver.observe({ type: 'resource', buffered: true });
    } catch (e) {
      console.warn('Resource timing tracking not supported');
    }
  }

  private initializeErrorTracking() {
    if (typeof window === 'undefined') return;

    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError({
        error: new Error(event.message),
        severity: 'high',
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        }
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        error: new Error(event.reason),
        severity: 'high',
        context: {
          type: 'unhandled_promise_rejection',
          reason: event.reason
        }
      });
    });
  }

  async reportMetric(metric: PerformanceMetric) {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'performance_metric',
          category: 'performance',
          action: metric.name,
          value: metric.value,
          properties: {
            metricName: metric.name,
            metricValue: metric.value,
            context: metric.context,
            url: typeof window !== 'undefined' ? window.location.href : undefined,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
            connectionType: (navigator as any)?.connection?.effectiveType || 'unknown'
          }
        }),
      });
    } catch (error) {
      console.warn('Failed to report performance metric:', error);
    }
  }

  async trackError(errorEvent: ErrorEvent) {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'error_occurred',
          category: 'error',
          action: errorEvent.severity,
          label: errorEvent.error.message,
          properties: {
            errorName: errorEvent.error.name,
            errorMessage: errorEvent.error.message,
            errorStack: errorEvent.error.stack,
            severity: errorEvent.severity,
            context: errorEvent.context,
            url: typeof window !== 'undefined' ? window.location.href : undefined,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
          },
          userId: errorEvent.userId,
          sessionId: errorEvent.sessionId
        }),
      });
    } catch (error) {
      console.warn('Failed to track error:', error);
    }
  }

  trackAPIPerformance(endpoint: string, duration: number, status: number) {
    this.reportMetric({
      name: 'api_response_time',
      value: duration,
      timestamp: new Date(),
      context: {
        endpoint,
        status,
        slow: duration > 2000
      }
    });
  }

  trackUserInteraction(action: string, element?: string, duration?: number) {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'user_interaction',
        category: 'ux',
        action,
        label: element,
        value: duration,
        properties: {
          action,
          element,
          duration,
          url: typeof window !== 'undefined' ? window.location.pathname : undefined
        }
      }),
    }).catch(error => console.warn('Failed to track user interaction:', error));
  }

  trackErrorBoundary(componentName: string, error: Error) {
    this.errorBoundaryCount++;
    this.trackError({
      error,
      severity: 'critical',
      context: {
        componentName,
        errorBoundaryCount: this.errorBoundaryCount,
        type: 'react_error_boundary'
      }
    });
  }

  // Memory usage tracking
  trackMemoryUsage() {
    if (typeof window === 'undefined' || !(performance as any).memory) return;

    const memory = (performance as any).memory;
    this.reportMetric({
      name: 'memory_usage',
      value: memory.usedJSHeapSize,
      timestamp: new Date(),
      context: {
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      }
    });
  }

  // Connection quality tracking
  trackConnectionQuality() {
    if (typeof navigator === 'undefined' || !(navigator as any).connection) return;

    const connection = (navigator as any).connection;
    this.reportMetric({
      name: 'connection_quality',
      value: connection.downlink || 0,
      timestamp: new Date(),
      context: {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      }
    });
  }

  startPeriodicMonitoring() {
    // Track memory usage every 30 seconds
    setInterval(() => {
      this.trackMemoryUsage();
    }, 30000);

    // Track connection quality every 60 seconds
    setInterval(() => {
      this.trackConnectionQuality();
    }, 60000);
  }
}

export const monitoring = MonitoringService.getInstance();

// React Error Boundary HOC
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    monitoring.trackErrorBoundary(this.constructor.name, error);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-4">
          We're sorry, but something unexpected happened. Please try refreshing the page.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mr-2"
        >
          Refresh Page
        </button>
        <a
          href="https://wa.me/61415957027"
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 inline-block"
        >
          Contact Support
        </a>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-gray-500">Error Details</summary>
            <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}