import React, { useState, useEffect } from 'react';
import {
  Search, SlidersHorizontal, X, MapPin, Star, Tag, TrendingUp,
  DollarSign, Filter, ChevronDown, Check, Compass, Zap
} from 'lucide-react';
import {
  FilterOptions,
  filterMissions,
  filterBusinesses,
  filterRewards,
  getSearchSuggestions,
  getPopularSearches,
  saveFilterPreferences,
  loadFilterPreferences,
  FilteredResult
} from '../../services/advancedFilterService';

interface AdvancedFiltersProps {
  type: 'missions' | 'businesses' | 'rewards';
  onResultsChange: (results: FilteredResult[]) => void;
  userLocation?: { lat: number; lng: number };
}

const CATEGORIES = [
  'Food & Dining',
  'Shopping',
  'Entertainment',
  'Fitness & Wellness',
  'Beauty & Spa',
  'Technology',
  'Professional Services',
  'Home & Garden',
  'Events & Activities',
  'Travel & Tourism'
];

const DISTANCE_OPTIONS = [
  { label: 'Within 5km', value: 5 },
  { label: 'Within 10km', value: 10 },
  { label: 'Within 25km', value: 25 },
  { label: 'Within 50km', value: 50 },
  { label: 'Any distance', value: undefined }
];

const RATING_OPTIONS = [
  { label: 'Any rating', value: undefined },
  { label: '4+ stars', value: 4 },
  { label: '4.5+ stars', value: 4.5 },
  { label: '5 stars only', value: 5 }
];

const SORT_OPTIONS = {
  missions: [
    { label: 'Nearest first', value: 'distance' },
    { label: 'Highest reward', value: 'reward' },
    { label: 'Newest first', value: 'newest' },
    { label: 'Most popular', value: 'trending' },
    { label: 'Top rated', value: 'rating' }
  ],
  businesses: [
    { label: 'Nearest first', value: 'distance' },
    { label: 'Top rated', value: 'rating' },
    { label: 'Most popular', value: 'trending' }
  ],
  rewards: [
    { label: 'Lowest points', value: 'reward' },
    { label: 'Newest first', value: 'newest' },
    { label: 'Most popular', value: 'trending' }
  ]
};

export default function AdvancedFilters({ type, onResultsChange, userLocation }: AdvancedFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [maxDistance, setMaxDistance] = useState<number | undefined>(10);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [minPoints, setMinPoints] = useState<number | undefined>(undefined);
  const [maxPoints, setMaxPoints] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>('distance');
  
  // Search suggestions
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [popularSearches] = useState(getPopularSearches());
  
  // Active filters count
  const activeFiltersCount = [
    selectedCategories.length > 0,
    maxDistance !== undefined,
    minRating !== undefined,
    minPoints !== undefined,
    maxPoints !== undefined
  ].filter(Boolean).length;

  // Load saved preferences on mount
  useEffect(() => {
    const saved = loadFilterPreferences();
    if (saved) {
      if (saved.categories) setSelectedCategories(saved.categories);
      if (saved.maxDistance !== undefined) setMaxDistance(saved.maxDistance);
      if (saved.minRating !== undefined) setMinRating(saved.minRating);
      if (saved.minPoints !== undefined) setMinPoints(saved.minPoints);
      if (saved.maxPoints !== undefined) setMaxPoints(saved.maxPoints);
      if (saved.sortBy) setSortBy(saved.sortBy);
    }
  }, []);

  // Debounced search suggestions
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timer = setTimeout(async () => {
        const searchType = type === 'rewards' ? 'all' : type;
        const results = await getSearchSuggestions(searchQuery, searchType);
        setSuggestions(results);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery, type]);

  // Apply filters
  const applyFilters = async () => {
    setLoading(true);
    try {
      const filters: FilterOptions = {
        searchQuery: searchQuery || undefined,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        maxDistance,
        minRating,
        minPoints,
        maxPoints,
        sortBy: sortBy as any,
        userLocation,
        isActive: true,
        limitResults: 50
      };

      let results: FilteredResult[] = [];
      
      switch (type) {
        case 'missions':
          results = await filterMissions(filters);
          break;
        case 'businesses':
          results = await filterBusinesses(filters);
          break;
        case 'rewards':
          results = await filterRewards(filters);
          break;
      }

      onResultsChange(results);
      
      // Save preferences
      saveFilterPreferences(filters);
    } catch (error) {
      console.error('[AdvancedFilters] Error applying filters:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedCategories, maxDistance, minRating, minPoints, maxPoints, sortBy, userLocation]);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setMaxDistance(10);
    setMinRating(undefined);
    setMinPoints(undefined);
    setMaxPoints(undefined);
    setSortBy('distance');
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-100">
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder={`Search ${type}...`}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              
              {/* Search Suggestions */}
              {showSuggestions && (searchQuery.length >= 2 ? suggestions.length > 0 : true) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-64 overflow-y-auto">
                  {searchQuery.length >= 2 && suggestions.length > 0 ? (
                    <>
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                        Suggestions
                      </div>
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSearchQuery(suggestion);
                            setShowSuggestions(false);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Search className="w-4 h-4 text-gray-400" />
                          <span>{suggestion}</span>
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                        Popular Searches
                      </div>
                      {popularSearches.slice(0, 5).map((search, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSearchQuery(search);
                            setShowSuggestions(false);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                        >
                          <TrendingUp className="w-4 h-4 text-gray-400" />
                          <span>{search}</span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                showFilters
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
          {userLocation && (
            <button
              onClick={() => {
                setMaxDistance(5);
                setSortBy('distance');
              }}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-1 hover:bg-blue-100 transition-colors"
            >
              <Compass className="w-4 h-4" />
              Near me
            </button>
          )}
          <button
            onClick={() => {
              setSortBy('reward');
              if (type === 'missions') setMinPoints(100);
            }}
            className="px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-1 hover:bg-green-100 transition-colors"
          >
            <Zap className="w-4 h-4" />
            High reward
          </button>
          <button
            onClick={() => {
              setSortBy('newest');
            }}
            className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-1 hover:bg-purple-100 transition-colors"
          >
            <Star className="w-4 h-4" />
            New
          </button>
          <button
            onClick={() => {
              setMinRating(4.5);
            }}
            className="px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-1 hover:bg-yellow-100 transition-colors"
          >
            <Star className="w-4 h-4" />
            Top rated
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Categories */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                Categories
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium text-left transition-all ${
                      selectedCategories.includes(category)
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {selectedCategories.includes(category) && (
                      <Check className="w-4 h-4 inline mr-1" />
                    )}
                    {category}
                  </button>
                ))}
              </div>
              {selectedCategories.length > 0 && (
                <button
                  onClick={() => setSelectedCategories([])}
                  className="text-sm text-blue-600 hover:underline mt-2"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Distance, Rating, Points */}
            <div className="space-y-4">
              {/* Distance Filter */}
              {userLocation && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Distance
                  </label>
                  <select
                    value={maxDistance || ''}
                    onChange={(e) => setMaxDistance(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {DISTANCE_OPTIONS.map((option) => (
                      <option key={option.label} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Rating Filter */}
              {(type === 'missions' || type === 'businesses') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Star className="w-4 h-4 inline mr-1" />
                    Minimum Rating
                  </label>
                  <select
                    value={minRating || ''}
                    onChange={(e) => setMinRating(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {RATING_OPTIONS.map((option) => (
                      <option key={option.label} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Points Range Filter */}
              {(type === 'missions' || type === 'rewards') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Points Range
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={minPoints || ''}
                      onChange={(e) => setMinPoints(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="Min"
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      value={maxPoints || ''}
                      onChange={(e) => setMaxPoints(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="Max"
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Sort By */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SORT_OPTIONS[type].map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Clear Filters Button */}
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Applying filters...</p>
        </div>
      )}
    </div>
  );
}
