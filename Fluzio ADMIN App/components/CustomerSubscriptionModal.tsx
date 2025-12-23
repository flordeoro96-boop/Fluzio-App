import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, SubscriptionLevel } from '../types';
import { 
  X, 
  Crown,
  Zap,
  Check,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Gift,
  Shield,
  Briefcase
} from 'lucide-react';

interface CustomerSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpgrade: (tier: SubscriptionLevel) => void;
}

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  tier: SubscriptionLevel;
  name: string;
  price: string;
  period: string;
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
  features: PlanFeature[];
  popular?: boolean;
}

export const CustomerSubscriptionModal: React.FC<CustomerSubscriptionModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpgrade
}) => {
  const currentTier = user.subscriptionLevel || SubscriptionLevel.FREE;
  const [selectedTier, setSelectedTier] = useState<SubscriptionLevel>(currentTier);

  const plans: Plan[] = [
    {
      tier: SubscriptionLevel.FREE,
      name: 'Free',
      price: '$0',
      period: 'forever',
      icon: <Sparkles className="w-6 h-6" />,
      color: 'text-gray-600',
      bgGradient: 'from-gray-50 to-gray-100',
      features: [
        { text: '5 missions per month', included: true },
        { text: 'Basic rewards', included: true },
        { text: 'Community access', included: true },
        { text: 'Standard support', included: true },
        { text: 'Priority missions', included: false },
        { text: 'Exclusive events', included: false },
        { text: 'Creator mode', included: false },
        { text: 'Analytics dashboard', included: false }
      ]
    },
    {
      tier: SubscriptionLevel.SILVER,
      name: 'Silver',
      price: '$9.99',
      period: '/month',
      icon: <Star className="w-6 h-6" />,
      color: 'text-gray-700',
      bgGradient: 'from-gray-100 to-gray-200',
      features: [
        { text: '20 missions per month', included: true },
        { text: 'Enhanced rewards', included: true },
        { text: 'Community access', included: true },
        { text: 'Priority support', included: true },
        { text: 'Priority missions', included: true },
        { text: 'Exclusive events', included: false },
        { text: 'Creator mode', included: false },
        { text: 'Analytics dashboard', included: false }
      ]
    },
    {
      tier: SubscriptionLevel.GOLD,
      name: 'Gold',
      price: '$24.99',
      period: '/month',
      icon: <Crown className="w-6 h-6" />,
      color: 'text-yellow-600',
      bgGradient: 'from-yellow-100 to-yellow-200',
      popular: true,
      features: [
        { text: 'Unlimited missions', included: true },
        { text: 'Premium rewards', included: true },
        { text: 'VIP community access', included: true },
        { text: '24/7 priority support', included: true },
        { text: 'First access to missions', included: true },
        { text: 'Exclusive VIP events', included: true },
        { text: 'Creator mode enabled', included: true },
        { text: 'Analytics dashboard', included: false }
      ]
    },
    {
      tier: SubscriptionLevel.PLATINUM,
      name: 'Platinum',
      price: '$49.99',
      period: '/month',
      icon: <Zap className="w-6 h-6" />,
      color: 'text-purple-600',
      bgGradient: 'from-purple-100 to-purple-200',
      features: [
        { text: 'Unlimited everything', included: true },
        { text: 'Maximum rewards (2x points)', included: true },
        { text: 'Elite community access', included: true },
        { text: 'Dedicated account manager', included: true },
        { text: 'Instant mission approval', included: true },
        { text: 'All exclusive events + perks', included: true },
        { text: 'Creator mode + portfolio', included: true },
        { text: 'Full analytics dashboard', included: true }
      ]
    }
  ];

  const handleUpgrade = () => {
    if (selectedTier !== currentTier) {
      onUpgrade(selectedTier);
      onClose();
    }
  };

  const getTierIndex = (tier: SubscriptionLevel): number => {
    return plans.findIndex(p => p.tier === tier);
  };

  const isUpgrade = getTierIndex(selectedTier) > getTierIndex(currentTier);
  const isDowngrade = getTierIndex(selectedTier) < getTierIndex(currentTier);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[130] bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50">
          <div>
            <h2 className="font-bold text-2xl text-[#1E0E62]">Choose Your Plan</h2>
            <p className="text-sm text-gray-600 mt-1">Unlock more features and maximize your rewards</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Current Plan Badge */}
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900">
                Current Plan: <span className="font-bold">{currentTier}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Users className="w-4 h-4 text-gray-500" />
              <span>
                {currentTier === SubscriptionLevel.FREE ? '5 missions/month' :
                 currentTier === SubscriptionLevel.SILVER ? '20 missions/month' :
                 currentTier === SubscriptionLevel.GOLD ? 'Unlimited missions' :
                 'Unlimited everything'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Briefcase className="w-4 h-4 text-gray-500" />
              <span>
                {currentTier === SubscriptionLevel.GOLD || currentTier === SubscriptionLevel.PLATINUM 
                  ? 'Creator Mode Enabled' 
                  : 'Creator Mode Locked'}
              </span>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => {
              const isCurrentPlan = plan.tier === currentTier;
              const isSelected = plan.tier === selectedTier;
              
              return (
                <div
                  key={plan.tier}
                  onClick={() => setSelectedTier(plan.tier)}
                  className={`relative rounded-xl border-2 p-5 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-purple-500 shadow-lg shadow-purple-200 scale-105' 
                      : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                  } ${isCurrentPlan ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                      POPULAR
                    </div>
                  )}

                  {/* Current Plan Badge */}
                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-3 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                      CURRENT
                    </div>
                  )}

                  {/* Icon & Name */}
                  <div className={`flex items-center gap-2 mb-3 ${plan.color}`}>
                    {plan.icon}
                    <h3 className="font-bold text-lg">{plan.name}</h3>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-[#1E0E62]">{plan.price}</span>
                      <span className="text-sm text-gray-600">{plan.period}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-4">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs">
                        {feature.included ? (
                          <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                        )}
                        <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Select Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTier(plan.tier);
                    }}
                    className={`w-full py-2 rounded-lg font-bold text-sm transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white shadow-md'
                        : isCurrentPlan
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {isCurrentPlan ? 'Current Plan' : isSelected ? 'Selected' : 'Select Plan'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Benefits Section */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <TrendingUp className="w-8 h-8 text-purple-600 mb-2" />
              <h4 className="font-bold text-sm text-purple-900 mb-1">More Missions</h4>
              <p className="text-xs text-purple-700">Higher tiers unlock more monthly missions and better rewards</p>
            </div>
            <div className="bg-pink-50 border border-pink-200 rounded-xl p-4">
              <Users className="w-8 h-8 text-pink-600 mb-2" />
              <h4 className="font-bold text-sm text-pink-900 mb-1">Creator Mode</h4>
              <p className="text-xs text-pink-700">Gold+ members can become creators and earn from collaborations</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <Gift className="w-8 h-8 text-yellow-600 mb-2" />
              <h4 className="font-bold text-sm text-yellow-900 mb-1">Exclusive Events</h4>
              <p className="text-xs text-yellow-700">Access VIP events, early mission drops, and premium perks</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              {isUpgrade && selectedTier !== currentTier && (
                <span className="text-green-600 font-medium">
                  ⬆️ Upgrading to {selectedTier}
                </span>
              )}
              {isDowngrade && (
                <span className="text-orange-600 font-medium">
                  ⬇️ Downgrading to {selectedTier}
                </span>
              )}
              {selectedTier === currentTier && (
                <span className="text-blue-600 font-medium">
                  You're on the {currentTier} plan
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpgrade}
                disabled={selectedTier === currentTier}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                  selectedTier === currentTier
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white hover:shadow-lg'
                }`}
              >
                {isUpgrade ? 'Upgrade Now' : isDowngrade ? 'Downgrade' : 'Current Plan'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
