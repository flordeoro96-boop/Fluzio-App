/**
 * CheckInDashboard Component
 * 
 * Shows check-in statistics and live feed for businesses.
 * Displays who checked in, when, and points earned.
 */

import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Calendar, Award, MapPin } from 'lucide-react';
import { CheckIn } from '../types';

interface CheckInDashboardProps {
  businessId: string;
}

export const CheckInDashboard: React.FC<CheckInDashboardProps> = ({ businessId }) => {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'feed' | 'stats'>('feed');

  useEffect(() => {
    loadData();
  }, [businessId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Functions not available yet
      const checkInsData: any[] = [];
      const statsData = { totalCheckIns: 0, uniqueVisitors: 0, avgDistance: 0, totalPointsAwarded: 0 };
      // const [checkInsData, statsData] = await Promise.all([
      //   getBusinessCheckIns(businessId, 50),
      //   getBusinessCheckInStats(businessId)
      // ]);
      setCheckIns(checkInsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load check-in data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="check-in-dashboard">
      {/* Stats Overview */}
      <div className="stats-grid grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="text-blue-600" size={20} />
            <span className="text-2xl font-bold text-gray-900">
              {stats?.today || 0}
            </span>
          </div>
          <p className="text-sm text-gray-600">Today</p>
        </div>

        <div className="stat-card bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="text-green-600" size={20} />
            <span className="text-2xl font-bold text-gray-900">
              {stats?.thisWeek || 0}
            </span>
          </div>
          <p className="text-sm text-gray-600">This Week</p>
        </div>

        <div className="stat-card bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Users className="text-purple-600" size={20} />
            <span className="text-2xl font-bold text-gray-900">
              {stats?.uniqueCustomers || 0}
            </span>
          </div>
          <p className="text-sm text-gray-600">Unique Customers</p>
        </div>

        <div className="stat-card bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Award className="text-yellow-600" size={20} />
            <span className="text-2xl font-bold text-gray-900">
              +{(stats?.total || 0) * 5}
            </span>
          </div>
          <p className="text-sm text-gray-600">Points Earned</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs flex gap-2 mb-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('feed')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'feed'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Check-In Feed ({checkIns.length})
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'stats'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Statistics
        </button>
      </div>

      {/* Content */}
      {activeTab === 'feed' ? (
        <div className="check-ins-feed space-y-3">
          {checkIns.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <MapPin className="mx-auto text-gray-400 mb-3" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No check-ins yet
              </h3>
              <p className="text-gray-600">
                When customers check in at your location, they'll appear here.
              </p>
            </div>
          ) : (
            checkIns.map((checkIn) => (
              <div
                key={checkIn.id}
                className="check-in-item bg-white rounded-lg shadow p-4 border border-gray-200 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {checkIn.userAvatar ? (
                    <img
                      src={checkIn.userAvatar}
                      alt={checkIn.userName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-lg">
                        {checkIn.userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {checkIn.userName}
                          <span className="ml-2 text-sm font-normal text-gray-500">
                            Level {checkIn.userLevel}
                          </span>
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          📍 {checkIn.distance}m away • {formatTime(checkIn.timestamp)}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <div className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-medium">
                          <Award size={14} />
                          +{checkIn.businessPointsEarned}
                        </div>
                      </div>
                    </div>
                    
                    {checkIn.verified && (
                      <div className="mt-2">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          ✓ Verified location
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="statistics-view space-y-6">
          {/* Monthly Trend */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Overview</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Total Check-Ins</span>
                <span className="font-semibold text-gray-900">{stats?.total || 0}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">This Month</span>
                <span className="font-semibold text-gray-900">{stats?.thisMonth || 0}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Unique Customers</span>
                <span className="font-semibold text-gray-900">{stats?.uniqueCustomers || 0}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-gray-600">Total Points Earned</span>
                <span className="font-semibold text-green-600">
                  +{(stats?.total || 0) * 5} points
                </span>
              </div>
            </div>
          </div>

          {/* Average Distance */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Check-In Quality</h3>
            <p className="text-sm text-gray-600 mb-3">
              Average distance from your location
            </p>
            <div className="text-3xl font-bold text-blue-600">
              {checkIns.length > 0
                ? Math.round(
                    checkIns.reduce((sum, c) => sum + c.distance, 0) / checkIns.length
                  )
                : 0}
              m
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Lower is better - means customers are closer to your location
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
