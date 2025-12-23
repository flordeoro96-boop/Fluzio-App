import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, Briefcase, Trophy, Calendar, TrendingUp, 
  AlertCircle, CheckCircle, X, Search, Filter, Plus, Edit2, 
  Trash2, Eye, Ban, CheckSquare, MessageSquare, Settings,
  BarChart3, Download, Upload, RefreshCw, Clock, XCircle
} from 'lucide-react';
import { Card, Button, Input } from './Common';
import { 
  createAdminEvent, getAllEvents, updateAdminEvent, deleteAdminEvent,
  getAdminStats, getAllUsers, banUser, verifyBusiness, createAdminMeetup
} from '../services/adminService';
import { MeetupCategory } from '../types';
import { UserManagementPanel } from './admin/UserManagementPanel';
import { ContentModerationPanel } from './admin/ContentModerationPanel';
import { getAdminAnalytics, AdminAnalytics } from '../services/adminAnalyticsService';

const EVENT_CATEGORIES = [
  // Core Business & Professional
  { id: 'NETWORKING', emoji: '🤝', label: 'Networking', color: 'from-purple-500 to-pink-500' },
  { id: 'BUSINESS', emoji: '💼', label: 'Business Growth', color: 'from-gray-700 to-slate-900' },
  { id: 'ENTREPRENEURSHIP', emoji: '🚀', label: 'Entrepreneurship', color: 'from-orange-600 to-red-600' },
  { id: 'LEADERSHIP', emoji: '👔', label: 'Leadership', color: 'from-blue-700 to-indigo-800' },
  { id: 'CONFERENCE', emoji: '🎤', label: 'Conferences', color: 'from-indigo-500 to-violet-500' },
  { id: 'WORKSHOP', emoji: '🎓', label: 'Workshops', color: 'from-blue-500 to-cyan-500' },
  
  // Marketing & Digital
  { id: 'MARKETING', emoji: '📣', label: 'Marketing & Sales', color: 'from-pink-600 to-rose-600' },
  { id: 'CONTENT_CREATION', emoji: '📸', label: 'Content Creation', color: 'from-purple-500 to-fuchsia-500' },
  { id: 'SOCIAL_MEDIA', emoji: '📱', label: 'Social Media', color: 'from-cyan-500 to-blue-500' },
  { id: 'BRANDING', emoji: '🎯', label: 'Branding & Strategy', color: 'from-violet-600 to-purple-700' },
  { id: 'TECH', emoji: '💻', label: 'Technology', color: 'from-blue-600 to-indigo-600' },
  { id: 'INNOVATION', emoji: '💡', label: 'Innovation', color: 'from-yellow-500 to-orange-600' },
  
  // Personal Growth
  { id: 'PERSONAL_DEVELOPMENT', emoji: '🌟', label: 'Personal Development', color: 'from-yellow-600 to-amber-600' },
  { id: 'CAREER', emoji: '📈', label: 'Career Development', color: 'from-indigo-600 to-blue-700' },
  { id: 'FINANCE', emoji: '💰', label: 'Finance & Investing', color: 'from-green-600 to-emerald-700' },
  { id: 'CREATIVITY', emoji: '✨', label: 'Creativity', color: 'from-pink-400 to-rose-500' },
  
  // Health & Wellness
  { id: 'WELLNESS', emoji: '🧘', label: 'Wellness', color: 'from-teal-500 to-cyan-500' },
  { id: 'FITNESS', emoji: '💪', label: 'Fitness & Training', color: 'from-red-500 to-orange-500' },
  { id: 'MINDFULNESS', emoji: '🧠', label: 'Mindfulness', color: 'from-teal-600 to-cyan-700' },
  { id: 'YOGA', emoji: '🧘‍♀️', label: 'Yoga', color: 'from-purple-400 to-pink-400' },
  
  // Major Sports
  { id: 'SPORTS', emoji: '⚽', label: 'Sports', color: 'from-green-500 to-emerald-500' },
  { id: 'SOCCER', emoji: '⚽', label: 'Soccer/Football', color: 'from-green-600 to-lime-600' },
  { id: 'BASKETBALL', emoji: '🏀', label: 'Basketball', color: 'from-orange-600 to-amber-600' },
  { id: 'TENNIS', emoji: '🎾', label: 'Tennis', color: 'from-yellow-600 to-green-600' },
  { id: 'GOLF', emoji: '⛳', label: 'Golf', color: 'from-green-700 to-emerald-800' },
  { id: 'RUNNING', emoji: '🏃', label: 'Running & Marathons', color: 'from-blue-600 to-cyan-600' },
  
  // Active & Adventure
  { id: 'CYCLING', emoji: '🚴', label: 'Cycling', color: 'from-teal-600 to-green-700' },
  { id: 'SWIMMING', emoji: '🏊', label: 'Swimming', color: 'from-blue-500 to-sky-500' },
  { id: 'HIKING', emoji: '🥾', label: 'Hiking', color: 'from-green-800 to-teal-800' },
  { id: 'ADVENTURE', emoji: '🧗', label: 'Adventure Sports', color: 'from-orange-700 to-red-700' },
  { id: 'SKIING', emoji: '⛷️', label: 'Skiing & Winter Sports', color: 'from-blue-400 to-cyan-400' },
  { id: 'MARTIAL_ARTS', emoji: '🥋', label: 'Martial Arts', color: 'from-red-700 to-orange-700' },
  
  // Social & Entertainment
  { id: 'COMMUNITY', emoji: '🌍', label: 'Community Building', color: 'from-green-700 to-teal-700' },
  { id: 'FOOD', emoji: '🍽️', label: 'Food & Dining', color: 'from-yellow-500 to-orange-500' },
  { id: 'COOKING', emoji: '👨‍🍳', label: 'Cooking & Culinary', color: 'from-red-600 to-orange-600' },
  { id: 'WINE_TASTING', emoji: '🍷', label: 'Wine Tasting', color: 'from-purple-700 to-red-700' },
  { id: 'GAMING', emoji: '🎮', label: 'Gaming & Esports', color: 'from-indigo-600 to-purple-600' },
  { id: 'MUSIC', emoji: '🎵', label: 'Music', color: 'from-purple-600 to-pink-600' },
  { id: 'DANCING', emoji: '💃', label: 'Dancing', color: 'from-rose-500 to-pink-600' },
  { id: 'COMEDY', emoji: '😂', label: 'Comedy & Entertainment', color: 'from-yellow-500 to-amber-500' },
  
  // Arts & Lifestyle
  { id: 'ART', emoji: '🎨', label: 'Arts & Culture', color: 'from-pink-500 to-rose-500' },
  { id: 'PHOTOGRAPHY', emoji: '📷', label: 'Photography', color: 'from-gray-600 to-slate-700' },
  { id: 'TRAVEL', emoji: '✈️', label: 'Travel', color: 'from-sky-500 to-blue-500' },
  { id: 'SAILING', emoji: '⛵', label: 'Sailing & Boating', color: 'from-blue-700 to-cyan-700' },
  { id: 'OUTDOORS', emoji: '🏔️', label: 'Outdoors', color: 'from-emerald-600 to-teal-600' },
  { id: 'RETREAT', emoji: '🏖️', label: 'Retreats', color: 'from-orange-500 to-red-500' },
];

interface AdminStats {
  totalUsers: number;
  totalBusinesses: number;
  totalMissions: number;
  totalRewards: number;
  activeUsers: number;
  pendingApprovals: number;
  revenue: number;
  growth: number;
}

interface AdminDashboardProps {
  onClose: () => void;
}

type AdminTab = 'overview' | 'users' | 'businesses' | 'missions' | 'events' | 'rewards' | 'moderation' | 'analytics' | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalBusinesses: 0,
    totalMissions: 0,
    totalRewards: 0,
    activeUsers: 0,
    pendingApprovals: 0,
    revenue: 0,
    growth: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAdminStats();
  }, []);

  const loadAdminStats = async () => {
    setIsLoading(true);
    try {
      const stats = await getAdminStats();
      setStats({
        ...stats,
        revenue: 45678,
        growth: 23.5
      });
    } catch (error) {
      console.error('Failed to load admin stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'businesses', label: 'Businesses', icon: Briefcase },
    { id: 'missions', label: 'Missions', icon: Trophy },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'rewards', label: 'Rewards', icon: Trophy },
    { id: 'moderation', label: 'Moderation', icon: Shield },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-purple-900 to-purple-800 text-white p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Fluzio Admin</h2>
            <p className="text-xs text-purple-200">Control Panel</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-white text-purple-900 shadow-lg' 
                    : 'text-purple-100 hover:bg-white/10'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <button
          onClick={onClose}
          className="mt-6 w-full flex items-center gap-3 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg transition-all"
        >
          <X className="w-5 h-5" />
          <span className="font-medium">Exit Admin</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-50 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {tabs.find(t => t.id === activeTab)?.label}
              </h1>
              <p className="text-gray-500 mt-1">
                {activeTab === 'overview' && 'Platform overview and key metrics'}
                {activeTab === 'users' && 'Manage customer accounts and profiles'}
                {activeTab === 'businesses' && 'Control business accounts and verifications'}
                {activeTab === 'missions' && 'Monitor and manage missions'}
                {activeTab === 'events' && 'Create and manage platform events'}
                {activeTab === 'rewards' && 'Oversee rewards and redemptions'}
                {activeTab === 'moderation' && 'Content moderation and user reports'}
                {activeTab === 'analytics' && 'Platform analytics and insights'}
                {activeTab === 'settings' && 'Platform configuration and settings'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={loadAdminStats}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={activeTab === 'users' || activeTab === 'moderation' ? '' : 'p-8'}>
          {activeTab === 'overview' && <OverviewTab stats={stats} />}
          {activeTab === 'users' && <UserManagementPanel />}
          {activeTab === 'businesses' && <BusinessesTab searchTerm={searchTerm} />}
          {activeTab === 'missions' && <MissionsTab searchTerm={searchTerm} />}
          {activeTab === 'events' && <EventsTab searchTerm={searchTerm} />}
          {activeTab === 'rewards' && <RewardsTab searchTerm={searchTerm} />}
          {activeTab === 'moderation' && <ContentModerationPanel />}
          {activeTab === 'analytics' && <AnalyticsTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </div>
      </div>
    </div>
  );
};

// Overview Tab
const OverviewTab: React.FC<{ stats: AdminStats }> = ({ stats }) => (
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

    {/* Quick Actions */}
    <Card className="p-6">
      <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
      <div className="grid grid-cols-4 gap-4">
        <QuickAction icon={Plus} label="Add Event" color="purple" />
        <QuickAction icon={Users} label="Review Users" color="blue" />
        <QuickAction icon={Shield} label="Moderation" color="red" />
        <QuickAction icon={Download} label="Export Data" color="green" />
      </div>
    </Card>

    {/* Recent Activity */}
    <Card className="p-6">
      <h3 className="font-bold text-lg mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {[
          { action: 'New business registered', user: 'Artisan Coffee Co.', time: '2 minutes ago' },
          { action: 'Mission completed', user: 'Sofia Martinez', time: '15 minutes ago' },
          { action: 'Reward redeemed', user: 'Alex Johnson', time: '1 hour ago' },
          { action: 'Event created', user: 'Downtown Gallery', time: '2 hours ago' }
        ].map((activity, idx) => (
          <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <div>
              <p className="font-medium text-gray-900">{activity.action}</p>
              <p className="text-sm text-gray-500">{activity.user}</p>
            </div>
            <span className="text-xs text-gray-400">{activity.time}</span>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

// Users Tab
const UsersTab: React.FC<{ searchTerm: string }> = ({ searchTerm }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
        <Button className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>
      <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center gap-2">
        <Plus className="w-4 h-4" />
        Add User
      </Button>
    </div>

    <Card className="overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Joined</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {/* Sample data - replace with real data */}
          <UserRow />
          <UserRow />
          <UserRow />
        </tbody>
      </table>
    </Card>
  </div>
);

// Businesses Tab
const BusinessesTab: React.FC<{ searchTerm: string }> = ({ searchTerm }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </div>
      <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center gap-2">
        <CheckCircle className="w-4 h-4" />
        Verify Business
      </Button>
    </div>

    <Card className="overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Business</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Subscription</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          <BusinessRow />
          <BusinessRow />
          <BusinessRow />
        </tbody>
      </table>
    </Card>
  </div>
);

// Missions Tab
const MissionsTab: React.FC<{ searchTerm: string }> = ({ searchTerm }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </div>
    </div>

    <div className="grid grid-cols-3 gap-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-600">Active Missions</span>
          <Trophy className="w-5 h-5 text-green-500" />
        </div>
        <div className="text-3xl font-bold">1,234</div>
      </Card>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-600">Pending Approval</span>
          <AlertCircle className="w-5 h-5 text-orange-500" />
        </div>
        <div className="text-3xl font-bold">23</div>
      </Card>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-600">Completed Today</span>
          <CheckCircle className="w-5 h-5 text-blue-500" />
        </div>
        <div className="text-3xl font-bold">456</div>
      </Card>
    </div>
  </div>
);

// Events Tab - Most important for admin
const EventsTab: React.FC<{ searchTerm: string }> = ({ searchTerm }) => {
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreateMeetup, setShowCreateMeetup] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setShowCreateMeetup(true)}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Meetup
          </Button>
          <Button 
            onClick={() => setShowCreateEvent(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Upcoming Events</span>
            <Calendar className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-3xl font-bold">12</div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Active Events</span>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold">5</div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Total Attendees</span>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold">2,348</div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-bold text-lg mb-4">All Events</h3>
        <div className="space-y-4">
          {/* Sample events */}
          <EventRow />
          <EventRow />
          <EventRow />
        </div>
      </Card>

      {showCreateEvent && (
        <CreateEventModal onClose={() => setShowCreateEvent(false)} />
      )}
      
      {showCreateMeetup && (
        <CreateMeetupModal onClose={() => setShowCreateMeetup(false)} />
      )}
    </div>
  );
};

// Rewards Tab
const RewardsTab: React.FC<{ searchTerm: string }> = ({ searchTerm }) => (
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
const ModerationTab: React.FC = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-3 gap-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-600">Pending Reports</span>
          <AlertCircle className="w-5 h-5 text-red-500" />
        </div>
        <div className="text-3xl font-bold">15</div>
      </Card>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-600">Reviewed Today</span>
          <CheckCircle className="w-5 h-5 text-green-500" />
        </div>
        <div className="text-3xl font-bold">42</div>
      </Card>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-600">Banned Users</span>
          <Ban className="w-5 h-5 text-gray-500" />
        </div>
        <div className="text-3xl font-bold">3</div>
      </Card>
    </div>
  </div>
);

// Analytics Tab
const AnalyticsTab: React.FC = () => {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await getAdminAnalytics(timeRange);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">No analytics data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-end gap-2">
        {(['7d', '30d', '90d'] as const).map(range => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === range
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
          </button>
        ))}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-1">Total Users</div>
          <div className="text-3xl font-bold text-gray-900">{analytics.overview.totalUsers}</div>
          <div className="text-xs text-gray-500 mt-1">
            {analytics.overview.totalBusinesses} businesses, {analytics.overview.totalCustomers} customers
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-1">Active Users</div>
          <div className="text-3xl font-bold text-green-600">{analytics.engagement.activeUsers}</div>
          <div className="text-xs text-gray-500 mt-1">
            {((analytics.engagement.activeUsers / analytics.overview.totalUsers) * 100).toFixed(1)}% engagement
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-1">Total Missions</div>
          <div className="text-3xl font-bold text-blue-600">{analytics.overview.totalMissions}</div>
          <div className="text-xs text-gray-500 mt-1">
            {analytics.missions.approvalRate.toFixed(1)}% approval rate
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
          <div className="text-3xl font-bold text-purple-600">${analytics.overview.totalRevenue.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-1">
            ${analytics.revenue.monthlyRecurring.toFixed(2)} MRR
          </div>
        </Card>
      </div>

      {/* Missions Stats */}
      <Card className="p-6">
        <h3 className="font-bold text-lg mb-4">Mission Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-sm text-yellow-700 mb-1">Pending</div>
            <div className="text-2xl font-bold text-yellow-900">{analytics.missions.pending}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-green-700 mb-1">Approved</div>
            <div className="text-2xl font-bold text-green-900">{analytics.missions.approved}</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="text-sm text-red-700 mb-1">Rejected</div>
            <div className="text-2xl font-bold text-red-900">{analytics.missions.rejected}</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-700 mb-1">Avg Response Time</div>
            <div className="text-2xl font-bold text-blue-900">{analytics.missions.avgApprovalTime.toFixed(1)}h</div>
          </div>
        </div>
      </Card>

      {/* Top Businesses */}
      <Card className="p-6">
        <h3 className="font-bold text-lg mb-4">Top Businesses by Missions</h3>
        <div className="space-y-3">
          {analytics.missions.topBusinesses.slice(0, 5).map((business, index) => (
            <div key={business.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <span className="font-medium text-gray-900">{business.name}</span>
              </div>
              <span className="text-sm font-semibold text-gray-600">{business.count} missions</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Top Contributors */}
      <Card className="p-6">
        <h3 className="font-bold text-lg mb-4">Top Contributors</h3>
        <div className="space-y-3">
          {analytics.users.topContributors.slice(0, 5).map((user, index) => (
            <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <span className="font-medium text-gray-900">{user.name}</span>
              </div>
              <span className="text-sm font-semibold text-gray-600">{user.points.toLocaleString()} pts</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// Settings Tab
const SettingsTab: React.FC = () => (
  <div className="space-y-6">
    <Card className="p-6">
      <h3 className="font-bold text-lg mb-4">Platform Settings</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Platform Name</label>
          <Input defaultValue="Fluzio" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
          <Input defaultValue="support@fluzio.com" />
        </div>
      </div>
    </Card>
  </div>
);

// Helper Components
const StatCard: React.FC<{ label: string; value: string; change: string; icon: any; color: string }> = 
  ({ label, value, change, icon: Icon, color }) => {
    const colors = {
      blue: 'bg-blue-500',
      purple: 'bg-purple-500',
      green: 'bg-green-500',
      orange: 'bg-orange-500'
    };

    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-600 text-sm font-medium">{label}</span>
          <div className={`w-10 h-10 ${colors[color as keyof typeof colors]} rounded-lg flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
        <div className={`text-sm ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
          {change} from last month
        </div>
      </Card>
    );
  };

const QuickAction: React.FC<{ icon: any; label: string; color: string }> = ({ icon: Icon, label, color }) => {
  const colors = {
    purple: 'from-purple-500 to-purple-600',
    blue: 'from-blue-500 to-blue-600',
    red: 'from-red-500 to-red-600',
    green: 'from-green-500 to-green-600'
  };

  return (
    <button className={`p-4 bg-gradient-to-r ${colors[color as keyof typeof colors]} text-white rounded-lg hover:shadow-lg transition-all flex flex-col items-center gap-2`}>
      <Icon className="w-6 h-6" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
};

const UserRow: React.FC = () => (
  <tr className="hover:bg-gray-50">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
          SM
        </div>
        <div>
          <div className="font-medium">Sofia Martinez</div>
          <div className="text-sm text-gray-500">Customer</div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4 text-gray-600">sofia.m@example.com</td>
    <td className="px-6 py-4">
      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>
    </td>
    <td className="px-6 py-4 text-gray-600">Nov 15, 2024</td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-2">
        <button className="p-2 hover:bg-gray-100 rounded"><Eye className="w-4 h-4" /></button>
        <button className="p-2 hover:bg-gray-100 rounded"><Edit2 className="w-4 h-4" /></button>
        <button className="p-2 hover:bg-gray-100 rounded text-red-500"><Ban className="w-4 h-4" /></button>
      </div>
    </td>
  </tr>
);

const BusinessRow: React.FC = () => (
  <tr className="hover:bg-gray-50">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
          AC
        </div>
        <div>
          <div className="font-medium">Artisan Coffee Co.</div>
          <div className="text-sm text-gray-500">Downtown</div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4 text-gray-600">Cafe & Restaurant</td>
    <td className="px-6 py-4">
      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Premium</span>
    </td>
    <td className="px-6 py-4">
      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Verified</span>
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-2">
        <button className="p-2 hover:bg-gray-100 rounded"><Eye className="w-4 h-4" /></button>
        <button className="p-2 hover:bg-gray-100 rounded"><Edit2 className="w-4 h-4" /></button>
      </div>
    </td>
  </tr>
);

const EventRow: React.FC = () => (
  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-all">
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
        <Calendar className="w-8 h-8 text-white" />
      </div>
      <div>
        <h4 className="font-bold text-gray-900">Summer Networking Event</h4>
        <p className="text-sm text-gray-600">June 15, 2025 • 18:00 - 22:00</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Active</span>
          <span className="text-xs text-gray-500">234 attendees</span>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <button className="p-2 hover:bg-gray-100 rounded"><Edit2 className="w-4 h-4" /></button>
      <button className="p-2 hover:bg-gray-100 rounded text-red-500"><Trash2 className="w-4 h-4" /></button>
    </div>
  </div>
);

const CreateEventModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    maxAttendees: '',
    category: 'NETWORKING',
    categories: [] as string[],
    isForEveryone: true,
    allowedLevels: [] as number[],
    requiresAdminApproval: false,
    genderRestriction: 'mixed' as 'mixed' | 'men' | 'women'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate at least one category is selected
    if (formData.categories.length === 0) {
      alert('Please select at least one event category');
      return;
    }
    
    const result = await createAdminEvent({
      ...formData,
      maxAttendees: parseInt(formData.maxAttendees) || 0
    });
    
    if (result.success) {
      alert('Event created successfully!');
      onClose();
    } else {
      alert('Failed to create event. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold">Create New Event</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Event Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Time *</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Location *</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Max Attendees</label>
            <input
              type="number"
              value={formData.maxAttendees}
              onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Event Categories */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Event Categories * (Click to select multiple)
            </label>
            <div className="relative">
              {/* Scroll indicator left */}
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
              
              {/* Scrollable container */}
              <div className="flex gap-2 overflow-x-auto pb-2 px-1 scroll-smooth hide-scrollbar">
                {EVENT_CATEGORIES.map(cat => {
                  const isSelected = formData.categories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setFormData({ ...formData, categories: formData.categories.filter(c => c !== cat.id) });
                        } else {
                          setFormData({ ...formData, categories: [...formData.categories, cat.id] });
                        }
                      }}
                      className={`flex-shrink-0 px-4 py-2 border-2 rounded-lg transition-all ${
                        isSelected 
                          ? 'border-purple-600 bg-purple-50 shadow-md' 
                          : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
                    >
                      <span className="text-2xl">{cat.emoji}</span>
                      <span className="ml-2 text-sm font-medium">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
              
              {/* Scroll indicator right */}
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
            </div>
            <p className="text-xs text-gray-500 mt-1 text-center">
              ← Scroll horizontally to see more categories →
            </p>
            {formData.categories.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-xs text-gray-600 font-medium">Selected:</span>
                {formData.categories.map(catId => {
                  const cat = EVENT_CATEGORIES.find(c => c.id === catId);
                  return cat ? (
                    <span key={catId} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </div>

          {/* Level Restrictions */}
          <div className="border-t border-gray-200 pt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Who Can Join?</label>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  checked={formData.isForEveryone}
                  onChange={() => setFormData({ ...formData, isForEveryone: true, allowedLevels: [] })}
                  className="w-4 h-4 text-purple-600"
                />
                <div>
                  <div className="font-medium text-gray-900">Everyone</div>
                  <div className="text-sm text-gray-500">All user levels can join this event</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  checked={!formData.isForEveryone}
                  onChange={() => setFormData({ ...formData, isForEveryone: false })}
                  className="w-4 h-4 text-purple-600 mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 mb-2">Specific Levels Only</div>
                  <div className="text-sm text-gray-500 mb-3">Select which levels can join:</div>
                  
                  {!formData.isForEveryone && (
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3].map(level => (
                        <label key={level} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200 cursor-pointer hover:bg-gray-100">
                          <input
                            type="checkbox"
                            checked={formData.allowedLevels.includes(level)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, allowedLevels: [...formData.allowedLevels, level] });
                              } else {
                                setFormData({ ...formData, allowedLevels: formData.allowedLevels.filter(l => l !== level) });
                              }
                            }}
                            className="w-4 h-4 text-purple-600"
                          />
                          <span className="text-sm font-medium">Level {level}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Gender Restrictions */}
          <div className="border-t border-gray-200 pt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Gender Restrictions</label>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  checked={formData.genderRestriction === 'mixed'}
                  onChange={() => setFormData({ ...formData, genderRestriction: 'mixed' })}
                  className="w-4 h-4 text-purple-600"
                />
                <div>
                  <div className="font-medium text-gray-900">Mixed Gender</div>
                  <div className="text-sm text-gray-500">Open to all genders</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  checked={formData.genderRestriction === 'men'}
                  onChange={() => setFormData({ ...formData, genderRestriction: 'men' })}
                  className="w-4 h-4 text-purple-600"
                />
                <div>
                  <div className="font-medium text-gray-900">Men Only</div>
                  <div className="text-sm text-gray-500">Restricted to male participants</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  checked={formData.genderRestriction === 'women'}
                  onChange={() => setFormData({ ...formData, genderRestriction: 'women' })}
                  className="w-4 h-4 text-purple-600"
                />
                <div>
                  <div className="font-medium text-gray-900">Women Only</div>
                  <div className="text-sm text-gray-500">Restricted to female participants</div>
                </div>
              </label>
            </div>
          </div>

          {/* Admin Approval Requirement */}
          <div className="border-t border-gray-200 pt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Registration Process</label>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  checked={!formData.requiresAdminApproval}
                  onChange={() => setFormData({ ...formData, requiresAdminApproval: false })}
                  className="w-4 h-4 text-purple-600"
                />
                <div>
                  <div className="font-medium text-gray-900">Instant Registration</div>
                  <div className="text-sm text-gray-500">Users can join immediately after payment</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  checked={formData.requiresAdminApproval}
                  onChange={() => setFormData({ ...formData, requiresAdminApproval: true })}
                  className="w-4 h-4 text-purple-600"
                />
                <div>
                  <div className="font-medium text-gray-900">Admin Approval Required</div>
                  <div className="text-sm text-gray-500">Registrations must be reviewed and approved by admin team</div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg"
            >
              Create Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CreateMeetupModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'COFFEE' as MeetupCategory,
    startDate: '',
    startTime: '',
    endTime: '',
    address: '',
    city: '',
    latitude: '',
    longitude: '',
    organizerType: 'business' as 'business' | 'influencer',
    organizerId: '',
    organizerName: '',
    levelRequired: '1',
    xpReward: '50',
    femaleOnly: false,
    isPremium: false,
    isPartnerEvent: false,
    venue: '',
    coverPhoto: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const result = await createAdminMeetup({
        ...formData,
        latitude: parseFloat(formData.latitude) || 0,
        longitude: parseFloat(formData.longitude) || 0,
        levelRequired: parseInt(formData.levelRequired) || 1,
        xpReward: parseInt(formData.xpReward) || 50
      });
      
      if (result.success) {
        alert('Meetup created successfully!');
        onClose();
      } else {
        alert('Failed to create meetup. Please try again.');
      }
    } catch (error) {
      console.error('Error creating meetup:', error);
      alert('Failed to create meetup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const categories: MeetupCategory[] = [
    'COFFEE', 'DINNER', 'CREATIVE', 'FITNESS', 'PET', 
    'INTERNATIONAL', 'BUSINESS', 'WELLNESS', 'NIGHTLIFE', 'CULTURE'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create New Meetup</h2>
            <p className="text-sm text-gray-600 mt-1">Create a meetup for businesses or influencers</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Organizer Type Selection */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <label className="block text-sm font-semibold text-gray-900 mb-3">Organizer Type *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, organizerType: 'business' })}
                className={`p-4 rounded-lg border-2 transition-all ${ formData.organizerType === 'business'
                    ? 'border-blue-600 bg-blue-100 shadow-sm'
                    : 'border-gray-300 bg-white hover:border-blue-300'
                }`}
              >
                <Briefcase className={`w-6 h-6 mx-auto mb-2 ${
                  formData.organizerType === 'business' ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <div className="font-semibold text-gray-900">Business</div>
                <div className="text-xs text-gray-600 mt-1">Partner restaurant, cafe, venue</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, organizerType: 'influencer' })}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.organizerType === 'influencer'
                    ? 'border-cyan-600 bg-cyan-100 shadow-sm'
                    : 'border-gray-300 bg-white hover:border-cyan-300'
                }`}
              >
                <Users className={`w-6 h-6 mx-auto mb-2 ${
                  formData.organizerType === 'influencer' ? 'text-cyan-600' : 'text-gray-400'
                }`} />
                <div className="font-semibold text-gray-900">Influencer</div>
                <div className="text-xs text-gray-600 mt-1">Content creator, community leader</div>
              </button>
            </div>
          </div>

          {/* Organizer Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {formData.organizerType === 'business' ? 'Business ID' : 'Influencer ID'} *
              </label>
              <input
                type="text"
                value={formData.organizerId}
                onChange={(e) => setFormData({ ...formData, organizerId: e.target.value })}
                placeholder="e.g., user_12345"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {formData.organizerType === 'business' ? 'Business Name' : 'Influencer Name'} *
              </label>
              <input
                type="text"
                value={formData.organizerName}
                onChange={(e) => setFormData({ ...formData, organizerName: e.target.value })}
                placeholder="Name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Basic Info */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Meetup Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Coffee & Conversations Meetup"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Describe the meetup experience..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as MeetupCategory })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Venue Name</label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                placeholder="e.g., Starbucks Downtown"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time *</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">End Time *</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Address *</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Main Street"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">City *</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="New York"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Latitude *</label>
              <input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="40.7128"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Longitude *</label>
              <input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="-74.0060"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Level Required</label>
              <input
                type="number"
                value={formData.levelRequired}
                onChange={(e) => setFormData({ ...formData, levelRequired: e.target.value })}
                min="1"
                max="10"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">XP Reward</label>
              <input
                type="number"
                value={formData.xpReward}
                onChange={(e) => setFormData({ ...formData, xpReward: e.target.value })}
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Cover Photo URL</label>
            <input
              type="text"
              value={formData.coverPhoto}
              onChange={(e) => setFormData({ ...formData, coverPhoto: e.target.value })}
              placeholder="https://example.com/photo.jpg"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.femaleOnly}
                onChange={(e) => setFormData({ ...formData, femaleOnly: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-gray-900">Female Only</span>
                <p className="text-xs text-gray-600">Only female users can join this meetup</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPremium}
                onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-gray-900">Premium Event</span>
                <p className="text-xs text-gray-600">Requires premium subscription</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPartnerEvent}
                onChange={(e) => setFormData({ ...formData, isPartnerEvent: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-gray-900">Partner Event</span>
                <p className="text-xs text-gray-600">Official partner business event</p>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create Meetup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

