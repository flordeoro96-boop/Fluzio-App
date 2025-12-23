import React, { useState, useEffect } from 'react';
import { 
  Shield, Save, RefreshCw, AlertCircle, CheckCircle,
  Database, Mail, Bell, Lock, Globe, Zap
} from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/AuthContext';
import { AdminPermissions } from '../../services/adminAuthService';

interface PlatformSettings {
  maintenanceMode: boolean;
  newUserRegistration: boolean;
  missionCreationEnabled: boolean;
  rewardRedemptionEnabled: boolean;
  notificationsEnabled: boolean;
  minPointsForRedemption: number;
  maxMissionsPerBusiness: number;
  platformFeePercentage: number;
  defaultUserLevel: number;
  defaultBusinessLevel: number;
}

interface AdminSettingsProps {
  adminId: string;
  adminPerms: AdminPermissions;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ adminId, adminPerms }) => {
  // Only Super Admins can access settings
  if (adminPerms.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[#1E0E62] mb-2">Super Admin Only</h3>
          <p className="text-[#8F8FA3]">Platform settings can only be modified by Super Admins</p>
        </div>
      </div>
    );
  }
  const [settings, setSettings] = useState<PlatformSettings>({
    maintenanceMode: false,
    newUserRegistration: true,
    missionCreationEnabled: true,
    rewardRedemptionEnabled: true,
    notificationsEnabled: true,
    minPointsForRedemption: 100,
    maxMissionsPerBusiness: 50,
    platformFeePercentage: 0,
    defaultUserLevel: 1,
    defaultBusinessLevel: 1
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const settingsDoc = await getDoc(doc(db, 'platformSettings', 'config'));
      if (settingsDoc.exists()) {
        setSettings(settingsDoc.data() as PlatformSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await updateDoc(doc(db, 'platformSettings', 'config'), {
        ...settings,
        lastUpdated: new Date(),
        updatedBy: adminId
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof PlatformSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleNumberChange = (key: keyof PlatformSettings, value: string) => {
    const numValue = parseInt(value) || 0;
    setSettings(prev => ({
      ...prev,
      [key]: numValue
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#00E5FF] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1E0E62]">Platform Settings</h2>
          <p className="text-gray-600">Configure global platform settings and features</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadSettings}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Reload
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-xl">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="font-bold text-green-800">Settings Saved Successfully</h3>
              <p className="text-sm text-green-700">All changes have been applied</p>
            </div>
          </div>
        </div>
      )}

      {/* Warning Banner */}
      {settings.maintenanceMode && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-xl">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="font-bold text-red-800">Maintenance Mode Active</h3>
              <p className="text-sm text-red-700">Platform is in maintenance mode - users cannot access the app</p>
            </div>
          </div>
        </div>
      )}

      {/* Platform Status */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-[#1E0E62] mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Platform Status
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-700">Maintenance Mode</div>
              <div className="text-sm text-gray-500">Temporarily disable platform access</div>
            </div>
            <button
              onClick={() => handleToggle('maintenanceMode')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.maintenanceMode ? 'bg-red-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-700">New User Registration</div>
              <div className="text-sm text-gray-500">Allow new users to sign up</div>
            </div>
            <button
              onClick={() => handleToggle('newUserRegistration')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.newUserRegistration ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.newUserRegistration ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-700">Notifications</div>
              <div className="text-sm text-gray-500">Enable push notifications</div>
            </div>
            <button
              onClick={() => handleToggle('notificationsEnabled')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.notificationsEnabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-[#1E0E62] mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Feature Toggles
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-700">Mission Creation</div>
              <div className="text-sm text-gray-500">Allow businesses to create new missions</div>
            </div>
            <button
              onClick={() => handleToggle('missionCreationEnabled')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.missionCreationEnabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.missionCreationEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-700">Reward Redemption</div>
              <div className="text-sm text-gray-500">Allow users to redeem rewards</div>
            </div>
            <button
              onClick={() => handleToggle('rewardRedemptionEnabled')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.rewardRedemptionEnabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.rewardRedemptionEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Numerical Settings */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-[#1E0E62] mb-4 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Platform Limits
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Min Points for Redemption
            </label>
            <input
              type="number"
              value={settings.minPointsForRedemption}
              onChange={(e) => handleNumberChange('minPointsForRedemption', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Missions per Business
            </label>
            <input
              type="number"
              value={settings.maxMissionsPerBusiness}
              onChange={(e) => handleNumberChange('maxMissionsPerBusiness', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Platform Fee (%)
            </label>
            <input
              type="number"
              value={settings.platformFeePercentage}
              onChange={(e) => handleNumberChange('platformFeePercentage', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default User Level
            </label>
            <input
              type="number"
              value={settings.defaultUserLevel}
              onChange={(e) => handleNumberChange('defaultUserLevel', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Business Level
            </label>
            <input
              type="number"
              value={settings.defaultBusinessLevel}
              onChange={(e) => handleNumberChange('defaultBusinessLevel', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200">
        <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Danger Zone
        </h3>
        <div className="space-y-3">
          <p className="text-sm text-red-700">
            These actions are irreversible and can significantly impact the platform.
          </p>
          <div className="flex gap-3">
            <button
              className="px-4 py-2 bg-white border-2 border-red-300 text-red-700 rounded-xl font-bold hover:bg-red-50 transition-all"
              onClick={() => alert('Clear cache functionality coming soon')}
            >
              Clear Cache
            </button>
            <button
              className="px-4 py-2 bg-white border-2 border-red-300 text-red-700 rounded-xl font-bold hover:bg-red-50 transition-all"
              onClick={() => alert('Reset analytics functionality coming soon')}
            >
              Reset Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
