
import React, { useState, useEffect } from 'react';
import { User, BusinessCategory, SocialConnection, UserPreferences } from '../types';
import { store } from '../services/mockStore';
import { useAuth } from '../services/AuthContext';
import { api } from '../services/apiService';
import { Card, Button, Input, TextArea, Select } from './Common';
import { 
  X, 
  Camera, 
  Instagram, 
  Globe, 
  Plus, 
  Settings as SettingsIcon, 
  Check, 
  Loader2, 
  Link as LinkIcon, 
  LogOut,
  CreditCard,
  Shield,
  Eye,
  UserX,
  Lock,
  Bell,
  Moon,
  FileText,
  HelpCircle,
  MessageCircle,
  Mail,
  AlertTriangle,
  Trash2,
  ChevronRight,
  Smartphone
} from 'lucide-react';
import { storage } from '../services/AuthContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { InstagramConnector } from './InstagramConnector';
import { LanguageSelector } from './LanguageSelector';
import { useTranslation } from 'react-i18next';
import { ChangePasswordModal } from './ChangePasswordModal';
import { ContactSupportModal } from './ContactSupportModal';
import { BlockedUsersModal } from './BlockedUsersModal';
import { HelpCenterModal } from './HelpCenterModal';
import ManageSubscriptionModal from './ManageSubscriptionModal';
import SecuritySettingsModal from './SecuritySettingsModal';
import DeleteAccountModal from './DeleteAccountModal';
import LegalDocumentModal from './LegalDocumentModal';
import { PreferencesManager } from './PreferencesManager';
import { BusinessLevelCard } from './business/BusinessLevelCard';
import { ReferralCodeCard } from './ReferralCodeCard';

interface SettingsViewProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onLogout?: () => void;
  onManageSubscription?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ isOpen, onClose, user, onLogout, onManageSubscription }) => {
  const { t } = useTranslation();
  const { userProfile, loadingProfile, refreshUserProfile } = useAuth();
  
  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    missions: true,
    squad: true,
    messages: true
  });

  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public' as 'public' | 'friends' | 'private',
    showActivity: true,
    showLocation: true
  });

  const [preferences, setPreferences] = useState({
    language: 'en',
    theme: 'light' as 'light' | 'dark' | 'auto'
  });

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showContactSupport, setShowContactSupport] = useState(false);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showManageSubscription, setShowManageSubscription] = useState(false);
  const [showSecuritySettings, setShowSecuritySettings] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [showLegalDocument, setShowLegalDocument] = useState(false);
  const [legalDocType, setLegalDocType] = useState<'terms' | 'privacy' | 'licenses'>('terms');

  // Load user preferences from Firestore
  useEffect(() => {
    if (isOpen && !loadingProfile && userProfile) {
      console.log('[SettingsView] Loading preferences from userProfile:', userProfile);
      
      const prefs = userProfile.preferences as UserPreferences | undefined;
      
      // Load notification preferences
      setNotifications({
        push: prefs?.notifications_push ?? true,
        email: prefs?.notifications_email ?? true,
        missions: prefs?.notifications_missions ?? true,
        squad: prefs?.notifications_squad ?? true,
        messages: prefs?.notifications_messages ?? true
      });

      // Load privacy preferences
      setPrivacy({
        profileVisibility: (prefs?.profile_visibility as any) || 'public',
        showActivity: prefs?.show_activity ?? true,
        showLocation: prefs?.show_location ?? true
      });

      // Load app preferences
      setPreferences({
        language: prefs?.language || 'en',
        theme: (localStorage.getItem('theme') as any) || (prefs?.theme as any) || 'light'
      });
    }
  }, [isOpen, loadingProfile, userProfile]);

  // Save theme to localStorage when changed
  useEffect(() => {
    if (preferences.theme) {
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
    }
  }, [preferences.theme]);

  // Save preferences automatically when changed
  useEffect(() => {
    if (!isOpen || !userProfile) return;

    const savePreferences = async () => {
      try {
        await api.updateUser(userProfile.uid, {
          preferences: {
            notifications_push: notifications.push,
            notifications_email: notifications.email,
            notifications_missions: notifications.missions,
            notifications_squad: notifications.squad,
            notifications_messages: notifications.messages,
            profile_visibility: privacy.profileVisibility,
            show_activity: privacy.showActivity,
            show_location: privacy.showLocation,
            language: preferences.language,
            theme: preferences.theme
          }
        });
        console.log('[SettingsView] Preferences saved automatically');
      } catch (error) {
        console.error('[SettingsView] Failed to save preferences:', error);
      }
    };

    // Debounce the save
    const timer = setTimeout(savePreferences, 1000);
    return () => clearTimeout(timer);
  }, [notifications, privacy, preferences, isOpen, userProfile]);

  if (!isOpen) return null;

  // Show loading state while profile is being fetched
  if (loadingProfile) {
    return (
      <div className="fixed inset-0 z-[80] bg-white flex flex-col animate-in slide-in-from-right duration-300">
        <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0 z-10">
           <h2 className="font-bold text-xl text-gray-900 flex items-center gap-2">
             <SettingsIcon className="w-5 h-5 text-gray-500" />
             {t('settings.title')}
           </h2>
           <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
             <X className="w-6 h-6 text-gray-500" />
           </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">{t('settings.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] bg-white flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0 z-10">
         <h2 className="font-bold text-xl text-gray-900 flex items-center gap-2">
           <SettingsIcon className="w-5 h-5 text-gray-500" />
           {t('settings.title')}
         </h2>
         <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
           <X className="w-6 h-6 text-gray-500" />
         </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto space-y-8 pb-20">
          
          {/* REFERRAL CODE SECTION */}
          <section>
            <ReferralCodeCard />
          </section>

          {/* BUSINESS LEVEL SECTION (For Business Users) */}
          {userProfile?.role === 'BUSINESS' && (
            <section>
              <BusinessLevelCard 
                businessId={userProfile.uid} 
                userProfile={userProfile}
              />
            </section>
          )}

          {/* 1. ACCOUNT SECTION */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Account
            </h3>
            <Card className="divide-y divide-gray-100">
              <button
                onClick={() => setShowManageSubscription(true)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Subscription</div>
                    <div className="text-xs text-gray-500">Manage your plan</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={() => setShowSecuritySettings(true)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Security</div>
                    <div className="text-xs text-gray-500">Password & two-factor auth</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={() => {
                  // Open notification preferences modal directly
                  window.dispatchEvent(new CustomEvent('open-notification-settings'));
                }}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-t border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Notifications</div>
                    <div className="text-xs text-gray-500">Manage notification preferences</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </Card>
          </section>

          {/* BUSINESS GOALS/PREFERENCES SECTION */}
          <section>
            <Card className="p-6">
              <PreferencesManager user={user} onSave={onClose} />
            </Card>
          </section>

          {/* 2. PRIVACY SECTION */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Privacy
            </h3>
            <Card className="divide-y divide-gray-100">
              <div className="p-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Profile Visibility</label>
                <select
                  value={privacy.profileVisibility}
                  onChange={(e) => setPrivacy({ ...privacy, profileVisibility: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 outline-none text-sm"
                >
                  <option value="public">Public - Everyone can see</option>
                  <option value="friends">Friends - Only connections</option>
                  <option value="private">Private - Only me</option>
                </select>
              </div>

              <div className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Show Activity Status</div>
                  <div className="text-xs text-gray-500">Let others see when you're active</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={privacy.showActivity} onChange={e => setPrivacy({ ...privacy, showActivity: e.target.checked })} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Share Location</div>
                  <div className="text-xs text-gray-500">Help partners find you locally</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={privacy.showLocation} onChange={e => setPrivacy({ ...privacy, showLocation: e.target.checked })} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <button
                onClick={() => setShowBlockedUsers(true)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <UserX className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Blocked Users</div>
                    <div className="text-xs text-gray-500">Manage blocked accounts</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </Card>
          </section>

          {/* 3. NOTIFICATIONS SECTION */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </h3>
            <Card className="divide-y divide-gray-100">
              {/* Push Notification Browser Permission Info */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <Smartphone className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">Browser Push Notifications</div>
                    <div className="text-xs text-gray-600 mb-3">
                      Enable browser notifications to receive real-time alerts even when the app is closed
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const { requestNotificationPermission, getFCMToken, saveFCMToken } = await import('../services/pushNotificationService');
                          const permission = await requestNotificationPermission();
                          if (permission === 'granted' && userProfile?.id) {
                            const VAPID_KEY = 'BPfGv_ZY-mw0Fss-84eYmgPK-DApUK0N8mXNuxE1JQOzbfnf4ZUdxoc78YLIVdzcznIEgGG07DYWS2h8o6b2Kuc';
                            const token = await getFCMToken(VAPID_KEY);
                            if (token) {
                              await saveFCMToken(userProfile.id, token);
                              setNotifications({ ...notifications, push: true });
                              alert('Push notifications enabled!');
                            }
                          }
                        } catch (error) {
                          console.error('Failed to enable push notifications:', error);
                          alert('Failed to enable push notifications. Please try again.');
                        }
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all"
                    >
                      Enable Browser Push
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Push Notifications</div>
                  <div className="text-xs text-gray-500">Receive alerts on your device</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={notifications.push} onChange={e => setNotifications({ ...notifications, push: e.target.checked })} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Email Notifications</div>
                  <div className="text-xs text-gray-500">Receive updates via email</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={notifications.email} onChange={e => setNotifications({ ...notifications, email: e.target.checked })} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Mission Alerts</div>
                  <div className="text-xs text-gray-500">Ambassador submissions & updates</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={notifications.missions} onChange={e => setNotifications({ ...notifications, missions: e.target.checked })} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Squad Alerts</div>
                  <div className="text-xs text-gray-500">New B2B matches & partnerships</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={notifications.squad} onChange={e => setNotifications({ ...notifications, squad: e.target.checked })} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Messages</div>
                  <div className="text-xs text-gray-500">New chat messages</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={notifications.messages} onChange={e => setNotifications({ ...notifications, messages: e.target.checked })} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </Card>
          </section>

          {/* 4. PREFERENCES SECTION */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              Preferences
            </h3>
            <Card className="divide-y divide-gray-100">
              <div className="p-4">
                <LanguageSelector />
              </div>

              <div className="p-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Theme</label>
                <select
                  value={preferences.theme}
                  onChange={(e) => setPreferences({ ...preferences, theme: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 outline-none text-sm"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto (System)</option>
                </select>
              </div>
            </Card>
          </section>

          {/* 5. LEGAL SECTION */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Legal
            </h3>
            <Card className="divide-y divide-gray-100">
              <button
                onClick={() => { setLegalDocType('terms'); setShowLegalDocument(true); }}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Terms of Service</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={() => { setLegalDocType('privacy'); setShowLegalDocument(true); }}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-gray-500" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Privacy Policy</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={() => { setLegalDocType('licenses'); setShowLegalDocument(true); }}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Open Source Licenses</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </Card>
          </section>

          {/* 6. SUPPORT SECTION */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Support
            </h3>
            <Card className="divide-y divide-gray-100">
              <button
                onClick={() => setShowHelpCenter(true)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Help Center</div>
                    <div className="text-xs text-gray-500">FAQs and guides</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={() => setShowContactSupport(true)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Contact Support</div>
                    <div className="text-xs text-gray-500">Get help from our team</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <div className="p-4">
                <div className="text-sm text-gray-500">App Version</div>
                <div className="font-mono text-xs text-gray-400 mt-1">v1.0.0</div>
              </div>
            </Card>
          </section>

          {/* 7. DANGER ZONE */}
          <section>
            <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </h3>
            <Card className="divide-y divide-gray-100 border-red-200">
              <button
                onClick={() => setShowDeleteAccount(true)}
                className="w-full p-4 flex items-center justify-between hover:bg-red-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-red-600">Delete Account</div>
                    <div className="text-xs text-gray-500">Permanently delete your business account</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={onLogout}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <LogOut className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Log Out</div>
                    <div className="text-xs text-gray-500">Sign out of your account</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </Card>
          </section>
        </div>
      </div>

      {/* Modals */}
      {showChangePassword && <ChangePasswordModal isOpen={showChangePassword} onClose={() => setShowChangePassword(false)} />}
      {showContactSupport && <ContactSupportModal isOpen={showContactSupport} onClose={() => setShowContactSupport(false)} />}
      {showBlockedUsers && <BlockedUsersModal isOpen={showBlockedUsers} onClose={() => setShowBlockedUsers(false)} currentUserId={userProfile?.id || ''} />}
      {showHelpCenter && <HelpCenterModal isOpen={showHelpCenter} onClose={() => setShowHelpCenter(false)} />}
      {showManageSubscription && <ManageSubscriptionModal isOpen={showManageSubscription} onClose={() => setShowManageSubscription(false)} />}
      {showSecuritySettings && <SecuritySettingsModal isOpen={showSecuritySettings} onClose={() => setShowSecuritySettings(false)} />}
      {showDeleteAccount && <DeleteAccountModal isOpen={showDeleteAccount} onClose={() => setShowDeleteAccount(false)} />}
      {showLegalDocument && <LegalDocumentModal isOpen={showLegalDocument} onClose={() => setShowLegalDocument(false)} documentType={legalDocType} />}

      {/* Footer - No Save Button */}
      <div className="p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] shrink-0">
          <div className="max-w-2xl mx-auto text-center text-sm text-gray-500">
              Settings are saved automatically
          </div>
      </div>
    </div>
  );
};
