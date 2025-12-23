import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { LanguageSelector } from './LanguageSelector';
import { useTranslation } from 'react-i18next';
import { 
  X, 
  CreditCard, 
  Shield, 
  Eye, 
  UserX, 
  Lock,
  Bell,
  Globe,
  Moon,
  FileText,
  HelpCircle,
  MessageCircle,
  Mail,
  AlertTriangle,
  Trash2,
  LogOut,
  ChevronRight,
  Check,
  MapPin,
  Gift,
  Coins,
  Flame
} from 'lucide-react';
import { InstagramConnector } from './InstagramConnector';
import { SocialAccountConnector } from './SocialAccountConnector';
import { ChangePasswordModal } from './ChangePasswordModal';
import { ContactSupportModal } from './ContactSupportModal';
import { BlockedUsersModal } from './BlockedUsersModal';
import { HelpCenterModal } from './HelpCenterModal';
import ManageSubscriptionModal from './ManageSubscriptionModal';
import SecuritySettingsModal from './SecuritySettingsModal';
import DeleteAccountModal from './DeleteAccountModal';
import LegalDocumentModal from './LegalDocumentModal';
import { 
  startGeofencing, 
  stopGeofencing, 
  isGeofencingActive,
  requestNotificationPermission,
  isGeofencingSupported
} from '../services/geofencingService';
import { api } from '../services/apiService';
import { PreferencesManager } from './PreferencesManager';

interface CustomerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onLogout: () => void;
  onManageSubscription?: () => void;
}

export const CustomerSettingsModal: React.FC<CustomerSettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogout,
  onManageSubscription
}) => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    missions: true,
    checkIns: false,
    messages: true,
    rewards: true,  // NEW: Reward redemptions
    points: true,   // NEW: Points earned/spent
    streaks: true,  // NEW: Daily streak milestones
    locationTracking: isGeofencingActive()
  });

  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public' as 'public' | 'friends' | 'private',
    showActivity: true,
    showLocation: true
  });

  const [preferences, setPreferences] = useState({
    language: 'en',
    theme: (localStorage.getItem('theme') || 'light') as 'light' | 'dark' | 'auto'
  });

  // Save theme to localStorage when changed
  useEffect(() => {
    localStorage.setItem('theme', preferences.theme);
    
    // Trigger theme change
    if (preferences.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (preferences.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // Auto mode
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [preferences.theme]);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showContactSupport, setShowContactSupport] = useState(false);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showManageSubscription, setShowManageSubscription] = useState(false);
  const [showSecuritySettings, setShowSecuritySettings] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [showLegalDocument, setShowLegalDocument] = useState(false);
  const [legalDocType, setLegalDocType] = useState<'terms' | 'privacy' | 'licenses'>('terms');

  if (!isOpen) return null;

  const handleManageSubscription = () => {
    setShowManageSubscription(true);
  };

  const handleChangePassword = () => {
    setShowChangePassword(true);
  };

  const handleBlockedUsers = () => {
    setShowBlockedUsers(true);
  };

  const handlePrivacySettings = () => {
    setShowSecuritySettings(true);
  };

  const handleContactSupport = () => {
    setShowContactSupport(true);
  };

  const handleDeleteAccount = () => {
    setShowDeleteAccount(true);
  };

  const handleLocationTrackingToggle = async (enabled: boolean) => {
    if (enabled) {
      // Request notification permission first
      const permission = await requestNotificationPermission();
      
      if (permission !== 'granted') {
        alert('Please enable notifications to use location tracking. You\'ll receive alerts when near businesses!');
        return;
      }

      // Start geofencing
      const started = await startGeofencing(user.id);
      
      if (started) {
        setNotifications({ ...notifications, locationTracking: true });
        // Save preference to user profile
        try {
          await api.updateUser(user.id, { locationTrackingEnabled: true });
        } catch (error) {
          console.error('Error saving location tracking preference:', error);
        }
      } else {
        alert('Could not start location tracking. Please check your browser permissions.');
      }
    } else {
      // Stop geofencing
      stopGeofencing();
      setNotifications({ ...notifications, locationTracking: false });
      
      // Save preference to user profile
      try {
        await api.updateUser(user.id, { locationTrackingEnabled: false });
      } catch (error) {
        console.error('Error saving location tracking preference:', error);
      }
    }
  };

  const handleShowLegal = (type: 'terms' | 'privacy' | 'licenses') => {
    setLegalDocType(type);
    setShowLegalDocument(true);
  };

  // Save notification preferences to database
  const handleNotificationChange = async (key: string, value: boolean) => {
    const updatedNotifications = { ...notifications, [key]: value };
    setNotifications(updatedNotifications);
    
    try {
      await api.updateUser(user.id, { 
        notificationPreferences: updatedNotifications 
      });
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    }
  };

  // Save privacy settings to database
  const handlePrivacyChange = async (updates: Partial<typeof privacy>) => {
    const updatedPrivacy = { ...privacy, ...updates };
    setPrivacy(updatedPrivacy);
    
    try {
      await api.updateUser(user.id, { 
        profileVisibility: updatedPrivacy.profileVisibility,
        showActivity: updatedPrivacy.showActivity,
        showLocation: updatedPrivacy.showLocation
      });
    } catch (error) {
      console.error('Error saving privacy settings:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-white flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0">
        <h2 className="font-bold text-xl text-[#1E0E62]">{t('customerSettings.title')}</h2>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 bg-gray-50">
        <div className="max-w-2xl mx-auto space-y-6 pb-20">

          {/* ===== ACCOUNT SECTION ===== */}
          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">💼 {t('customerSettings.sections.account')}</h3>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              
              {/* Subscription */}
              <button
                onClick={handleManageSubscription}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-[#1E0E62]">{t('customerSettings.account.subscription')}</div>
                    <div className="text-xs text-gray-600">{t('customerSettings.account.currentPlan', { plan: user.subscriptionLevel || 'FREE' })}</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              {/* Security */}
              <button
                onClick={handleChangePassword}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-[#1E0E62]">{t('customerSettings.account.security')}</div>
                    <div className="text-xs text-gray-600">{t('customerSettings.account.securityDesc')}</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </section>

          {/* ===== PREFERENCES/INTERESTS SECTION ===== */}
          <section>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <PreferencesManager user={user} onSave={onClose} />
            </div>
          </section>

          {/* ===== SOCIAL ACCOUNTS SECTION ===== */}
          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">🔗 Connected Accounts</h3>
            <div className="space-y-4">
              <SocialAccountConnector user={user} platform="google" />
              <SocialAccountConnector user={user} platform="instagram" />
              <SocialAccountConnector user={user} platform="tiktok" />
              <SocialAccountConnector user={user} platform="linkedin" />
            </div>
          </section>

          {/* ===== PRIVACY SECTION ===== */}
          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">🔒 {t('customerSettings.sections.privacy')}</h3>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              
              {/* Profile Visibility */}
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Eye className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-[#1E0E62]">{t('customerSettings.privacy.profileVisibility')}</div>
                    <div className="text-xs text-gray-600">{t('customerSettings.privacy.whoCanSee')}</div>
                  </div>
                </div>
                <div className="space-y-2 ml-13">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      value="public"
                      checked={privacy.profileVisibility === 'public'}
                      onChange={(e) => handlePrivacyChange({ profileVisibility: e.target.value as any })}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="text-sm text-gray-700">{t('customerSettings.privacy.visibility.public')}</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      value="friends"
                      checked={privacy.profileVisibility === 'friends'}
                      onChange={(e) => handlePrivacyChange({ profileVisibility: e.target.value as any })}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="text-sm text-gray-700">{t('customerSettings.privacy.visibility.friends')}</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      value="private"
                      checked={privacy.profileVisibility === 'private'}
                      onChange={(e) => handlePrivacyChange({ profileVisibility: e.target.value as any })}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="text-sm text-gray-700">{t('customerSettings.privacy.visibility.private')}</span>
                  </label>
                </div>
              </div>

              {/* Blocked Users */}
              <button
                onClick={handleBlockedUsers}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <UserX className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-[#1E0E62]">{t('customerSettings.privacy.blockedUsers')}</div>
                    <div className="text-xs text-gray-600">{t('customerSettings.privacy.blockedUsersDesc')}</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              {/* Permissions */}
              <button
                onClick={handlePrivacySettings}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Lock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-[#1E0E62]">{t('customerSettings.privacy.permissions')}</div>
                    <div className="text-xs text-gray-600">{t('customerSettings.privacy.permissionsDesc')}</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </section>

          {/* ===== NOTIFICATIONS SECTION ===== */}
          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">🔔 {t('customerSettings.sections.notifications')}</h3>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              
              {/* Push Notifications */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Bell className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#1E0E62]">{t('customerSettings.notifications.push')}</div>
                    <div className="text-xs text-gray-600">{t('customerSettings.notifications.pushDesc')}</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notifications.push}
                    onChange={(e) => handleNotificationChange('push', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {/* Email Notifications */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#1E0E62]">{t('customerSettings.notifications.email')}</div>
                    <div className="text-xs text-gray-600">{t('customerSettings.notifications.emailDesc')}</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notifications.email}
                    onChange={(e) => handleNotificationChange('email', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {/* Mission Updates */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#1E0E62]">{t('customerSettings.notifications.missions')}</div>
                    <div className="text-xs text-gray-600">{t('customerSettings.notifications.missionsDesc')}</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notifications.missions}
                    onChange={(e) => handleNotificationChange('missions', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {/* Messages */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#1E0E62]">{t('customerSettings.notifications.messages')}</div>
                    <div className="text-xs text-gray-600">{t('customerSettings.notifications.messagesDesc')}</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notifications.messages}
                    onChange={(e) => handleNotificationChange('messages', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {/* Reward Redemptions */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Gift className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#1E0E62]">Reward Updates</div>
                    <div className="text-xs text-gray-600">Get notified when you redeem rewards</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notifications.rewards}
                    onChange={(e) => handleNotificationChange('rewards', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {/* Points Activity */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Coins className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#1E0E62]">Points Activity</div>
                    <div className="text-xs text-gray-600">Updates when you earn or spend points</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notifications.points}
                    onChange={(e) => handleNotificationChange('points', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {/* Daily Streaks */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Flame className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#1E0E62]">Daily Streak Milestones</div>
                    <div className="text-xs text-gray-600">Celebrate streak achievements and bonuses</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notifications.streaks}
                    onChange={(e) => handleNotificationChange('streaks', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {/* Location Tracking / Geofencing */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-t-2 border-blue-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-[#1E0E62] mb-1">
                        📍 Nearby Business Alerts
                      </div>
                      <div className="text-xs text-gray-700 mb-2">
                        Get notified when you're near businesses where you can earn points
                      </div>
                      <div className="flex items-start gap-2 text-xs text-gray-600 bg-white/70 rounded-lg p-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold">Checks every 5 minutes</div>
                          <div>May impact battery life. Enable only when exploring.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-2">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={notifications.locationTracking}
                      onChange={(e) => handleLocationTrackingToggle(e.target.checked)}
                      disabled={!isGeofencingSupported()}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"></div>
                  </label>
                </div>
                {notifications.locationTracking && (
                  <div className="ml-13 mt-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Active - Tracking nearby businesses
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ===== PREFERENCES SECTION ===== */}
          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">⚙️ {t('customerSettings.sections.preferences')}</h3>
            
            {/* Language Selector Component */}
            <LanguageSelector className="mb-4" />
            
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              
              {/* Theme */}
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                    <Moon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-[#1E0E62]">{t('customerSettings.preferences.theme')}</div>
                    <div className="text-xs text-gray-600">{t('customerSettings.preferences.themeDesc')}</div>
                  </div>
                </div>
                <div className="space-y-2 ml-13">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="theme"
                      value="light"
                      checked={preferences.theme === 'light'}
                      onChange={(e) => setPreferences({ ...preferences, theme: e.target.value as any })}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="text-sm text-gray-700">{t('customerSettings.preferences.themeOptions.light')}</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="theme"
                      value="dark"
                      checked={preferences.theme === 'dark'}
                      onChange={(e) => setPreferences({ ...preferences, theme: e.target.value as any })}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="text-sm text-gray-700">{t('customerSettings.preferences.themeOptions.dark')}</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="theme"
                      value="auto"
                      checked={preferences.theme === 'auto'}
                      onChange={(e) => setPreferences({ ...preferences, theme: e.target.value as any })}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="text-sm text-gray-700">{t('customerSettings.preferences.themeOptions.auto')}</span>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* ===== LEGAL SECTION ===== */}
          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">📄 {t('customerSettings.sections.legal')}</h3>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              
              <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <FileText className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-[#1E0E62]">{t('customerSettings.legal.terms')}</div>
                    <div className="text-xs text-gray-600">{t('customerSettings.legal.termsDesc')}</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <FileText className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-[#1E0E62]">{t('customerSettings.legal.privacy')}</div>
                    <div className="text-xs text-gray-600">{t('customerSettings.legal.privacyDesc')}</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <FileText className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-[#1E0E62]">{t('customerSettings.legal.licenses')}</div>
                    <div className="text-xs text-gray-600">{t('customerSettings.legal.licensesDesc')}</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </section>

          {/* ===== SUPPORT SECTION ===== */}
          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">💬 {t('customerSettings.sections.support')}</h3>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              
              <button 
                onClick={() => setShowHelpCenter(true)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-[#1E0E62]">{t('customerSettings.support.helpCenter')}</div>
                    <div className="text-xs text-gray-600">{t('customerSettings.support.helpCenterDesc')}</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={handleContactSupport}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-[#1E0E62]">{t('customerSettings.support.contactSupport')}</div>
                    <div className="text-xs text-gray-600">{t('customerSettings.support.contactSupportDesc')}</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={() => handleShowLegal('terms')}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <FileText className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-[#1E0E62]">Terms of Service</div>
                    <div className="text-xs text-gray-600">Read our terms and conditions</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={() => handleShowLegal('privacy')}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-[#1E0E62]">Privacy Policy</div>
                    <div className="text-xs text-gray-600">How we protect your data</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={() => handleShowLegal('licenses')}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <FileText className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-[#1E0E62]">Open Source Licenses</div>
                    <div className="text-xs text-gray-600">Third-party software credits</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <FileText className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-[#1E0E62]">{t('customerSettings.support.appVersion')}</div>
                    <div className="text-xs text-gray-600">v1.0.0 (Build 2024.11)</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ===== DANGER ZONE SECTION ===== */}
          <section>
            <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-3">⚠️ {t('customerSettings.sections.danger')}</h3>
            <div className="bg-white rounded-xl border-2 border-red-200 divide-y divide-red-100">
              
              <button
                onClick={handleDeleteAccount}
                className="w-full p-4 flex items-center justify-between hover:bg-red-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-red-600">{t('customerSettings.danger.deleteAccount')}</div>
                    <div className="text-xs text-gray-600">{t('customerSettings.danger.deleteAccountDesc')}</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-red-400" />
              </button>

              <button
                onClick={onLogout}
                className="w-full p-4 flex items-center justify-between hover:bg-red-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <LogOut className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-red-600">{t('customerSettings.danger.logout')}</div>
                    <div className="text-xs text-gray-600">{t('customerSettings.danger.logoutDesc')}</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-red-400" />
              </button>
            </div>
          </section>

        </div>
      </div>

      {/* Modals */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSuccess={() => {
          console.log('Password changed successfully');
        }}
      />

      <ContactSupportModal
        isOpen={showContactSupport}
        onClose={() => setShowContactSupport(false)}
        userEmail={user.email}
        userName={user.name}
      />

      <BlockedUsersModal
        isOpen={showBlockedUsers}
        onClose={() => setShowBlockedUsers(false)}
        currentUserId={user.id}
      />

      <HelpCenterModal
        isOpen={showHelpCenter}
        onClose={() => setShowHelpCenter(false)}
        onContactSupport={() => {
          setShowHelpCenter(false);
          setShowContactSupport(true);
        }}
      />

      <ManageSubscriptionModal
        isOpen={showManageSubscription}
        onClose={() => setShowManageSubscription(false)}
      />

      <SecuritySettingsModal
        isOpen={showSecuritySettings}
        onClose={() => setShowSecuritySettings(false)}
      />

      <DeleteAccountModal
        isOpen={showDeleteAccount}
        onClose={() => setShowDeleteAccount(false)}
      />

      <LegalDocumentModal
        isOpen={showLegalDocument}
        onClose={() => setShowLegalDocument(false)}
        documentType={legalDocType}
      />
    </div>
  );
};
