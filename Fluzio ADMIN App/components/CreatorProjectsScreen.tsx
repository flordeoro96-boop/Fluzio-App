/**
 * Creator Projects Screen
 * View and manage active, pending, and completed collaborations
 */

import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Star,
  Upload,
  MessageCircle,
  Award,
  AlertCircle
} from 'lucide-react';
import { User, Project as FullProject } from '../types';
import { getCreatorApplications, getProjects } from '../services/projectService';
import { formatDistanceToNow, format } from 'date-fns';
import { CreatorContextBar } from './CreatorContextBar';
import { ProjectCastingView } from './ProjectCastingView';

interface CreatorProjectsScreenProps {
  user: User;
  onNavigate: (route: string) => void;
}

type ProjectStatus = 'pending' | 'active' | 'completed' | 'rejected';

interface Project {
  id: string;
  missionId: string;
  missionTitle: string;
  businessName: string;
  status: ProjectStatus;
  appliedAt: string;
  startDate?: string;
  completedAt?: string;
  contentDeadline?: string;
  note?: string;
  // Achievement fields
  completedOnTime?: boolean;
  repeatCollaboration?: boolean;
  rating?: number;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 border-yellow-300 text-yellow-700',
    icon: Clock,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  active: {
    label: 'Active',
    color: 'bg-purple-100 border-purple-300 text-purple-700',
    icon: Briefcase,
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-100 border-green-300 text-green-700',
    icon: CheckCircle2,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  rejected: {
    label: 'Not Selected',
    color: 'bg-gray-100 border-gray-300 text-gray-600',
    icon: AlertCircle,
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  }
};

export const CreatorProjectsScreen: React.FC<CreatorProjectsScreenProps> = ({
  user,
  onNavigate
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | ProjectStatus>('all');
  const [viewingProject, setViewingProject] = useState<FullProject | null>(null);
  const [viewingProjectRoles, setViewingProjectRoles] = useState<any[]>([]);
  const [appliedSlots, setAppliedSlots] = useState<Set<string>>(new Set());
  const [applicationStatuses, setApplicationStatuses] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    loadProjects();
  }, [user.id]);

  const handleViewProject = async (projectId: string) => {
    try {
      // Fetch full project data
      const allProjects = await getProjects();
      const fullProject = allProjects.find(p => p.id === projectId);
      
      if (fullProject) {
        // Get user roles for filtering
        const userRoles = (user.creator?.roles || []).map(role => role.toLowerCase());
        
        // Filter matching roles
        const matchingRoles = userRoles.length > 0
          ? (fullProject.creatorRoles || []).filter(role => 
              (role.status === 'OPEN' || role.status === 'DRAFT') && 
              userRoles.some(userRole => 
                role.title.toLowerCase().includes(userRole) ||
                userRole.includes(role.title.toLowerCase())
              )
            )
          : (fullProject.creatorRoles || []).filter(role => role.status === 'OPEN' || role.status === 'DRAFT');
        
        // Build applied slots and status map
        const applications = await getCreatorApplications(user.id);
        const slots = new Set<string>();
        const statusMap = new Map<string, string>();
        
        applications.forEach(app => {
          if (app.projectId === projectId) {
            const key = `${app.projectId}-${app.roleName}`;
            slots.add(key);
            statusMap.set(key, app.status);
          }
        });
        
        setAppliedSlots(slots);
        setApplicationStatuses(statusMap);
        setViewingProject(fullProject);
        setViewingProjectRoles(matchingRoles);
      }
    } catch (error) {
      console.error('[CreatorProjects] Error loading project details:', error);
    }
  };

  const loadProjects = async () => {
    try {
      setLoading(true);
      const applications = await getCreatorApplications(user.id);
      console.log('[CreatorProjects] Loaded applications:', applications);
      
      // Map applications to projects
      const projectList: Project[] = applications.map(app => ({
        id: app.id,
        missionId: app.projectId || '',
        missionTitle: app.roleName || 'Project', // Use roleName from application
        businessName: 'Business', // TODO: Fetch from userService using app.businessId
        status: app.status === 'ACCEPTED' ? 'active' : 
                app.status === 'REJECTED' ? 'rejected' : 'pending',
        appliedAt: app.createdAt || new Date().toISOString(), // Ensure never undefined
        note: app.coverLetter || '' // coverLetter exists in interface
        // TODO: Add remaining fields from project data
      }));

      console.log('[CreatorProjects] Mapped to projects:', projectList);
      setProjects(projectList);
    } catch (error) {
      console.error('[CreatorProjects] Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNextAction = (project: Project): string | null => {
    if (project.status === 'pending') {
      return 'Waiting for business confirmation';
    }
    if (project.status === 'active') {
      if (project.contentDeadline) {
        const daysUntil = Math.ceil((new Date(project.contentDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysUntil <= 0) return 'Upload content (overdue)';
        if (daysUntil <= 3) return `Upload content by ${format(new Date(project.contentDeadline), 'MMM dd')}`;
        return `Next: Upload content by ${format(new Date(project.contentDeadline), 'MMM dd')}`;
      }
      return 'Next step required: Message business';
    }
    return null;
  };

  const getAchievements = (project: Project): string[] => {
    if (project.status !== 'completed') return [];
    
    const achievements: string[] = [];
    if (project.completedOnTime) achievements.push('✓ Completed on time');
    if (project.repeatCollaboration) achievements.push('⭐ Selected again by this business');
    if (project.rating && project.rating >= 4.5) achievements.push('🌟 Highly rated');
    
    return achievements;
  };

  const filteredProjects = filter === 'all' 
    ? projects 
    : projects.filter(p => p.status === filter);

  const counts = {
    all: projects.length,
    pending: projects.filter(p => p.status === 'pending').length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length
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
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Active Projects</h1>
        <p className="text-sm text-gray-600">
          Track your applications and active collaborations
        </p>
      </div>

      {/* Context Bar */}
      <CreatorContextBar user={user} />

      {/* Filter Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setFilter('all')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              filter === 'all'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            All ({counts.all})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              filter === 'pending'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Pending ({counts.pending})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              filter === 'active'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Active ({counts.active})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              filter === 'completed'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Completed ({counts.completed})
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-12 bg-gray-50 border border-gray-200 px-4">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-900 font-medium mb-2">
            {filter === 'all' ? 'No projects yet' : `No ${filter} projects`}
          </p>
          <p className="text-gray-600 text-sm max-w-md mx-auto">
            {filter === 'pending' && 'Your applications will appear here once you apply to castings.'}
            {filter === 'active' && 'Accepted applications will show here. Apply to castings to start collaborating.'}
            {filter === 'completed' && 'Your completed projects will be saved here.'}
            {filter === 'all' && 'Apply to open castings to start collaborating with businesses.'}
          </p>
          {filter === 'all' && (
            <button
              onClick={() => onNavigate('creator-opportunities')}
              className="mt-4 text-gray-900 font-medium text-sm hover:underline"
            >
              Browse Castings →
            </button>
          )}
        </div>
      )}

      {/* Project Cards */}
      <div className="space-y-2">
        {filteredProjects.map(project => {
          const config = statusConfig[project.status];
          const nextAction = getNextAction(project);
          const achievements = getAchievements(project);

          return (
            <div
              key={project.id}
              className="bg-white border border-gray-200 hover:border-gray-300 transition-colors"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      {project.missionTitle}
                    </h3>
                    <p className="text-xs text-gray-600">{project.businessName}</p>
                  </div>
                  <span className={`ml-3 flex-shrink-0 px-2 py-1 text-xs font-medium ${
                    project.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                    project.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' :
                    project.status === 'completed' ? 'bg-gray-100 text-gray-700 border border-gray-200' :
                    'bg-gray-50 text-gray-600 border border-gray-200'
                  }`}>
                    {config.label}
                  </span>
                </div>
              </div>

              {/* Next Action Hint */}
              {nextAction && (
                <div className="px-4 py-2 bg-amber-50 border-b border-amber-100">
                  <p className="text-xs text-amber-900 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    {nextAction}
                  </p>
                </div>
              )}

              {/* Timeline & Info */}
              <div className="px-4 py-3">
                <div className="text-xs text-gray-600 space-y-1 mb-3">
                  <p>Applied {formatDistanceToNow(new Date(project.appliedAt), { addSuffix: true })}</p>
                  {project.completedAt && (
                    <p>Completed {formatDistanceToNow(new Date(project.completedAt), { addSuffix: true })}</p>
                  )}
                </div>

                {/* Achievements (for completed projects) */}
                {achievements.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {achievements.map((achievement, idx) => (
                      <span
                        key={idx}
                        className="text-xs text-gray-700"
                      >
                        {achievement}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewProject(project.missionId)}
                    className="flex-1 text-xs text-gray-600 hover:text-gray-900 py-2 border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    View details
                  </button>
                  {project.status === 'active' && (
                    <button
                      onClick={() => onNavigate(`/inbox?projectId=${project.missionId}`)}
                      className="flex-1 bg-gray-900 text-white text-xs font-medium py-2 hover:bg-gray-800 transition-colors flex items-center justify-center gap-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Contact
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Professional Casting View */}
      {viewingProject && (
        <ProjectCastingView
          project={viewingProject}
          matchingRoles={viewingProjectRoles}
          appliedSlots={appliedSlots}
          applicationStatuses={applicationStatuses}
          onClose={() => {
            setViewingProject(null);
            setViewingProjectRoles([]);
          }}
          onApplyToRole={(role) => {
            // Already applied, but keep for interface compatibility
            setViewingProject(null);
            setViewingProjectRoles([]);
          }}
        />
      )}
    </div>
  );
};
