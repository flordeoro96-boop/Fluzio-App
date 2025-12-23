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
  TrendingUp
} from 'lucide-react';
import { User, Project, ProjectSlot } from '../types';
import { getProjects, getCreatorApplications } from '../services/projectService';
import { sortOpportunitiesByMatch } from '../services/priorityMatchingService';
import { getUserFeatures } from '../services/creatorPlusService';
import { CreatorContextBar } from './CreatorContextBar';
import { ApplicationModal } from './ApplicationModal';

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
      
      // Filter projects to only show those with creator roles
      const userRoles = user.creator?.roles || [];
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
          const matchingRoles = (project.creatorRoles || []).filter(role => 
            userRoles.some(userRole => 
              role.title.toLowerCase().includes(userRole.toLowerCase()) ||
              userRole.toLowerCase().includes(role.title.toLowerCase())
            )
          );
          return matchingRoles.length > 0;
        });
        
        console.log('[CreatorOpportunities] Filtered to relevant projects:', relevantProjects.length);
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

  const handleApplicationSuccess = () => {
    // Add to applied slots
    if (selectedApplicationProject && selectedApplicationRole) {
      setAppliedSlots(prev => new Set(prev).add(`${selectedApplicationProject.id}-${selectedApplicationRole.title}`));
    }
    setIsApplicationModalOpen(false);
    // Reload applications to sync with Firestore
    loadExistingApplications();
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

  // Filter projects to only show those with matching creator roles
  const userRoles = user.creator?.roles || [];
  
  // If user has roles, filter by matching roles. Otherwise show all projects with creator roles
  const projectsWithMatchingRoles = userRoles.length > 0 
    ? projects.filter(p => {
        const matchingRoles = (p.creatorRoles || []).filter(role => 
          userRoles.some(userRole => 
            role.title.toLowerCase().includes(userRole.toLowerCase()) ||
            userRole.toLowerCase().includes(role.title.toLowerCase())
          )
        );
        return matchingRoles.length > 0;
      })
    : projects.filter(p => 
        (p.creatorRoles || []).length > 0
      );
  
  console.log('[CreatorOpportunities] Projects to display:', projects.length);
  console.log('[CreatorOpportunities] Projects with matching roles:', projectsWithMatchingRoles.length);
  console.log('[CreatorOpportunities] Sample project:', projects[0]);
  if (projects[0]) {
    console.log('[CreatorOpportunities] Sample creatorRoles:', projects[0].creatorRoles);
    console.log('[CreatorOpportunities] Open roles check:', (projects[0].creatorRoles || []).filter(r => r.status === 'OPEN'));
  }

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1E0E62] mb-2">Project Opportunities</h1>
        <p className="text-gray-600 text-sm">
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

      {/* Stats */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Open Projects</p>
            <p className="text-2xl font-bold text-purple-700">{projects.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Your Applications</p>
            <p className="text-2xl font-bold text-pink-600">{appliedSlots.size}</p>
          </div>
          {isCreatorPlus && matchedProjects.length > 0 && matchedProjects[0].matchScore >= 70 && (
            <div>
              <p className="text-sm text-gray-600">Best Match</p>
              <p className="text-2xl font-bold text-purple-700">{matchedProjects[0].matchScore}%</p>
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
        
        // Apply filter based on selected tab
        let filteredProjects = projectsWithMatchingRoles;
        
        if (filterTab === 'network') {
          filteredProjects = projectsWithMatchingRoles.filter(item => 
            false // Network feature temporarily disabled
          );
        } else if (filterTab === 'saved') {
          filteredProjects = projectsWithMatchingRoles.filter(item => savedProjects.has(item.project.id));
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
            
            // Filter to only show roles that match the user's skills (or all if no skills set)
            const matchingRoles = userRoles.length > 0
              ? (project.creatorRoles || []).filter(role => 
                  userRoles.some(userRole => 
                    role.title.toLowerCase().includes(userRole.toLowerCase()) ||
                    userRole.toLowerCase().includes(role.title.toLowerCase())
                  )
                )
              : (project.creatorRoles || []);

            return (
              <div
                key={project.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                {/* Priority Match Badge */}
                {matchItem.isPriorityMatch && (
                  <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl">
                    <Target className="w-4 h-4" />
                    <span className="text-sm font-semibold">Priority Match • {matchItem.matchScore}% fit</span>
                    <Sparkles className="w-4 h-4 ml-auto" />
                  </div>
                )}
                
                {/* High Match Badge (for non-Plus users with good matches) */}
                {!matchItem.isPriorityMatch && matchItem.matchScore >= 70 && (
                  <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-semibold">Great Match • {matchItem.matchScore}% fit</span>
                  </div>
                )}
                
                {/* Match Reason */}
                {matchItem.matchReason && matchItem.matchScore >= 60 && (
                  <div className="mb-3 text-xs text-gray-600 flex items-center gap-1">
                    <span className="font-medium text-purple-600">Why this matches:</span>
                    <span>{matchItem.matchReason}</span>
                  </div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 flex items-center gap-1">
                        {project.projectType || 'PROJECT'}
                      </span>
                      {/* Network Badge */}
                      {false && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          From Network
                        </span>
                      )}
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                        {matchingRoles.length} role{matchingRoles.length !== 1 ? 's' : ''} for you
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[#1E0E62] mb-1">
                      {project.title}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Building2 className="w-4 h-4" />
                      <span>Posted by business</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleSave(project.id)}
                    className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
                    title={isSaved ? 'Remove from saved' : 'Save for later'}
                  >
                    <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-purple-600 text-purple-600' : 'text-gray-400'}`} />
                  </button>
                </div>

                {/* Total Budget */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Total Project Budget</span>
                    <span className="text-lg font-bold text-green-700">
                      {project.totalCost} pts
                    </span>
                  </div>
                </div>

                {/* Open Roles (Only Matching) */}
                <div className="space-y-2 mb-4">
                  <p className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    Roles for You:
                  </p>
                  {matchingRoles.map((role, idx) => {
                    const slotKey = `${project.id}-${role.title}`;
                    const hasApplied = appliedSlots.has(slotKey);
                    
                    return (
                      <div
                        key={idx}
                        className="bg-gray-50 rounded-xl p-3 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{role.title}</p>
                          <div className="flex items-center gap-1 text-sm">
                            <DollarSign className="w-3 h-3 text-green-600" />
                            <span className="font-bold text-green-600">{role.budget} pts</span>
                          </div>
                        </div>
                        {!hasApplied ? (
                          <button
                            onClick={() => openApplicationModal(project, role)}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-2 px-4 rounded-xl hover:shadow-lg transition-all text-sm"
                          >
                            Apply
                          </button>
                        ) : (
                          <button
                            disabled
                            className="bg-green-100 text-green-700 font-semibold py-2 px-4 rounded-xl cursor-not-allowed text-sm"
                          >
                            <CheckCircle2 className="w-4 h-4 inline mr-1" />
                            Applied
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Info */}
                <div className="text-xs text-purple-600 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Apply to collaborate and earn points for your work!
                </div>
              </div>
            );
          })}
        </div>
      );
      })()}

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
    </div>
  );
};
