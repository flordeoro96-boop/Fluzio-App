import React, { useEffect, useState } from 'react';
import { User, CollaborationSuggestion } from '../types';
import { Sparkles, TrendingUp, MessageCircle, Eye, Loader2, MapPin } from 'lucide-react';
import { db } from '../services/apiService';
import { doc, getDoc } from '../services/firestoreCompat';

interface AICollaborationSuggestionsProps {
  user: User;
  onOpenChat?: (businessId: string) => void;
  onViewProfile?: (businessId: string) => void;
}

export const AICollaborationSuggestions: React.FC<AICollaborationSuggestionsProps> = ({ 
  user, 
  onOpenChat,
  onViewProfile 
}) => {
  const [suggestions, setSuggestions] = useState<CollaborationSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState<string>('');

  useEffect(() => {
    fetchSuggestions();
  }, [user.id, user.temporaryLocation?.city]);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with Supabase Edge Function or skip for now
      // Firebase Cloud Functions are no longer available
      console.log('[AICollabSuggestions] Feature temporarily disabled - Firebase Cloud Functions not available');
      
      setSuggestions([]);
      setError('AI Collaboration Suggestions temporarily unavailable');
      setLoading(false);
      return;
      
      /* Original Firebase Cloud Function call - commented out
      const response = await fetch(
        'https://us-central1-fluzio-13af2.cloudfunctions.net/generateCollaborationSuggestions',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        }
      );

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to generate suggestions');
        setLoading(false);
        return;
      }

      setCity(data.city || '');

      // Fetch full business data for each suggestion
      const enrichedSuggestions = await Promise.all(
        data.suggestions.map(async (suggestion: CollaborationSuggestion) => {
          try {
            const businessDoc = await getDoc(doc(db, 'users', suggestion.businessId));
            if (businessDoc.exists()) {
              return {
                ...suggestion,
                business: { id: businessDoc.id, ...businessDoc.data() } as User
              };
            }
            return suggestion;
          } catch (err) {
            console.error('Error fetching business:', err);
            return suggestion;
          }
        })
      );

      setSuggestions(enrichedSuggestions);
      */
    } catch (err: any) {
      console.error('Error fetching suggestions:', err);
      setError(err.message || 'Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Generating AI suggestions...</p>
        <p className="text-sm text-gray-400 mt-1">Finding perfect collaboration matches</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <div className="text-red-600 font-bold mb-2">Error Loading Suggestions</div>
        <p className="text-sm text-red-500 mb-4">{error}</p>
        <button 
          onClick={fetchSuggestions}
          className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-8 text-center">
        <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-3" />
        <h3 className="font-bold text-lg text-purple-900 mb-2">No Matches Found</h3>
        <p className="text-sm text-purple-700 mb-4">
          We couldn't find businesses in {city || 'your city'} right now.
        </p>
        <p className="text-xs text-purple-600">
          Try again later as more businesses join Fluzio!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-[#1E0E62]">AI Collaboration Suggestions</h3>
            <p className="text-sm text-gray-600">Perfect partnership matches in {city}</p>
          </div>
        </div>
        <button 
          onClick={fetchSuggestions}
          className="px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-sm font-bold hover:bg-purple-100 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Suggestions List */}
      {suggestions.map((suggestion, index) => {
        const business = suggestion.business;
        if (!business) return null;

        return (
          <div 
            key={suggestion.businessId} 
            className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Business Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-3 flex-1">
                <img 
                  src={business.avatarUrl || 'https://via.placeholder.com/50'} 
                  alt={business.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-purple-100"
                />
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-[#1E0E62] mb-1">{business.name}</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium">
                      {business.category}
                    </span>
                    {business.homeCity && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span className="text-xs">{business.homeCity}</span>
                      </div>
                    )}
                  </div>
                  {business.bio && (
                    <p className="text-sm text-gray-700 line-clamp-2">{business.bio}</p>
                  )}
                </div>
              </div>

              {/* Match Score */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md">
                <TrendingUp className="w-4 h-4 inline mr-1" />
                {suggestion.matchScore}%
              </div>
            </div>

            {/* Collaboration Idea */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl mb-3 border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">
                  Collaboration Idea
                </span>
              </div>
              <p className="text-sm text-purple-900 font-medium leading-relaxed">
                {suggestion.collaborationIdea}
              </p>
            </div>

            {/* Synergy Explanation */}
            <div className="mb-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                <span className="font-semibold text-gray-900">Why it works:</span> {suggestion.synergy}
              </p>
            </div>

            {/* Additional Info */}
            {(suggestion.sharedInterests || suggestion.potentialRevenue) && (
              <div className="flex gap-3 mb-4 flex-wrap">
                {suggestion.sharedInterests && suggestion.sharedInterests.length > 0 && (
                  <div className="flex-1 min-w-[200px]">
                    <div className="text-xs font-bold text-gray-500 mb-1">Shared Interests</div>
                    <div className="flex gap-1 flex-wrap">
                      {suggestion.sharedInterests.map((interest, i) => (
                        <span 
                          key={i}
                          className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {suggestion.potentialRevenue && (
                  <div className="flex-1 min-w-[150px]">
                    <div className="text-xs font-bold text-gray-500 mb-1">Potential Revenue</div>
                    <div className="text-green-600 font-bold text-sm">
                      {suggestion.potentialRevenue}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button 
                onClick={() => onOpenChat?.(suggestion.businessId)}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Send Collab Request
              </button>
              <button 
                onClick={() => onViewProfile?.(suggestion.businessId)}
                className="px-6 py-3 border-2 border-purple-200 text-purple-700 rounded-xl font-bold hover:bg-purple-50 transition-colors flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View Profile
              </button>
            </div>
          </div>
        );
      })}

      {/* Footer */}
      <div className="text-center mt-6 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          💡 Suggestions powered by AI • Refreshed daily based on your profile
        </p>
      </div>
    </div>
  );
};
