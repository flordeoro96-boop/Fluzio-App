
import React, { useState, useEffect, useRef } from 'react';
import { User, Mission, UserRole, SubscriptionLevel } from '../types';
import { store } from '../services/mockStore';
import { getMissionsForUser, getActiveMissions, getMissionById } from '../services/missionService';
import { applyToMission } from '../src/services/participationService';
import { getUsersByRole } from '../services/userService';
import { Button } from './Common';
import { Map, List, Search, Plane, ArrowRight, Gift, Star, Heart, Phone, Navigation, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MissionDetailScreen } from './MissionDetailScreen';
import { MissionsMapView } from './MissionsMapView';
import { calculateDistance, formatDistance, estimateWalkTime, useGeolocation } from '../hooks/useLocation';
import { getUserBehavior, getPersonalizedRadius, updateWalkingRadius, UserBehavior } from '../services/userBehaviorService';
import { SkeletonBusinessCard } from './Skeleton';
import { CustomerBusinessProfile } from './CustomerBusinessProfile';
import './ExploreScreen.css';

declare global {
  interface Window {
    L: any;
  }
}

// Business Card Component to avoid hook violations
const BusinessCard: React.FC<{
  biz: User & { distance?: number; missionCount?: number; totalPoints?: number };
  location?: { latitude: number; longitude: number; city?: string };
  favorites: Set<string>;
  toggleFavorite: (e: React.MouseEvent, id: string) => void;
  onSelect: (biz: User) => void;
  isBusinessOpen: (hours?: { [key: string]: string }) => { open: boolean; hours: string } | null;
  userId: string;
}> = ({ biz, location, favorites, toggleFavorite, onSelect, isBusinessOpen, userId }) => {
    const { t } = useTranslation();
  const businessImages = [
    biz.photoUrl,
    biz.avatarUrl,
    biz.coverUrl,
    ...(biz.gallery || [])
  ].filter(Boolean);
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const hasMultipleImages = businessImages.length > 1;
  
  const handleSelect = () => {
    onSelect(biz);
    
    // Track visit and update walking radius
    if (location && biz.geo) {
      const distance = calculateDistance(location, biz.geo);
      updateWalkingRadius(userId, distance, biz.category || 'OTHER');
    }
  };
  
  return (
    <div className="aspect-[4/5] rounded-2xl bg-gray-100 relative overflow-hidden group cursor-pointer" onClick={handleSelect}>
      {/* Image with swipe support */}
      <div className="relative w-full h-full">
        <img 
          src={businessImages[currentImageIndex] || `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=500&fit=crop`} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          alt={biz.name}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=500&fit=crop`;
          }}
        />
        
        {/* Image navigation buttons */}
        {hasMultipleImages && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev === 0 ? businessImages.length - 1 : prev - 1));
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ‹
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev === businessImages.length - 1 ? 0 : prev + 1));
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ›
            </button>
            
            {/* Pagination dots */}
            <div className="absolute bottom-16 left-0 right-0 flex items-center justify-center gap-1">
              {businessImages.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === currentImageIndex 
                      ? 'bg-white w-4' 
                      : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* Mission Count & Total Points Badge */}
            {biz.missionCount && biz.missionCount > 0 && (
              <div className="bg-gradient-to-r from-[#FFB86C] to-[#FF8C00] px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-lg flex items-center gap-1">
                🎁 {biz.missionCount} • {biz.totalPoints || 0} pts
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Favorite Heart */}
            <button
              onClick={(e) => toggleFavorite(e, biz.id)}
              className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-transform"
            >
              <Heart 
                className={`w-4 h-4 ${favorites.has(biz.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
              />
            </button>
            
            {/* Distance Badge */}
            {location && biz.geo && (() => {
              const dist = calculateDistance(location, biz.geo);
              return (
                <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-[#1E0E62]">
                  {formatDistance(dist)}
                </div>
              );
            })()}
          </div>
        </div>
        
        {/* Business Info */}
        <span className="text-white font-bold text-sm line-clamp-1">{biz.name}</span>
        
        {/* Rating, Opening Hours & Category */}
        <div className="flex items-center justify-between mt-1 gap-2">
          <div className="flex-1 min-w-0">
            <span className="text-white/70 text-xs font-medium block truncate">{biz.businessType}</span>
            {(() => {
              const status = isBusinessOpen(biz.openingHours as Record<string, string>);
              if (status) {
                return (
                                    <span className={`text-xs font-bold ${status.open ? 'text-green-400' : 'text-red-400'}`}>
                                        {status.open ? `● ${t('explore.open')}` : `● ${t('explore.closed')}`}
                                    </span>
                );
              }
              return null;
            })()}
          </div>
          {biz.rating && (
            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full flex-shrink-0">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-white text-xs font-bold">{biz.rating.toFixed(1)}</span>
              {biz.reviewCount && <span className="text-white/60 text-xs">({biz.reviewCount})</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const ExploreScreen: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useTranslation();
    const [view, setView] = useState<'MAP' | 'LIST'>('MAP');
    const [contentType, setContentType] = useState<'businesses' | 'missions'>('businesses');
    const [city, setCity] = useState(user.currentCity || 'Berlin');
    const [viewingBusinessId, setViewingBusinessId] = useState<string | null>(null);
    const [showMissionDetail, setShowMissionDetail] = useState<Mission | null>(null);
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loadingMissions, setLoadingMissions] = useState(true);
    const [applyingToMission, setApplyingToMission] = useState<string | null>(null);
    const [allBusinesses, setAllBusinesses] = useState<User[]>([]);
    const [loadingBusinesses, setLoadingBusinesses] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [maxDistance, setMaxDistance] = useState<number>(50); // km
    const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'missions' | 'newest'>('distance');
    const [favorites, setFavorites] = useState<Set<string>>(new Set()); // Business IDs
    const [showFilterDrawer, setShowFilterDrawer] = useState(false);
    const [showOnlyOpen, setShowOnlyOpen] = useState(false);
    const [minRating, setMinRating] = useState(0);
    const [isScrolled, setIsScrolled] = useState(false);
    const [userBehavior, setUserBehavior] = useState<UserBehavior | null>(null);
    const [smartRadiusEnabled, setSmartRadiusEnabled] = useState(true);
    const { location } = useGeolocation();
    
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);

    // Load user behavior and set smart radius
    useEffect(() => {
        const loadBehavior = async () => {
            if (user.id) {
                const behavior = await getUserBehavior(user.id);
                setUserBehavior(behavior);
                
                // Set smart radius based on behavior if enabled
                if (smartRadiusEnabled && behavior) {
                    const personalizedRadius = getPersonalizedRadius(behavior, selectedCategory !== 'All' ? selectedCategory : undefined);
                    const radiusInKm = Math.round(personalizedRadius / 1000); // Convert meters to km
                    setMaxDistance(Math.max(1, Math.min(50, radiusInKm))); // Between 1-50km
                }
            }
        };
        loadBehavior();
    }, [user.id, selectedCategory, smartRadiusEnabled]);

    // Load businesses from Firestore
    useEffect(() => {
        const loadBusinesses = async () => {
            setLoadingBusinesses(true);
            try {
                const firestoreBusinesses = await getUsersByRole('BUSINESS', user.id, 100);
                
                // Map SearchableUser to full User type
                // Filter out aspiring businesses (people who want to open a business but haven't yet)
                const businesses = firestoreBusinesses
                    .filter(b => !b.isAspiringBusiness) // Exclude aspiring businesses from customer search
                    .map(b => {
                        // Handle location field which can be string or object
                        const locationStr = typeof b.location === 'string' 
                            ? b.location 
                            : (b.location as any)?.city || '';
                        
                        return {
                            ...b,
                            bio: b.bio || '',
                            role: UserRole.BUSINESS,
                            points: 0,
                            level: 1,
                            badges: [],
                            socialLinks: {},
                            missionsCompleted: 0,
                            subscriptionLevel: b.subscriptionLevel || 'FREE',
                            avatarUrl: b.photoUrl || `https://source.unsplash.com/random/200x200/?business&sig=${b.id}`,
                            coverUrl: `https://source.unsplash.com/random/800x400/?${b.category || 'business'}&sig=${b.id}`,
                            createdAt: new Date().toISOString(),
                            location: locationStr
                        };
                    }) as User[];
                
                setAllBusinesses(businesses);
            } catch (error) {
                console.error('[ExploreScreen] Error loading businesses:', error);
                // Fallback to mock data if Firestore fails (also filter out aspiring businesses)
                setAllBusinesses(store.getUsers().filter(u => u.role === UserRole.BUSINESS && !u.isAspiringBusiness));
            } finally {
                setLoadingBusinesses(false);
            }
        };
        loadBusinesses();
    }, [user.id]);

    // Auto-switch to LIST view if there are online shops but no physical businesses nearby
    useEffect(() => {
        if (!loadingBusinesses && allBusinesses.length > 0) {
            const hasPhysical = allBusinesses.some(b => b.geo && (b.businessMode === 'PHYSICAL' || b.businessMode === 'HYBRID'));
            const hasOnline = allBusinesses.some(b => b.businessMode === 'ONLINE' || b.businessMode === 'HYBRID');
            
            // If there are online shops but no physical locations, default to LIST view
            if (hasOnline && !hasPhysical && view === 'MAP') {
                setView('LIST');
            }
        }
    }, [loadingBusinesses, allBusinesses, view]);

    // Get businesses and separate into physical locations and online shops
    
    // Physical businesses with locations (PHYSICAL or HYBRID with geo)
    const physicalBusinesses = allBusinesses.filter(u => u.geo && (u.businessMode === 'PHYSICAL' || u.businessMode === 'HYBRID'));
    
    // Apply category filter
    let filteredPhysical = selectedCategory !== 'All' 
        ? physicalBusinesses.filter(b => b.category === selectedCategory)
        : physicalBusinesses;
    
    // Apply subcategory filter
    if (selectedSubcategory !== 'All') {
        filteredPhysical = filteredPhysical.filter(b => 
            b.businessType?.toLowerCase().includes(selectedSubcategory.toLowerCase()) ||
            b.bio?.toLowerCase().includes(selectedSubcategory.toLowerCase()) ||
            b.name.toLowerCase().includes(selectedSubcategory.toLowerCase())
        );
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredPhysical = filteredPhysical.filter(b => 
            b.name.toLowerCase().includes(query) ||
            b.businessType?.toLowerCase().includes(query) ||
            b.category?.toLowerCase().includes(query) ||
            b.bio?.toLowerCase().includes(query)
        );
    }
    
    // Apply rating filter
    if (minRating > 0) {
        filteredPhysical = filteredPhysical.filter(b => (b.rating || 0) >= minRating);
    }
    
    // Apply "open now" filter
    if (showOnlyOpen) {
        filteredPhysical = filteredPhysical.filter(b => {
            const status = isBusinessOpen(b.openingHours as Record<string, string>);
            return status?.open === true;
        });
    }
    
    const businesses = location 
        ? filteredPhysical
            .map(biz => {
                const bizMissions = missions.filter(m => m.businessId === biz.id);
                const totalPoints = bizMissions.reduce((sum, m) => sum + (m.reward?.points || 0), 0);
                const distanceMeters = biz.geo ? calculateDistance(location, biz.geo) : Infinity;
                const distance = distanceMeters / 1000; // Convert meters to kilometers
                return {
                    ...biz,
                    distance,
                    missionCount: bizMissions.length,
                    totalPoints
                };
            })
            .filter(biz => biz.distance <= maxDistance)
            .sort((a, b) => {
                // Sort based on selected option
                switch(sortBy) {
                    case 'rating':
                        return (b.rating || 0) - (a.rating || 0);
                    case 'missions':
                        return b.missionCount - a.missionCount;
                    case 'newest':
                        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
                    case 'distance':
                    default:
                        return a.distance - b.distance;
                }
            })
        : filteredPhysical.map(biz => {
            const bizMissions = missions.filter(m => m.businessId === biz.id);
            const totalPoints = bizMissions.reduce((sum, m) => sum + (m.reward?.points || 0), 0);
            return {
                ...biz,
                distance: Infinity,
                missionCount: bizMissions.length,
                totalPoints
            };
        });
    
    console.log('[ExploreScreen] ✅ Final businesses after distance filter:', businesses.length);
    businesses.forEach(b => {
        console.log(`  ✅ ${b.name}: ${b.distance.toFixed(2)}km away`);
    });
    
    // Online shops - Filter by subscription tier and customer's country
    // Include ONLINE businesses and HYBRID businesses (HYBRID shows in both physical and online)
    let filteredOnline = allBusinesses.filter(u => u.businessMode === 'ONLINE' || u.businessMode === 'HYBRID');
    
    // Apply category filter to online shops
    if (selectedCategory !== 'All') {
        filteredOnline = filteredOnline.filter(b => b.category === selectedCategory);
    }
    
    // Filter online businesses by subscription tier and customer location
    filteredOnline = filteredOnline.filter(business => {
        const subscription = business.subscriptionLevel || 'FREE';
        const customerCountry = user.country || location?.city || 'Unknown';
        const businessTargetCountries = business.targetCountries || [business.country || 'Unknown'];
        
        // PLATINUM/PREMIUM/GOLD: Shown worldwide to all customers
        if (subscription === SubscriptionLevel.PLATINUM || subscription === SubscriptionLevel.GOLD) {
            return true;
        }
        
        // SILVER: Can target up to 3 countries
        if (subscription === 'SILVER') {
            return businessTargetCountries.slice(0, 3).includes(customerCountry);
        }
        
        // FREE: Only shown in their own country
        return businessTargetCountries[0] === customerCountry || business.country === customerCountry;
    });
    
    // Apply search to online shops
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredOnline = filteredOnline.filter(b => 
            b.name.toLowerCase().includes(query) ||
            b.businessType?.toLowerCase().includes(query) ||
            b.category?.toLowerCase().includes(query) ||
            b.bio?.toLowerCase().includes(query)
        );
    }
    
    const onlineShops = filteredOnline;

    // Load active missions from Firestore
    useEffect(() => {
        const loadMissions = async () => {
            setLoadingMissions(true);
            try {
                // Use personalized mission feed based on user interests and level
                const personalizedMissions = await getMissionsForUser(
                    user.id,
                    user.interests,
                    user.creatorLevel,
                    location ? { latitude: location.latitude, longitude: location.longitude } : undefined,
                    50
                );
                setMissions(personalizedMissions);
            } catch (error) {
                console.error('Error loading missions:', error);
                // Fallback to mock data
                setMissions(store.getMissions());
            } finally {
                setLoadingMissions(false);
            }
        };
        loadMissions();
    }, [user.id, user.interests, user.creatorLevel, location]);

    // Handle mission application
    const handleApplyToMission = async (missionId: string) => {
        setApplyingToMission(missionId);
        try {
            // First, get the mission to extract businessId
            const mission = await getMissionById(missionId);
            if (!mission || !mission.businessId) {
                alert('❌ Error: Mission not found or missing business information');
                setApplyingToMission(null);
                return;
            }
            
            // Apply to mission with businessId
            const result = await applyToMission(missionId, user.id, mission.businessId);
            if (result.success) {
                alert('✅ Successfully applied to mission! Business will review your application.');
                // Refresh missions
                const updatedMissions = await getActiveMissions();
                setMissions(updatedMissions);
            } else {
                alert('❌ Failed to apply: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error applying to mission:', error);
            alert('❌ An error occurred while applying to the mission');
        } finally {
            setApplyingToMission(null);
        }
    };

    // --- Leaflet Initialization ---
    useEffect(() => {
      if (view === 'MAP' && mapContainerRef.current && !mapInstanceRef.current && window.L) {
          // Initialize map centered on user's location or Berlin fallback
          const initialLat = location?.latitude || 52.5200;
          const initialLng = location?.longitude || 13.4050;
          const initialZoom = location ? 14 : 13;
          
          const map = window.L.map(mapContainerRef.current, {
              zoomControl: false,
              attributionControl: false
          }).setView([initialLat, initialLng], initialZoom);

          // Add Dark Mode Tiles (CartoDB Dark Matter) or Standard
          window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
              subdomains: 'abcd',
              maxZoom: 20
          }).addTo(map);

          // Add zoom control in bottom right corner
          window.L.control.zoom({
              position: 'bottomright'
          }).addTo(map);

          mapInstanceRef.current = map;

          // Fix map rendering issues
          setTimeout(() => {
              if (map) {
                  map.invalidateSize();
              }
          }, 100);

          // Add user's current location marker and radius circle if available
          if (location) {
              const userIcon = window.L.divIcon({
                  className: 'user-location-marker',
                  html: `
                    <div class="relative flex items-center justify-center w-16 h-16">
                        <div class="absolute inset-0 bg-blue-500 rounded-full opacity-20 animate-ping" style="animation-duration: 2s;"></div>
                        <div class="absolute inset-0 bg-blue-400 rounded-full opacity-30 animate-ping" style="animation-duration: 3s; animation-delay: 0.5s;"></div>
                        <div class="relative z-10 w-5 h-5 rounded-full bg-blue-500 border-3 border-white shadow-2xl" style="box-shadow: 0 0 20px rgba(59, 130, 246, 0.8), 0 0 40px rgba(59, 130, 246, 0.4);"></div>
                    </div>
                  `,
                  iconSize: [64, 64],
                  iconAnchor: [32, 32]
              });
              
              const userMarker = window.L.marker([location.latitude, location.longitude], {
                  icon: userIcon,
                  zIndexOffset: 1000
              }).addTo(map);
              
              userMarker.bindPopup(`<div class="text-center font-semibold"><div class="text-blue-600">📍 ${t('explore.youAreHere', { defaultValue: 'You are here' })}</div></div>`);
              
              // Add radius circle showing search area
              const radiusCircle = window.L.circle([location.latitude, location.longitude], {
                  radius: maxDistance * 1000, // Convert km to meters
                  color: '#00E5FF',
                  fillColor: '#00E5FF',
                  fillOpacity: 0.1,
                  weight: 2,
                  dashArray: '5, 10'
              }).addTo(map);
              
              // Store reference for updates
              if (!map._radiusCircle) {
                  map._radiusCircle = radiusCircle;
              }
          }

          mapInstanceRef.current = map;
      }

      return () => {
          // Cleanup only when component unmounts or view changes away from MAP
          if (view !== 'MAP' && mapInstanceRef.current) {
              try {
                  mapInstanceRef.current.remove();
                  mapInstanceRef.current = null;
              } catch (err) {
                  console.error('[ExploreScreen] Error cleaning up map:', err);
                  mapInstanceRef.current = null;
              }
          }
      };
    }, [view, loadingBusinesses]);

    // Add user location marker when location becomes available
    useEffect(() => {
        if (mapInstanceRef.current && location && view === 'MAP' && window.L) {
            const map = mapInstanceRef.current;
            
            // Remove old user marker if exists
            if (map._userMarker) {
                map.removeLayer(map._userMarker);
            }
            
            // Create prominent blue dot icon
            const userIcon = window.L.divIcon({
                className: 'user-location-marker',
                html: `
                  <div class="relative flex items-center justify-center w-16 h-16">
                      <div class="absolute inset-0 bg-blue-500 rounded-full opacity-20 animate-ping" style="animation-duration: 2s;"></div>
                      <div class="absolute inset-0 bg-blue-400 rounded-full opacity-30 animate-ping" style="animation-duration: 3s; animation-delay: 0.5s;"></div>
                      <div class="relative z-10 w-5 h-5 rounded-full bg-blue-500 border-3 border-white shadow-2xl" style="box-shadow: 0 0 20px rgba(59, 130, 246, 0.8), 0 0 40px rgba(59, 130, 246, 0.4);"></div>
                  </div>
                `,
                iconSize: [64, 64],
                iconAnchor: [32, 32]
            });
            
            const userMarker = window.L.marker([location.latitude, location.longitude], {
                icon: userIcon,
                zIndexOffset: 1000
            }).addTo(map);
            
            userMarker.bindPopup(`<div class="text-center font-semibold"><div class="text-blue-600">📍 ${t('explore.youAreHere', { defaultValue: 'You are here' })}</div></div>`);
            
            // Store reference for later updates/removal
            map._userMarker = userMarker;
            
            // Center map on user location (only on first location)
            if (!map._hasBeenCentered) {
                map.setView([location.latitude, location.longitude], 14, { animate: true });
                map._hasBeenCentered = true;
            }
            
            // Ensure map renders properly
            setTimeout(() => {
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.invalidateSize();
                }
            }, 100);
        }
    }, [location, view, t]);
    
    // Update radius circle when maxDistance changes
    useEffect(() => {
        if (mapInstanceRef.current && location && view === 'MAP' && window.L) {
            const map = mapInstanceRef.current;
            
            // Remove old circle if exists
            if (map._radiusCircle) {
                map.removeLayer(map._radiusCircle);
            }
            
            // Add new radius circle
            const radiusCircle = window.L.circle([location.latitude, location.longitude], {
                radius: maxDistance * 1000,
                color: '#00E5FF',
                fillColor: '#00E5FF',
                fillOpacity: 0.1,
                weight: 2,
                dashArray: '5, 10'
            }).addTo(map);
            
            map._radiusCircle = radiusCircle;
        }
    }, [maxDistance, location, view]);

    // Update map markers when businesses change
    useEffect(() => {
        if (mapInstanceRef.current && view === 'MAP' && window.L && !loadingBusinesses && businesses.length > 0) {
            console.log('[ExploreScreen] Adding markers for', businesses.length, 'businesses');
            
            // Clear existing marker layers (but keep tiles and user marker)
            mapInstanceRef.current.eachLayer((layer: any) => {
                // Only remove marker cluster groups, not tile layers or user location marker
                if (layer._childClusters || (layer.options && layer.options.icon && layer.options.icon.options && layer.options.icon.options.className === 'custom-pin')) {
                    mapInstanceRef.current.removeLayer(layer);
                }
            });

            // Custom Icons for businesses
            const createIcon = (isActive: boolean, avatarUrl: string) => {
                const pulseClass = isActive ? 'pin-pulse' : '';
                const borderClass = isActive ? 'border-[#00E5FF]' : 'border-white';
                
                return window.L.divIcon({
                    className: 'custom-pin',
                    html: `
                      <div class="relative flex items-center justify-center w-10 h-10">
                          ${isActive ? `<div class="absolute inset-0 bg-[#00E5FF] rounded-full opacity-50 ${pulseClass}"></div>` : ''}
                          <div class="relative z-10 w-10 h-10 rounded-full border-2 ${borderClass} bg-white overflow-hidden shadow-lg">
                              <img src="${avatarUrl}" class="w-full h-full object-cover" onerror="this.src='https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&h=100&fit=crop'" />
                          </div>
                      </div>
                    `,
                    iconSize: [40, 40],
                    iconAnchor: [20, 20]
                });
            };

            // Check if markerClusterGroup is available
            const useCluster = window.L.markerClusterGroup !== undefined;
            
            // Create marker cluster group or regular layer group
            const markers = useCluster ? window.L.markerClusterGroup({
                maxClusterRadius: 60,
                spiderfyOnMaxZoom: true,
                showCoverageOnHover: false,
                zoomToBoundsOnClick: true,
                iconCreateFunction: function(cluster: any) {
                    const count = cluster.getChildCount();
                    return window.L.divIcon({
                        html: `<div class="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[#00E5FF] to-[#6C4BFF] text-white font-bold text-sm shadow-xl border-2 border-white">${count}</div>`,
                        className: 'custom-cluster-icon',
                        iconSize: [48, 48]
                    });
                }
            }) : window.L.layerGroup();

            // Add Markers to cluster group
            let markerCount = 0;
            businesses.forEach(biz => {
                if (biz.geo) {
                    const missions = store.getMissionsByBusiness(biz.id);
                    const hasActive = missions.length > 0;

                    const marker = window.L.marker([biz.geo.latitude, biz.geo.longitude], {
                        icon: createIcon(hasActive, biz.avatarUrl || biz.photoUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&h=100&fit=crop')
                    });
                    
                    // Quick preview tooltip
                    const distance = location ? calculateDistance(location, biz.geo) : null;
                    const distanceText = distance ? formatDistance(distance) : '';
                    const missionText = missions.length > 0 ? `🎁 ${missions.length} mission${missions.length > 1 ? 's' : ''} • ${missions.reduce((sum, m) => sum + (m.reward?.points || 0), 0)} pts` : '';
                    
                    const tooltipContent = `
                        <div class="text-center">
                            <div class="font-bold text-gray-900 mb-1">${biz.name}</div>
                            <div class="text-xs text-gray-600">${biz.businessType || ''}</div>
                            ${distanceText ? `<div class="text-xs text-blue-600 font-semibold mt-1">📍 ${distanceText}</div>` : ''}
                            ${missionText ? `<div class="text-xs font-semibold text-orange-600 mt-1">${missionText}</div>` : ''}
                            ${biz.rating ? `<div class="text-xs text-yellow-600 mt-1">⭐ ${biz.rating.toFixed(1)}</div>` : ''}
                            <div class="text-xs text-gray-500 mt-1 italic">Click for details</div>
                        </div>
                    `;
                    
                    marker.bindTooltip(tooltipContent, {
                        direction: 'top',
                        offset: [0, -15],
                        opacity: 0.95,
                        className: 'custom-tooltip'
                    });

                    marker.on('click', () => {
                        setViewingBusinessId(biz.id);
                        // Center map slightly offset to accommodate bottom sheet
                        mapInstanceRef.current.setView([biz.geo!.latitude - 0.005, biz.geo!.longitude], 15, { animate: true });
                        
                        // Track visit and update walking radius
                        if (location && biz.geo) {
                            const distance = calculateDistance(location, biz.geo);
                            updateWalkingRadius(user.id, distance, biz.category || 'OTHER');
                        }
                    });
                    
                    markers.addLayer(marker);
                    markerCount++;
                }
            });
            
            console.log('[ExploreScreen] Added', markerCount, 'markers to map');
            
            // Add cluster group to map
            mapInstanceRef.current.addLayer(markers);
        }
    }, [businesses, view, loadingBusinesses, location, user.id]);

    const handleMissionClick = (m: Mission) => {
        setShowMissionDetail(m);
        setViewingBusinessId(null); // Close bottom sheet
    };

    const getDistanceInfo = (biz: User) => {
        if (!location || !biz.geo) return t('explore.unknownDistance', { defaultValue: 'Unknown distance' });
        const dist = calculateDistance(location, biz.geo);
        const time = estimateWalkTime(dist);
        return { dist: formatDistance(dist), time };
    };
    
    const isBusinessOpen = (openingHours?: { [key: string]: string }) => {
        if (!openingHours) return null;
        
        const now = new Date();
        const day = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];
        const hours = openingHours[day];
        
        if (!hours || hours.toLowerCase() === 'closed') return { open: false, hours: 'Closed' };
        
        // Simple check - if hours exist and not "closed", assume open during business hours
        const currentHour = now.getHours();
        const isLikelyOpen = currentHour >= 8 && currentHour < 22; // Simple heuristic
        
        return { open: isLikelyOpen, hours };
    };
    
    const toggleFavorite = (e: React.MouseEvent, businessId: string) => {
        e.stopPropagation(); // Prevent card click
        
        // Haptic feedback for mobile devices
        if ('vibrate' in navigator) {
            navigator.vibrate(10); // Very light tap
        }
        
        setFavorites(prev => {
            const newFavorites = new Set(prev);
            if (newFavorites.has(businessId)) {
                newFavorites.delete(businessId);
            } else {
                newFavorites.add(businessId);
            }
            // TODO: Persist to Firestore user preferences
            return newFavorites;
        });
    };
    
    // Haptic feedback helper
    const triggerHaptic = (pattern: number | number[] = 10) => {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    };
    
    // Subcategory definitions
    const subcategories: { [key: string]: string[] } = {
        'GASTRONOMY': ['All', 'Italian', 'Lebanese', 'Burger', 'Asian', 'Mexican', 'Pizza', 'Sushi', 'Vegan', 'Bakery', 'Cafe'],
        'FITNESS': ['All', 'Gym', 'Yoga', 'Pilates', 'CrossFit', 'Boxing', 'Dance', 'Personal Training', 'Outdoor'],
        'RETAIL': ['All', 'Fashion', 'Electronics', 'Books', 'Shoes', 'Accessories', 'Home Decor', 'Gifts', 'Sports Gear'],
        'BEAUTY': ['All', 'Hair Salon', 'Nail Salon', 'Spa', 'Barber', 'Makeup', 'Skincare', 'Massage'],
        'ENTERTAINMENT': ['All', 'Cinema', 'Theater', 'Music', 'Gaming', 'Arcade', 'Bowling', 'Karaoke', 'Comedy Club'],
        'WELLNESS': ['All', 'Meditation', 'Therapy', 'Sauna', 'Spa', 'Health Coaching', 'Acupuncture', 'Holistic'],
        'OTHER': ['All', 'Services', 'Education', 'Pet Care', 'Auto', 'Real Estate', 'Financial']
    };

    // Count active filters
    const activeFiltersCount = (selectedCategory !== 'All' ? 1 : 0) + (selectedSubcategory !== 'All' ? 1 : 0) + (showOnlyOpen ? 1 : 0) + (minRating > 0 ? 1 : 0);

    return (
        <div className="flex flex-col h-screen pb-24 relative overflow-hidden">
             
             {/* Content Type Toggle */}
             <div className="bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex bg-gray-100 rounded-xl p-1 max-w-md mx-auto">
                    <button
                        onClick={() => {
                            triggerHaptic(10);
                            setContentType('businesses');
                        }}
                        className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                            contentType === 'businesses'
                                ? 'bg-white text-gray-900 shadow-md'
                                : 'text-gray-600'
                        }`}
                    >
                        🏪 Businesses
                    </button>
                    <button
                        onClick={() => {
                            triggerHaptic(10);
                            setContentType('missions');
                        }}
                        className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                            contentType === 'missions'
                                ? 'bg-white text-gray-900 shadow-md'
                                : 'text-gray-600'
                        }`}
                    >
                        🎯 Missions
                    </button>
                </div>
             </div>
             
             {/* --- Premium Glass Morphism Filter Bar (Only for Businesses) --- */}
             {contentType === 'businesses' && (
             <div className={`fixed top-0 left-0 right-0 z-[1002] transition-all duration-300 ${
                 isScrolled ? 'py-2 px-3' : 'py-3 px-3'
             }`} style={{ marginTop: '60px' }}>
                <div className="max-w-screen-xl mx-auto">
                
                {/* Smart Radius Learning Indicator */}
                {smartRadiusEnabled && userBehavior && userBehavior.movementProfile?.averageDistance && (
                    <div className="mb-2 px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-full flex items-center gap-2 text-xs">
                        <span className="animate-pulse">🧠</span>
                        <span className="font-semibold text-indigo-700">
                            {t('explore.smartRadius')} • {t('explore.avgWalk', { distance: Math.round(userBehavior.movementProfile.averageDistance) })}
                        </span>
                    </div>
                )}
                
                {/* Glass Filter Bar - Premium Design */}
                <div 
                    className="bg-white backdrop-blur-2xl rounded-[22px] shadow-2xl border border-gray-200 p-3 transition-all duration-300"
                    style={{ 
                        boxShadow: '0 10px 40px rgba(0,0,0,0.15), 0 2px 12px rgba(0,0,0,0.08)',
                        backdropFilter: 'blur(20px) saturate(180%)'
                    }}
                >
                    <div className="flex items-center gap-2">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                            <input 
                                type="text" 
                                placeholder={t('explore.searchSpots')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-8 py-2 bg-white rounded-2xl text-sm text-gray-900 placeholder:text-gray-500 placeholder:font-medium outline-none border border-gray-200 focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/20 transition-all shadow-sm"
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#00E5FF] rounded-full transition-all"
                                >
                                    <span className="text-xs">✕</span>
                                </button>
                            )}
                        </div>
                        
                        {/* Compact Filter Pills */}
                        <div className="flex gap-2">
                            {/* Filters Button */}
                            <button
                                onClick={() => {
                                    triggerHaptic(15);
                                    setShowFilterDrawer(!showFilterDrawer);
                                }}
                                className={`relative px-3 py-2 rounded-2xl text-xs font-semibold transition-all whitespace-nowrap active:scale-95 shadow-sm ${
                                    activeFiltersCount > 0 
                                        ? 'bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white border border-transparent' 
                                        : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow-md'
                                }`}
                            >
                                🔽 {t('missions.filters')}
                                {activeFiltersCount > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 bg-white/30 text-white text-[10px] rounded-full font-bold">
                                        {activeFiltersCount}
                                    </span>
                                )}
                            </button>
                            
                            {/* Sort */}
                            <select
                                value={sortBy}
                                onChange={(e) => {
                                    triggerHaptic(10);
                                    setSortBy(e.target.value as any);
                                }}
                                className="px-3 py-2 bg-white rounded-2xl text-xs font-semibold text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all outline-none cursor-pointer active:scale-95"
                            >
                                <option value="distance">{t('explore.nearest')}</option>
                                <option value="rating">{t('explore.topRated')}</option>
                                <option value="missions">{t('explore.mostMissions')}</option>
                                <option value="newest">{t('explore.newBusinesses')}</option>
                            </select>
                            
                            {/* Distance */}
                            <select
                                value={maxDistance}
                                onChange={(e) => {
                                    triggerHaptic(10);
                                    setMaxDistance(Number(e.target.value));
                                }}
                                className="px-3 py-2 bg-white rounded-2xl text-xs font-semibold text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all outline-none cursor-pointer active:scale-95"
                            >
                                <option value={5}>📏 5km</option>
                                <option value={10}>📏 10km</option>
                                <option value={25}>📏 25km</option>
                                <option value={50}>📏 50km</option>
                                <option value={100}>📏 100km+</option>
                            </select>
                            
                            {/* Results Count */}
                            <div className="px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl text-xs font-bold text-gray-600 border border-gray-200 whitespace-nowrap">
                                🔢 {businesses.length}
                            </div>
                        </div>
                    </div>
                    
                    {/* Advanced Filter Drawer */}
                    {showFilterDrawer && (
                        <div className="mt-3 pt-3 border-t border-gray-200 space-y-3 animate-in slide-in-from-top duration-200">
                            {/* Categories */}
                            <div>
                                <div className="text-xs font-bold text-gray-500 mb-2">Categories</div>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { key: 'All', icon: '🌍', label: 'All' },
                                        { key: 'GASTRONOMY', icon: '🍽️', label: 'Food' },
                                        { key: 'FITNESS', icon: '💪', label: 'Fitness' },
                                        { key: 'RETAIL', icon: '🛍️', label: 'Retail' },
                                        { key: 'BEAUTY', icon: '💄', label: 'Beauty' },
                                        { key: 'ENTERTAINMENT', icon: '🎭', label: 'Fun' },
                                        { key: 'WELLNESS', icon: '🧘', label: 'Wellness' },
                                        { key: 'OTHER', icon: '📦', label: 'Other' }
                                    ].map(cat => (
                                        <button
                                            key={cat.key}
                                            onClick={() => {
                                                triggerHaptic(10);
                                                setSelectedCategory(cat.key);
                                                setSelectedSubcategory('All'); // Reset subcategory when category changes
                                            }}
                                            className={`px-3 py-1.5 rounded-2xl text-xs font-semibold transition-all border active:scale-95 ${
                                                selectedCategory === cat.key
                                                    ? 'bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white border-transparent shadow-md'
                                                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                            }`}
                                        >
                                            <span className="mr-1">{cat.icon}</span>
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Subcategories - Show when a category is selected */}
                            {selectedCategory !== 'All' && subcategories[selectedCategory] && (
                                <div>
                                    <div className="text-xs font-bold text-gray-500 mb-2">
                                        {selectedCategory === 'GASTRONOMY' ? '🍽️ Cuisine Type' :
                                         selectedCategory === 'FITNESS' ? '💪 Workout Type' :
                                         selectedCategory === 'RETAIL' ? '🛍️ Shop Type' :
                                         selectedCategory === 'BEAUTY' ? '💄 Service Type' :
                                         selectedCategory === 'ENTERTAINMENT' ? '🎭 Activity Type' :
                                         selectedCategory === 'WELLNESS' ? '🧘 Service Type' : '📦 Type'}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {subcategories[selectedCategory].map(sub => (
                                            <button
                                                key={sub}
                                                onClick={() => {
                                                    triggerHaptic(10);
                                                    setSelectedSubcategory(sub);
                                                }}
                                                className={`px-3 py-1.5 rounded-2xl text-xs font-semibold transition-all border active:scale-95 ${
                                                    selectedSubcategory === sub
                                                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-transparent shadow-md'
                                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                                }`}
                                            >
                                                {sub}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* Distance Slider */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-semibold text-gray-600">📏 Distance: {maxDistance}km</label>
                                    <button
                                        onClick={() => {
                                            setSmartRadiusEnabled(!smartRadiusEnabled);
                                            triggerHaptic(10);
                                        }}
                                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                                            smartRadiusEnabled
                                                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-transparent'
                                                : 'bg-white text-gray-600 border-gray-200'
                                        }`}
                                    >
                                        🧠 {smartRadiusEnabled ? 'SMART' : 'MANUAL'}
                                    </button>
                                </div>
                                {smartRadiusEnabled && userBehavior && (
                                    <div className="mb-2 px-2 py-1 bg-purple-50 border border-purple-200 rounded-lg text-[10px] text-purple-700">
                                        💡 Auto-adjusted based on your walking habits
                                    </div>
                                )}
                                <input 
                                    type="range" 
                                    min="5" 
                                    max="100" 
                                    step="5" 
                                    value={maxDistance}
                                    onChange={(e) => {
                                        setMaxDistance(Number(e.target.value));
                                        setSmartRadiusEnabled(false); // Disable smart mode when manually adjusted
                                    }}
                                    className="w-full h-1.5 bg-gray-200 rounded-full outline-none appearance-none"
                                    style={{
                                        background: `linear-gradient(to right, #00E5FF 0%, #00E5FF ${maxDistance}%, #E2E6EA ${maxDistance}%, #E2E6EA 100%)`
                                    }}
                                />
                            </div>
                            
                            {/* Smart Filters - Complete Set */}
                            <div className="space-y-2">
                                <div className="text-xs font-bold text-gray-500 mb-2">Quick Filters</div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setMinRating(minRating === 4.5 ? 0 : 4.5)}
                                        className={`px-3 py-1.5 rounded-2xl text-xs font-semibold transition-all border active:scale-95 ${
                                            minRating === 4.5
                                                ? 'bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white border-transparent shadow-md'
                                                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                        }`}
                                    >
                                        ⭐ Top Rated (4.5+)
                                    </button>
                                    <button
                                        onClick={() => setShowOnlyOpen(!showOnlyOpen)}
                                        className={`px-3 py-1.5 rounded-2xl text-xs font-semibold transition-all border active:scale-95 ${
                                            showOnlyOpen
                                                ? 'bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white border-transparent shadow-md'
                                                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                        }`}
                                    >
                                        🕐 Open Now
                                    </button>
                                    <button
                                        onClick={() => setMaxDistance(5)}
                                        className="px-3 py-1.5 rounded-2xl text-xs font-semibold bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all active:scale-95"
                                    >
                                        🎯 Near Me (&lt;5 min)
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSortBy('missions');
                                            setMinRating(4);
                                        }}
                                        className="px-3 py-1.5 rounded-2xl text-xs font-semibold bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all active:scale-95"
                                    >
                                        👥 Trending This Week
                                    </button>
                                    <button
                                        onClick={() => setSortBy('missions')}
                                        className="px-3 py-1.5 rounded-2xl text-xs font-semibold bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all active:scale-95"
                                    >
                                        💠 Exclusive to Beevvy
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSortBy('rating');
                                            setMinRating(4.5);
                                        }}
                                        className="px-3 py-1.5 rounded-2xl text-xs font-semibold bg-gradient-to-r from-amber-400 to-orange-500 text-white border-transparent hover:shadow-md transition-all active:scale-95"
                                    >
                                        ⭐ Editor's Picks
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                </div>
             </div>
             )}

             {/* --- Main View Content --- */}
             <div className="flex-1 relative bg-gray-100">
                 {contentType === 'missions' ? (
                     <MissionsMapView
                         missions={missions}
                         businesses={allBusinesses}
                         userLocation={location}
                         onMissionClick={(mission) => setShowMissionDetail(mission)}
                         userId={user.id}
                     />
                 ) : view === 'MAP' ? (
                     <>
                         {loadingBusinesses && (
                             <div className="absolute inset-0 z-10 bg-white/90 flex items-center justify-center">
                                 <div className="text-center">
                                     <div className="animate-spin w-12 h-12 border-4 border-[#00E5FF] border-t-transparent rounded-full mx-auto mb-4"></div>
                                     <p className="text-[#1E0E62] font-bold">{t('explore.loadingMap', { defaultValue: 'Loading map...' })}</p>
                                 </div>
                             </div>
                         )}
                         <div ref={mapContainerRef} className="absolute inset-0 z-0" />
                         
                         {/* Map Controls */}
                         {!loadingBusinesses && (
                             <>
                                 {/* Result Count Badge */}
                                 <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-full shadow-lg border border-gray-200">
                                     <span className="text-sm font-bold text-gray-900">📍 {businesses.length} spots</span>
                                 </div>
                                 
                                 {/* Recenter Button */}
                                 {location && (
                                     <button
                                         onClick={() => {
                                             if (mapInstanceRef.current && location) {
                                                 mapInstanceRef.current.setView([location.latitude, location.longitude], 14, { animate: true });
                                                 triggerHaptic(15);
                                             }
                                         }}
                                         className="absolute top-4 right-4 z-[1000] w-11 h-11 bg-white hover:bg-gradient-to-br hover:from-[#00E5FF] hover:to-[#6C4BFF] text-gray-700 hover:text-white rounded-full shadow-lg border border-gray-200 hover:border-transparent flex items-center justify-center transition-all active:scale-95 group"
                                         title="Recenter to my location"
                                     >
                                         <Navigation className="w-5 h-5 group-hover:animate-pulse" />
                                     </button>
                                 )}
                             </>
                         )}
                     </>
                 ) : (
                     <div className="p-6 pt-32 space-y-6 overflow-y-auto h-full bg-white">
                         {/* Loading State with Skeletons */}
                         {loadingBusinesses && (
                             <>
                                 <div className="h-6 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
                                 <div className="grid grid-cols-2 gap-4">
                                     <SkeletonBusinessCard />
                                     <SkeletonBusinessCard />
                                     <SkeletonBusinessCard />
                                     <SkeletonBusinessCard />
                                     <SkeletonBusinessCard />
                                     <SkeletonBusinessCard />
                                 </div>
                             </>
                         )}

                         {/* Local Businesses Section */}
                         {!loadingBusinesses && businesses.length > 0 && (
                             <>
                                 <h3 className="font-bold text-[#1E0E62] text-lg">
                                     {location 
                                       ? `${t('explore.near', { location: location.city || t('navigation.nearYou', { defaultValue: 'You' }) })} • ${t('explore.spotsNearby', { count: businesses.length })}` 
                                       : `${t('explore.spotsNearby', { count: businesses.length })}`}
                                 </h3>
                                 <div className="grid grid-cols-2 gap-4">
                                     {businesses.map((biz) => (
                                         <BusinessCard
                                             key={biz.id}
                                             biz={biz}
                                             location={location}
                                             favorites={favorites}
                                             toggleFavorite={toggleFavorite}
                                             onSelect={(biz) => setViewingBusinessId(biz.id)}
                                             isBusinessOpen={isBusinessOpen}
                                             userId={user.id}
                                         />
                                     ))}
                                 </div>
                             </>
                         )}

                         {/* Online Shops Section */}
                         {onlineShops.length > 0 && (
                             <>
                                 <div className="flex items-center justify-between">
                                     <h3 className="font-bold text-[#1E0E62] text-lg">
                                         {t('explore.onlineShops')} • {onlineShops.length}
                                     </h3>
                                     <span className="text-xs font-bold text-[#00E5FF] bg-[#00E5FF]/10 px-3 py-1.5 rounded-full">{t('explore.nationwide')}</span>
                                 </div>
                                 <div className="grid grid-cols-2 gap-4">
                                     {onlineShops.map((biz) => (
                                         <div key={biz.id} className="aspect-[4/5] rounded-2xl bg-gray-100 relative overflow-hidden group cursor-pointer" onClick={() => setViewingBusinessId(biz.id)}>
                                             <img 
                                                src={biz.photoUrl || biz.avatarUrl || biz.coverUrl || `https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=500&fit=crop`} 
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                alt={biz.name}
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = `https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=500&fit=crop`;
                                                }}
                                             />
                                             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                                                 <div className="absolute top-3 right-3 bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] px-2 py-1 rounded-lg text-xs font-bold text-white">
                                                     {t('missions.online')}
                                                 </div>
                                                 <span className="text-white font-bold text-sm line-clamp-1">{biz.name}</span>
                                                 <span className="text-white/70 text-xs font-medium">{biz.businessType}</span>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             </>
                         )}

                         {/* Businesses Without Location (needs setup) */}
                         {!loadingBusinesses && (() => {
                             const businessesWithoutGeo = allBusinesses.filter(b => !b.geo && b.businessMode !== 'ONLINE');
                             return businessesWithoutGeo.length > 0 && (
                                 <>
                                     <div className="flex items-center justify-between">
                                         <h3 className="font-bold text-[#1E0E62] text-lg">
                                             {t('explore.setupRequired')} • {businessesWithoutGeo.length}
                                         </h3>
                                         <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">{t('explore.noLocation')}</span>
                                     </div>
                                     <div className="grid grid-cols-2 gap-4">
                                         {businessesWithoutGeo.map((biz) => (
                                             <div key={biz.id} className="aspect-[4/5] rounded-2xl bg-gray-100 relative overflow-hidden group cursor-pointer border-2 border-dashed border-amber-300" onClick={() => setViewingBusinessId(biz.id)}>
                                                 <img 
                                                    src={biz.photoUrl || biz.avatarUrl || biz.coverUrl || `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=500&fit=crop`} 
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-70"
                                                    alt={biz.name}
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=500&fit=crop`;
                                                    }}
                                                 />
                                                 <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-4">
                                                     <div className="absolute top-3 right-3 bg-amber-500 px-2 py-1 rounded-lg text-xs font-bold text-white">
                                                         ⚠️ {t('explore.noGps', { defaultValue: 'No GPS' })}
                                                     </div>
                                                     <span className="text-white font-bold text-sm line-clamp-1">{biz.name}</span>
                                                     <span className="text-white/70 text-xs font-medium">{biz.businessType || t('business.title')}</span>
                                                     <span className="text-amber-300 text-xs font-bold mt-1">{t('explore.locationSetupNeeded')}</span>
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                 </>
                             );
                         })()}

                         {/* Empty State with Suggestions */}
                         {!loadingBusinesses && businesses.length === 0 && onlineShops.length === 0 && (
                             <div className="text-center py-12 px-6">
                                 <div className="w-20 h-20 bg-gradient-to-br from-[#00E5FF]/20 to-[#6C4BFF]/20 rounded-full mx-auto mb-6 flex items-center justify-center">
                                     <Search className="w-10 h-10 text-[#00E5FF]" />
                                 </div>
                                 <h3 className="text-xl font-bold text-[#1E0E62] mb-2">{t('explore.noBusinessesFound')}</h3>
                                 <p className="text-[#8F8FA3] font-medium mb-6">
                                     {searchQuery 
                                         ? t('explore.noResultsFor', { query: searchQuery })
                                         : selectedCategory !== 'All'
                                         ? t('explore.noBusinessesWithin', { category: selectedCategory.toLowerCase(), distance: maxDistance })
                                         : t('explore.noBusinessesWithin', { category: '', distance: maxDistance })
                                     }
                                 </p>
                                 
                                 <div className="space-y-3">
                                     {searchQuery && (
                                         <button 
                                             onClick={() => setSearchQuery('')}
                                             className="w-full px-4 py-3 bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white rounded-xl font-bold hover:shadow-lg transition-all"
                                         >
                                             {t('explore.clearSearch')}
                                         </button>
                                     )}
                                     {selectedCategory !== 'All' && (
                                         <button 
                                             onClick={() => setSelectedCategory('All')}
                                             className="w-full px-4 py-3 bg-white border-2 border-[#00E5FF] text-[#00E5FF] rounded-xl font-bold hover:bg-[#00E5FF] hover:text-white transition-all"
                                         >
                                             {t('explore.showAllCategories')}
                                         </button>
                                     )}
                                     {maxDistance < 100 && (
                                         <button 
                                             onClick={() => setMaxDistance(100)}
                                             className="w-full px-4 py-3 bg-white border-2 border-gray-200 text-[#1E0E62] rounded-xl font-bold hover:border-[#00E5FF] transition-all"
                                         >
                                             {t('explore.expandTo100km')}
                                         </button>
                                     )}
                                 </div>
                             </div>
                         )}
                     </div>
                 )}

                 {/* View Toggle */}
                 <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-2xl p-1.5 flex border border-gray-100 z-[999]" style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}>             
                            <button 
                        onClick={() => setView('LIST')}
                        className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all ${view === 'LIST' ? 'bg-gradient-to-r from-[#1E0E62] to-[#3E2E82] text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
                     >
                        <List className="inline-block w-3.5 h-3.5 mr-1" />
                                {t('meetups.viewList')}
                     </button>
                     <button 
                        onClick={() => setView('MAP')}
                        className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all ${view === 'MAP' ? 'bg-gradient-to-r from-[#1E0E62] to-[#3E2E82] text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
                     >
                        <Map className="inline-block w-3.5 h-3.5 mr-1" />
                                {t('meetups.viewMap')}
                     </button>
                 </div>
             </div>

             {/* CustomerBusinessProfile Modal */}
             {viewingBusinessId && (
                 <CustomerBusinessProfile
                     isOpen={!!viewingBusinessId}
                     onClose={() => setViewingBusinessId(null)}
                     businessId={viewingBusinessId}
                     currentUserId={user.id}
                     currentUserPoints={user.points || 0}
                 />
             )}

             {/* Detail Modal Overlay */}
             {showMissionDetail && (
                <MissionDetailScreen 
                    mission={showMissionDetail} 
                    user={user} 
                    onClose={() => setShowMissionDetail(null)}
                    onApply={() => handleApplyToMission(showMissionDetail.id)}
                    isApplying={applyingToMission === showMissionDetail.id}
                />
            )}
        </div>
    );
};

export default ExploreScreen;
