/**
 * Creator Opportunities Screen
 * Browse and apply to collaboration projects posted by businesses
 */

import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Filter,
  CheckCircle2,
  Globe,
  Clock,
  Target,
  Camera,
  Users,
  Video,
  Edit3,
  Sparkles,
  Bookmark,
  AlertCircle,
  Flame,
  Star
} from 'lucide-react';
import { User, Project, ProjectSlot } from '../types';
import { getProjects } from '../services/projectService';
import { formatDistanceToNow } from 'date-fns';
import { CreatorContextBar } from './CreatorContextBar';

interface CreatorOpportunitiesScreenProps {
  user: User;
  onNavigate: (route: string) => void;
}

export const CreatorOpportunitiesScreen: React.FC<CreatorOpportunitiesScreenProps> = ({ 
  user, 
  onNavigate 
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedSlots, setAppliedSlots] = useState<Set<string>>(new Set());
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<ProjectSlot | null>(null);
  const [applyNote, setApplyNote] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [savedProjects, setSavedProjects] = useState<Set<string>>(new Set());

  // Load projects
  useEffect(() => {
    loadOpportunities();
  }, [user.id]);

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      
      // Get all projects
      const allProjects = await getProjects();
      
      console.log('[CreatorOpportunities] Loaded projects:', allProjects.length);
      });
      
      console.log('[CreatorOpportunities] All missions:', allMissions.map(m => ({
        id: m.id,
        title: m.title,
        status: m.status,
        lifecycleStatus: m.lifecycleStatus,
        city: m.city,
        isRemote: m.isRemote,
        requiredRoles: m.requiredRoles
      })));
      
      // Filter missions based on creator requirements
      const creatorMissions = allMissions.filter(m => {
        console.log(`[CreatorOpportunities] Checking mission ${m.id}:`, m.title);
        
        // Must be open status (check both lifecycleStatus and legacy status field)
        if (m.lifecycleStatus !== 'ACTIVE' && m.status !== 'ACTIVE') {
          console.log(`  ❌ Status check failed: lifecycleStatus=${m.lifecycleStatus}, status=${m.status}`);
          return false;
        }
        console.log(`  ✅ Status check passed`);
        
        // Location check: Remote OR city match OR within radius
        // Note: missions may have either 'city' or 'location' field
        const missionCity = m.city || (typeof m.location === 'string' ? m.location : undefined);
        const isRemoteMatch = m.isRemote === true;
        const isCityMatch = missionCity && creatorCity && missionCity.toLowerCase() === creatorCity.toLowerCase();
        const distance = missionCity && creatorCity ? calculateDistance(m, creatorCity) : Infinity;
        const isDistanceMatch = distance <= creatorRadiusKm;
        
        const locationMatch = isRemoteMatch || isCityMatch || isDistanceMatch;
        
        console.log(`  Location check:`, {
          isRemote: isRemoteMatch,
          cityMatch: isCityMatch,
          missionCity: missionCity,
          creatorCity: creatorCity,
          distance: distance,
          radiusKm: creatorRadiusKm,
          distanceMatch: isDistanceMatch,
          finalMatch: locationMatch
        });
        
        if (!locationMatch) {
          console.log(`  ❌ Location check failed`);
          return false;
        }
        console.log(`  ✅ Location check passed`);
        
        // Role check: requiredRoles intersects with creator.roles
        if (m.requiredRoles && m.requiredRoles.length > 0 && creatorRoles.length > 0) {
          const hasRoleMatch = m.requiredRoles.some(role => 
            creatorRoles.some(creatorRole => 
              role.toLowerCase() === creatorRole.toLowerCase()
            )
          );
          console.log(`  Role check:`, {
            requiredRoles: m.requiredRoles,
            creatorRoles: creatorRoles,
            hasMatch: hasRoleMatch
          });
          if (!hasRoleMatch) {
            console.log(`  ❌ Role check failed`);
            return false;
          }
          console.log(`  ✅ Role check passed`);
        } else {
          console.log(`  ⏭️ Role check skipped (no role requirements or creator has no roles)`);
        }
        
        // Availability check (optional filter - show all if creator is busy, they might want to browse)
        // Only filter if they explicitly set availability
        // if (creatorAvailability === 'busy') return false; // Uncomment to hide when busy
        
        console.log(`  ✅✅ Mission ${m.id} PASSED all filters`);
        return true;
      });
      
      console.log('[CreatorOpportunities] Filtered missions:', creatorMissions.length);
      
      // Check which missions user has applied to
      const applications = await getCreatorApplications(user.id);
      const appliedIds = new Set(applications.map(app => app.missionId));
      setAppliedMissions(appliedIds);
      
      setMissions(creatorMissions);
      applyFilters(creatorMissions, activeFilter);
    } catch (error) {
      console.error('[CreatorOpportunities] Error loading missions:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate approximate distance based on city (v1 - simple city match)
  // In v2, use actual geo coordinates for precise distance
  const calculateDistance = (mission: Mission, creatorCity: string): number => {
    // Normalize city names for common variations
    const normalizeCity = (city: string): string => {
      const normalized = city.toLowerCase().trim();
      const cityMap: Record<string, string> = {
        'münchen': 'munich',
        'munich': 'munich',
        'muenchen': 'munich',
        // Add more city variations as needed
      };
      return cityMap[normalized] || normalized;
    };
    
    // For v1, return 0 if city matches (within radius), otherwise infinite
    const missionCity = mission.city || (typeof mission.location === 'string' ? mission.location : undefined);
    if (missionCity && creatorCity && normalizeCity(missionCity) === normalizeCity(creatorCity)) {
      return 0;
    }
    // If geo coordinates exist, calculate actual distance
    const userLoc = user.location;
    if (!userLoc || typeof userLoc === 'string') {
      return Infinity;
    }
    // TypeScript: userLoc is now guaranteed to be a GeoLocation object
    if (mission.geo && 'latitude' in userLoc && 'longitude' in userLoc) {
      // Simple Haversine distance calculation
      const R = 6371; // Earth's radius in km
      const location = userLoc as { latitude: number; longitude: number };
      const lat1 = mission.geo.latitude * Math.PI / 180;
      const lat2 = location.latitude * Math.PI / 180;
      const dLat = (location.latitude - mission.geo.latitude) * Math.PI / 180;
      const dLon = (location.longitude - mission.geo.longitude) * Math.PI / 180;
      
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    }
    return 999; // Far away if no geo data
  };

  const applyFilters = (missionList: Mission[], filter: FilterType) => {
    let filtered = [...missionList];
    
    const creatorCity = user.creator?.city || user.currentCity;
    const creatorRoles = user.creator?.roles || [];

    if (filter === 'near') {
      // Show only city matches or nearby (within radiusKm)
      filtered = filtered.filter(m => 
        (m.city && creatorCity && m.city.toLowerCase() === creatorCity.toLowerCase()) ||
        calculateDistance(m, creatorCity || '') <= (user.creator?.radiusKm || 25)
      );
    } else if (filter === 'remote') {
      filtered = filtered.filter(m => m.isRemote === true);
    }
    // 'all' shows everything already filtered in loadOpportunities

    // Sort by: 0) Saved 1) Near you 2) Role match strength 3) Deadline soon 4) Remote
    filtered.sort((a, b) => {
      // 0. Prioritize saved missions
      const aIsSaved = savedMissions.has(a.id);
      const bIsSaved = savedMissions.has(b.id);
      if (aIsSaved && !bIsSaved) return -1;
      if (!aIsSaved && bIsSaved) return 1;

      // 1. Prioritize city match (Near you)
      const aIsNear = a.city && creatorCity && a.city.toLowerCase() === creatorCity.toLowerCase();
      const bIsNear = b.city && creatorCity && b.city.toLowerCase() === creatorCity.toLowerCase();
      if (aIsNear && !bIsNear) return -1;
      if (!aIsNear && bIsNear) return 1;

      // 2. Role match strength (more overlapping roles = higher priority)
      const aRoleMatches = calculateRoleMatchCount(a.requiredRoles, creatorRoles);
      const bRoleMatches = calculateRoleMatchCount(b.requiredRoles, creatorRoles);
      if (aRoleMatches !== bRoleMatches) return bRoleMatches - aRoleMatches;

      // 3. Deadline soon (urgent missions first)
      const now = Date.now();
      const aDeadline = a.deadline ? new Date(a.deadline).getTime() : now + 999999999;
      const bDeadline = b.deadline ? new Date(b.deadline).getTime() : now + 999999999;
      if (aDeadline !== bDeadline) return aDeadline - bDeadline;

      // 4. Remote opportunities (lower priority, but still included)
      const aIsRemote = a.isRemote === true;
      const bIsRemote = b.isRemote === true;
      if (aIsRemote && !bIsRemote) return 1;
      if (!aIsRemote && bIsRemote) return -1;

      return 0;
    });

    setFilteredMissions(filtered);
  };
  
  // Calculate how many roles match between mission requirements and creator roles
  const calculateRoleMatchCount = (requiredRoles?: string[], creatorRoles?: string[]): number => {
    if (!requiredRoles || !creatorRoles || requiredRoles.length === 0 || creatorRoles.length === 0) {
      return 0;
    }
    
    return requiredRoles.filter(role =>
      creatorRoles.some(creatorRole => 
        role.toLowerCase() === creatorRole.toLowerCase()
      )
    ).length;
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    applyFilters(missions, filter);
  };

  const handleApply = async () => {
    if (!selectedMission) return;

    setIsApplying(true);
    try {
      const result = await applyToMission(
        selectedMission.id,
        user.id,
        selectedMission.businessId,
        applyNote,
        user.creator?.roles || [] // Snapshot of creator roles at application time
      );

      if (result.success) {
        setAppliedMissions(prev => new Set([...prev, selectedMission.id]));
        setSelectedMission(null);
        setApplyNote('');
        alert('Application submitted successfully! 🎉');
      } else {
        alert(result.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('[CreatorOpportunities] Error applying:', error);
      alert('Failed to submit application');
    } finally {
      setIsApplying(false);
    }
  };

  const getCompensationBadge = (mission: Mission) => {
    // Prioritize compensation object for creator missions
    if (mission.compensation) {
      const { kind, amount, currency } = mission.compensation;
      if (kind === 'paid' && amount) {
        return `${currency || 'EUR'} ${amount}`;
      }
      if (kind === 'unpaid') {
        return 'Unpaid';
      }
      if (kind === 'negotiable') {
        return 'Negotiable';
      }
    }
    
    // Fallback to points
    if (mission.reward && mission.reward.points && mission.reward.points > 0) {
      return `${mission.reward.points} Points`;
    }
    if (mission.points && mission.points > 0) {
      return `${mission.points} Points`;
    }
    return 'TBD';
  };
  
  const getCompensationColor = (mission: Mission): string => {
    if (mission.compensation?.kind === 'paid') return 'text-green-600';
    if (mission.compensation?.kind === 'unpaid') return 'text-gray-500';
    if (mission.compensation?.kind === 'negotiable') return 'text-blue-600';
    return 'text-purple-600'; // Points
  };

  // Get "Why me?" match explanation
  const getMatchReason = (mission: Mission): string => {
    const reasons: string[] = [];
    const creatorCity = user.creator?.city || user.currentCity;
    const creatorRoles = user.creator?.roles || [];

    // Location match
    if (mission.city && creatorCity && mission.city.toLowerCase() === creatorCity.toLowerCase()) {
      reasons.push(`in ${mission.city}`);
    } else if (mission.isRemote) {
      reasons.push('remote work');
    }

    // Role matches
    const matchedRoles = mission.requiredRoles?.filter(r => 
      creatorRoles.some(ur => ur.toLowerCase() === r.toLowerCase())
    ) || [];
    
    if (matchedRoles.length > 0) {
      const formattedRoles = matchedRoles.map(r => 
        r.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      ).join(', ');
      reasons.push(formattedRoles);
    }

    if (reasons.length === 0) return 'Matched to your profile';
    
    return `Matched: ${reasons.join(' • ')}`;
  };

  // Get urgency indicator
  const getUrgencyTag = (mission: Mission): { icon: React.ElementType; text: string; color: string } | null => {
    // Check deadline urgency
    if (mission.deadline) {
      const daysLeft = Math.ceil((new Date(mission.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 3 && daysLeft >= 0) {
        return { 
          icon: AlertCircle, 
          text: daysLeft === 0 ? 'Closes today' : `${daysLeft}d left`, 
          color: 'bg-red-100 text-red-700 border-red-200' 
        };
      }
    }

    // Check application count (if available)
    // This would require adding applicationCount to Mission type
    // For now, we'll skip this check

    // Check if mission is new (created within last 24 hours)
    if (mission.createdAt) {
      const hoursOld = (Date.now() - new Date(mission.createdAt).getTime()) / (1000 * 60 * 60);
      if (hoursOld <= 24) {
        return { 
          icon: Star, 
          text: 'New', 
          color: 'bg-green-100 text-green-700 border-green-200' 
        };
      }
    }

    return null;
  };

  // Toggle save mission
  const toggleSave = (missionId: string) => {
    setSavedMissions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(missionId)) {
        newSet.delete(missionId);
      } else {
        newSet.add(missionId);
      }
      // In production, persist to Firestore: user.savedOpportunities
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1E0E62] mb-2">Opportunities</h1>
        <p className="text-gray-600 text-sm">
          Browse and apply to missions from brands and businesses
        </p>
      </div>

      {/* Context Bar */}
      <CreatorContextBar user={user} />

      {/* Filter Chips */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => handleFilterChange('near')}
          className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
            activeFilter === 'near'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-purple-300'
          }`}
        >
          <MapPin className="w-4 h-4 inline mr-1" />
          Near You
        </button>
        <button
          onClick={() => handleFilterChange('remote')}
          className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
            activeFilter === 'remote'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-purple-300'
          }`}
        >
          <Globe className="w-4 h-4 inline mr-1" />
          Remote
        </button>
        <button
          onClick={() => handleFilterChange('all')}
          className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
            activeFilter === 'all'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-purple-300'
          }`}
        >
          <Filter className="w-4 h-4 inline mr-1" />
          All
        </button>
      </div>

      {/* Stats */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Available Opportunities</p>
            <p className="text-2xl font-bold text-purple-700">{filteredMissions.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Your Applications</p>
            <p className="text-2xl font-bold text-pink-600">{appliedMissions.size}</p>
          </div>
        </div>
      </div>

      {/* Mission Cards */}
      {filteredMissions.length === 0 ? (
        <div className="text-center py-12 bg-purple-50/30 rounded-3xl border border-purple-100 px-4">
          <Briefcase className="w-16 h-16 text-purple-300 mx-auto mb-4" />
          <p className="text-gray-700 font-semibold mb-2">No opportunities match your profile yet</p>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            {user.creator?.city 
              ? `New missions are posted daily in ${user.creator.city}. We'll notify you when a match appears.`
              : 'Complete your creator profile to see opportunities matched to your location and skills.'
            }
          </p>
          {activeFilter !== 'all' && (
            <button
              onClick={() => handleFilterChange('all')}
              className="mt-4 text-purple-600 font-medium text-sm hover:underline"
            >
              View all opportunities →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMissions.map(mission => {
            const typeInfo = getMissionTypeInfo(mission);
            const TypeIcon = typeInfo.icon;
            const hasApplied = appliedMissions.has(mission.id);
            const isSaved = savedMissions.has(mission.id);
            const urgencyTag = getUrgencyTag(mission);

            return (
              <div
                key={mission.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                {/* Type Label + Urgency */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${typeInfo.color}`}>
                    <TypeIcon className="w-3 h-3" />
                    {typeInfo.label}
                  </span>
                  {mission.isRemote && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      Remote
                    </span>
                  )}
                  {urgencyTag && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border ${urgencyTag.color}`}>
                      <urgencyTag.icon className="w-3 h-3" />
                      {urgencyTag.text}
                    </span>
                  )}
                  {hasApplied && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Applied
                    </span>
                  )}
                  <div className="ml-auto">
                    <button
                      onClick={() => toggleSave(mission.id)}
                      className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
                      title={isSaved ? 'Remove from saved' : 'Save for later'}
                    >
                      <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-purple-600 text-purple-600' : 'text-gray-400'}`} />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-[#1E0E62] mb-2">
                  {mission.title}
                </h3>

                {/* Why me? AI explanation */}
                <p className="text-xs text-purple-600 mb-3 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {getMatchReason(mission)}
                </p>

                {/* Info Row */}
                <div className="flex flex-wrap gap-3 mb-3 text-sm text-gray-600">
                  {mission.city && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{mission.city}</span>
                      {!mission.isRemote && user.creator?.city && (
                        <span className="text-xs text-gray-400">
                          ({calculateDistance(mission, user.creator.city).toFixed(0)} km)
                        </span>
                      )}
                    </div>
                  )}
                  {mission.deadline && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Due {formatDistanceToNow(new Date(mission.deadline), { addSuffix: true })}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    <span className={`font-semibold ${getCompensationColor(mission)}`}>
                      {getCompensationBadge(mission)}
                    </span>
                  </div>
                </div>

                {/* Roles Needed */}
                {mission.requiredRoles && mission.requiredRoles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {mission.requiredRoles.map((role, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          user.creator?.roles?.some(r => r.toLowerCase() === role.toLowerCase())
                            ? 'bg-purple-100 text-purple-700 border border-purple-300'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                )}

                {/* Description */}
                <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                  {mission.description}
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => onNavigate(`mission/${mission.id}`)}
                    className="flex-1 bg-gray-100 text-gray-700 font-semibold py-2 px-4 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    View Details
                  </button>
                  {!hasApplied ? (
                    <button
                      onClick={() => setSelectedMission(mission)}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-2 px-4 rounded-xl hover:shadow-lg transition-all"
                    >
                      Apply Now
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex-1 bg-green-100 text-green-700 font-semibold py-2 px-4 rounded-xl cursor-not-allowed"
                    >
                      <CheckCircle2 className="w-4 h-4 inline mr-1" />
                      Applied
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Apply Modal */}
      {selectedMission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-[#1E0E62] mb-4">
              Apply to {selectedMission.title}
            </h2>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Cover Note (Optional)
              </label>
              <textarea
                value={applyNote}
                onChange={(e) => setApplyNote(e.target.value)}
                placeholder="Tell the business why you're a great fit..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedMission(null);
                  setApplyNote('');
                }}
                className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors"
                disabled={isApplying}
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-4 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                disabled={isApplying}
              >
                {isApplying ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
