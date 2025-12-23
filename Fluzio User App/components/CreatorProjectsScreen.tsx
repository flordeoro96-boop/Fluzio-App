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
import { User } from '../types';
import { getCreatorApplications } from '../services/applicationService';
import { formatDistanceToNow, format } from 'date-fns';
import { CreatorContextBar } from './CreatorContextBar';

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

  useEffect(() => {
    loadProjects();
  }, [user.id]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const applications = await getCreatorApplications(user.id);
      
      // Map applications to projects
      // In production, fetch additional mission/business details
      const projectList: Project[] = applications.map(app => ({
        id: app.id,
        missionId: app.missionId,
        missionTitle: 'Mission Title', // TODO: Fetch from missionService
        businessName: 'Business Name', // TODO: Fetch from userService
        status: app.status === 'accepted' ? 'active' : 
                app.status === 'rejected' ? 'rejected' : 'pending',
        appliedAt: app.createdAt,
        note: app.note
        // TODO: Add remaining fields from mission/project data
      }));

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
      return 'Contact business for next steps';
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
        <h1 className="text-2xl font-bold text-[#1E0E62] mb-2">Projects</h1>
        <p className="text-gray-600 text-sm">
          Track your applications and active collaborations
        </p>
      </div>

      {/* Context Bar */}
      <CreatorContextBar user={user} />

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
            filter === 'all'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-purple-300'
          }`}
        >
          All ({counts.all})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
            filter === 'pending'
              ? 'bg-yellow-500 text-white shadow-lg'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-yellow-300'
          }`}
        >
          Pending ({counts.pending})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
            filter === 'active'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-purple-300'
          }`}
        >
          Active ({counts.active})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
            filter === 'completed'
              ? 'bg-green-600 text-white shadow-lg'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-green-300'
          }`}
        >
          Completed ({counts.completed})
        </button>
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-12 bg-purple-50/30 rounded-3xl border border-purple-100 px-4">
          <Briefcase className="w-16 h-16 text-purple-300 mx-auto mb-4" />
          <p className="text-gray-700 font-semibold mb-2">
            {filter === 'all' ? 'No projects yet' : `No ${filter} projects`}
          </p>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            {filter === 'pending' && 'Your applications will appear here once you apply to opportunities.'}
            {filter === 'active' && 'Accepted applications will show here. Apply to opportunities to start collaborating.'}
            {filter === 'completed' && 'Your completed projects will be saved here with achievements and ratings.'}
            {filter === 'all' && 'Apply to opportunities above to start collaborating with businesses.'}
          </p>
          {filter === 'all' && (
            <button
              onClick={() => onNavigate('creator-opportunities')}
              className="mt-4 text-purple-600 font-medium text-sm hover:underline"
            >
              Browse Opportunities →
            </button>
          )}
        </div>
      )}

      {/* Project Cards */}
      <div className="space-y-4">
        {filteredProjects.map(project => {
          const config = statusConfig[project.status];
          const StatusIcon = config.icon;
          const nextAction = getNextAction(project);
          const achievements = getAchievements(project);

          return (
            <div
              key={project.id}
              className={`rounded-2xl p-5 border-2 shadow-sm ${config.bgColor} ${config.borderColor}`}
            >
              {/* Status Indicator */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${config.color}`}>
                  <StatusIcon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-[#1E0E62]">{project.missionTitle}</h3>
                  <p className="text-sm text-gray-600">{project.businessName}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${config.color} border`}>
                  {config.label}
                </span>
              </div>

              {/* Next Action Hint */}
              {nextAction && (
                <div className="mb-3 px-3 py-2 bg-white/60 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-700 font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {nextAction}
                  </p>
                </div>
              )}

              {/* Achievements (for completed projects) */}
              {achievements.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {achievements.map((achievement, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full border border-green-200"
                    >
                      {achievement}
                    </span>
                  ))}
                </div>
              )}

              {/* Timeline */}
              <div className="text-xs text-gray-500 space-y-1">
                <p>Applied {formatDistanceToNow(new Date(project.appliedAt), { addSuffix: true })}</p>
                {project.completedAt && (
                  <p>Completed {formatDistanceToNow(new Date(project.completedAt), { addSuffix: true })}</p>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => onNavigate(`mission/${project.missionId}`)}
                  className="flex-1 bg-white text-gray-700 font-semibold py-2 px-4 rounded-xl hover:bg-gray-50 transition-colors text-sm border border-gray-200"
                >
                  View Mission
                </button>
                {project.status === 'active' && (
                  <button
                    className="flex-1 bg-purple-600 text-white font-semibold py-2 px-4 rounded-xl hover:shadow-lg transition-all text-sm"
                  >
                    <MessageCircle className="w-4 h-4 inline mr-1" />
                    Message Business
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
