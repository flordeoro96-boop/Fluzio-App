import React, { useState } from 'react';
import {
  Crown, Check, Users, Calendar, Eye, MapPin, Zap, Award,
  Trophy, Rocket, Star, Sparkles, ArrowRight, Shield
} from 'lucide-react';

export type Level1Tier = 'FREE' | 'SILVER' | 'GOLD';

interface Level1SubscriptionSelectorProps {
  currentTier: Level1Tier;
  onSelectTier: (tier: Level1Tier) => void;
  businessId: string;
}

interface TierPlan {
  tier: Level1Tier;
  name: string;
  price: string;
  priceMonthly: number;
  tagline: string;
  badge?: string;
  badgeColor: string;
  gradient: string;
  features: {
    icon: React.ElementType;
    text: string;
    highlight?: boolean;
  }[];
  purpose: string[];
}

export const Level1SubscriptionSelector: React.FC<Level1SubscriptionSelectorProps> = ({
  currentTier,
  onSelectTier,
  businessId
}) => {
  const [selectedTier, setSelectedTier] = useState<Level1Tier>(currentTier);
  const [isProcessing, setIsProcessing] = useState(false);

  const tiers: TierPlan[] = [
    {
      tier: 'FREE',
      name: 'Free',
      price: '€0',
      priceMonthly: 0,
      tagline: 'Start your journey',
      badgeColor: 'bg-gray-100 text-gray-700',
      gradient: 'from-gray-100 to-gray-200',
      features: [
        { icon: Users, text: '1 "My Squad" meetup / month' },
        { icon: Shield, text: 'Profile setup' },
        { icon: Eye, text: 'Preview of missions (read-only)' },
        { icon: MapPin, text: 'Access to public city feed' }
      ],
      purpose: [
        'Entry into Beevvy',
        'Community exposure',
        'Zero pressure',
        'Curiosity → trust'
      ]
    },
    {
      tier: 'SILVER',
      name: 'Silver',
      price: '€14',
      priceMonthly: 14,
      tagline: 'Learn & Network',
      badge: 'Most Popular',
      badgeColor: 'bg-blue-100 text-blue-700',
      gradient: 'from-blue-50 to-indigo-100',
      features: [
        { icon: Users, text: '1 "My Squad" meetup / month' },
        { icon: Calendar, text: 'Access to Events (business events)', highlight: true },
        { icon: Trophy, text: '1 Event free / quarter', highlight: true },
        { icon: Zap, text: 'Early access to city launches' },
        { icon: Eye, text: 'Level 2 preview access' }
      ],
      purpose: [
        'Learning',
        'Networking',
        'Early commitment',
        'Upgrade readiness'
      ]
    },
    {
      tier: 'GOLD',
      name: 'Gold',
      price: '€24',
      priceMonthly: 24,
      tagline: 'Fast-track Success',
      badge: 'Best Value',
      badgeColor: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white',
      gradient: 'from-yellow-50 to-orange-100',
      features: [
        { icon: Users, text: '2–3 "My Squad" meetups / month', highlight: true },
        { icon: Calendar, text: 'Unlimited Events access', highlight: true },
        { icon: Trophy, text: '1 Event free / month', highlight: true },
        { icon: Rocket, text: 'Priority access to city cohorts' },
        { icon: Sparkles, text: 'Beta features & new formats' },
        { icon: Award, text: '"Early Builder" badge', highlight: true }
      ],
      purpose: [
        'Serious founders',
        'Community leaders',
        'Fast-track to Level 2'
      ]
    }
  ];

  const handleSelectTier = async (tier: Level1Tier) => {
    if (tier === currentTier || isProcessing) return;

    setIsProcessing(true);
    try {
      await onSelectTier(tier);
      setSelectedTier(tier);
    } catch (error) {
      console.error('Failed to update subscription:', error);
      alert('Failed to update subscription. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-bold mb-4">
            <Star className="w-4 h-4" />
            Level 1 - Aspiring Business
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#1E0E62] mb-4">
            Choose Your Path
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start building your business foundation with Beevvy's Level 1 community access
          </p>
        </div>

        {/* Tier Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {tiers.map((plan) => {
            const isCurrentTier = plan.tier === currentTier;
            const isSelected = plan.tier === selectedTier;

            return (
              <div
                key={plan.tier}
                className={`relative bg-white rounded-3xl p-6 border-2 transition-all duration-300 ${
                  isSelected
                    ? 'border-[#F72585] shadow-2xl shadow-pink-200 scale-105'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className={`px-4 py-1 rounded-full text-xs font-bold ${plan.badgeColor} shadow-lg`}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Current Badge */}
                {isCurrentTier && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Current
                    </span>
                  </div>
                )}

                {/* Header */}
                <div className={`bg-gradient-to-br ${plan.gradient} rounded-2xl p-6 mb-6 text-center`}>
                  <h3 className="text-2xl font-bold text-[#1E0E62] mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold text-[#1E0E62] mb-2">{plan.price}</div>
                  <p className="text-sm text-gray-600">{plan.tagline}</p>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 ${
                        feature.highlight ? 'bg-purple-50 -mx-2 px-2 py-2 rounded-lg' : ''
                      }`}
                    >
                      <feature.icon
                        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                          feature.highlight ? 'text-[#F72585]' : 'text-gray-400'
                        }`}
                      />
                      <span className={`text-sm ${feature.highlight ? 'font-semibold text-[#1E0E62]' : 'text-gray-600'}`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Purpose */}
                <div className="border-t border-gray-200 pt-4 mb-6">
                  <p className="text-xs font-bold text-gray-500 mb-2 uppercase">Perfect for:</p>
                  <div className="flex flex-wrap gap-2">
                    {plan.purpose.map((item, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleSelectTier(plan.tier)}
                  disabled={isCurrentTier || isProcessing}
                  className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    isCurrentTier
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : isSelected
                      ? 'bg-gradient-to-r from-[#F72585] to-[#7209B7] text-white hover:shadow-xl'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {isCurrentTier ? (
                    'Current Plan'
                  ) : isProcessing ? (
                    'Processing...'
                  ) : (
                    <>
                      {plan.tier === 'FREE' ? 'Downgrade' : 'Upgrade'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Rocket className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-blue-900">Ready to Launch?</span>
          </div>
          <p className="text-gray-700 mb-4">
            Once your business is established, you'll unlock Level 2 with full mission creation,
            rewards management, and advanced marketing tools.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-blue-700">
            <Star className="w-4 h-4" />
            <span>Level 2 unlocks at first verified business location</span>
          </div>
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h4 className="font-bold text-[#1E0E62] mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#F72585]" />
              What are "My Squad" meetups?
            </h4>
            <p className="text-sm text-gray-600">
              Monthly networking events where you meet fellow Level 1 entrepreneurs in your city.
              Perfect for learning, sharing experiences, and building your business network.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h4 className="font-bold text-[#1E0E62] mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#F72585]" />
              What are Business Events?
            </h4>
            <p className="text-sm text-gray-600">
              Workshops, masterclasses, and training sessions designed for aspiring entrepreneurs.
              Learn from successful business owners and gain the skills you need to launch.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
