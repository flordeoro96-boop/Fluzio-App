/**
 * Creator Opportunities Screen
 * Browse and apply to collaboration projects posted by businesses
 * Features: Priority Matching AI for Creator Plus users
 */

import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  DollarSign, 
  CheckCircle2,
  Bookmark,
  Users,
  Sparkles,
  Building2,
  Target,
  TrendingUp,
  MapPin,
  Clock,
  Camera,
  ExternalLink,
  Filter,
  SlidersHorizontal,
  X,
  ChevronDown,
  Calendar,
  Share2,
  Flag,
  Zap
} from 'lucide-react';
import { User, Project, ProjectSlot, ApplicationStatus } from '../types';
import { getProjects, getCreatorApplications } from '../services/projectService';
import { sortOpportunitiesByMatch } from '../services/priorityMatchingService';
import { getUserFeatures } from '../services/creatorPlusService';
import { CreatorContextBar } from './CreatorContextBar';
import { ApplicationModal } from './ApplicationModal';
import { CreatorProjectDetailView } from './CreatorProjectDetailView';
import CompetitiveInsights from './CompetitiveInsights';

// Utility: Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Utility: Get application status badge info
const getStatusBadgeInfo = (status: ApplicationStatus) => {
  const badges = {
    PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    UNDER_REVIEW: { label: 'Under Review', color: 'bg-blue-100 text-blue-700', icon: Users },
    SHORTLISTED: { label: 'Shortlisted', color: 'bg-purple-100 text-purple-700', icon: Sparkles },
    INTERVIEW_SCHEDULED: { label: 'Interview Scheduled', color: 'bg-indigo-100 text-indigo-700', icon: Calendar },
    ACCEPTED: { label: 'Accepted', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: X },
    WITHDRAWN: { label: 'Withdrawn', color: 'bg-gray-100 text-gray-700', icon: X }
  };
  return badges[status] || badges.PENDING;
};

interface CreatorOpportunitiesScreenProps {
  user: User;
  onNavigate: (route: string) => void;
}

export const CreatorOpportunitiesScreen: React.FC<CreatorOpportunitiesScreenProps> = ({ 
  user, 
  onNavigate 
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [matchedProjects, setMatchedProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedSlots, setAppliedSlots] = useState<Set<string>>(new Set());
  const [savedProjects, setSavedProjects] = useState<Set<string>>(new Set());
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [selectedApplicationProject, setSelectedApplicationProject] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [selectedApplicationRole, setSelectedApplicationRole] = useState<{
    id: string;
    title: string;
    budget: number;
    description?: string;
  } | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'network' | 'saved'>('all');
  const [isCreatorPlus, setIsCreatorPlus] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // New filter and sort state
  const [sortBy, setSortBy] = useState<'match' | 'budget' | 'newest' | 'deadline'>('match');
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, 5000]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProjectTypes, setSelectedProjectTypes] = useState<string[]>([]);
  const [maxDistance, setMaxDistance] = useState<number>(50); // km
  const [activeTab, setActiveTab] = useState<'opportunities' | 'analytics'>('opportunities');

  useEffect(() => {
    loadOpportunities();
    loadExistingApplications();
    checkCreatorPlusStatus();
  }, [user.id]);

  const checkCreatorPlusStatus = async () => {
    try {
      const features = await getUserFeatures(user.id);
      setIsCreatorPlus(features.priorityMatching);
    } catch (error) {
      console.error('[CreatorOpportunities] Error checking Creator Plus status:', error);
    }
  };

  const loadExistingApplications = async () => {
    try {
      console.log('[CreatorOpportunities] Loading applications for user:', user.id);
      const applications = await getCreatorApplications(user.id);
      console.log('[CreatorOpportunities] Retrieved applications:', applications);
      
      const appliedSet = new Set<string>();
      
      applications.forEach(app => {
        // Create the same key format as we use when applying: projectId-roleName
        const key = `${app.projectId}-${app.roleName}`;
        appliedSet.add(key);
        console.log('[CreatorOpportunities] Added to applied set:', key);
      });
      
      setAppliedSlots(appliedSet);
      console.log('[CreatorOpportunities] Total applications loaded:', appliedSet.size);
    } catch (error) {
      console.error('[CreatorOpportunities] Error loading applications:', error);
    }
  };

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      const allProjects = await getProjects();
      console.log('[CreatorOpportunities] Loaded projects:', allProjects.length);
      
      // Get user roles - handle multiple data formats
      let userRoles: string[] = [];
      if (user.creator?.roles && Array.isArray(user.creator.roles)) {
        userRoles = user.creator.roles;
      } else if ((user.creator as any)?.role && typeof (user.creator as any).role === 'string') {
        // Handle legacy creator.role field
        userRoles = [(user.creator as any).role];
      } else if ((user as any).category && typeof (user as any).category === 'string') {
        // Handle top-level category field (current format)
        userRoles = [(user as any).category];
      }
      console.log('[CreatorOpportunities] User creator roles:', userRoles);
      
      let relevantProjects: Project[];
      
      // If user has no roles set, show all projects with creator opportunities
      if (userRoles.length === 0) {
        relevantProjects = allProjects.filter(p => 
          (p.creatorRoles || []).length > 0
        );
        console.log('[CreatorOpportunities] No user roles - showing all projects with creators:', relevantProjects.length);
      } else {
        // Only include projects that have at least one matching creator role
        relevantProjects = allProjects.filter(project => {
          const projectCreatorRoles = (project.creatorRoles || []).map(r => r.title.toLowerCase());
          
          // Check if any user role matches any project role
          const hasMatch = userRoles.some(userRole => {
            const userRoleLower = userRole.toLowerCase();
            
            return projectCreatorRoles.some(projectRole => {
              // Exact match
              if (projectRole === userRoleLower) return true;
              
              // Handle common variations
              // photographer/photography
              if ((userRoleLower === 'photographer' || userRoleLower === 'photography') && 
                  (projectRole.includes('photograph') || projectRole.includes('photo'))) return true;
              
              // videographer/videography/video
              if ((userRoleLower === 'videographer' || userRoleLower === 'videography' || userRoleLower === 'video') && 
                  projectRole.includes('video')) return true;
              
              // model/modeling
              if ((userRoleLower === 'model' || userRoleLower === 'modeling') && 
                  projectRole.includes('model')) return true;
              
              // content creator/content creation
              if ((userRoleLower === 'content_creator' || userRoleLower === 'content creator' || userRoleLower === 'content creation') && 
                  (projectRole.includes('content') || projectRole.includes('creator'))) return true;
              
              // social media manager/smm
              if ((userRoleLower === 'smm' || userRoleLower === 'social media') && 
                  (projectRole.includes('social') || projectRole.includes('smm'))) return true;
              
              // graphic designer/design
              if ((userRoleLower === 'graphic_designer' || userRoleLower === 'graphic designer' || userRoleLower === 'designer') && 
                  (projectRole.includes('design') || projectRole.includes('graphic'))) return true;
              
              // makeup artist/makeup/mua
              if ((userRoleLower === 'makeup_artist' || userRoleLower === 'makeup artist' || userRoleLower === 'makeup' || userRoleLower === 'mua') && 
                  projectRole.includes('makeup')) return true;
              
              // stylist/styling
              if ((userRoleLower === 'stylist' || userRoleLower === 'styling') && 
                  projectRole.includes('styl')) return true;
              
              // event host/host
              if ((userRoleLower === 'event_host' || userRoleLower === 'event host' || userRoleLower === 'host') && 
                  (projectRole.includes('host') || projectRole.includes('event'))) return true;
              
              // writer/writing/copywriter
              if ((userRoleLower === 'writer' || userRoleLower === 'writing' || userRoleLower === 'copywriter') && 
                  (projectRole.includes('writ') || projectRole.includes('copy'))) return true;
              
              // influencer
              if (userRoleLower === 'influencer' && projectRole.includes('influenc')) return true;
              
              // voice over artist/voice over/vo
              if ((userRoleLower === 'voice_over' || userRoleLower === 'voice over' || userRoleLower === 'vo') && 
                  projectRole.includes('voice')) return true;
              
              return false;
            });
          });
          
          return hasMatch;
        });
        
        console.log('[CreatorOpportunities] Filtered to relevant projects:', relevantProjects.length);
        if (relevantProjects.length === 0 && userRoles.length > 0) {
          console.warn('[CreatorOpportunities] No matching projects found for roles:', userRoles);
        }
      }

      setProjects(relevantProjects);

      // Apply Priority Matching AI for sorting
      if (relevantProjects.length > 0) {
        const matched = await sortOpportunitiesByMatch(
          user.id,
          relevantProjects,
          userRoles,
          user.creator?.city || '',
          user.creator?.radiusKm || 50,
          undefined // TODO: Get creator's preferred rate from profile
        );
        setMatchedProjects(matched);
        console.log('[CreatorOpportunities] Priority matching applied. Top match score:', 
                    matched[0]?.matchScore || 0);
      } else {
        setMatchedProjects([]);
      }
    } catch (error) {
      console.error('[CreatorOpportunities] Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const openApplicationModal = (project: Project, role: any) => {
    setSelectedApplicationProject({
      id: project.id,
      title: project.title
    });
    setSelectedApplicationRole({
      id: role.id || role.title,
      title: role.title,
      budget: role.budget,
      description: role.description
    });
    setIsApplicationModalOpen(true);
  };

  const handleApplicationSuccess = async () => {
    // Add to applied slots immediately for instant UI update
    if (selectedApplicationProject && selectedApplicationRole) {
      const applicationKey = `${selectedApplicationProject.id}-${selectedApplicationRole.title}`;
      setAppliedSlots(prev => {
        const newSet = new Set(prev);
        newSet.add(applicationKey);
        console.log('[CreatorOpportunities] Applied to:', applicationKey);
        console.log('[CreatorOpportunities] Total applied slots:', newSet.size);
        return newSet;
      });
    }
    setIsApplicationModalOpen(false);
    
    // Reload applications from Firestore to ensure sync
    await loadExistingApplications();
    
    // Force re-render by triggering opportunities reload
    console.log('[CreatorOpportunities] Reloading opportunities after application');
    await loadOpportunities();
  };

  const toggleSave = (projectId: string) => {
    setSavedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
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

  // Projects are already filtered by role in loadOpportunities()
  const userRoles = user.creator?.roles || [];
  
  console.log('[CreatorOpportunities] Projects to display:', projects.length);
  console.log('[CreatorOpportunities] Sample project:', projects[0]);
  if (projects[0]) {
    console.log('[CreatorOpportunities] Sample creatorRoles:', projects[0].creatorRoles);
    console.log('[CreatorOpportunities] Open roles check:', (projects[0].creatorRoles || []).filter(r => r.status === 'OPEN'));
  }

  return (
    <div className="pb-6 bg-gradient-to-br from-blue-50/30 via-slate-50/50 to-blue-50/30 min-h-screen -mx-4 -my-4 px-4 py-6">
      {/* Submenu Tabs */}
      <div className="mb-6 bg-white rounded-xl p-1 shadow-sm border border-gray-200 flex gap-1">
        <button
          onClick={() => setActiveTab('opportunities')}
          className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
            activeTab === 'opportunities'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Briefcase className="w-4 h-4 inline mr-2" />
          Project Opportunities
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
            activeTab === 'analytics'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Analytics
        </button>
      </div>

      {/* Project Opportunities Tab */}
      {activeTab === 'opportunities' && (
        <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Project Opportunities</h1>
        <p className="text-gray-500 text-sm">
          Browse collaboration projects from businesses and apply to open roles
        </p>
        {userRoles.length > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-gray-500">Showing opportunities for:</span>
            {userRoles.map((role, idx) => (
              <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                {role}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Context Bar */}
      <CreatorContextBar user={user} />

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
            filterTab === 'all'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-purple-300'
          }`}
        >
          <Briefcase className="w-4 h-4 inline mr-1" />
          All Opportunities ({projects.length})
        </button>

        <button
          onClick={() => setFilterTab('network')}
          className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all opacity-50 cursor-not-allowed ${
            filterTab === 'network'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-700 border border-gray-200'
          }`}
          disabled
        >
          <Users className="w-4 h-4 inline mr-1" />
          From Network (Coming Soon)
        </button>

        <button
          onClick={() => setFilterTab('saved')}
          className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
            filterTab === 'saved'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-purple-300'
          }`}
        >
          <Bookmark className="w-4 h-4 inline mr-1" />
          Saved ({savedProjects.size})
        </button>

        {isCreatorPlus && (
          <div className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Priority Matching Active
          </div>
        )}
      </div>

      {/* Sort & Filter Bar */}
      <div className="mb-4 flex items-center gap-3">
        {/* Sort Dropdown */}
        <div className="relative flex-1">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 appearance-none cursor-pointer hover:border-purple-300 transition-all"
          >
            <option value="match">🎯 Best Match</option>
            <option value="budget">💰 Highest Budget</option>
            <option value="newest">✨ Newest First</option>
            <option value="deadline">⏰ Closing Soon</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
            showFilters
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-purple-300'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="mb-6 bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Advanced Filters</h3>
            <button
              onClick={() => {
                setBudgetRange([0, 5000]);
                setSelectedProjectTypes([]);
                setMaxDistance(50);
              }}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Reset All
            </button>
          </div>

          {/* Budget Range */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Budget: {budgetRange[0]} - {budgetRange[1]} pts
            </label>
            <div className="flex gap-3">
              <input
                type="range"
                min="0"
                max="5000"
                step="100"
                value={budgetRange[0]}
                onChange={(e) => setBudgetRange([parseInt(e.target.value), budgetRange[1]])}
                className="flex-1"
              />
              <input
                type="range"
                min="0"
                max="5000"
                step="100"
                value={budgetRange[1]}
                onChange={(e) => setBudgetRange([budgetRange[0], parseInt(e.target.value)])}
                className="flex-1"
              />
            </div>
          </div>

          {/* Project Types */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Project Type</label>
            <div className="flex flex-wrap gap-2">
              {['PHOTOSHOOT', 'CAMPAIGN', 'EVENT_ACTIVATION', 'CONTENT_DAY'].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedProjectTypes(prev =>
                      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                    );
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedProjectTypes.includes(type)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Distance Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Max Distance: {maxDistance} km
            </label>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={maxDistance}
              onChange={(e) => setMaxDistance(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="bg-white rounded-xl p-5 mb-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Open Projects</p>
            <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Your Applications</p>
            <p className="text-2xl font-bold text-purple-600">{appliedSlots.size}</p>
          </div>
          {isCreatorPlus && matchedProjects.length > 0 && matchedProjects[0].matchScore >= 70 && (
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Best Match</p>
              <p className="text-2xl font-bold text-purple-600">{matchedProjects[0].matchScore}%</p>
            </div>
          )}
        </div>
      </div>

      {/* Project Cards */}
      {(() => {
        // Use priority-matched projects if available, otherwise fall back to regular projects
        const displayProjects = matchedProjects.length > 0 ? matchedProjects : projects.map(p => ({ project: p, matchScore: 0, matchedSkills: [], isCreatorPlus: false, isPriorityMatch: false, matchReason: '' }));
        
        // Filter to show only projects with matching roles
        const projectsWithMatchingRoles = displayProjects.filter(item => {
          const project = item.project;
          const matchingRoles = userRoles.length > 0
            ? (project.creatorRoles || []).filter(role => 
                userRoles.some(userRole => 
                  role.title.toLowerCase().includes(userRole.toLowerCase()) ||
                  userRole.toLowerCase().includes(role.title.toLowerCase())
                )
              )
            : (project.creatorRoles || []);
          return matchingRoles.length > 0;
        });
        
        // Remove projects where user has already applied to ALL matching roles
        const projectsNotFullyApplied = projectsWithMatchingRoles.filter(item => {
          const project = item.project;
          // Get user's matching roles for this project
          const matchingRoles = userRoles.length > 0
            ? (project.creatorRoles || []).filter(role => 
                userRoles.some(userRole => 
                  role.title.toLowerCase().includes(userRole.toLowerCase()) ||
                  userRole.toLowerCase().includes(role.title.toLowerCase())
                )
              )
            : (project.creatorRoles || []);
          
          // Check if user has applied to all matching roles
          const hasUnappliedRole = matchingRoles.some(role => {
            const applicationKey = `${project.id}-${role.title}`;
            const isApplied = appliedSlots.has(applicationKey);
            return !isApplied;
          });
          
          // Debug logging
          if (!hasUnappliedRole) {
            console.log('[CreatorOpportunities] Filtering out project (all roles applied):', project.title);
          }
          
          return hasUnappliedRole; // Only show if there's at least one unapplied matching role
        });
        
        console.log('[CreatorOpportunities] Projects after filtering applied:', projectsNotFullyApplied.length, 'out of', projectsWithMatchingRoles.length);
        
        // Apply filter based on selected tab
        let filteredProjects = projectsNotFullyApplied;
        
        if (filterTab === 'network') {
          filteredProjects = projectsNotFullyApplied.filter(item => 
            false // Network feature temporarily disabled
          );
        } else if (filterTab === 'saved') {
          filteredProjects = projectsNotFullyApplied.filter(item => savedProjects.has(item.project.id));
        }

        if (filteredProjects.length === 0) {
          return (
            <div className="text-center py-12 bg-purple-50/30 rounded-3xl border border-purple-100 px-4">
              <Briefcase className="w-16 h-16 text-purple-300 mx-auto mb-4" />
              <p className="text-gray-700 font-semibold mb-2">
                {filterTab === 'network' ? 'No opportunities from your network' :
                 filterTab === 'saved' ? 'No saved opportunities' :
                 'No matching opportunities available'}
              </p>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                {filterTab === 'network' ? 'Build your network by completing projects with businesses.' :
                 filterTab === 'saved' ? 'Save opportunities to review them later.' :
                 userRoles.length > 0 
                  ? "No projects currently need your skills. Check back later!" 
                  : "Complete your creator profile to see relevant opportunities."}
              </p>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            {filteredProjects.map(matchItem => {
            const project = matchItem.project;
            const isSaved = savedProjects.has(project.id);
            
            // Get user roles directly from user object (recalculate here for card display scope)
            let userRolesForCard: string[] = [];
            if (user.creator?.roles && Array.isArray(user.creator.roles)) {
              userRolesForCard = user.creator.roles;
            } else if ((user.creator as any)?.role && typeof (user.creator as any).role === 'string') {
              userRolesForCard = [(user.creator as any).role];
            } else if ((user as any).category && typeof (user as any).category === 'string') {
              userRolesForCard = [(user as any).category];
            }
            
            console.log(`[Card Display] Project: ${project.title}, User Roles: ${userRolesForCard.join(', ')}, Project Roles:`, project.creatorRoles?.map(r => r.title));
            
            // Filter to ONLY show roles that match the user's specific skills
            const matchingRoles = userRolesForCard.length > 0
              ? (project.creatorRoles || []).filter(role => {
                  const roleLower = role.title.toLowerCase().trim();
                  
                  const matches = userRolesForCard.some(userRole => {
                    const userRoleLower = userRole.toLowerCase().trim();
                    
                    console.log(`[Role Match Check] Comparing role "${roleLower}" with user role "${userRoleLower}"`);
                    
                    // Exact match first
                    if (roleLower === userRoleLower) {
                      console.log(`[Role Match Check] ✅ EXACT MATCH`);
                      return true;
                    }
                    
                    // Model - STRICT matching
                    if (userRoleLower === 'model' || userRoleLower === 'modeling') {
                      return roleLower === 'model' || roleLower === 'modeling';
                    }
                    
                    // Photographer - STRICT matching
                    if (userRoleLower === 'photographer' || userRoleLower === 'photography') {
                      return roleLower === 'photographer' || roleLower === 'photography' || roleLower === 'photo';
                    }
                    
                    // Videographer - STRICT matching
                    if (userRoleLower === 'videographer' || userRoleLower === 'videography' || userRoleLower === 'video') {
                      return roleLower === 'videographer' || roleLower === 'videography' || roleLower === 'video';
                    }
                    
                    // Content creator
                    if (userRoleLower === 'content_creator' || userRoleLower === 'content creator' || userRoleLower === 'content creation') {
                      return roleLower === 'content creator' || roleLower === 'content_creator' || roleLower === 'content creation';
                    }
                    
                    // Social media manager
                    if (userRoleLower === 'smm' || userRoleLower === 'social media manager' || userRoleLower === 'social media') {
                      return roleLower === 'smm' || roleLower === 'social media manager' || roleLower === 'social media';
                    }
                    
                    // Graphic designer
                    if (userRoleLower === 'graphic_designer' || userRoleLower === 'graphic designer' || userRoleLower === 'designer') {
                      return roleLower === 'graphic designer' || roleLower === 'graphic_designer' || roleLower === 'designer';
                    }
                    
                    // Makeup artist
                    if (userRoleLower === 'makeup_artist' || userRoleLower === 'makeup artist' || userRoleLower === 'makeup' || userRoleLower === 'mua') {
                      return roleLower === 'makeup artist' || roleLower === 'makeup_artist' || roleLower === 'makeup' || roleLower === 'mua';
                    }
                    
                    // Stylist
                    if (userRoleLower === 'stylist' || userRoleLower === 'styling') {
                      return roleLower === 'stylist' || roleLower === 'styling';
                    }
                    
                    // Event host
                    if (userRoleLower === 'event_host' || userRoleLower === 'event host' || userRoleLower === 'host') {
                      return roleLower === 'event host' || roleLower === 'event_host' || roleLower === 'host';
                    }
                    
                    // Writer
                    if (userRoleLower === 'writer' || userRoleLower === 'writing' || userRoleLower === 'copywriter') {
                      return roleLower === 'writer' || roleLower === 'writing' || roleLower === 'copywriter';
                    }
                    
                    // Influencer
                    if (userRoleLower === 'influencer') {
                      return roleLower === 'influencer';
                    }
                    
                    // Voice over
                    if (userRoleLower === 'voice_over' || userRoleLower === 'voice over' || userRoleLower === 'vo') {
                      return roleLower === 'voice over' || roleLower === 'voice_over' || roleLower === 'vo' || roleLower === 'voice over artist';
                    }
                    
                    return false;
                  });
                  
                  console.log(`[Role Filter] Project: ${project.title}, Role: ${role.title}, User Roles: ${userRolesForCard.join(', ')}, Matches: ${matches}`);
                  return matches;
                })
              : (project.creatorRoles || []);

            console.log(`[Project Filter] ${project.title} - Matching Roles: ${matchingRoles.length}`, matchingRoles.map(r => r.title));

            // Skip projects that have no matching roles for this user
            if (matchingRoles.length === 0) return null;

            // Calculate total budget for matching roles
            const totalRoleBudget = matchingRoles.reduce((sum, role) => sum + (role.budget || 0), 0);
            
            // Get application deadline (using project date range end as fallback)
            const deadline = project.dateRange?.end || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
            const deadlineDate = new Date(deadline);
            const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

            return (
              <div
                key={project.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                {/* Horizontal Layout: Image Left, Content Right */}
                <div className="flex flex-col md:flex-row">
                  {/* Hero Image - Left Side */}
                  <div className="relative w-full md:w-80 h-64 md:h-auto bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 overflow-hidden flex-shrink-0">
                    {/* Project Image */}
                    {project.coverImage || (project.images && project.images.length > 0) ? (
                      <img 
                        src={project.coverImage || project.images[0]} 
                        alt={project.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100" />
                    )}

                    {/* Priority Match Badge - Top Right of Image */}
                    {matchItem.isPriorityMatch && (
                      <div className="absolute top-3 right-3">
                        <div className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-600 text-white shadow-sm flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {matchItem.matchScore}%
                        </div>
                      </div>
                    )}

                    {/* Bookmark - Bottom Right of Image */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSave(project.id);
                      }}
                      className="absolute bottom-3 right-3 p-2 bg-white/95 hover:bg-white rounded-full shadow-sm transition-all"
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-purple-600 text-purple-600' : 'text-gray-400'}`} />
                    </button>
                  </div>

                  {/* Content - Right Side */}
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div className="space-y-4">
                      {/* Project Title - Bold */}
                      <h3 className="text-xl font-bold text-gray-900 line-clamp-2 leading-tight">
                        {project.title}
                      </h3>

                      {/* Social Proof Badges */}
                      <div className="flex flex-wrap gap-2">
                        {/* Application Count */}
                        {matchingRoles.some(r => r.applicationCount) && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-full">
                            <Users className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-xs font-medium text-blue-700">
                              {matchingRoles.reduce((sum, r) => sum + (r.applicationCount || 0), 0)} applied
                            </span>
                          </div>
                        )}

                        {/* Business Rating */}
                        {project.businessStats?.rating && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-50 rounded-full">
                            <span className="text-xs font-medium text-yellow-700">
                              ⭐ {project.businessStats.rating.toFixed(1)}
                            </span>
                            {project.businessStats.reviewCount && (
                              <span className="text-xs text-yellow-600">
                                ({project.businessStats.reviewCount})
                              </span>
                            )}
                          </div>
                        )}

                        {/* Response Time */}
                        {project.businessStats?.averageResponseTime && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 rounded-full">
                            <Zap className="w-3.5 h-3.5 text-green-600" />
                            <span className="text-xs font-medium text-green-700">
                              Responds in {project.businessStats.averageResponseTime}h
                            </span>
                          </div>
                        )}

                        {/* Acceptance Rate */}
                        {project.businessStats?.acceptanceRate && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                            <span className="text-xs font-medium text-purple-700">
                              {project.businessStats.acceptanceRate}% acceptance
                            </span>
                          </div>
                        )}

                        {/* Distance (if coordinates available) */}
                        {project.coordinates && user.geo?.latitude && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-full">
                            <MapPin className="w-3.5 h-3.5 text-gray-600" />
                            <span className="text-xs font-medium text-gray-700">
                              {calculateDistance(
                                user.geo.latitude,
                                user.geo.longitude,
                                project.coordinates.lat,
                                project.coordinates.lng
                              ).toFixed(1)} km away
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Meta Information - Location & Deadline */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span>{project.location || project.city || 'Munich, Germany'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>
                            Event: {new Date(project.dateRange.start).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span>
                            Apply by {daysUntilDeadline > 0 
                              ? `${daysUntilDeadline} ${daysUntilDeadline === 1 ? 'day' : 'days'} left`
                              : 'Deadline passed'}
                          </span>
                        </div>
                        {matchingRoles[0]?.timeCommitment && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span>{matchingRoles[0].timeCommitment}</span>
                          </div>
                        )}
                      </div>

                      {/* Your Matching Roles - Horizontal Pills */}
                      <div className="pt-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          {matchingRoles.length === 1 ? 'Your Role' : 'Your Roles'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {matchingRoles.map((role, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 rounded-full border border-purple-200">
                              <span className="text-sm text-purple-700">{role.title}</span>
                              <span className="text-sm font-semibold text-purple-400">·</span>
                              <span className="text-sm font-semibold text-purple-600">{role.budget} pts</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Section: CTA and Trust */}
                    <div className="mt-6 space-y-3">
                      {/* Action Buttons Row */}
                      <div className="flex items-center gap-2">
                        {/* Primary CTA Button */}
                        <button
                          onClick={() => setSelectedProject(project)}
                          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3 px-6 rounded-xl transition-all inline-flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                        >
                          View & Apply
                          <ExternalLink className="w-4 h-4" />
                        </button>

                        {/* Quick Action Buttons */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Share functionality
                            if (navigator.share) {
                              navigator.share({
                                title: project.title,
                                text: `Check out this creator opportunity: ${project.title}`,
                                url: window.location.href
                              });
                            }
                          }}
                          className="p-3 bg-white border-2 border-gray-200 hover:border-purple-300 rounded-xl transition-all"
                          title="Share opportunity"
                        >
                          <Share2 className="w-4 h-4 text-gray-600" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Report functionality placeholder
                            alert('Report feature coming soon');
                          }}
                          className="p-3 bg-white border-2 border-gray-200 hover:border-red-300 rounded-xl transition-all"
                          title="Report inappropriate"
                        >
                          <Flag className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>

                      {/* Trust & Payment Info */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {project.paymentInfo?.verified && (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                            <span>Verified payments</span>
                          </span>
                        )}
                        {project.paymentInfo?.timeline && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <span>{project.paymentInfo.timeline}</span>
                          </span>
                        )}
                        {project.businessStats?.completedProjects && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-purple-600" />
                            <span>{project.businessStats.completedProjects} completed</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
      })()}
        </>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Analytics Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Opportunity Analytics</h1>
            <p className="text-gray-500 text-sm">
              Track your application performance and gain insights into the opportunities market
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <Briefcase className="w-8 h-8 opacity-80" />
                <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">Total</span>
              </div>
              <p className="text-3xl font-bold mb-1">{appliedSlots.size}</p>
              <p className="text-xs opacity-90">Applications Sent</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <Target className="w-8 h-8 opacity-80" />
                <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">Active</span>
              </div>
              <p className="text-3xl font-bold mb-1">{projects.length}</p>
              <p className="text-xs opacity-90">Available Projects</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <TrendingUp className="w-8 h-8 opacity-80" />
                <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">Rate</span>
              </div>
              <p className="text-3xl font-bold mb-1">
                {appliedSlots.size > 0 ? Math.round((appliedSlots.size / projects.length) * 100) : 0}%
              </p>
              <p className="text-xs opacity-90">Application Rate</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <Sparkles className="w-8 h-8 opacity-80" />
                <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">Match</span>
              </div>
              <p className="text-3xl font-bold mb-1">
                {matchedProjects.length > 0 && matchedProjects[0]?.matchScore 
                  ? Math.round(matchedProjects[0].matchScore) 
                  : 0}%
              </p>
              <p className="text-xs opacity-90">Best Match Score</p>
            </div>
          </div>

          {/* Market Intelligence */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Market Intelligence
            </h3>
            <CompetitiveInsights 
              creatorId={user.id}
              creatorName={user.name || 'Creator'}
              category={(user as any).category || 'General'}
              skills={(user as any).skills || []}
              rating={(user as any).rating || 0}
              completedProjects={(user as any).completedProjects || 0}
              currentPrice={(user as any).averagePrice || 1000}
            />
          </div>

          {/* Application Activity */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Application Activity
            </h3>
            {appliedSlots.size === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm mb-4">No applications yet</p>
                <button
                  onClick={() => setActiveTab('opportunities')}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Browse Opportunities
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  You've applied to {appliedSlots.size} role{appliedSlots.size !== 1 ? 's' : ''} across {projects.length} project{projects.length !== 1 ? 's' : ''}
                </p>
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Pro Tip</p>
                  <p className="text-xs text-gray-600">
                    Apply to 3-5 opportunities per week to maximize your chances while maintaining quality applications.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Opportunity Insights */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              Opportunity Insights
            </h3>
            <div className="space-y-4">
              {/* Saved Projects */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Bookmark className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Saved Projects</p>
                    <p className="text-xs text-gray-500">Projects you bookmarked</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-purple-600">{savedProjects.size}</span>
              </div>

              {/* Average Budget */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Avg. Project Budget</p>
                    <p className="text-xs text-gray-500">Across all opportunities</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {projects.length > 0 
                    ? Math.round(
                        projects.reduce((sum, p) => {
                          const totalBudget = (p.creatorRoles || []).reduce((s, r) => s + (r.budget || 0), 0);
                          return sum + totalBudget;
                        }, 0) / projects.length
                      )
                    : 0}
                </span>
              </div>

              {/* Creator Plus Status */}
              {isCreatorPlus ? (
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Creator Plus Active</p>
                      <p className="text-xs text-gray-500">Priority matching enabled</p>
                    </div>
                  </div>
                  <Zap className="w-8 h-8 text-purple-600" />
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-semibold text-gray-900">Upgrade to Creator Plus</p>
                      <p className="text-xs text-gray-500">Get priority matching & more</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all">
                    Upgrade
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Application Modal */}
      {selectedApplicationProject && selectedApplicationRole && (
        <ApplicationModal
          isOpen={isApplicationModalOpen}
          onClose={() => setIsApplicationModalOpen(false)}
          projectId={selectedApplicationProject.id}
          projectTitle={selectedApplicationProject.title}
          role={selectedApplicationRole}
          onSuccess={handleApplicationSuccess}
        />
      )}

      {/* Project Detail View */}
      {selectedProject && (
        <CreatorProjectDetailView
          project={selectedProject}
          user={user}
          appliedRoles={appliedSlots}
          onClose={() => setSelectedProject(null)}
          onApplicationSuccess={() => {
            setSelectedProject(null);
            loadExistingApplications();
          }}
        />
      )}
    </div>
  );
};
