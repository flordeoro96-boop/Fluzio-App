/**
 * AI Recommendations Widget
 * Displays personalized recommendations for users on the home screen
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, TrendingUp, MapPin, Award, Star, ChevronRight, 
  Loader, Heart, Clock, Target, Zap
} from 'lucide-react';
import { 
  AIRecommendation, 
  getAIRecommendations 
} from '../services/aiRecommendationService';
import { useAuth } from '../services/AuthContext';

export const AIRecommendationsWidget: React.FC = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'all' | 'business' | 'mission'>('all');

  useEffect(() => {
    loadRecommendations();
  }, [user]);

  const loadRecommendations = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      // Get user's location if available
      let location: { latitude: number; longitude: number } | undefined;
      if (navigator.geolocation) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              location = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              };
              resolve();
            },
            () => resolve() // Continue without location if denied
          );
        });
      }

      const recs = await getAIRecommendations(user.uid, location, 6);
      setRecommendations(recs);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecommendations = recommendations.filter(rec => 
    selectedType === 'all' || rec.type === selectedType
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-4 border-l-red-500 bg-red-50/50';
      case 'medium': return 'border-l-4 border-l-yellow-500 bg-yellow-50/50';
      default: return 'border-l-4 border-l-blue-500 bg-blue-50/50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'business': return <MapPin className="w-4 h-4" />;
      case 'mission': return <Target className="w-4 h-4" />;
      case 'event': return <Calendar className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">AI Recommendations</h3>
            <p className="text-xs text-gray-600">Personalized for you</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">AI Recommendations</h3>
            <p className="text-xs text-gray-600">Personalized for you</p>
          </div>
        </div>
        <div className="text-center py-8">
          <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">Complete more missions to get personalized recommendations!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-pulse-slow">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">AI Recommendations</h3>
            <p className="text-xs text-gray-600">
              {recommendations.length} personalized suggestions
            </p>
          </div>
        </div>
        <button 
          onClick={loadRecommendations}
          className="text-purple-600 hover:text-purple-700 text-sm font-semibold flex items-center gap-1"
        >
          <Zap className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Type Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <FilterButton
          active={selectedType === 'all'}
          onClick={() => setSelectedType('all')}
          label="All"
          count={recommendations.length}
        />
        <FilterButton
          active={selectedType === 'business'}
          onClick={() => setSelectedType('business')}
          label="Businesses"
          count={recommendations.filter(r => r.type === 'business').length}
        />
        <FilterButton
          active={selectedType === 'mission'}
          onClick={() => setSelectedType('mission')}
          label="Missions"
          count={recommendations.filter(r => r.type === 'mission').length}
        />
      </div>

      {/* Recommendations List */}
      <div className="space-y-3">
        {filteredRecommendations.slice(0, 4).map((rec, index) => (
          <RecommendationCard key={`${rec.id}-${index}`} recommendation={rec} />
        ))}
      </div>

      {/* View All Button */}
      {filteredRecommendations.length > 4 && (
        <button className="w-full mt-4 py-3 border-2 border-gray-200 rounded-xl text-gray-700 font-semibold hover:border-purple-500 hover:text-purple-600 transition-colors flex items-center justify-center gap-2">
          View All Recommendations
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

// Filter Button Component
const FilterButton: React.FC<{
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}> = ({ active, onClick, label, count }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
      active
        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`}
  >
    {label}
    {count > 0 && (
      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
        active ? 'bg-white/30' : 'bg-gray-300'
      }`}>
        {count}
      </span>
    )}
  </button>
);

// Recommendation Card Component
const RecommendationCard: React.FC<{ recommendation: AIRecommendation }> = ({ recommendation }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'from-red-500 to-pink-500';
      case 'medium': return 'from-yellow-500 to-orange-500';
      default: return 'from-blue-500 to-cyan-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'business': return <MapPin className="w-4 h-4" />;
      case 'mission': return <Target className="w-4 h-4" />;
      case 'event': return <Calendar className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const confidenceWidth = `${recommendation.confidence * 100}%`;

  return (
    <div className="group bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-3 flex-1">
          {/* Image or Icon */}
          {recommendation.imageUrl ? (
            <img
              src={recommendation.imageUrl}
              alt={recommendation.title}
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getPriorityColor(recommendation.priority)} flex items-center justify-center text-white flex-shrink-0`}>
              {getTypeIcon(recommendation.type)}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-900 truncate">
                {recommendation.title}
              </h4>
              {recommendation.priority === 'high' && (
                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full flex-shrink-0">
                  HOT
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
              {recommendation.description}
            </p>
            
            {/* Reason */}
            <div className="flex items-center gap-1 text-xs text-purple-600 mb-2">
              <Sparkles className="w-3 h-3" />
              <span className="font-medium">{recommendation.reason}</span>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {recommendation.distance && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {recommendation.distance.toFixed(1)}km
                </span>
              )}
              {recommendation.points && (
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-500" />
                  {recommendation.points} pts
                </span>
              )}
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                recommendation.type === 'business' ? 'bg-blue-100 text-blue-700' :
                recommendation.type === 'mission' ? 'bg-purple-100 text-purple-700' :
                'bg-green-100 text-green-700'
              }`}>
                {recommendation.type}
              </span>
            </div>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
      </div>

      {/* Confidence Bar */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-500">Match Score</span>
          <span className="font-semibold text-purple-600">
            {Math.round(recommendation.confidence * 100)}%
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${getPriorityColor(recommendation.priority)} rounded-full transition-all duration-500`}
            style={{ width: confidenceWidth }}
          />
        </div>
      </div>
    </div>
  );
};

// Calendar icon import (if not available)
const Calendar: React.FC<any> = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
