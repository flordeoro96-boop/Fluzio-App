/**
 * Professional Casting View for Creators (Mobile-First)
 * Shows project details in editorial casting brief format
 */

import React, { useState } from 'react';
import { X, MapPin, Calendar, FileText, Image as ImageIcon } from 'lucide-react';
import { Project, CreatorRole } from '../types';

interface ProjectCastingViewProps {
  project: Project;
  matchingRoles: CreatorRole[];
  appliedSlots: Set<string>;
  applicationStatuses: Map<string, string>;
  onClose: () => void;
  onApplyToRole: (role: CreatorRole) => void;
}

export const ProjectCastingView: React.FC<ProjectCastingViewProps> = ({
  project,
  matchingRoles,
  appliedSlots,
  applicationStatuses,
  onClose,
  onApplyToRole
}) => {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(
    matchingRoles.length > 0 ? matchingRoles[0].id : null
  );

  // Calculate casting deadline (shoot date)
  const shootDate = project.dateRange?.start 
    ? new Date(project.dateRange.start)
    : null;
  
  const daysUntilShoot = shootDate 
    ? Math.ceil((shootDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  // Determine if paid or TFP
  const totalCreatorBudget = (project.creatorRoles || []).reduce((sum, role) => sum + role.budget, 0);
  const isPaid = totalCreatorBudget > 0;

  // Format deadline text
  const deadlineText = shootDate 
    ? shootDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'TBD';

  const selectedRole = matchingRoles.find(r => r.id === selectedRoleId);
  const slotKey = selectedRole ? `${project.id}-${selectedRole.title}` : '';
  const hasApplied = selectedRole && appliedSlots.has(slotKey);
  const applicationStatus = selectedRole && applicationStatuses.get(slotKey);

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      {/* Header - Clean Back Navigation */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="text-xs uppercase tracking-wider text-gray-500 font-medium">
            Casting Brief
          </span>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Editorial Image Header (25-30% screen height) */}
      {(() => {
        console.log('[ProjectCastingView] 📸 Project:', project.title, '- Images:', project.images?.length || 0);
        if (project.images && project.images.length > 0) {
          console.log('[ProjectCastingView] 📸 First image URL:', project.images[0]);
        }
        return null;
      })()}
      <div className="h-[28vh] bg-gray-100 border-b border-gray-200 relative overflow-hidden">
        {project.images && project.images.length > 0 ? (
          <img
            src={project.images[0]}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-gray-300" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Project Title + Business Name */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2 leading-tight">
            {project.title}
          </h1>
          <p className="text-sm text-gray-600">
            Posted by casting director
          </p>
        </div>

        {/* Metadata Row */}
        <div className="flex items-center flex-wrap gap-x-3 gap-y-2 text-xs text-gray-600 py-3 border-y border-gray-200">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>{project.city}</span>
          </div>
          <span>·</span>
          <span className="uppercase tracking-wide">{project.projectType || 'Shoot'}</span>
          <span>·</span>
          <span>Portfolio + Social</span>
          <span>·</span>
          <span className="font-medium">{isPaid ? 'Paid' : 'TFP'}</span>
          <span>·</span>
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{deadlineText}</span>
          </div>
        </div>

        {/* Key Terms Summary */}
        <div className="bg-gray-50 border border-gray-200 p-4 space-y-3">
          <div className="text-xs uppercase tracking-wider text-gray-500 font-medium">
            Key Terms
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Compensation</span>
              <span className="text-gray-900 font-medium">
                {isPaid ? `$${selectedRole?.budget || 0}` : 'Trade (Portfolio)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Usage rights</span>
              <span className="text-gray-900 font-medium">Portfolio + Social</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shoot date</span>
              <span className="text-gray-900 font-medium">
                {deadlineText}
                {daysUntilShoot !== null && daysUntilShoot > 0 && daysUntilShoot < 30 && (
                  <span className="ml-1 text-gray-600">({daysUntilShoot}d)</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Image Gallery - Show all project images if more than one */}
        {project.images && project.images.length > 1 && (
          <div>
            <h2 className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-3">
              Project Images
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {project.images.map((imageUrl, index) => (
                <img
                  key={index}
                  src={imageUrl}
                  alt={`${project.title} - Image ${index + 1}`}
                  className="h-32 w-48 flex-shrink-0 object-cover rounded border border-gray-200"
                />
              ))}
            </div>
          </div>
        )}

        {/* Participating Businesses */}
        {project.businessRoles && project.businessRoles.length > 0 && (
          <div>
            <h2 className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-3">
              Collaborating Brands
            </h2>
            <div className="space-y-2">
              {project.businessRoles.map((role, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm">
                  <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-gray-900 font-medium">{role.title}</div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      {role.contribution.products && role.contribution.products.length > 0 && 
                        `Products: ${role.contribution.products.join(', ')}`}
                      {role.contribution.services && role.contribution.services.length > 0 && 
                        `${role.contribution.products?.length ? ' · ' : ''}Services: ${role.contribution.services.join(', ')}`}
                      {role.contribution.location && 
                        `${(role.contribution.products?.length || role.contribution.services?.length) ? ' · ' : ''}Location: ${role.contribution.location}`}
                    </div>
                  </div>
                  {role.status === 'CONFIRMED' && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-200">
                      Confirmed
                    </span>
                  )}
                  {role.status === 'INVITED' && (
                    <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200">
                      Invited
                    </span>
                  )}
                  {role.status === 'DECLINED' && (
                    <span className="text-xs px-2 py-0.5 bg-red-50 text-red-700 border border-red-200">
                      Declined
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plain-Text Project Description */}
        <div>
          <h2 className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-3">
            Project Overview
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {project.description || 'Casting brief details will be shared with selected applicants.'}
          </p>
        </div>

        {/* Roles Section (Stacked Rows) */}
        <div>
          <h2 className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-3">
            Open Positions
          </h2>
          <div className="space-y-1">
            {matchingRoles.map((role) => {
              const roleSlotKey = `${project.id}-${role.title}`;
              const roleApplied = appliedSlots.has(roleSlotKey);
              const roleStatus = applicationStatuses.get(roleSlotKey);
              const isSelected = role.id === selectedRoleId;
              
              return (
                <button
                  key={role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`w-full text-left px-3 py-2 border transition-colors ${
                    isSelected 
                      ? 'border-gray-900 bg-gray-50' 
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 flex items-center gap-3">
                      <div className="text-sm font-medium text-gray-900">
                        {role.title}
                      </div>
                      <div className="text-xs text-gray-600">
                        ${role.budget}
                      </div>
                    </div>
                    {roleStatus === 'ACCEPTED' && (
                      <span className="text-xs text-green-700">
                        Accepted
                      </span>
                    )}
                    {roleApplied && roleStatus === 'PENDING' && (
                      <span className="text-xs text-gray-600">
                        Applied
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Usage & Rights Section */}
        <div>
          <h2 className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-2">
            Usage & Rights
          </h2>
          <div className="space-y-1 text-xs text-gray-700">
            <div>Portfolio use: <span className="font-medium">Yes</span></div>
            <div>Social media: <span className="font-medium">Personal accounts only</span></div>
            <div>Commercial use: <span className="font-medium">No</span></div>
            <div>Credits required: <span className="font-medium">Photographer</span></div>
          </div>
        </div>

        {/* Note */}
        <div className="border-t border-gray-200 pt-3">
          <p className="text-xs text-gray-600">
            Note: Final details (location, call time, creative direction) will be confirmed with selected applicants.
          </p>
        </div>

        {/* Bottom Padding for Sticky CTA */}
        <div className="h-20" />
      </div>

      {/* Sticky Bottom CTA */}
      {selectedRole && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4">
          <div className="max-w-2xl mx-auto">
            {!hasApplied ? (
              <button
                onClick={() => onApplyToRole(selectedRole)}
                className="w-full bg-gray-900 text-white py-3 px-4 font-medium text-sm hover:bg-gray-800 transition-colors"
              >
                Submit application
              </button>
            ) : applicationStatus === 'ACCEPTED' ? (
              <div className="w-full border-t border-gray-200 py-2 px-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Status: <span className="text-green-700 font-medium">Accepted</span></span>
                  <span className="text-gray-500 text-xs">Casting closes: {deadlineText}</span>
                </div>
              </div>
            ) : (
              <div className="w-full border-t border-gray-200 py-2 px-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Status: <span className="font-medium">Submitted</span></span>
                  <span className="text-gray-500 text-xs">Casting closes: {deadlineText}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
