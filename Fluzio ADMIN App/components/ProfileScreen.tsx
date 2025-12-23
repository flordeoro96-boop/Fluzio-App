import React from 'react';
import { useAuth } from '../services/AuthContext';
import { Card } from './Common';
import { User as UserIcon, Mail, MapPin, Tag, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * ProfileScreen - Example component showing how to use userProfile from AuthContext
 * 
 * This demonstrates:
 * 1. Getting userProfile from useAuth hook
 * 2. Showing loading state while profile is being fetched
 * 3. Displaying profile data from Firestore
 */
export const ProfileScreen: React.FC = () => {
  const { user, userProfile, loadingProfile, refreshUserProfile } = useAuth();
  const { t } = useTranslation();

  // No Firebase user logged in
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('auth.notLoggedIn')}</h2>
          <p className="text-gray-600">{t('auth.pleaseLogIn')}</p>
        </Card>
      </div>
    );
  }

  // Profile is loading from Firestore
  if (loadingProfile || !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">{t('profile.loadingProfile')}</p>
        </Card>
      </div>
    );
  }

  // Profile loaded successfully!
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('profile.yourProfile')}</h1>
          <p className="text-gray-600">{t('profile.dataFromFirestore')}</p>
        </div>

        {/* Profile Card */}
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {userProfile.name ? userProfile.name[0].toUpperCase() : userProfile.email[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {userProfile.name || t('profile.noNameSet')}
              </h2>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                userProfile.role === 'CREATOR' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {userProfile.role}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Email */}
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase">{t('auth.email')}</div>
                <div className="text-gray-900">{userProfile.email}</div>
              </div>
            </div>

            {/* City */}
            {(userProfile.city || userProfile.homeCity) && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase">{t('profile.city')}</div>
                  <div className="text-gray-900">{userProfile.city || userProfile.homeCity}</div>
                </div>
              </div>
            )}

            {/* Vibe Tags */}
            {userProfile.vibeTags && userProfile.vibeTags.length > 0 && (
              <div className="flex items-start gap-3">
                <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('profile.vibeTags')}</div>
                  <div className="flex flex-wrap gap-2">
                    {userProfile.vibeTags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Profile Status */}
            <div className="flex items-start gap-3">
              <UserIcon className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase">{t('profile.profileStatus')}</div>
                <div className="text-gray-900">
                  {userProfile.profileComplete ? (
                    <span className="text-green-600 font-medium">✓ {t('profile.complete')}</span>
                  ) : (
                    <span className="text-amber-600 font-medium">⚠ {t('profile.incomplete')}</span>
                  )}
                </div>
              </div>
            </div>

            {/* UID (for debugging) */}
            <div className="flex items-start gap-3 pt-4 border-t border-gray-100">
              <div className="flex-1">
                <div className="text-xs font-semibold text-gray-400 uppercase">{t('profile.userId')}</div>
                <div className="text-xs text-gray-500 font-mono break-all">{userProfile.uid}</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Refresh Button */}
        <div className="text-center">
          <button
            onClick={refreshUserProfile}
            className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('profile.refreshProfile')}
          </button>
        </div>

        {/* Debug Info */}
        <Card className="p-4 bg-gray-50">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Raw Profile Data (Debug)</div>
          <pre className="text-xs text-gray-600 overflow-auto">
            {JSON.stringify(userProfile, null, 2)}
          </pre>
        </Card>
      </div>
    </div>
  );
};
