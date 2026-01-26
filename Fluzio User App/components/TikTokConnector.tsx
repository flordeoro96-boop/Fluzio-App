import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Music, ExternalLink, RefreshCw, Users, Video, AlertCircle, CheckCircle2, HelpCircle, Info } from 'lucide-react';
import { User } from '../types';
import { socialAuthService } from '../services/socialAuthService';

interface TikTokConnectorProps {
  user: User;
}

interface TikTokData {
  connected: boolean;
  handle?: string;
  displayName?: string;
  photoURL?: string;
  followers?: number;
  videos?: number;
  likes?: number;
  error?: string;
  lastSyncedAt?: string;
}

export const TikTokConnector: React.FC<TikTokConnectorProps> = ({ user }) => {
  const { t } = useTranslation();
  const [tiktokData, setTikTokData] = useState<TikTokData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    loadTikTokData();
  }, [user.id]);

  const loadTikTokData = async () => {
    try {
      setLoading(true);
      // TODO: TikTok integration not yet implemented
      // const tiktok = user.socialAccounts?.tiktok;
      setTikTokData({ connected: false });
    } catch (error) {
      console.error('[TikTokConnector] Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      // TODO: Implement TikTok OAuth
      // const result = await socialAuthService.linkTikTok();
      alert('TikTok integration coming soon!');
    } catch (error: any) {
      console.error('[TikTokConnector] Connect failed:', error);
      alert('Failed to connect TikTok');
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect TikTok? You will lose access to TikTok missions.')) {
      return;
    }

    try {
      // TODO: Implement TikTok unlink
      // const result = await socialAuthService.unlinkTikTok();
      setTikTokData({ connected: false });
      alert('TikTok disconnected successfully');
    } catch (error) {
      console.error('[TikTokConnector] Failed to disconnect:', error);
      alert('Failed to disconnect TikTok');
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await loadTikTokData();
      alert('TikTok data synced successfully');
    } catch (error: any) {
      console.error('[TikTokConnector] Sync failed:', error);
      alert('Failed to sync TikTok data');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      </div>
    );
  }

  const isConnected = tiktokData?.connected;
  const hasError = tiktokData?.error;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-black to-gray-900 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Music className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">TikTok</h3>
              <p className="text-white/80 text-sm">Connect your TikTok account</p>
            </div>
          </div>
          
          {isConnected && (
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium">Connected</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {hasError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Connection Error</p>
                <p className="text-sm text-red-700 mt-1">{tiktokData?.error}</p>
              </div>
            </div>
            <div className="ml-8 bg-red-100 rounded px-3 py-2">
              <p className="text-xs font-medium text-red-900 mb-1">What to try:</p>
              <ul className="text-xs text-red-800 space-y-1 list-disc ml-4">
                <li>Click "Disconnect" below and try connecting again</li>
                <li>Make sure your TikTok account is active</li>
                <li>Check that you approved all permissions</li>
                <li>If the problem persists, contact support</li>
              </ul>
            </div>
          </div>
        )}

        {!isConnected ? (
          // Not Connected State
          <div className="text-center py-8">
            <Music className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-gray-900 font-semibold text-lg mb-2">Connect TikTok</h4>
            <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto">
              Link your TikTok account to complete video missions, grow your audience, and unlock creator features.
            </p>
            
            <button
              onClick={handleConnect}
              className="bg-gradient-to-r from-black to-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:from-gray-900 hover:to-black transition-all inline-flex items-center gap-2 min-h-[44px]"
            >
              <Music className="w-5 h-5" />
              Connect TikTok
              <ExternalLink className="w-4 h-4" />
            </button>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-3">You'll be able to:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">Display profile</span>
                <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">Show follower count</span>
                <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">Complete video missions</span>
                <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">Earn bonus points</span>
              </div>
            </div>

            {/* Help Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="w-full flex items-center justify-between text-left hover:bg-gray-50 p-3 rounded-lg transition-colors min-h-[44px]"
              >
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Need help connecting?</span>
                </div>
                <span className="text-xs text-gray-500">{showHelp ? 'Hide' : 'Show'}</span>
              </button>

              {showHelp && (
                <div className="mt-4 space-y-4 text-left">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      What you'll need
                    </h4>
                    <ul className="text-xs text-blue-800 space-y-1.5 ml-6 list-disc">
                      <li>An active TikTok account</li>
                      <li>Access to the email associated with your TikTok</li>
                      <li>Permission to allow Beevvy to access basic info</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-purple-900 mb-2">Step-by-step</h4>
                    <ol className="text-xs text-purple-800 space-y-1.5 ml-6 list-decimal">
                      <li>Click "Connect TikTok" above</li>
                      <li>Log in to your TikTok account</li>
                      <li>Review and approve permissions</li>
                      <li>You'll be redirected back to Beevvy</li>
                    </ol>
                  </div>

                  <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-green-900 mb-2">Privacy & Security</h4>
                    <ul className="text-xs text-green-800 space-y-1.5 ml-6 list-disc">
                      <li>We only access basic profile information</li>
                      <li>We never post on your behalf</li>
                      <li>You can disconnect anytime</li>
                      <li>Your data is encrypted and secure</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Connected State
          <div className="space-y-4">
            {/* Profile Info */}
            <div className="flex items-center gap-4">
              {tiktokData.photoURL && (
                <img 
                  src={tiktokData.photoURL} 
                  alt={tiktokData.displayName} 
                  className="w-16 h-16 rounded-full border-2 border-gray-200" 
                />
              )}
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{tiktokData.displayName || 'TikTok User'}</h4>
                {tiktokData.handle && (
                  <p className="text-sm text-gray-600">@{tiktokData.handle}</p>
                )}
                {tiktokData.lastSyncedAt && (
                  <p className="text-xs text-gray-500 mt-1">
                    Last synced: {new Date(tiktokData.lastSyncedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            {/* Stats */}
            {(tiktokData.followers || tiktokData.videos || tiktokData.likes) && (
              <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-gray-200">
                {tiktokData.followers !== undefined && (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                      <Users className="w-4 h-4" />
                    </div>
                    <p className="text-lg font-bold text-gray-900">{tiktokData.followers.toLocaleString()}</p>
                    <p className="text-xs text-gray-600">Followers</p>
                  </div>
                )}
                {tiktokData.videos !== undefined && (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                      <Video className="w-4 h-4" />
                    </div>
                    <p className="text-lg font-bold text-gray-900">{tiktokData.videos.toLocaleString()}</p>
                    <p className="text-xs text-gray-600">Videos</p>
                  </div>
                )}
                {tiktokData.likes !== undefined && (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                      <Music className="w-4 h-4" />
                    </div>
                    <p className="text-lg font-bold text-gray-900">{tiktokData.likes.toLocaleString()}</p>
                    <p className="text-xs text-gray-600">Likes</p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg font-semibold hover:bg-gray-200 transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Data'}
              </button>
              <button
                onClick={handleDisconnect}
                className="flex-1 bg-red-50 text-red-700 px-4 py-2.5 rounded-lg font-semibold hover:bg-red-100 transition-colors min-h-[44px]"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
