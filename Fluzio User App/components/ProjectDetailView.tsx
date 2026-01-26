/**
 * Project Detail View - Inside view after opening a project
 * Allows businesses to run collaboration, understand involvement, and next steps
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Calendar, 
  Building2, 
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Lock,
  Package,
  Wrench,
  MapPinned,
  Eye,
  DollarSign,
  Gift,
  Users,
  Camera,
  Send,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  FileText,
  ExternalLink
} from 'lucide-react';
import { Project, BusinessRole, CreatorRole, ProjectTask, User } from '../types';
import { getProjectApplications, updateApplicationStatus, ProjectApplication } from '../services/projectService';
import { getOrCreateProjectConversation } from '../services/conversationService';

interface ProjectDetailViewProps {
  project: Project;
  currentUser: User;
  onClose: () => void;
  onJoinRole?: (roleId: string) => void;
  onSendToCreators?: (roleId: string) => void;
  onOpenChat?: (conversationId?: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const PROJECT_TYPE_LABELS = {
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

const BUSINESS_ROLE_STATUS_COLORS = {
  OPEN: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700'
};

const CREATOR_ROLE_STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-600',
  OPEN: 'bg-green-100 text-green-700',
  FILLED: 'bg-blue-100 text-blue-700'
};

const TASK_STATUS_ICONS = {
  TODO: Clock,
  IN_PROGRESS: AlertCircle,
  COMPLETED: CheckCircle2
};

const TASK_STATUS_COLORS = {
  TODO: 'text-gray-400',
  IN_PROGRESS: 'text-yellow-500',
  COMPLETED: 'text-green-500'
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

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project,
  currentUser,
  onClose,
  onJoinRole,
  onSendToCreators,
  onOpenChat,
  onEdit,
  onDelete
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'applications'>('details');
  const [applications, setApplications] = useState<ProjectApplication[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [processingAppId, setProcessingAppId] = useState<string | null>(null);
  const [openingChat, setOpeningChat] = useState(false);
  
  const isLead = project.leadBusinessId === currentUser.id;
  const allBusinessRolesConfirmed = project.businessRoles.every(r => r.status === 'CONFIRMED');
  const participatingBusinessCount = project.businessRoles.filter(r => r.status === 'CONFIRMED').length;
  
  // Load applications when tab is opened
  useEffect(() => {
    if (activeTab === 'applications') {
      loadApplications();
    }
  }, [activeTab, project.id]);

  const loadApplications = async () => {
    setLoadingApplications(true);
    try {
      const apps = await getProjectApplications(project.id);
      setApplications(apps);
    } catch (error) {
      console.error('[ProjectDetailView] Error loading applications:', error);
    } finally {
      setLoadingApplications(false);
    }
  };

  const handleOpenProjectChat = async () => {
    if (!onOpenChat) return;
    
    setOpeningChat(true);
    try {
      // Get accepted creators
      const acceptedCreators = applications
        .filter(app => app.status === 'ACCEPTED')
        .map(app => ({
          id: app.creatorId,
          name: app.creatorName,
          avatar: app.creatorAvatar
        }));

      // Create or get project conversation
      const conversationId = await getOrCreateProjectConversation(
        project.id,
        project.title,
        project.leadBusinessId,
        currentUser.name,
        currentUser.avatarUrl,
        acceptedCreators
      );

      // Open the conversation in the inbox
      onOpenChat(conversationId);
    } catch (error) {
      console.error('[ProjectDetailView] Error opening project chat:', error);
    } finally {
      setOpeningChat(false);
    }
  };

  const handleAcceptApplication = async (applicationId: string) => {
    setProcessingAppId(applicationId);
    try {
      await updateApplicationStatus(applicationId, 'ACCEPTED', 'Your application has been accepted! Welcome to the team.');
      // Refresh applications
      await loadApplications();
    } catch (error) {
      console.error('[ProjectDetailView] Error accepting application:', error);
      alert('Failed to accept application. Please try again.');
    } finally {
      setProcessingAppId(null);
    }
  };

  const handleRejectApplication = async (applicationId: string) => {
    setProcessingAppId(applicationId);
    try {
      await updateApplicationStatus(applicationId, 'REJECTED', 'Thank you for your interest. Unfortunately, we have decided to move forward with other candidates.');
      // Refresh applications
      await loadApplications();
    } catch (error) {
      console.error('[ProjectDetailView] Error rejecting application:', error);
      alert('Failed to reject application. Please try again.');
    } finally {
      setProcessingAppId(null);
    }
  };
  
  // Calculate actual total cost from business roles and creator roles
  const businessCost = project.businessRoles.reduce((sum, role) => sum + (role.costShare || 0), 0);
  const creatorCost = (project.creatorRoles || []).reduce((sum, role) => {
    const quantity = role.quantity || 1;
    return sum + (role.budget * quantity);
  }, 0);
  const actualTotalCost = businessCost + creatorCost;
  const costPerBusiness = participatingBusinessCount > 0 ? actualTotalCost / participatingBusinessCount : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header with Close Button */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-[#1E0E62]">Project Details</h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Edit and Delete buttons (only for lead business) */}
            {isLead && (
              <>
                <button
                  onClick={() => onEdit?.()}
                  className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors flex items-center gap-2"
                  title="Edit project"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors flex items-center gap-2"
                  title="Delete project"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'details'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Project Details
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'applications'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Applications
              {applications.filter(a => a.status === 'PENDING').length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {applications.filter(a => a.status === 'PENDING').length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {activeTab === 'details' ? (
            <>
              {/* PROJECT DETAILS TAB CONTENT */}
          
          {/* PROJECT IMAGES */}
          {project.images && project.images.length > 0 && (
            <div className="rounded-2xl overflow-hidden">
              {project.images.length === 1 ? (
                <img 
                  src={project.coverImage || project.images[0]} 
                  alt={project.title}
                  className="w-full h-64 object-cover"
                />
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {project.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`${project.title} ${idx + 1}`}
                      className={`object-cover ${idx === 0 ? 'col-span-2 row-span-2 h-full' : 'h-32'} ${
                        img === project.coverImage ? 'ring-2 ring-purple-500' : ''
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* SECTION 1 — PROJECT HEADER (CONTEXT) */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6">
            <h1 className="text-2xl font-bold text-[#1E0E62] mb-3">{project.title}</h1>
            
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white text-purple-700">
                {PROJECT_TYPE_LABELS[project.projectType]}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[project.status]}`}>
                {STATUS_LABELS[project.status]}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-600" />
                <span className="font-medium">{project.city}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span className="font-medium">{formatDateRange(project.dateRange)}</span>
              </div>
            </div>
          </div>

          {/* SECTION 2 — PROJECT GOAL (WHY) */}
          <div>
            <h3 className="text-lg font-bold text-[#1E0E62] mb-3">Project Goal</h3>
            <p className="text-gray-700 leading-relaxed">
              {project.description || 'Create shared marketing visuals for participating brands to use across web and social media.'}
            </p>
          </div>

          {/* SECTION 3 — BUSINESS ROLES NEEDED (CORE SECTION) */}
          <div>
            <h3 className="text-lg font-bold text-[#1E0E62] mb-4">Business Roles Needed</h3>
            
            <div className="space-y-4 mb-6">
              {project.businessRoles.map((role) => (
                <div key={role.id} className="bg-white border-2 border-gray-200 rounded-2xl p-5 hover:border-purple-200 transition-colors">
                  {/* Role Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-1">{role.title}</h4>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${BUSINESS_ROLE_STATUS_COLORS[role.status]}`}>
                        {role.status}
                      </span>
                    </div>
                    {role.status === 'OPEN' && (
                      <button
                        onClick={() => onJoinRole?.(role.id)}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-2 px-4 rounded-xl hover:shadow-lg transition-all text-sm"
                      >
                        Join as this partner
                      </button>
                    )}
                  </div>

                  {/* Contribution */}
                  <div className="space-y-3 mb-4">
                    {role.contribution.products && role.contribution.products.length > 0 && (
                      <div className="flex items-start gap-3">
                        <Package className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-sm font-semibold text-gray-700">Products:</span>
                          <span className="text-sm text-gray-600 ml-2">{role.contribution.products.join(', ')}</span>
                        </div>
                      </div>
                    )}
                    {role.contribution.services && role.contribution.services.length > 0 && (
                      <div className="flex items-start gap-3">
                        <Wrench className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-sm font-semibold text-gray-700">Services:</span>
                          <span className="text-sm text-gray-600 ml-2">{role.contribution.services.join(', ')}</span>
                        </div>
                      </div>
                    )}
                    {role.contribution.location && (
                      <div className="flex items-start gap-3">
                        <MapPinned className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-sm font-semibold text-gray-700">Location:</span>
                          <span className="text-sm text-gray-600 ml-2">{role.contribution.location}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Visibility & Benefit */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <Eye className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">{role.visibility}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Gift className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-medium text-gray-900">{role.benefit}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* COST TRANSPARENCY */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-5">
              <div className="flex items-start gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Total production cost</span>
                    <span className="text-xl font-bold text-blue-700">€{actualTotalCost}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Participating businesses</span>
                    <span className="text-lg font-semibold text-gray-900">{participatingBusinessCount}</span>
                  </div>
                  {participatingBusinessCount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Cost per business</span>
                      <span className="text-lg font-semibold text-green-700">€{costPerBusiness.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                All participating businesses share production costs and may use the final assets for their own marketing.
              </p>
            </div>
          </div>

          {/* SECTION 4 — CREATOR ROLES */}
          <div>
            <h3 className="text-lg font-bold text-[#1E0E62] mb-4">Creator Roles</h3>
            
            <div className="space-y-3">{project.creatorRoles.length === 0 ? (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
                  <p className="text-sm text-purple-700">No creator roles defined yet. {isLead && 'Add creator roles to start recruiting.'}</p>
                </div>
              ) : (
                project.creatorRoles.map((role) => (
                  <div key={role.id} className="bg-white border-2 border-blue-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Camera className="w-5 h-5 text-blue-600" />
                        <div>
                          <h4 className="font-semibold text-gray-900">{role.title}</h4>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="bg-green-50 px-3 py-1 rounded-lg">
                          <span className="text-sm font-bold text-green-700">€{role.budget}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${CREATOR_ROLE_STATUS_COLORS[role.status]}`}>
                          {role.status}
                        </span>
                      </div>
                    </div>
                    {role.status === 'DRAFT' && isLead && (
                      <button
                        onClick={() => onSendToCreators?.(role.id)}
                        className="flex items-center gap-2 bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors text-sm mt-3"
                      >
                        <Send className="w-4 h-4" />
                        Send to creators
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SECTION 4.5 — ACCEPTED CREATORS (PROJECT TEAM) */}
          {applications.filter(a => a.status === 'ACCEPTED').length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-[#1E0E62] mb-4">Project Team</h3>
              <div className="space-y-3">
                {applications
                  .filter(a => a.status === 'ACCEPTED')
                  .map((application) => (
                    <div key={application.id} className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {/* Creator Avatar */}
                          {application.creatorAvatar ? (
                            <img
                              src={application.creatorAvatar}
                              alt={application.creatorName}
                              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-sm">
                              {application.creatorName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          
                          {/* Creator Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-gray-900">{application.creatorName}</h4>
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 flex items-center gap-1">
                                <UserCheck className="w-3 h-3" />
                                Accepted
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{application.roleName}</p>
                            
                            {/* Rate */}
                            <div className="flex items-center gap-1 text-sm">
                              <DollarSign className="w-4 h-4 text-green-600" />
                              <span className="font-semibold text-green-700">{application.proposedRate} pts</span>
                            </div>

                            {/* Availability */}
                            {application.availability && (
                              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  Available from {new Date(application.availability.startDate).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Message Button */}
                        <button
                          onClick={handleOpenProjectChat}
                          disabled={openingChat}
                          className="bg-white text-purple-600 font-semibold py-2 px-4 rounded-lg hover:bg-purple-50 transition-colors text-sm flex items-center gap-2 shadow-sm disabled:opacity-50"
                        >
                          <MessageSquare className="w-4 h-4" />
                          {openingChat ? 'Opening...' : 'Message'}
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* SECTION 5 — TASKS & DELIVERABLES */}
          <div>
            <h3 className="text-lg font-bold text-[#1E0E62] mb-4">Tasks & Deliverables</h3>
            
            {project.tasks.length === 0 ? (
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-500">No tasks defined yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {project.tasks.map((task) => {
                  const StatusIcon = TASK_STATUS_ICONS[task.status];
                  return (
                    <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <StatusIcon className={`w-5 h-5 ${TASK_STATUS_COLORS[task.status]}`} />
                      <span className={`flex-1 text-sm font-medium ${
                        task.status === 'COMPLETED' ? 'text-gray-500 line-through' : 'text-gray-900'
                      }`}>
                        {task.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 6 — COMMUNICATION */}
          <div>
            <h3 className="text-lg font-bold text-[#1E0E62] mb-4">Communication</h3>
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 mb-1">Project Chat</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Communicate with all participating businesses and accepted creators
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <Users className="w-4 h-4" />
                    <span>Visible to: Participating businesses · Accepted creators</span>
                  </div>
                  <button
                    onClick={handleOpenProjectChat}
                    disabled={openingChat}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-2 px-5 rounded-xl hover:shadow-lg transition-all text-sm disabled:opacity-50"
                  >
                    {openingChat ? 'Opening...' : 'Open chat'}
                  </button>
                </div>
              </div>
            </div>
          </div>
            </>
          ) : (
            <>
              {/* APPLICATIONS TAB CONTENT */}
              <div>
                <h3 className="text-lg font-bold text-[#1E0E62] mb-2">Creator Applications</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Review and manage applications from creators interested in your project roles
                </p>

                {loadingApplications ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                ) : applications.length === 0 ? (
                  <div className="text-center py-12 bg-purple-50/30 rounded-3xl border border-purple-100">
                    <FileText className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                    <p className="text-gray-700 font-semibold mb-2">No applications yet</p>
                    <p className="text-gray-500 text-sm">
                      Applications from creators will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map(application => (
                      <div
                        key={application.id}
                        className="bg-white border-2 border-gray-200 rounded-2xl p-5 hover:border-purple-200 transition-colors"
                      >
                        {/* Application Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-lg font-bold text-gray-900">
                                {application.roleName}
                              </h4>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                application.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                application.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                                application.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {application.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              Applied {new Date(application.appliedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Proposed Rate */}
                        <div className="bg-green-50 rounded-xl p-3 mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Proposed Rate</span>
                            <span className="text-lg font-bold text-green-700">
                              {application.proposedRate} pts
                            </span>
                          </div>
                        </div>

                        {/* Cover Letter */}
                        <div className="mb-4">
                          <h5 className="text-sm font-semibold text-gray-700 mb-2">Cover Letter</h5>
                          <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                              {application.coverLetter}
                            </p>
                          </div>
                        </div>

                        {/* Availability */}
                        {application.availability && (
                          <div className="mb-4">
                            <h5 className="text-sm font-semibold text-gray-700 mb-2">Availability</h5>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {new Date(application.availability.startDate).toLocaleDateString()}
                                {application.availability.endDate && ` - ${new Date(application.availability.endDate).toLocaleDateString()}`}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Portfolio Samples */}
                        {application.portfolioSamples && application.portfolioSamples.length > 0 && (
                          <div className="mb-4">
                            <h5 className="text-sm font-semibold text-gray-700 mb-2">Portfolio Samples</h5>
                            <div className="space-y-2">
                              {application.portfolioSamples.map((link, index) => (
                                <a
                                  key={index}
                                  href={link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
                                >
                                  <ExternalLink className="w-4 h-4 text-purple-600 flex-shrink-0" />
                                  <span className="text-sm text-purple-700 truncate flex-1 group-hover:underline">
                                    {link}
                                  </span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons (only for pending applications) */}
                        {application.status === 'PENDING' && (
                          <div className="space-y-2 mt-4 pt-4 border-t border-gray-200">
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  try {
                                    const { createOrGetConversation } = await import('../services/conversationService');
                                    const conversationId = await createOrGetConversation(currentUser.id, application.creatorId);
                                    onOpenChat?.(conversationId);
                                  } catch (error) {
                                    console.error('[ProjectDetailView] Error starting conversation:', error);
                                    alert('Failed to start conversation. Please try again.');
                                  }
                                }}
                                className="flex-1 flex items-center justify-center gap-2 bg-purple-50 text-purple-700 font-semibold py-3 px-4 rounded-xl hover:bg-purple-100 transition-colors border-2 border-purple-200"
                              >
                                <MessageSquare className="w-4 h-4" />
                                Message
                              </button>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRejectApplication(application.id)}
                                disabled={processingAppId === application.id}
                                className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                              >
                                <UserX className="w-4 h-4" />
                                Reject
                              </button>
                              <button
                                onClick={() => handleAcceptApplication(application.id)}
                                disabled={processingAppId === application.id}
                                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 px-4 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                              >
                                <UserCheck className="w-4 h-4" />
                                {processingAppId === application.id ? 'Processing...' : 'Accept'}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Response Message (if rejected or accepted) */}
                        {application.businessResponse && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-sm text-gray-600 italic">
                              "{application.businessResponse}"
                            </p>
                            {application.respondedAt && (
                              <p className="text-xs text-gray-500 mt-1">
                                Responded {new Date(application.respondedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Project</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete "<strong>{project.title}</strong>"? 
              All project data, business roles, and creator roles will be removed.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete?.();
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 bg-red-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-red-700 transition-colors"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
