/**
 * Campaign Templates Component
 * Browse and select automated growth campaigns
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  MapPin, 
  Zap, 
  Globe, 
  Calendar,
  Target,
  DollarSign,
  Users,
  Eye,
  Activity,
  CheckCircle,
  Lock,
  ArrowRight
} from 'lucide-react';

interface CampaignTemplatesProps {
  userId: string;
  userLevel: number;
  userTier: 'BASIC' | 'SILVER' | 'GOLD' | 'PLATINUM';
  availableCredits: number;
  onStartCampaign: (type: string, settings?: any) => void;
}

const TEMPLATES = {
  FOLLOWER_GROWTH: {
    id: 'follower-growth-7day',
    type: 'FOLLOWER_GROWTH',
    name: 'Rapid Follower Growth',
    description: 'Gain 1,000 targeted followers in 7 days',
    icon: TrendingUp,
    color: 'from-green-400 to-emerald-500',
    
    minLevel: 4,
    minTier: 'GOLD',
    
    durationDays: 7,
    dailyCredits: 700,
    totalCredits: 4900,
    
    goals: {
      followers: 1000,
      engagement: 500,
      visibility: 10000
    },
    
    features: [
      'Automated follow/unfollow',
      'Smart targeting',
      'Daily content boosting',
      'Engagement automation',
      'Real-time analytics',
      'A/B testing'
    ]
  },
  
  CITY_LAUNCH: {
    id: 'city-launch-14day',
    type: 'CITY_LAUNCH',
    name: 'City Launch',
    description: 'Dominate your local market in 14 days',
    icon: MapPin,
    color: 'from-blue-400 to-cyan-500',
    
    minLevel: 4,
    minTier: 'GOLD',
    
    durationDays: 14,
    dailyCredits: 500,
    totalCredits: 7000,
    
    goals: {
      followers: 500,
      engagement: 1000,
      visibility: 20000
    },
    
    features: [
      'Geo-targeted promotions',
      'Local partnerships',
      'Event notifications',
      'Featured in local search',
      'Meetup promotion',
      'Community engagement'
    ]
  },
  
  INFLUENCER_BURST: {
    id: 'influencer-burst-3day',
    type: 'INFLUENCER_BURST',
    name: 'Influencer Burst',
    description: 'Target high-value influencers in 3 days',
    icon: Zap,
    color: 'from-orange-400 to-red-500',
    
    minLevel: 4,
    minTier: 'PLATINUM',
    
    durationDays: 3,
    dailyCredits: 1000,
    totalCredits: 3000,
    
    goals: {
      followers: 300,
      engagement: 800,
      visibility: 15000
    },
    
    features: [
      'VIP influencer targeting',
      'Premium content placement',
      'Priority messaging',
      'Executive outreach',
      'Strategic partnerships',
      'Media mentions'
    ]
  },
  
  CROSS_PLATFORM: {
    id: 'cross-platform-30day',
    type: 'CROSS_PLATFORM',
    name: 'Cross-Platform',
    description: 'Expand across platforms in 30 days',
    icon: Globe,
    color: 'from-purple-400 to-pink-500',
    
    minLevel: 5,
    minTier: 'GOLD',
    
    durationDays: 30,
    dailyCredits: 300,
    totalCredits: 9000,
    
    goals: {
      followers: 2000,
      engagement: 3000,
      visibility: 50000
    },
    
    features: [
      'Multi-platform sync',
      'Cross-posting automation',
      'Unified analytics',
      'Platform optimization',
      'Audience overlap analysis',
      'Content repurposing'
    ]
  },
  
  WEEKLY_GROWTH: {
    id: 'weekly-growth-ongoing',
    type: 'WEEKLY_GROWTH',
    name: 'Steady Weekly Growth',
    description: 'Consistent growth on autopilot',
    icon: Calendar,
    color: 'from-indigo-400 to-purple-600',
    
    minLevel: 4,
    minTier: 'PLATINUM',
    
    durationDays: 365,
    dailyCredits: 200,
    totalCredits: 73000,
    
    goals: {
      followers: 100, // Per week
      engagement: 150,
      visibility: 2000
    },
    
    features: [
      'Fully automated',
      'Adaptive targeting',
      'Auto-adjusting performance',
      'Seasonal optimization',
      'Continuous A/B testing',
      'Weekly reports'
    ]
  }
};

export const CampaignTemplates: React.FC<CampaignTemplatesProps> = ({
  userId,
  userLevel,
  userTier,
  availableCredits,
  onStartCampaign
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const checkEligibility = (template: any) => {
    if (userLevel < template.minLevel) {
      return { allowed: false, reason: `Requires Level ${template.minLevel}+` };
    }
    
    if (template.minTier === 'PLATINUM' && userTier !== 'PLATINUM') {
      return { allowed: false, reason: 'Requires Platinum tier' };
    }
    
    if (template.minTier === 'GOLD' && userTier !== 'GOLD' && userTier !== 'PLATINUM') {
      return { allowed: false, reason: 'Requires Gold tier' };
    }
    
    const minCredits = template.dailyCredits * 3;
    if (availableCredits < minCredits) {
      return { allowed: false, reason: `Need ${minCredits} credits minimum` };
    }
    
    return { allowed: true };
  };

  const handleStartCampaign = (type: string) => {
    const template = Object.values(TEMPLATES).find(t => t.type === type);
    if (!template) return;
    
    const eligibility = checkEligibility(template);
    if (!eligibility.allowed) {
      alert(`Cannot start campaign: ${eligibility.reason}`);
      return;
    }
    
    if (confirm(`Start ${template.name}?\n\nThis will use ${template.dailyCredits} credits daily for ${template.durationDays} days.\nTotal: ${template.totalCredits} credits`)) {
      onStartCampaign(type);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1E0E62] mb-2">Automated Growth Campaigns</h1>
        <p className="text-[#8F8FA3]">
          Let AI handle your growth while you focus on your business
        </p>
      </div>

      {/* Available Credits Banner */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Available Growth Credits</p>
            <h2 className="text-4xl font-bold">{availableCredits.toLocaleString()}</h2>
          </div>
          <Zap className="w-12 h-12" />
        </div>
      </div>

      {/* Campaign Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.values(TEMPLATES).map((template) => {
          const Icon = template.icon;
          const eligibility = checkEligibility(template);
          const isLocked = !eligibility.allowed;
          
          return (
            <div 
              key={template.type}
              className={`relative rounded-2xl border-2 p-6 transition-all ${
                isLocked 
                  ? 'border-gray-200 bg-gray-50 opacity-60' 
                  : 'border-gray-200 bg-white hover:border-purple-500 hover:shadow-lg cursor-pointer'
              }`}
              onClick={() => !isLocked && setSelectedTemplate(template.type)}
            >
              {isLocked && (
                <div className="absolute top-4 right-4">
                  <Lock className="w-6 h-6 text-gray-400" />
                </div>
              )}

              {/* Header */}
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${template.color} flex items-center justify-center mb-4`}>
                <Icon className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-xl font-bold text-[#1E0E62] mb-2">{template.name}</h3>
              <p className="text-sm text-[#8F8FA3] mb-4">{template.description}</p>

              {/* Stats */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Duration
                  </span>
                  <span className="font-semibold text-[#1E0E62]">
                    {template.durationDays} days
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    Daily Credits
                  </span>
                  <span className="font-semibold text-[#1E0E62]">
                    {template.dailyCredits}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    Goal
                  </span>
                  <span className="font-semibold text-[#1E0E62]">
                    +{template.goals.followers} followers
                  </span>
                </div>
              </div>

              {/* Features */}
              <div className="mb-6">
                <p className="text-xs font-semibold text-gray-600 mb-2">Key Features:</p>
                <ul className="space-y-1">
                  {template.features.slice(0, 3).map((feature, idx) => (
                    <li key={idx} className="text-xs text-gray-700 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              {isLocked ? (
                <div className="text-center py-3 bg-gray-100 rounded-xl text-sm text-gray-600">
                  {eligibility.reason}
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartCampaign(template.type);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2"
                >
                  Start Campaign
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {/* Requirements Badge */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                <span>L{template.minLevel}+</span>
                <span>•</span>
                <span>{template.minTier}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ROI Calculator */}
      <div className="mt-12 bg-white rounded-2xl border-2 border-gray-200 p-8">
        <h3 className="text-2xl font-bold text-[#1E0E62] mb-6 flex items-center gap-2">
          <Target className="w-6 h-6" />
          Campaign ROI Calculator
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
            <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-1">Avg Cost per Follower</p>
            <p className="text-3xl font-bold text-green-600">€0.29</p>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-1">Avg Follower Value</p>
            <p className="text-3xl font-bold text-blue-600">€5.00</p>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
            <Activity className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-1">Expected ROI</p>
            <p className="text-3xl font-bold text-purple-600">+1,624%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignTemplates;
