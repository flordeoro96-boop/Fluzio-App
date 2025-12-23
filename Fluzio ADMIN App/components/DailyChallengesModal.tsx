/**
 * DailyChallengesModal Component
 * 
 * Shows daily and weekly challenges with progress tracking
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Target, Users, Gift, MapPin, TrendingUp, CheckCircle, Clock, Zap, Trophy, Flame } from 'lucide-react';
import { 
  Challenge, 
  getUserGamification, 
  claimChallengeReward,
  generateDailyChallenges,
  generateWeeklyChallenges
} from '../services/gamificationService';
import { useAuth } from '../services/AuthContext';

interface DailyChallengesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyChallengesModal: React.FC<DailyChallengesModalProps> = ({ isOpen, onClose }) => {
  const { userProfile } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'DAILY' | 'WEEKLY'>('DAILY');
  const [dailyChallenges, setDailyChallenges] = useState<Challenge[]>([]);
  const [weeklyChallenges, setWeeklyChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userProfile) {
      loadChallenges();
    }
  }, [isOpen, userProfile]);

  const loadChallenges = async () => {
    if (!userProfile) return;
    
    setLoading(true);
    try {
      const gamificationData = await getUserGamification(userProfile.id);
      
      if (gamificationData) {
        setDailyChallenges(gamificationData.dailyChallenges || []);
        setWeeklyChallenges(gamificationData.weeklyChallenges || []);
      } else {
        // Generate initial challenges
        const daily = await generateDailyChallenges(userProfile.id);
        const weekly = await generateWeeklyChallenges(userProfile.id);
        setDailyChallenges(daily);
        setWeeklyChallenges(weekly);
      }
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async (challengeId: string) => {
    if (!userProfile || claiming) return;
    
    setClaiming(challengeId);
    try {
      const points = await claimChallengeReward(userProfile.id, challengeId);
      
      if (points > 0) {
        // Show success feedback
        alert(`🎉 Claimed ${points} points!`);
        await loadChallenges();
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      alert('Failed to claim reward. Please try again.');
    } finally {
      setClaiming(null);
    }
  };

  const getChallengeIcon = (category: Challenge['category']) => {
    switch (category) {
      case 'MISSIONS': return <Target className="w-5 h-5" />;
      case 'MEETUPS': return <Users className="w-5 h-5" />;
      case 'REWARDS': return <Gift className="w-5 h-5" />;
      case 'EXPLORATION': return <MapPin className="w-5 h-5" />;
      case 'SOCIAL': return <TrendingUp className="w-5 h-5" />;
      default: return <Zap className="w-5 h-5" />;
    }
  };

  const getChallengeColor = (category: Challenge['category']) => {
    switch (category) {
      case 'MISSIONS': return 'from-pink-500 to-purple-500';
      case 'MEETUPS': return 'from-blue-500 to-cyan-500';
      case 'REWARDS': return 'from-purple-500 to-indigo-500';
      case 'EXPLORATION': return 'from-green-500 to-emerald-500';
      case 'SOCIAL': return 'from-orange-500 to-red-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const displayedChallenges = activeTab === 'DAILY' ? dailyChallenges : weeklyChallenges;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{t('dailyChallenges.title')}</h2>
                <p className="text-sm text-white/80">{t('dailyChallenges.subtitle')}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('DAILY')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                activeTab === 'DAILY'
                  ? 'bg-white text-[#00E5FF]'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                {t('dailyChallenges.tabs.daily')}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('WEEKLY')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                activeTab === 'WEEKLY'
                  ? 'bg-white text-[#6C4BFF]'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Flame className="w-4 h-4" />
                {t('dailyChallenges.tabs.weekly')}
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E5FF]"></div>
            </div>
          ) : displayedChallenges.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">{t('dailyChallenges.empty.title')}</p>
              <p className="text-gray-400 text-sm mt-2">{t('dailyChallenges.empty.hint')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedChallenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  icon={getChallengeIcon(challenge.category)}
                  colorClass={getChallengeColor(challenge.category)}
                  onClaim={() => handleClaimReward(challenge.id)}
                  claiming={claiming === challenge.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ChallengeCardProps {
  challenge: Challenge;
  icon: React.ReactNode;
  colorClass: string;
  onClaim: () => void;
  claiming: boolean;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge, icon, colorClass, onClaim, claiming }) => {
  const progress = Math.min((challenge.progress / challenge.goal) * 100, 100);
  const isCompleted = challenge.completed;
  const isClaimed = !!challenge.claimedAt;
  
  const timeUntilExpiry = new Date(challenge.expiresAt).getTime() - Date.now();
  const hoursLeft = Math.floor(timeUntilExpiry / 3600000);
  const expired = timeUntilExpiry <= 0;

  return (
    <div className={`bg-white border-2 rounded-xl p-4 transition-all ${
      isCompleted ? 'border-green-500 shadow-lg shadow-green-100' : 'border-gray-200 hover:border-gray-300'
    }`}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center text-white flex-shrink-0`}>
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title & Status */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-[#1E0E62] text-lg">{challenge.title}</h3>
            {isCompleted && (
              <div className="flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 mb-3">{challenge.description}</p>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500">{useTranslation().t('dailyChallenges.progress')}</span>
              <span className="font-semibold text-gray-700">
                {challenge.progress}/{challenge.goal}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${colorClass}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Reward & Action */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-sm font-semibold text-[#00E5FF]">
                <Zap className="w-4 h-4" />
                +{challenge.reward.points} pts
              </div>
              {challenge.reward.bonus && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
                  {challenge.reward.bonus}
                </span>
              )}
            </div>

            {/* Claim Button or Timer */}
            <div>
              {isClaimed ? (
                <span className="text-xs text-green-600 font-semibold">{useTranslation().t('dailyChallenges.claimed')}</span>
              ) : isCompleted ? (
                <button
                  onClick={onClaim}
                  disabled={claiming}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {claiming ? useTranslation().t('dailyChallenges.claiming') : useTranslation().t('dailyChallenges.claimReward')}
                </button>
              ) : expired ? (
                <span className="text-xs text-red-500 font-semibold">{useTranslation().t('dailyChallenges.expired')}</span>
              ) : (
                <span className="text-xs text-gray-500">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {useTranslation().t('dailyChallenges.hoursLeft', { hours: hoursLeft })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
