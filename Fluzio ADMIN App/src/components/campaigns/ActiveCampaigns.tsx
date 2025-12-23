/**
 * Active Campaigns Component
 * Manage running campaigns with real-time progress
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp,
  MapPin,
  Zap,
  Globe,
  Calendar,
  Pause,
  Play,
  X,
  Users,
  Eye,
  Activity,
  ChevronDown,
  ChevronUp,
  Loader
} from 'lucide-react';

interface Campaign {
  id: string;
  templateType: string;
  status: string;
  startDate: any;
  endDate: any;
  daysElapsed: number;
  daysRemaining: number;
  creditsUsed: number;
  creditsRemaining: number;
  results: {
    followersGained: number;
    engagementGenerated: number;
    profileViews: number;
    connectionsEstablished: number;
  };
  dailyLogs?: any[];
}

interface ActiveCampaignsProps {
  userId: string;
}

const CAMPAIGN_INFO = {
  FOLLOWER_GROWTH: { name: 'Rapid Follower Growth', icon: TrendingUp, color: 'green' },
  CITY_LAUNCH: { name: 'City Launch', icon: MapPin, color: 'blue' },
  INFLUENCER_BURST: { name: 'Influencer Burst', icon: Zap, color: 'orange' },
  CROSS_PLATFORM: { name: 'Cross-Platform', icon: Globe, color: 'purple' },
  WEEKLY_GROWTH: { name: 'Steady Weekly Growth', icon: Calendar, color: 'indigo' }
};

export const ActiveCampaigns: React.FC<ActiveCampaignsProps> = ({ userId }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadCampaigns();
    const interval = setInterval(loadCampaigns, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [userId]);

  const loadCampaigns = async () => {
    try {
      const response = await fetch(
        'https://us-central1-fluzio-13af2.cloudfunctions.net/getCampaignProgress',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        }
      );

      const data = await response.json();
      if (data.success) {
        setCampaigns(data.campaigns || []);
      }
    } catch (error) {
      console.error('[Campaigns] Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCampaign = async (campaignId: string, action: 'pause' | 'resume') => {
    setActionLoading(campaignId);
    
    try {
      const response = await fetch(
        'https://us-central1-fluzio-13af2.cloudfunctions.net/toggleCampaign',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaignId, action })
        }
      );

      const data = await response.json();
      if (data.success) {
        loadCampaigns(); // Refresh list
      } else {
        alert(data.error || 'Action failed');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE');
  const pausedCampaigns = campaigns.filter(c => c.status === 'PAUSED' || c.status === 'INSUFFICIENT_CREDITS');
  const completedCampaigns = campaigns.filter(c => c.status === 'COMPLETED');

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1E0E62] mb-2">Active Campaigns</h1>
        <p className="text-[#8F8FA3]">
          Monitor and manage your automated growth campaigns
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Active</span>
            <Play className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-[#1E0E62]">{activeCampaigns.length}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Followers</span>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-[#1E0E62]">
            +{campaigns.reduce((sum, c) => sum + (c.results?.followersGained || 0), 0)}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Profile Views</span>
            <Eye className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-[#1E0E62]">
            {campaigns.reduce((sum, c) => sum + (c.results?.profileViews || 0), 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Engagement</span>
            <Activity className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-[#1E0E62]">
            {campaigns.reduce((sum, c) => sum + (c.results?.engagementGenerated || 0), 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Active Campaigns */}
      {activeCampaigns.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-[#1E0E62] mb-4 flex items-center gap-2">
            <Play className="w-5 h-5 text-green-600" />
            Running Campaigns
          </h2>
          
          <div className="space-y-4">
            {activeCampaigns.map((campaign) => (
              <CampaignCard 
                key={campaign.id} 
                campaign={campaign}
                expanded={expandedCampaign === campaign.id}
                onToggleExpand={() => setExpandedCampaign(
                  expandedCampaign === campaign.id ? null : campaign.id
                )}
                onToggleCampaign={toggleCampaign}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        </div>
      )}

      {/* Paused Campaigns */}
      {pausedCampaigns.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-[#1E0E62] mb-4 flex items-center gap-2">
            <Pause className="w-5 h-5 text-orange-600" />
            Paused Campaigns
          </h2>
          
          <div className="space-y-4">
            {pausedCampaigns.map((campaign) => (
              <CampaignCard 
                key={campaign.id} 
                campaign={campaign}
                expanded={expandedCampaign === campaign.id}
                onToggleExpand={() => setExpandedCampaign(
                  expandedCampaign === campaign.id ? null : campaign.id
                )}
                onToggleCampaign={toggleCampaign}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Campaigns */}
      {completedCampaigns.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-[#1E0E62] mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            Completed Campaigns
          </h2>
          
          <div className="space-y-4">
            {completedCampaigns.map((campaign) => (
              <CampaignCard 
                key={campaign.id} 
                campaign={campaign}
                expanded={expandedCampaign === campaign.id}
                onToggleExpand={() => setExpandedCampaign(
                  expandedCampaign === campaign.id ? null : campaign.id
                )}
                onToggleCampaign={toggleCampaign}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        </div>
      )}

      {campaigns.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No campaigns yet</p>
          <p className="text-gray-400 text-sm">Start your first automated growth campaign</p>
        </div>
      )}
    </div>
  );
};

const CampaignCard: React.FC<{
  campaign: Campaign;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleCampaign: (id: string, action: 'pause' | 'resume') => void;
  actionLoading: string | null;
}> = ({ campaign, expanded, onToggleExpand, onToggleCampaign, actionLoading }) => {
  const info = CAMPAIGN_INFO[campaign.templateType as keyof typeof CAMPAIGN_INFO];
  const Icon = info?.icon || Calendar;
  
  const progressPercent = campaign.daysElapsed > 0 
    ? Math.min(100, (campaign.daysElapsed / (campaign.daysElapsed + campaign.daysRemaining)) * 100)
    : 0;

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${info?.color}-400 to-${info?.color}-500 flex items-center justify-center`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1E0E62]">{info?.name || campaign.templateType}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                  campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                  campaign.status === 'PAUSED' ? 'bg-orange-100 text-orange-700' :
                  campaign.status === 'INSUFFICIENT_CREDITS' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {campaign.status}
                </span>
                <span className="text-sm text-gray-500">
                  Day {campaign.daysElapsed} of {campaign.daysElapsed + campaign.daysRemaining}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {campaign.status === 'ACTIVE' && (
              <button
                onClick={() => onToggleCampaign(campaign.id, 'pause')}
                disabled={actionLoading === campaign.id}
                className="p-2 rounded-lg border-2 border-gray-200 hover:border-orange-500 transition-colors disabled:opacity-50"
              >
                {actionLoading === campaign.id ? (
                  <Loader className="w-5 h-5 animate-spin text-gray-400" />
                ) : (
                  <Pause className="w-5 h-5 text-orange-600" />
                )}
              </button>
            )}
            
            {(campaign.status === 'PAUSED' || campaign.status === 'INSUFFICIENT_CREDITS') && (
              <button
                onClick={() => onToggleCampaign(campaign.id, 'resume')}
                disabled={actionLoading === campaign.id}
                className="p-2 rounded-lg border-2 border-gray-200 hover:border-green-500 transition-colors disabled:opacity-50"
              >
                {actionLoading === campaign.id ? (
                  <Loader className="w-5 h-5 animate-spin text-gray-400" />
                ) : (
                  <Play className="w-5 h-5 text-green-600" />
                )}
              </button>
            )}
            
            <button
              onClick={onToggleExpand}
              className="p-2 rounded-lg border-2 border-gray-200 hover:border-purple-500 transition-colors"
            >
              {expanded ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Campaign Progress</span>
            <span className="font-semibold text-[#1E0E62]">{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r from-${info?.color}-400 to-${info?.color}-500 transition-all duration-500`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-[#1E0E62]">+{campaign.results.followersGained}</p>
            <p className="text-xs text-gray-500">Followers</p>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <Eye className="w-5 h-5 text-purple-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-[#1E0E62]">{campaign.results.profileViews.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Views</p>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <Activity className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-[#1E0E62]">{campaign.results.engagementGenerated}</p>
            <p className="text-xs text-gray-500">Engagement</p>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <Zap className="w-5 h-5 text-orange-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-[#1E0E62]">{campaign.creditsUsed}</p>
            <p className="text-xs text-gray-500">Credits Used</p>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t-2 border-gray-100 p-6 bg-gray-50">
          <h4 className="font-semibold text-[#1E0E62] mb-4">Daily Performance</h4>
          
          {campaign.dailyLogs && campaign.dailyLogs.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {campaign.dailyLogs.slice().reverse().slice(0, 7).map((log, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <span className="text-sm text-gray-600">
                    Day {campaign.daysElapsed - idx}
                  </span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-600 font-semibold">+{log.followersGained} followers</span>
                    <span className="text-gray-500">{log.profileViews} views</span>
                    <span className="text-orange-600">-{log.creditsSpent} credits</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No daily logs yet</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ActiveCampaigns;
