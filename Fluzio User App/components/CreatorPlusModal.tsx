import React, { useState, useEffect } from 'react';
import { X, Crown, TrendingUp, Clock, Sparkles, Zap, HeadphonesIcon, AlertCircle } from 'lucide-react';
import { User } from '../types';
import { 
  hasCreatorPlus, 
  subscribeToCreatorPlus, 
  calculateSavings,
  getBreakevenPoint,
  getUserFeatures,
  CreatorPlusFeatures
} from '../services/creatorPlusService';

interface CreatorPlusModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSubscribed?: () => void;
}

export const CreatorPlusModal: React.FC<CreatorPlusModalProps> = ({
  isOpen,
  onClose,
  user,
  onSubscribed
}) => {
  const [loading, setLoading] = useState(false);
  const [isPlusUser, setIsPlusUser] = useState(false);
  const [currentFeatures, setCurrentFeatures] = useState<CreatorPlusFeatures | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  
  const monthlyPrice = 9.99;
  const annualPrice = 99.99; // 2 months free
  const breakevenPoint = getBreakevenPoint(monthlyPrice);

  useEffect(() => {
    if (isOpen) {
      loadUserStatus();
    }
  }, [isOpen, user.id]);

  const loadUserStatus = async () => {
    const isPlus = await hasCreatorPlus(user.id);
    const features = await getUserFeatures(user.id);
    setIsPlusUser(isPlus);
    setCurrentFeatures(features);
  };

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const durationMonths = selectedPlan === 'monthly' ? 1 : 12;
      const result = await subscribeToCreatorPlus(user.id, durationMonths, 'stripe');
      
      if (result.success) {
        alert('🎉 Welcome to Creator Plus! Your benefits are now active.');
        onSubscribed?.();
        onClose();
      } else {
        alert('Failed to subscribe. Please try again.');
      }
    } catch (error) {
      console.error('[CreatorPlusModal] Subscription error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const estimatedMonthlyEarnings = 500; // Example, could be calculated from user data
  const monthlySavings = calculateSavings(estimatedMonthlyEarnings);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-3xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Crown className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Creator Plus</h2>
                <p className="text-purple-100 text-sm">Level up your creator career</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Current Status */}
          {currentFeatures && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-100 mb-1">Current Commission Rate</p>
                  <p className="text-3xl font-bold">{(currentFeatures.commissionRate * 100).toFixed(0)}%</p>
                </div>
                {!isPlusUser && (
                  <div className="text-right">
                    <p className="text-sm text-purple-100 mb-1">With Creator Plus</p>
                    <p className="text-3xl font-bold text-yellow-300">8%</p>
                    <p className="text-xs text-purple-200">Save 4%</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Savings Calculator */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-2">Financial Benefits</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">If you earn €{estimatedMonthlyEarnings}/month:</span>
                    <span className="font-bold text-green-700">Save €{monthlySavings.toFixed(2)}/month</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Break-even point:</span>
                    <span className="font-semibold text-gray-900">€{breakevenPoint.toFixed(0)}/month earnings</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Creator Plus pays for itself once you earn ~€{breakevenPoint.toFixed(0)}/month or more
                </p>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4">All Creator Plus Benefits</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Feature 1: Reduced Commission */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-1">Reduced Commission</h4>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl font-bold text-purple-700">8%</span>
                      <span className="text-sm text-gray-500 line-through">12%</span>
                      <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                        SAVE 4%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Keep more of what you earn on every project
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 2: Early Access */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-1">Early Access</h4>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl font-bold text-blue-700">24h</span>
                      <span className="text-sm text-gray-600">head start</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      See new opportunities a full day before free creators
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 3: Priority Matching */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-5 border border-yellow-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-1">Priority Matching</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      AI ranks your profile slightly higher when you're a good fit
                    </p>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                      Fair boost, not pay-to-win
                    </span>
                  </div>
                </div>
              </div>

              {/* Feature 4: Advanced Insights */}
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-5 border border-pink-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-1">Advanced Insights</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Why you were selected</li>
                      <li>• Why you weren't selected</li>
                      <li>• Profile improvement tips</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Feature 5: Priority Support */}
              <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-5 border border-green-200 md:col-span-2">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <HeadphonesIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-1">Faster Payouts & Priority Support</h4>
                    <div className="grid md:grid-cols-2 gap-4 mt-2 text-sm text-gray-600">
                      <div>
                        <span className="font-semibold text-gray-900">Faster Payouts:</span> Shorter processing time for your earnings
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">Priority Support:</span> Get help faster when you need it
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Plans */}
          {!isPlusUser && (
            <div>
              <h3 className="font-bold text-gray-900 mb-4">Choose Your Plan</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {/* Monthly Plan */}
                <div
                  onClick={() => setSelectedPlan('monthly')}
                  className={`border-2 rounded-2xl p-6 cursor-pointer transition-all ${
                    selectedPlan === 'monthly'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-gray-900">Monthly</h4>
                    {selectedPlan === 'monthly' && (
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">€{monthlyPrice}</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Pay monthly, cancel anytime. Perfect to try Creator Plus.
                  </p>
                </div>

                {/* Annual Plan */}
                <div
                  onClick={() => setSelectedPlan('annual')}
                  className={`border-2 rounded-2xl p-6 cursor-pointer transition-all relative ${
                    selectedPlan === 'annual'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="absolute -top-3 right-4">
                    <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      SAVE 17%
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-gray-900">Annual</h4>
                    {selectedPlan === 'annual' && (
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">€{annualPrice}</span>
                    <span className="text-gray-600">/year</span>
                    <p className="text-sm text-green-600 font-semibold mt-1">€{((monthlyPrice * 12 - annualPrice) / 12).toFixed(2)}/month saved</p>
                  </div>
                  <p className="text-sm text-gray-600">
                    Best value! 2 months free compared to monthly billing.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Important Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-700">
              <p className="font-semibold text-gray-900 mb-1">Important</p>
              <p>
                Creator Plus benefits are designed to help you grow professionally, not to create unfair advantages. 
                Priority matching means your profile ranks slightly higher when you're genuinely a good fit.
              </p>
            </div>
          </div>

          {/* Action Button */}
          {!isPlusUser && (
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-6 rounded-xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : `Subscribe to Creator Plus - €${selectedPlan === 'monthly' ? monthlyPrice : annualPrice}${selectedPlan === 'monthly' ? '/month' : '/year'}`}
            </button>
          )}

          {isPlusUser && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">You're a Creator Plus member!</h3>
              <p className="text-sm text-gray-600">
                Enjoying all premium benefits including 8% commission rate
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
