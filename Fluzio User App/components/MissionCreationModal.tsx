import React, { useState, useEffect } from 'react';
import { X, Calendar, Users, Target, Gift, Hash, AtSign, Image as ImageIcon, MapPin, Sparkles, Loader2 } from 'lucide-react';
import { 
  Mission, 
  MissionCategory, 
  RewardType, 
  ProofType, 
  MissionRequirements,
  User 
} from '../types';
import { createMission } from '../src/services/missionService';
import { generateCreativeMissionIdeas } from '../services/openaiService';
import { store } from '../services/mockStore';
import { auth, useAuth } from '../services/AuthContext';
import { useTranslation } from 'react-i18next';

interface MissionIdea {
  title: string;
  description: string;
  requirements: string[];
  suggestedPoints: number;
  postType: MissionRequirements['postType'];
  hashtags: string[];
  goal: Mission['goal'];
}

interface MissionCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  businessName: string;
  businessLogo?: string;
  businessType?: string;
  category?: MissionCategory;
  website?: string;
  subscriptionLevel?: string;
  onMissionCreated?: () => void;
}

const CATEGORIES = [
  { value: MissionCategory.COFFEE, label: 'Coffee', icon: '☕' },
  { value: MissionCategory.FOOD, label: 'Food', icon: '🍽️' },
  { value: MissionCategory.FASHION, label: 'Fashion', icon: '👗' },
  { value: MissionCategory.TECH, label: 'Tech', icon: '💻' },
  { value: MissionCategory.LIFESTYLE, label: 'Lifestyle', icon: '✨' },
  { value: MissionCategory.TRAVEL, label: 'Travel', icon: '✈️' },
  { value: MissionCategory.BEAUTY, label: 'Beauty', icon: '💄' },
  { value: MissionCategory.PETS, label: 'Pets', icon: '🐾' },
  { value: MissionCategory.OTHER, label: 'Other', icon: '📌' }
];

const POST_TYPES = [
  { value: 'STORY', label: 'Instagram Story', platform: '📸 Instagram', icon: '📱' },
  { value: 'POST', label: 'Instagram Post', platform: '📸 Instagram', icon: '🖼️' },
  { value: 'REEL', label: 'Instagram Reel', platform: '📸 Instagram', icon: '🎬' },
  { value: 'VIDEO', label: 'TikTok Video', platform: '🎵 TikTok', icon: '📹' },
  { value: 'REVIEW', label: 'Google Review', platform: '⭐ Google', icon: '⭐' },
  { value: 'CHECK_IN', label: 'Check-In', platform: '📍 In-Person', icon: '📍' },
  { value: 'ANY', label: 'Any Format', platform: '✨ Flexible', icon: '✨' }
];

const PROOF_TYPES = [
  { value: ProofType.SCREENSHOT, label: 'Screenshot' },
  { value: ProofType.LINK, label: 'Post Link' },
  { value: ProofType.PHOTO, label: 'Photo' }
];

export const MissionCreationModal: React.FC<MissionCreationModalProps> = ({ 
  isOpen, 
  onClose, 
  businessId, 
  businessName,
  businessLogo,
  businessType,
  category,
  website,
  subscriptionLevel = 'FREE',
  onMissionCreated
}) => {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Debug props
  useEffect(() => {
    if (isOpen) {
      console.log('[MissionCreationModal] Props received:', {
        businessId,
        businessName,
        businessLogo,
        category,
        website,
        subscriptionLevel
      });
    }
  }, [isOpen, businessId, businessName, businessLogo, category, website, subscriptionLevel]);
  
  // Determine max participants based on subscription level
  const maxAllowedParticipants = 
    subscriptionLevel === 'PLATINUM' ? 1000 :
    subscriptionLevel === 'GOLD' ? 500 :
    subscriptionLevel === 'SILVER' ? 100 : 50;
  const [aiIdeas, setAiIdeas] = useState<MissionIdea[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  
  // Use the subscription level passed as prop
  const currentSubscription = subscriptionLevel || 'SILVER';
  
  // Default max participants (fallback value, e.g. 5)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: MissionCategory.LIFESTYLE,
    maxParticipants: 5,
    points: 100,
    rewardType: RewardType.POINTS_ONLY,
    itemDescription: '',
    proofType: ProofType.SCREENSHOT,
    validDays: 7,
    postType: 'ANY' as MissionRequirements['postType'],
    hashtags: '',
    mentions: '',
    minFollowers: 0,
    location: '',
    locationId: '', // Business location ID for multi-location support
    goal: 'CONTENT' as Mission['goal'],
    autoApprove: false,
    fundingType: 'SUBSCRIPTION' as 'SUBSCRIPTION' | 'POINTS',
    missionType: 'SOCIAL_MEDIA' as 'SOCIAL_MEDIA' | 'GOOGLE' | 'IN_PERSON' | 'CUSTOM'
  });

  // Calculate points cost for points-funded mission
  const calculatePointsCost = () => {
    const basePoints = 50; // Base creation cost
    const rewardPoints = formData.points * formData.maxParticipants;
    const platformFee = Math.ceil(rewardPoints * 0.2); // 20% platform fee
    return basePoints + rewardPoints + platformFee;
  };

  const totalPointsCost = formData.fundingType === 'POINTS' ? calculatePointsCost() : 0;
  const userPoints = userProfile?.points || 0;
  const canAffordPoints = userPoints >= totalPointsCost;

  // Optionally update maxParticipants when subscription changes (if logic needed)

  // Automatically load AI suggestions when modal opens
  useEffect(() => {
    if (isOpen && aiIdeas.length === 0) {
      generateAiIdeas();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const generateAiIdeas = async () => {
    setLoadingAI(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('[MissionCreationModal] No authenticated user');
        setLoadingAI(false);
        return;
      }

      // Validate required fields
      if (!businessId || !businessName) {
        console.error('[MissionCreationModal] Missing required fields:', { 
          businessId, 
          businessName,
          businessLogo,
          category,
          website 
        });
        setLoadingAI(false);
        // Don't return - let the modal show without AI suggestions
        return;
      }

      const requestParams = {
        businessName: businessName,
        businessType: businessType || category || 'General Business',
        category: category || 'LIFESTYLE',
        website: website || undefined
      };

      console.log('Generating AI ideas with:', requestParams);

      const missions = await generateCreativeMissionIdeas(requestParams);
      
      if (missions && missions.length > 0) {
        // Ensure all missions have required fields
        const formattedMissions = missions.map((m: any) => ({
          ...m,
          requirements: m.requirements || m.description,
          goal: m.goal || m.title
        }));
        setAiIdeas(formattedMissions);
      } else {
        console.error('No missions returned from AI');
      }
    } catch (error) {
      console.error('Error generating AI ideas:', error);
    } finally {
      setLoadingAI(false);
    }
  };

  const applyAiIdea = (idea: MissionIdea) => {
    setFormData({
      ...formData,
      title: idea.title,
      description: idea.description,
      points: idea.suggestedPoints,
      postType: idea.postType,
      hashtags: idea.hashtags.map(h => `#${h}`).join(', '),
      goal: idea.goal
    });
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleHashtagsChange = (value: string) => {
    // Auto-add # if not present
    const tags = value.split(',').map(tag => {
      tag = tag.trim();
      return tag && !tag.startsWith('#') ? `#${tag}` : tag;
    }).join(', ');
    handleInputChange('hashtags', tags);
  };

  const handleMentionsChange = (value: string) => {
    // Auto-add @ if not present
    const mentions = value.split(',').map(mention => {
      mention = mention.trim();
      return mention && !mention.startsWith('@') ? `@${mention}` : mention;
    }).join(', ');
    handleInputChange('mentions', mentions);
  };

  const handleCreateMission = async (publish: boolean = false) => {
    setLoading(true);
    
    try {
      // Check Level 2 subscription limits before creating
      const { canCreateMission } = await import('../services/level2SubscriptionService');
      const eligibility = await canCreateMission(businessId, formData.category);
      
      if (!eligibility.allowed) {
        alert(eligibility.reason || 'Cannot create mission');
        setLoading(false);
        return;
      }
      
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + formData.validDays);

      const requirements: string[] = [];
      if (formData.postType !== 'ANY') {
        requirements.push(`Create a ${formData.postType.toLowerCase()}`);
      }
      if (formData.hashtags) {
        requirements.push(`Use hashtags: ${formData.hashtags}`);
      }
      if (formData.mentions) {
        requirements.push(`Mention: ${formData.mentions}`);
      }
      if (formData.minFollowers > 0) {
        requirements.push(`Minimum ${formData.minFollowers} followers`);
      }
      if (formData.location) {
        requirements.push(`Tag location: ${formData.location}`);
      }

      const detailedRequirements: MissionRequirements = {
        postType: formData.postType,
        hashtags: formData.hashtags ? formData.hashtags.split(',').map(h => h.trim()) : undefined,
        mentions: formData.mentions ? formData.mentions.split(',').map(m => m.trim()) : undefined,
        minFollowers: formData.minFollowers > 0 ? formData.minFollowers : undefined,
        location: formData.location || undefined
      };

      const missionData: Partial<Mission> = {
        businessId: businessId,
        businessName: businessName || 'My Business',
        businessLogo: businessLogo || '',
        title: formData.title,
        description: formData.description,
        category: formData.category,
        requirements,
        detailedRequirements,
        maxParticipants: formData.maxParticipants,
        currentParticipants: 0,
        reward: {
          type: formData.rewardType,
          points: formData.points,
          itemDescription: formData.rewardType !== RewardType.POINTS_ONLY ? formData.itemDescription : undefined
        },
        proofType: formData.proofType,
        createdAt: new Date().toISOString(),
        validUntil: validUntil.toISOString(),
        goal: formData.goal,
        triggerType: 'MANUAL',
        lifecycleStatus: publish ? 'ACTIVE' : 'DRAFT',
        approvalRequired: !formData.autoApprove,
        autoApprove: formData.autoApprove,
        isActive: publish, // Set active if publishing immediately
        isCreatorOnly: false, // Missions created by businesses are visible to all customers
        locationId: formData.locationId || undefined // Multi-location support
      };

      console.log('[MissionCreationModal] ===== CREATING MISSION =====');
      console.log('[MissionCreationModal] Props received - businessId:', businessId);
      console.log('[MissionCreationModal] Props received - businessName:', businessName);
      console.log('[MissionCreationModal] Props received - businessLogo:', businessLogo);
      console.log('[MissionCreationModal] Mission data to send:', missionData);
      console.log('[MissionCreationModal] Funding type:', formData.fundingType);

      // If using points funding, deduct points first
      if (formData.fundingType === 'POINTS') {
        if (!canAffordPoints) {
          alert(`Insufficient points. You need ${totalPointsCost} points but have ${userPoints}.`);
          setLoading(false);
          return;
        }

        // Import mission funding service
        const { fundMissionWithPoints } = await import('../services/pointsMarketplaceService');
        const fundingResult = await fundMissionWithPoints(
          businessId,
          businessName,
          formData.title,
          formData.points,
          formData.maxParticipants
        );

        if (!fundingResult.success) {
          alert(`Failed to fund mission: ${fundingResult.error}`);
          setLoading(false);
          return;
        }

        console.log('[MissionCreationModal] Mission funded with points successfully');
      }

      const result = await createMission(missionData as any);
      
      if (result.success && result.missionId) {
        // Record mission creation for Level 2 subscription tracking
        const { recordMissionCreation } = await import('../services/level2SubscriptionService');
        await recordMissionCreation(businessId, formData.category);
        
        if (onMissionCreated) {
          onMissionCreated();
        }
        
        onClose();
        resetForm();
      } else {
        alert(t('missionCreate.failedCreate') + ': ' + (result.error || t('missionCreate.unknownError')));
      }
    } catch (error) {
      console.error('Error creating mission:', error);
      alert(t('missionCreate.errorCreate'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setFormData({
      title: '',
      description: '',
      category: MissionCategory.LIFESTYLE,
      maxParticipants: 10,
      points: 100,
      rewardType: RewardType.POINTS_ONLY,
      itemDescription: '',
      proofType: ProofType.SCREENSHOT,
      validDays: 7,
      postType: 'ANY',
      hashtags: '',
      mentions: '',
      minFollowers: 0,
      location: '',
      locationId: '',
      goal: 'CONTENT',
      autoApprove: false,
      fundingType: 'SUBSCRIPTION',
      missionType: 'SOCIAL_MEDIA'
    });
  };

  const canProceedStep1 = formData.title && formData.description && formData.category;
  const canProceedStep2 = true; // Requirements are optional
  const canCreateMission = canProceedStep1 && formData.points > 0 && 
    (formData.fundingType === 'SUBSCRIPTION' || (formData.fundingType === 'POINTS' && canAffordPoints));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t('missionCreate.title')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('missionCreate.stepOf', { step })}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="flex gap-2">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s <= step ? 'bg-[#00E5FF]' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Mission Type Selector */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-900">
                  📋 Mission Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleInputChange('missionType', 'SOCIAL_MEDIA')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      formData.goal === 'CONTENT'
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">📱</span>
                      <span className="font-bold text-gray-900">Social Media</span>
                    </div>
                    <p className="text-xs text-gray-600">Instagram, TikTok posts</p>
                  </button>
                  
                  <button
                    onClick={() => handleInputChange('missionType', 'GOOGLE')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      formData.title?.toLowerCase().includes('google review') || formData.title?.toLowerCase().includes('review')
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">⭐</span>
                      <span className="font-bold text-gray-900">Google Review</span>
                    </div>
                    <p className="text-xs text-gray-600">Automated verification</p>
                  </button>
                  
                  <button
                    onClick={() => handleInputChange('missionType', 'IN_PERSON')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      formData.goal === 'TRAFFIC'
                        ? 'border-green-500 bg-green-50 shadow-md'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">📍</span>
                      <span className="font-bold text-gray-900">Check-In / Visit</span>
                    </div>
                    <p className="text-xs text-gray-600">GPS or QR code based</p>
                  </button>
                  
                  <button
                    onClick={() => handleInputChange('missionType', 'CUSTOM')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      formData.goal === 'SALES'
                        ? 'border-orange-500 bg-orange-50 shadow-md'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">✨</span>
                      <span className="font-bold text-gray-900">Custom Action</span>
                    </div>
                    <p className="text-xs text-gray-600">Manual verification</p>
                  </button>
                </div>
              </div>

              {/* AI Smart Ideas - Always visible, auto-loads */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    {t('missionCreate.aiIdeasTitle')}
                  </h3>
                  {!loadingAI && aiIdeas.length > 0 && (
                    <button
                      onClick={generateAiIdeas}
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                    >
                      <Sparkles className="w-4 h-4" />
                      {t('missionCreate.refreshIdeas')}
                    </button>
                  )}
                </div>
                
                {loadingAI ? (
                  <div className="flex flex-col items-center justify-center py-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-3" />
                    <p className="text-sm text-gray-600 font-medium">{t('missionCreate.generatingIdeas')}</p>
                    <p className="text-xs text-gray-500 mt-1">{t('missionCreate.analyzingContext')}</p>
                  </div>
                ) : aiIdeas.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto">
                    {aiIdeas.map((idea, index) => (
                      <button
                        key={index}
                        onClick={() => applyAiIdea(idea)}
                        className="text-left p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl hover:border-purple-500 hover:shadow-md transition-all group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-gray-900 group-hover:text-purple-600">
                            {idea.title}
                          </h4>
                          <span className="text-xs font-bold text-purple-600 bg-white px-2 py-1 rounded-full">
                            {idea.suggestedPoints} pts
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{idea.description}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs bg-white px-2 py-1 rounded-full text-gray-600 font-medium">
                            {idea.postType}
                          </span>
                          {idea.hashtags.slice(0, 2).map((tag, i) => (
                            <span key={i} className="text-xs bg-white px-2 py-1 rounded-full text-purple-600 font-medium">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-2xl border border-gray-200">
                    <p className="text-sm text-gray-500">{t('missionCreate.noAiSuggestions')}</p>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500 font-medium">{t('missionCreate.orCreateManually')}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('missionCreate.titleLabel')}
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder={t('missionCreate.titlePlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('missionCreate.descriptionLabel')}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder={t('missionCreate.descriptionPlaceholder')}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">{formData.description.length}/500</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('missionCreate.categoryLabel')}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      onClick={() => handleInputChange('category', cat.value)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.category === cat.value
                          ? 'border-[#00E5FF] bg-pink-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{cat.icon}</div>
                      <div className="text-sm font-medium">{t(`missionCreate.categories.${cat.value.toLowerCase()}`)}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('missionCreate.goalLabel')}
                </label>
                <select
                  value={formData.goal}
                  onChange={(e) => handleInputChange('goal', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent"
                >
                  <option value="CONTENT">{t('missionCreate.goals.content')}</option>
                  <option value="GROWTH">{t('missionCreate.goals.growth')}</option>
                  <option value="TRAFFIC">{t('missionCreate.goals.traffic')}</option>
                  <option value="SALES">{t('missionCreate.goals.sales')}</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Requirements */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('missionCreate.postTypeLabel')}
                </label>
                
                {/* Instagram Posts */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">📸 Instagram</p>
                  <div className="grid grid-cols-3 gap-2">
                    {POST_TYPES.filter(t => t.platform.includes('Instagram')).map(type => (
                      <button
                        key={type.value}
                        onClick={() => handleInputChange('postType', type.value)}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          formData.postType === type.value
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-xl mb-1">{type.icon}</div>
                        <div className="text-xs font-medium">{type.label.replace('Instagram ', '')}</div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* TikTok */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">🎵 TikTok</p>
                  <div className="grid grid-cols-3 gap-2">
                    {POST_TYPES.filter(t => t.platform.includes('TikTok')).map(type => (
                      <button
                        key={type.value}
                        onClick={() => handleInputChange('postType', type.value)}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          formData.postType === type.value
                            ? 'border-pink-500 bg-pink-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-xl mb-1">{type.icon}</div>
                        <div className="text-xs font-medium">{type.label.replace('TikTok ', '')}</div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Google & In-Person */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">⭐ Other Actions</p>
                  <div className="grid grid-cols-3 gap-2">
                    {POST_TYPES.filter(t => t.platform.includes('Google') || t.platform.includes('In-Person')).map(type => (
                      <button
                        key={type.value}
                        onClick={() => handleInputChange('postType', type.value)}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          formData.postType === type.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-xl mb-1">{type.icon}</div>
                        <div className="text-xs font-medium">{type.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Flexible */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">✨ Flexible</p>
                  <div className="grid grid-cols-3 gap-2">
                    {POST_TYPES.filter(t => t.platform.includes('Flexible')).map(type => (
                      <button
                        key={type.value}
                        onClick={() => handleInputChange('postType', type.value)}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          formData.postType === type.value
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-xl mb-1">{type.icon}</div>
                        <div className="text-xs font-medium">{type.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Hash size={16} className="inline mr-1" />
                  {t('missionCreate.requiredHashtags')}
                </label>
                <input
                  type="text"
                  value={formData.hashtags}
                  onChange={(e) => handleHashtagsChange(e.target.value)}
                  placeholder={t('missionCreate.hashtagsPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">{t('missionCreate.separateWithCommas')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <AtSign size={16} className="inline mr-1" />
                  {t('missionCreate.requiredMentions')}
                </label>
                <input
                  type="text"
                  value={formData.mentions}
                  onChange={(e) => handleMentionsChange(e.target.value)}
                  placeholder={t('missionCreate.mentionsPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">{t('missionCreate.separateWithCommas')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin size={16} className="inline mr-1" />
                  {t('missionCreate.locationTag')}
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder={t('missionCreate.locationPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent"
                />
              </div>

              {/* Location Selector for Multi-Location Businesses */}
              {userProfile?.locations && userProfile.locations.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Business Location
                  </label>
                  <select
                    value={formData.locationId}
                    onChange={(e) => {
                      handleInputChange('locationId', e.target.value);
                      // Auto-fill location name if selected
                      const selectedLocation = userProfile.locations?.find(loc => loc.id === e.target.value);
                      if (selectedLocation && !formData.location) {
                        handleInputChange('location', `${selectedLocation.name} - ${selectedLocation.city}`);
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent"
                  >
                    <option value="">All Locations</option>
                    {userProfile.locations.filter(loc => loc.isActive).map(location => (
                      <option key={location.id} value={location.id}>
                        {location.name} - {location.city} {location.isPrimary ? '(Primary)' : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Select a specific location for this mission, or leave as "All Locations" to make it available across all your locations.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('missionCreate.minFollowers')}
                </label>
                <input
                  type="number"
                  value={formData.minFollowers}
                  onChange={(e) => handleInputChange('minFollowers', parseInt(e.target.value) || 0)}
                  placeholder={t('missionCreate.noMinimumPlaceholder')}
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Step 3: Rewards & Settings */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Funding Type Selector */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
                <label className="block text-sm font-bold text-gray-900 mb-4">
                  💰 Mission Funding
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleInputChange('fundingType', 'SUBSCRIPTION')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.fundingType === 'SUBSCRIPTION'
                        ? 'border-purple-600 bg-white shadow-lg'
                        : 'border-purple-200 bg-white/50 hover:border-purple-400'
                    }`}
                  >
                    <div className="text-2xl mb-2">💳</div>
                    <div className="font-bold text-gray-900 mb-1">Subscription</div>
                    <div className="text-xs text-gray-600">Use your active plan</div>
                  </button>
                  <button
                    onClick={() => handleInputChange('fundingType', 'POINTS')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.fundingType === 'POINTS'
                        ? 'border-purple-600 bg-white shadow-lg'
                        : 'border-purple-200 bg-white/50 hover:border-purple-400'
                    }`}
                  >
                    <div className="text-2xl mb-2">🪙</div>
                    <div className="font-bold text-gray-900 mb-1">Points</div>
                    <div className="text-xs text-gray-600">Spend {totalPointsCost} points</div>
                  </button>
                </div>
                {formData.fundingType === 'POINTS' && (
                  <div className="mt-4 p-4 bg-white rounded-xl border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Your Points Balance</span>
                      <span className="text-lg font-bold text-purple-600">{userPoints.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Cost Breakdown:</span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-600 mb-3">
                      <div className="flex justify-between">
                        <span>• Base creation fee</span>
                        <span>50 pts</span>
                      </div>
                      <div className="flex justify-between">
                        <span>• Reward pool ({formData.points} × {formData.maxParticipants})</span>
                        <span>{formData.points * formData.maxParticipants} pts</span>
                      </div>
                      <div className="flex justify-between">
                        <span>• Platform fee (20%)</span>
                        <span>{Math.ceil(formData.points * formData.maxParticipants * 0.2)} pts</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <span className="font-bold text-gray-900">Total Cost</span>
                      <span className="text-lg font-bold text-purple-600">{totalPointsCost.toLocaleString()} pts</span>
                    </div>
                    {!canAffordPoints && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs text-red-700 font-medium">
                          ⚠️ Insufficient points. You need {(totalPointsCost - userPoints).toLocaleString()} more points.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Gift size={16} className="inline mr-1" />
                  {t('missionCreate.rewardPoints')}
                </label>
                <input
                  type="number"
                  value={formData.points}
                  onChange={(e) => handleInputChange('points', parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('missionCreate.rewardTypeLabel')}
                </label>
                <select
                  value={formData.rewardType}
                  onChange={(e) => handleInputChange('rewardType', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent"
                >
                  <option value={RewardType.POINTS_ONLY}>{t('missionCreate.rewardTypes.pointsOnly')}</option>
                  <option value={RewardType.POINTS_AND_ITEM}>{t('missionCreate.rewardTypes.pointsItem')}</option>
                  <option value={RewardType.POINTS_AND_DISCOUNT}>{t('missionCreate.rewardTypes.pointsDiscount')}</option>
                </select>
              </div>

              {formData.rewardType !== RewardType.POINTS_ONLY && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('missionCreate.itemDiscountDesc')}
                  </label>
                  <input
                    type="text"
                    value={formData.itemDescription}
                    onChange={(e) => handleInputChange('itemDescription', e.target.value)}
                    placeholder={t('missionCreate.itemDiscountPlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users size={16} className="inline mr-1" />
                  {t('missionCreate.maxParticipants')}
                </label>
                <input
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    handleInputChange('maxParticipants', Math.min(value, maxAllowedParticipants));
                  }}
                  max={maxAllowedParticipants}
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent"
                />
                <p className="text-xs text-[#8F8FA3] mt-1">
                  {t('missionCreate.planLimit', { plan: subscriptionLevel, count: maxAllowedParticipants })}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar size={16} className="inline mr-1" />
                  {t('missionCreate.validDays')}
                </label>
                <input
                  type="number"
                  value={formData.validDays}
                  onChange={(e) => handleInputChange('validDays', parseInt(e.target.value) || 1)}
                  min="1"
                  max="90"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('missionCreate.proofTypeLabel')}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {PROOF_TYPES.map(proof => (
                    <button
                      key={proof.value}
                      onClick={() => handleInputChange('proofType', proof.value)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.proofType === proof.value
                          ? 'border-[#00E5FF] bg-pink-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-sm font-medium">{t(`missionCreate.proofTypes.${proof.value.toLowerCase()}`)}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="autoApprove"
                  checked={formData.autoApprove}
                  onChange={(e) => handleInputChange('autoApprove', e.target.checked)}
                  className="w-5 h-5 text-[#00E5FF] rounded focus:ring-[#00E5FF]"
                />
                <label htmlFor="autoApprove" className="text-sm text-gray-700">
                  <strong>{t('missionCreate.autoApprove')}</strong>
                  <p className="text-xs text-gray-500">{t('missionCreate.autoApproveHint')}</p>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {t('common.back')}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {t('common.cancel')}
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !canProceedStep1}
              className="px-6 py-3 bg-[#00E5FF] text-white rounded-lg hover:bg-[#D91D6A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t('common.continue')}
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => handleCreateMission(false)}
                disabled={!canCreateMission || loading}
                className="px-6 py-3 border-2 border-[#00E5FF] text-[#00E5FF] rounded-lg hover:bg-pink-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('missionCreate.saveDraft')}
              </button>
              <button
                onClick={() => handleCreateMission(true)}
                disabled={!canCreateMission || loading}
                className="px-6 py-3 bg-[#00E5FF] text-white rounded-lg hover:bg-[#D91D6A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? t('missionCreate.creating') : t('missionCreate.createAndPublish')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
