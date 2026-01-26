import React, { useState } from 'react';
import { User } from '../../types';
import { Globe2, Target, MessageSquare, Sparkles, RefreshCw, Check, X, Loader } from 'lucide-react';
import { aiAboutService } from '../../services/aiAboutService';
import { api } from '../../services/AuthContext';

interface BusinessAboutCardProps {
  business: User;
  isOwner?: boolean;
  onUpdate?: () => void;
}

export const BusinessAboutCard: React.FC<BusinessAboutCardProps> = ({ business, isOwner = false, onUpdate }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{ tagline: string; about: string; vibeTags: string[] } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedAbout, setEditedAbout] = useState('');
  const [editedVibeTags, setEditedVibeTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const hasWebsite = business.socialLinks?.website || business.website;
  const hasAboutText = business.aboutText || business.bio;

  const availableVibeTags = [
    'Luxury', 'Boho', 'Streetwear', 'Eco-Friendly', 'Minimalist', 
    'High-Tech', 'Cozy', 'Industrial', 'Vintage', 'Artsy', 
    'Modern', 'Classic', 'Playful', 'Sophisticated', 'Urban', 
    'Rustic', 'Elegant', 'Casual', 'Premium', 'Authentic'
  ];

  const handleGenerateWithAI = async () => {
    setError(null);
    setIsGenerating(true);

    try {
      console.log('[BusinessAboutCard] Generating with AI for business:', business.id, business);
      const result = await aiAboutService.generateBusinessAbout(business.id);
      
      if (result.success && result.about && result.tagline) {
        setPreviewData({
          tagline: result.tagline,
          about: result.about,
          vibeTags: result.vibeTags || []
        });
        setEditedVibeTags(result.vibeTags || []);
        setShowPreview(true);
      } else {
        setError(result.error || 'Failed to generate About text');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleVibeTag = (tag: string) => {
    setEditedVibeTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : prev.length < 5 
          ? [...prev, tag]
          : prev
    );
  };

  const handleUseText = async () => {
    if (!previewData) return;

    try {
      const result = await api.updateUser(business.id, {
        aboutText: previewData.about,
        tagline: previewData.tagline,
        vibeTags: editedVibeTags,
        aboutAiSource: 'AI'
      });

      if (result.success) {
        setShowPreview(false);
        setPreviewData(null);
        setEditedVibeTags([]);
        if (onUpdate) onUpdate();
      } else {
        setError('Failed to save About text');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleEditManually = () => {
    if (previewData) {
      setEditedAbout(previewData.about);
      setIsEditing(true);
      setShowPreview(false);
    }
  };

  const handleSaveEdited = async () => {
    try {
      const result = await api.updateUser(business.id, {
        aboutText: editedAbout,
        tagline: previewData?.tagline,
        vibeTags: editedVibeTags,
        aboutAiSource: 'MANUAL'
      });

      if (result.success) {
        setIsEditing(false);
        setEditedAbout('');
        setPreviewData(null);
        setEditedVibeTags([]);
        if (onUpdate) onUpdate();
      } else {
        setError('Failed to save About text');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  const displayAbout = business.aboutText || business.bio;

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
      <h2 className="text-xl font-clash font-bold text-[#1E0E62] mb-4">About</h2>
      
      {/* AI Generation Banner */}
      {isOwner && hasWebsite && !showPreview && !isEditing && (
        <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-[#1E0E62] font-medium mb-2">
                {hasAboutText ? '✨ Refresh your About section with AI' : '💡 Let AI create your About section from your website.'}
              </p>
              <button
                onClick={handleGenerateWithAI}
                disabled={isGenerating}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {hasAboutText ? 'Regenerate with AI' : 'Generate with AI'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State - No Website */}
      {isOwner && !hasWebsite && !hasAboutText && (
        <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200 text-center">
          <p className="text-sm text-[#8F8FA3] mb-2">
            To let AI write your About section, first add your website in Contact Information.
          </p>
          <button
            className="px-4 py-2 bg-[#1E0E62] text-white rounded-lg text-sm font-semibold hover:bg-[#2d1a7a] transition-colors"
          >
            Add Website
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isGenerating && (
        <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200 text-center">
          <Loader className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-sm text-blue-900 font-medium">
            Analyzing {business.socialLinks?.website || business.website} and generating your About text...
          </p>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && previewData && (
        <div className="mb-4 p-5 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 rounded-xl border-2 border-purple-300 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-[#1E0E62] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Generated Preview
            </h3>
            <button
              onClick={() => setShowPreview(false)}
              className="p-1 hover:bg-white rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Tagline */}
          <div className="mb-3">
            <p className="text-xs font-semibold text-purple-700 uppercase mb-1">Suggested Tagline</p>
            <p className="text-sm font-medium text-[#1E0E62] italic">"{previewData.tagline}"</p>
          </div>

          {/* About Text */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-purple-700 uppercase mb-2">About Text</p>
            <div className="bg-white p-3 rounded-lg">
              <p className="text-sm text-[#1E0E62] leading-relaxed whitespace-pre-wrap">{previewData.about}</p>
            </div>
          </div>

          {/* Suggested Vibe Tags */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-purple-700 uppercase mb-2">Suggested Vibe Tags (Select up to 5)</p>
            <div className="bg-white p-3 rounded-lg">
              <div className="flex flex-wrap gap-2">
                {availableVibeTags.map(tag => {
                  const isSelected = editedVibeTags.includes(tag);
                  const isAiSuggested = previewData.vibeTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => handleToggleVibeTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                          : isAiSuggested
                          ? 'bg-purple-100 text-purple-700 border border-purple-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                      {isAiSuggested && !isSelected && (
                        <Sparkles className="w-3 h-3 inline ml-1" />
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {editedVibeTags.length}/5 tags selected
                {previewData.vibeTags.length > 0 && (
                  <span className="ml-2">• <Sparkles className="w-3 h-3 inline" /> = AI suggested</span>
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleUseText}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-semibold hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Use this text
            </button>
            <button
              onClick={handleGenerateWithAI}
              className="px-4 py-2 bg-white border border-purple-300 text-purple-700 rounded-lg text-sm font-semibold hover:bg-purple-50 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </button>
            <button
              onClick={handleEditManually}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              Edit
            </button>
          </div>
        </div>
      )}

      {/* Edit Mode */}
      {isEditing && (
        <div className="mb-4">
          <label className="block text-sm font-semibold text-[#1E0E62] mb-2">Edit About Text</label>
          <textarea
            value={editedAbout}
            onChange={(e) => setEditedAbout(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[200px]"
            placeholder="Write about your business..."
          />
          
          {/* Vibe Tags in Edit Mode */}
          <div className="mt-4">
            <label className="block text-sm font-semibold text-[#1E0E62] mb-2">Vibe Tags (up to 5)</label>
            <div className="flex flex-wrap gap-2">
              {availableVibeTags.map(tag => {
                const isSelected = editedVibeTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => handleToggleVibeTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-2">{editedVibeTags.length}/5 tags selected</p>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSaveEdited}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => { setIsEditing(false); setEditedAbout(''); setEditedVibeTags([]); }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Bio/About Text Display */}
      <div className="mb-5">
        {displayAbout ? (
          <div>
            {business.tagline && (
              <p className="text-sm font-medium text-purple-600 italic mb-3">"{business.tagline}"</p>
            )}
            <p className="text-[#1E0E62] leading-relaxed whitespace-pre-wrap">{displayAbout}</p>
            {business.aboutAiSource === 'AI' && (
              <div className="mt-2 flex items-center gap-1 text-xs text-purple-600">
                <Sparkles className="w-3 h-3" />
                <span>Generated by AI</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-[#8F8FA3] italic text-sm">No bio added yet. Click Edit to add your business description.</p>
        )}
      </div>

      {/* Mission Statement */}
      <div className="mb-5 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-[#1E0E62] mb-1">Our Mission</h3>
            {business.mission ? (
              <p className="text-sm text-[#8F8FA3] leading-relaxed">{business.mission}</p>
            ) : (
              <p className="text-sm text-[#8F8FA3] italic">No mission statement yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Languages */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Globe2 className="w-4 h-4 text-[#8F8FA3]" />
          <h3 className="font-bold text-sm text-[#1E0E62]">Languages</h3>
        </div>
        {business.languages && business.languages.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {business.languages.map((lang, idx) => (
              <span 
                key={idx}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
              >
                {lang}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[#8F8FA3] italic text-sm">No languages specified.</p>
        )}
      </div>

      {/* What We Offer Creators */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-[#8F8FA3]" />
          <h3 className="font-bold text-sm text-[#1E0E62]">What We Offer Creators</h3>
        </div>
        {business.offers && business.offers.length > 0 ? (
          <div className="space-y-2">
            {business.offers.map((offer, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span className="text-sm text-[#8F8FA3]">{offer}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[#8F8FA3] italic text-sm">No creator offers yet.</p>
        )}
      </div>
    </div>
  );
};
