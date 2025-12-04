import { useEffect } from 'react';
import { monitoring } from '@/lib/monitoring';
import { useAnalytics } from './useAnalytics';

export function useMonitoring() {
  const { sessionId } = useAnalytics();

  useEffect(() => {
    // Start periodic monitoring
    monitoring.startPeriodicMonitoring();

    // Track initial page performance
    if (typeof window !== 'undefined') {
      // Wait for page load to get accurate metrics
      if (document.readyState === 'complete') {
        setTimeout(() => {
          trackInitialMetrics();
        }, 100);
      } else {
        window.addEventListener('load', () => {
          setTimeout(() => {
            trackInitialMetrics();
          }, 100);
        });
      }
    }

    return () => {
      // Cleanup if needed
    };
  }, []);

  const trackInitialMetrics = () => {
    if (typeof window === 'undefined') return;

    // Track initial memory usage
    monitoring.trackMemoryUsage();
    
    // Track connection quality
    monitoring.trackConnectionQuality();

    // Track viewport size
    monitoring.reportMetric({
      name: 'viewport_size',
      value: window.innerWidth,
      timestamp: new Date(),
      context: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio || 1
      }
    });
  };

  const trackUserAction = (action: string, element?: string, startTime?: number) => {
    const duration = startTime ? Date.now() - startTime : undefined;
    monitoring.trackUserInteraction(action, element, duration);
  };

  const trackAPICall = async <T>(
    apiCall: Promise<T>,
    endpoint: string
  ): Promise<T> => {
    const startTime = Date.now();
    try {
      const result = await apiCall;
      const duration = Date.now() - startTime;
      monitoring.trackAPIPerformance(endpoint, duration, 200);
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const status = error?.status || error?.response?.status || 500;
      monitoring.trackAPIPerformance(endpoint, duration, status);
      
      // Track the API error
      monitoring.trackError({
        error: error instanceof Error ? error : new Error(String(error)),
        severity: 'high',
        sessionId,
        context: {
          endpoint,
          status,
          duration,
          type: 'api_error'
        }
      });
      
      throw error;
    }
  };

  const trackFormInteraction = (formName: string, fieldName: string, action: 'focus' | 'blur' | 'change') => {
    monitoring.trackUserInteraction(`form_${action}`, `${formName}.${fieldName}`);
  };

  const trackPagePerformance = (pageName: string) => {
    if (typeof window === 'undefined') return;

    // Track custom page timing
    const now = performance.now();
    monitoring.reportMetric({
      name: 'page_load_time',
      value: now,
      timestamp: new Date(),
      context: {
        page: pageName,
        url: window.location.href
      }
    });
  };

  return {
    trackUserAction,
    trackAPICall,
    trackFormInteraction,
    trackPagePerformance,
    trackError: (error: Error, severity: 'low' | 'medium' | 'high' | 'critical', context?: any) => {
      monitoring.trackError({
        error,
        severity,
        sessionId,
        context
      });
    }
  };
}