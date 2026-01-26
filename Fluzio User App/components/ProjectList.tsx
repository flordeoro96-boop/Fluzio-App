
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Project, ProjectType } from '../types';
import { Card } from './Common';
import { PiggyBank, Users, Briefcase, Calendar, MapPin, FileText, Crown, Sparkles, Globe } from 'lucide-react';
import { ZeroState } from './ZeroState';
import { getProjectApplications } from '../services/projectService';

interface ProjectListProps {
  projects: Project[];
  currentUserId: string; // To determine if user is lead
  currentUserBusinessType?: string; // Business type for matching
  currentUserCategory?: string; // Business category for matching
  onCreateProject: () => void;
  onOpenProject: (projectId: string) => void;
}

const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  PHOTOSHOOT: 'Photoshoot',
  CAMPAIGN: 'Campaign',
  EVENT_ACTIVATION: 'Event Activation',
  CONTENT_DAY: 'Content Day'
};

const STATUS_COLORS = {
  PLANNING: 'bg-blue-100 text-blue-700',
  READY: 'bg-green-100 text-green-700',
  IN_PROGRESS: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-gray-100 text-gray-600'
};

const STATUS_LABELS = {
  PLANNING: 'Planning',
  READY: 'Ready for execution',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed'
};

const formatDateRange = (dateRange: { start: string; end: string }) => {
  const start = new Date(dateRange.start);
  const end = new Date(dateRange.end);
  
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const startStr = start.toLocaleDateString('en-US', options);
  const endStr = end.toLocaleDateString('en-US', options);
  
  if (startStr === endStr) return startStr;
  return `${startStr}–${endStr}`;
};

export const ProjectList: React.FC<ProjectListProps> = ({ 
  projects, 
  currentUserId,
  currentUserBusinessType,
  currentUserCategory,
  onCreateProject,
  onOpenProject 
}) => {
  const { t } = useTranslation();
  const [applicationCounts, setApplicationCounts] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<'your' | 'interesting' | 'all'>('your');

  useEffect(() => {
    loadApplicationCounts();
  }, [projects]);

  // Helper function to check if a project is interesting for the current business
  const isProjectInteresting = (project: Project): boolean => {
    // Don't show own projects or projects already joined
    if (project.leadBusinessId === currentUserId || 
        project.participatingBusinesses.includes(currentUserId)) {
      return false;
    }

    // Check if any business role matches the user's business type or category
    return project.businessRoles.some(role => {
      if (role.status !== 'OPEN') return false;
      
      const roleTitle = role.title.toLowerCase();
      const businessType = currentUserBusinessType?.toLowerCase() || '';
      const category = currentUserCategory?.toLowerCase() || '';
      
      // Check if role title contains business type or category
      return roleTitle.includes(businessType) || 
             roleTitle.includes(category) ||
             (businessType && roleTitle.includes(businessType.replace(/\s+/g, ''))) ||
             (category && roleTitle.includes(category.replace(/\s+/g, '')));
    });
  };

  // Categorize projects
  const yourProjects = projects.filter(p => 
    p.leadBusinessId === currentUserId || p.participatingBusinesses.includes(currentUserId)
  );
  
  const interestingProjects = projects.filter(p => isProjectInteresting(p));
  
  const allOtherProjects = projects.filter(p => 
    p.leadBusinessId !== currentUserId && 
    !p.participatingBusinesses.includes(currentUserId) &&
    !isProjectInteresting(p)
  );

  // Get current projects based on active tab
  const getCurrentProjects = () => {
    switch (activeTab) {
      case 'your':
        return yourProjects;
      case 'interesting':
        return interestingProjects;
      case 'all':
        return allOtherProjects;
      default:
        return yourProjects;
    }
  };

  const currentProjects = getCurrentProjects();

  const loadApplicationCounts = async () => {
    const counts: Record<string, number> = {};
    
    for (const project of projects) {
      if (project.leadBusinessId === currentUserId) {
        try {
          const applications = await getProjectApplications(project.id);
          const pendingCount = applications.filter(app => app.status === 'PENDING').length;
          if (pendingCount > 0) {
            counts[project.id] = pendingCount;
          }
        } catch (error) {
          console.error('[ProjectList] Error loading applications:', error);
        }
      }
    }
    
    setApplicationCounts(counts);
  };
  
  // Get empty state based on active tab
  const getEmptyState = () => {
    switch (activeTab) {
      case 'your':
        return (
          <ZeroState 
            icon={PiggyBank}
            title={t('business.splitCosts')}
            description={t('business.splitCostsDescription')}
            actionLabel={t('business.createFirstProject')}
            onAction={onCreateProject}
          />
        );
      case 'interesting':
        return (
          <div className="text-center py-12">
            <Sparkles className="w-16 h-16 text-purple-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No matching projects yet</h3>
            <p className="text-gray-600">
              We'll show you projects that need businesses like yours
            </p>
          </div>
        );
      case 'all':
        return (
          <div className="text-center py-12">
            <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No other projects</h3>
            <p className="text-gray-600">
              All available projects are shown in other tabs
            </p>
          </div>
        );
    }
  };
  
  if (currentProjects.length === 0) {
    return (
      <div className="space-y-4">
        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl border border-gray-200 p-1 flex gap-1">
          <button
            onClick={() => setActiveTab('your')}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'your'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Crown className="w-4 h-4" />
            Your Projects ({yourProjects.length})
          </button>
          <button
            onClick={() => setActiveTab('interesting')}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'interesting'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Interesting for you ({interestingProjects.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Globe className="w-4 h-4" />
            All Others ({allOtherProjects.length})
          </button>
        </div>
        
        {getEmptyState()}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl border border-gray-200 p-1 flex gap-1">
        <button
          onClick={() => setActiveTab('your')}
          className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'your'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Crown className="w-4 h-4" />
          Your Projects ({yourProjects.length})
        </button>
        <button
          onClick={() => setActiveTab('interesting')}
          className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'interesting'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Interesting ({interestingProjects.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'all'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Globe className="w-4 h-4" />
          All Others ({allOtherProjects.length})
        </button>
      </div>

      {/* Create New Project Button - Only show in "Your Projects" tab */}
      {activeTab === 'your' && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Your Projects</h3>
              <p className="text-sm text-gray-600">You can create and participate in multiple projects</p>
            </div>
            <button
              onClick={onCreateProject}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-2 px-4 rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
            >
              <PiggyBank className="w-4 h-4" />
              Create New Project
            </button>
          </div>
        </div>
      )}

      {/* Projects List */}
      {currentProjects.map(project => {
        const isLead = project.leadBusinessId === currentUserId;
        const totalBusinesses = 1 + project.participatingBusinesses.length; // Lead + partners
        const filledSlots = project.slots.filter(s => s.status === 'FUNDED').length;
        const totalSlots = project.slots.length;

        return (
          <Card 
            key={project.id} 
            className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onOpenProject(project.id)}
          >
            {/* Cover Image */}
            {(project.coverImage || (project.images && project.images.length > 0)) && (
              <div className="w-full h-48 overflow-hidden bg-gray-100">
                <img 
                  src={project.coverImage || project.images![0]} 
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="p-5">
              {/* A. Project Identity */}
              <div className="mb-3">
                <h3 className="font-bold text-lg text-[#1E0E62] mb-2">
                  {project.title}
                </h3>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">
                  {PROJECT_TYPE_LABELS[project.projectType]}
                </span>
              </div>

              {/* B. Context Line */}
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <MapPin className="w-4 h-4" />
                <span>{project.city}</span>
                <span className="text-gray-300">·</span>
                <Calendar className="w-4 h-4" />
                <span>{formatDateRange(project.dateRange)}</span>
              </div>

              {/* C. Your Position */}
              <div className="mb-3">
                {activeTab === 'your' ? (
                  <span className={`text-xs font-bold ${
                    isLead 
                      ? 'text-purple-700 bg-purple-50' 
                      : 'text-blue-700 bg-blue-50'
                  } px-3 py-1.5 rounded-full`}>
                    {isLead ? '👑 You are lead business' : '🤝 You are a co-partner'}
                  </span>
                ) : (
                  <span className="text-xs font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
                    🌟 Open to join
                  </span>
                )}
              </div>

              {/* D. Project Status */}
              <div className="mb-4">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                  STATUS_COLORS[project.status]
                }`}>
                  {STATUS_LABELS[project.status]}
                </span>
              </div>

              {/* E. High-level Indicators */}
              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold text-gray-700">{totalBusinesses}</span>
                  <span className="text-gray-500 text-xs">businesses</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold text-gray-700">{filledSlots}/{totalSlots}</span>
                  <span className="text-gray-500 text-xs">roles filled</span>
                </div>
                {isLead && applicationCounts[project.id] > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-purple-500" />
                    <span className="font-semibold text-purple-700">{applicationCounts[project.id]}</span>
                    <span className="text-purple-600 text-xs">new applications</span>
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold animate-pulse">
                      NEW
                    </span>
                  </div>
                )}
              </div>

              {/* F. Single Action */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenProject(project.id);
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-4 rounded-xl hover:shadow-lg transition-all"
              >
                Open project
              </button>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
