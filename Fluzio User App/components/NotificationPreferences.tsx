import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Mail, Smartphone, Clock, MapPin, Save, X } from 'lucide-react';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../services/AuthContext';
import { useAuth } from '../services/AuthContext';

export interface NotificationPreferences {
  userId: string;
  categories: {
    missions: { push: boolean; email: boolean; inApp: boolean };
    social: { push: boolean; email: boolean; inApp: boolean };
    rewards: { push: boolean; email: boolean; inApp: boolean };
    events: { push: boolean; email: boolean; inApp: boolean };
    achievements: { push: boolean; email: boolean; inApp: boolean };
    system: { push: boolean; email: boolean; inApp: boolean };
  };
  quietHours: {
    enabled: boolean;
    startTime: string; // 24h format: "22:00"
    endTime: string; // 24h format: "08:00"
  };
  locationBased: {
    enabled: boolean;
    radius: number; // meters (default 500)
    favoritesOnly: boolean;
  };
  weeklyDigest: {
    enabled: boolean;
    dayOfWeek: number; // 0-6 (Sunday-Saturday)
    timeOfDay: string; // "09:00"
  };
  sound: boolean;
  vibration: boolean;
  lastUpdated: Date;
}

interface NotificationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPreferencesModal: React.FC<NotificationPreferencesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { userProfile } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    userId: userProfile?.id || '',
    categories: {
      missions: { push: true, email: true, inApp: true },
      social: { push: true, email: false, inApp: true },
      rewards: { push: true, email: true, inApp: true },
      events: { push: true, email: true, inApp: true },
      achievements: { push: true, email: false, inApp: true },
      system: { push: true, email: true, inApp: true },
    },
    quietHours: {
      enabled: true,
      startTime: '22:00',
      endTime: '08:00',
    },
    locationBased: {
      enabled: true,
      radius: 500,
      favoritesOnly: false,
    },
    weeklyDigest: {
      enabled: true,
      dayOfWeek: 1, // Monday
      timeOfDay: '09:00',
    },
    sound: true,
    vibration: true,
    lastUpdated: new Date(),
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen && userProfile?.id) {
      loadPreferences();
    }
  }, [isOpen, userProfile?.id]);

  const loadPreferences = async () => {
    if (!userProfile?.id) return;

    try {
      const prefsRef = doc(db, 'notificationPreferences', userProfile.id);
      const prefsSnap = await getDoc(prefsRef);

      if (prefsSnap.exists()) {
        const data = prefsSnap.data();
        setPreferences({
          ...data,
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
        } as NotificationPreferences);
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };

  const savePreferences = async () => {
    if (!userProfile?.id) return;

    setLoading(true);
    try {
      const prefsRef = doc(db, 'notificationPreferences', userProfile.id);
      await setDoc(prefsRef, {
        ...preferences,
        userId: userProfile.id,
        lastUpdated: Timestamp.now(),
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCategory = (
    category: keyof NotificationPreferences['categories'],
    type: 'push' | 'email' | 'inApp',
    value: boolean
  ) => {
    setPreferences({
      ...preferences,
      categories: {
        ...preferences.categories,
        [category]: {
          ...preferences.categories[category],
          [type]: value,
        },
      },
    });
  };

  const toggleAllInCategory = (category: keyof NotificationPreferences['categories'], enabled: boolean) => {
    setPreferences({
      ...preferences,
      categories: {
        ...preferences.categories,
        [category]: {
          push: enabled,
          email: enabled,
          inApp: enabled,
        },
      },
    });
  };

  if (!isOpen) return null;

  const categories = [
    { key: 'missions' as const, label: 'Missions & Challenges', icon: '🎯', description: 'New missions, completions, and updates' },
    { key: 'social' as const, label: 'Social Activity', icon: '👥', description: 'Friend requests, follows, and interactions' },
    { key: 'rewards' as const, label: 'Rewards & Points', icon: '🎁', description: 'Reward redemptions and point updates' },
    { key: 'events' as const, label: 'Events & Meetups', icon: '📅', description: 'Upcoming events and meetup invitations' },
    { key: 'achievements' as const, label: 'Achievements', icon: '🏆', description: 'Unlocked achievements and progress' },
    { key: 'system' as const, label: 'System Updates', icon: '⚙️', description: 'App updates and important announcements' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] p-6 text-white z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-bold">Notification Preferences</h2>
                <p className="text-sm opacity-90">Customize how you receive notifications</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Category Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#1E0E62] flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Categories
            </h3>

            <div className="space-y-3">
              {categories.map((category) => {
                const prefs = preferences.categories[category.key];
                const allEnabled = prefs.push && prefs.email && prefs.inApp;
                const allDisabled = !prefs.push && !prefs.email && !prefs.inApp;

                return (
                  <div
                    key={category.key}
                    className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{category.icon}</span>
                        <div>
                          <h4 className="font-semibold text-[#1E0E62]">{category.label}</h4>
                          <p className="text-xs text-gray-600">{category.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleAllInCategory(category.key, allDisabled)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          allEnabled
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        {allEnabled ? 'All On' : allDisabled ? 'All Off' : 'Mixed'}
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={prefs.push}
                          onChange={(e) => updateCategory(category.key, 'push', e.target.checked)}
                          className="w-4 h-4 text-[#6C4BFF] rounded focus:ring-2 focus:ring-[#00E5FF]"
                        />
                        <div className="flex items-center gap-1 text-sm">
                          <Smartphone className="w-3 h-3" />
                          <span>Push</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={prefs.email}
                          onChange={(e) => updateCategory(category.key, 'email', e.target.checked)}
                          className="w-4 h-4 text-[#6C4BFF] rounded focus:ring-2 focus:ring-[#00E5FF]"
                        />
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="w-3 h-3" />
                          <span>Email</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={prefs.inApp}
                          onChange={(e) => updateCategory(category.key, 'inApp', e.target.checked)}
                          className="w-4 h-4 text-[#6C4BFF] rounded focus:ring-2 focus:ring-[#00E5FF]"
                        />
                        <div className="flex items-center gap-1 text-sm">
                          <Bell className="w-3 h-3" />
                          <span>In-App</span>
                        </div>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-[#1E0E62] flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Quiet Hours
            </h3>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <label className="flex items-center justify-between mb-3 cursor-pointer">
                <div className="flex items-center gap-2">
                  {preferences.quietHours.enabled ? (
                    <BellOff className="w-5 h-5 text-purple-600" />
                  ) : (
                    <Bell className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="font-semibold text-[#1E0E62]">Enable Do Not Disturb</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.quietHours.enabled}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      quietHours: { ...preferences.quietHours, enabled: e.target.checked },
                    })
                  }
                  className="w-5 h-5 text-[#6C4BFF] rounded focus:ring-2 focus:ring-[#00E5FF]"
                />
              </label>

              {preferences.quietHours.enabled && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Start Time</label>
                    <input
                      type="time"
                      value={preferences.quietHours.startTime}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          quietHours: { ...preferences.quietHours, startTime: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">End Time</label>
                    <input
                      type="time"
                      value={preferences.quietHours.endTime}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          quietHours: { ...preferences.quietHours, endTime: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Location-Based Notifications */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-[#1E0E62] flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Location-Based Notifications
            </h3>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-semibold text-[#1E0E62]">Enable Location Notifications</span>
                <input
                  type="checkbox"
                  checked={preferences.locationBased.enabled}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      locationBased: { ...preferences.locationBased, enabled: e.target.checked },
                    })
                  }
                  className="w-5 h-5 text-[#6C4BFF] rounded focus:ring-2 focus:ring-[#00E5FF]"
                />
              </label>

              {preferences.locationBased.enabled && (
                <>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block flex items-center justify-between">
                      <span>Notification Radius</span>
                      <span className="font-semibold text-[#6C4BFF]">{preferences.locationBased.radius}m</span>
                    </label>
                    <input
                      type="range"
                      min={100}
                      max={2000}
                      step={100}
                      value={preferences.locationBased.radius}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          locationBased: { ...preferences.locationBased, radius: Number(e.target.value) },
                        })
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.locationBased.favoritesOnly}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          locationBased: { ...preferences.locationBased, favoritesOnly: e.target.checked },
                        })
                      }
                      className="w-4 h-4 text-[#6C4BFF] rounded focus:ring-2 focus:ring-[#00E5FF]"
                    />
                    <span className="text-sm text-gray-700">Only notify for favorite businesses</span>
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Weekly Digest */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-[#1E0E62] flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Weekly Digest Email
            </h3>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-semibold text-[#1E0E62]">Enable Weekly Summary</span>
                <input
                  type="checkbox"
                  checked={preferences.weeklyDigest.enabled}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      weeklyDigest: { ...preferences.weeklyDigest, enabled: e.target.checked },
                    })
                  }
                  className="w-5 h-5 text-[#6C4BFF] rounded focus:ring-2 focus:ring-[#00E5FF]"
                />
              </label>

              {preferences.weeklyDigest.enabled && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Day of Week</label>
                    <select
                      value={preferences.weeklyDigest.dayOfWeek}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          weeklyDigest: { ...preferences.weeklyDigest, dayOfWeek: Number(e.target.value) },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent"
                    >
                      <option value={0}>Sunday</option>
                      <option value={1}>Monday</option>
                      <option value={2}>Tuesday</option>
                      <option value={3}>Wednesday</option>
                      <option value={4}>Thursday</option>
                      <option value={5}>Friday</option>
                      <option value={6}>Saturday</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Time</label>
                    <input
                      type="time"
                      value={preferences.weeklyDigest.timeOfDay}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          weeklyDigest: { ...preferences.weeklyDigest, timeOfDay: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Settings */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-[#1E0E62]">Additional Settings</h3>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-semibold text-[#1E0E62]">Sound</span>
                <input
                  type="checkbox"
                  checked={preferences.sound}
                  onChange={(e) => setPreferences({ ...preferences, sound: e.target.checked })}
                  className="w-5 h-5 text-[#6C4BFF] rounded focus:ring-2 focus:ring-[#00E5FF]"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-semibold text-[#1E0E62]">Vibration</span>
                <input
                  type="checkbox"
                  checked={preferences.vibration}
                  onChange={(e) => setPreferences({ ...preferences, vibration: e.target.checked })}
                  className="w-5 h-5 text-[#6C4BFF] rounded focus:ring-2 focus:ring-[#00E5FF]"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={savePreferences}
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <span>✓</span>
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Preferences
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
