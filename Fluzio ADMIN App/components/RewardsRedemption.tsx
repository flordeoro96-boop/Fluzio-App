import React, { useState, useEffect } from 'react';
import { Gift, Star, Tag, Calendar, Check, Clock, X } from 'lucide-react';
import { Reward, CustomerRedemption, RewardCategory } from '../types/rewards';
import { getActiveRewards, redeemReward, getUserRedemptions } from '../services/rewardsService';
import { useTranslation } from 'react-i18next';
import { User } from '../types';

interface RewardsRedemptionProps {
  user: User;
}

export const RewardsRedemption: React.FC<RewardsRedemptionProps> = ({ user }) => {
  const { t } = useTranslation();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [myRedemptions, setMyRedemptions] = useState<CustomerRedemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'my-rewards'>('available');
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('[RewardsRedemption] Loading rewards for user:', user.id);
      const [availableRewards, redemptions] = await Promise.all([
        getActiveRewards(),
        getUserRedemptions(user.id)
      ]);
      console.log('[RewardsRedemption] Available rewards:', availableRewards.length);
      console.log('[RewardsRedemption] User redemptions:', redemptions.length);
      setRewards(availableRewards);
      setMyRedemptions(redemptions);
    } catch (error) {
      console.error('[RewardsRedemption] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (reward: Reward) => {
    if (user.points < reward.pointsCost) {
      alert("You don't have enough points!");
      return;
    }

    if (!confirm(`Redeem ${reward.title} for ${reward.pointsCost} points?`)) {
      return;
    }

    setRedeeming(true);
    const result = await redeemReward(user.id, user.name, reward.id);
    
    if (result.success) {
      alert('Reward redeemed successfully! Check "My Rewards" tab.');
      loadData();
      setSelectedReward(null);
    } else {
      alert('Failed to redeem: ' + result.error);
    }
    setRedeeming(false);
  };

  const getCategoryIcon = (category: RewardCategory) => {
    switch (category) {
      case RewardCategory.DISCOUNT: return '💰';
      case RewardCategory.FREE_ITEM: return '🎁';
      case RewardCategory.COUPON: return '🎫';
      case RewardCategory.GIFT_CARD: return '💳';
      case RewardCategory.EXCLUSIVE_ACCESS: return '⭐';
      default: return '📌';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'APPROVED': return 'bg-green-100 text-green-700';
      case 'USED': return 'bg-gray-100 text-gray-600';
      case 'EXPIRED': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Rewards</h1>
              <p className="text-white/80 mt-1">Redeem your points for amazing rewards</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-2xl">
              <div className="text-sm text-white/80">Your Points</div>
              <div className="text-3xl font-bold">{user.points}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex">
          <button
            onClick={() => setActiveTab('available')}
            className={`flex-1 py-4 font-bold text-center transition-all ${
              activeTab === 'available'
                ? 'text-[#00E5FF] border-b-2 border-[#00E5FF]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Gift className="w-5 h-5 inline mr-2" />
            Available Rewards
          </button>
          <button
            onClick={() => setActiveTab('my-rewards')}
            className={`flex-1 py-4 font-bold text-center transition-all relative ${
              activeTab === 'my-rewards'
                ? 'text-[#00E5FF] border-b-2 border-[#00E5FF]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Star className="w-5 h-5 inline mr-2" />
            My Rewards
            {myRedemptions.filter(r => r.status === 'PENDING').length > 0 && (
              <span className="absolute top-2 right-1/3 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {myRedemptions.filter(r => r.status === 'PENDING').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#00E5FF] border-t-transparent mx-auto"></div>
          </div>
        ) : activeTab === 'available' ? (
          // Available Rewards Tab
          rewards.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
              <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-600 mb-2">No rewards available yet</h3>
              <p className="text-gray-500 mb-4">Businesses haven't created any rewards yet!</p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-md mx-auto text-sm text-left">
                <p className="font-semibold text-blue-900 mb-2">💡 For Business Users:</p>
                <p className="text-blue-700">
                  Switch to a <strong>Business account</strong> → Go to the <strong>Rewards tab</strong> → 
                  Click <strong>"Create Reward"</strong> to add rewards that customers can redeem!
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rewards.map(reward => (
                <div
                  key={reward.id}
                  onClick={() => setSelectedReward(reward)}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-lg transition-all cursor-pointer"
                >
                  {/* Image */}
                  {reward.imageUrl ? (
                    <div className="h-40 bg-gradient-to-br from-purple-100 to-pink-100">
                      <img src={reward.imageUrl} alt={reward.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-40 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                      <span className="text-6xl">{getCategoryIcon(reward.category)}</span>
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-lg text-[#1E0E62] line-clamp-2 flex-1">{reward.title}</h3>
                      <div className="bg-gradient-to-r from-[#FFB86C] to-[#FF8C00] text-white px-3 py-1 rounded-lg font-bold text-sm whitespace-nowrap ml-2">
                        {reward.pointsCost} pts
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{reward.description}</p>
                    
                    {/* Business */}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">
                        {reward.businessName.charAt(0)}
                      </div>
                      <span>{reward.businessName}</span>
                    </div>
                    
                    {/* Availability */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {reward.unlimited ? (
                          <span className="text-green-600 font-medium">♾️ Unlimited</span>
                        ) : (
                          <span>{reward.totalAvailable - reward.claimed} left</span>
                        )}
                      </div>
                      
                      {/* Eligibility badges */}
                      <div className="flex gap-1">
                        {reward.levelRequired && reward.levelRequired > 0 && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                            L{reward.levelRequired}+
                          </span>
                        )}
                        {reward.validDays && reward.validDays.length > 0 && reward.validDays.length < 7 && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                            📅 Specific days
                          </span>
                        )}
                        {reward.validTimeStart && reward.validTimeEnd && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                            🕐 {reward.validTimeStart}-{reward.validTimeEnd}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          // My Rewards Tab
          myRedemptions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl">
              <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-600 mb-2">No rewards yet</h3>
              <p className="text-gray-500 mb-6">Redeem your points to get rewards!</p>
              <button
                onClick={() => setActiveTab('available')}
                className="bg-[#00E5FF] text-white px-6 py-2 rounded-lg font-bold"
              >
                Browse Rewards
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myRedemptions.map(redemption => (
                <div key={redemption.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-[#1E0E62] mb-1">{redemption.reward.title}</h3>
                      <p className="text-sm text-gray-600">{redemption.reward.businessName}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${getStatusColor(redemption.status)}`}>
                      {redemption.status}
                    </span>
                  </div>
                  
                  {/* Coupon Code */}
                  {redemption.couponCode && redemption.status === 'PENDING' && (
                    <div className="bg-gradient-to-r from-[#FFB86C]/20 to-[#FF8C00]/20 border-2 border-dashed border-[#FFB86C] rounded-xl p-4 mb-4">
                      <div className="text-sm text-gray-600 mb-1">Coupon Code</div>
                      <div className="font-mono text-2xl font-bold text-[#1E0E62]">{redemption.couponCode}</div>
                      <div className="text-xs text-gray-500 mt-2">Show this code to staff</div>
                    </div>
                  )}
                  
                  {/* Details */}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>
                      <Tag className="w-4 h-4 inline mr-1" />
                      {redemption.pointsSpent} points
                    </span>
                    <span>
                      <Clock className="w-4 h-4 inline mr-1" />
                      {new Date(redemption.redeemedAt).toLocaleDateString()}
                    </span>
                    {redemption.expiresAt && (
                      <span className="text-red-500">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Expires {new Date(redemption.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Reward Detail Modal */}
      {selectedReward && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Image */}
            {selectedReward.imageUrl ? (
              <div className="h-64 bg-gradient-to-br from-purple-100 to-pink-100">
                <img src={selectedReward.imageUrl} alt={selectedReward.title} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="h-64 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                <span className="text-8xl">{getCategoryIcon(selectedReward.category)}</span>
              </div>
            )}
            
            {/* Content */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-[#1E0E62] mb-2">{selectedReward.title}</h2>
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-bold">
                      {selectedReward.businessName.charAt(0)}
                    </div>
                    <span className="font-medium">{selectedReward.businessName}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedReward(null)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <p className="text-gray-700 mb-6">{selectedReward.description}</p>
              
              {/* Redemption Instructions */}
              {selectedReward.redemptionInstructions && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                  <h4 className="font-bold text-blue-900 mb-2">How to Redeem</h4>
                  <p className="text-sm text-blue-800">{selectedReward.redemptionInstructions}</p>
                </div>
              )}
              
              {/* Terms */}
              {selectedReward.terms && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <h4 className="font-bold text-gray-900 mb-2">Terms & Conditions</h4>
                  <p className="text-sm text-gray-700">{selectedReward.terms}</p>
                </div>
              )}
              
              {/* Stats */}
              <div className="flex items-center justify-between mb-6 text-sm text-gray-600">
                <span>{selectedReward.totalAvailable - selectedReward.claimed} available</span>
                {selectedReward.expiresAt && (
                  <span>Expires {new Date(selectedReward.expiresAt).toLocaleDateString()}</span>
                )}
              </div>
              
              {/* Action Button */}
              <button
                onClick={() => handleRedeem(selectedReward)}
                disabled={redeeming || user.points < selectedReward.pointsCost}
                className="w-full bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {redeeming ? 'Redeeming...' : user.points < selectedReward.pointsCost 
                  ? `Need ${selectedReward.pointsCost - user.points} more points`
                  : `Redeem for ${selectedReward.pointsCost} points`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RewardsRedemption;
