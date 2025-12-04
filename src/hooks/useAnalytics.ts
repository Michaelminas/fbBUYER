'use client';

import { useEffect, useState } from 'react';
import { type AnalyticsEventData, type ClientInfo } from '@/lib/analytics';

// Generate session ID for tracking user session
function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Get or create session ID from sessionStorage
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

// Get client information for analytics
function getClientInfo(): ClientInfo {
  if (typeof window === 'undefined') {
    return {
      screenWidth: undefined,
      screenHeight: undefined,
      userAgent: undefined,
      ipAddress: undefined
    };
  }

  return {
    screenWidth: window.screen?.width,
    screenHeight: window.screen?.height,
    userAgent: navigator.userAgent,
    // IP address will be determined server-side
    ipAddress: undefined
  };
}

export function useAnalytics() {
  const [sessionId] = useState(() => getSessionId());
  const [clientInfo] = useState(() => getClientInfo());
  const [pageStartTime] = useState(() => Date.now());
  const [scrollDepth, setScrollDepth] = useState(0);
  const [mouseActivity, setMouseActivity] = useState({ moves: 0, clicks: 0 });

  // Enhanced tracking on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Track page view
      trackPageView(window.location.pathname);
      
      // Track site visit (only once per session)
      const hasTrackedVisit = sessionStorage.getItem('has_tracked_site_visit');
      if (!hasTrackedVisit) {
        trackSiteVisit();
        sessionStorage.setItem('has_tracked_site_visit', 'true');
      }

      // Track scroll depth
      const handleScroll = () => {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        const currentDepth = Math.round((window.scrollY / totalHeight) * 100);
        if (currentDepth > scrollDepth) {
          setScrollDepth(currentDepth);
        }
      };

      // Track mouse activity
      let mouseMoves = 0;
      let mouseClicks = 0;
      
      const handleMouseMove = () => {
        mouseMoves++;
        if (mouseMoves % 50 === 0) { // Track every 50 moves to avoid spam
          setMouseActivity(prev => ({ ...prev, moves: mouseMoves }));
        }
      };
      
      const handleMouseClick = () => {
        mouseClicks++;
        setMouseActivity(prev => ({ ...prev, clicks: mouseClicks }));
      };

      // Add event listeners
      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('click', handleMouseClick, { passive: true });

      // Track page unload with engagement data
      const handleBeforeUnload = () => {
        const timeOnPage = Date.now() - pageStartTime;
        trackEvent({
          event: 'page_unload',
          category: 'engagement',
          action: 'unload',
          properties: {
            timeOnPage,
            scrollDepth: scrollDepth,
            mouseMoves: mouseActivity.moves,
            mouseClicks: mouseActivity.clicks,
            engaged: timeOnPage > 30000 || scrollDepth > 25 || mouseActivity.clicks > 3
          }
        });
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      // Cleanup
      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('click', handleMouseClick);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, []);

  const trackEvent = async (eventData: Omit<AnalyticsEventData, 'sessionId'>) => {
    if (typeof window === 'undefined') return;

    try {
      // Use fetch with timeout and better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...eventData,
          sessionId,
          pageUrl: window.location.pathname,
          referrer: document.referrer || undefined,
          clientInfo
        }),
        signal: controller.signal,
        // Don't let analytics failures affect user experience
        keepalive: true
      });

      clearTimeout(timeoutId);
    } catch (error) {
      // Silently fail for analytics - don't spam console in production
      if (process.env.NODE_ENV === 'development') {
        console.error('Analytics tracking error:', error);
      }
      // Try to track the error analytically if possible
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        // Only log non-timeout errors
        console.warn('Analytics service unavailable, continuing...');
      }
    }
  };

  const trackSiteVisit = () => {
    trackEvent({
      event: 'site_visit',
      category: 'navigation',
      action: 'visited'
    });
  };

  const trackPageView = (page: string) => {
    trackEvent({
      event: 'page_view',
      category: 'navigation',
      action: 'viewed',
      label: page
    });
  };

  const trackQuoteStarted = () => {
    trackEvent({
      event: 'quote_started',
      category: 'quote',
      action: 'started'
    });
  };

  const trackQuoteCompleted = (quoteValue: number, leadId?: string) => {
    trackEvent({
      event: 'quote_completed',
      category: 'quote',
      action: 'completed',
      value: quoteValue,
      leadId
    });
  };

  const trackLeadCreated = (leadId: string, sellMethod: string) => {
    trackEvent({
      event: 'lead_created',
      category: 'lead',
      action: 'created',
      label: sellMethod,
      leadId,
      properties: { sellMethod }
    });
  };

  const trackVerificationSent = (leadId: string, email: string) => {
    trackEvent({
      event: 'verification_sent',
      category: 'verification',
      action: 'sent',
      leadId,
      properties: { email }
    });
  };

  const trackVerificationCompleted = (leadId: string) => {
    trackEvent({
      event: 'verification_completed',
      category: 'verification',
      action: 'completed',
      leadId
    });
  };

  const trackSchedulingStarted = (leadId: string) => {
    trackEvent({
      event: 'scheduling_started',
      category: 'scheduling',
      action: 'started',
      leadId
    });
  };

  const trackSchedulingCompleted = (leadId: string, appointmentId: string, isSameDay: boolean) => {
    trackEvent({
      event: 'scheduling_completed',
      category: 'scheduling',
      action: 'completed',
      leadId,
      properties: { appointmentId, isSameDay }
    });
  };

  const trackFormInteraction = (formName: string, action: string, leadId?: string) => {
    trackEvent({
      event: 'form_interaction',
      category: 'form',
      action,
      label: formName,
      leadId,
      properties: { formName }
    });
  };

  const trackButtonClick = (buttonName: string, leadId?: string) => {
    trackEvent({
      event: 'button_click',
      category: 'interaction',
      action: 'clicked',
      label: buttonName,
      leadId,
      properties: { 
        buttonName,
        page: typeof window !== 'undefined' ? window.location.pathname : undefined
      }
    });
  };

  const trackError = (errorType: string, errorMessage: string) => {
    trackEvent({
      event: 'error',
      category: 'error',
      action: errorType,
      label: errorMessage,
      properties: { 
        errorMessage,
        page: typeof window !== 'undefined' ? window.location.pathname : undefined
      }
    });
  };

  const trackConversion = (conversionType: string, value: number, leadId: string) => {
    trackEvent({
      event: 'conversion',
      category: 'conversion',
      action: conversionType,
      value,
      leadId,
      properties: { conversionType }
    });
  };

  const trackModelSelection = (model: string) => {
    trackEvent({
      event: 'model_selected',
      category: 'quote',
      action: 'model_selection',
      label: model,
      properties: { model }
    });
  };

  const trackStorageSelection = (storage: string, model: string) => {
    trackEvent({
      event: 'storage_selected',
      category: 'quote',
      action: 'storage_selection',
      label: `${model} ${storage}`,
      properties: { model, storage }
    });
  };

  const trackDamageSelection = (damage: string, isSelected: boolean) => {
    trackEvent({
      event: 'damage_selection',
      category: 'quote',
      action: isSelected ? 'damage_added' : 'damage_removed',
      label: damage,
      properties: { damage, isSelected }
    });
  };

  const trackSellMethodSelection = (method: 'pickup' | 'dropoff') => {
    trackEvent({
      event: 'sell_method_selected',
      category: 'quote',
      action: 'sell_method_selection',
      label: method,
      properties: { method }
    });
  };

  const trackFormAbandonment = (formName: string, completedFields: string[], totalFields: number, leadId?: string) => {
    trackEvent({
      event: 'form_abandoned',
      category: 'form',
      action: 'abandoned',
      label: formName,
      leadId,
      properties: {
        formName,
        completedFields,
        totalFields,
        completionRate: (completedFields.length / totalFields) * 100
      }
    });
  };

  const trackFormFieldInteraction = (formName: string, fieldName: string, action: 'focus' | 'blur' | 'change', leadId?: string) => {
    trackEvent({
      event: 'form_field_interaction',
      category: 'form',
      action,
      label: `${formName}.${fieldName}`,
      leadId,
      properties: { formName, fieldName, action }
    });
  };

  const trackAddressSearch = (query: string, hasResults: boolean) => {
    trackEvent({
      event: 'address_search',
      category: 'quote',
      action: hasResults ? 'search_success' : 'search_no_results',
      label: query,
      properties: { query: query.length > 0, queryLength: query.length, hasResults }
    });
  };

  const trackQuoteVariation = (variation: { model: string; storage: string; damages: string[]; quote: number; basePrice: number }) => {
    trackEvent({
      event: 'quote_variation',
      category: 'quote',
      action: 'calculated',
      properties: {
        ...variation,
        damageCount: variation.damages.length,
        discountPercent: ((variation.basePrice - variation.quote) / variation.basePrice) * 100
      }
    });
  };

  const trackEngagementMilestone = (milestone: 'time_30s' | 'time_60s' | 'time_2m' | 'scroll_25' | 'scroll_50' | 'scroll_75') => {
    trackEvent({
      event: 'engagement_milestone',
      category: 'engagement',
      action: 'milestone_reached',
      label: milestone,
      properties: { milestone }
    });
  };

  const trackUserIntent = (intent: 'price_shopping' | 'ready_to_sell' | 'information_gathering', evidence: string[]) => {
    trackEvent({
      event: 'user_intent_detected',
      category: 'behavior',
      action: 'intent_classification',
      label: intent,
      properties: { intent, evidence }
    });
  };

  // Shorthand for common analytics tracking
  const track = trackEvent;

  return {
    sessionId,
    track,
    trackEvent,
    trackSiteVisit,
    trackPageView,
    trackQuoteStarted,
    trackQuoteCompleted,
    trackLeadCreated,
    trackVerificationSent,
    trackVerificationCompleted,
    trackSchedulingStarted,
    trackSchedulingCompleted,
    trackFormInteraction,
    trackButtonClick,
    trackError,
    trackConversion,
    trackModelSelection,
    trackStorageSelection,
    trackDamageSelection,
    trackSellMethodSelection,
    trackFormAbandonment,
    trackFormFieldInteraction,
    trackAddressSearch,
    trackQuoteVariation,
    trackEngagementMilestone,
    trackUserIntent
  };
}