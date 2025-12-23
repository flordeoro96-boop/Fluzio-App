import React, { useState } from 'react';
import { Zap, Check, Sparkles, TrendingUp, ShoppingCart } from 'lucide-react';
import { GROWTH_CREDIT_PACKS, getGrowthCreditPackPrice, GROWTH_CREDIT_DISCOUNTS } from '../../src/lib/levels/subscriptionTiers';
import type { BusinessLevel } from '../../src/lib/levels/subscriptionTypes';

export interface GrowthCreditPack {
  credits: number;
  price: number;
  name: string;
}

interface GrowthCreditsStoreProps {
  userLevel: BusinessLevel;
  currentBalance: number;
  onPurchase: (pack: GrowthCreditPack, finalPrice: number) => void;
}

export const GrowthCreditsStore: React.FC<GrowthCreditsStoreProps> = ({
  userLevel,
  currentBalance,
  onPurchase
}) => {
  const [selectedPack, setSelectedPack] = useState<GrowthCreditPack | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async (pack: GrowthCreditPack) => {
    setIsProcessing(true);
    const finalPrice = getGrowthCreditPackPrice(pack, userLevel);
    
    try {
      await onPurchase(pack, finalPrice);
      setSelectedPack(null);
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getPackColor = (packName: string) => {
    const colors: Record<string, string> = {
      'Starter': 'from-gray-400 to-gray-600',
      'Growth': 'from-blue-500 to-cyan-500',
      'Boost': 'from-purple-500 to-pink-500',
      'Scale': 'from-orange-500 to-red-500',
      'Enterprise': 'from-yellow-500 to-orange-600'
    };
    return colors[packName] || 'from-gray-400 to-gray-600';
  };

  const getPackIcon = (packName: string) => {
    const icons: Record<string, React.ReactElement> = {
      'Starter': <TrendingUp className="w-8 h-8" />,
      'Growth': <Zap className="w-8 h-8" />,
      'Boost': <Sparkles className="w-8 h-8" />,
      'Scale': <ShoppingCart className="w-8 h-8" />,
      'Enterprise': <Sparkles className="w-10 h-10" />
    };
    return icons[packName] || <Zap className="w-8 h-8" />;
  };

  const discount = GROWTH_CREDIT_DISCOUNTS[userLevel] || 0;
  const recommendedPack = GROWTH_CREDIT_PACKS[2]; // Boost pack

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full mb-4">
          <Zap className="w-5 h-5" />
          <span className="font-semibold">Current Balance: {currentBalance.toLocaleString()} FGC</span>
        </div>
        <h2 className="text-3xl font-bold text-[#1E0E62] mb-2">Purchase Growth Credits</h2>
        <p className="text-[#8F8FA3] max-w-2xl mx-auto">
          Boost your visibility, reach more customers, and grow your business faster with Fluzio Growth Credits
        </p>
        
        {discount > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-6 py-3 rounded-xl border-2 border-green-300">
            <Sparkles className="w-5 h-5" />
            <span className="font-bold">Level {userLevel} Bonus: {discount}% OFF all packs!</span>
          </div>
        )}
      </div>

      {/* Pack Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {GROWTH_CREDIT_PACKS.map((pack) => {
          const basePrice = pack.price;
          const finalPrice = getGrowthCreditPackPrice(pack, userLevel);
          const savings = basePrice - finalPrice;
          const pricePerCredit = (finalPrice / pack.credits).toFixed(3);
          const isRecommended = pack.name === recommendedPack.name;
          const isSelected = selectedPack?.name === pack.name;

          return (
            <div
              key={pack.name}
              className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all cursor-pointer transform hover:scale-105 ${
                isSelected ? 'ring-4 ring-purple-500 scale-105' : ''
              } ${isRecommended ? 'border-4 border-yellow-400' : 'border border-gray-200'}`}
              onClick={() => setSelectedPack(pack)}
            >
              {/* Recommended Badge */}
              {isRecommended && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold py-1 text-center">
                  ⭐ MOST POPULAR
                </div>
              )}

              {/* Header */}
              <div className={`p-6 bg-gradient-to-br ${getPackColor(pack.name)} ${isRecommended ? 'pt-8' : ''}`}>
                <div className="flex justify-center mb-3 text-white">
                  {getPackIcon(pack.name)}
                </div>
                <h3 className="text-xl font-bold text-white text-center mb-1">{pack.name}</h3>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{pack.credits.toLocaleString()}</div>
                  <div className="text-sm text-white/90">Growth Credits</div>
                </div>
              </div>

              {/* Pricing */}
              <div className="p-6">
                <div className="text-center mb-4">
                  {savings > 0 ? (
                    <>
                      <div className="text-sm text-[#8F8FA3] line-through">{formatCurrency(basePrice)}</div>
                      <div className="text-3xl font-bold text-[#1E0E62]">{formatCurrency(finalPrice)}</div>
                      <div className="text-xs text-green-600 font-semibold">Save {formatCurrency(savings)}!</div>
                    </>
                  ) : (
                    <div className="text-3xl font-bold text-[#1E0E62]">{formatCurrency(finalPrice)}</div>
                  )}
                  <div className="text-xs text-[#8F8FA3] mt-1">€{pricePerCredit} per credit</div>
                </div>

                {/* Features */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Never expires</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Use for missions</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Instant delivery</span>
                  </div>
                  {pack.credits >= 1000 && (
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span className="font-semibold text-purple-600">Bonus analytics</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePurchase(pack);
                  }}
                  disabled={isProcessing}
                  className={`w-full py-3 rounded-xl font-bold transition-all ${
                    isRecommended
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:shadow-xl'
                      : `bg-gradient-to-r ${getPackColor(pack.name)} text-white hover:shadow-lg`
                  } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105'}`}
                >
                  {isProcessing ? 'Processing...' : 'Purchase'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* What Can You Do Section */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-purple-200">
        <h3 className="text-2xl font-bold text-[#1E0E62] mb-6 text-center">
          What Can You Do With Growth Credits?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-bold text-[#1E0E62] mb-2">Boost Missions</h4>
            <p className="text-sm text-[#8F8FA3]">Increase visibility and reach 10x more potential participants</p>
            <div className="mt-3 text-xs text-blue-600 font-semibold">50-200 credits per boost</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="font-bold text-[#1E0E62] mb-2">Priority Matching</h4>
            <p className="text-sm text-[#8F8FA3]">Get matched with high-quality participants first</p>
            <div className="mt-3 text-xs text-purple-600 font-semibold">30 credits per mission</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="font-bold text-[#1E0E62] mb-2">Featured Listings</h4>
            <p className="text-sm text-[#8F8FA3]">Appear at the top of search results for 7 days</p>
            <div className="mt-3 text-xs text-green-600 font-semibold">100 credits per week</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <ShoppingCart className="w-6 h-6 text-orange-600" />
            </div>
            <h4 className="font-bold text-[#1E0E62] mb-2">Campaign Automation</h4>
            <p className="text-sm text-[#8F8FA3]">Run automated growth campaigns (L4+ only)</p>
            <div className="mt-3 text-xs text-orange-600 font-semibold">100-500 credits per day</div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-8 bg-white rounded-2xl p-8 shadow-lg">
        <h3 className="text-xl font-bold text-[#1E0E62] mb-6">Frequently Asked Questions</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-[#1E0E62] mb-1">Do Growth Credits expire?</h4>
            <p className="text-sm text-[#8F8FA3]">No! All purchased credits never expire and stay in your account forever.</p>
          </div>
          <div>
            <h4 className="font-semibold text-[#1E0E62] mb-1">What's the difference between monthly allocation and purchased credits?</h4>
            <p className="text-sm text-[#8F8FA3]">Monthly allocation credits are included with your subscription tier and renew every month. Purchased credits are additional and never expire.</p>
          </div>
          <div>
            <h4 className="font-semibold text-[#1E0E62] mb-1">Can I get a refund?</h4>
            <p className="text-sm text-[#8F8FA3]">Purchased credits are non-refundable. However, unused mission credits are automatically refunded if a mission is canceled.</p>
          </div>
          <div>
            <h4 className="font-semibold text-[#1E0E62] mb-1">How do level discounts work?</h4>
            <p className="text-sm text-[#8F8FA3]">
              Level 4 gets 10% off, Level 5 gets 20% off, and Level 6 (Elite) gets 30% off all Growth Credit purchases.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
