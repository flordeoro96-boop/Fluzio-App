import * as Sentry from '@sentry/react';

// Initialize Sentry
export const initSentry = () => {
  // Only initialize in production or when explicitly enabled
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE || 'development';
  
  if (!sentryDsn) {
    console.log('[Sentry] No DSN provided, error tracking disabled');
    return;
  }

  try {
    Sentry.init({
      dsn: sentryDsn,
      environment,
      
      // Performance Monitoring
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      
      // Performance monitoring sample rate (10% in production)
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
      
      // Session Replay (5% in production for performance)
      replaysSessionSampleRate: environment === 'production' ? 0.05 : 0.1,
      replaysOnErrorSampleRate: 1.0, // Always capture replay on error
      
      // Release tracking
      release: `fluzio@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
      
      // Filter out known noise
      ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        'chrome-extension://',
        'moz-extension://',
        // Network errors that aren't actionable
        'NetworkError',
        'Failed to fetch',
        'Load failed',
        // ResizeObserver errors (harmless)
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
      ],
      
      // Filter out localhost
      beforeSend(event) {
        if (event.request?.url?.includes('localhost')) {
          return null; // Don't send errors from localhost
        }
        return event;
      },
    });

    console.log('[Sentry] Error tracking initialized:', environment);
  } catch (error) {
    console.error('[Sentry] Failed to initialize:', error);
  }
};

// Set user context for error tracking
export const setSentryUser = (userId: string, email?: string, role?: string) => {
  Sentry.setUser({
    id: userId,
    email,
    role,
  });
};

// Clear user context (on logout)
export const clearSentryUser = () => {
  Sentry.setUser(null);
};

// Capture custom errors
export const captureError = (error: Error, context?: Record<string, any>) => {
  Sentry.captureException(error, {
    extra: context,
  });
};

// Capture messages (for warnings, info, etc.)
export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) => {
  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
};

// Add breadcrumb (for debugging context)
export const addBreadcrumb = (message: string, category: string, data?: Record<string, any>) => {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
};

// Set context tags
export const setSentryTag = (key: string, value: string) => {
  Sentry.setTag(key, value);
};

export const setSentryContext = (name: string, context: Record<string, any>) => {
  Sentry.setContext(name, context);
};

// Wrap components with error boundary
export const SentryErrorBoundary = Sentry.ErrorBoundary;
