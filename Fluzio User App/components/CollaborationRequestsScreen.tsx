/**
 * Collaboration Requests Screen
 * Shows creator's project applications and their status
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Briefcase,
  Filter,
  RefreshCw
} from 'lucide-react';
import { User } from '../types';
import { getCreatorApplications, withdrawApplication, ProjectApplication } from '../services/projectService';
import { CreatorContextBar } from './CreatorContextBar';

interface CollaborationRequestsScreenProps {
  user: User;
  onNavigate: (route: string) => void;
}

type FilterStatus = 'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export const CollaborationRequestsScreen: React.FC<CollaborationRequestsScreenProps> = ({ 
  user, 
  onNavigate 
}) => {
  const [applications, setApplications] = useState<ProjectApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  useEffect(() => {
    loadApplications();
  }, [user.id]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const apps = await getCreatorApplications(user.id);
      // Sort by date, newest first
      apps.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
      setApplications(apps);
    } catch (error) {
      console.error('[CollaborationRequests] Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (applicationId: string) => {
    if (!confirm('Are you sure you want to withdraw this application?')) return;
    
    setWithdrawingId(applicationId);
    try {
      await withdrawApplication(applicationId);
      // Refresh list
      await loadApplications();
    } catch (error) {
      console.error('[CollaborationRequests] Error withdrawing application:', error);
      alert('Failed to withdraw application. Please try again.');
    } finally {
      setWithdrawingId(null);
    }
  };

  const filteredApplications = filterStatus === 'ALL' 
    ? applications 
    : applications.filter(app => app.status === filterStatus);

  const statusCounts = {
    ALL: applications.length,
    PENDING: applications.filter(a => a.status === 'PENDING').length,
    ACCEPTED: applications.filter(a => a.status === 'ACCEPTED').length,
    REJECTED: applications.filter(a => a.status === 'REJECTED').length,
    WITHDRAWN: applications.filter(a => a.status === 'WITHDRAWN').length
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
        <h1 className="text-2xl font-bold text-[#1E0E62] mb-2">My Applications</h1>
        <p className="text-gray-600 text-sm">
          Track your project collaboration applications and their status
        </p>
      </div>

      {/* Context Bar */}
      <CreatorContextBar user={user} />

      {/* Stats */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 mb-6">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-purple-700">{statusCounts.ALL}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{statusCounts.PENDING}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Accepted</p>
            <p className="text-2xl font-bold text-green-600">{statusCounts.ACCEPTED}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Rejected</p>
            <p className="text-2xl font-bold text-red-500">{statusCounts.REJECTED}</p>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
        {(['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'] as FilterStatus[]).map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              filterStatus === status
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0) + status.slice(1).toLowerCase()} ({statusCounts[status]})
          </button>
        ))}
        <button
          onClick={loadApplications}
          className="ml-auto p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="text-center py-12 bg-purple-50/30 rounded-3xl border border-purple-100">
          <FileText className="w-16 h-16 text-purple-300 mx-auto mb-4" />
          <p className="text-gray-700 font-semibold mb-2">
            {filterStatus === 'ALL' ? 'No applications yet' : `No ${filterStatus.toLowerCase()} applications`}
          </p>
          <p className="text-gray-500 text-sm mb-4">
            {filterStatus === 'ALL' 
              ? 'Start applying to project opportunities to see them here' 
              : 'Try selecting a different filter'}
          </p>
          {filterStatus === 'ALL' && (
            <button
              onClick={() => onNavigate('creator-opportunities')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transition-all"
            >
              Browse Opportunities
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map(application => {
            const statusConfig = {
              PENDING: {
                color: 'bg-yellow-100 text-yellow-700',
                icon: Clock,
                label: 'Pending Review'
              },
              ACCEPTED: {
                color: 'bg-green-100 text-green-700',
                icon: CheckCircle2,
                label: 'Accepted'
              },
              REJECTED: {
                color: 'bg-red-100 text-red-700',
                icon: XCircle,
                label: 'Rejected'
              },
              WITHDRAWN: {
                color: 'bg-gray-100 text-gray-700',
                icon: XCircle,
                label: 'Withdrawn'
              }
            };

            const config = statusConfig[application.status];
            const StatusIcon = config.icon;

            return (
              <div
                key={application.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${config.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {config.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        Applied {new Date(application.appliedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[#1E0E62] mb-1">
                      {application.roleName}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Briefcase className="w-4 h-4" />
                      <span>Project application</span>
                    </div>
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

                {/* Cover Letter Preview */}
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Cover Letter</p>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {application.coverLetter}
                    </p>
                  </div>
                </div>

                {/* Availability */}
                {application.availability && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Available: {new Date(application.availability.startDate).toLocaleDateString()}
                      {application.availability.endDate && ` - ${new Date(application.availability.endDate).toLocaleDateString()}`}
                    </span>
                  </div>
                )}

                {/* Business Response (if accepted or rejected) */}
                {application.businessResponse && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                    <p className="text-sm font-semibold text-blue-900 mb-1">Response from business:</p>
                    <p className="text-sm text-blue-800 italic">"{application.businessResponse}"</p>
                    {application.respondedAt && (
                      <p className="text-xs text-blue-600 mt-2">
                        {new Date(application.respondedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                {application.status === 'PENDING' && (
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleWithdraw(application.id)}
                      disabled={withdrawingId === application.id}
                      className="flex-1 bg-gray-100 text-gray-700 font-semibold py-2 px-4 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm"
                    >
                      {withdrawingId === application.id ? 'Withdrawing...' : 'Withdraw Application'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
