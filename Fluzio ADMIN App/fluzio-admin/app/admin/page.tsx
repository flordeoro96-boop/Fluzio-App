'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Briefcase,
  UserCircle,
  Target,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Clock,
  Shield,
  Gift,
  Activity,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { AdminRole } from '@/lib/types';
import { useEffect, useState } from 'react';
import { getDashboardStatsAction } from './actions';

interface DashboardStats {
  users: { total: number; change: string; newThisMonth: number };
  businesses: { total: number; active: number; pending: number; change: string };
  creators: { total: number; verified: number; pending: number; change: string };
  missions: { total: number; active: number; completed: number; change: string };
  events: { total: number; upcoming: number; published: number; change: string };
  finance: { pendingPayouts: number; totalAmount: number; currency: string; change: string };
  rewards: { totalRedemptions: number; activeRewards: number; pointsRedeemed: number };
}

interface DashboardAlert {
  type: 'urgent' | 'warning' | 'info';
  message: string;
  count: number;
  href: string;
}

interface RecentActivity {
  id: string;
  type: 'user' | 'business' | 'event' | 'mission' | 'payout';
  action: string;
  entity: string;
  timestamp: string;
  status?: string;
}

export default function AdminDashboard() {
  const { admin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const result = await getDashboardStatsAction();

      if (!result.success) {
        throw new Error(result.error || 'Failed to load dashboard data');
      }

      setStats(result.stats || null);
      setAlerts(result.alerts || []);
      setRecentActivity(result.recentActivity || []);
      setLastRefresh(new Date());
    } catch (err: any) {
      console.error('[Dashboard] Error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData(true);
  };

  if (!admin) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-8">
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="font-bold text-red-900">Error Loading Dashboard</h3>
              <p className="text-red-700 text-sm">{error || 'Unknown error occurred'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.users.total.toLocaleString(),
      change: stats.users.change,
      subtitle: `${stats.users.newThisMonth} new this month`,
      icon: Users,
      href: '/admin/users',
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'Active Businesses',
      value: stats.businesses.total.toLocaleString(),
      change: stats.businesses.change,
      subtitle: `${stats.businesses.active} verified, ${stats.businesses.pending} pending`,
      icon: Briefcase,
      href: '/admin/businesses',
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Verified Creators',
      value: stats.creators.total.toLocaleString(),
      change: stats.creators.change,
      subtitle: `${stats.creators.verified} verified, ${stats.creators.pending} pending`,
      icon: UserCircle,
      href: '/admin/creators',
      gradient: 'from-purple-500 to-pink-600',
    },
    {
      title: 'Active Missions',
      value: stats.missions.total.toLocaleString(),
      change: stats.missions.change,
      subtitle: `${stats.missions.active} active, ${stats.missions.completed} completed`,
      icon: Target,
      href: '/admin/missions',
      gradient: 'from-orange-500 to-red-600',
    },
    {
      title: 'Upcoming Events',
      value: stats.events.upcoming.toLocaleString(),
      change: stats.events.change,
      subtitle: `${stats.events.published} published events`,
      icon: Calendar,
      href: '/admin/events',
      gradient: 'from-cyan-500 to-blue-600',
    },
    {
      title: 'Pending Payouts',
      value: `€${stats.finance.totalAmount.toLocaleString()}`,
      change: stats.finance.change,
      subtitle: `${stats.finance.pendingPayouts} payouts pending`,
      icon: DollarSign,
      href: '/admin/finance',
      gradient: 'from-green-500 to-emerald-600',
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'business': return Briefcase;
      case 'event': return Calendar;
      case 'mission': return Target;
      case 'user': return Users;
      default: return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'business': return 'text-emerald-600 bg-emerald-50';
      case 'event': return 'text-blue-600 bg-blue-50';
      case 'mission': return 'text-orange-600 bg-orange-50';
      case 'user': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const statusColors: Record<string, string> = {
      'VERIFIED': 'bg-green-100 text-green-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'PUBLISHED': 'bg-blue-100 text-blue-800',
      'ACTIVE': 'bg-emerald-100 text-emerald-800',
      'COMPLETED': 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={`text-xs ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </Badge>
    );
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-90"></div>
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 shadow-2xl border border-white/20">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-3">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
              </div>
              <p className="text-xl text-blue-50 mb-4">
                Welcome back, <span className="font-semibold">{admin.email}</span>
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-4 py-1.5 text-sm font-semibold">
                  {admin.role.replace('_', ' ')}
                </Badge>
                {admin.countryScopes.includes('GLOBAL') ? (
                  <Badge className="bg-emerald-500/20 backdrop-blur-sm text-white border-emerald-400/30 px-4 py-1.5 text-sm font-semibold">
                    🌍 Global Access
                  </Badge>
                ) : (
                  <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-4 py-1.5 text-sm">
                    📍 {admin.countryScopes.join(', ')}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/30 shadow-lg transition-all duration-200 hover:scale-105"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh Data'}
              </Button>
              {lastRefresh && (
                <p className="text-xs text-white/70">
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {admin.role !== AdminRole.ANALYST_READONLY && alerts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-amber-100 rounded-xl">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1 space-y-3">
              <h3 className="text-lg font-bold text-amber-900">⚠️ Action Required</h3>
              <ul className="space-y-2">
                {alerts.map((alert, index) => (
                  <li key={index}>
                    <Link
                      href={alert.href}
                      className="inline-flex items-center text-sm font-medium text-amber-800 hover:text-amber-900 hover:underline transition-colors group"
                    >
                      <span className="w-2 h-2 bg-amber-500 rounded-full mr-2 group-hover:animate-pulse"></span>
                      <span className="font-bold mr-1">{alert.count}</span>
                      {alert.message}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const isPositive = stat.change.startsWith('+');
          const isNegative = stat.change.startsWith('-');
          
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="group hover:shadow-2xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer border-0 bg-white overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-bold text-gray-600 uppercase tracking-wide">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-3 bg-gradient-to-br ${stat.gradient} rounded-xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="flex items-center mb-2">
                    {isPositive ? (
                      <TrendingUp className="w-5 h-5 mr-1.5 text-emerald-600" />
                    ) : isNegative ? (
                      <TrendingDown className="w-5 h-5 mr-1.5 text-red-600" />
                    ) : (
                      <TrendingUp className="w-5 h-5 mr-1.5 text-gray-400" />
                    )}
                    <span className={`text-sm font-bold ${
                      isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : 'text-gray-400'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500 ml-2 font-medium">vs last month</span>
                  </div>
                  <p className="text-xs text-gray-600 font-medium">{stat.subtitle}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Rewards Summary Card */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-pink-50"></div>
        <CardHeader className="relative border-b bg-white/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">Rewards & Redemptions</CardTitle>
            </div>
            <Link href="/admin/rewards">
              <Button variant="outline" size="sm">View Details</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="relative pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Total Redemptions</span>
                <Gift className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-purple-900">{stats.rewards.totalRedemptions.toLocaleString()}</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Active Rewards</span>
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-blue-900">{stats.rewards.activeRewards.toLocaleString()}</div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-5 border border-amber-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-amber-700 uppercase tracking-wide">Points Redeemed</span>
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-3xl font-bold text-amber-900">{stats.rewards.pointsRedeemed.toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {[AdminRole.SUPER_ADMIN, AdminRole.COUNTRY_ADMIN].includes(admin.role) && (
        <Card className="border-0 shadow-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50"></div>
          <CardHeader className="relative border-b bg-white/50 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <Target className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Quick Actions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="relative pt-8 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button asChild variant="outline" className="group h-auto py-6 justify-start border-2 hover:border-blue-400 hover:bg-blue-50 hover:shadow-lg transition-all duration-300">
                <Link href="/admin/events/new">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-500 transition-colors">
                      <Calendar className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                    </div>
                    <span className="font-bold text-gray-700 group-hover:text-blue-700 transition-colors">Create Event</span>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="group h-auto py-6 justify-start border-2 hover:border-emerald-400 hover:bg-emerald-50 hover:shadow-lg transition-all duration-300">
                <Link href="/admin/businesses?filter=pending-verification">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-500 transition-colors">
                      <Briefcase className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" />
                    </div>
                    <span className="font-bold text-gray-700 group-hover:text-emerald-700 transition-colors">Review Businesses</span>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="group h-auto py-6 justify-start border-2 hover:border-purple-400 hover:bg-purple-50 hover:shadow-lg transition-all duration-300">
                <Link href="/admin/creators?filter=pending-verification">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-500 transition-colors">
                      <UserCircle className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors" />
                    </div>
                    <span className="font-bold text-gray-700 group-hover:text-purple-700 transition-colors">Verify Creators</span>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="group h-auto py-6 justify-start border-2 hover:border-teal-400 hover:bg-teal-50 hover:shadow-lg transition-all duration-300">
                <Link href="/admin/finance?tab=payouts">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-teal-100 rounded-lg group-hover:bg-teal-500 transition-colors">
                      <DollarSign className="w-6 h-6 text-teal-600 group-hover:text-white transition-colors" />
                    </div>
                    <span className="font-bold text-gray-700 group-hover:text-teal-700 transition-colors">Process Payouts</span>
                  </div>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-gray-500 to-gray-700 rounded-lg">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">Recent Activity</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              Last 24 hours
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {recentActivity.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No recent activity</p>
              <p className="text-sm text-gray-400 mt-2">Activity will appear here as it happens</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                const colorClass = getActivityColor(activity.type);
                
                return (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100"
                  >
                    <div className={`p-2.5 rounded-lg ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">
                            <span className="capitalize">{activity.type}</span> {activity.action}
                          </p>
                          <p className="text-sm text-gray-600 truncate mt-0.5">{activity.entity}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {getStatusBadge(activity.status)}
                          <span className="text-xs text-gray-500 font-medium">
                            {formatTimeAgo(activity.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
