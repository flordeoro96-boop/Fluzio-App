/**
 * Level Progress Indicator
 * 
 * Shows user's progress toward next level with requirements tracking
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Award, 
  Zap, 
  Users, 
  Target, 
  Star,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Lock,
  Loader
} from 'lucide-react';

interface LevelProgressProps {
  userId: string;
  onRequestUpgrade?: () => void;
  compact?: boolean; // Compact view for dashboard
}

interface EligibilityData {
  eligible: boolean;
  currentLevel: number;
  nextLevel: number | null;
  requiresAdminApproval: boolean;
  canRequestUpgrade: boolean;
  progress: {
    percentage: number;
    current: {
      missionsCreated: number;
      meetupsAttended: number;
      squadsJoined: number;
      creditsUsed: number;
      averageRating: number;
      violations: number;
      daysSinceJoining: number;
      daysSincePreviousLevel: number;
      businessVerified: boolean;
    };
    required: {
      minMissionsCreated: number;
      minMeetupsAttended: number;
      minSquadsJoined: number;
      minGrowthCreditsUsed: number;
      minAverageRating: number;
      maxViolations: number;
      requiresVerification: boolean;
      requiresAdminApproval: boolean;
      minDaysSinceJoining: number;
      minDaysSincePreviousLevel: number;
    };
    missing: any | null;
  };
}

const LEVEL_INFO = {
  1: { name: 'Explorer', emoji: '🌱', color: 'from-green-400 to-emerald-500' },
  2: { name: 'Builder', emoji: '🔧', color: 'from-blue-400 to-cyan-500' },
  3: { name: 'Operator', emoji: '⚙️', color: 'from-purple-400 to-pink-500' },
  4: { name: 'Growth Leader', emoji: '🚀', color: 'from-orange-400 to-red-500' },
  5: { name: 'Expert', emoji: '🧠', color: 'from-indigo-400 to-purple-600' },
  6: { name: 'Elite', emoji: '👑', color: 'from-yellow-400 to-amber-500' }
};

export const LevelProgressIndicator: React.FC<LevelProgressProps> = ({ 
  userId, 
  onRequestUpgrade,
  compact = false 
}) => {
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState<EligibilityData | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkEligibility();
  }, [userId]);

  const checkEligibility = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('https://us-central1-fluzio-13af2.cloudfunctions.net/checkLevelUpEligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();
      
      if (data.success) {
        setEligibility(data as EligibilityData);
      } else {
        setError(data.error || 'Failed to check eligibility');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
      console.error('[LevelProgress] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestUpgrade = async () => {
    if (!eligibility?.canRequestUpgrade) return;
    
    try {
      setRequesting(true);
      
      const response = await fetch('https://us-central1-fluzio-13af2.cloudfunctions.net/requestLevelUp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId,
          message: `Request to advance from Level ${eligibility.currentLevel} to Level ${eligibility.nextLevel}`
        })
      });

      const data = await response.json();
      
      if (data.success) {
        if (data.approved) {
          alert(`🎉 ${data.message}`);
          window.location.reload(); // Refresh to show new level
        } else {
          alert(`✅ ${data.message}\nEstimated review time: ${data.estimatedReviewTime}`);
          if (onRequestUpgrade) onRequestUpgrade();
        }
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">
        <p className="font-semibold">Error loading progress</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!eligibility || eligibility.nextLevel === null) {
    return (
      <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <Award className="w-12 h-12" />
          <div>
            <h3 className="text-2xl font-bold">Maximum Level Reached!</h3>
            <p className="opacity-90">You're at Elite Level 👑</p>
          </div>
        </div>
      </div>
    );
  }

  const { currentLevel, nextLevel, progress } = eligibility;
  const currentInfo = LEVEL_INFO[currentLevel as keyof typeof LEVEL_INFO];
  const nextInfo = LEVEL_INFO[nextLevel as keyof typeof LEVEL_INFO];

  // Compact view for dashboard sidebar
  if (compact) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{currentInfo.emoji}</span>
            <div>
              <p className="text-xs text-gray-500">Level {currentLevel}</p>
              <p className="font-semibold text-sm text-[#1E0E62]">{currentInfo.name}</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <div className="flex items-center gap-2">
            <span className="text-2xl opacity-50">{nextInfo.emoji}</span>
            <div>
              <p className="text-xs text-gray-500">Level {nextLevel}</p>
              <p className="font-semibold text-sm text-gray-600">{nextInfo.name}</p>
            </div>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-600">Progress</span>
            <span className="font-semibold text-[#1E0E62]">{progress.percentage}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${currentInfo.color} transition-all duration-500`}
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        {eligibility.canRequestUpgrade && (
          <button
            onClick={handleRequestUpgrade}
            disabled={requesting}
            className="w-full py-2 bg-purple-500 text-white text-sm font-semibold rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
          >
            {requesting ? 'Processing...' : 'Request Upgrade'}
          </button>
        )}
      </div>
    );
  }

  // Full detailed view
  const { current, required, missing } = progress;

  const requirements = [
    {
      icon: Target,
      label: 'Missions Created',
      current: String(current.missionsCreated),
      required: String(required.minMissionsCreated),
      met: current.missionsCreated >= required.minMissionsCreated
    },
    {
      icon: Users,
      label: 'Meetups Attended',
      current: String(current.meetupsAttended),
      required: String(required.minMeetupsAttended),
      met: current.meetupsAttended >= required.minMeetupsAttended
    },
    {
      icon: Users,
      label: 'Squads Joined',
      current: String(current.squadsJoined),
      required: String(required.minSquadsJoined),
      met: current.squadsJoined >= required.minSquadsJoined
    },
    {
      icon: Zap,
      label: 'Growth Credits Used',
      current: String(current.creditsUsed),
      required: String(required.minGrowthCreditsUsed),
      met: current.creditsUsed >= required.minGrowthCreditsUsed
    },
    {
      icon: Star,
      label: 'Average Rating',
      current: current.averageRating.toFixed(1),
      required: required.minAverageRating.toFixed(1),
      met: current.averageRating >= required.minAverageRating,
      suffix: '★'
    }
  ];

  // Add time requirement if applicable
  if (required.minDaysSinceJoining > 0 || required.minDaysSincePreviousLevel > 0) {
    const daysRequired = Math.max(required.minDaysSinceJoining, required.minDaysSincePreviousLevel);
    const daysCurrent = required.minDaysSincePreviousLevel > 0 
      ? current.daysSincePreviousLevel 
      : current.daysSinceJoining;
    
    requirements.push({
      icon: Clock,
      label: required.minDaysSincePreviousLevel > 0 ? 'Days at Current Level' : 'Days on Platform',
      current: String(daysCurrent),
      required: String(daysRequired),
      met: daysCurrent >= daysRequired,
      suffix: 'd'
    });
  }

  // Add verification requirement if applicable
  if (required.requiresVerification) {
    requirements.push({
      icon: Award,
      label: 'Business Verified',
      current: current.businessVerified ? 'Yes' : 'No',
      required: 'Yes',
      met: current.businessVerified,
      suffix: ''
    });
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${currentInfo.color} flex items-center justify-center text-4xl shadow-lg`}>
              {currentInfo.emoji}
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Level</p>
              <h2 className="text-3xl font-bold text-[#1E0E62]">
                Level {currentLevel}: {currentInfo.name}
              </h2>
            </div>
          </div>

          <ArrowRight className="w-8 h-8 text-gray-300" />

          <div className="flex items-center gap-4 opacity-60">
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${nextInfo.color} flex items-center justify-center text-4xl shadow-lg`}>
              {nextInfo.emoji}
            </div>
            <div>
              <p className="text-sm text-gray-500">Next Level</p>
              <h2 className="text-3xl font-bold text-gray-600">
                Level {nextLevel}: {nextInfo.name}
              </h2>
            </div>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-600">Overall Progress</span>
            <span className="text-2xl font-bold text-[#1E0E62]">{progress.percentage}%</span>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${currentInfo.color} transition-all duration-500`}
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Requirements Grid */}
      <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
        <h3 className="text-xl font-bold text-[#1E0E62] mb-4">Requirements for Level {nextLevel}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requirements.map((req, index) => {
            const Icon = req.icon;
            return (
              <div 
                key={index}
                className={`p-4 rounded-xl border-2 ${
                  req.met 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${req.met ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className="font-semibold text-sm text-gray-700">{req.label}</span>
                  </div>
                  {req.met ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-bold ${req.met ? 'text-green-600' : 'text-gray-900'}`}>
                    {req.current}{req.suffix || ''}
                  </span>
                  <span className="text-gray-500">/</span>
                  <span className="text-lg text-gray-600">
                    {req.required}{req.suffix || ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Missing Requirements Alert */}
      {missing && Object.keys(missing).length > 0 && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <Lock className="w-6 h-6 text-orange-600 mt-1" />
            <div className="flex-1">
              <h4 className="font-bold text-orange-900 mb-2">Still need to complete:</h4>
              <ul className="space-y-1 text-sm text-orange-800">
                {missing.missions && <li>• Create {missing.missions} more mission{missing.missions > 1 ? 's' : ''}</li>}
                {missing.meetups && <li>• Attend {missing.meetups} more meetup{missing.meetups > 1 ? 's' : ''}</li>}
                {missing.squads && <li>• Join {missing.squads} more squad{missing.squads > 1 ? 's' : ''}</li>}
                {missing.creditsUsed && <li>• Use {missing.creditsUsed} more Growth Credits</li>}
                {missing.rating && <li>• Improve rating by {missing.rating.toFixed(1)} stars</li>}
                {missing.daysRemaining && <li>• Wait {missing.daysRemaining} more day{missing.daysRemaining > 1 ? 's' : ''}</li>}
                {missing.verification && <li>• Complete business verification</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      {eligibility.canRequestUpgrade && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">🎉 You're ready to level up!</h3>
              <p className="opacity-90">
                {eligibility.requiresAdminApproval 
                  ? 'Submit your request for admin review (2-5 business days)'
                  : 'Click below to upgrade immediately'}
              </p>
            </div>
            <button
              onClick={handleRequestUpgrade}
              disabled={requesting}
              className="px-8 py-4 bg-white text-purple-600 font-bold rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 shadow-lg"
            >
              {requesting ? 'Processing...' : 'Request Upgrade'}
            </button>
          </div>
        </div>
      )}

      {eligibility.eligible && !eligibility.canRequestUpgrade && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <p className="text-blue-900 font-semibold">
            ✅ Your upgrade request is pending admin review. We'll notify you when it's approved!
          </p>
        </div>
      )}
    </div>
  );
};

export default LevelProgressIndicator;
