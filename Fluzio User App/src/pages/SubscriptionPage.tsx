import React, { useState } from 'react';
import { 
  SubscriptionTierSelector, 
  UsageDashboard, 
  GrowthCreditsStore, 
  UpgradePrompt 
} from '../../components/subscription';
import type { SubscriptionTier, BillingCycle } from '../../components/subscription';
import type { GrowthCreditPack } from '../../components/subscription';
import { Crown, Zap, TrendingUp } from 'lucide-react';

/**
 * SUBSCRIPTION MANAGEMENT PAGE
 * 
 * This page demonstrates how to use all subscription-related components together.
 * It includes:
 * - Tier selection (only shows tiers available for user's level)
 * - Usage dashboard (real-time limits and consumption)
 * - Growth Credits store (purchase additional credits)
 * - Upgrade prompts (when users hit limits)
 * 
 * Integration with backend:
 * - Reads user data from Firestore (real-time listeners)
 * - Calls Cloud Functions for validation (canCreateMission, canHostMeetup, useGrowthCredits)
 * - Updates subscription via Stripe (to be implemented)
 * - Purchases credits via Stripe (to be implemented)
 */

const SubscriptionPage: React.FC = () => {
  // In real implementation, get this from auth context
  const userId = 'demo-user-id'; // Replace with actual user ID
  const currentLevel = 3; // LEVEL 3 - Operator
  const currentTier: SubscriptionTier = 'SILVER';

  const [activeTab, setActiveTab] = useState('overview');
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<'MISSION_LIMIT' | 'MEETUP_LIMIT' | 'CREDITS_LOW' | 'PARTICIPANT_LIMIT' | 'GEOGRAPHIC_LIMIT' | 'LEVEL_LOCKED'>('MISSION_LIMIT');

  /**
   * Handle tier upgrade
   * In production: 
   * 1. Validate user can upgrade (Stripe payment method exists)
   * 2. Create Stripe checkout session
   * 3. Redirect to Stripe payment page
   * 4. Handle webhook to update Firestore on payment success
   */
  const handleTierSelection = async (tier: SubscriptionTier, billingCycle: BillingCycle) => {
    console.log('Selected tier:', tier, 'Billing:', billingCycle);
    
    // TODO: Implement Stripe subscription flow
    // const response = await fetch('/api/create-subscription', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ userId, tier, billingCycle })
    // });
    
    alert(`Upgrading to ${tier} (${billingCycle})\n\nStripe integration coming soon!`);
  };

  /**
   * Handle Growth Credits purchase
   * In production:
   * 1. Create Stripe one-time payment session
   * 2. Apply level-based discounts
   * 3. Redirect to payment
   * 4. Webhook allocates credits on payment success
   */
  const handleCreditsPurchase = async (pack: GrowthCreditPack, finalPrice: number) => {
    console.log('Purchasing:', pack, 'Price:', finalPrice);
    
    // TODO: Implement Stripe payment flow
    // const response = await fetch('/api/purchase-credits', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ userId, pack, finalPrice })
    // });
    
    alert(`Purchasing ${pack.credits} credits for €${finalPrice}\n\nStripe integration coming soon!`);
  };

  /**
   * Handle upgrade from prompt
   */
  const handleUpgrade = (tier: SubscriptionTier) => {
    setShowUpgradePrompt(false);
    handleTierSelection(tier, 'MONTHLY');
  };

  /**
   * Show upgrade prompt when user hits a limit
   * Call this from mission/meetup creation flows
   */
  const showUpgradeDialog = (reason: typeof upgradeReason) => {
    setUpgradeReason(reason);
    setShowUpgradePrompt(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md mb-4">
            <Crown className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-[#1E0E62]">
              Level {currentLevel} • {currentTier} Plan
            </span>
          </div>
          <h1 className="text-4xl font-bold text-[#1E0E62] mb-2">Subscription Management</h1>
          <p className="text-[#8F8FA3] max-w-2xl mx-auto">
            Manage your subscription, track usage, and purchase Growth Credits to grow your business faster
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto">
          <div className="grid w-full grid-cols-3 mb-8 bg-white rounded-xl shadow-lg p-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Usage Overview
            </button>
            <button
              onClick={() => setActiveTab('tiers')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'tiers'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Crown className="w-4 h-4" />
              Upgrade Plan
            </button>
            <button
              onClick={() => setActiveTab('credits')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'credits'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Zap className="w-4 h-4" />
              Buy Credits
            </button>
          </div>

          {/* Usage Dashboard Tab */}
          {activeTab === 'overview' && (
            <>
              <UsageDashboard 
                userId={userId}
                onUpgradeClick={() => setActiveTab('tiers')}
              />
              
              {/* Demo Buttons - Remove in production */}
              <div className="mt-8 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
                <h3 className="font-bold text-[#1E0E62] mb-4">🧪 Demo: Trigger Upgrade Prompts</h3>
                <p className="text-sm text-[#8F8FA3] mb-4">
                  Click these buttons to see what happens when users hit their limits
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => showUpgradeDialog('MISSION_LIMIT')}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Mission Limit Reached
                  </button>
                  <button
                    onClick={() => showUpgradeDialog('MEETUP_LIMIT')}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    Meetup Limit Reached
                  </button>
                  <button
                    onClick={() => showUpgradeDialog('CREDITS_LOW')}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                  >
                    Credits Running Low
                  </button>
                  <button
                    onClick={() => showUpgradeDialog('PARTICIPANT_LIMIT')}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    Participant Limit
                  </button>
                  <button
                    onClick={() => showUpgradeDialog('GEOGRAPHIC_LIMIT')}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                  >
                    Geographic Limit
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Tier Selection Tab */}
          {activeTab === 'tiers' && (
            <SubscriptionTierSelector
              currentLevel={currentLevel}
              currentTier={currentTier}
              onSelectTier={handleTierSelection}
            />
          )}

          {/* Credits Store Tab */}
          {activeTab === 'credits' && (
            <GrowthCreditsStore
              userLevel={currentLevel}
              currentBalance={450} // In production, get from Firestore
              onPurchase={handleCreditsPurchase}
            />
          )}
        </div>
      </div>

      {/* Upgrade Prompt Modal */}
      <UpgradePrompt
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        currentLevel={currentLevel}
        currentTier={currentTier}
        reason={upgradeReason}
        onUpgrade={handleUpgrade}
      />
    </div>
  );
};

export default SubscriptionPage;
