import React from 'react';
import { X, TrendingUp, Zap, Crown, CheckCircle, ArrowRight } from 'lucide-react';
import { TIER_PRICING, getMissionLimits, getMeetupLimits, getMonthlyGrowthCredits } from '../../src/lib/levels/subscriptionTiers';
import type { SubscriptionTier, BusinessLevel } from '../../src/lib/levels/subscriptionTypes';

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: BusinessLevel;
  currentTier: SubscriptionTier;
  reason: 'MISSION_LIMIT' | 'MEETUP_LIMIT' | 'CREDITS_LOW' | 'PARTICIPANT_LIMIT' | 'GEOGRAPHIC_LIMIT' | 'LEVEL_LOCKED';
  onUpgrade: (tier: SubscriptionTier) => void;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  isOpen,
  onClose,
  currentLevel,
  currentTier,
  reason,
  onUpgrade
}) => {
  if (!isOpen) return null;

  const getReasonContent = () => {
    switch (reason) {
      case 'MISSION_LIMIT':
        return {
          icon: <TrendingUp className="w-12 h-12" />,
          title: 'Mission Limit Reached',
          description: 'You\'ve hit your monthly mission creation limit. Upgrade to create more missions and reach more customers!',
          color: 'from-blue-500 to-cyan-500'
        };
      case 'MEETUP_LIMIT':
        return {
          icon: <Zap className="w-12 h-12" />,
          title: 'Meetup Limit Reached',
          description: 'You\'ve maxed out your monthly meetup hosting. Upgrade to host unlimited meetups and grow your network!',
          color: 'from-green-500 to-emerald-500'
        };
      case 'CREDITS_LOW':
        return {
          icon: <Zap className="w-12 h-12" />,
          title: 'Running Low on Credits',
          description: 'Your Growth Credits are running low. Upgrade for more monthly credits or purchase additional packs!',
          color: 'from-purple-500 to-pink-500'
        };
      case 'PARTICIPANT_LIMIT':
        return {
          icon: <TrendingUp className="w-12 h-12" />,
          title: 'Participant Limit Reached',
          description: 'Your current tier limits mission participants. Upgrade to allow more people to join your missions!',
          color: 'from-orange-500 to-red-500'
        };
      case 'GEOGRAPHIC_LIMIT':
        return {
          icon: <Crown className="w-12 h-12" />,
          title: 'Expand Your Reach',
          description: 'Want to reach customers beyond your city? Upgrade for country-wide or global visibility!',
          color: 'from-yellow-500 to-orange-600'
        };
      case 'LEVEL_LOCKED':
        return {
          icon: <Crown className="w-12 h-12" />,
          title: 'Level Up Required',
          description: 'This feature requires a higher business level. Complete your progression requirements to unlock!',
          color: 'from-purple-600 to-pink-600'
        };
      default:
        return {
          icon: <TrendingUp className="w-12 h-12" />,
          title: 'Upgrade Your Plan',
          description: 'Unlock more features and grow your business faster with a higher tier!',
          color: 'from-blue-500 to-purple-500'
        };
    }
  };

  const getUpgradeTiers = (): SubscriptionTier[] => {
    const tiers: SubscriptionTier[] = ['BASIC', 'SILVER', 'GOLD', 'PLATINUM'];
    const currentIndex = tiers.indexOf(currentTier);
    return tiers.slice(currentIndex + 1); // Only show higher tiers
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const content = getReasonContent();
  const upgradeTiers = getUpgradeTiers();

  if (upgradeTiers.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>

          <div className={`w-16 h-16 bg-gradient-to-br ${content.color} rounded-2xl flex items-center justify-center text-white mx-auto mb-4`}>
            {content.icon}
          </div>

          <h2 className="text-2xl font-bold text-[#1E0E62] text-center mb-2">
            You're on the Highest Tier! 🎉
          </h2>
          <p className="text-[#8F8FA3] text-center mb-6">
            You're already on Platinum - the best plan available. Consider purchasing Growth Credit packs for additional capacity!
          </p>

          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all"
          >
            Got It
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className={`bg-gradient-to-br ${content.color} text-white p-8 rounded-t-2xl`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              {content.icon}
            </div>
            <div>
              <h2 className="text-3xl font-bold">{content.title}</h2>
              <p className="opacity-90">{content.description}</p>
            </div>
          </div>
        </div>

        {/* Upgrade Options */}
        <div className="p-8">
          <h3 className="text-xl font-bold text-[#1E0E62] mb-6">Choose Your Upgrade</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {upgradeTiers.map((tier) => {
              const pricing = TIER_PRICING[currentLevel][tier];
              const credits = getMonthlyGrowthCredits(currentLevel, tier, false);
              const missionLimits = getMissionLimits(currentLevel, tier);
              const meetupLimits = getMeetupLimits(currentLevel, tier);
              const isRecommended = tier === 'GOLD';

              return (
                <div
                  key={tier}
                  className={`bg-white border-2 rounded-xl p-6 transition-all hover:shadow-lg cursor-pointer ${
                    isRecommended ? 'border-yellow-400 ring-2 ring-yellow-200' : 'border-gray-200'
                  }`}
                  onClick={() => onUpgrade(tier)}
                >
                  {isRecommended && (
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">
                      RECOMMENDED
                    </div>
                  )}

                  <h4 className="text-2xl font-bold text-[#1E0E62] mb-2">{tier}</h4>
                  <div className="text-3xl font-bold text-[#1E0E62] mb-1">
                    {formatCurrency(pricing.monthly)}
                  </div>
                  <p className="text-sm text-[#8F8FA3] mb-4">per month</p>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="font-semibold">{credits.toLocaleString()} credits/month</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>
                        {missionLimits.maxMissionsPerMonth === -1 ? 'Unlimited' : missionLimits.maxMissionsPerMonth} missions
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>
                        {missionLimits.maxParticipants === -1 ? 'Unlimited' : `${missionLimits.maxParticipants}`} participants
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-xs">{missionLimits.geographicReach.replace('_', ' ')}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onUpgrade(tier)}
                    className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                      isRecommended
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:shadow-xl'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'
                    }`}
                  >
                    Upgrade Now <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* What You'll Get */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
            <h4 className="font-bold text-[#1E0E62] mb-4">✨ What You'll Unlock</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reason === 'MISSION_LIMIT' && (
                <>
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>Create more missions every month</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>Reach more potential customers</span>
                  </div>
                </>
              )}
              {reason === 'MEETUP_LIMIT' && (
                <>
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>Host unlimited meetups</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>Priority meetup access</span>
                  </div>
                </>
              )}
              {reason === 'CREDITS_LOW' && (
                <>
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>More Growth Credits every month</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>Discounts on credit purchases</span>
                  </div>
                </>
              )}
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <span>Advanced analytics dashboard</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <span>Premium mission templates</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <span>Priority customer support</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <span>Exclusive networking events</span>
              </div>
            </div>
          </div>

          {/* No Thanks */}
          <div className="text-center mt-6">
            <button
              onClick={onClose}
              className="text-[#8F8FA3] hover:text-[#1E0E62] font-semibold text-sm"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
