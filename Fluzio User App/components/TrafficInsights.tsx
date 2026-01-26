import React, { useState, useEffect } from 'react';
import { 
  TrendingDown, 
  TrendingUp, 
  Clock, 
  Calendar, 
  Lightbulb, 
  Users,
  Zap,
  Target
} from 'lucide-react';
import { 
  analyzeBusinessTraffic, 
  getOptimalTimeSuggestions, 
  formatHour,
  OptimalTimesSuggestion,
  BusinessTrafficPattern
} from '../services/businessIntelligenceService';

interface TrafficInsightsProps {
  businessId: string;
  type: 'REWARD' | 'MEETUP' | 'MISSION';
  onSuggestionSelect?: (suggestion: OptimalTimesSuggestion) => void;
}

export const TrafficInsights: React.FC<TrafficInsightsProps> = ({ 
  businessId, 
  type,
  onSuggestionSelect 
}) => {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<BusinessTrafficPattern | null>(null);
  const [suggestions, setSuggestions] = useState<OptimalTimesSuggestion[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadAnalysis();
  }, [businessId, type]);

  const loadAnalysis = async () => {
    setLoading(true);
    try {
      const [trafficData, suggestionData] = await Promise.all([
        analyzeBusinessTraffic(businessId),
        getOptimalTimeSuggestions(businessId, type)
      ]);
      
      setAnalysis(trafficData);
      setSuggestions(suggestionData);
    } catch (error) {
      console.error('[TrafficInsights] Error loading analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
          <span className="text-sm text-blue-600 font-medium">Analyzing traffic patterns...</span>
        </div>
      </div>
    );
  }

  if (!analysis || analysis.totalCheckIns === 0) {
    return (
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-700 mb-1">Traffic Insights Coming Soon</h4>
            <p className="text-sm text-gray-600">
              As customers check in to your business, we'll analyze patterns and suggest optimal times 
              for {type === 'REWARD' ? 'promotions' : type === 'MEETUP' ? 'meetups' : 'missions'} to boost traffic during slow periods.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const typeConfig = {
    REWARD: { icon: Target, color: 'green', label: 'Promotion' },
    MEETUP: { icon: Users, color: 'purple', label: 'Meetup' },
    MISSION: { icon: Zap, color: 'blue', label: 'Mission' }
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className="space-y-3">
      {/* Summary Card */}
      <div className={`bg-gradient-to-r from-${config.color}-50 to-${config.color}-100 border border-${config.color}-200 rounded-xl p-4`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Icon className={`w-5 h-5 text-${config.color}-600 mt-0.5`} />
            <div className="flex-1">
              <h4 className={`font-semibold text-${config.color}-900 mb-1`}>
                📊 Traffic-Based {config.label} Timing
              </h4>
              <p className={`text-sm text-${config.color}-700 mb-3`}>
                Based on {analysis.totalCheckIns} check-ins over the last 30 days
              </p>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className={`bg-white/50 rounded-lg p-2`}>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-medium text-gray-600">Peak Hours</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900">
                    {analysis.peakHours.map(formatHour).join(', ')}
                  </div>
                </div>
                
                <div className={`bg-white/50 rounded-lg p-2`}>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown className="w-4 h-4 text-green-500" />
                    <span className="text-xs font-medium text-gray-600">Slow Hours</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900">
                    {analysis.slowHours.map(formatHour).join(', ')}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setExpanded(!expanded)}
                className={`text-sm font-medium text-${config.color}-600 hover:text-${config.color}-700 flex items-center gap-1`}
              >
                {expanded ? '↑ Hide' : '↓ View'} Detailed Suggestions
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Suggestions */}
      {expanded && suggestions.length > 0 && (
        <div className="space-y-2">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-400 transition-all cursor-pointer"
              onClick={() => onSuggestionSelect?.(suggestion)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="bg-blue-100 rounded-lg p-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">
                        {suggestion.suggestedDays.join(', ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {suggestion.suggestedHours.join(', ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {suggestion.reason}
                    </p>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-green-800 mb-1">Expected Impact:</p>
                          <p className="text-xs text-green-700">{suggestion.expectedImpact}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Boost Potential Badge */}
                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full px-3 py-1 text-xs font-bold">
                  +{suggestion.trafficBoostPotential}% 🚀
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrafficInsights;
