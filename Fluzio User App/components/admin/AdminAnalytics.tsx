import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, Store, Target, Award, DollarSign,
  Calendar, ArrowUp, ArrowDown, Activity, Clock
} from 'lucide-react';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../services/AuthContext';
import { AdminPermissions, filterByScope } from '../../services/adminAuthService';

interface AnalyticsData {
  totalUsers: number;
  totalCustomers: number;
  totalBusinesses: number;
  totalMissions: number;
  activeMissions: number;
  completedMissions: number;
  totalPoints: number;
  totalRedemptions: number;
  verifiedBusinesses: number;
  bannedUsers: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  missionCompletionsThisWeek: number;
  missionCompletionsThisMonth: number;
}

interface AdminAnalyticsProps {
  adminId: string;
  adminPerms: AdminPermissions;
}

export const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ adminId, adminPerms }) => {
  const [data, setData] = useState<AnalyticsData>({
    totalUsers: 0,
    totalCustomers: 0,
    totalBusinesses: 0,
    totalMissions: 0,
    activeMissions: 0,
    completedMissions: 0,
    totalPoints: 0,
    totalRedemptions: 0,
    verifiedBusinesses: 0,
    bannedUsers: 0,
    newUsersThisWeek: 0,
    newUsersThisMonth: 0,
    missionCompletionsThisWeek: 0,
    missionCompletionsThisMonth: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Date calculations
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Load all users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Apply geographic scope filtering
      const users = filterByScope(
        allUsers,
        adminPerms,
        (user: any) => user.country,
        (user: any) => user.city
      );
      
      const totalUsers = users.length;
      const totalCustomers = users.filter((u: any) => u.role === 'CUSTOMER').length;
      const totalBusinesses = users.filter((u: any) => u.role === 'BUSINESS').length;
      const verifiedBusinesses = users.filter((u: any) => u.role === 'BUSINESS' && u.businessVerified).length;
      const bannedUsers = users.filter((u: any) => u.banned).length;
      
      // New users
      const newUsersThisWeek = users.filter((u: any) => {
        const createdAt = u.createdAt?.toDate?.() || new Date(u.createdAt);
        return createdAt >= weekAgo;
      }).length;
      
      const newUsersThisMonth = users.filter((u: any) => {
        const createdAt = u.createdAt?.toDate?.() || new Date(u.createdAt);
        return createdAt >= monthAgo;
      }).length;

      // Total points
      const totalPoints = users.reduce((sum: number, u: any) => sum + (u.points || 0), 0);

      // Load missions
      const missionsSnapshot = await getDocs(collection(db, 'missions'));
      const missions = missionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const totalMissions = missions.length;
      const activeMissions = missions.filter((m: any) => m.lifecycleStatus === 'ACTIVE' || m.isActive).length;
      const completedMissions = missions.filter((m: any) => m.lifecycleStatus === 'COMPLETED').length;

      // Load participations
      const participationsSnapshot = await getDocs(collection(db, 'participations'));
      const participations = participationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const missionCompletionsThisWeek = participations.filter((p: any) => {
        if (p.status !== 'COMPLETED') return false;
        const completedAt = p.completedAt?.toDate?.() || p.submittedAt?.toDate?.() || new Date(p.completedAt || p.submittedAt);
        return completedAt >= weekAgo;
      }).length;
      
      const missionCompletionsThisMonth = participations.filter((p: any) => {
        if (p.status !== 'COMPLETED') return false;
        const completedAt = p.completedAt?.toDate?.() || p.submittedAt?.toDate?.() || new Date(p.completedAt || p.submittedAt);
        return completedAt >= monthAgo;
      }).length;

      // Load redemptions
      const redemptionsSnapshot = await getDocs(collection(db, 'redemptions'));
      const totalRedemptions = redemptionsSnapshot.size;

      setData({
        totalUsers,
        totalCustomers,
        totalBusinesses,
        totalMissions,
        activeMissions,
        completedMissions,
        totalPoints,
        totalRedemptions,
        verifiedBusinesses,
        bannedUsers,
        newUsersThisWeek,
        newUsersThisMonth,
        missionCompletionsThisWeek,
        missionCompletionsThisMonth
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#00E5FF] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1E0E62]">Platform Analytics</h2>
          <p className="text-gray-600">Real-time insights and metrics</p>
        </div>
        <button
          onClick={loadAnalytics}
          className="px-4 py-2 bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2"
        >
          <Activity className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 opacity-80" />
            <div className="text-right">
              <div className="text-3xl font-bold">{data.totalUsers.toLocaleString()}</div>
              <div className="text-sm opacity-90">Total Users</div>
            </div>
          </div>
          <div className="text-xs opacity-75 mt-2">
            +{data.newUsersThisWeek} this week
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Store className="w-8 h-8 opacity-80" />
            <div className="text-right">
              <div className="text-3xl font-bold">{data.totalBusinesses.toLocaleString()}</div>
              <div className="text-sm opacity-90">Businesses</div>
            </div>
          </div>
          <div className="text-xs opacity-75 mt-2">
            {data.verifiedBusinesses} verified
          </div>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-8 h-8 opacity-80" />
            <div className="text-right">
              <div className="text-3xl font-bold">{data.totalMissions.toLocaleString()}</div>
              <div className="text-sm opacity-90">Total Missions</div>
            </div>
          </div>
          <div className="text-xs opacity-75 mt-2">
            {data.activeMissions} active now
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-8 h-8 opacity-80" />
            <div className="text-right">
              <div className="text-3xl font-bold">{data.totalPoints.toLocaleString()}</div>
              <div className="text-sm opacity-90">Total Points</div>
            </div>
          </div>
          <div className="text-xs opacity-75 mt-2">
            {data.totalRedemptions} redemptions
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Stats */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-[#1E0E62] mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Statistics
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Users</span>
              <span className="font-bold text-[#1E0E62]">{data.totalUsers.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Customers</span>
              <span className="font-bold text-green-600">{data.totalCustomers.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Businesses</span>
              <span className="font-bold text-blue-600">{data.totalBusinesses.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Banned Users</span>
              <span className="font-bold text-red-600">{data.bannedUsers.toLocaleString()}</span>
            </div>
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">New This Week</span>
                <span className="font-bold text-purple-600 flex items-center gap-1">
                  <ArrowUp className="w-4 h-4" />
                  {data.newUsersThisWeek}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">New This Month</span>
                <span className="font-bold text-purple-600 flex items-center gap-1">
                  <ArrowUp className="w-4 h-4" />
                  {data.newUsersThisMonth}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mission Stats */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-[#1E0E62] mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Mission Statistics
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Missions</span>
              <span className="font-bold text-[#1E0E62]">{data.totalMissions.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Active Missions</span>
              <span className="font-bold text-green-600">{data.activeMissions.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Completed Missions</span>
              <span className="font-bold text-blue-600">{data.completedMissions.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Completion Rate</span>
              <span className="font-bold text-purple-600">
                {data.totalMissions > 0 
                  ? Math.round((data.completedMissions / data.totalMissions) * 100)
                  : 0}%
              </span>
            </div>
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Completed This Week</span>
                <span className="font-bold text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  {data.missionCompletionsThisWeek}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completed This Month</span>
                <span className="font-bold text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  {data.missionCompletionsThisMonth}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Business Stats */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-[#1E0E62] mb-4 flex items-center gap-2">
            <Store className="w-5 h-5" />
            Business Statistics
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Businesses</span>
              <span className="font-bold text-[#1E0E62]">{data.totalBusinesses.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Verified</span>
              <span className="font-bold text-green-600">{data.verifiedBusinesses.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Unverified</span>
              <span className="font-bold text-yellow-600">
                {(data.totalBusinesses - data.verifiedBusinesses).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Verification Rate</span>
              <span className="font-bold text-purple-600">
                {data.totalBusinesses > 0 
                  ? Math.round((data.verifiedBusinesses / data.totalBusinesses) * 100)
                  : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Points & Rewards Stats */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-[#1E0E62] mb-4 flex items-center gap-2">
            <Award className="w-5 h-5" />
            Points & Rewards
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Points Earned</span>
              <span className="font-bold text-[#1E0E62]">{data.totalPoints.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Redemptions</span>
              <span className="font-bold text-green-600">{data.totalRedemptions.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Avg Points/User</span>
              <span className="font-bold text-blue-600">
                {data.totalUsers > 0 
                  ? Math.round(data.totalPoints / data.totalUsers).toLocaleString()
                  : 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Growth Indicators */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
        <h3 className="text-lg font-bold text-[#1E0E62] mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Growth Indicators
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">User Growth (Week)</div>
            <div className="text-2xl font-bold text-purple-600 flex items-center gap-2">
              <ArrowUp className="w-5 h-5" />
              {data.newUsersThisWeek}
            </div>
            <div className="text-xs text-gray-500 mt-1">new users</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">User Growth (Month)</div>
            <div className="text-2xl font-bold text-blue-600 flex items-center gap-2">
              <ArrowUp className="w-5 h-5" />
              {data.newUsersThisMonth}
            </div>
            <div className="text-xs text-gray-500 mt-1">new users</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Mission Activity</div>
            <div className="text-2xl font-bold text-green-600 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {data.missionCompletionsThisWeek}
            </div>
            <div className="text-xs text-gray-500 mt-1">completions this week</div>
          </div>
        </div>
      </div>
    </div>
  );
};
