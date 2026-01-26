import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, Target, Award } from 'lucide-react';
import { getMissionState, getMissionUrgency } from '../services/missionStateService';
import { Mission } from '../types';

interface CustomerLevelInsightsProps {
  missions: Mission[];
  businessId: string;
}

interface MissionWithState {
  mission: Mission;
  state?: {
    state: string;
    badge: string;
    message: string;
    priority: number;
  };
  urgency?: {
    level: 'none' | 'low' | 'medium' | 'high' | 'critical';
    indicator: string;
    message: string;
  };
}

export const CustomerLevelInsights: React.FC<CustomerLevelInsightsProps> = ({ missions, businessId }) => {
  const [missionsWithStates, setMissionsWithStates] = useState<MissionWithState[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMissionStates = async () => {
      setLoading(true);
      try {
        const enrichedMissions: MissionWithState[] = [];

        for (const mission of missions) {
          // For business owners viewing their missions, we pass businessId as userId
          // to get mission state (completed this month check will be skipped for owners)
          const state = await getMissionState(mission.id, businessId);
          const urgency = getMissionUrgency(mission);
          
          enrichedMissions.push({
            mission,
            state: state || undefined,
            urgency
          });
        }

        setMissionsWithStates(enrichedMissions);
      } catch (error) {
        console.error('[CustomerLevelInsights] Error loading mission states:', error);
      } finally {
        setLoading(false);
      }
    };

    if (missions.length > 0) {
      loadMissionStates();
    } else {
      setLoading(false);
    }
  }, [missions, businessId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#6C4BFF]"></div>
        </div>
      </div>
    );
  }

  if (missions.length === 0) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-100">
        <div className="text-center">
          <div className="text-4xl mb-3">🎯</div>
          <h3 className="font-bold text-[#1E0E62] mb-2">Create Your First Mission</h3>
          <p className="text-sm text-gray-600">
            Start engaging with customers by creating missions. Track performance and customer engagement in real-time.
          </p>
        </div>
      </div>
    );
  }

  // Count missions by state
  const trendingCount = missionsWithStates.filter(m => m.state?.state === 'TRENDING').length;
  const endingSoonCount = missionsWithStates.filter(m => m.urgency?.level === 'critical' || m.urgency?.level === 'high').length;
  const staffPickCount = missionsWithStates.filter(m => m.state?.state === 'STAFF_PICK').length;
  const newCount = missionsWithStates.filter(m => m.state?.state === 'NEW').length;

  return (
    <div className="space-y-4">
      {/* Overview Stats */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-100">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-[#6C4BFF]" />
          <h3 className="font-bold text-[#1E0E62]">Mission Performance</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Total Active */}
          <div className="bg-white rounded-xl p-4 border border-white shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Target className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-[#1E0E62]">{missions.length}</span>
            </div>
            <p className="text-xs text-gray-600 font-medium">Active Missions</p>
          </div>

          {/* Trending */}
          {trendingCount > 0 && (
            <div className="bg-white rounded-xl p-4 border border-white shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🔥</span>
                <span className="text-2xl font-bold text-orange-600">{trendingCount}</span>
              </div>
              <p className="text-xs text-gray-600 font-medium">Trending Now</p>
            </div>
          )}

          {/* Ending Soon */}
          {endingSoonCount > 0 && (
            <div className="bg-white rounded-xl p-4 border border-white shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">⏰</span>
                <span className="text-2xl font-bold text-red-600">{endingSoonCount}</span>
              </div>
              <p className="text-xs text-gray-600 font-medium">Ending Soon</p>
            </div>
          )}

          {/* Staff Pick */}
          {staffPickCount > 0 && (
            <div className="bg-white rounded-xl p-4 border border-white shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">⭐</span>
                <span className="text-2xl font-bold text-amber-600">{staffPickCount}</span>
              </div>
              <p className="text-xs text-gray-600 font-medium">Staff Picks</p>
            </div>
          )}

          {/* New Missions */}
          {newCount > 0 && (
            <div className="bg-white rounded-xl p-4 border border-white shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">✨</span>
                <span className="text-2xl font-bold text-purple-600">{newCount}</span>
              </div>
              <p className="text-xs text-gray-600 font-medium">New Missions</p>
            </div>
          )}
        </div>
      </div>

      {/* Mission States List */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-[#6C4BFF]" />
          <h3 className="font-bold text-[#1E0E62]">How Customers See Your Missions</h3>
        </div>

        <div className="space-y-3">
          {missionsWithStates
            .sort((a, b) => (b.state?.priority || 0) - (a.state?.priority || 0))
            .map(({ mission, state, urgency }) => (
              <div
                key={mission.id}
                className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-purple-200 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-[#1E0E62] text-sm truncate mb-1">
                      {mission.title}
                    </h4>
                    
                    {/* State Badge */}
                    {state && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{state.badge}</span>
                        <span className="text-xs font-semibold text-gray-700">
                          {state.message}
                        </span>
                      </div>
                    )}

                    {/* Urgency Indicator */}
                    {urgency && urgency.level !== 'none' && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-base">{urgency.indicator}</span>
                        <span className={`text-xs font-medium ${
                          urgency.level === 'critical' ? 'text-red-600' :
                          urgency.level === 'high' ? 'text-orange-600' :
                          urgency.level === 'medium' ? 'text-amber-600' :
                          'text-gray-600'
                        }`}>
                          {urgency.message}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status Indicator */}
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    mission.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {mission.isActive ? 'Active' : 'Paused'}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 text-sm mb-1">Customer-Friendly Display</h4>
            <p className="text-xs text-blue-700 leading-relaxed">
              Customers see your missions with badges and urgency indicators, not raw numbers. 
              This makes your missions more appealing and drives engagement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
