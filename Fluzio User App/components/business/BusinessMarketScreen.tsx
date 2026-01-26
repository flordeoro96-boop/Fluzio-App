/**
 * Partners Screen (formerly Business Market)
 * Find and select professionals for your project
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  SlidersHorizontal,
  MapPin,
  Star,
  Zap,
  Gem,
  Users,
  CheckCircle
} from 'lucide-react';
import { User } from '../../types';
import { getCreatorsByCity } from '../../services/userService';

interface BusinessMarketScreenProps {
  user: User;
  onNavigate: (route: string) => void;
}

type ProfessionalRole = 
  | 'photographer' 
  | 'videographer' 
  | 'model' 
  | 'graphic_designer' 
  | 'social_media_creator' 
  | 'makeup_artist' 
  | 'stylist';

interface Professional {
  id: string;
  name: string;
  role: ProfessionalRole;
  avatar: string;
  location: string;
  verified?: boolean;
  fastResponder?: boolean;
  premium?: boolean;
  rating?: number;
}

const ROLE_OPTIONS: { value: ProfessionalRole; label: string }[] = [
  { value: 'photographer', label: 'Photographer' },
  { value: 'videographer', label: 'Videographer' },
  { value: 'model', label: 'Model' },
  { value: 'graphic_designer', label: 'Graphic Designer' },
  { value: 'social_media_creator', label: 'Social Media Creator' },
  { value: 'makeup_artist', label: 'Makeup Artist' },
  { value: 'stylist', label: 'Stylist' }
];

const ROLE_LABELS: Record<ProfessionalRole, string> = {
  photographer: 'Photographer',
  videographer: 'Videographer',
  model: 'Model',
  graphic_designer: 'Graphic Designer',
  social_media_creator: 'Social Media Creator',
  makeup_artist: 'Makeup Artist',
  stylist: 'Stylist'
};

export const BusinessMarketScreen: React.FC<BusinessMarketScreenProps> = ({
  user,
  onNavigate
}) => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRole, setSelectedRole] = useState<ProfessionalRole>('photographer');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [countryFilter, setCountryFilter] = useState<string>('Germany');

  useEffect(() => {
    loadProfessionals();
  }, [selectedRole, user.currentCity]);

  const loadProfessionals = async () => {
    try {
      setLoading(true);
      
      const city = user.currentCity || user.address?.city || 'Munich';
      console.log('[Partners] Loading creators from city:', city);
      const creators = await getCreatorsByCity(city);
      console.log('[Partners] Found creators:', creators.length);
      
      // Map role names to our professional roles
      const roleMap: Record<string, ProfessionalRole> = {
        'photographer': 'photographer',
        'videographer': 'videographer',
        'model': 'model',
        'graphic_designer': 'graphic_designer',
        'social_media_creator': 'social_media_creator',
        'makeup_artist': 'makeup_artist',
        'stylist': 'stylist'
      };
      
      const mappedProfessionals: Professional[] = creators
        .filter(creator => {
          // Check account type
          if (creator.accountType !== 'creator') {
            console.log('[Partners] Skipping non-creator:', creator.id, creator.accountType);
            return false;
          }
          
          // Get roles from multiple possible locations
          const roles = creator.creator?.roles || 
                       (creator.creator as any)?.role ? [(creator.creator as any).role] : 
                       creator.category ? [creator.category] : [];
          
          if (!roles || roles.length === 0) {
            console.log('[Partners] Creator has no roles:', creator.id, creator.name);
            return false;
          }
          
          console.log('[Partners] Creator roles:', creator.name, roles);
          
          // Check if creator has the selected role
          const creatorRoles = roles.map(r => r.toLowerCase().replace(/\s+/g, '_'));
          const matches = creatorRoles.some(r => 
            r === selectedRole || 
            roleMap[r] === selectedRole ||
            r.includes(selectedRole.replace('_', '')) ||
            selectedRole.includes(r)
          );
          
          console.log('[Partners] Role match for', creator.name, ':', matches, 'Selected:', selectedRole, 'Has:', creatorRoles);
          return matches;
        })
        .map(creator => ({
          id: creator.id,
          name: creator.name,
          role: selectedRole,
          avatar: creator.photoUrl || creator.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name)}&background=6C4BFF&color=fff`,
          location: creator.currentCity || city,
          verified: creator.isVerified || false,
          fastResponder: false,
          premium: false,
          rating: creator.rating || 5.0
        }));
      
      console.log('[Partners] Mapped professionals:', mappedProfessionals.length);
      setProfessionals(mappedProfessionals);
    } catch (error) {
      console.error('[Partners] Error loading professionals:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProfessionals = professionals.filter(prof => {
    if (locationFilter && !prof.location.toLowerCase().includes(locationFilter.toLowerCase())) {
      return false;
    }
    return true;
  });

  const availableCount = filteredProfessionals.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Partners</h1>
            <p className="text-gray-600">Select professionals for your project</p>
          </div>
          <button
            onClick={() => setShowFilters(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <SlidersHorizontal className="w-5 h-5" />
            Filters & Sort
          </button>
        </div>

        {/* Current Filter Display */}
        <div className="mt-4 flex items-center gap-2 text-sm">
          <span className="font-semibold text-gray-900">Role</span>
          <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg font-medium">
            {ROLE_LABELS[selectedRole]}
          </span>
          <span className="text-gray-400">·</span>
          <span className="text-gray-600">{countryFilter}</span>
          <span className="text-gray-400">·</span>
          <span className="text-gray-600 font-medium">{availableCount} available</span>
        </div>
      </div>

      {/* Professionals Grid */}
      <div className="px-6">
        <div className="grid grid-cols-2 gap-4">
          {filteredProfessionals.map((professional) => (
            <div
              key={professional.id}
              className="group relative rounded-2xl overflow-hidden bg-gray-100 cursor-pointer hover:shadow-xl transition-all"
              onClick={() => onNavigate(`/creator/${professional.id}`)}
            >
              {/* Professional Image */}
              <div className="aspect-[3/4] relative overflow-hidden">
                <img
                  src={professional.avatar}
                  alt={professional.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Badges Overlay */}
                <div className="absolute top-3 right-3 flex flex-col gap-2">
                  {professional.verified && (
                    <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-lg" title="Verified">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    </div>
                  )}
                  {professional.fastResponder && (
                    <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-lg" title="Fast Responder">
                      <Zap className="w-4 h-4 text-blue-500 fill-blue-500" />
                    </div>
                  )}
                  {professional.premium && (
                    <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-lg" title="Premium">
                      <Gem className="w-4 h-4 text-purple-500 fill-purple-500" />
                    </div>
                  )}
                </div>

                {/* Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
                  <h3 className="text-white font-bold text-lg mb-1">{professional.name}</h3>
                  <p className="text-white/90 text-sm mb-1">{ROLE_LABELS[professional.role]}</p>
                  <div className="flex items-center gap-1 text-white/80 text-sm">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{professional.location}</span>
                  </div>
                </div>

                {/* Hover CTA */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="space-y-2">
                    <button className="w-full bg-white text-gray-900 font-semibold py-2 px-6 rounded-lg hover:bg-gray-100 transition-colors">
                      View profile
                    </button>
                    <button className="w-full bg-purple-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-purple-700 transition-colors">
                      Add to project
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProfessionals.length === 0 && (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No {ROLE_LABELS[selectedRole].toLowerCase()}s found in {locationFilter || countryFilter}
            </h3>
            <p className="text-gray-600">
              Try expanding location or adjusting filters
            </p>
          </div>
        )}
      </div>

      {/* Filters Drawer */}
      {showFilters && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center md:justify-center">
          <div className="bg-white w-full md:max-w-2xl md:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Filters & Sort</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Role Selection (MANDATORY) */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-bold text-gray-900">Role</h3>
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded">REQUIRED</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">Select exactly one role</p>
                <div className="space-y-2">
                  {ROLE_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedRole === option.value
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="relative">
                        <input
                          type="radio"
                          name="role"
                          value={option.value}
                          checked={selectedRole === option.value}
                          onChange={(e) => setSelectedRole(e.target.value as ProfessionalRole)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedRole === option.value
                            ? 'border-purple-500 bg-purple-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedRole === option.value && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                      </div>
                      <span className="font-medium text-gray-900">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Location Filters */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Location</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <input
                      type="text"
                      value={countryFilter}
                      onChange={(e) => setCountryFilter(e.target.value)}
                      placeholder="e.g., Germany"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      placeholder="e.g., Munich"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-gray-300">
                    <input type="checkbox" className="w-5 h-5 text-purple-600 rounded" />
                    <span className="font-medium text-gray-900">Remote / Worldwide</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setLocationFilter('');
                  setCountryFilter('Germany');
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => {
                  setShowFilters(false);
                  loadProfessionals();
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
