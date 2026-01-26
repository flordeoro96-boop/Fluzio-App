/**
 * Smart Opportunity Alerts Component
 * 
 * AI-powered opportunity matching dashboard for creators.
 * Shows personalized opportunity recommendations with match scores.
 */

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Briefcase, 
  TrendingUp, 
  X, 
  Check, 
  Eye, 
  Star,
  Clock,
  DollarSign,
  MapPin,
  Settings,
  Filter,
  Sparkles
} from 'lucide-react';
import {
  getOpportunityAlerts,
  getAlertStats,
  markAlertViewed,
  dismissAlert,
  markAlertApplied,
  OpportunityAlert
} from '../services/creatorOpportunityAlertsService';

interface SmartOpportunityAlertsProps {
  creatorId: string;
  creatorName: string;
}

export const SmartOpportunityAlerts: React.FC<SmartOpportunityAlertsProps> = ({
  creatorId,
  creatorName
}) => {
  const [alerts, setAlerts] = useState<OpportunityAlert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<OpportunityAlert[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    viewed: 0,
    applied: 0,
    averageMatchScore: 0
  });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'NEW' | 'VIEWED' | 'APPLIED'>('ALL');
  const [minMatchScore, setMinMatchScore] = useState(0);

  useEffect(() => {
    loadData();
  }, [creatorId]);

  useEffect(() => {
    filterAlerts();
  }, [alerts, filterStatus, minMatchScore]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [alertsData, statsData] = await Promise.all([
        getOpportunityAlerts(creatorId),
        getAlertStats(creatorId)
      ]);
      
      setAlerts(alertsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading opportunity alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAlerts = () => {
    let filtered = [...alerts];
    
    // Filter by status
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(alert => alert.status === filterStatus);
    }
    
    // Filter by match score
    filtered = filtered.filter(alert => alert.matchScore >= minMatchScore);
    
    setFilteredAlerts(filtered);
  };

  const handleViewAlert = async (alert: OpportunityAlert) => {
    if (alert.status === 'NEW') {
      await markAlertViewed(alert.id);
      await loadData();
    }
  };

  const handleDismiss = async (alertId: string) => {
    await dismissAlert(alertId);
    await loadData();
  };

  const handleApply = async (alertId: string) => {
    await markAlertApplied(alertId);
    await loadData();
    // Navigate to application screen
  };

  const getMatchScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getMatchScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Fair Match';
    return 'Low Match';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Total Alerts</span>
          </div>
          <div className="text-3xl font-bold text-purple-600">{stats.total}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">New</span>
          </div>
          <div className="text-3xl font-bold text-blue-600">{stats.new}</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">Applied</span>
          </div>
          <div className="text-3xl font-bold text-green-600">{stats.applied}</div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">Avg Match</span>
          </div>
          <div className="text-3xl font-bold text-orange-600">{stats.averageMatchScore}%</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
          </div>

          <div className="flex gap-2">
            {['ALL', 'NEW', 'VIEWED', 'APPLIED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as any)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-gray-600">Min Match:</span>
            <select
              value={minMatchScore}
              onChange={(e) => setMinMatchScore(Number(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              <option value={0}>All</option>
              <option value={40}>40%+</option>
              <option value={60}>60%+</option>
              <option value={80}>80%+</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No opportunities match your filters</p>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or check back later</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white rounded-xl border-2 p-6 transition-all hover:shadow-lg ${
                alert.status === 'NEW' ? 'border-purple-300' : 'border-gray-200'
              }`}
              onClick={() => handleViewAlert(alert)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {alert.status === 'NEW' && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                        NEW
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {alert.opportunityType}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{alert.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{alert.businessName}</p>
                </div>

                <div className={`px-3 py-1.5 rounded-lg font-bold text-sm ${getMatchScoreColor(alert.matchScore)}`}>
                  {alert.matchScore}% Match
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-700 mb-4 line-clamp-2">{alert.description}</p>

              {/* Match Reasons */}
              <div className="mb-4 space-y-2">
                {alert.matchReasons.map((reason, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-600">
                {alert.budget && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    <span>
                      {alert.budget.currency} {alert.budget.min}-{alert.budget.max}
                    </span>
                  </div>
                )}
                {alert.deadline && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      Due: {alert.deadline.toDate().toLocaleDateString()}
                    </span>
                  </div>
                )}
                {alert.skills.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    <span>{alert.skills.slice(0, 3).join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {alert.status !== 'APPLIED' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApply(alert.id);
                    }}
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                  >
                    Apply Now
                  </button>
                )}
                {alert.status !== 'DISMISSED' && alert.status !== 'APPLIED' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDismiss(alert.id);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
