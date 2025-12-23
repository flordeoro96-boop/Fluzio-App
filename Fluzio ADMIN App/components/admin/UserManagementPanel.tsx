import React, { useState, useEffect } from 'react';
import {
  Users, Search, Filter, Ban, CheckCircle, XCircle, Mail, 
  Shield, Eye, MoreVertical, Download, ChevronDown, AlertTriangle
} from 'lucide-react';
import { getAllUsers, banUser } from '../../services/adminService';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  businessType?: string;
  city?: string;
  country?: string;
  totalPoints?: number;
  isBanned?: boolean;
  banReason?: string;
  isVerified?: boolean;
  createdAt: Date;
  lastActive?: Date;
}

export const UserManagementPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'customer' | 'business' | 'admin'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'banned'>('all');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, searchTerm, filterRole, filterStatus]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data.map((u: any) => ({
        ...u,
        createdAt: u.createdAt?.toDate?.() || new Date(),
        lastActive: u.lastActive?.toDate?.()
      })));
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.city?.toLowerCase().includes(term)
      );
    }

    // Role filter
    if (filterRole !== 'all') {
      if (filterRole === 'business') {
        filtered = filtered.filter(u => u.businessType);
      } else if (filterRole === 'customer') {
        filtered = filtered.filter(u => !u.businessType && u.role !== 'ADMIN');
      } else if (filterRole === 'admin') {
        filtered = filtered.filter(u => u.role === 'ADMIN');
      }
    }

    // Status filter
    if (filterStatus === 'banned') {
      filtered = filtered.filter(u => u.isBanned);
    } else if (filterStatus === 'active') {
      filtered = filtered.filter(u => !u.isBanned);
    }

    setFilteredUsers(filtered);
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
      setShowBulkActions(true);
    }
  };

  const handleBulkBan = async () => {
    if (!confirm(`Ban ${selectedUsers.size} users?`)) return;
    
    const reason = prompt('Enter ban reason:');
    if (!reason) return;

    try {
      // await bulkBanUsers(Array.from(selectedUsers), reason);
      // Fallback: Ban users individually
      for (const userId of Array.from(selectedUsers)) {
        await banUser(userId, reason);
      }
      await loadUsers();
      setSelectedUsers(new Set());
      setShowBulkActions(false);
      alert('Users banned successfully');
    } catch (error) {
      alert('Failed to ban users');
    }
  };

  const handleBulkUnban = async () => {
    if (!confirm(`Unban ${selectedUsers.size} users?`)) return;

    try {
      // await bulkUnbanUsers(Array.from(selectedUsers));
      // Bulk unban not available
      alert('Bulk unban not available. Please unban users individually.');
    } catch (error) {
      alert('Failed to unban users');
    }
  };

  const handleBanUser = async (userId: string, reason: string) => {
    try {
      await banUser(userId, reason);
      await loadUsers();
      alert('User banned successfully');
    } catch (error) {
      alert('Failed to ban user');
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Role', 'City', 'Country', 'Points', 'Status', 'Created At'];
    const rows = filteredUsers.map(u => [
      u.name,
      u.email,
      u.businessType ? 'Business' : u.role === 'ADMIN' ? 'Admin' : 'Customer',
      u.city || '',
      u.country || '',
      u.totalPoints || 0,
      u.isBanned ? 'Banned' : 'Active',
      u.createdAt.toLocaleDateString()
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getRoleBadge = (user: User) => {
    if (user.role === 'ADMIN') {
      return <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">Admin</span>;
    }
    if (user.businessType) {
      return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">Business</span>;
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">Customer</span>;
  };

  const getActivityStatus = (user: User) => {
    if (!user.lastActive) return 'Never';
    
    const daysSince = Math.floor((Date.now() - user.lastActive.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSince === 0) return <span className="text-green-600 font-medium">Today</span>;
    if (daysSince === 1) return <span className="text-green-600">Yesterday</span>;
    if (daysSince <= 7) return <span className="text-blue-600">{daysSince}d ago</span>;
    if (daysSince <= 30) return <span className="text-gray-600">{daysSince}d ago</span>;
    return <span className="text-gray-400">{daysSince}d ago</span>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredUsers.length} users {selectedUsers.size > 0 && `• ${selectedUsers.size} selected`}
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="all">All Roles</option>
            <option value="customer">Customers</option>
            <option value="business">Businesses</option>
            <option value="admin">Admins</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">
            {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkBan}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Ban className="w-4 h-4" />
              Ban Selected
            </button>
            <button
              onClick={handleBulkUnban}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Unban Selected
            </button>
            <button
              onClick={() => {
                setSelectedUsers(new Set());
                setShowBulkActions(false);
              }}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                          {user.name?.[0] || 'U'}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {user.name}
                            {user.isVerified && (
                              <CheckCircle className="w-4 h-4 text-blue-500" />
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getRoleBadge(user)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {user.city ? `${user.city}, ${user.country}` : 'N/A'}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      {user.totalPoints?.toLocaleString() || 0}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {getActivityStatus(user)}
                    </td>
                    <td className="px-4 py-4">
                      {user.isBanned ? (
                        <div className="flex items-center gap-1 text-red-600">
                          <XCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Banned</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Active</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => alert('View user details - coming soon')}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        {!user.isBanned && (
                          <button
                            onClick={() => {
                              const reason = prompt('Enter ban reason:');
                              if (reason) handleBanUser(user.id, reason);
                            }}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                            title="Ban User"
                          >
                            <Ban className="w-4 h-4 text-red-600" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Total Users</div>
          <div className="text-2xl font-bold text-gray-900">{users.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Businesses</div>
          <div className="text-2xl font-bold text-blue-600">
            {users.filter(u => u.businessType).length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Customers</div>
          <div className="text-2xl font-bold text-green-600">
            {users.filter(u => !u.businessType && u.role !== 'ADMIN').length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Banned</div>
          <div className="text-2xl font-bold text-red-600">
            {users.filter(u => u.isBanned).length}
          </div>
        </div>
      </div>
    </div>
  );
};
