import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Mission, User } from '../types';
import { calculateDistance, formatDistance, estimateWalkTime } from '../hooks/useLocation';
import { Navigation, MapPin, Gift, Star, Clock, ArrowRight, Target } from 'lucide-react';
import { Button } from './Common';

declare global {
  interface Window {
    L: any;
  }
}

interface MissionsMapViewProps {
  missions: Mission[];
  businesses: User[];
  userLocation: { latitude: number; longitude: number; city?: string } | null;
  onMissionClick: (mission: Mission) => void;
  userId: string;
}

interface EnrichedMission extends Mission {
  distance?: number;
  business?: User;
  distanceFormatted?: string;
  walkTime?: string;
}

export const MissionsMapView: React.FC<MissionsMapViewProps> = ({
  missions,
  businesses,
  userLocation,
  onMissionClick,
  userId
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [selectedMission, setSelectedMission] = useState<EnrichedMission | null>(null);
  const [view, setView] = useState<'map' | 'list'>('map');
  const [sortBy, setSortBy] = useState<'distance' | 'reward' | 'expiry'>('distance');
  const [showARPreview, setShowARPreview] = useState(false);
  const [compassHeading, setCompassHeading] = useState<number | null>(null);
  
  // Enrich missions with business and distance data
  const enrichedMissions: EnrichedMission[] = missions.map(mission => {
    const business = businesses.find(b => b.id === mission.businessId);
    const distance = userLocation && business?.geo 
      ? calculateDistance(userLocation, business.geo)
      : undefined;
    
    const walkTimeMinutes = distance ? estimateWalkTime(distance) : undefined;
    
    return {
      ...mission,
      business,
      distance,
      distanceFormatted: distance ? formatDistance(distance) : 'Unknown',
      walkTime: walkTimeMinutes ? `${walkTimeMinutes} min walk` : 'Unknown'
    };
  }).filter(m => m.business?.geo); // Only show missions with known locations
  
  // Sort missions
  const sortedMissions = [...enrichedMissions].sort((a, b) => {
    switch(sortBy) {
      case 'reward':
        const aReward = typeof a.reward === 'number' ? a.reward : (a.reward?.points || 0);
        const bReward = typeof b.reward === 'number' ? b.reward : (b.reward?.points || 0);
        return bReward - aReward;
      case 'expiry':
        const aExpiry = a.expiresAt ? new Date(a.expiresAt as string).getTime() : Date.now() + 999999;
        const bExpiry = b.expiresAt ? new Date(b.expiresAt as string).getTime() : Date.now() + 999999;
        return aExpiry - bExpiry;
      case 'distance':
      default:
        return (a.distance || Infinity) - (b.distance || Infinity);
    }
  });
  
  // Initialize compass for AR mode
  useEffect(() => {
    if (!showARPreview) return;
    
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null) {
        setCompassHeading(event.alpha);
      }
    };
    
    if (window.DeviceOrientationEvent) {
      // Request permission on iOS 13+
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        (DeviceOrientationEvent as any).requestPermission()
          .then((permissionState: string) => {
            if (permissionState === 'granted') {
              window.addEventListener('deviceorientation', handleOrientation);
            }
          })
          .catch(console.error);
      } else {
        window.addEventListener('deviceorientation', handleOrientation);
      }
    }
    
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [showARPreview]);
  
  // Initialize map
  useEffect(() => {
    if (view !== 'map' || !mapContainerRef.current || mapInstanceRef.current || !window.L) return;
    
    const initialLat = userLocation?.latitude || 52.5200;
    const initialLng = userLocation?.longitude || 13.4050;
    
    const map = window.L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false
    }).setView([initialLat, initialLng], 14);
    
    // Add tiles
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);
    
    mapInstanceRef.current = map;
    
    // Add user location marker
    if (userLocation) {
      const userIcon = window.L.divIcon({
        className: 'user-location-marker',
        html: `
          <div class="relative flex items-center justify-center w-12 h-12">
            <div class="absolute inset-0 bg-blue-500 rounded-full opacity-30 animate-ping"></div>
            <div class="relative z-10 w-8 h-8 rounded-full border-3 border-white bg-blue-500 shadow-xl flex items-center justify-center">
              <div class="w-3 h-3 bg-white rounded-full"></div>
            </div>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      });
      
      window.L.marker([userLocation.latitude, userLocation.longitude], {
        icon: userIcon,
        zIndexOffset: 1000
      }).addTo(map).bindPopup('You are here');
    }
    
    // Add mission markers
    enrichedMissions.forEach(mission => {
      if (!mission.business?.geo) return;
      
      const isUrgent = mission.expiresAt && new Date(mission.expiresAt).getTime() - Date.now() < 24 * 60 * 60 * 1000;
      const colorClass = isUrgent ? '#EF4444' : '#00E5FF';
      
      const missionIcon = window.L.divIcon({
        className: 'mission-marker',
        html: `
          <div class="relative flex items-center justify-center w-12 h-12">
            ${isUrgent ? '<div class="absolute inset-0 bg-red-500 rounded-full opacity-50 animate-ping"></div>' : ''}
            <div class="relative z-10 w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-[${colorClass}] to-[#6C4BFF] shadow-lg flex items-center justify-center">
              <span class="text-white text-lg">🎁</span>
            </div>
            <div class="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full border-2 border-[${colorClass}] flex items-center justify-center text-xs font-bold text-[${colorClass}]">
              ${mission.reward || 0}
            </div>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      });
      
      const marker = window.L.marker([mission.business.geo.latitude, mission.business.geo.longitude], {
        icon: missionIcon
      });
      
      marker.on('click', () => {
        setSelectedMission(mission);
        map.setView([mission.business!.geo!.latitude - 0.005, mission.business!.geo!.longitude], 16, { animate: true });
      });
      
      marker.addTo(map);
    });
    
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [view, enrichedMissions, userLocation]);
  
  // Calculate bearing for AR mode
  const calculateBearing = (from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }) => {
    const toRad = (deg: number) => deg * Math.PI / 180;
    const toDeg = (rad: number) => rad * 180 / Math.PI;
    
    const lat1 = toRad(from.latitude);
    const lat2 = toRad(to.latitude);
    const dLon = toRad(to.longitude - from.longitude);
    
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    const bearing = toDeg(Math.atan2(y, x));
    
    return (bearing + 360) % 360;
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Header Controls */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">
            🎯 Nearby Opportunities
          </h2>
          <span className="px-2 py-1 bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white text-xs font-bold rounded-full">
            {enrichedMissions.length} missions
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('map')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                view === 'map' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              🗺️ Map
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                view === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              📋 List
            </button>
          </div>
          
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold outline-none"
          >
            <option value="distance">📍 Nearest First</option>
            <option value="reward">💰 Highest Reward</option>
            <option value="expiry">⏰ Expiring Soon</option>
          </select>
          
          {/* AR Preview Button */}
          {userLocation && (
            <button
              onClick={() => setShowARPreview(!showARPreview)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                showARPreview 
                  ? 'bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white' 
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              📱 AR
            </button>
          )}
        </div>
      </div>
      
      {/* AR Preview Mode */}
      {showARPreview && userLocation && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <button
            onClick={() => setShowARPreview(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white text-xl"
          >
            ✕
          </button>
          
          <div className="text-white text-center mb-8">
            <h3 className="text-2xl font-bold mb-2">AR Mission Finder</h3>
            <p className="text-sm text-gray-300">Point your device to find missions nearby</p>
          </div>
          
          {/* Compass */}
          <div className="relative w-64 h-64 mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-white/30"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className="w-1 h-24 bg-gradient-to-t from-red-500 to-white rounded-full transition-transform duration-300"
                style={{ transform: `rotate(${compassHeading || 0}deg)` }}
              ></div>
            </div>
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-white font-bold text-lg">N</div>
          </div>
          
          {/* Nearby Missions */}
          <div className="w-full max-w-md space-y-2 max-h-64 overflow-y-auto">
            {sortedMissions.slice(0, 5).map(mission => {
              if (!mission.business?.geo) return null;
              
              const bearing = calculateBearing(userLocation, mission.business.geo);
              const relativeBearing = (bearing - (compassHeading || 0) + 360) % 360;
              
              return (
                <div
                  key={mission.id}
                  className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm">{mission.title}</p>
                      <p className="text-gray-300 text-xs">{mission.business.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-sm">{mission.distanceFormatted}</p>
                      <div className="flex items-center gap-1 text-yellow-400 text-xs">
                        <Star className="w-3 h-3 fill-current" />
                        {typeof mission.reward === 'number' ? mission.reward : (mission.reward?.points || 0)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-full bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] flex items-center justify-center text-white transition-transform"
                      style={{ transform: `rotate(${relativeBearing}deg)` }}
                    >
                      ↑
                    </div>
                    <p className="text-gray-300 text-xs">{Math.round(bearing)}° {mission.walkTime}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Map View */}
      {view === 'map' && (
        <div className="flex-1 relative">
          <div ref={mapContainerRef} className="absolute inset-0 z-0"></div>
          
          {/* Mission Detail Bottom Sheet */}
          {selectedMission && (
            <div className="absolute bottom-0 left-0 right-0 z-10 bg-white rounded-t-3xl shadow-2xl p-4 animate-in slide-in-from-bottom duration-300">
              <button
                onClick={() => setSelectedMission(null)}
                className="absolute top-2 right-2 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200"
              >
                ✕
              </button>
              
              <div className="flex items-start gap-3 mb-3">
                <img
                  src={selectedMission.business?.avatarUrl || selectedMission.business?.photoUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100'}
                  className="w-16 h-16 rounded-xl object-cover"
                  alt={selectedMission.business?.name}
                />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg">{selectedMission.title}</h3>
                  <p className="text-sm text-gray-600">{selectedMission.business?.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {selectedMission.distanceFormatted}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {selectedMission.walkTime}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-yellow-500 font-bold">
                    <Star className="w-5 h-5 fill-current" />
                    {typeof selectedMission.reward === 'number' ? selectedMission.reward : (selectedMission.reward?.points || 0)}
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-700 mb-3">{selectedMission.description}</p>
              
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1 flex items-center justify-center gap-2"
                  onClick={() => {
                    if (selectedMission.business?.geo && userLocation) {
                      const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${selectedMission.business.geo.latitude},${selectedMission.business.geo.longitude}`;
                      window.open(url, '_blank');
                    }
                  }}
                >
                  <Navigation className="w-4 h-4" />
                  Navigate
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 flex items-center justify-center gap-2"
                  onClick={() => onMissionClick(selectedMission)}
                >
                  View Details
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* List View */}
      {view === 'list' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sortedMissions.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-semibold">No missions nearby</p>
              <p className="text-sm text-gray-400">Check back later for new opportunities</p>
            </div>
          ) : (
            sortedMissions.map(mission => (
              <div
                key={mission.id}
                onClick={() => onMissionClick(mission)}
                className="bg-white rounded-2xl border border-gray-200 p-4 hover:border-[#00E5FF] transition-all cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={mission.business?.avatarUrl || mission.business?.photoUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100'}
                    className="w-14 h-14 rounded-xl object-cover"
                    alt={mission.business?.name}
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-bold text-gray-900">{mission.title}</h3>
                      <div className="flex items-center gap-1 text-yellow-500 font-bold">
                        <Star className="w-4 h-4 fill-current" />
                        {typeof mission.reward === 'number' ? mission.reward : (mission.reward?.points || 0)}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{mission.business?.name}</p>
                    
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {mission.distanceFormatted}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {mission.walkTime}
                      </span>
                      {mission.expiresAt && (
                        <span className="flex items-center gap-1 text-red-500">
                          <Target className="w-3 h-3" />
                          {new Date(mission.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
