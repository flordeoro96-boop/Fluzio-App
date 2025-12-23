import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

interface OfflineDetectorProps {
  onStatusChange?: (isOnline: boolean) => void;
}

export const OfflineDetector: React.FC<OfflineDetectorProps> = ({ onStatusChange }) => {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      console.log('[OfflineDetector] 🌐 Connection restored');
      setIsOnline(true);
      setShowNotification(true);
      onStatusChange?.(true);
      
      // Auto-hide after 3 seconds
      setTimeout(() => setShowNotification(false), 3000);
    };

    const handleOffline = () => {
      console.log('[OfflineDetector] 📡 Connection lost');
      setIsOnline(false);
      setShowNotification(true);
      onStatusChange?.(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onStatusChange]);

  if (!showNotification) return null;

  return (
    <div
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-[300] px-6 py-3 rounded-full shadow-2xl animate-in slide-in-from-top duration-300 ${
        isOnline
          ? 'bg-gradient-to-r from-green-500 to-emerald-500'
          : 'bg-gradient-to-r from-orange-500 to-red-500'
      }`}
    >
      <div className="flex items-center gap-3 text-white">
        {isOnline ? (
          <>
            <Wifi className="w-5 h-5" />
            <span className="font-medium">{t('common.backOnline')}</span>
          </>
        ) : (
          <>
            <WifiOff className="w-5 h-5" />
            <span className="font-medium">{t('common.noInternet')}</span>
          </>
        )}
      </div>
    </div>
  );
};

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};
