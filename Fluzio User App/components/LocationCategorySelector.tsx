/**
 * LocationCategorySelector Component
 * 
 * AI-powered location selector with categories and specific locations.
 * Shows seasonal recommendations and smart suggestions based on event content.
 */

import React, { useState, useEffect } from 'react';
import { MapPin, Sparkles, Globe } from 'lucide-react';
import { EventLocationCategory } from '../types';
import {
  getAllCategories,
  getLocationsByCategory,
  suggestCategoriesForEvent,
  getSeasonalRecommendations
} from '../services/eventLocationService';

interface LocationCategorySelectorProps {
  onSelect: (category: EventLocationCategory, specificLocation?: string) => void;
  eventTitle?: string;
  eventDescription?: string;
  selectedCategory?: EventLocationCategory;
  selectedLocation?: string;
}

export const LocationCategorySelector: React.FC<LocationCategorySelectorProps> = ({
  onSelect,
  eventTitle = '',
  eventDescription = '',
  selectedCategory,
  selectedLocation
}) => {
  const [category, setCategory] = useState<EventLocationCategory | null>(
    selectedCategory || null
  );
  const [location, setLocation] = useState<string>(selectedLocation || '');
  const [aiSuggestions, setAiSuggestions] = useState<EventLocationCategory[]>([]);
  const [seasonalSuggestions, setSeasonalSuggestions] = useState<EventLocationCategory[]>([]);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Get AI suggestions when event content changes
  useEffect(() => {
    if (eventTitle || eventDescription) {
      const suggestions = suggestCategoriesForEvent(eventTitle, eventDescription);
      setAiSuggestions(suggestions.slice(0, 4)); // Top 4 suggestions
    } else {
      setAiSuggestions([]);
    }
  }, [eventTitle, eventDescription]);

  // Get seasonal suggestions
  useEffect(() => {
    const currentMonth = new Date().getMonth() + 1;
    const seasonal = getSeasonalRecommendations(currentMonth);
    setSeasonalSuggestions(seasonal);
  }, []);

  const handleCategorySelect = (cat: EventLocationCategory) => {
    setCategory(cat);
    setLocation(''); // Reset specific location when category changes
    onSelect(cat);
  };

  const handleLocationSelect = (loc: string) => {
    setLocation(loc);
    if (category) {
      onSelect(category, loc);
    }
  };

  const availableLocations = category ? getLocationsByCategory(category) : [];
  const allCategories = getAllCategories();

  // Group categories
  const continents = allCategories.filter(c => 
    [EventLocationCategory.EUROPE, EventLocationCategory.ASIA, 
     EventLocationCategory.AFRICA, EventLocationCategory.NORTH_AMERICA,
     EventLocationCategory.SOUTH_AMERICA, EventLocationCategory.OCEANIA].includes(c)
  );

  const features = allCategories.filter(c =>
    [EventLocationCategory.BEACHES, EventLocationCategory.MOUNTAINS,
     EventLocationCategory.LAKES, EventLocationCategory.FORESTS,
     EventLocationCategory.DESERTS, EventLocationCategory.ISLANDS].includes(c)
  );

  const countries = allCategories.filter(c =>
    [EventLocationCategory.GERMANY, EventLocationCategory.FRANCE,
     EventLocationCategory.ITALY, EventLocationCategory.SPAIN,
     EventLocationCategory.GREECE, EventLocationCategory.PORTUGAL,
     EventLocationCategory.SWITZERLAND, EventLocationCategory.AUSTRIA,
     EventLocationCategory.NETHERLANDS, EventLocationCategory.BELGIUM].includes(c)
  );

  return (
    <div className="location-category-selector">
      {/* AI Suggestions */}
      {aiSuggestions.length > 0 && (
        <div className="ai-suggestions mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="text-purple-600" size={20} />
            <h4 className="font-semibold text-gray-900">
              🤖 AI Suggested Categories
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {aiSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleCategorySelect(suggestion)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  category === suggestion
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Seasonal Recommendations */}
      {seasonalSuggestions.length > 0 && (
        <div className="seasonal-suggestions mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="text-blue-600" size={20} />
            <h4 className="font-semibold text-gray-900">
              🌍 Seasonal Recommendations
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {seasonalSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleCategorySelect(suggestion)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  category === suggestion
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category Selector */}
      <div className="category-selector mb-6">
        <label className="block font-medium text-gray-900 mb-3">
          Select Location Category
        </label>

        {/* Popular Categories */}
        <div className="space-y-4">
          {/* Continents */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Continents</p>
            <div className="flex flex-wrap gap-2">
              {continents.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategorySelect(cat)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    category === cat
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Geographic Features */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Geographic Features
            </p>
            <div className="flex flex-wrap gap-2">
              {features.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategorySelect(cat)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    category === cat
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Countries */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Countries</p>
            <div className="flex flex-wrap gap-2">
              {countries.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategorySelect(cat)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    category === cat
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Show All Toggle */}
          {!showAllCategories && (
            <button
              type="button"
              onClick={() => setShowAllCategories(true)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Show all {allCategories.length} categories →
            </button>
          )}

          {/* All Categories Dropdown */}
          {showAllCategories && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">All Categories</p>
              <select
                value={category || ''}
                onChange={(e) => handleCategorySelect(e.target.value as EventLocationCategory)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a category...</option>
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Specific Location Selector */}
      {category && availableLocations.length > 0 && (
        <div className="specific-location-selector">
          <label className="block font-medium text-gray-900 mb-3">
            Select Specific Location (Optional)
          </label>
          <select
            value={location}
            onChange={(e) => handleLocationSelect(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Any location in {category}</option>
            {availableLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Selected Display */}
      {category && (
        <div className="selected-display mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <MapPin className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-green-900">
                {location || category}
              </p>
              {location && (
                <p className="text-sm text-green-700 mt-1">
                  Category: {category}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
