import React, { useState, useEffect } from 'react';
import { Shield, TrendingUp, Users, Award, Store, Target, Calendar, Crown, AlertCircle, UserCog, MapPin } from 'lucide-react';
import { BusinessLevelApprovals } from './BusinessLevelApprovals';
import { AdminUserManagement } from './AdminUserManagement';
import { AdminBusinessManagement } from './AdminBusinessManagement';
import { AdminMissionManagement } from './AdminMissionManagement';
import { AdminEventManagement } from './AdminEventManagement';
import { AdminAnalytics } from './AdminAnalytics';
import { AdminSettings } from './AdminSettings';
import { AdminSubscriptionManagement } from './AdminSubscriptionManagement';
import { AdminManagement } from './AdminManagement';
import { AdminAuditLog } from './AdminAuditLog';
import AdminCohortManagement from '../../src/components/AdminCohortManagement';
import { useAuth } from '../../services/AuthContext';
import { getAdminPermissions, canPerformAction, getRoleName, getRoleColor, getScopeDescription, AdminPermissions } from '../../services/adminAuthService';

/**
 * Admin Dashboard - Main hub for admin operations
 * 
 * Includes:
 * - Business level upgrade approvals
 * - User management
 * - Business management
 * - Mission management
 * - Event management
 * - Subscription management
 * - Analytics overview
 * - Settings
 */

type AdminTab = 'approvals' | 'users' | 'businesses' | 'missions' | 'events' | 'cohorts' | 'subscriptions' | 'analytics' | 'admins' | 'audit' | 'settings';

export const AdminDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('approvals');
  const [adminPerms, setAdminPerms] = useState<AdminPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Load admin permissions on mount
  useEffect(() => {
    const loadAdminPermissions = async () => {
      if (!userProfile?.uid) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      try {
        const permissions = await getAdminPermissions(userProfile.uid);
        if (!permissions) {
          setAccessDenied(true);
        } else {
          setAdminPerms(permissions);
        }
      } catch (error) {
        console.error('Error loading admin permissions:', error);
        setAccessDenied(true);
      } finally {
        setLoading(false);
      }
    };
    
    loadAdminPermissions();
  }, [userProfile?.uid]);

  // Define tabs with permission requirements
  const allTabs: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number; requiredAction?: string }[] = [
    { id: 'approvals', label: 'Level Approvals', icon: <TrendingUp className="w-5 h-5" />, requiredAction: 'APPROVE_LEVEL' },
    { id: 'users', label: 'Users', icon: <Users className="w-5 h-5" />, requiredAction: 'VIEW_USERS' },
    { id: 'businesses', label: 'Businesses', icon: <Store className="w-5 h-5" />, requiredAction: 'VIEW_BUSINESSES' },
    { id: 'missions', label: 'Missions', icon: <Target className="w-5 h-5" />, requiredAction: 'VIEW_MISSIONS' },
    { id: 'events', label: 'Events', icon: <Calendar className="w-5 h-5" />, requiredAction: 'VIEW_EVENTS' },
    { id: 'cohorts', label: 'City Cohorts', icon: <MapPin className="w-5 h-5" />, requiredAction: 'MANAGE_COHORTS' },
    { id: 'subscriptions', label: 'Subscriptions', icon: <Crown className="w-5 h-5" />, requiredAction: 'MANAGE_SUBSCRIPTIONS' },
    { id: 'analytics', label: 'Analytics', icon: <Award className="w-5 h-5" />, requiredAction: 'VIEW_ANALYTICS' },
    { id: 'admins', label: 'Admin Users', icon: <UserCog className="w-5 h-5" />, requiredAction: 'MANAGE_ADMINS' },
    { id: 'audit', label: 'Audit Logs', icon: <AlertCircle className="w-5 h-5" />, requiredAction: 'VIEW_AUDIT_LOGS' },
    { id: 'settings', label: 'Settings', icon: <Shield className="w-5 h-5" />, requiredAction: 'MANAGE_SETTINGS' }
  ];

  // Filter tabs based on permissions
  const tabs = adminPerms ? allTabs.filter(tab => {
    if (!tab.requiredAction) return true;
    return canPerformAction(adminPerms, tab.requiredAction);
  }) : [];

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Shield className="w-16 h-16 text-purple-500 mx-auto mb-4 animate-pulse" />
          <p className="text-[#8F8FA3]">Loading admin permissions...</p>
        </div>
      </div>
    );
  }

  // Access denied state
  if (accessDenied || !adminPerms) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#1E0E62] mb-2">Access Denied</h2>
          <p className="text-[#8F8FA3]">You must be an administrator to access this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1E0E62]">Admin Dashboard</h1>
              <p className="text-sm text-[#8F8FA3]">Manage Fluzio platform operations</p>
            </div>
          </div>
          
          {/* Role Badge */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-semibold text-[#1E0E62]">{userProfile?.name || userProfile?.email}</div>
              <div className="text-xs text-[#8F8FA3]">{getScopeDescription(adminPerms)}</div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getRoleColor(adminPerms.role)}`}>
              {getRoleName(adminPerms.role)}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-[#8F8FA3] hover:bg-gray-100'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.badge && (
                  <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'approvals' && (
          <BusinessLevelApprovals adminId={userProfile.uid} adminPerms={adminPerms} />
        )}

        {activeTab === 'users' && (
          <AdminUserManagement adminId={userProfile.uid} adminPerms={adminPerms} />
        )}

        {activeTab === 'businesses' && (
          <AdminBusinessManagement adminId={userProfile.uid} adminPerms={adminPerms} />
        )}

        {activeTab === 'missions' && (
          <AdminMissionManagement adminId={userProfile.uid} adminPerms={adminPerms} />
        )}

        {activeTab === 'events' && (
          <AdminEventManagement adminId={userProfile.uid} adminPerms={adminPerms} />
        )}

        {activeTab === 'cohorts' && (
          <AdminCohortManagement adminId={userProfile.uid} onClose={() => {}} />
        )}

        {activeTab === 'subscriptions' && (
          <AdminSubscriptionManagement adminId={userProfile.uid} adminPerms={adminPerms} />
        )}

        {activeTab === 'analytics' && (
          <AdminAnalytics adminId={userProfile.uid} adminPerms={adminPerms} />
        )}

        {activeTab === 'admins' && (
          <AdminManagement adminId={userProfile.uid} adminPerms={adminPerms} />
        )}

        {activeTab === 'audit' && (
          <AdminAuditLog />
        )}

        {activeTab === 'settings' && (
          <AdminSettings adminId={userProfile.uid} adminPerms={adminPerms} />
        )}
      </div>
    </div>
  );
};
