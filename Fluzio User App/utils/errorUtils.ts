/**
 * Network utility functions for handling errors and retries
 */

interface RetryOptions {
  maxRetries?: number;
  delay?: number;
  backoff?: boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = true,
    onRetry
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        throw lastError;
      }

      const waitTime = backoff ? delay * Math.pow(2, attempt) : delay;
      
      console.log(`[retryWithBackoff] Attempt ${attempt + 1} failed, retrying in ${waitTime}ms...`);
      onRetry?.(attempt + 1, lastError);

      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError!;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false;

  const message = error.message?.toLowerCase() || '';
  
  return (
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('timeout') ||
    error.code === 'ECONNREFUSED' ||
    error.code === 'ENOTFOUND' ||
    error.code === 'ETIMEDOUT'
  );
}

/**
 * Check if error is a Firebase permission error
 */
export function isPermissionError(error: any): boolean {
  if (!error) return false;

  const message = error.message?.toLowerCase() || '';
  const code = error.code?.toLowerCase() || '';

  return (
    message.includes('permission') ||
    message.includes('unauthorized') ||
    code.includes('permission-denied') ||
    code.includes('unauthenticated')
  );
}

/**
 * Check if error is a Firebase not found error
 */
export function isNotFoundError(error: any): boolean {
  if (!error) return false;

  const message = error.message?.toLowerCase() || '';
  const code = error.code?.toLowerCase() || '';

  return (
    message.includes('not found') ||
    code.includes('not-found')
  );
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyError(error: any): string {
  if (!error) return 'An unknown error occurred';

  // Network errors
  if (isNetworkError(error)) {
    return 'Unable to connect. Please check your internet connection.';
  }

  // Permission errors
  if (isPermissionError(error)) {
    return "You don't have permission to perform this action.";
  }

  // Not found errors
  if (isNotFoundError(error)) {
    return 'The requested resource was not found.';
  }

  // Firebase specific errors
  const code = error.code?.toLowerCase() || '';
  
  if (code.includes('invalid-argument')) {
    return 'Invalid input. Please check your data and try again.';
  }
  
  if (code.includes('deadline-exceeded')) {
    return 'Request took too long. Please try again.';
  }
  
  if (code.includes('already-exists')) {
    return 'This item already exists.';
  }
  
  if (code.includes('resource-exhausted')) {
    return 'Service is temporarily unavailable. Please try again later.';
  }

  // Default to error message if available
  return error.message || 'An unexpected error occurred. Please try again.';
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  errorHandler?: (error: Error) => void
): (...args: T) => Promise<R | undefined> {
  return async (...args: T) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error('[withErrorHandling] Error:', error);
      errorHandler?.(error as Error);
      return undefined;
    }
  };
}

/**
 * Check if user is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Wait for online connection
 */
export function waitForOnline(timeout = 30000): Promise<boolean> {
  return new Promise((resolve) => {
    if (navigator.onLine) {
      resolve(true);
      return;
    }

    const timeoutId = setTimeout(() => {
      window.removeEventListener('online', handleOnline);
      resolve(false);
    }, timeout);

    const handleOnline = () => {
      clearTimeout(timeoutId);
      window.removeEventListener('online', handleOnline);
      resolve(true);
    };

    window.addEventListener('online', handleOnline);
  });
}

/**
 * Safe fetch with timeout and retry
 */
export async function safeFetch(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const { timeout = 10000, ...fetchOptions } = options as any;

  const fetchWithTimeout = async (): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if ((error as any).name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  };

  return retryWithBackoff(fetchWithTimeout, {
    maxRetries: 2,
    delay: 1000,
    backoff: true,
    ...retryOptions
  });
}
