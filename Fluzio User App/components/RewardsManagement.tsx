import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Gift, Tag, Calendar, Users, AlertCircle, Sparkles, Wand2, Lightbulb } from 'lucide-react';
import { Reward, RewardCategory } from '../types/rewards';
import { getBusinessRewards, createReward, updateReward, deleteReward } from '../services/rewardsService';
import { generateRewardSuggestions, enhanceRewardWithAI } from '../services/openaiService';
import { trackAIRewardGenerated } from '../services/firebaseAnalytics';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../services/AuthContext';

interface RewardsManagementProps {
  businessId: string;
  businessName: string;
  businessLogo?: string;
}

export const RewardsManagement: React.FC<RewardsManagementProps> = ({
  businessId,
  businessName,
  businessLogo
}) => {
  const { t } = useTranslation();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  useEffect(() => {
    loadRewards();
  }, [businessId]);

  const loadRewards = async () => {
    setLoading(true);
    const data = await getBusinessRewards(businessId);
    setRewards(data);
    setLoading(false);
  };

  const handleDelete = async (rewardId: string) => {
    if (!confirm('Are you sure you want to delete this reward?')) return;
    
    const result = await deleteReward(rewardId);
    if (result.success) {
      loadRewards();
    } else {
      alert('Failed to delete reward: ' + result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-[#1E0E62]">Rewards Catalog</h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">Create rewards for customers to redeem with points</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-[#00E5FF] via-[#6C4BFF] to-[#6C4BFF] text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold flex items-center gap-2 hover:shadow-lg hover:scale-105 transition-all group relative overflow-hidden text-sm md:text-base whitespace-nowrap self-stretch sm:self-auto justify-center"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-300/20 via-transparent to-transparent animate-shimmer"></div>
            <Wand2 className="w-4 h-4 md:w-5 md:h-5 group-hover:rotate-12 transition-transform flex-shrink-0" />
            <span className="relative flex items-center gap-1">
              <span className="hidden sm:inline">Create Reward</span>
              <span className="sm:hidden">Create</span>
              <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-yellow-300 flex-shrink-0" />
            </span>
          </button>
        </div>
      </div>

      {/* Rewards Grid */}
      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#00E5FF] border-t-transparent mx-auto"></div>
          </div>
        ) : rewards.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl">
            <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-600 mb-2">No rewards yet</h3>
            <p className="text-gray-500 mb-6 px-4">Create your first reward to attract customers</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 mx-auto hover:shadow-lg transition-all text-sm md:text-base"
            >
              <Wand2 className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
              <span className="whitespace-nowrap">Create with AI</span>
              <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map(reward => (
              <div key={reward.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-all">
                {/* Image */}
                {reward.imageUrl && (
                  <div className="h-40 bg-gradient-to-br from-purple-100 to-pink-100">
                    <img src={reward.imageUrl} alt={reward.title} className="w-full h-full object-cover" />
                  </div>
                )}
                
                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg text-[#1E0E62] line-clamp-1">{reward.title}</h3>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingReward(reward)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(reward.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{reward.description}</p>
                  
                  {/* Stats */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-gradient-to-r from-[#FFB86C] to-[#FF8C00] text-white px-3 py-1.5 rounded-lg font-bold text-sm">
                      {reward.pointsCost} points
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${reward.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {reward.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  {/* Availability */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      <Users className="w-4 h-4 inline mr-1" />
                      {reward.claimed}/{reward.totalAvailable} claimed
                    </span>
                    {reward.expiresAt && (
                      <span className="text-gray-500">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        {new Date(reward.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingReward) && (
        <RewardFormModal
          businessId={businessId}
          businessName={businessName}
          businessLogo={businessLogo}
          reward={editingReward}
          onClose={() => {
            setShowCreateModal(false);
            setEditingReward(null);
          }}
          onSuccess={() => {
            loadRewards();
            setShowCreateModal(false);
            setEditingReward(null);
          }}
        />
      )}
    </div>
  );
};

// Reward Form Modal Component
const RewardFormModal: React.FC<{
  businessId: string;
  businessName: string;
  businessLogo?: string;
  reward?: Reward | null;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ businessId, businessName, businessLogo, reward, onClose, onSuccess }) => {
  const { userProfile } = useAuth();
  const [formData, setFormData] = useState({
    title: reward?.title || '',
    description: reward?.description || '',
    category: reward?.category || RewardCategory.DISCOUNT,
    pointsCost: reward?.pointsCost || 100,
    totalAvailable: reward?.totalAvailable || 50,
    unlimited: reward?.unlimited || false,
    active: reward?.active ?? true,
    terms: reward?.terms || '',
    redemptionInstructions: reward?.redemptionInstructions || 'Show this code to staff at checkout',
    imageUrl: reward?.imageUrl || '',
    voucherCode: reward?.voucherCode || '',
    expiresAt: reward?.expiresAt || '',
    validDays: reward?.validDays || [],
    validTimeStart: reward?.validTimeStart || '',
    validTimeEnd: reward?.validTimeEnd || '',
    minPointsRequired: reward?.minPointsRequired || 0,
    minPurchaseAmount: reward?.minPurchaseAmount || 0,
    levelRequired: reward?.levelRequired || 0
  });
  const [saving, setSaving] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [enhancingWithAI, setEnhancingWithAI] = useState(false);

  const handleGenerateAISuggestions = async () => {
    setGeneratingAI(true);
    setShowAISuggestions(true);
    try {
      const businessType = userProfile?.businessType || 'retail store';
      
      // Get existing rewards to provide context
      const existingRewards = await getBusinessRewards(businessId);
      const existingContext = existingRewards.map(r => ({ title: r.title, category: r.category }));
      
      // Build comprehensive business context with all available data
      const businessContext = {
        category: userProfile?.category,
        aboutText: userProfile?.aboutText,
        website: userProfile?.socialLinks?.website || userProfile?.website,
        description: userProfile?.bio || userProfile?.description || userProfile?.aboutText,
        services: userProfile?.services || []
      };
      
      // Debug: Log what we're sending to AI
      console.log('🎯 AI Context for', businessName, ':', {
        businessType,
        businessName,
        hasAboutText: !!businessContext.aboutText,
        hasWebsite: !!businessContext.website,
        hasDescription: !!businessContext.description,
        servicesCount: businessContext.services?.length || 0,
        category: businessContext.category
      });
      
      // Show user what text is being used
      if (businessContext.aboutText) {
        console.log('📋 About Text being sent to AI:', businessContext.aboutText);
      } else {
        console.warn('⚠️ No aboutText found! AI will generate generic rewards.');
        alert('⚠️ No business description found. For best results, go to your Profile and generate an "About" section first. Generic rewards will be generated.');
      }
      
      const suggestions = await generateRewardSuggestions(
        businessType, 
        businessName, 
        existingContext,
        businessContext
      );
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      alert('Failed to generate AI suggestions. Please try again.');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSelectAISuggestion = (suggestion: any) => {
    setFormData({
      ...formData,
      title: suggestion.title,
      description: suggestion.description,
      category: suggestion.category,
      pointsCost: suggestion.suggestedPoints,
      terms: suggestion.terms,
      redemptionInstructions: suggestion.redemptionInstructions
    });
    setShowAISuggestions(false);
    
    // Track that user selected an AI suggestion
    trackAIRewardGenerated(businessId, true);
  };

  const handleEnhanceWithAI = async () => {
    if (!formData.title) {
      alert('Please enter a reward title first');
      return;
    }
    
    setEnhancingWithAI(true);
    try {
      const businessType = userProfile?.businessType || 'retail store';
      
      // Build business context for enhancement
      const businessContext = {
        businessName: businessName,
        aboutText: userProfile?.aboutText,
        website: userProfile?.socialLinks?.website || userProfile?.website,
        description: userProfile?.bio || userProfile?.description
      };
      
      const enhanced = await enhanceRewardWithAI(
        formData.title, 
        businessType, 
        formData.category,
        businessContext
      );
      
      setFormData({
        ...formData,
        description: enhanced.description,
        pointsCost: enhanced.suggestedPoints,
        terms: enhanced.terms,
        redemptionInstructions: enhanced.redemptionInstructions
      });
    } catch (error) {
      console.error('Error enhancing with AI:', error);
      alert('Failed to enhance with AI. Please try again.');
    } finally {
      setEnhancingWithAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (reward) {
        // Update existing reward
        const updateData = {
          ...formData,
          expiresAt: formData.expiresAt ? (formData.expiresAt instanceof Date ? formData.expiresAt : new Date(formData.expiresAt)) : undefined
        };
        const result = await updateReward(reward.id, updateData);
        if (result.success) {
          onSuccess();
        } else {
          alert('Failed to update reward: ' + result.error);
        }
      } else {
        // Create new reward
        const result = await createReward(businessId, businessName, {
          ...formData,
          businessLogo,
          claimed: 0,
          active: true
        } as any);
        
        if (result.success) {
          onSuccess();
        } else {
          alert('Failed to create reward: ' + result.error);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-[#1E0E62] flex items-center gap-2">
            {reward ? 'Edit Reward' : (
              <>
                Create New Reward
                <Sparkles className="w-6 h-6 text-[#00E5FF]" />
              </>
            )}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* AI Suggestions Panel */}
        {!reward && !showAISuggestions && (
          <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
            <button
              onClick={handleGenerateAISuggestions}
              disabled={generatingAI}
              className="w-full bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:shadow-lg transition-all disabled:opacity-50 group"
            >
              {generatingAI ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Generating AI Suggestions...
                </>
              ) : (
                <>
                  <Lightbulb className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  ✨ Generate AI Reward Ideas
                  <Sparkles className="w-5 h-5" />
                </>
              )}
            </button>
            <p className="text-sm text-gray-600 text-center mt-2">
              Let AI create personalized reward suggestions for your business
            </p>
          </div>
        )}

        {/* AI Suggestions List */}
        {showAISuggestions && (
          <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-[#1E0E62] flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-[#00E5FF]" />
                AI Suggestions
              </h3>
              {!generatingAI && (
                <button
                  onClick={() => setShowAISuggestions(false)}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Manual Entry →
                </button>
              )}
            </div>
            {generatingAI ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-[#00E5FF]"></div>
                  <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-[#00E5FF] animate-pulse" />
                </div>
                <p className="mt-4 text-gray-700 font-semibold">AI is creating personalized rewards...</p>
                <p className="text-sm text-gray-500 mt-1">Analyzing your business to suggest the perfect rewards</p>
              </div>
            ) : aiSuggestions.length > 0 ? (
              <div className="space-y-3">
              {aiSuggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectAISuggestion(suggestion)}
                  className="bg-white p-4 rounded-xl border-2 border-purple-200 hover:border-[#00E5FF] cursor-pointer transition-all hover:shadow-md"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-[#1E0E62]">{suggestion.title}</h4>
                    <span className="bg-gradient-to-r from-[#FFB86C] to-[#FF8C00] text-white px-3 py-1 rounded-lg font-bold text-sm">
                      {suggestion.suggestedPoints} pts
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-semibold">
                      {suggestion.category}
                    </span>
                    <span className="text-xs text-gray-500">Click to use this suggestion</span>
                  </div>
                </div>
              ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600">
                <p>No suggestions generated. Please try again.</p>
              </div>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title with AI Enhance */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-gray-700">Reward Title *</label>
              {formData.title && !reward && (
                <button
                  type="button"
                  onClick={handleEnhanceWithAI}
                  disabled={enhancingWithAI}
                  className="text-sm text-[#00E5FF] hover:text-[#6C4BFF] font-semibold flex items-center gap-1 disabled:opacity-50"
                >
                  <Wand2 className="w-4 h-4" />
                  {enhancingWithAI ? 'Enhancing...' : 'Enhance with AI'}
                </button>
              )}
            </div>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent"
              placeholder="e.g., 20% Off Your Next Purchase"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent"
              rows={3}
              placeholder="Describe what customers get..."
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as RewardCategory })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent"
            >
              <option value={RewardCategory.DISCOUNT}>💰 Discount</option>
              <option value={RewardCategory.FREE_ITEM}>🎁 Free Item</option>
              <option value={RewardCategory.COUPON}>🎫 Coupon</option>
              <option value={RewardCategory.GIFT_CARD}>💳 Gift Card</option>
              <option value={RewardCategory.EXCLUSIVE_ACCESS}>⭐ Exclusive Access</option>
              <option value={RewardCategory.OTHER}>📌 Other</option>
            </select>
          </div>

          {/* Points Cost & Availability */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Points Cost *</label>
              <input
                type="number"
                min="1"
                value={formData.pointsCost}
                onChange={(e) => setFormData({ ...formData, pointsCost: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {formData.unlimited ? 'Unlimited Redemptions' : 'Total Available *'}
              </label>
              {formData.unlimited ? (
                <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 flex items-center justify-center text-gray-600 font-bold">
                  ∞ Unlimited
                </div>
              ) : (
                <input
                  type="number"
                  min="1"
                  value={formData.totalAvailable}
                  onChange={(e) => setFormData({ ...formData, totalAvailable: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent"
                  required
                />
              )}
            </div>
          </div>

          {/* Unlimited Toggle */}
          <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl">
            <input
              type="checkbox"
              id="unlimited"
              checked={formData.unlimited}
              onChange={(e) => setFormData({ ...formData, unlimited: e.target.checked })}
              className="w-5 h-5 text-[#00E5FF] rounded focus:ring-2 focus:ring-[#00E5FF]"
            />
            <label htmlFor="unlimited" className="text-sm font-medium text-gray-700 cursor-pointer">
              Allow unlimited redemptions (no quantity limit)
            </label>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Image URL (optional)</label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Expiration Date */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Expiration Date (optional)</label>
            <input
              type="date"
              value={formData.expiresAt instanceof Date ? formData.expiresAt.toISOString().split('T')[0] : formData.expiresAt}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent"
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty for no expiration. Reward will automatically deactivate after this date.
            </p>
          </div>

          {/* Valid Days */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Valid Days (optional)</label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    const dayNum = index + 1;
                    const validDays = formData.validDays || [];
                    if (validDays.includes(dayNum)) {
                      setFormData({ ...formData, validDays: validDays.filter(d => d !== dayNum) });
                    } else {
                      setFormData({ ...formData, validDays: [...validDays, dayNum] });
                    }
                  }}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                    (formData.validDays || []).includes(index + 1)
                      ? 'bg-[#00E5FF] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Leave empty for all days. Select specific days when reward can be redeemed.
            </p>
          </div>

          {/* Valid Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Valid From (optional)</label>
              <input
                type="time"
                value={formData.validTimeStart}
                onChange={(e) => setFormData({ ...formData, validTimeStart: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Valid Until (optional)</label>
              <input
                type="time"
                value={formData.validTimeEnd}
                onChange={(e) => setFormData({ ...formData, validTimeEnd: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 -mt-3">
            Leave empty for all day. Set specific hours when reward can be redeemed.
          </p>

          {/* Customer Eligibility */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl space-y-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#00E5FF]" />
              Customer Eligibility (optional)
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Min Points Balance</label>
                <input
                  type="number"
                  min="0"
                  value={formData.minPointsRequired}
                  onChange={(e) => setFormData({ ...formData, minPointsRequired: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Min Purchase (€)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.minPurchaseAmount}
                  onChange={(e) => setFormData({ ...formData, minPurchaseAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent text-sm"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Min Level</label>
                <select
                  value={formData.levelRequired}
                  onChange={(e) => setFormData({ ...formData, levelRequired: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent text-sm"
                >
                  <option value="0">All Levels</option>
                  <option value="1">Level 1+</option>
                  <option value="2">Level 2+ (Premium)</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Set 0 for no restrictions. Use these to create exclusive rewards for loyal customers.
            </p>
          </div>

          {/* Voucher Code (optional - for website/online redemption) */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Voucher Code <span className="text-xs font-normal text-gray-500">(optional - for online/website redemption)</span>
            </label>
            <input
              type="text"
              value={formData.voucherCode || ''}
              onChange={(e) => setFormData({ ...formData, voucherCode: e.target.value.toUpperCase() })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent font-mono"
              placeholder="e.g., SAVE20, FREEGIFT, WELCOME10"
            />
            <p className="text-xs text-gray-500 mt-1">
              If you have an online store or website, enter a promo code customers can use. Leave empty for in-store only rewards.
            </p>
          </div>

          {/* Redemption Instructions */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Redemption Instructions</label>
            <textarea
              value={formData.redemptionInstructions}
              onChange={(e) => setFormData({ ...formData, redemptionInstructions: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent"
              rows={2}
              placeholder="e.g., Show this at checkout, Use code on website checkout, Valid in-store only"
            />
          </div>

          {/* Terms */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Terms & Conditions (optional)</label>
            <textarea
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent"
              rows={2}
              placeholder="Any restrictions or conditions..."
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-5 h-5 text-[#00E5FF] rounded focus:ring-2 focus:ring-[#00E5FF]"
            />
            <label htmlFor="active" className="text-sm font-bold text-gray-700">
              Active (visible to customers)
            </label>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Saving...' : reward ? 'Update Reward' : 'Create Reward'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RewardsManagement;
