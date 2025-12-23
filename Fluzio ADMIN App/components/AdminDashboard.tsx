import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Users, Briefcase, Trophy, Calendar, Gift, Shield, 
  AlertCircle, TrendingUp, Eye, Edit2, Ban, CheckCircle, Crown,
  Video, Package, Filter, Download, Plus, UserCheck, Search, X
} from 'lucide-react';
import { Card } from './Common';
import { AdminEventManagement } from './admin/AdminEventManagement';
import { AdminManagement } from './admin/AdminManagement';
import { AdminMissionManagement } from './admin/AdminMissionManagement';
import { UserManagementPanel } from './admin/UserManagementPanel';
import { BusinessLevelApprovals } from './admin/BusinessLevelApprovals';
import { getAdminPermissions, canPerformAction, AdminPermissions } from '../services/adminAuthService';
import { AdminRole } from '../types';
import { useAuth } from '../services/AuthContext';

type AdminTab = 'overview' | 'users' | 'businesses' | 'creators' | 'missions' | 'events' | 'rewards' | 'admins' | 'moderation' | 'analytics' | 'settings';

interface AdminStats {
  totalUsers: number;
  totalBusinesses: number;
  totalMissions: number;
  totalRewards: number;
  totalEvents: number;
  totalCreators: number;
  activeUsers: number;
  pendingApprovals: number;
  revenue: number;
  growth: number;
  countries: number;
  cities: number;
}

interface FilterState {
  country?: string;
  city?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  level?: number;
  tier?: string;
  type?: string;
  searchTerm: string;
}

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [adminPerms, setAdminPerms] = useState<AdminPermissions | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: ''
  });
  
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 45234,
    totalBusinesses: 3421,
    totalMissions: 8932,
    totalRewards: 4567,
    totalEvents: 892,
    totalCreators: 1234,
    activeUsers: 12453,
    pendingApprovals: 23,
    revenue: 184932,
    growth: 23.5,
    countries: 12,
    cities: 145
  });

  useEffect(() => {
    if (user?.uid) {
      loadAdminPermissions();
    }
  }, [user]);

  const loadAdminPermissions = async () => {
    if (!user?.uid) return;
    const perms = await getAdminPermissions(user.uid);
    setAdminPerms(perms);
  };

  const getRoleDisplay = () => {
    if (!adminPerms) return 'Loading...';
    
    const roleNames: Record<AdminRole, string> = {
      [AdminRole.SUPER_ADMIN]: 'Super Admin',
      [AdminRole.COUNTRY_ADMIN]: `Country Admin (${adminPerms.countryId || 'N/A'})`,
      [AdminRole.CITY_ADMIN]: `City Admin (${adminPerms.cityId || 'N/A'})`,
      [AdminRole.EVENT_ADMIN]: 'Event Admin',
      [AdminRole.SUPPORT_ADMIN]: 'Support Admin',
      [AdminRole.MODERATOR]: 'Moderator',
      [AdminRole.SUPPORT]: 'Support'
    };
    
    return roleNames[adminPerms.role] || adminPerms.role;
  };

  const canAccessTab = (tab: AdminTab): boolean => {
    if (!adminPerms) return false;
    
    const tabPermissions: Record<AdminTab, string> = {
      'overview': 'VIEW_ANALYTICS',
      'users': 'VIEW_USERS',
      'businesses': 'VIEW_BUSINESSES',
      'creators': 'VIEW_USERS',
      'missions': 'MANAGE_MISSIONS',
      'events': 'MANAGE_EVENTS',
      'rewards': 'MANAGE_REWARDS',
      'admins': 'MANAGE_ADMINS',
      'moderation': 'MODERATE_CONTENT',
      'analytics': 'VIEW_ANALYTICS',
      'settings': 'MANAGE_SETTINGS'
    };
    
    return canPerformAction(adminPerms, tabPermissions[tab]);
  };

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-5 h-5" /> },
    { id: 'businesses', label: 'Businesses', icon: <Briefcase className="w-5 h-5" /> },
    { id: 'creators', label: 'Creators', icon: <Video className="w-5 h-5" /> },
    { id: 'missions', label: 'Missions', icon: <Trophy className="w-5 h-5" /> },
    { id: 'events', label: 'Events', icon: <Calendar className="w-5 h-5" /> },
    { id: 'rewards', label: 'Rewards', icon: <Gift className="w-5 h-5" /> },
    { id: 'admins', label: 'Sub-Admins', icon: <Shield className="w-5 h-5" /> },
    { id: 'moderation', label: 'Moderation', icon: <AlertCircle className="w-5 h-5" /> },
    { id: 'analytics', label: 'Analytics', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Shield className="w-5 h-5" /> }
  ];

  if (!adminPerms) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading admin permissions...</p>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab stats={stats} adminPerms={adminPerms} />;
      case 'users':
        return <UserManagementPanel />;
      case 'businesses':
        return <BusinessLevelApprovals adminId={user!.uid} />;
      case 'creators':
        return <CreatorsTab filters={filters} adminPerms={adminPerms} />;
      case 'missions':
        return <AdminMissionManagement adminId={user!.uid} adminPerms={adminPerms} />;
      case 'events':
        return <AdminEventManagement adminId={user!.uid} adminPerms={adminPerms} />;
      case 'rewards':
        return <RewardsTab filters={filters} adminPerms={adminPerms} />;
      case 'admins':
        return <AdminManagement adminId={user!.uid} adminPerms={adminPerms} />;
      case 'moderation':
        return <ModerationTab filters={filters} adminPerms={adminPerms} />;
      case 'analytics':
        return <AnalyticsTab filters={filters} adminPerms={adminPerms} />;
      case 'settings':
        return <SettingsTab adminPerms={adminPerms} />;
      default:
        return <OverviewTab stats={stats} adminPerms={adminPerms} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Crown className="w-8 h-8 text-purple-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                  <p className="text-sm text-gray-500">{getRoleDisplay()}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  showFilters 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && activeTab !== 'overview' && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-5 gap-4">
                {adminPerms.role === AdminRole.SUPER_ADMIN && (
                  <>
                    <select 
                      value={filters.country || ''} 
                      onChange={(e) => setFilters({ ...filters, country: e.target.value || undefined })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">All Countries</option>
                      <option value="DE">Germany</option>
                      <option value="ES">Spain</option>
                      <option value="GB">United Kingdom</option>
                      <option value="FR">France</option>
                    </select>
                    
                    <select 
                      value={filters.city || ''} 
                      onChange={(e) => setFilters({ ...filters, city: e.target.value || undefined })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">All Cities</option>
                      <option value="Berlin">Berlin</option>
                      <option value="Madrid">Madrid</option>
                      <option value="London">London</option>
                      <option value="Paris">Paris</option>
                    </select>
                  </>
                )}
                
                <select 
                  value={filters.status || ''} 
                  onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
                
                <select 
                  value={filters.level?.toString() || ''} 
                  onChange={(e) => setFilters({ ...filters, level: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">All Levels</option>
                  <option value="1">Level 1</option>
                  <option value="2">Level 2</option>
                  <option value="3">Level 3</option>
                </select>
                
                <select 
                  value={filters.tier || ''} 
                  onChange={(e) => setFilters({ ...filters, tier: e.target.value || undefined })}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">All Tiers</option>
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => setFilters({ searchTerm: '' })}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.filter(tab => canAccessTab(tab.id)).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {renderTabContent()}
      </div>
    </div>
  );
};

// Overview Tab
const OverviewTab: React.FC<{ stats: AdminStats; adminPerms: AdminPermissions }> = ({ stats, adminPerms }) => {
  const StatCard: React.FC<{ 
    label: string; 
    value: string | number; 
    change?: string; 
    icon: React.ElementType;
    color: string;
  }> = ({ label, value, change, icon: Icon, color }) => (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-600">{label}</span>
        <Icon className={`w-5 h-5 text-${color}-500`} />
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      {change && (
        <div className={`text-sm mt-1 ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
          {change} vs last month
        </div>
      )}
    </Card>
  );

  const QuickAction: React.FC<{ icon: React.ElementType; label: string; color: string }> = ({ icon: Icon, label, color }) => (
    <button className={`flex flex-col items-center gap-2 p-4 bg-${color}-50 hover:bg-${color}-100 rounded-lg transition-colors`}>
      <Icon className={`w-6 h-6 text-${color}-600`} />
      <span className={`text-sm font-medium text-${color}-700`}>{label}</span>
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6">
        <StatCard
          label="Total Users"
          value={stats.totalUsers.toLocaleString()}
          change="+12.5%"
          icon={Users}
          color="blue"
        />
        <StatCard
          label="Businesses"
          value={stats.totalBusinesses.toLocaleString()}
          change="+8.3%"
          icon={Briefcase}
          color="purple"
        />
        <StatCard
          label="Active Missions"
          value={stats.totalMissions.toLocaleString()}
          change="+23.1%"
          icon={Trophy}
          color="green"
        />
        <StatCard
          label="Pending Reviews"
          value={stats.pendingApprovals.toLocaleString()}
          change="-5.2%"
          icon={AlertCircle}
          color="orange"
        />
      </div>

      {/* Geographic Breakdown - Super Admin Only */}
      {adminPerms.role === AdminRole.SUPER_ADMIN && (
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4">Geographic Distribution</h3>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-gray-600 text-sm">Countries</p>
              <p className="text-2xl font-bold">{stats.countries}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Cities</p>
              <p className="text-2xl font-bold">{stats.cities}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Active Regions</p>
              <p className="text-2xl font-bold">{stats.countries * 8}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
        <div className="grid grid-cols-4 gap-4">
          <QuickAction icon={Plus} label="Create Event" color="purple" />
          <QuickAction icon={UserCheck} label="Approve Businesses" color="blue" />
          <QuickAction icon={Shield} label="Add Sub-Admin" color="red" />
          <QuickAction icon={Download} label="Export Data" color="green" />
        </div>
      </Card>
    </div>
  );
};

// Creators Tab
const CreatorsTab: React.FC<{ filters: FilterState; adminPerms: AdminPermissions }> = ({ filters, adminPerms }) => {
  const [creators] = useState([
    { id: '1', name: 'Alex Johnson', username: '@alexj', followers: 15234, videos: 142, totalViews: '2.1M', engagement: '8.5%', status: 'verified', country: 'DE', city: 'Berlin' },
    { id: '2', name: 'Maria Garcia', username: '@mariag', followers: 28451, videos: 289, totalViews: '5.3M', engagement: '12.3%', status: 'verified', country: 'ES', city: 'Madrid' },
    { id: '3', name: 'David Chen', username: '@dchen', followers: 8932, videos: 67, totalViews: '890K', engagement: '6.2%', status: 'active', country: 'GB', city: 'London' },
  ]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Total Creators</span>
            <Video className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-3xl font-bold">1,234</div>
          <div className="text-sm text-green-600 mt-1">+15.2% this month</div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Verified Creators</span>
            <CheckCircle className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold">892</div>
          <div className="text-sm text-gray-500 mt-1">72% verified</div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Total Content</span>
            <Package className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-3xl font-bold">45.2K</div>
          <div className="text-sm text-gray-500 mt-1">Videos created</div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Total Reach</span>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold">127M</div>
          <div className="text-sm text-gray-500 mt-1">Total views</div>
        </Card>
      </div>

      {/* Creators Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Creator</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Followers</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Content</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Total Views</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Engagement</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Location</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {creators.map(creator => (
                <tr key={creator.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                        {creator.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{creator.name}</div>
                        <div className="text-sm text-gray-500">{creator.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900">{creator.followers.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-600">{creator.videos} videos</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-purple-600">{creator.totalViews}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${parseFloat(creator.engagement) > 10 ? 'text-green-600' : 'text-gray-600'}`}>
                      {creator.engagement}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="text-gray-900">{creator.city}</div>
                      <div className="text-gray-500">{creator.country}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      creator.status === 'verified' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {creator.status === 'verified' ? '✓ Verified' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg"><Eye className="w-4 h-4" /></button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                      <button className="p-2 hover:bg-red-50 rounded-lg text-red-500"><Ban className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// Rewards Tab
const RewardsTab: React.FC<{ filters: FilterState; adminPerms: AdminPermissions }> = ({ filters, adminPerms }) => (
  <div className="space-y-6">
    <Card className="p-6">
      <h3 className="font-bold text-lg mb-4">Reward Statistics</h3>
      <div className="grid grid-cols-4 gap-6">
        <div>
          <p className="text-gray-600 text-sm">Total Rewards</p>
          <p className="text-2xl font-bold">4,567</p>
        </div>
        <div>
          <p className="text-gray-600 text-sm">Active Rewards</p>
          <p className="text-2xl font-bold">2,341</p>
        </div>
        <div>
          <p className="text-gray-600 text-sm">Redeemed Today</p>
          <p className="text-2xl font-bold">123</p>
        </div>
        <div>
          <p className="text-gray-600 text-sm">Pending Refunds</p>
          <p className="text-2xl font-bold">8</p>
        </div>
      </div>
    </Card>
  </div>
);

// Moderation Tab
const ModerationTab: React.FC<{ filters: FilterState; adminPerms: AdminPermissions }> = ({ filters, adminPerms }) => (
  <div className="space-y-6">
    <Card className="p-6">
      <h3 className="font-bold text-lg mb-4">Content Moderation</h3>
      <p className="text-gray-600">Moderation tools and flagged content will appear here.</p>
    </Card>
  </div>
);

// Analytics Tab
const AnalyticsTab: React.FC<{ filters: FilterState; adminPerms: AdminPermissions }> = ({ filters, adminPerms }) => (
  <div className="space-y-6">
    <Card className="p-6">
      <h3 className="font-bold text-lg mb-4">Platform Analytics</h3>
      <p className="text-gray-600">Detailed analytics and reports will appear here.</p>
    </Card>
  </div>
);

// Settings Tab
const SettingsTab: React.FC<{ adminPerms: AdminPermissions }> = ({ adminPerms }) => (
  <div className="space-y-6">
    <Card className="p-6">
      <h3 className="font-bold text-lg mb-4">System Settings</h3>
      <p className="text-gray-600">Platform configuration options will appear here.</p>
    </Card>
  </div>
);

