import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, RefreshCw, Home, X } from 'lucide-react';

interface ErrorDisplayProps {
  error: Error;
  errorInfo?: React.ErrorInfo;
  onReset?: () => void;
  onDismiss?: () => void;
  showDismiss?: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  errorInfo,
  onReset,
  onDismiss,
  showDismiss = false
}) => {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);

  const getErrorMessage = (error: Error): string => {
    // Network errors
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return t('errors.connectionError');
    }
    
    // Firebase errors
    if (error.message.includes('permission-denied')) {
      return t('errors.permissionDenied');
    }
    if (error.message.includes('unauthenticated')) {
      return t('errors.sessionExpired');
    }
    if (error.message.includes('not-found')) {
      return t('errors.notFound');
    }
    
    // Generic error
    return error.message || t('errors.genericError');
  };

  const getErrorTitle = (error: Error): string => {
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return t('errors.connectionErrorTitle');
    }
    if (error.message.includes('permission-denied')) {
      return t('errors.accessDenied');
    }
    if (error.message.includes('unauthenticated')) {
      return t('errors.sessionExpired');
    }
    return t('errors.somethingWentWrong');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-pink-500 p-6 relative">
            {showDismiss && onDismiss && (
              <button
                onClick={onDismiss}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            )}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-clash font-bold text-white">
                  {getErrorTitle(error)}
                </h1>
                <p className="text-white/80 text-sm mt-1">
                  {t('errors.sorryMessage')}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-700 text-base leading-relaxed mb-6">
              {getErrorMessage(error)}
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              {onReset && (
                <button
                  onClick={onReset}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all active:scale-95"
                >
                  <RefreshCw className="w-5 h-5" />
                  {t('common.tryAgain')}
                </button>
              )}
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors active:scale-95"
              >
                <Home className="w-5 h-5" />
                {t('common.goHome')}
              </button>
            </div>

            {/* Error Details (Developer Mode) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-sm text-gray-500 hover:text-gray-700 font-medium mb-3"
                >
                  {showDetails ? '▼' : '▶'} {t('errors.technicalDetails')}
                </button>
                
                {showDetails && (
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs font-mono text-gray-600 mb-1">Error:</p>
                      <p className="text-xs font-mono text-red-600 break-all">
                        {error.toString()}
                      </p>
                    </div>
                    
                    {errorInfo && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-mono text-gray-600 mb-1">Stack Trace:</p>
                        <pre className="text-xs font-mono text-gray-700 overflow-x-auto whitespace-pre-wrap">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-gray-500 text-sm mt-6">
          {t('errors.persistsContact')}
        </p>
      </div>
    </div>
  );
};

interface NetworkErrorProps {
  onRetry: () => void;
  message?: string;
}

export const NetworkError: React.FC<NetworkErrorProps> = ({ onRetry, message }) => {
  const { t } = useTranslation();
  return (
  <div className="flex flex-col items-center justify-center py-12 px-6">
    <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4">
      <AlertTriangle className="w-10 h-10 text-orange-600" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-2">{t('errors.connectionProblem')}</h3>
    <p className="text-gray-600 text-center mb-6 max-w-md">
      {message || t('errors.unableToLoad')}
    </p>
    <button
      onClick={onRetry}
      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all active:scale-95"
    >
      <RefreshCw className="w-5 h-5" />
      {t('common.retry')}
    </button>
  </div>
);};

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 px-6">
    {icon && (
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        {icon}
      </div>
    )}
    <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
    {description && (
      <p className="text-gray-600 text-center mb-6 max-w-md">{description}</p>
    )}
    {action && (
      <button
        onClick={action.onClick}
        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all active:scale-95"
      >
        {action.label}
      </button>
    )}
  </div>
);
