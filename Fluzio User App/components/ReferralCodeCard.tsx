import React, { useState, useEffect } from 'react';
import { Share2, Copy, Check, Users, Gift } from 'lucide-react';
import { useAuth } from '../services/AuthContext';
import { initializeReferralCode, getReferralStats, REFERRAL_CONFIG } from '../services/referralService';

export const ReferralCodeCard: React.FC = () => {
  const { userProfile } = useAuth();
  const [referralCode, setReferralCode] = useState<string>('');
  const [stats, setStats] = useState({ referralCount: 0, referralPoints: 0, totalEarned: 0 });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReferralData();
  }, [userProfile?.uid]);

  const loadReferralData = async () => {
    if (!userProfile?.uid) return;
    
    try {
      setLoading(true);
      
      // Initialize or get existing referral code
      const code = await initializeReferralCode(userProfile.uid, userProfile.name);
      setReferralCode(code);
      
      // Get referral statistics
      const referralStats = await getReferralStats(userProfile.uid);
      setStats(referralStats);
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const shareReferralCode = async () => {
    const shareText = `Join Beevvy with my referral code ${referralCode} and we both get ${REFERRAL_CONFIG.POINTS_FOR_NEW_USER} points! 🎉`;
    const shareUrl = `${window.location.origin}?ref=${referralCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Beevvy',
          text: shareText,
          url: shareUrl
        });
      } catch (error) {
        console.log('Share cancelled or failed:', error);
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
        <div className="animate-pulse">
          <div className="h-4 bg-purple-200 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-purple-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-purple-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
          <Gift className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-sm">Referral Code</h3>
          <p className="text-xs text-gray-600">Share & Earn Points</p>
        </div>
      </div>

      {/* Referral Code Display */}
      <div className="bg-white rounded-lg p-3 mb-3 border-2 border-dashed border-purple-300">
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600 tracking-wider mb-1">
            {referralCode}
          </div>
          <div className="text-xs text-gray-500">Your unique referral code</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={copyToClipboard}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-purple-300 rounded-lg hover:bg-purple-50 transition-all text-sm font-medium text-purple-700"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy</span>
            </>
          )}
        </button>
        <button
          onClick={shareReferralCode}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white rounded-lg p-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users className="w-3 h-3 text-purple-600" />
            <span className="text-xs text-gray-600">Referrals</span>
          </div>
          <div className="text-lg font-bold text-gray-900">{stats.referralCount}</div>
        </div>
        <div className="bg-white rounded-lg p-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Gift className="w-3 h-3 text-pink-600" />
            <span className="text-xs text-gray-600">Earned</span>
          </div>
          <div className="text-lg font-bold text-gray-900">{stats.totalEarned}</div>
        </div>
      </div>

      {/* Info Text */}
      <div className="mt-3 p-2 bg-white rounded-lg">
        <p className="text-xs text-gray-600 text-center">
          Earn <span className="font-bold text-purple-600">{REFERRAL_CONFIG.POINTS_FOR_REFERRER} points</span> for each friend who joins!
          <br />
          They get <span className="font-bold text-pink-600">{REFERRAL_CONFIG.POINTS_FOR_NEW_USER} bonus points</span> too! 🎁
        </p>
      </div>
    </div>
  );
};
