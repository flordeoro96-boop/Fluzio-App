import React, { useEffect, useState } from 'react';
import { TrendingUp, Lock, CheckCircle, XCircle, Loader } from 'lucide-react';
import { 
  getBusinessLevelData, 
  getLevelName, 
  getLevelDisplay,
  getXpForNextSubLevel,
  SUB_LEVEL_THRESHOLDS,
  BUSINESS_LEVELS
} from '../../src/lib/levels/businessLevel';

interface BusinessLevelCardProps {
  businessId: string;
  userProfile?: any;
}

export const BusinessLevelCard: React.FC<BusinessLevelCardProps> = ({ businessId, userProfile }) => {
  const [levelData, setLevelData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadLevelData();
  }, [businessId]);

  const loadLevelData = async () => {
    setLoading(true);
    try {
      const data = await getBusinessLevelData(businessId);
      setLevelData(data);
    } catch (err) {
      console.error('Error loading level data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestUpgrade = async () => {
    setRequesting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('https://us-central1-fluzio-13af2.cloudfunctions.net/requestBusinessLevelUpgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId })
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('✅ Upgrade request submitted! Our team will review it shortly.');
        await loadLevelData(); // Reload to show updated status
      } else {
        setError(result.error || 'Failed to submit request');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error requesting upgrade:', err);
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-center py-8">
          <Loader className="w-6 h-6 animate-spin text-purple-500" />
        </div>
      </div>
    );
  }

  if (!levelData) {
    return null;
  }

  const currentLevel = levelData.businessLevel;
  const currentSubLevel = levelData.businessSubLevel;
  const currentXp = levelData.businessXp;
  const levelName = getLevelName(currentLevel);
  const canUpgrade = currentSubLevel === 9 && currentLevel < 6;
  const upgradeRequested = levelData.upgradeRequested;
  const isMaxLevel = currentLevel >= 6;

  // Progress within current sub-level
  const currentThreshold = SUB_LEVEL_THRESHOLDS[currentSubLevel - 1];
  const nextThreshold = currentSubLevel < 9 ? SUB_LEVEL_THRESHOLDS[currentSubLevel] : currentThreshold;
  const xpInCurrentLevel = currentXp - currentThreshold;
  const xpNeededForNext = nextThreshold - currentThreshold;
  const progressPercent = currentSubLevel === 9 ? 100 : (xpInCurrentLevel / xpNeededForNext) * 100;

  // Level colors
  const levelColors: Record<number, string> = {
    1: 'from-gray-400 to-gray-600',
    2: 'from-green-400 to-green-600',
    3: 'from-blue-400 to-blue-600',
    4: 'from-purple-400 to-purple-600',
    5: 'from-orange-400 to-orange-600',
    6: 'from-yellow-400 via-pink-500 to-purple-600'
  };

  const levelEmojis: Record<number, string> = {
    1: '🔰',
    2: '🛠️',
    3: '⚙️',
    4: '🚀',
    5: '🎯',
    6: '👑'
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${levelColors[currentLevel]} flex items-center justify-center text-2xl`}>
            {levelEmojis[currentLevel]}
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#1E0E62]">Business Level</h3>
            <p className="text-sm text-[#8F8FA3]">Level {getLevelDisplay(currentLevel, currentSubLevel)} • {levelName}</p>
          </div>
        </div>
        <TrendingUp className="w-6 h-6 text-purple-500" />
      </div>

      {/* Description */}
      <p className="text-sm text-[#8F8FA3] mb-4">
        {BUSINESS_LEVELS[currentLevel as keyof typeof BUSINESS_LEVELS]?.description}
      </p>

      {/* XP Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-[#1E0E62]">
            {currentXp} XP
          </span>
          <span className="text-sm text-[#8F8FA3]">
            {currentSubLevel === 9 ? (
              canUpgrade ? 'Ready for upgrade!' : 'Max sub-level'
            ) : (
              `${getXpForNextSubLevel(currentXp)} XP to level ${currentLevel}.${currentSubLevel + 1}`
            )}
          </span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${levelColors[currentLevel]} transition-all duration-500`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Upgrade Status */}
      {upgradeRequested && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
          <Loader className="w-5 h-5 text-yellow-600 mt-0.5 animate-pulse" />
          <div>
            <p className="font-semibold text-yellow-900 text-sm">Upgrade Request Pending</p>
            <p className="text-yellow-700 text-xs mt-1">
              Your request to upgrade to Level {currentLevel + 1} is being reviewed by our team.
            </p>
          </div>
        </div>
      )}

      {/* Rejection Feedback */}
      {levelData?.lastUpgradeRejectionReason && !upgradeRequested && (
        <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-xl">
          <div className="flex items-start gap-3 mb-2">
            <XCircle className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <p className="font-semibold text-orange-900 text-sm">Previous Upgrade Request Declined</p>
              <p className="text-orange-700 text-xs mt-1">
                {new Date(levelData.lastUpgradeRejectedAt?.toDate?.() || levelData.lastUpgradeRejectedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="pl-8">
            <p className="text-sm text-orange-800 bg-orange-100 rounded-lg p-3">
              <strong>Reason:</strong> {levelData.lastUpgradeRejectionReason}
            </p>
            <p className="text-xs text-orange-600 mt-2">
              You can submit a new request once you've addressed the feedback above.
            </p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Upgrade Button */}
      {canUpgrade && !upgradeRequested ? (
        <button
          onClick={handleRequestUpgrade}
          disabled={requesting}
          className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {requesting ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <TrendingUp className="w-5 h-5" />
              Request Upgrade to Level {currentLevel + 1}
            </>
          )}
        </button>
      ) : isMaxLevel ? (
        <div className="p-4 bg-gradient-to-r from-yellow-50 to-pink-50 border-2 border-pink-200 rounded-xl text-center">
          <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
            👑 Maximum Level Achieved!
          </p>
          <p className="text-sm text-[#8F8FA3] mt-1">You've reached Elite status</p>
        </div>
      ) : (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-start gap-3">
          <Lock className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="font-semibold text-gray-700 text-sm">Upgrade Locked</p>
            <p className="text-gray-600 text-xs mt-1">
              Reach sub-level {currentLevel}.9 to unlock upgrade request
            </p>
          </div>
        </div>
      )}

      {/* How to Earn XP */}
      <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-xl">
        <h4 className="font-bold text-[#1E0E62] text-sm mb-3">💡 How to Earn XP</h4>
        <ul className="space-y-2 text-xs text-[#8F8FA3]">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            <span>Create your first mission: <strong>+50 XP</strong></span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            <span>Create additional missions: <strong>+30 XP</strong></span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            <span>Customer completes mission: <strong>+30 XP</strong></span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            <span>Google Review mission: <strong>+20 XP</strong></span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            <span>Host a meetup: <strong>+40 XP</strong></span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            <span>Meetup with 3+ attendees: <strong>+70 XP</strong> bonus</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            <span>Event with 5+ attendees: <strong>+100 XP</strong> bonus</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
