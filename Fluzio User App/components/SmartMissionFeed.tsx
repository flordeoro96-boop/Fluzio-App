import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, MapPin, Clock, Target } from 'lucide-react';
import { getPersonalizedMissionFeed, MissionRecommendation } from '../services/personalizedFeedService';

interface SmartMissionFeedProps {
  userId: string;
  userLocation?: { latitude: number; longitude: number };
  onMissionSelect?: (missionId: string) => void;
  limit?: number;
}

/**
 * Smart Mission Feed Widget
 * Drop-in replacement for standard mission lists
 * Shows ML-powered personalized recommendations
 */
export const SmartMissionFeed: React.FC<SmartMissionFeedProps> = ({
  userId,
  userLocation,
  onMissionSelect,
  limit = 10
}) => {
  const [recommendations, setRecommendations] = useState<MissionRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [useAI, setUseAI] = useState(true);

  useEffect(() => {
    if (useAI) {
      loadPersonalizedFeed();
    }
  }, [userId, useAI]);

  const loadPersonalizedFeed = async () => {
    try {
      setLoading(true);
      const feed = await getPersonalizedMissionFeed(userId, userLocation, limit);
      setRecommendations(feed);
    } catch (error) {
      console.error('[Smart Feed] Error loading personalized feed:', error);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  if (!useAI) {
    return null; // Let parent show default list
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-gray-600">Personalizing your feed...</span>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="flex items-center justify-between mb-4 px-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Smart Recommendations</h3>
          </div>
          <button
            onClick={() => setUseAI(false)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Show all missions
          </button>
        </div>
        <p className="text-gray-500">No personalized recommendations yet. Complete more missions to improve suggestions!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Recommended For You</h3>
        </div>
        <button
          onClick={() => setUseAI(false)}
          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          Show all
        </button>
      </div>

      {/* Recommendations */}
      <div className="space-y-3">
        {recommendations.map((rec) => (
          <div
            key={rec.missionId}
            onClick={() => onMissionSelect?.(rec.missionId)}
            className={`bg-white rounded-xl shadow-sm border-2 cursor-pointer transition-all hover:shadow-md ${
              rec.priority === 'HIGH'
                ? 'border-purple-300 bg-purple-50/30'
                : 'border-gray-100'
            }`}
          >
            <div className="p-4">
              {/* Priority Badge */}
              {rec.priority === 'HIGH' && (
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium mb-2">
                  <Target className="w-3 h-3" />
                  Top Match
                </div>
              )}

              {/* Mission Info */}
              <h4 className="font-semibold text-gray-900 mb-2">
                {rec.mission.title}
              </h4>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                {rec.mission.businessName && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {rec.mission.businessName}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  ~{rec.estimatedCompletionTime} min
                </span>
                <span className="flex items-center gap-1 text-purple-600 font-semibold">
                  <TrendingUp className="w-4 h-4" />
                  {rec.mission.reward?.points || 0} pts
                </span>
              </div>

              {/* Why Recommended */}
              {rec.reasons.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1 font-medium">Why recommended:</p>
                  <p className="text-sm text-gray-700">
                    {rec.reasons.slice(0, 2).join(' • ')}
                  </p>
                </div>
              )}

              {/* Relevance Score */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      rec.relevanceScore >= 70
                        ? 'bg-green-500'
                        : rec.relevanceScore >= 50
                        ? 'bg-yellow-500'
                        : 'bg-gray-400'
                    }`}
                    style={{ width: `${rec.relevanceScore}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {rec.relevanceScore}% match
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-xs text-gray-500">
          Powered by AI • Suggestions improve as you complete missions
        </p>
      </div>
    </div>
  );
};

export default SmartMissionFeed;
