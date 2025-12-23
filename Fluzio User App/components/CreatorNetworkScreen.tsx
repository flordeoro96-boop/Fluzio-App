/**
 * Creator Network Screen
 * Shows businesses and collaborators the creator has worked with
 */

import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Users, 
  MessageSquare, 
  History, 
  MapPin,
  CheckCircle2,
  Clock,
  ChevronRight,
  Repeat,
  Award,
  Sparkles
} from 'lucide-react';
import { User } from '../types';
import { 
  getCreatorBusinessConnections, 
  getCreatorCollaborators,
  getBusinessApplicationHistory,
  BusinessConnection,
  CollaboratorConnection
} from '../services/creatorNetworkService';
import { formatDistanceToNow } from 'date-fns';
import { CreatorContextBar } from './CreatorContextBar';

interface CreatorNetworkScreenProps {
  user: User;
  onNavigate: (route: string) => void;
  onOpenChat?: (userId: string, userName: string) => void;
}

type NetworkTab = 'businesses' | 'collaborators';

export const CreatorNetworkScreen: React.FC<CreatorNetworkScreenProps> = ({ 
  user, 
  onNavigate,
  onOpenChat 
}) => {
  const [activeTab, setActiveTab] = useState<NetworkTab>('businesses');
  const [businesses, setBusinesses] = useState<BusinessConnection[]>([]);
  const [collaborators, setCollaborators] = useState<CollaboratorConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);
  const [businessHistory, setBusinessHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    loadNetworkData();
  }, [user.id]);

  const loadNetworkData = async () => {
    try {
      setLoading(true);
      const [businessConnections, collaboratorConnections] = await Promise.all([
        getCreatorBusinessConnections(user.id),
        getCreatorCollaborators(user.id)
      ]);
      
      setBusinesses(businessConnections);
      setCollaborators(collaboratorConnections);
    } catch (error) {
      console.error('Error loading network data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = async (businessId: string) => {
    try {
      setLoadingHistory(true);
      setSelectedBusiness(businessId);
      const history = await getBusinessApplicationHistory(user.id, businessId);
      setBusinessHistory(history);
    } catch (error) {
      console.error('Error loading business history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleMessage = (userId: string, userName: string) => {
    if (onOpenChat) {
      onOpenChat(userId, userName);
    } else {
      // Fallback to navigation
      onNavigate(`/messages/${userId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Get relationship tag for a connection
  const getRelationshipTag = (connection: BusinessConnection | CollaboratorConnection): { text: string; icon: React.ElementType; color: string } | null => {
    if ('projectCount' in connection && typeof connection.projectCount === 'number' && connection.projectCount > 1) {
      return { 
        text: 'Repeat collaborator', 
        icon: Repeat, 
        color: 'bg-purple-100 text-purple-700 border-purple-200' 
      };
    }
    if ('lastInteraction' in connection && connection.lastInteraction) {
      const daysSince = Math.floor((Date.now() - new Date(connection.lastInteraction).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince > 90) {
        return { 
          text: 'Long-time connection', 
          icon: Award, 
          color: 'bg-amber-100 text-amber-700 border-amber-200' 
        };
      }
    }
    return { 
      text: 'Worked together', 
      icon: CheckCircle2, 
      color: 'bg-green-100 text-green-700 border-green-200' 
    };
  };

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1E0E62] mb-2">Network</h1>
        <p className="text-gray-600 text-sm">
          Businesses and creators you've worked with
        </p>
      </div>

      {/* Context Bar */}
      <CreatorContextBar user={user} />

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('businesses')}
          className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
            activeTab === 'businesses'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-purple-300'
          }`}
        >
          <Briefcase className="w-4 h-4 inline mr-1" />
          Businesses ({businesses.length})
        </button>
        
        <button
          onClick={() => setActiveTab('collaborators')}
          className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
            activeTab === 'collaborators'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-purple-300'
          }`}
        >
          <Users className="w-4 h-4 inline mr-1" />
          Creators ({collaborators.length})
        </button>
      </div>

      {/* Businesses Tab */}
      {activeTab === 'businesses' && (
        <div>
          {businesses.length === 0 ? (
            <div className="text-center py-12 bg-purple-50/30 rounded-3xl border border-purple-100 px-4">
              <Briefcase className="w-16 h-16 text-purple-300 mx-auto mb-4" />
              <p className="text-gray-700 font-semibold mb-2">
                No business connections yet
              </p>
              <p className="text-gray-500 text-sm max-w-md mx-auto mb-4">
                Your network will grow as you complete projects. Each collaboration adds businesses here.
              </p>
              <button
                onClick={() => onNavigate('creator-opportunities')}
                className="text-purple-600 font-medium text-sm hover:underline"
              >
                Browse Opportunities →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {businesses.map((business) => (
                <div
                  key={business.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    {/* Business Info */}
                    <div className="flex items-start gap-4 flex-1">
                      {/* Logo */}
                      <div className="flex-shrink-0">
                        {business.businessLogo ? (
                          <img
                            src={business.businessLogo}
                            alt={business.businessName}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Briefcase size={32} className="text-white" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-[#1E0E62] mb-1">
                          {business.businessName}
                        </h3>
                        
                        {/* Relationship Tag */}
                        {(() => {
                          const tag = getRelationshipTag(business);
                          if (!tag) return null;
                          const TagIcon = tag.icon;
                          return (
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium mb-2 border ${tag.color}`}>
                              <TagIcon className="w-3 h-3" />
                              {tag.text}
                            </div>
                          );
                        })()}
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          {business.businessCity && (
                            <div className="flex items-center gap-1">
                              <MapPin size={14} />
                              <span>{business.businessCity}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1">
                            {business.status === 'active' ? (
                              <Clock size={14} className="text-green-600" />
                            ) : (
                              <CheckCircle2 size={14} className="text-gray-400" />
                            )}
                            <span>
                              {business.sharedProjectsCount} project{business.sharedProjectsCount !== 1 ? 's' : ''}
                            </span>
                          </div>

                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            business.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {business.status === 'active' ? 'Active' : 'Completed'}
                          </span>
                        </div>

                        <div className="text-xs text-gray-500">
                          Last interaction {formatDistanceToNow(new Date(business.lastInteraction), { addSuffix: true })}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleMessage(business.businessId, business.businessName)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <MessageSquare size={16} />
                        <span>Message</span>
                      </button>
                      
                      <button
                        onClick={() => handleViewHistory(business.businessId)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <History size={16} />
                        <span>History</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Collaborators Tab */}
      {activeTab === 'collaborators' && (
        <div>
          {collaborators.length === 0 ? (
            <div className="text-center py-12 bg-purple-50/30 rounded-3xl border border-purple-100 px-4">
              <Users className="w-16 h-16 text-purple-300 mx-auto mb-4" />
              <p className="text-gray-700 font-semibold mb-2">
                No fellow creators yet
              </p>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                Your network will grow as you complete projects. Collaborators from shared missions appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {collaborators.map((collaborator) => (
                <div
                  key={collaborator.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    {/* Collaborator Info */}
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      {collaborator.creatorAvatar ? (
                        <img
                          src={collaborator.creatorAvatar}
                          alt={collaborator.creatorName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">
                            {collaborator.creatorName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}

                      {/* Name and Role */}
                      <div>
                        <h3 className="font-semibold text-[#1E0E62]">
                          {collaborator.creatorName}
                        </h3>
                        {collaborator.role && (
                          <p className="text-sm text-gray-600">{collaborator.role}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mb-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 size={14} className="text-green-600" />
                      <span>
                        {collaborator.sharedProjectsCount} shared project{collaborator.sharedProjectsCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  <button
                    onClick={() => handleMessage(collaborator.creatorId, collaborator.creatorName)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <MessageSquare size={16} />
                    <span>Message</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Business History Modal */}
      {selectedBusiness && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#1E0E62]">
                  Project History
                </h2>
                <button
                  onClick={() => setSelectedBusiness(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
              <p className="text-gray-600 mt-1">
                {businesses.find(b => b.id === selectedBusiness)?.businessName}
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : businessHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-600">
                  No history available
                </div>
              ) : (
                <div className="space-y-4">
                  {businessHistory.map((application) => (
                    <div
                      key={application.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-[#1E0E62]">
                          {application.missionTitle}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          application.status === 'accepted'
                            ? 'bg-green-100 text-green-700'
                            : application.status === 'completed'
                            ? 'bg-blue-100 text-blue-700'
                            : application.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {application.status}
                        </span>
                      </div>
                      
                      {application.missionDescription && (
                        <p className="text-sm text-gray-600 mb-2">
                          {application.missionDescription.substring(0, 150)}
                          {application.missionDescription.length > 150 ? '...' : ''}
                        </p>
                      )}
                      
                      {application.note && (
                        <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                          <span className="font-medium text-gray-700">Your note: </span>
                          <span className="text-gray-600">{application.note}</span>
                        </div>
                      )}
                      
                      <div className="mt-2 text-xs text-gray-500">
                        Applied {formatDistanceToNow(new Date(application.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
