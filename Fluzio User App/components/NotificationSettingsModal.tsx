import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Bell, BellOff, Check, MapPin, Gift, Users, Calendar, Clock, Smartphone } from 'lucide-react';
import { 
  requestNotificationPermission, 
  getFCMToken, 
  saveFCMToken,
  saveNotificationPreferences,
  getNotificationPreferences,
  getNotificationPermissionStatus,
  initializeMessaging
} from '../services/pushNotificationService';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  userId
}) => {
  const { t } = useTranslation();
  const [permissionStatus, setPermissionStatus] = useState<'default' | 'granted' | 'denied'>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    missions: true,
    meetups: true,
    rewards: true,
    social: true,
    dailyReminder: true,
    reminderTime: '09:00'
  });

  useEffect(() => {
    if (isOpen) {
      loadPreferences();
      setPermissionStatus(getNotificationPermissionStatus());
    }
  }, [isOpen, userId]);

  const loadPreferences = async () => {
    try {
      const prefs = await getNotificationPreferences(userId);
      if (prefs) {
        setPreferences({
          missions: prefs.missions ?? true,
          meetups: prefs.meetups ?? true,
          rewards: prefs.rewards ?? true,
          social: prefs.social ?? true,
          dailyReminder: prefs.dailyReminder ?? false,
          reminderTime: prefs.reminderTime ?? '09:00'
        });
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      // Initialize messaging
      await initializeMessaging();

      // Request permission
      const permission = await requestNotificationPermission();
      setPermissionStatus(permission);

      if (permission === 'granted') {
        // Get FCM token
        const vapidKey = 'YOUR_VAPID_KEY_HERE'; // Add your VAPID key from Firebase Console
        const token = await getFCMToken(vapidKey);

        if (token) {
          // Save token to Firestore
          await saveFCMToken(userId, token);
          alert(t('notificationSettings.alerts.enabled'));
        }
      } else {
        alert(t('notificationSettings.alerts.denied'));
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      alert(t('notificationSettings.alerts.enableFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsLoading(true);
    try {
      await saveNotificationPreferences(userId, preferences);
      alert(t('notificationSettings.alerts.saveSuccess'));
      onClose();
    } catch (error) {
      console.error('Failed to save preferences:', error);
      alert(t('notificationSettings.alerts.saveFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const togglePreference = (key: keyof typeof preferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">{t('notificationSettings.title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Permission Status */}
          <div className={`rounded-xl p-4 ${
            permissionStatus === 'granted' 
              ? 'bg-green-50 border border-green-200' 
              : permissionStatus === 'denied'
              ? 'bg-red-50 border border-red-200'
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-center gap-3">
              {permissionStatus === 'granted' ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <BellOff className="w-5 h-5 text-gray-600" />
              )}
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-900">
                  {permissionStatus === 'granted' && t('notificationSettings.permission.enabledTitle')}
                  {permissionStatus === 'denied' && t('notificationSettings.permission.blockedTitle')}
                  {permissionStatus === 'default' && t('notificationSettings.permission.notEnabledTitle')}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {permissionStatus === 'granted' && t('notificationSettings.permission.enabledDesc')}
                  {permissionStatus === 'denied' && t('notificationSettings.permission.blockedDesc')}
                  {permissionStatus === 'default' && t('notificationSettings.permission.notEnabledDesc')}
                </p>
              </div>
            </div>

            {permissionStatus !== 'granted' && (
              <button
                onClick={handleEnableNotifications}
                disabled={isLoading || permissionStatus === 'denied'}
                className="mt-3 w-full bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>{t('notificationSettings.permission.enabling')}</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="w-4 h-4" />
                    <span>{t('notificationSettings.permission.enableButton')}</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Notification Categories */}
          {permissionStatus === 'granted' && (
            <>
              <div>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-purple-600" />
                  {t('notificationSettings.receiveSection')}
                </h3>
                <div className="space-y-3">
                  {/* Missions */}
                  <div
                    onClick={() => togglePreference('missions')}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="font-semibold text-gray-900">{t('notificationSettings.categories.missionsTitle')}</p>
                        <p className="text-xs text-gray-600">{t('notificationSettings.categories.missionsDesc')}</p>
                      </div>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-colors ${
                      preferences.missions ? 'bg-purple-600' : 'bg-gray-300'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform transform ${
                        preferences.missions ? 'translate-x-6' : 'translate-x-0.5'
                      } mt-0.5`}></div>
                    </div>
                  </div>

                  {/* Meetups */}
                  <div
                    onClick={() => togglePreference('meetups')}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-pink-600" />
                      <div>
                        <p className="font-semibold text-gray-900">{t('notificationSettings.categories.meetupsTitle')}</p>
                        <p className="text-xs text-gray-600">{t('notificationSettings.categories.meetupsDesc')}</p>
                      </div>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-colors ${
                      preferences.meetups ? 'bg-purple-600' : 'bg-gray-300'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform transform ${
                        preferences.meetups ? 'translate-x-6' : 'translate-x-0.5'
                      } mt-0.5`}></div>
                    </div>
                  </div>

                  {/* Rewards */}
                  <div
                    onClick={() => togglePreference('rewards')}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Gift className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-semibold text-gray-900">{t('notificationSettings.categories.rewardsTitle')}</p>
                        <p className="text-xs text-gray-600">{t('notificationSettings.categories.rewardsDesc')}</p>
                      </div>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-colors ${
                      preferences.rewards ? 'bg-purple-600' : 'bg-gray-300'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform transform ${
                        preferences.rewards ? 'translate-x-6' : 'translate-x-0.5'
                      } mt-0.5`}></div>
                    </div>
                  </div>

                  {/* Social */}
                  <div
                    onClick={() => togglePreference('social')}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-semibold text-gray-900">{t('notificationSettings.categories.socialTitle')}</p>
                        <p className="text-xs text-gray-600">{t('notificationSettings.categories.socialDesc')}</p>
                      </div>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-colors ${
                      preferences.social ? 'bg-purple-600' : 'bg-gray-300'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform transform ${
                        preferences.social ? 'translate-x-6' : 'translate-x-0.5'
                      } mt-0.5`}></div>
                    </div>
                  </div>

                  {/* Daily Reminder */}
                  <div
                    onClick={() => togglePreference('dailyReminder')}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="font-semibold text-gray-900">{t('notificationSettings.categories.dailyTitle')}</p>
                        <p className="text-xs text-gray-600">{t('notificationSettings.categories.dailyDesc', { time: preferences.reminderTime })}</p>
                      </div>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-colors ${
                      preferences.dailyReminder ? 'bg-purple-600' : 'bg-gray-300'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform transform ${
                        preferences.dailyReminder ? 'translate-x-6' : 'translate-x-0.5'
                      } mt-0.5`}></div>
                    </div>
                  </div>

                  {/* Reminder Time */}
                  {preferences.dailyReminder && (
                    <div className="pl-11 pr-4">
                      <label className="text-xs font-semibold text-gray-700 mb-2 block">
                        {t('notificationSettings.categories.reminderTimeLabel')}
                      </label>
                      <input
                        type="time"
                        value={preferences.reminderTime}
                        onChange={(e) => setPreferences(prev => ({ ...prev, reminderTime: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSavePreferences}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? t('notificationSettings.save.saving') : t('notificationSettings.save.savePrefs')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
