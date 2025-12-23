import React, { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Tag, Target, Users, Zap, Settings, Check, X } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/AuthContext';

interface NotificationPreference {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
}

interface NotificationPreferencesProps {
  userId: string;
  onClose: () => void;
}

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  userId,
  onClose
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      id: 'missions',
      label: 'New Missions',
      description: 'Get notified when new missions are posted near you',
      icon: Target,
      emailEnabled: true,
      pushEnabled: true,
      inAppEnabled: true,
    },
    {
      id: 'rewards',
      label: 'Rewards & Points',
      description: 'Updates about your points, rewards, and redemptions',
      icon: Tag,
      emailEnabled: true,
      pushEnabled: true,
      inAppEnabled: true,
    },
    {
      id: 'messages',
      label: 'Messages',
      description: 'New messages and conversation updates',
      icon: MessageSquare,
      emailEnabled: true,
      pushEnabled: true,
      inAppEnabled: true,
    },
    {
      id: 'social',
      label: 'Social Activity',
      description: 'Friend requests, mentions, and community updates',
      icon: Users,
      emailEnabled: false,
      pushEnabled: true,
      inAppEnabled: true,
    },
    {
      id: 'promotions',
      label: 'Promotions & Offers',
      description: 'Special deals, limited-time offers, and exclusive rewards',
      icon: Zap,
      emailEnabled: true,
      pushEnabled: false,
      inAppEnabled: true,
    },
    {
      id: 'updates',
      label: 'Platform Updates',
      description: 'News about new features and important announcements',
      icon: Bell,
      emailEnabled: true,
      pushEnabled: false,
      inAppEnabled: true,
    },
  ]);

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();
      
      if (userData?.notificationPreferences) {
        const savedPrefs = userData.notificationPreferences;
        setPreferences(prev => prev.map(pref => ({
          ...pref,
          emailEnabled: savedPrefs[pref.id]?.email ?? pref.emailEnabled,
          pushEnabled: savedPrefs[pref.id]?.push ?? pref.pushEnabled,
          inAppEnabled: savedPrefs[pref.id]?.inApp ?? pref.inAppEnabled,
        })));
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePreference = (prefId: string, type: 'email' | 'push' | 'inApp') => {
    setPreferences(prev => prev.map(pref => {
      if (pref.id === prefId) {
        return {
          ...pref,
          [`${type}Enabled`]: !pref[`${type}Enabled`],
        };
      }
      return pref;
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const prefsObject = preferences.reduce((acc, pref) => ({
        ...acc,
        [pref.id]: {
          email: pref.emailEnabled,
          push: pref.pushEnabled,
          inApp: pref.inAppEnabled,
        },
      }), {});

      await updateDoc(doc(db, 'users', userId), {
        notificationPreferences: prefsObject,
        updatedAt: new Date(),
      });

      alert('Notification preferences saved successfully!');
      onClose();
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const enableAll = () => {
    setPreferences(prev => prev.map(pref => ({
      ...pref,
      emailEnabled: true,
      pushEnabled: true,
      inAppEnabled: true,
    })));
  };

  const disableAll = () => {
    setPreferences(prev => prev.map(pref => ({
      ...pref,
      emailEnabled: false,
      pushEnabled: false,
      inAppEnabled: false,
    })));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#00E5FF] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1E0E62]">Notification Preferences</h2>
              <p className="text-sm text-gray-600">Choose how you want to be notified</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={enableAll}
            className="flex-1 px-4 py-2 border border-green-200 bg-green-50 text-green-700 rounded-xl font-medium hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Enable All
          </button>
          <button
            onClick={disableAll}
            className="flex-1 px-4 py-2 border border-gray-200 bg-gray-50 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Disable All
          </button>
        </div>

        {/* Table Header */}
        <div className="mb-4">
          <div className="grid grid-cols-[1fr,auto,auto,auto] gap-4 px-4 pb-3 border-b border-gray-200">
            <div className="text-sm font-bold text-gray-600">Category</div>
            <div className="text-sm font-bold text-gray-600 text-center w-20">Email</div>
            <div className="text-sm font-bold text-gray-600 text-center w-20">Push</div>
            <div className="text-sm font-bold text-gray-600 text-center w-20">In-App</div>
          </div>
        </div>

        {/* Preferences List */}
        <div className="space-y-3">
          {preferences.map((pref) => (
            <div
              key={pref.id}
              className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
            >
              <div className="grid grid-cols-[1fr,auto,auto,auto] gap-4 items-center">
                {/* Category Info */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] flex items-center justify-center flex-shrink-0">
                    <pref.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-[#1E0E62] mb-1">{pref.label}</h3>
                    <p className="text-sm text-gray-600">{pref.description}</p>
                  </div>
                </div>

                {/* Email Toggle */}
                <div className="flex justify-center w-20">
                  <button
                    onClick={() => togglePreference(pref.id, 'email')}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      pref.emailEnabled ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        pref.emailEnabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    ></div>
                  </button>
                </div>

                {/* Push Toggle */}
                <div className="flex justify-center w-20">
                  <button
                    onClick={() => togglePreference(pref.id, 'push')}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      pref.pushEnabled ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        pref.pushEnabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    ></div>
                  </button>
                </div>

                {/* In-App Toggle */}
                <div className="flex justify-center w-20">
                  <button
                    onClick={() => togglePreference(pref.id, 'inApp')}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      pref.inAppEnabled ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        pref.inAppEnabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    ></div>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">About Notifications</p>
              <ul className="space-y-1 text-blue-700">
                <li><strong>Email:</strong> Receive notifications via email</li>
                <li><strong>Push:</strong> Browser/mobile push notifications</li>
                <li><strong>In-App:</strong> Notifications within Fluzio</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};
