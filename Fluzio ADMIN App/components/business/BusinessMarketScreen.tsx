/**
 * Business Partners Screen
 * Editorial professional browsing interface
 */

import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { User } from '../../types';
import { getCreatorsByCity, getUserById } from '../../services/userService';
import { CreatorProfileView } from './CreatorProfileView';

interface BusinessMarketScreenProps {
  user: User;
  onNavigate: (route: string) => void;
}

interface ServiceProvider {
  id: string;
  name: string;
  role: string;
  rawRoles: string[];
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

export const BusinessMarketScreen: React.FC<BusinessMarketScreenProps> = ({
  user,
  onNavigate
}) => {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<string>('Photographer');
  const [locationFilter, setLocationFilter] = useState<string>('Germany');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<any>(null);

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
          const formattedRole = primaryRole.split('_').map((w: string) => 
            w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          
          return {
            id: creator.id,
            name: creator.name,
            role: formattedRole,
            rawRoles: roles, // Store raw roles for filtering
            avatar: creator.avatarUrl || creator.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name)}&background=e5e7eb&color=1f2937&size=128`,
            availability: creator.creator?.availability === 'open' ? 'available_now' : 
                         creator.creator?.availability === 'busy' ? 'busy' : 'available_soon',
            description: creator.bio || `Experienced ${formattedRole.toLowerCase()}`,
            specialization: roles.slice(0, 2).map((r: string) => 
              r.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
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

  const filteredProviders = providers.filter(provider => {
    return provider.role === activeRole;
  });

  const availableCount = filteredProviders.length;

  // Show profile view if creator selected
  if (selectedCreator) {
    return (
      <CreatorProfileView
        creator={selectedCreator}
        onBack={() => setSelectedCreator(null)}
        onAddToProject={() => {
          onNavigate(`/business/projects?addPartner=${selectedCreator.id}`);
        }}
        onMessage={() => {
          onNavigate(`/inbox?userId=${selectedCreator.id}`);
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Filter Panel Modal */}
      {showFilters && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowFilters(false)}>
          <div 
            className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              {/* Filter Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Filters & Sort</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Filter Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Role Filter */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Role</h3>
                  <div className="space-y-2">
                    {['Photographer', 'Videographer', 'Model', 'Content Creator', 'Graphic Designer'].map((role) => (
                      <button
                        key={role}
                        onClick={() => setActiveRole(role)}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${
                          activeRole === role
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location Filter */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Location</h3>
                  <div className="space-y-2">
                    {['Germany', 'Europe', 'Worldwide'].map((location) => (
                      <button
                        key={location}
                        onClick={() => setLocationFilter(location)}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${
                          locationFilter === location
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {location}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Apply Button */}
              <div className="p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowFilters(false)}
                  className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 pt-6 pb-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-4xl font-semibold text-gray-900 mb-1">Partners</h1>
            <p className="text-base text-gray-600">
              Select professionals for your project
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-900 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters & Sort
          </button>
        </div>

        {/* Active Filter Summary */}
        <div className="mb-6">
          <div className="inline-block px-4 py-2.5 bg-gray-100 rounded-full">
            <span className="text-sm text-gray-900 font-medium">
              <span className="font-semibold">Role</span> {activeRole} · {locationFilter} · {availableCount} available
            </span>
          </div>
        </div>
      </div>

      {/* Professional Grid */}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-3">
          {filteredProviders.map((provider) => (
            <button
              key={provider.id}
              onClick={() => setSelectedCreator(provider)}
              className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 group"
            >
              {/* Background Image */}
              <img
                src={provider.avatar}
                alt={provider.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              
              {/* Text Overlay - Bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 via-black/40 to-transparent">
                <h3 className="text-white text-xl font-semibold mb-1 tracking-tight">
                  {provider.name}
                </h3>
                <p className="text-white/95 text-sm font-medium">
                  {provider.role} · {provider.location}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Empty State */}
        {filteredProviders.length === 0 && (
          <div className="text-center py-20">
            <p className="text-base text-gray-900 font-medium mb-1.5">
              No {activeRole?.toLowerCase()}s found in {locationFilter}
            </p>
            <p className="text-sm text-gray-500">
              Try expanding location or adjusting filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
