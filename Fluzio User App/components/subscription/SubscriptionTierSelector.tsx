import React, { useState, useEffect } from 'react';
import { Check, Zap, Crown, TrendingUp, Sparkles } from 'lucide-react';
import { TIER_PRICING, GROWTH_CREDITS, getMonthlyGrowthCredits, getMissionLimits, getMeetupLimits, getLevelPerks, ANNUAL_BONUSES } from '../../src/lib/levels/subscriptionTiers';
import type { SubscriptionTier, BusinessLevel } from '../../src/lib/levels/subscriptionTypes';

interface SubscriptionTierSelectorProps {
  currentLevel: BusinessLevel;
  currentTier: SubscriptionTier;
  onSelectTier: (tier: SubscriptionTier, billingCycle: 'MONTHLY' | 'ANNUAL') => void;
}

export const SubscriptionTierSelector: React.FC<SubscriptionTierSelectorProps> = ({
  currentLevel,
  currentTier,
  onSelectTier
}) => {
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(currentTier);

  const tiers: SubscriptionTier[] = currentLevel === 1 ? ['BASIC'] : ['BASIC', 'SILVER', 'GOLD', 'PLATINUM'];

  const getTierColor = (tier: SubscriptionTier) => {
    const colors = {
      BASIC: 'from-gray-400 to-gray-600',
      SILVER: 'from-gray-300 to-gray-500',
      GOLD: 'from-yellow-400 to-orange-500',
      PLATINUM: 'from-purple-500 to-pink-600'
    };
    return colors[tier];
  };

  const getTierIcon = (tier: SubscriptionTier) => {
    const icons = {
      BASIC: <TrendingUp className="w-6 h-6" />,
      SILVER: <Zap className="w-6 h-6" />,
      GOLD: <Sparkles className="w-6 h-6" />,
      PLATINUM: <Crown className="w-6 h-6" />
    };
    return icons[tier];
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleSelectTier = (tier: SubscriptionTier) => {
    setSelectedTier(tier);
    onSelectTier(tier, billingCycle);
  };

  if (currentLevel === 1) {
    return (
      <div className="max-w-3xl mx-auto p-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 shadow-xl">
        <div className="text-center">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-10 h-10 text-purple-600" />
          </div>
          <h2 className="text-3xl font-bold text-[#1E0E62] mb-2">Level 1 - Explorer 🌱</h2>
          <div className="inline-block bg-green-100 text-green-800 font-bold px-6 py-2 rounded-full text-lg mb-4">
            ✨ ALWAYS FREE ✨
          </div>
          <p className="text-[#8F8FA3] text-lg mb-8">
            You're in the <strong>idea stage</strong> — exploring, learning, and planning your business!
          </p>
          
          {/* What Level 1 is for */}
          <div className="bg-white rounded-xl p-6 mb-6 text-left">
            <h3 className="font-bold text-xl text-center mb-4 text-[#1E0E62]">Your Focus at Level 1:</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <span className="font-semibold text-[#1E0E62]">Learn & Network</span>
                  <p className="text-sm text-[#8F8FA3]">Join up to 2 meetups per month and 1 beginner squad</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <span className="font-semibold text-[#1E0E62]">Get Mentorship</span>
                  <p className="text-sm text-[#8F8FA3]">Request guidance from experienced entrepreneurs (Level 4-6)</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <span className="font-semibold text-[#1E0E62]">Build Your Idea</span>
                  <p className="text-sm text-[#8F8FA3]">Create your business profile and refine your concept</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-600 font-bold text-sm">4</span>
                </div>
                <div>
                  <span className="font-semibold text-[#1E0E62]">Access Beginner Academy</span>
                  <p className="text-sm text-[#8F8FA3]">Free educational content for aspiring entrepreneurs</p>
                </div>
              </li>
            </ul>
          </div>

          {/* What they CANNOT do */}
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6 text-left">
            <h3 className="font-bold text-lg text-center mb-4 text-red-800">Not available at Level 1:</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-red-700">
                <span className="text-xl">✗</span>
                <span className="text-sm">Cannot create missions (need Level 2+)</span>
              </li>
              <li className="flex items-start gap-2 text-red-700">
                <span className="text-xl">✗</span>
                <span className="text-sm">Cannot host meetups (need Level 2+)</span>
              </li>
              <li className="flex items-start gap-2 text-red-700">
                <span className="text-xl">✗</span>
                <span className="text-sm">Cannot access paid subscription tiers (need Level 2+)</span>
              </li>
              <li className="flex items-start gap-2 text-red-700">
                <span className="text-xl">✗</span>
                <span className="text-sm">Cannot receive Growth Credits (need Level 2+ with paid tier)</span>
              </li>
            </ul>
          </div>

          {/* Upgrade Call to Action */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
            <h3 className="text-2xl font-bold mb-3">🚀 Ready to Start Your Business?</h3>
            <p className="text-purple-100 mb-4">
              Once you've validated your idea and are ready to launch, upgrade to <strong>Level 2 (Builder)</strong> to unlock:
            </p>
            <ul className="space-y-2 mb-6 text-left">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>Create missions to find customers & partners</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>Host meetups and networking events</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>Access paid tiers (Silver/Gold/Platinum) with Growth Credits</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>Full business analytics & premium features</span>
              </li>
            </ul>
            <div className="bg-white/20 rounded-lg p-4 text-center">
              <p className="text-sm font-semibold mb-2">How to reach Level 2:</p>
              <p className="text-xs text-purple-100">
                Complete your business profile • Attend 5 meetups • Join a squad • Complete the startup validation checklist
              </p>
              <button 
                onClick={() => window.location.href = '/level-progression'}
                className="mt-4 bg-white text-purple-600 font-bold px-8 py-3 rounded-xl hover:bg-purple-50 transition-all transform hover:scale-105"
              >
                View Level-Up Requirements
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Billing Cycle Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 rounded-full p-1 inline-flex">
          <button
            onClick={() => setBillingCycle('MONTHLY')}
            className={`px-6 py-2 rounded-full font-semibold transition-all ${
              billingCycle === 'MONTHLY'
                ? 'bg-white text-[#1E0E62] shadow-md'
                : 'text-[#8F8FA3]'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('ANNUAL')}
            className={`px-6 py-2 rounded-full font-semibold transition-all ${
              billingCycle === 'ANNUAL'
                ? 'bg-white text-[#1E0E62] shadow-md'
                : 'text-[#8F8FA3]'
            }`}
          >
            Annual
            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              Save up to 25%
            </span>
          </button>
        </div>
      </div>

      {/* Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map((tier) => {
          const pricing = TIER_PRICING[currentLevel][tier];
          const price = billingCycle === 'MONTHLY' ? pricing.monthly : pricing.annual;
          const credits = getMonthlyGrowthCredits(currentLevel, tier, billingCycle === 'ANNUAL');
          const missionLimits = getMissionLimits(currentLevel, tier);
          const meetupLimits = getMeetupLimits(currentLevel, tier);
          const perks = getLevelPerks(currentLevel, tier);
          const isCurrentTier = tier === currentTier;
          const isRecommended = tier === 'GOLD';

          return (
            <div
              key={tier}
              className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all ${
                selectedTier === tier ? 'ring-4 ring-purple-500 scale-105' : ''
              } ${isCurrentTier ? 'border-2 border-purple-500' : 'border border-gray-200'}`}
            >
              {/* Recommended Badge */}
              {isRecommended && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  POPULAR
                </div>
              )}

              {/* Current Tier Badge */}
              {isCurrentTier && (
                <div className="absolute top-0 left-0 bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-br-lg">
                  CURRENT
                </div>
              )}

              {/* Header */}
              <div className={`p-6 bg-gradient-to-br ${getTierColor(tier)}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-white">
                    {getTierIcon(tier)}
                  </div>
                  <h3 className="text-2xl font-bold text-white">{tier}</h3>
                </div>
                
                {tier === 'BASIC' ? (
                  <div className="text-white">
                    <div className="text-4xl font-bold">FREE</div>
                    <div className="text-sm opacity-90">Forever</div>
                  </div>
                ) : (
                  <div className="text-white">
                    <div className="text-4xl font-bold">{formatPrice(price)}</div>
                    <div className="text-sm opacity-90">
                      {billingCycle === 'MONTHLY' ? 'per month' : `per year (${pricing.annualMonths} months)`}
                    </div>
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="p-6">
                <div className="space-y-4 mb-6">
                  {/* Growth Credits */}
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">{credits.toLocaleString()}</span>
                      <span className="text-sm text-[#8F8FA3]"> Growth Credits/month</span>
                      {billingCycle === 'ANNUAL' && tier !== 'BASIC' && ANNUAL_BONUSES[tier].creditBonus > 0 && (
                        <div className="text-xs text-green-600 font-semibold">
                          +{ANNUAL_BONUSES[tier].creditBonus}% annual bonus!
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Missions */}
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      {missionLimits.maxMissionsPerMonth === -1 ? (
                        <span className="font-semibold">Unlimited missions</span>
                      ) : (
                        <>
                          <span className="font-semibold">{missionLimits.maxMissionsPerMonth}</span> missions/month
                        </>
                      )}
                      <div className="text-xs text-[#8F8FA3]">
                        {missionLimits.maxParticipants === -1 ? 'Unlimited' : `Up to ${missionLimits.maxParticipants}`} participants
                      </div>
                    </div>
                  </div>

                  {/* Meetups */}
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      {meetupLimits.maxHostPerMonth === 0 ? (
                        <span>Join meetups only</span>
                      ) : meetupLimits.maxHostPerMonth === -1 ? (
                        <span className="font-semibold">Host unlimited meetups</span>
                      ) : (
                        <>Host <span className="font-semibold">{meetupLimits.maxHostPerMonth}</span> meetups/month</>
                      )}
                    </div>
                  </div>

                  {/* Geographic Reach */}
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <span className="font-semibold">{missionLimits.geographicReach.replace('_', ' ')}</span> reach
                    </div>
                  </div>

                  {/* Analytics */}
                  {perks.analytics !== 'NONE' && (
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm font-semibold">{perks.analytics} Analytics</span>
                    </div>
                  )}

                  {/* Premium Features */}
                  {missionLimits.premiumTemplates && (
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Premium mission templates</span>
                    </div>
                  )}

                  {missionLimits.automatedCampaigns && (
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm font-semibold">Automated campaigns</span>
                    </div>
                  )}

                  {perks.verifiedBadge && (
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm font-semibold">✓ Verified Badge</span>
                    </div>
                  )}

                  {/* Discounts */}
                  {perks.discountOnEvents > 0 && (
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{perks.discountOnEvents}% off events & packs</span>
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectTier(tier)}
                  disabled={isCurrentTier}
                  className={`w-full py-3 rounded-xl font-bold transition-all ${
                    isCurrentTier
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : tier === 'BASIC'
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : `bg-gradient-to-r ${getTierColor(tier)} text-white hover:shadow-lg transform hover:scale-105`
                  }`}
                >
                  {isCurrentTier ? 'Current Plan' : tier === 'BASIC' ? 'Downgrade' : `Upgrade to ${tier}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Annual Bonuses Info */}
      {billingCycle === 'ANNUAL' && (
        <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border-2 border-green-200">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-green-600" />
            Annual Plan Bonuses
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="font-semibold text-green-700">Silver</div>
              <div className="text-sm text-[#8F8FA3]">+10% Growth Credits</div>
            </div>
            <div>
              <div className="font-semibold text-yellow-700">Gold</div>
              <div className="text-sm text-[#8F8FA3]">+20% Credits + 1 City Promo</div>
            </div>
            <div>
              <div className="font-semibold text-purple-700">Platinum</div>
              <div className="text-sm text-[#8F8FA3]">+30% Credits + Retreat (L5+)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
