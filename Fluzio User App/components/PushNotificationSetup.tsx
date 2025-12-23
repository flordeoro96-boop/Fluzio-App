import React, { useState, useEffect } from 'react';
import { Bell, BellOff, CheckCircle, XCircle, AlertCircle, Smartphone } from 'lucide-react';
import {
  initializeMessaging,
  requestNotificationPermission,
  getFCMToken,
  saveFCMToken,
  getNotificationPermissionStatus,
  areNotificationsEnabled
} from '../services/pushNotificationService';

interface PushNotificationSetupProps {
  userId: string;
  onComplete?: (success: boolean) => void;
}

export const PushNotificationSetup: React.FC<PushNotificationSetupProps> = ({
  userId,
  onComplete
}) => {
  const [permission, setPermission] = useState<'default' | 'granted' | 'denied'>('default');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  // VAPID Key from Firebase Console (replace with your actual key)
  const VAPID_KEY = 'BPfGv_ZY-mw0Fss-84eYmgPK-DApUK0N8mXNuxE1JQOzbfnf4ZUdxoc78YLIVdzcznIEgGG07DYWS2h8o6b2Kuc';

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = () => {
    const status = getNotificationPermissionStatus();
    setPermission(status);
    setSuccess(status === 'granted');
  };

  const handleEnableNotifications = async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Initialize messaging
      const messaging = await initializeMessaging();
      if (!messaging) {
        throw new Error('Browser does not support push notifications');
      }

      // Step 2: Request permission
      const permissionResult = await requestNotificationPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Step 3: Get FCM token
      const token = await getFCMToken(VAPID_KEY);
      if (!token) {
        throw new Error('Failed to get FCM token');
      }

      setFcmToken(token);

      // Step 4: Save token to Firestore
      await saveFCMToken(userId, token);

      setSuccess(true);
      setError(null);
      
      if (onComplete) {
        onComplete(true);
      }
    } catch (err: any) {
      console.error('[PushNotificationSetup] Error:', err);
      setError(err.message || 'Failed to enable notifications');
      setSuccess(false);
      
      if (onComplete) {
        onComplete(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (success) return <CheckCircle className="w-12 h-12 text-green-500" />;
    if (permission === 'denied') return <XCircle className="w-12 h-12 text-red-500" />;
    if (error) return <AlertCircle className="w-12 h-12 text-orange-500" />;
    return <Bell className="w-12 h-12 text-blue-500" />;
  };

  const getStatusMessage = () => {
    if (success) return 'Push notifications enabled!';
    if (permission === 'denied') return 'Notifications blocked';
    if (error) return error;
    return 'Stay updated with push notifications';
  };

  const getStatusDescription = () => {
    if (success) {
      return 'You\'ll receive notifications for missions, rewards, messages, and more.';
    }
    if (permission === 'denied') {
      return 'To enable notifications, please update your browser settings.';
    }
    if (error) {
      return 'Please try again or check your browser settings.';
    }
    return 'Get instant alerts for new opportunities and updates.';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md mx-auto">
      {/* Icon */}
      <div className="flex justify-center mb-4">
        {getStatusIcon()}
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
        {getStatusMessage()}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-600 text-center mb-6">
        {getStatusDescription()}
      </p>

      {/* Features List */}
      {!success && permission !== 'denied' && (
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Mission Updates</p>
              <p className="text-xs text-gray-500">Get notified when missions are approved or require action</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">New Rewards</p>
              <p className="text-xs text-gray-500">Be the first to know about exclusive rewards</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Messages & Events</p>
              <p className="text-xs text-gray-500">Stay connected with instant message alerts</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      {permission !== 'granted' && permission !== 'denied' && (
        <button
          onClick={handleEnableNotifications}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Enabling...
            </>
          ) : (
            <>
              <Bell className="w-5 h-5" />
              Enable Notifications
            </>
          )}
        </button>
      )}

      {permission === 'denied' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-800 font-medium mb-2">
            Notifications are blocked
          </p>
          <p className="text-xs text-red-600">
            To enable notifications, click the lock icon in your browser's address bar and allow notifications for this site.
          </p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-800 font-medium mb-1">
            All set!
          </p>
          <p className="text-xs text-green-600">
            You can manage notification preferences in Settings at any time.
          </p>
        </div>
      )}

      {/* Already enabled indicator */}
      {permission === 'granted' && areNotificationsEnabled() && !loading && (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <Smartphone className="w-4 h-4" />
          <span>Notifications are active</span>
        </div>
      )}
    </div>
  );
};
