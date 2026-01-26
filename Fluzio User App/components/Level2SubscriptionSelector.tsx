import React from 'react';
import { 
  Check, X, Crown, Zap, Shield, TrendingUp, 
  Users, Instagram, MapPin, Star, Award, FileText,
  Video, MessageSquare, Clock, AlertTriangle
} from 'lucide-react';
import { Level2Tier, LEVEL2_TIER_PRICING } from '../services/level2SubscriptionService';

interface Level2SubscriptionSelectorProps {
  currentTier: Level2Tier;
  businessId: string;
  onSelectTier: (tier: Level2Tier) => void;
  onClose: () => void;
}

const Level2SubscriptionSelector: React.FC<Level2SubscriptionSelectorProps> = ({
  currentTier,
  businessId,
  onSelectTier,
  onClose
}) => {
  const tiers = [
    {
      id: 'FREE' as Level2Tier,
      name: 'Free',
      price: 0,
      badge: null,
      gradient: 'from-gray-500 to-gray-600',
      purpose: 'Test Beevvy seriously',
      features: [
        { text: '1 active mission at a time', icon: FileText, included: true },
        { text: 'Visit & check-in missions', icon: MapPin, included: true },
        { text: 'Up to 10 participants/mission', icon: Users, included: true },
        { text: 'Basic analytics', icon: TrendingUp, included: true },
        { text: 'My Squad access', icon: Users, included: true },
        { text: 'City-level visibility', icon: MapPin, included: true },
        { text: 'Verification badge', icon: Shield, included: true },
        { text: 'Instagram missions', icon: Instagram, included: false },
        { text: 'Google reviews', icon: Star, included: false },
        { text: 'Events access', icon: Users, included: false }
      ]
    },
    {
      id: 'SILVER' as Level2Tier,
      name: 'Silver',
      price: 29,
      badge: 'Most Popular',
      badgeColor: 'bg-blue-500',
      gradient: 'from-blue-500 to-blue-600',
      purpose: 'Consistent local traction',
      features: [
        { text: '2-3 active missions', icon: FileText, included: true },
        { text: 'Visit & check-in missions', icon: MapPin, included: true },
        { text: 'Instagram follow & story missions', icon: Instagram, included: true },
        { text: '20-40 participants/month', icon: Users, included: true },
        { text: 'Basic analytics', icon: TrendingUp, included: true },
        { text: 'Events access (pay-per-event)', icon: Users, included: true },
        { text: 'My Squad access', icon: Users, included: true },
        { text: 'Verification badge', icon: Shield, included: true },
        { text: 'Google reviews', icon: Star, included: false },
        { text: 'Video missions', icon: Video, included: false }
      ]
    },
    {
      id: 'GOLD' as Level2Tier,
      name: 'Gold',
      price: 59,
      badge: 'Best ROI',
      badgeColor: 'bg-yellow-500',
      gradient: 'from-yellow-500 to-orange-500',
      purpose: 'Measurable ROI',
      features: [
        { text: '5-6 active missions', icon: FileText, included: true },
        { text: 'All Instagram missions (feed + story)', icon: Instagram, included: true },
        { text: '60-120 participants/month', icon: Users, included: true },
        { text: 'Google reviews (10/month, capped)', icon: Star, included: true, warning: 'Limited' },
        { text: 'Referral missions (3/month)', icon: MessageSquare, included: true, warning: 'Capped' },
        { text: 'Enhanced analytics', icon: TrendingUp, included: true },
        { text: 'Events access + 1 free/quarter', icon: Users, included: true },
        { text: 'Verification badge', icon: Shield, included: true },
        { text: 'Video missions', icon: Video, included: false },
        { text: 'Priority support', icon: Zap, included: false }
      ]
    },
    {
      id: 'PLATINUM' as Level2Tier,
      name: 'Platinum',
      price: 99,
      badge: 'Dominate Locally',
      badgeColor: 'bg-purple-500',
      gradient: 'from-purple-500 to-purple-700',
      purpose: 'Maximum local impact',
      features: [
        { text: 'Unlimited missions (fair use)', icon: FileText, included: true },
        { text: 'All mission types + video', icon: Video, included: true },
        { text: 'Up to 300 participants/month', icon: Users, included: true },
        { text: 'Google reviews (20/month, protected)', icon: Star, included: true, warning: 'Capped' },
        { text: 'Referral missions (6/month)', icon: MessageSquare, included: true, warning: 'Capped' },
        { text: 'Priority city feed placement', icon: Crown, included: true },
        { text: 'Enhanced analytics', icon: TrendingUp, included: true },
        { text: 'Priority support', icon: Zap, included: true },
        { text: 'Free Event access (1/quarter)', icon: Users, included: true },
        { text: 'Verification badge', icon: Shield, included: true }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Crown className="w-4 h-4" />
            Level 2 - Established Business
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Choose Your Growth Plan
          </h1>
          <p className="text-gray-600 text-lg">
            Full mission creation, analytics, and local reach
          </p>
          <button
            onClick={onClose}
            className="mt-4 text-gray-500 hover:text-gray-700 text-sm"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Core Features Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 mb-8 text-white">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Award className="w-6 h-6" />
            Every Level 2 Business Gets:
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">Launch missions</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">Local creators & users</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">Basic analytics</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">City-level visibility</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">Verification badge</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">Events access</span>
            </div>
          </div>
        </div>

        {/* Tier Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {tiers.map((tier) => {
            const isCurrentTier = currentTier === tier.id;
            
            return (
              <div
                key={tier.id}
                className={`relative rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${
                  isCurrentTier ? 'ring-4 ring-green-500' : ''
                }`}
              >
                {/* Badge */}
                {tier.badge && (
                  <div className={`${tier.badgeColor} text-white text-xs font-bold px-3 py-1 absolute top-4 right-4 rounded-full`}>
                    {tier.badge}
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrentTier && (
                  <div className="bg-green-500 text-white text-xs font-bold px-3 py-1 absolute top-4 left-4 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Current Plan
                  </div>
                )}

                {/* Header */}
                <div className={`bg-gradient-to-r ${tier.gradient} p-6 text-white`}>
                  <h3 className="text-2xl font-bold mb-1">{tier.name}</h3>
                  <div className="text-3xl font-bold mb-2">
                    €{tier.price}
                    <span className="text-sm font-normal opacity-90">/month</span>
                  </div>
                  <p className="text-sm opacity-90">{tier.purpose}</p>
                </div>

                {/* Features */}
                <div className="p-6 space-y-3">
                  {tier.features.map((feature, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-2 text-sm ${
                        feature.included ? 'text-gray-700' : 'text-gray-400'
                      }`}
                    >
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <feature.icon className="w-4 h-4 flex-shrink-0" />
                          <span className={feature.included ? 'font-medium' : ''}>
                            {feature.text}
                          </span>
                        </div>
                        {feature.warning && (
                          <span className="text-xs text-orange-500 flex items-center gap-1 mt-1">
                            <AlertTriangle className="w-3 h-3" />
                            {feature.warning}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <div className="p-6 pt-0">
                  {isCurrentTier ? (
                    <button
                      disabled
                      className="w-full py-3 px-4 bg-gray-100 text-gray-500 rounded-xl font-semibold cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => onSelectTier(tier.id)}
                      className={`w-full py-3 px-4 bg-gradient-to-r ${tier.gradient} text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200`}
                    >
                      {LEVEL2_TIER_PRICING[currentTier] < tier.price ? 'Upgrade' : 'Downgrade'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Safety Rules Notice */}
        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-orange-900 mb-2">
                Platform Safety Rules
              </h3>
              <div className="space-y-2 text-sm text-orange-800">
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Google Reviews:</strong> Hard monthly caps, 5-7 day cooldowns, and visit verification required
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Referral Missions:</strong> Limited per campaign with 24-72 hour delayed reward unlock
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>All Missions:</strong> Time throttles, fraud detection, and manual override protection
                  </p>
                </div>
                <p className="text-xs mt-3 text-orange-700">
                  These rules keep Beevvy safe, scalable, and compliant with platform policies.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Common Questions
          </h3>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">
                What's the difference between Level 1 and Level 2?
              </h4>
              <p className="text-gray-600">
                Level 1 is for aspiring businesses building their foundation. Level 2 is for established businesses 
                with verified locations who can create missions, access full analytics, and drive real customer acquisition.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">
                Why are Google reviews and referrals capped?
              </h4>
              <p className="text-gray-600">
                To protect Beevvy and comply with platform policies. These safety limits ensure sustainable growth 
                and prevent abuse while still giving you powerful tools to grow your business.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">
                Can I upgrade or downgrade anytime?
              </h4>
              <p className="text-gray-600">
                Yes! Changes take effect immediately. Upgrades are prorated, and downgrades apply at the next billing cycle.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">
                What happens to my active missions if I downgrade?
              </h4>
              <p className="text-gray-600">
                Active missions continue running, but you won't be able to create new ones until you're within your new tier's limits.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Level2SubscriptionSelector;
