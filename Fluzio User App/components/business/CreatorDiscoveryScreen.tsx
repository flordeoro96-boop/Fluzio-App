/**
 * Creator Discovery Screen
 * For BUSINESS users to browse and discover creators
 * Features: Search, filter, view profiles, message creators, invite to projects
 */

import React, { useState, useEffect } from 'react';
import {
  Search, Filter, MapPin, Star, Award, Camera, Video, Edit3,
  MessageCircle, UserPlus, TrendingUp, Target, Sparkles, X,
  SlidersHorizontal, DollarSign, Clock, CheckCircle, Briefcase, Users
} from 'lucide-react';
import { db } from '../../services/apiService';
import { collection, query, where, getDocs, getDoc, doc, orderBy, limit } from '../../services/firestoreCompat';
import { createConversation } from '../../services/conversationService';

interface Creator {
  id: string;
  name: string;
  avatarUrl?: string;
  bio?: string;
  city?: string;
  skills?: string[];
  contentTypes?: string[];
  portfolioUrl?: string;
  rating?: number;
  collabsCompleted?: number;
  responseTime?: string;
  hourlyRate?: number;
  availability?: 'Available' | 'Busy' | 'Booked';
  creatorLevel?: number;
}

interface CreatorDiscoveryScreenProps {
  businessId: string;
  onNavigate: (route: string, params?: any) => void;
  onClose?: () => void;
}

export const CreatorDiscoveryScreen: React.FC<CreatorDiscoveryScreenProps> = ({
  businessId,
  onNavigate,
  onClose
}) => {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [filteredCreators, setFilteredCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [businessName, setBusinessName] = useState<string>('Business');
  
  // Filters
  const [filters, setFilters] = useState({
    contentType: 'all',
    location: '',
    minRating: 0,
    maxRate: 1000,
    availability: 'all'
  });

  useEffect(() => {
    loadBusinessInfo();
    loadCreators();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filters, creators]);

  const loadBusinessInfo = async () => {
    try {
      const userDocRef = doc(db, 'users', businessId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setBusinessName(userData.name || userData.businessName || 'Business');
      }
    } catch (error) {
      console.error('[CreatorDiscovery] Error loading business info:', error);
    }
  };

  const loadCreators = async () => {
    setLoading(true);
    try {
      // Query users with creatorMode enabled
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('creatorMode', '==', true)
      );
      
      const snapshot = await getDocs(q);
      
      const creatorsData: Creator[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Creator',
          avatarUrl: data.avatarUrl || data.photoUrl,
          bio: data.bio || data.creatorBio,
          city: data.homeCity || data.currentCity,
          skills: data.creatorSkills || data.skills || [],
          contentTypes: data.contentTypes || [],
          portfolioUrl: data.portfolioUrl,
          rating: data.creatorRating || data.rating || 0,
          collabsCompleted: data.collabsCompleted || 0,
          responseTime: data.responseTime || 'Within 24 hours',
          hourlyRate: data.hourlyRate || data.creatorRate,
          availability: data.availability || 'Available',
          creatorLevel: data.level || 1
        };
      });

      setCreators(creatorsData);
      setFilteredCreators(creatorsData);
    } catch (error) {
      console.error('[CreatorDiscovery] Error loading creators:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...creators];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(creator =>
        creator.name.toLowerCase().includes(query) ||
        creator.bio?.toLowerCase().includes(query) ||
        creator.skills?.some(skill => skill.toLowerCase().includes(query)) ||
        creator.city?.toLowerCase().includes(query)
      );
    }

    // Content type filter
    if (filters.contentType !== 'all') {
      filtered = filtered.filter(creator =>
        creator.contentTypes?.includes(filters.contentType)
      );
    }

    // Location filter
    if (filters.location.trim()) {
      filtered = filtered.filter(creator =>
        creator.city?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Rating filter
    if (filters.minRating > 0) {
      filtered = filtered.filter(creator =>
        (creator.rating || 0) >= filters.minRating
      );
    }

    // Rate filter
    if (filters.maxRate < 1000) {
      filtered = filtered.filter(creator =>
        (creator.hourlyRate || 0) <= filters.maxRate
      );
    }

    // Availability filter
    if (filters.availability !== 'all') {
      filtered = filtered.filter(creator =>
        creator.availability === filters.availability
      );
    }

    setFilteredCreators(filtered);
  };

  const handleMessageCreator = async (creatorId: string, creatorName: string) => {
    try {
      const conversationId = await createConversation(
        [businessId, creatorId], 
        {
          [businessId]: businessName || 'Business',
          [creatorId]: creatorName || 'Creator'
        }
      );
      onNavigate('Chat', { conversationId });
    } catch (error) {
      console.error('[CreatorDiscovery] Error starting conversation:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };

  const getAvailabilityColor = (availability?: string) => {
    switch (availability) {
      case 'Available':
        return 'bg-green-100 text-green-700';
      case 'Busy':
        return 'bg-yellow-100 text-yellow-700';
      case 'Booked':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'photo':
      case 'photography':
        return <Camera className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'writing':
      case 'content':
        return <Edit3 className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading creators...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Discover Creators</h1>
            <p className="text-gray-600 text-sm mt-1">
              Find talented creators for your next collaboration
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          )}
        </div>

        {/* Search and Filter Bar */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search creators by name, skills, or location..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
              showFilters
                ? 'bg-purple-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
            Filters
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Content Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content Type
                </label>
                <select
                  value={filters.contentType}
                  onChange={(e) => setFilters({ ...filters, contentType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Types</option>
                  <option value="photo">Photography</option>
                  <option value="video">Video</option>
                  <option value="writing">Writing</option>
                  <option value="design">Design</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  placeholder="City name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Min Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Rating
                </label>
                <select
                  value={filters.minRating}
                  onChange={(e) => setFilters({ ...filters, minRating: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value={0}>Any Rating</option>
                  <option value={4}>4+ Stars</option>
                  <option value={4.5}>4.5+ Stars</option>
                </select>
              </div>

              {/* Availability */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Availability
                </label>
                <select
                  value={filters.availability}
                  onChange={(e) => setFilters({ ...filters, availability: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All</option>
                  <option value="Available">Available</option>
                  <option value="Busy">Busy</option>
                </select>
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                onClick={() => {
                  setFilters({
                    contentType: 'all',
                    location: '',
                    minRating: 0,
                    maxRate: 1000,
                    availability: 'all'
                  });
                  setSearchQuery('');
                }}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Counter */}
      <div className="px-6 py-3 bg-white border-b border-gray-200">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{filteredCreators.length}</span> creator
          {filteredCreators.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Creators Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredCreators.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No creators found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your filters or search query
            </p>
            <button
              onClick={() => {
                setFilters({
                  contentType: 'all',
                  location: '',
                  minRating: 0,
                  maxRate: 1000,
                  availability: 'all'
                });
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCreators.map((creator) => (
              <div
                key={creator.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Creator Header */}
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <img
                      src={creator.avatarUrl || `https://ui-avatars.com/api/?name=${creator.name}&background=6C4BFF&color=fff`}
                      alt={creator.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {creator.name}
                      </h3>
                      {creator.city && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                          <MapPin className="w-4 h-4" />
                          {creator.city}
                        </div>
                      )}
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-2 ${getAvailabilityColor(creator.availability)}`}>
                        {creator.availability || 'Available'}
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {creator.bio && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {creator.bio}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-4 text-sm">
                    {creator.rating && creator.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="font-medium">{creator.rating.toFixed(1)}</span>
                      </div>
                    )}
                    {creator.collabsCompleted && creator.collabsCompleted > 0 && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>{creator.collabsCompleted} collabs</span>
                      </div>
                    )}
                    {creator.creatorLevel && (
                      <div className="flex items-center gap-1 text-purple-600">
                        <Award className="w-4 h-4" />
                        <span>Level {creator.creatorLevel}</span>
                      </div>
                    )}
                  </div>

                  {/* Skills */}
                  {creator.skills && creator.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {creator.skills.slice(0, 3).map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-lg font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                      {creator.skills.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                          +{creator.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Rate & Response Time */}
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4 pb-4 border-b border-gray-100">
                    {creator.hourlyRate && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span>${creator.hourlyRate}/hr</span>
                      </div>
                    )}
                    {creator.responseTime && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{creator.responseTime}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMessageCreator(creator.id, creator.name)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Message
                    </button>
                    <button
                      onClick={() => setSelectedCreator(creator)}
                      className="flex-1 px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-medium"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Creator Detail Modal (optional - for future enhancement) */}
      {selectedCreator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{selectedCreator.name}</h2>
                <button
                  onClick={() => setSelectedCreator(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <img
                  src={selectedCreator.avatarUrl || `https://ui-avatars.com/api/?name=${selectedCreator.name}&background=6C4BFF&color=fff`}
                  alt={selectedCreator.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
                <div>
                  {selectedCreator.city && (
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <MapPin className="w-5 h-5" />
                      {selectedCreator.city}
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    {selectedCreator.rating && selectedCreator.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-5 h-5 text-yellow-500 fill-current" />
                        <span className="font-semibold">{selectedCreator.rating.toFixed(1)}</span>
                      </div>
                    )}
                    {selectedCreator.collabsCompleted && (
                      <span className="text-gray-600">
                        {selectedCreator.collabsCompleted} collaborations completed
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {selectedCreator.bio && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                  <p className="text-gray-600">{selectedCreator.bio}</p>
                </div>
              )}

              {selectedCreator.skills && selectedCreator.skills.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCreator.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    handleMessageCreator(selectedCreator.id, selectedCreator.name);
                    setSelectedCreator(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
                >
                  <MessageCircle className="w-5 h-5" />
                  Send Message
                </button>
                {selectedCreator.portfolioUrl && (
                  <a
                    href={selectedCreator.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    <Briefcase className="w-5 h-5" />
                    Portfolio
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
