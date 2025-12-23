import React from 'react';
import { X, Filter, MapPin, Star, DollarSign, Clock, TrendingUp } from 'lucide-react';

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  
  // Mission Filters
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  categories?: string[];
  
  // Distance Filter
  maxDistance: number;
  onDistanceChange: (distance: number) => void;
  
  // Sort Options
  sortBy: string;
  onSortChange: (sort: string) => void;
  
  // Additional Filters
  showOnlyOpen?: boolean;
  onShowOnlyOpenChange?: (value: boolean) => void;
  minRating?: number;
  onMinRatingChange?: (rating: number) => void;
  
  // Points Range (for missions)
  minPoints?: number;
  maxPoints?: number;
  onPointsRangeChange?: (min: number, max: number) => void;
}

export const MobileFilterDrawer: React.FC<MobileFilterDrawerProps> = ({
  isOpen,
  onClose,
  selectedCategory,
  onCategoryChange,
  categories = ['All', 'Food', 'Fashion', 'Tech', 'Lifestyle', 'Travel', 'Beauty', 'Fitness'],
  maxDistance,
  onDistanceChange,
  sortBy,
  onSortChange,
  showOnlyOpen,
  onShowOnlyOpenChange,
  minRating,
  onMinRatingChange,
  minPoints = 0,
  maxPoints = 1000,
  onPointsRangeChange
}) => {
  if (!isOpen) return null;

  const sortOptions = [
    { value: 'distance', label: 'Nearest First', icon: MapPin },
    { value: 'rating', label: 'Highest Rated', icon: Star },
    { value: 'missions', label: 'Most Missions', icon: TrendingUp },
    { value: 'newest', label: 'Newest', icon: Clock },
    { value: 'points', label: 'Highest Points', icon: DollarSign }
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-[#00E5FF]/10 to-[#6C4BFF]/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] rounded-full flex items-center justify-center">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-[#1E0E62]">Filters</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Category Filter */}
          {onCategoryChange && (
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Category</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => onCategoryChange(category)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      selectedCategory === category
                        ? 'bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white shadow-md scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Distance Filter */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Distance</h3>
              <span className="text-sm font-semibold text-[#6C4BFF]">{maxDistance} km</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={maxDistance}
              onChange={(e) => onDistanceChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#00E5FF]"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1 km</span>
              <span>50 km</span>
            </div>
          </div>

          {/* Points Range Filter */}
          {onPointsRangeChange && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Points Range</h3>
                <span className="text-sm font-semibold text-[#6C4BFF]">{minPoints} - {maxPoints} XP</span>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Min Points</label>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="10"
                    value={minPoints}
                    onChange={(e) => onPointsRangeChange(Number(e.target.value), maxPoints)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#00E5FF]"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Max Points</label>
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="50"
                    value={maxPoints}
                    onChange={(e) => onPointsRangeChange(minPoints, Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#6C4BFF]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Rating Filter */}
          {onMinRatingChange && (
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Minimum Rating</h3>
              <div className="flex gap-2">
                {[0, 3, 4, 4.5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => onMinRatingChange(rating)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                      minRating === rating
                        ? 'bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {rating === 0 ? 'Any' : (
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{rating}+</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sort By */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Sort By</h3>
            <div className="space-y-2">
              {sortOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => onSortChange(option.value)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                      sortBy === option.value
                        ? 'bg-gradient-to-r from-[#00E5FF]/20 to-[#6C4BFF]/20 border-2 border-[#00E5FF]'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${sortBy === option.value ? 'text-[#6C4BFF]' : 'text-gray-400'}`} />
                    <span className={`font-semibold ${sortBy === option.value ? 'text-[#6C4BFF]' : 'text-gray-700'}`}>
                      {option.label}
                    </span>
                    {sortBy === option.value && (
                      <div className="ml-auto w-2 h-2 bg-[#00E5FF] rounded-full animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Additional Options */}
          {(onShowOnlyOpenChange) && (
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Additional Options</h3>
              <div className="space-y-2">
                {onShowOnlyOpenChange && (
                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-gray-700">Open Now</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={showOnlyOpen}
                      onChange={(e) => onShowOnlyOpenChange(e.target.checked)}
                      className="w-5 h-5 rounded accent-[#00E5FF]"
                    />
                  </label>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <button
            onClick={onClose}
            className="w-full py-4 bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
};
