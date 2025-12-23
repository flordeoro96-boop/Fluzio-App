/**
 * ShopifyVisitMissionCard Component
 * 
 * Special mission card for Shopify store visits with visit tracking.
 * Shows store preview, visit button, and verification status.
 */

import React, { useState, useEffect } from 'react';
import { ExternalLink, Clock, Award, Check, ShoppingBag, Eye } from 'lucide-react';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../services/AuthContext';
import { Mission } from '../src/types/models';
import { 
  generateTrackingUrl, 
  startVisitTracking, 
  endVisitTracking,
  hasVisitedToday,
  formatDuration 
} from '../services/shopifyVisitService';
import { WebsiteVisitFeedback } from './WebsiteVisitFeedback';
import { submitWebsiteFeedback } from '../services/websiteFeedbackService';

interface ShopifyVisitMissionCardProps {
  mission: Mission;
  userId: string;
  userName: string;
  userAvatar?: string;
  onVisitComplete?: (points: number) => void;
}

export const ShopifyVisitMissionCard: React.FC<ShopifyVisitMissionCardProps> = ({
  mission,
  userId,
  userName,
  userAvatar,
  onVisitComplete
}) => {
  const [visitStarted, setVisitStarted] = useState(false);
  const [visitTime, setVisitTime] = useState(0);
  const [hasVisited, setHasVisited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackData, setFeedbackData] = useState<{ businessId: string; missionId: string } | null>(null);
  const [currentReferralCode, setCurrentReferralCode] = useState<string | null>(null);

  const shopifyConfig = mission.shopifyVisit;
  const minDuration = shopifyConfig?.minDuration || 30;

  // Check if already visited today
  useEffect(() => {
    checkVisitStatus();
  }, []);

  // Timer for visit duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (visitStarted && !completed) {
      interval = setInterval(() => {
        setVisitTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [visitStarted, completed]);

  const checkVisitStatus = async () => {
    const visited = await hasVisitedToday(userId, mission.businessId);
    setHasVisited(visited);
  };

  const handleVisitStore = async () => {
    if (!shopifyConfig?.storeUrl) return;
    
    setLoading(true);
    try {
      // Generate tracking URL
      const { url, referralCode } = generateTrackingUrl(
        shopifyConfig.storeUrl,
        userId,
        mission.businessId,
        mission.id
      );

      // Start tracking
      await startVisitTracking(
        userId,
        userName,
        mission.businessId,
        mission.businessName || 'Business',
        shopifyConfig.storeUrl,
        referralCode,
        mission.id,
        userAvatar
      );

      setCurrentReferralCode(referralCode);
      setVisitStarted(true);
      setVisitTime(0);

      // Open store in new window
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error starting visit:', error);
      alert('Failed to start visit tracking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyVisit = async () => {
    if (!currentReferralCode) return;
    
    setVerifying(true);
    try {
      const result = await endVisitTracking(currentReferralCode, {
        deviceType: /Mobile/.test(navigator.userAgent) ? 'mobile' : 'desktop',
        browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                 navigator.userAgent.includes('Firefox') ? 'Firefox' : 
                 navigator.userAgent.includes('Safari') ? 'Safari' : 'Other'
      });

      if (result.verified) {
        setCompleted(true);
        setPointsEarned(result.pointsAwarded);
        setHasVisited(true);
        
        if (onVisitComplete) {
          onVisitComplete(result.pointsAwarded);
        }

        // Show feedback modal if visit was verified
        if (result.showFeedback && result.businessId && result.missionId) {
          setFeedbackData({
            businessId: result.businessId,
            missionId: result.missionId
          });
          setShowFeedbackModal(true);
        }
      } else {
        alert(`Visit too short! Please browse for at least ${minDuration} seconds. You browsed for ${result.duration}s.`);
      }
    } catch (error) {
      console.error('Error verifying visit:', error);
      alert('Failed to verify visit. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const remainingTime = Math.max(0, minDuration - visitTime);
  const isEligible = visitTime >= minDuration;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">{mission.title}</h3>
            <p className="text-sm text-white/90">{mission.businessName}</p>
          </div>
          {hasVisited && (
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              <Check className="w-3 h-3" />
              Visited
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Description */}
        <p className="text-gray-700 text-sm">{mission.description}</p>

        {/* Store URL */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-600 mb-1">Store URL</p>
          <p className="font-mono text-sm text-gray-900 truncate">
            {shopifyConfig?.storeUrl}
          </p>
        </div>

        {/* Requirements */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-blue-900 text-sm">Requirements</span>
          </div>
          <ul className="space-y-1 text-sm text-blue-800">
            <li className="flex items-center gap-2">
              <span className="text-blue-600">•</span>
              Visit the Shopify store
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-600">•</span>
              Browse for at least {minDuration} seconds
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-600">•</span>
              Return to verify and claim points
            </li>
          </ul>
        </div>

        {/* Reward */}
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-900">Reward</span>
          </div>
          <span className="text-2xl font-bold text-green-600">
            {mission.points || 20} pts
          </span>
        </div>

        {/* Visit Timer (when active) */}
        {visitStarted && !completed && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-center">
              <p className="text-sm text-purple-700 mb-2">Visit Duration</p>
              <div className="text-3xl font-bold text-purple-900 mb-2">
                {formatDuration(visitTime)}
              </div>
              {!isEligible ? (
                <p className="text-sm text-purple-600">
                  {formatDuration(remainingTime)} remaining
                </p>
              ) : (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <Check className="w-5 h-5" />
                  <span className="font-semibold">Ready to verify!</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success Message */}
        {completed && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-bold text-green-900 mb-1">Visit Verified!</h4>
            <p className="text-sm text-green-700">
              You earned <span className="font-bold">{pointsEarned} points</span>
            </p>
            <p className="text-xs text-green-600 mt-1">
              Browsed for {formatDuration(visitTime)}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {!visitStarted && !hasVisited && (
            <button
              onClick={handleVisitStore}
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 font-semibold transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Starting...
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Visit Store & Start Tracking
                </>
              )}
            </button>
          )}

          {visitStarted && !completed && (
            <button
              onClick={handleVerifyVisit}
              disabled={!isEligible || verifying}
              className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                isEligible
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {verifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Verifying...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Verify Visit & Claim Points
                </>
              )}
            </button>
          )}

          {hasVisited && !visitStarted && (
            <div className="text-center py-3 text-gray-600">
              <p className="text-sm">You've already visited this store today!</p>
              <p className="text-xs text-gray-500 mt-1">Come back tomorrow for more points</p>
            </div>
          )}
        </div>

        {/* Help Text */}
        {visitStarted && !completed && (
          <p className="text-xs text-gray-500 text-center">
            💡 Tip: Browse products, read descriptions, add items to cart for best results
          </p>
        )}
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && feedbackData && (
        <WebsiteVisitFeedback
          businessId={feedbackData.businessId}
          businessName={mission.businessName || 'this business'}
          businessLogo={mission.businessLogo}
          missionId={feedbackData.missionId}
          onClose={() => setShowFeedbackModal(false)}
          onSubmit={async (feedback) => {
            try {
              await submitWebsiteFeedback(userId, feedback);
              // Award bonus points for feedback
              const userRef = doc(db, 'users', userId);
              await updateDoc(userRef, {
                points: increment(50)
              }); // +50 points for feedback
              
              // Update total points earned
              setPointsEarned(pointsEarned + 50);
              
              if (onVisitComplete) {
                onVisitComplete(50); // Notify parent of bonus points
              }
            } catch (error) {
              console.error('Failed to submit feedback:', error);
              throw error;
            }
          }}
        />
      )}
    </div>
  );
};
