/**
 * AI Collaboration Suggestions Card
 * Shows AI-powered partnership suggestions for businesses
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles, Loader2, Users, MapPin, TrendingUp, MessageCircle,
  ExternalLink, RefreshCw, Target, Lightbulb, ArrowRight
} from 'lucide-react';

interface CollaborationSuggestion {
  businessId: string;
  businessName: string;
  category: string;
  synergyScore: number;
  reasoning: string;
  suggestedCollaborationType: string;
  mutualBenefits: string[];
}

interface AICollaborationSuggestionsCardProps {
  businessId: string;
  businessName: string;
  city?: string;
  onMessageBusiness?: (businessId: string, businessName: string) => void;
}

export const AICollaborationSuggestionsCard: React.FC<AICollaborationSuggestionsCardProps> = ({
  businessId,
  businessName,
  city,
  onMessageBusiness
}) => {
  const [suggestions, setSuggestions] = useState<CollaborationSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadSuggestions();
  }, [businessId]);

  const loadSuggestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // TODO: Replace with Supabase Edge Function or skip for now
      // Firebase Cloud Functions are no longer available
      console.log('[AICollabSuggestions] Feature temporarily disabled - Firebase Cloud Functions not available');
      
      // Return empty suggestions for now
      setSuggestions([]);
      setError('AI Collaboration Suggestions temporarily unavailable');
      
      /* Original Firebase Cloud Function call - commented out
      const response = await fetch(
        'https://us-central1-fluzio-13af2.cloudfunctions.net/generateCollaborationSuggestions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: businessId })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data = await response.json();
      
      if (data.success) {
        setSuggestions(data.suggestions || []);
      } else {
        setError(data.message || 'Failed to generate suggestions');
      }
      */
    } catch (err) {
      console.error('[AICollabSuggestions] Error:', err);
      setError('Unable to load collaboration suggestions');
    } finally {
      setLoading(false);
    }
  };

  const getSynergyColor = (score: number) => {
    if (score >= 8) return 'bg-green-100 text-green-700 border-green-200';
    if (score >= 6) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  const getSynergyLabel = (score: number) => {
    if (score >= 8) return 'Excellent Match';
    if (score >= 6) return 'Good Synergy';
    return 'Potential Partner';
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
        <div className="flex items-center justify-center gap-3 text-purple-600">
          <Sparkles className="w-6 h-6 animate-pulse" />
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="font-semibold">AI analyzing potential collaborations...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <Sparkles className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">AI Partnership Suggestions</h3>
        </div>
        <p className="text-gray-600 text-sm mb-3">{error}</p>
        <button
          onClick={loadSuggestions}
          className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">AI Partnership Suggestions</h3>
        </div>
        <p className="text-gray-600 text-sm">
          {city ? `No collaboration opportunities found in ${city} yet.` : 'No collaboration opportunities found yet.'}
        </p>
      </div>
    );
  }

  const displayedSuggestions = expanded ? suggestions : suggestions.slice(0, 2);

  return (
    <div className="bg-white rounded-2xl border-2 border-purple-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-6 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6" />
            <h3 className="text-xl font-bold">AI Partnership Suggestions</h3>
          </div>
          <button
            onClick={loadSuggestions}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Refresh suggestions"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
        <p className="text-purple-100 text-sm">
          {city ? `Businesses in ${city} that would make great collaboration partners` : 'Businesses that would make great collaboration partners'}
        </p>
      </div>

      {/* Suggestions List */}
      <div className="p-6 space-y-4">
        {displayedSuggestions.map((suggestion, index) => (
          <div
            key={suggestion.businessId}
            className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100 hover:border-purple-300 transition-colors"
          >
            {/* Business Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-bold text-gray-900 text-lg">{suggestion.businessName}</h4>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-lg font-medium">
                    {suggestion.category}
                  </span>
                </div>
                
                {/* Synergy Score */}
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-sm border ${getSynergyColor(suggestion.synergyScore)}`}>
                  <Target className="w-4 h-4" />
                  {getSynergyLabel(suggestion.synergyScore)} ({suggestion.synergyScore}/10)
                </div>
              </div>
            </div>

            {/* Collaboration Type */}
            <div className="mb-3 p-3 bg-white rounded-lg border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-semibold text-gray-700">Suggested Collaboration:</span>
              </div>
              <p className="text-sm text-gray-900 font-medium">
                {suggestion.suggestedCollaborationType}
              </p>
            </div>

            {/* AI Reasoning */}
            <div className="mb-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                {suggestion.reasoning}
              </p>
            </div>

            {/* Mutual Benefits */}
            {suggestion.mutualBenefits && suggestion.mutualBenefits.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                  Mutual Benefits:
                </p>
                <div className="space-y-1">
                  {suggestion.mutualBenefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Button */}
            {onMessageBusiness && (
              <button
                onClick={() => onMessageBusiness(suggestion.businessId, suggestion.businessName)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-semibold"
              >
                <MessageCircle className="w-4 h-4" />
                Message {suggestion.businessName}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Show More/Less Button */}
      {suggestions.length > 2 && (
        <div className="px-6 pb-6">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
          >
            {expanded ? (
              <>
                Show Less
                <ArrowRight className="w-4 h-4 rotate-90" />
              </>
            ) : (
              <>
                Show {suggestions.length - 2} More Suggestions
                <ArrowRight className="w-4 h-4 -rotate-90" />
              </>
            )}
          </button>
        </div>
      )}

      {/* AI Badge */}
      <div className="px-6 pb-4 flex items-center justify-center gap-2 text-xs text-gray-500">
        <Sparkles className="w-3 h-3" />
        <span>Powered by AI · Updated daily based on your business profile</span>
      </div>
    </div>
  );
};
