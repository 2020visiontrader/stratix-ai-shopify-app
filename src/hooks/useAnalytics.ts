import { NetworkManager } from '@/lib/core/NetworkManager';
import { useCallback } from 'react';

interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
}

export const useAnalytics = () => {
  const trackEvent = useCallback(async (event: AnalyticsEvent) => {
    try {
      await NetworkManager.getInstance().post('/api/analytics/events', event);
    } catch (error) {
      console.error('Error tracking analytics event:', error);
    }
  }, []);

  const trackPageView = useCallback(async (path: string) => {
    try {
      await NetworkManager.getInstance().post('/api/analytics/pageviews', {
        path,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  }, []);

  const trackError = useCallback(async (error: Error, context?: Record<string, any>) => {
    try {
      await NetworkManager.getInstance().post('/api/analytics/errors', {
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error tracking error:', err);
    }
  }, []);

  const trackPerformance = useCallback(async (metric: {
    name: string;
    value: number;
    metadata?: Record<string, any>;
  }) => {
    try {
      await NetworkManager.getInstance().post('/api/analytics/performance', {
        ...metric,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error tracking performance metric:', error);
    }
  }, []);

  return {
    trackEvent,
    trackPageView,
    trackError,
    trackPerformance,
  };
}; 