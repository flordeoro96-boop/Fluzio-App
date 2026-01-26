import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, TrendingUp, MapPin, Users, Target, Calendar, ChevronRight } from 'lucide-react';
import { Mission, User, Meetup } from '../types';
import { api } from '../services/AuthContext';
import { getActiveMissions } from '../services/missionService';
import * as userService from '../services/userService';
import { useTranslation } from 'react-i18next';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (type: 'mission' | 'business' | 'meetup' | 'user', id: string) => void;
  currentUserId: string;
}

interface SearchResult {
  id: string;
  type: 'mission' | 'business' | 'meetup' | 'user';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  metadata?: string;
}

const RECENT_SEARCHES_KEY = 'beevvy_recent_searches';
const MAX_RECENT_SEARCHES = 5;

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  isOpen,
  onClose,
  onNavigate,
  currentUserId
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'missions' | 'businesses' | 'meetups' | 'users'>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { t } = useTranslation();

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recent searches:', e);
      }
    }
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, activeTab]);

  const performSearch = async (searchQuery: string) => {
    setIsSearching(true);
    const lowerQuery = searchQuery.toLowerCase();
    const allResults: SearchResult[] = [];

    try {
      // Search missions
      if (activeTab === 'all' || activeTab === 'missions') {
        const missions = await getActiveMissions('', 50);
        const missionResults = missions
          .filter(mission => 
            mission.title.toLowerCase().includes(lowerQuery) ||
            mission.description?.toLowerCase().includes(lowerQuery) ||
            mission.category?.toLowerCase().includes(lowerQuery)
          )
          .slice(0, 5)
          .map(mission => ({
            id: mission.id,
            type: 'mission' as const,
            title: mission.title,
            subtitle: mission.description || mission.category || '',
            icon: <Target className="w-5 h-5 text-purple-600" />,
            metadata: (() => {
              const pointsCount = typeof mission.reward === 'number' ? mission.reward : (mission.reward?.points ?? null);
              return pointsCount != null ? t('globalSearch.points', { count: pointsCount as number }) : '';
            })()
          }));
        allResults.push(...missionResults);
      }

      // Search businesses
      if (activeTab === 'all' || activeTab === 'businesses') {
        // TODO: Implement business search when service is available
        // For now, skip business search
      }

      // Search meetups
      if (activeTab === 'all' || activeTab === 'meetups') {
        // TODO: Implement meetup search when meetup service is available
        // For now, using mock data
        // TODO: Implement meetup search when meetup service is available
        // For now, skip meetup search
      }

      // Search users
      if (activeTab === 'all' || activeTab === 'users') {
        const users = await userService.searchUsers(searchQuery, currentUserId, 5);
        const userResults = users.map(user => ({
          id: user.id,
          type: 'user' as const,
          title: user.name,
          subtitle: `@${user.email?.split('@')[0] || user.name.toLowerCase().replace(' ', '_')}`,
          icon: <Users className="w-5 h-5 text-pink-600" />,
          metadata: user.city || ''
        }));
        allResults.push(...userResults);
      }

      setResults(allResults);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const saveRecentSearch = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    const updated = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const handleResultClick = (result: SearchResult) => {
    saveRecentSearch(query);
    onNavigate(result.type, result.id);
    onClose();
  };

  const handleRecentSearchClick = (search: string) => {
    setQuery(search);
    inputRef.current?.focus();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const handleClose = () => {
    setQuery('');
    setResults([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleClose}
      />

      {/* Search Panel */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl animate-in slide-in-from-top duration-300">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-100">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('globalSearch.placeholder')}
            className="flex-1 text-lg outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
          <button onClick={handleClose} className="text-sm font-medium text-gray-600 hover:text-gray-900">
            ESC
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-4 py-3 border-b border-gray-100 overflow-x-auto">
          {[
            { id: 'all', label: t('globalSearch.tabs.all') },
            { id: 'missions', label: t('globalSearch.tabs.missions') },
            { id: 'businesses', label: t('globalSearch.tabs.businesses') },
            { id: 'meetups', label: t('globalSearch.tabs.meetups') },
            { id: 'users', label: t('globalSearch.tabs.users') }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="max-h-[500px] overflow-y-auto">
          {isSearching ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : query ? (
            results.length > 0 ? (
              <div className="py-2">
                {results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}-${index}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex-shrink-0">
                      {result.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900">{result.title}</div>
                      <div className="text-sm text-gray-500">{result.subtitle}</div>
                    </div>
                    {result.metadata && (
                      <div className="text-sm text-gray-400">{result.metadata}</div>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Search className="w-12 h-12 mb-3 text-gray-300" />
                <p className="text-lg font-medium">{t('globalSearch.empty.noResults')}</p>
                <p className="text-sm">{t('globalSearch.empty.tryDifferent')}</p>
              </div>
            )
          ) : (
            // Recent searches and trending
            <div className="py-4">
              {recentSearches.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between px-4 mb-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Clock className="w-4 h-4" />
                      {t('globalSearch.recent.title')}
                    </div>
                    <button 
                      onClick={clearRecentSearches}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      {t('globalSearch.recent.clear')}
                    </button>
                  </div>
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(search)}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors group"
                    >
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="flex-1 text-left text-gray-700">{search}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              )}

              {/* Trending suggestions */}
              <div className="px-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <TrendingUp className="w-4 h-4" />
                  {t('globalSearch.trending.title')}
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    t('globalSearch.trending.tags.coffeeShops'),
                    t('globalSearch.trending.tags.fitness'),
                    t('globalSearch.trending.tags.artGalleries'),
                    t('globalSearch.trending.tags.liveMusic'),
                    t('globalSearch.trending.tags.foodTours')
                  ].map(tag => (
                    <button
                      key={tag}
                      onClick={() => setQuery(tag)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer tip */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 text-center rounded-b-2xl">
          <kbd className="px-2 py-1 bg-white border border-gray-200 rounded">↑</kbd>
          <kbd className="px-2 py-1 bg-white border border-gray-200 rounded ml-1">↓</kbd>
          {' '}{t('globalSearch.footer.navigate')} • 
          <kbd className="px-2 py-1 bg-white border border-gray-200 rounded ml-1">Enter</kbd>
          {' '}{t('globalSearch.footer.select')} • 
          <kbd className="px-2 py-1 bg-white border border-gray-200 rounded ml-1">ESC</kbd>
          {' '}{t('globalSearch.footer.close')}
        </div>
      </div>
    </div>
  );
};
