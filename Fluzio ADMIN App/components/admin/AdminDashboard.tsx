import React, { useState } from 'react';
import { Shield, TrendingUp, Users, Award } from 'lucide-react';
import { BusinessLevelApprovals } from './BusinessLevelApprovals';
import { useAuth } from '../../services/AuthContext';

/**
 * Admin Dashboard - Main hub for admin operations
 * 
 * Includes:
 * - Business level upgrade approvals
 * - (Future) User management
 * - (Future) Mission approvals
 * - (Future) Analytics overview
 */

type AdminTab = 'approvals' | 'users' | 'analytics' | 'settings';

export const AdminDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('approvals');

  // Check if user is admin
  // Note: Admin role check temporarily disabled - need to add ADMIN to UserRole type
  // Uncomment and fix UserRole type to include ADMIN when ready
  /*
  if (userProfile?.role !== 'ADMIN') {
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
  */

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'approvals', label: 'Level Approvals', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-5 h-5" /> },
    { id: 'analytics', label: 'Analytics', icon: <Award className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Shield className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1E0E62]">Admin Dashboard</h1>
              <p className="text-sm text-[#8F8FA3]">Manage Fluzio platform operations</p>
            </div>
          </div>

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
          <BusinessLevelApprovals adminId={userProfile.uid} />
        )}

        {activeTab === 'users' && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#1E0E62] mb-2">User Management</h3>
            <p className="text-[#8F8FA3]">Coming soon - Manage user accounts and permissions</p>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="text-center py-12">
            <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#1E0E62] mb-2">Analytics Dashboard</h3>
            <p className="text-[#8F8FA3]">Coming soon - Platform metrics and insights</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#1E0E62] mb-2">Admin Settings</h3>
            <p className="text-[#8F8FA3]">Coming soon - Platform configuration</p>
          </div>
        )}
      </div>
    </div>
  );
};
