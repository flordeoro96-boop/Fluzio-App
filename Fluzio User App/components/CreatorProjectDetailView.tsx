/**
 * Creator Project Detail View
 * Detailed view of a project opportunity for creators
 * Clean, professional design focused on role selection and application
 */

import React, { useState, useEffect } from 'react';
import { 
  X,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Building2,
  Users,
  DollarSign,
  Briefcase,
  Star,
  MessageSquare,
  Camera
} from 'lucide-react';
import { User, Project, CreatorRole } from '../types';
import { ApplicationModal } from './ApplicationModal';
import { getUserById } from '../services/userService';

interface BusinessInfo {
  id: string;
  name: string;
  category?: string;
  photoUrl?: string;
}

interface CreatorProjectDetailViewProps {
  project: Project;
  user: User;
  appliedRoles: Set<string>;
  onClose: () => void;
  onApplicationSuccess: () => void;
}

export const CreatorProjectDetailView: React.FC<CreatorProjectDetailViewProps> = ({
  project,
  user,
  appliedRoles,
  onClose,
  onApplicationSuccess
}) => {
  const [selectedRole, setSelectedRole] = useState<CreatorRole | null>(null);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [participatingBusinesses, setParticipatingBusinesses] = useState<BusinessInfo[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);

  // Filter roles that match user's skills
  const userRoles = user.creator?.roles || [];
  const matchingRoles = (project.creatorRoles || []).filter(role => 
    userRoles.length === 0 || userRoles.some(userRole => 
      role.title.toLowerCase().includes(userRole.toLowerCase()) ||
      userRole.toLowerCase().includes(role.title.toLowerCase())
    )
  );

  // Calculate project details
  const totalBudget = matchingRoles.reduce((sum, role) => sum + (role.budget || 0), 0);
  const deadline = project.dateRange?.end || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const deadlineDate = new Date(deadline);
  const eventDate = project.dateRange?.start ? new Date(project.dateRange.start) : null;

  const handleApplyForRole = (role: CreatorRole) => {
    setSelectedRole(role);
    setIsApplicationModalOpen(true);
  };

  const handleApplicationSuccess = () => {
    setIsApplicationModalOpen(false);
    setSelectedRole(null);
    onApplicationSuccess();
  };

  // Load participating businesses
  useEffect(() => {
    const loadBusinesses = async () => {
      if (!project.participatingBusinesses || project.participatingBusinesses.length === 0) {
        return;
      }

      setLoadingBusinesses(true);
      try {
        const businessPromises = project.participatingBusinesses.map(async (businessId) => {
          const businessUser = await getUserById(businessId);
          if (businessUser) {
            return {
              id: businessId,
              name: businessUser.businessName || businessUser.name,
              category: businessUser.category,
              photoUrl: businessUser.photoUrl || businessUser.avatarUrl
            };
          }
          return null;
        });

        const businesses = await Promise.all(businessPromises);
        setParticipatingBusinesses(businesses.filter(b => b !== null) as BusinessInfo[]);
      } catch (error) {
        console.error('[CreatorProjectDetailView] Error loading businesses:', error);
      } finally {
        setLoadingBusinesses(false);
      }
    };

    loadBusinesses();
  }, [project.participatingBusinesses]);

  // Get project images
  const projectImages = project.images && project.images.length > 0 
    ? project.images 
    : (project.coverImage ? [project.coverImage] : []);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto">
      <div className="bg-white w-full max-w-2xl min-h-screen md:min-h-0 md:my-8 md:rounded-3xl shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full shadow-lg transition-all"
        >
          <X className="w-6 h-6 text-gray-700" />
        </button>

        {/* Image Carousel */}
        <div className="relative h-80 bg-gradient-to-br from-purple-200 to-pink-200 overflow-hidden">
          {/* Project Image */}
          {projectImages.length > 0 ? (
            <img 
              src={projectImages[currentImageIndex]} 
              alt={project.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Camera className="w-24 h-24 text-white/40" />
            </div>
          )}

          {/* Carousel dots */}
          {projectImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {projectImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentImageIndex ? 'bg-white w-6' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Job Title */}
          <h1 className="text-3xl font-bold text-[#1E0E62] mb-4">
            {project.title}
          </h1>

          {/* Posted by Badge */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-semibold">Posted by verified business</span>
            </div>
          </div>

          {/* Key Info Row */}
          <div className="flex flex-wrap gap-4 mb-6 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{project.location || 'Munich, Germany'}</span>
            </div>
            {eventDate && (
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Apply by {deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          </div>

          {/* Project Summary Card */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-5 mb-6">
            <h2 className="text-lg font-bold text-[#1E0E62] mb-4">Project Summary</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Project Type</p>
                <p className="font-semibold text-gray-900">{project.projectType || 'Photoshoot'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Collaboration</p>
                <p className="font-semibold text-gray-900">Paid + Points</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Budget</p>
                <p className="text-2xl font-bold text-green-600">{totalBudget} pts</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Roles Needed</p>
                <p className="font-semibold text-gray-900">{matchingRoles.length} role{matchingRoles.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>

          {/* Participating Businesses Section */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#1E0E62] mb-4 flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              Participating Businesses
            </h2>
            
            {loadingBusinesses ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                <p>Loading businesses...</p>
              </div>
            ) : participatingBusinesses.length > 0 ? (
              <div className="space-y-3">
                {participatingBusinesses.map((business) => (
                  <div
                    key={business.id}
                    className="bg-white border-2 border-gray-200 rounded-2xl p-5 hover:border-purple-300 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      {business.photoUrl ? (
                        <img 
                          src={business.photoUrl} 
                          alt={business.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                          <Building2 className="w-8 h-8 text-purple-600" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">{business.name}</h3>
                        {business.category && (
                          <p className="text-sm text-gray-600">{business.category}</p>
                        )}
                      </div>
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-2xl p-6 text-center text-gray-600">
                <Building2 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No participating businesses yet</p>
              </div>
            )}
          </div>

          {/* Your Role - Quick Apply Section */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#1E0E62] mb-4">Your Role</h2>
            <div className="space-y-3">
              {matchingRoles.map((role, idx) => {
                const slotKey = `${project.id}-${role.title}`;
                const hasApplied = appliedRoles.has(slotKey);

                return (
                  <div
                    key={idx}
                    className="bg-white border-2 border-gray-200 rounded-2xl p-5 hover:border-purple-300 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{role.title}</h3>
                        <p className="text-sm text-gray-600">{role.description || 'No description provided'}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm text-gray-600">Payment</p>
                        <p className="text-2xl font-bold text-green-600">{role.budget} pts</p>
                      </div>
                    </div>

                    {/* Apply Button */}
                    {!hasApplied ? (
                      <button
                        onClick={() => handleApplyForRole(role)}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-6 rounded-xl hover:shadow-lg transition-all"
                      >
                        Apply for this role
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full bg-green-100 text-green-700 font-bold py-3 px-6 rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        Applied
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* About the Project */}
          <div className="mb-6">
            <button
              onClick={() => setIsAboutExpanded(!isAboutExpanded)}
              className="w-full flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <span className="font-bold text-gray-900">About the project</span>
              {isAboutExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {isAboutExpanded && (
              <div className="mt-3 px-4 text-gray-700">
                <p>{project.description || 'No detailed description provided yet.'}</p>
              </div>
            )}
          </div>

          {/* About the Business */}
          <div className="bg-gray-50 rounded-2xl p-5">
            <h3 className="font-bold text-gray-900 mb-3">About the business</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-gray-700">Verified business</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span className="text-gray-700">Usually responds within 24 hours</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-600" />
                <span className="text-gray-700">Completed projects successfully</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {selectedRole && (
        <ApplicationModal
          isOpen={isApplicationModalOpen}
          onClose={() => {
            setIsApplicationModalOpen(false);
            setSelectedRole(null);
          }}
          projectId={project.id}
          projectTitle={project.title}
          role={{
            id: selectedRole.id || selectedRole.title,
            title: selectedRole.title,
            budget: selectedRole.budget,
            description: selectedRole.description
          }}
          onSuccess={handleApplicationSuccess}
        />
      )}
    </div>
  );
};
