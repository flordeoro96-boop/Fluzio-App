/**
 * ShopifyVisitsDashboard Component
 * 
 * Analytics dashboard showing Shopify store visit data for businesses.
 * Displays stats, visitor feed, and performance metrics.
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, Clock, Award, Calendar, Eye, 
  CheckCircle, BarChart3, ExternalLink 
} from 'lucide-react';
import {
  getBusinessVisits,
  getBusinessVisitStats,
  ShopifyVisit,
  VisitStats,
  formatDuration
} from '../services/shopifyVisitService';

interface ShopifyVisitsDashboardProps {
  businessId: string;
  storeUrl?: string;
}

export const ShopifyVisitsDashboard: React.FC<ShopifyVisitsDashboardProps> = ({
  businessId,
  storeUrl
}) => {
  const [visits, setVisits] = useState<ShopifyVisit[]>([]);
  const [stats, setStats] = useState<VisitStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'feed' | 'stats'>('feed');

  useEffect(() => {
    loadData();
  }, [businessId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [visitsData, statsData] = await Promise.all([
        getBusinessVisits(businessId, 50),
        getBusinessVisitStats(businessId)
      ]);
      
      setVisits(visitsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading visit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return then.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-600">Loading visit data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Shopify Visit Analytics</h2>
            {storeUrl && (
              <a
                href={`https://${storeUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/90 hover:text-white text-sm flex items-center gap-1"
              >
                {storeUrl}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
            <div className="text-3xl font-bold">{stats?.totalVisits || 0}</div>
            <div className="text-xs text-white/80">Total Visits</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Today */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Today</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.todayVisits || 0}</div>
        </div>

        {/* This Week */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-gray-600">This Week</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.weekVisits || 0}</div>
        </div>

        {/* Unique Visitors */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-600">Unique</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.uniqueVisitors || 0}</div>
        </div>

        {/* Points Given */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-gray-600">Points</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.totalPointsAwarded || 0}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Tab Headers */}
        <div className="border-b border-gray-200 flex">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex-1 py-3 px-4 font-medium text-sm transition-colors ${
              activeTab === 'feed'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Eye className="w-4 h-4 inline mr-2" />
            Visit Feed
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-3 px-4 font-medium text-sm transition-colors ${
              activeTab === 'stats'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Statistics
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'feed' && (
            <div className="space-y-3">
              {visits.length === 0 ? (
                <div className="text-center py-12">
                  <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No visits yet</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Create a Shopify visit mission to start tracking
                  </p>
                </div>
              ) : (
                visits.map((visit) => (
                  <div
                    key={visit.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {visit.userAvatar ? (
                        <img
                          src={visit.userAvatar}
                          alt={visit.userName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        visit.userName.charAt(0).toUpperCase()
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-gray-900 truncate">
                          {visit.userName}
                        </p>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(visit.timestamp)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        {visit.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(visit.duration)}
                          </span>
                        )}
                        
                        {visit.verified && (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                        
                        {visit.pointsAwarded > 0 && (
                          <span className="flex items-center gap-1 text-yellow-600 font-semibold">
                            <Award className="w-3 h-3" />
                            +{visit.pointsAwarded} pts
                          </span>
                        )}
                      </div>

                      {visit.deviceType && (
                        <span className="text-xs text-gray-500 mt-1 inline-block">
                          {visit.deviceType} · {visit.browser}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'stats' && stats && (
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-700 mb-1">Total Visits</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.totalVisits}</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-700 mb-1">Verified</p>
                  <p className="text-3xl font-bold text-green-900">{stats.verifiedVisits}</p>
                </div>
              </div>

              {/* Metrics Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Conversion Rate</span>
                  <span className="font-semibold text-gray-900">
                    {stats.conversionRate.toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Average Duration</span>
                  <span className="font-semibold text-gray-900">
                    {formatDuration(Math.round(stats.averageDuration))}
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">This Month</span>
                  <span className="font-semibold text-gray-900">
                    {stats.monthVisits} visits
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Unique Visitors</span>
                  <span className="font-semibold text-gray-900">
                    {stats.uniqueVisitors} users
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Total Points Awarded</span>
                  <span className="font-semibold text-yellow-600 flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    {stats.totalPointsAwarded}
                  </span>
                </div>
              </div>

              {/* Performance Indicator */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-2">Performance</h4>
                <p className="text-sm text-purple-700">
                  {stats.conversionRate >= 80 ? (
                    '🎉 Excellent! Most visitors are engaging with your store.'
                  ) : stats.conversionRate >= 60 ? (
                    '👍 Good engagement. Consider optimizing landing page.'
                  ) : stats.conversionRate >= 40 ? (
                    '📈 Moderate engagement. Try improving store experience.'
                  ) : (
                    '💡 Low engagement. Focus on attracting more qualified visitors.'
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
