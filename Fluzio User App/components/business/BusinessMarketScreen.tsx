/**
 * Business Market Screen
 * Find and hire local service providers (creators) for your business
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  CheckCircle,
  Clock,
  Heart,
  Users,
  Briefcase,
  Award
} from 'lucide-react';
import { User } from '../../types';
import { getCreatorsByCity, getUserById } from '../../services/userService';

interface BusinessMarketScreenProps {
  user: User;
  onNavigate: (route: string) => void;
}

interface ServiceProvider {
  id: string;
  name: string;
  role: string;
  avatar: string;
  availability: 'available_now' | 'available_soon' | 'busy';
  description: string;
  specialization: string;
  badges?: string[];
  taskCount?: { completed: number; total: number };
  location?: string;
  rating?: number;
  saved?: boolean;
}



const serviceCategories = [
  'Photography',
  'Videography',
  'Modeling',
  'Content Creation',
  'Social Media',
  'Graphic Design'
];

export const BusinessMarketScreen: React.FC<BusinessMarketScreenProps> = ({
  user,
  onNavigate
}) => {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [savedProviders, setSavedProviders] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadProviders();
  }, [user.currentCity]);

  const loadProviders = async () => {
    try {
      setLoading(true);
      
      // Fetch creators from the user's city
      const city = user.currentCity || user.address?.city || 'Munich';
      console.log('[BusinessMarket] Fetching creators for city:', city);
      const creators = await getCreatorsByCity(city);
      console.log('[BusinessMarket] Found creators:', creators.length, creators);
      
      // Convert to service providers
      const serviceProviders: ServiceProvider[] = creators
        .filter(creator => creator.accountType === 'creator' && creator.creator?.roles)
        .map(creator => {
          const roles = creator.creator?.roles || [];
          const primaryRole = roles[0] || 'Creator';
          const formattedRole = primaryRole.split('_').map(w => 
            w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          
          return {
            id: creator.id,
            name: creator.name,
            role: formattedRole,
            avatar: creator.avatarUrl || 'https://via.placeholder.com/150',
            availability: creator.creator?.availability === 'open' ? 'available_now' : 
                         creator.creator?.availability === 'busy' ? 'busy' : 'available_soon',
            description: creator.bio || `Experienced ${formattedRole.toLowerCase()}`,
            specialization: roles.slice(0, 2).map(r => 
              r.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
            ).join(' & '),
            location: creator.currentCity || city,
            rating: 4.5 + Math.random(),
            badges: roles.slice(0, 2)
          };
        });
      
      console.log('[BusinessMarket] Converted to service providers:', serviceProviders.length);
      setProviders(serviceProviders);
    } catch (error) {
      console.error('[BusinessMarket] Error loading providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityBadge = (availability: string) => {
    switch (availability) {
      case 'available_now':
        return {
          text: 'Available now',
          icon: CheckCircle,
          color: 'bg-green-100 text-green-700 border-green-200'
        };
      case 'available_soon':
        return {
          text: 'Available soon',
          icon: Clock,
          color: 'bg-orange-100 text-orange-700 border-orange-200'
        };
      default:
        return {
          text: 'Busy',
          icon: Clock,
          color: 'bg-gray-100 text-gray-600 border-gray-200'
        };
    }
  };

  const toggleSave = (providerId: string) => {
    setSavedProviders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(providerId)) {
        newSet.delete(providerId);
      } else {
        newSet.add(providerId);
      }
      return newSet;
    });
  };

  const filteredProviders = providers.filter(provider => {
    const matchesSearch = !searchQuery || 
      provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !activeCategory || 
      provider.role.toLowerCase().includes(activeCategory.toLowerCase());
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white pb-24">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-[#1E0E62] mb-2">Market</h1>
          <p className="text-gray-600 flex items-center justify-center gap-1">
            Find and hire local service providers<br />for your business
            <button className="text-purple-600 hover:text-purple-700">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </button>
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="What type of service do you need?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700"
          />
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {serviceCategories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(activeCategory === category ? null : category)}
              className={`px-6 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                activeCategory === category
                  ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                  : 'bg-purple-50 text-gray-700 hover:bg-purple-100'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Service Provider Cards */}
        <div className="space-y-4">
          {filteredProviders.map((provider) => {
            const availabilityBadge = getAvailabilityBadge(provider.availability);
            const AvailabilityIcon = availabilityBadge.icon;
            const isSaved = savedProviders.has(provider.id);

            return (
              <div
                key={provider.id}
                className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all"
              >
                {/* Header with Avatar and Info */}
                <div className="flex gap-4 mb-4">
                  <img
                    src={provider.avatar}
                    alt={provider.name}
                    className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-[#1E0E62] mb-1">
                      {provider.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">{provider.role}</p>
                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${availabilityBadge.color}`}>
                      <AvailabilityIcon className="w-3.5 h-3.5" />
                      {availabilityBadge.text}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                  {provider.description}
                </p>

                {/* Badges and Actions */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {provider.badges?.map((badge, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200"
                      >
                        {badge}
                      </span>
                    ))}
                    {provider.taskCount && (
                      <span className="text-xs text-gray-500">
                        {provider.taskCount.completed}/{provider.taskCount.total} tasks
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => onNavigate(`/creator/${provider.id}`)}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-2xl hover:shadow-lg transition-all"
                  >
                    View Profile
                  </button>
                </div>

                {/* Save for Later */}
                <button
                  onClick={() => toggleSave(provider.id)}
                  className="w-full mt-3 flex items-center justify-center gap-2 text-gray-600 hover:text-purple-600 py-2 text-sm font-medium transition-colors"
                >
                  <Heart className={`w-4 h-4 ${isSaved ? 'fill-purple-600 text-purple-600' : ''}`} />
                  {isSaved ? 'Saved for future projects' : 'Save for future projects'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredProviders.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No service providers found</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};
