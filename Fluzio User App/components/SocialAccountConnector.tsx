import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { 
  Instagram, 
  Linkedin, 
  Music2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { InstagramService } from '../services/instagramService';
import { socialAuthService } from '../services/socialAuthService';
import { useAuth } from '../services/AuthContext';
import { auth } from '../services/AuthContext';

interface SocialAccountConnectorProps {
  user: User;
  platform: 'google' | 'instagram' | 'tiktok' | 'linkedin';
}

export const SocialAccountConnector: React.FC<SocialAccountConnectorProps> = ({ user, platform }) => {
  const { refreshUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountData, setAccountData] = useState<any>(null);

  useEffect(() => {
    loadAccountData();
  }, [user, platform]);

  const loadAccountData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (platform === 'instagram') {
        const data = await InstagramService.getUserInstagramData(user.id);
        setAccountData(data);
      } else if (platform === 'google') {
        // Check if Google is linked via Firebase Auth
        const currentUser = auth.currentUser;
        if (currentUser) {
          const googleProvider = currentUser.providerData.find(p => p.providerId === 'google.com');
          
          if (googleProvider) {
            setAccountData({
              connected: true,
              email: googleProvider.email,
              displayName: googleProvider.displayName,
              photoURL: googleProvider.photoURL
            });
          }
        }
      } else if (platform === 'tiktok') {
        // TikTok implementation - placeholder
        const socialAccounts = user.socialAccounts || {};
        setAccountData(socialAccounts.tiktok || null);
      } else if (platform === 'linkedin') {
        // LinkedIn implementation - placeholder
        const socialAccounts = user.socialAccounts || {};
        setAccountData(socialAccounts.linkedin || null);
      }
    } catch (err: any) {
      console.error(`[${platform}] Load error:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      setError(null);

      if (platform === 'instagram') {
        InstagramService.startAuthFlow(user.id);
        return;
      } else if (platform === 'google') {
        const result = await socialAuthService.linkGoogle();
        if (result.success) {
          await refreshUserProfile();
          await loadAccountData();
        } else {
          throw new Error(result.error || 'Failed to connect Google');
        }
      } else if (platform === 'tiktok') {
        // TikTok OAuth - Coming soon
        alert('TikTok integration coming soon! We\'re working on bringing TikTok creator features to Fluzio.');
        return;
      } else if (platform === 'linkedin') {
        // LinkedIn OAuth - Coming soon
        alert('LinkedIn integration coming soon! Connect your professional network with Fluzio.');
        return;
      }
    } catch (err: any) {
      console.error(`[${platform}] Connect error:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm(`Are you sure you want to disconnect ${getPlatformName()}?`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (platform === 'instagram') {
        await InstagramService.disconnectInstagram(user.id);
      } else if (platform === 'google') {
        const result = await socialAuthService.unlinkGoogle();
        if (result.success) {
          await refreshUserProfile();
        } else {
          throw new Error(result.error || 'Failed to disconnect Google');
        }
      }

      setAccountData(null);
    } catch (err: any) {
      console.error(`[${platform}] Disconnect error:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await loadAccountData();
      await refreshUserProfile();
    } catch (err: any) {
      console.error(`[${platform}] Sync error:`, err);
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const getPlatformName = () => {
    const names: Record<string, string> = {
      google: 'Google',
      instagram: 'Instagram',
      tiktok: 'TikTok',
      linkedin: 'LinkedIn'
    };
    return names[platform] || platform;
  };

  const getPlatformIcon = () => {
    const icons: Record<string, React.ReactNode> = {
      google: (
        <svg className="w-7 h-7" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      ),
      instagram: <Instagram className="w-7 h-7 text-pink-600" />,
      tiktok: <Music2 className="w-7 h-7 text-black" />,
      linkedin: <Linkedin className="w-7 h-7 text-blue-700" />
    };
    return icons[platform] || null;
  };

  const getPlatformGradient = () => {
    const gradients: Record<string, string> = {
      google: 'from-blue-500 to-red-500',
      instagram: 'from-purple-600 to-pink-600',
      tiktok: 'from-black to-teal-400',
      linkedin: 'from-blue-700 to-blue-500'
    };
    return gradients[platform] || 'from-gray-600 to-gray-400';
  };

  const isConnected = accountData?.connected || accountData !== null;
  const comingSoon = platform === 'tiktok' || platform === 'linkedin';

  if (loading && !isConnected) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r ${getPlatformGradient()} p-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              {getPlatformIcon()}
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">{getPlatformName()}</h3>
              <p className="text-white/80 text-sm">
                {comingSoon ? 'Coming soon' : `Connect your ${getPlatformName()} account`}
              </p>
            </div>
          </div>
          
          {isConnected && !comingSoon && (
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium">Connected</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Connection Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {comingSoon ? (
          // Coming Soon State
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {getPlatformIcon()}
            </div>
            <h4 className="text-gray-900 font-semibold text-lg mb-2">Coming Soon</h4>
            <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto">
              We're working hard to bring {getPlatformName()} integration to Fluzio. 
              Stay tuned for updates!
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-medium mb-2">What's coming:</p>
              <ul className="text-xs text-blue-700 space-y-1 text-left max-w-sm mx-auto">
                {platform === 'tiktok' && (
                  <>
                    <li>• Connect your TikTok creator account</li>
                    <li>• Display follower count and engagement</li>
                    <li>• Sync your latest videos</li>
                    <li>• Auto-post mission content</li>
                  </>
                )}
                {platform === 'linkedin' && (
                  <>
                    <li>• Link your professional profile</li>
                    <li>• Showcase your network size</li>
                    <li>• B2B collaboration features</li>
                    <li>• Professional verification</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        ) : !isConnected ? (
          // Not Connected State
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {getPlatformIcon()}
            </div>
            <h4 className="text-gray-900 font-semibold text-lg mb-2">Connect {getPlatformName()}</h4>
            <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto">
              {platform === 'google' && 'Link your Google account for enhanced security and profile verification.'}
              {platform === 'instagram' && 'Link your Instagram account to showcase your content and grow your audience.'}
            </p>
            
            <button
              onClick={handleConnect}
              disabled={loading}
              className={`bg-gradient-to-r ${getPlatformGradient()} text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                getPlatformIcon()
              )}
              Connect {getPlatformName()}
              <ExternalLink className="w-4 h-4" />
            </button>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-3">Benefits:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {platform === 'google' && (
                  <>
                    <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full">Verified profile</span>
                    <span className="text-xs bg-red-50 text-red-700 px-3 py-1 rounded-full">Enhanced security</span>
                    <span className="text-xs bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full">Easy sign-in</span>
                  </>
                )}
                {platform === 'instagram' && (
                  <>
                    <span className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full">Display profile</span>
                    <span className="text-xs bg-pink-50 text-pink-700 px-3 py-1 rounded-full">Show followers</span>
                    <span className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full">Sync posts</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Connected State
          <div>
            {/* Account Info */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
              {accountData.photoURL && (
                <img 
                  src={accountData.photoURL} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
              {!accountData.photoURL && (
                <div className={`w-16 h-16 bg-gradient-to-br ${getPlatformGradient()} rounded-full flex items-center justify-center`}>
                  {getPlatformIcon()}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-gray-900">
                    {accountData.username || accountData.displayName || accountData.email}
                  </h4>
                  {accountData.accountType && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                      {accountData.accountType}
                    </span>
                  )}
                </div>
                {accountData.followers !== undefined && (
                  <div className="text-sm text-gray-600">
                    {accountData.followers.toLocaleString()} followers
                  </div>
                )}
                {accountData.email && platform === 'google' && (
                  <div className="text-sm text-gray-600">{accountData.email}</div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex-1 bg-purple-50 text-purple-700 px-4 py-2.5 rounded-lg font-medium hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Refreshing...' : 'Refresh'}
              </button>
              
              <button
                onClick={handleDisconnect}
                disabled={loading}
                className="flex-1 bg-red-50 text-red-700 px-4 py-2.5 rounded-lg font-medium hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Disconnect
              </button>
            </div>

            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">Account Connected</p>
                  <p className="text-sm text-green-700 mt-1">
                    Your {getPlatformName()} account is successfully linked.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
