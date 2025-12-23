import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Instagram, ExternalLink, RefreshCw, Users, Grid, AlertCircle, CheckCircle2, XCircle, HelpCircle, Info } from 'lucide-react';
import { InstagramService, InstagramData, InstagramPost } from '../services/instagramService';
import { User } from '../types';

interface InstagramConnectorProps {
  user: User;
}

export const InstagramConnector: React.FC<InstagramConnectorProps> = ({ user }) => {
  const [instagramData, setInstagramData] = useState<InstagramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [showPosts, setShowPosts] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    loadInstagramData();
  }, [user.id]);

  const loadInstagramData = async () => {
    try {
      setLoading(true);
      const data = await InstagramService.getUserInstagramData(user.id);
      setInstagramData(data);
    } catch (error) {
      console.error('[InstagramConnector] Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    InstagramService.startAuthFlow(user.id);
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Instagram?')) {
      return;
    }

    try {
      await InstagramService.disconnectInstagram(user.id);
      setInstagramData(null);
      setPosts([]);
    } catch (error) {
      console.error('[InstagramConnector] Failed to disconnect:', error);
      alert('Failed to disconnect Instagram');
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      // Reload data from Firestore
      await loadInstagramData();
    } catch (error: any) {
      console.error('[InstagramConnector] Sync failed:', error);
      alert(error.message || 'Failed to sync Instagram data');
    } finally {
      setSyncing(false);
    }
  };

  const handleLoadPosts = async () => {
    // Posts feature coming soon - requires additional Instagram permissions
    alert('Instagram posts feature coming soon! For now, you can view your Instagram profile.');
    return;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-purple-600 animate-spin" />
        </div>
      </div>
    );
  }

  const isConnected = instagramData?.connected;
  const hasError = instagramData?.error;
  const needsRefresh = false; // Token refresh will be handled by backend in the future

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Instagram className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Instagram</h3>
              <p className="text-white/80 text-sm">Connect your Instagram account</p>
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
                <p className="text-sm text-red-700 mt-1">{instagramData?.error}</p>
              </div>
            </div>
            <div className="ml-8 bg-red-100 rounded px-3 py-2">
              <p className="text-xs font-medium text-red-900 mb-1">What to try:</p>
              <ul className="text-xs text-red-800 space-y-1 list-disc ml-4">
                <li>Click \"Disconnect\" below and try connecting again</li>
                <li>Make sure your Instagram account is active</li>
                <li>Check that you approved all permissions</li>
                <li>If the problem persists, contact our support team</li>
              </ul>
            </div>
          </div>
        )}

        {needsRefresh && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900">Token Expiring Soon</p>
              <p className="text-sm text-yellow-700 mt-1">Your Instagram connection will expire soon. Please refresh.</p>
            </div>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="text-yellow-700 hover:text-yellow-900 font-medium text-sm flex items-center gap-1"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        )}

        {!isConnected ? (
          // Not Connected State
          <div className="text-center py-8">
            <Instagram className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-gray-900 font-semibold text-lg mb-2">Connect Instagram</h4>
            <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto">
              Link your Instagram account to showcase your content, grow your audience, and unlock creator features.
            </p>
            
            <button
              onClick={handleConnect}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all inline-flex items-center gap-2"
            >
              <Instagram className="w-5 h-5" />
              Connect Instagram
              <ExternalLink className="w-4 h-4" />
            </button>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-3">You'll be able to:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full">Display profile</span>
                <span className="text-xs bg-pink-50 text-pink-700 px-3 py-1 rounded-full">Show follower count</span>
                <span className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full">Sync posts</span>
                <span className="text-xs bg-pink-50 text-pink-700 px-3 py-1 rounded-full">Auto-refresh</span>
              </div>
            </div>

            {/* Help Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="w-full flex items-center justify-between text-left hover:bg-gray-50 p-3 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-purple-600" />
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
                      <li>An Instagram account (Personal, Business, or Creator)</li>
                      <li>Access to the email/phone linked to your Instagram</li>
                      <li>Stable internet connection</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-purple-900 mb-2">
                      Step-by-step guide
                    </h4>
                    <ol className="text-xs text-purple-800 space-y-2 ml-4 list-decimal">
                      <li>Click <strong>"Connect Instagram"</strong> above</li>
                      <li>You'll be redirected to Instagram's login page</li>
                      <li>Log in with your Instagram credentials</li>
                      <li>Review and <strong>approve all permissions</strong></li>
                      <li>You'll be redirected back to Fluzio</li>
                      <li>Your Instagram will be connected!</li>
                    </ol>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Troubleshooting
                    </h4>
                    <div className="text-xs text-yellow-800 space-y-2">
                      <div>
                        <p className="font-medium">Connection keeps failing?</p>
                        <p className="mt-0.5">Complete the process within 60 seconds - authorization codes expire quickly.</p>
                      </div>
                      <div>
                        <p className="font-medium">Permissions not working?</p>
                        <p className="mt-0.5">Make sure to approve <strong>all permissions</strong> when Instagram asks.</p>
                      </div>
                      <div>
                        <p className="font-medium">Still having issues?</p>
                        <p className="mt-0.5">Try clearing your browser cache and cookies, then try again.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Connected State
          <div>
            {/* Profile Info */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                <Instagram className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-gray-900">@{instagramData.username}</h4>
                  {instagramData.accountType && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                      {instagramData.accountType}
                    </span>
                  )}
                </div>
                {instagramData.followers !== undefined && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{instagramData.followers.toLocaleString()} posts</span>
                  </div>
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
                className="flex-1 bg-red-50 text-red-700 px-4 py-2.5 rounded-lg font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Disconnect
              </button>
            </div>

            {/* Connection Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">Account Connected</p>
                  <p className="text-sm text-green-700 mt-1">
                    Your Instagram account is successfully linked. You can now showcase your Instagram presence on your Fluzio profile.
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
