import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Instagram, CheckCircle, XCircle, Loader } from 'lucide-react';
import { InstagramService } from '../services/instagramService';
import { User } from '../types';

interface InstagramCallbackScreenProps {
  user: User;
  onComplete: () => void;
}

export const InstagramCallbackScreen: React.FC<InstagramCallbackScreenProps> = ({ user, onComplete }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connecting your Instagram account...');
  const [errorTitle, setErrorTitle] = useState('Connection Failed');
  const [errorAction, setErrorAction] = useState<string>();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      console.log('[InstagramCallback] ===== Starting callback handler =====');
      console.log('[InstagramCallback] User:', user);
      console.log('[InstagramCallback] User ID:', user?.id);
      console.log('[InstagramCallback] Window location:', window.location.href);
      
      // Get authorization code from URL
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      const errorReason = urlParams.get('error_reason');
      const errorDescription = urlParams.get('error_description');

      console.log('[InstagramCallback] Code:', code ? `${code.substring(0, 20)}...` : 'null');
      console.log('[InstagramCallback] Error:', error);

      if (error) {
        // User cancelled or error from Instagram
        if (error === 'access_denied') {
          setErrorTitle('Connection Cancelled');
          setMessage('You cancelled the Instagram connection. No worries! You can try again whenever you are ready.');
          setErrorAction('Click "Connect Instagram" to try again');
        } else {
          setErrorTitle('Instagram Authorization Error');
          setMessage(errorDescription || errorReason || 'Instagram was unable to authorize the connection.');
          setErrorAction('Please try again or contact support if this persists');
        }
        setStatus('error');
        return;
      }

      if (!code) {
        setErrorTitle('Missing Authorization Code');
        setMessage('No authorization code was received from Instagram. This usually means the connection was interrupted.');
        setErrorAction('Please try connecting again');
        setStatus('error');
        return;
      }

      // Get userId from localStorage (stored before redirect)
      const storedUserId = localStorage.getItem('instagram_oauth_userId');
      const userId = user?.id || storedUserId;
      
      console.log('[InstagramCallback] Stored user ID from localStorage:', storedUserId);
      console.log('[InstagramCallback] Final user ID:', userId);
      
      if (!userId) {
        setErrorTitle('Session Error');
        setMessage('Your login session was not found. Please make sure you are logged in before connecting Instagram.');
        setErrorAction('Log in again and try connecting Instagram');
        setStatus('error');
        return;
      }

      setMessage('Exchanging authorization code...');

      console.log('[InstagramCallback] ===== Calling backend Cloud Function =====');
      console.log('[InstagramCallback] Code length:', code.length);
      console.log('[InstagramCallback] User ID:', userId);

      // Handle OAuth callback and save data
      await InstagramService.handleOAuthCallback(code, userId);
      
      console.log('[InstagramCallback] ===== Backend call completed successfully =====');
      
      // Clean up localStorage
      localStorage.removeItem('instagram_oauth_userId');

      setStatus('success');
      setMessage('Instagram connected successfully!');

      // Redirect back after 2 seconds
      setTimeout(() => {
        onComplete();
      }, 2000);

    } catch (error: any) {
      console.error('[InstagramCallback] Error:', error);
      setStatus('error');
      
      // Use enhanced error info if available
      setErrorTitle(error.title || 'Connection Failed');
      setMessage(error.message || 'An unexpected error occurred while connecting to Instagram.');
      setErrorAction(error.action || 'Please try again or contact support if this continues');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
            status === 'loading' ? 'bg-purple-100' :
            status === 'success' ? 'bg-green-100' :
            'bg-red-100'
          }`}>
            {status === 'loading' && <Loader className="w-10 h-10 text-purple-600 animate-spin" />}
            {status === 'success' && <CheckCircle className="w-10 h-10 text-green-600" />}
            {status === 'error' && <XCircle className="w-10 h-10 text-red-600" />}
          </div>

          {/* Instagram Logo */}
          <Instagram className="w-12 h-12 text-pink-600 mb-4" />

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {status === 'loading' && 'Connecting Instagram'}
            {status === 'success' && 'Connected!'}
            {status === 'error' && errorTitle}
          </h1>

          {/* Message */}
          <p className={`text-sm mb-4 ${
            status === 'error' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {message}
          </p>

          {/* Action hint for errors */}
          {status === 'error' && errorAction && (
            <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
              <p className="text-xs text-blue-800 font-medium">
                💡 {errorAction}
              </p>
            </div>
          )}

          {/* Action Button */}
          {status === 'error' && (
            <button
              onClick={onComplete}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              Go Back
            </button>
          )}

          {status === 'success' && (
            <div className="w-full bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                Redirecting you back to settings...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
