import React, { useState, useEffect } from 'react';
import { User, ServiceProvider } from '../types';
import { Camera, Video, Palette, PenTool, Share2, TrendingUp, Star, MapPin, Clock, Search, Filter, Loader2 } from 'lucide-react';
import { db } from '../services/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

interface ServiceMarketplaceProps {
  user: User;
}

const SERVICE_CATEGORIES = [
  { id: 'PHOTOGRAPHY', icon: Camera, label: 'Photography', color: 'from-blue-500 to-cyan-500' },
  { id: 'VIDEOGRAPHY', icon: Video, label: 'Videography', color: 'from-purple-500 to-pink-500' },
  { id: 'DESIGN', icon: Palette, label: 'Graphic Design', color: 'from-orange-500 to-red-500' },
  { id: 'COPYWRITING', icon: PenTool, label: 'Copywriting', color: 'from-green-500 to-emerald-500' },
  { id: 'SOCIAL_MEDIA', icon: Share2, label: 'Social Media', color: 'from-indigo-500 to-purple-500' },
  { id: 'MARKETING', icon: TrendingUp, label: 'Marketing', color: 'from-pink-500 to-rose-500' },
];

const AVAILABILITY_LABELS = {
  IMMEDIATE: { label: 'Available Now', color: 'bg-green-100 text-green-700' },
  WITHIN_WEEK: { label: 'Within a Week', color: 'bg-yellow-100 text-yellow-700' },
  BOOKED: { label: 'Fully Booked', color: 'bg-red-100 text-red-700' }
};

export const ServiceMarketplace: React.FC<ServiceMarketplaceProps> = ({ user }) => {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<ServiceProvider[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchProviders();
  }, [user.homeCity, user.temporaryLocation?.city]);

  useEffect(() => {
    applyFilters();
  }, [selectedCategory, searchQuery, providers]);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const city = user.temporaryLocation?.city || user.homeCity || user.city;
      
      const providersRef = collection(db, 'service_providers');
      // Fetch all providers and filter/sort in JavaScript to avoid index requirement
      const snapshot = await getDocs(providersRef);
      
      let providersList: ServiceProvider[] = [];
      snapshot.forEach(doc => {
        providersList.push({ id: doc.id, ...doc.data() } as ServiceProvider);
      });

      // Filter by city if specified
      if (city) {
        providersList = providersList.filter(p => p.city === city);
      }

      // Sort by rating descending
      providersList.sort((a, b) => (b.rating || 0) - (a.rating || 0));

      setProviders(providersList);
      setFilteredProviders(providersList);
    } catch (error) {
      console.error('Error fetching service providers:', error);
      // For demo, show mock data
      setProviders(getMockProviders());
      setFilteredProviders(getMockProviders());
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...providers];

    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.bio.toLowerCase().includes(query) ||
        p.skills.some(s => s.toLowerCase().includes(query))
      );
    }

    setFilteredProviders(filtered);
  };

  const getMockProviders = (): ServiceProvider[] => {
    const city = user.temporaryLocation?.city || user.homeCity || user.city || 'Barcelona';
    return [
      {
        id: '1',
        name: 'Maria Photography',
        category: 'PHOTOGRAPHY',
        bio: 'Professional product and lifestyle photographer specializing in e-commerce and social media content.',
        avatarUrl: 'https://i.pravatar.cc/150?img=1',
        portfolio: ['https://via.placeholder.com/300x200', 'https://via.placeholder.com/300x200'],
        priceRange: '€80-150/hour',
        city,
        rating: 4.9,
        reviewCount: 47,
        skills: ['Product Photography', 'Lifestyle Shoots', 'Social Media Content'],
        availability: 'WITHIN_WEEK',
        yearsExperience: 5,
        contactEmail: 'maria@example.com',
        website: 'https://mariaphotography.com',
        featured: true,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'VideoLab Studios',
        category: 'VIDEOGRAPHY',
        bio: 'Creative video production team for brands. Specializing in promotional videos, reels, and brand storytelling.',
        avatarUrl: 'https://i.pravatar.cc/150?img=2',
        portfolio: ['https://via.placeholder.com/300x200'],
        priceRange: '€200-500/day',
        city,
        rating: 4.8,
        reviewCount: 32,
        skills: ['Brand Videos', 'Social Media Reels', 'Event Coverage'],
        availability: 'IMMEDIATE',
        yearsExperience: 7,
        featured: true,
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Creative Pixels',
        category: 'DESIGN',
        bio: 'Graphic design studio for logos, branding, and social media graphics. Modern, minimalist style.',
        avatarUrl: 'https://i.pravatar.cc/150?img=3',
        portfolio: [],
        priceRange: '€50-100/hour',
        city,
        rating: 4.7,
        reviewCount: 28,
        skills: ['Logo Design', 'Branding', 'Social Media Graphics'],
        availability: 'WITHIN_WEEK',
        yearsExperience: 4,
        createdAt: new Date().toISOString()
      }
    ];
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Loading service providers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1E0E62] mb-1">Service Marketplace</h2>
          <p className="text-gray-600">Find professional services for your business</p>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {user.temporaryLocation?.city || user.homeCity || 'All Cities'}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, skills, or services..."
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-3 rounded-xl border-2 transition-colors ${
            showFilters ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Category Filter */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {SERVICE_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
              className={`p-4 rounded-2xl border-2 transition-all ${
                isSelected
                  ? 'border-purple-500 bg-purple-50 scale-105'
                  : 'border-gray-200 hover:border-purple-300 hover:scale-102'
              }`}
            >
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${cat.color} flex items-center justify-center mx-auto mb-2`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-xs font-bold text-center text-[#1E0E62]">{cat.label}</div>
            </button>
          );
        })}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {filteredProviders.length} {filteredProviders.length === 1 ? 'provider' : 'providers'} found
        </p>
        {selectedCategory && (
          <button
            onClick={() => setSelectedCategory(null)}
            className="text-sm text-purple-600 font-bold hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Provider List */}
      {filteredProviders.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="font-bold text-lg text-gray-900 mb-2">No Providers Found</h3>
          <p className="text-gray-600">
            Try adjusting your search or category filters
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProviders.map((provider) => (
            <ServiceProviderCard key={provider.id} provider={provider} />
          ))}
        </div>
      )}
    </div>
  );
};

// Service Provider Card Component
const ServiceProviderCard: React.FC<{ provider: ServiceProvider }> = ({ provider }) => {
  const availabilityInfo = AVAILABILITY_LABELS[provider.availability];
  const category = SERVICE_CATEGORIES.find(c => c.id === provider.category);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-purple-300 transition-all duration-300">
      {/* Header with Avatar */}
      <div className="p-5 pb-0">
        <div className="flex items-start gap-3 mb-4">
          <img
            src={provider.avatarUrl}
            alt={provider.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-purple-100"
          />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg text-[#1E0E62] mb-1">{provider.name}</h3>
                <div className="flex items-center gap-2 text-sm">
                  {category && (
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium">
                      {category.label}
                    </span>
                  )}
                </div>
              </div>
              {provider.featured && (
                <span className="text-lg">⭐</span>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        <p className="text-sm text-gray-700 leading-relaxed mb-4 line-clamp-2">
          {provider.bio}
        </p>

        {/* Skills */}
        <div className="flex gap-1 flex-wrap mb-4">
          {provider.skills.slice(0, 3).map((skill, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-1 mb-1">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="font-bold text-sm">{provider.rating}</span>
            <span className="text-xs text-gray-500">({provider.reviewCount})</span>
          </div>
          <div className="text-xs text-gray-600">Rating</div>
        </div>
        <div>
          <div className={`px-2 py-1 rounded-full text-xs font-bold ${availabilityInfo.color} mb-1 inline-flex items-center gap-1`}>
            <Clock className="w-3 h-3" />
            {availabilityInfo.label}
          </div>
        </div>
      </div>

      {/* Price & CTA */}
      <div className="p-5 border-t border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs text-gray-500 mb-1">Starting at</div>
            <div className="font-bold text-lg text-[#1E0E62]">{provider.priceRange}</div>
          </div>
          {provider.yearsExperience && (
            <div className="text-right">
              <div className="text-xs text-gray-500">Experience</div>
              <div className="font-bold text-sm">{provider.yearsExperience}+ years</div>
            </div>
          )}
        </div>
        <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all">
          View Profile & Contact
        </button>
      </div>
    </div>
  );
};
