'use client';

import { useEffect, useState } from 'react';
import { getUsersAction } from './actions';
import { bulkSuspendUsersAction, bulkActivateUsersAction, bulkDeleteUsersAction } from './bulk-actions';
import { User, UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Users as UsersIcon, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Ban,
  ShieldCheck,
  User as UserIcon,
  Star,
  Download,
  Trash2,
  UserX,
  UserCheck,
  Filter,
  X,
  Calendar,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { exportToCSV } from '@/lib/utils/csvExport';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [kycFilter, setKycFilter] = useState<string>('ALL');
  const [joinDateFrom, setJoinDateFrom] = useState('');
  const [joinDateTo, setJoinDateTo] = useState('');
  const [minPoints, setMinPoints] = useState('');
  const [maxPoints, setMaxPoints] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Bulk selection
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter, kycFilter]);

  async function loadUsers() {
    try {
      setLoading(true);
      setError('');
      
      const filters: any = {};
      
      if (roleFilter !== 'ALL') {
        filters.role = roleFilter;
      }
      // Don't force CUSTOMER filter - let it show all for now
      
      if (statusFilter !== 'ALL') filters.status = statusFilter;
      if (kycFilter !== 'ALL') filters.kycVerified = kycFilter === 'VERIFIED';
      if (searchQuery) filters.searchQuery = searchQuery;
      
      console.log('🔍 Loading users with filters:', filters);
      const data = await getUsersAction(filters);
      console.log('📦 Total users received from database:', data.length);
      console.log('👥 User roles breakdown:', {
        total: data.length,
        customers: data.filter(u => u.role === UserRole.CUSTOMER).length,
        members: data.filter(u => u.role === UserRole.MEMBER).length,
        creators: data.filter(u => u.role === UserRole.CREATOR).length,
        businesses: data.filter(u => u.role === UserRole.BUSINESS).length,
        admins: data.filter(u => (u as any).role === 'SUPER_ADMIN' || (u as any).role === 'ADMIN').length,
      });
      console.log('🔍 Unknown users (not CUSTOMER/MEMBER/CREATOR/BUSINESS):', 
        data.filter(u => 
          u.role !== UserRole.CUSTOMER && 
          u.role !== UserRole.MEMBER &&
          u.role !== UserRole.CREATOR && 
          u.role !== UserRole.BUSINESS &&
          (u as any).role !== 'SUPER_ADMIN' &&
          (u as any).role !== 'ADMIN'
        ).map(u => ({ id: u.id, email: u.email, role: u.role, accountType: (u as any).accountType }))
      );
      
      // Filter: Show CUSTOMER and MEMBER (legacy), exclude CREATOR, BUSINESS, and admin roles
      let customersOnly = data.filter(u => {
        const role = (u as any).role;
        return (u.role === UserRole.CUSTOMER || u.role === UserRole.MEMBER) && 
               role !== 'SUPER_ADMIN' && 
               role !== 'ADMIN';
      });
      
      // Apply client-side date and points filters
      if (joinDateFrom) {
        const fromDate = new Date(joinDateFrom);
        customersOnly = customersOnly.filter(u => u.createdAt && new Date(u.createdAt) >= fromDate);
      }
      if (joinDateTo) {
        const toDate = new Date(joinDateTo);
        toDate.setHours(23, 59, 59, 999);
        customersOnly = customersOnly.filter(u => u.createdAt && new Date(u.createdAt) <= toDate);
      }
      if (minPoints) {
        const min = parseInt(minPoints);
        customersOnly = customersOnly.filter(u => (u.totalPoints || 0) >= min);
      }
      if (maxPoints) {
        const max = parseInt(maxPoints);
        customersOnly = customersOnly.filter(u => (u.totalPoints || 0) <= max);
      }
      
      console.log('✅ After filtering - showing customers only:', customersOnly.length);
      setUsers(customersOnly);
    } catch (err: any) {
      console.error('❌ Error loading users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    loadUsers();
  }
  
  function clearAllFilters() {
    setSearchQuery('');
    setStatusFilter('ALL');
    setKycFilter('ALL');
    setJoinDateFrom('');
    setJoinDateTo('');
    setMinPoints('');
    setMaxPoints('');
    loadUsers();
  }
  
  function applyQuickFilter(filter: 'active' | 'suspended' | 'kyc' | 'high-points' | 'new') {
    clearAllFilters();
    switch (filter) {
      case 'active':
        setStatusFilter('ACTIVE');
        break;
      case 'suspended':
        setStatusFilter('SUSPENDED');
        break;
      case 'kyc':
        setKycFilter('VERIFIED');
        break;
      case 'high-points':
        setMinPoints('1000');
        break;
      case 'new':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        setJoinDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
        break;
    }
  }

  function handleExportCSV() {
    const exportData = users.map(user => ({
      id: user.id,
      displayName: user.displayName || '',
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified ? 'Yes' : 'No',
      phoneVerified: user.phoneVerified ? 'Yes' : 'No',
      kycVerified: user.kycVerified ? 'Yes' : 'No',
      totalPoints: user.totalPoints || 0,
      currentStreak: user.currentStreak || 0,
      missionsCompleted: user.stats?.missionsCompleted || 0,
      eventsAttended: user.stats?.eventsAttended || 0,
      rewardsRedeemed: user.stats?.rewardsRedeemed || 0,
      countryCode: user.countryCode || '',
      createdAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '',
      lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : '',
    }));

    exportToCSV(exportData, 'fluzio_users', [
      { key: 'id', label: 'User ID' },
      { key: 'displayName', label: 'Display Name' },
      { key: 'email', label: 'Email' },
      { key: 'phoneNumber', label: 'Phone' },
      { key: 'role', label: 'Role' },
      { key: 'status', label: 'Status' },
      { key: 'emailVerified', label: 'Email Verified' },
      { key: 'phoneVerified', label: 'Phone Verified' },
      { key: 'kycVerified', label: 'KYC Verified' },
      { key: 'totalPoints', label: 'Total Points' },
      { key: 'currentStreak', label: 'Current Streak' },
      { key: 'missionsCompleted', label: 'Missions Completed' },
      { key: 'eventsAttended', label: 'Events Attended' },
      { key: 'rewardsRedeemed', label: 'Rewards Redeemed' },
      { key: 'countryCode', label: 'Country' },
      { key: 'createdAt', label: 'Joined Date' },
      { key: 'lastLoginAt', label: 'Last Login' },
    ]);
  }

  // Bulk selection handlers
  function toggleSelectAll() {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  }

  function toggleSelectUser(userId: string) {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  }

  async function handleBulkSuspend() {
    if (selectedUsers.size === 0) return;
    
    if (!confirm(`Suspend ${selectedUsers.size} selected users?`)) return;
    
    setBulkActionLoading(true);
    try {
      const userIds = Array.from(selectedUsers);
      const result = await bulkSuspendUsersAction(userIds);
      
      if (result.success) {
        alert(`Successfully suspended ${result.successCount} users.${result.failedCount > 0 ? ` Failed: ${result.failedCount}` : ''}`);
        setSelectedUsers(new Set());
        loadUsers(); // Reload to show updated status
      } else {
        alert('Failed to suspend users: ' + result.errors.join(', '));
      }
    } catch (err: any) {
      console.error('Bulk suspend error:', err);
      alert('Failed to suspend users: ' + err.message);
    } finally {
      setBulkActionLoading(false);
    }
  }

  async function handleBulkActivate() {
    if (selectedUsers.size === 0) return;
    
    if (!confirm(`Activate ${selectedUsers.size} selected users?`)) return;
    
    setBulkActionLoading(true);
    try {
      const userIds = Array.from(selectedUsers);
      const result = await bulkActivateUsersAction(userIds);
      
      if (result.success) {
        alert(`Successfully activated ${result.successCount} users.${result.failedCount > 0 ? ` Failed: ${result.failedCount}` : ''}`);
        setSelectedUsers(new Set());
        loadUsers(); // Reload to show updated status
      } else {
        alert('Failed to activate users: ' + result.errors.join(', '));
      }
    } catch (err: any) {
      console.error('Bulk activate error:', err);
      alert('Failed to activate users: ' + err.message);
    } finally {
      setBulkActionLoading(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedUsers.size === 0) return;
    
    if (!confirm(`⚠️ DELETE ${selectedUsers.size} selected users? This action cannot be undone!`)) return;
    
    setBulkActionLoading(true);
    try {
      const userIds = Array.from(selectedUsers);
      const result = await bulkDeleteUsersAction(userIds);
      
      if (result.success) {
        alert(`Successfully deleted ${result.successCount} users.${result.failedCount > 0 ? ` Failed: ${result.failedCount}` : ''}`);
        setSelectedUsers(new Set());
        loadUsers(); // Reload to show updated list
      } else {
        alert('Failed to delete users: ' + result.errors.join(', '));
      }
    } catch (err: any) {
      console.error('Bulk delete error:', err);
      alert('Failed to delete users: ' + err.message);
    } finally {
      setBulkActionLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case 'SUSPENDED':
        return (
          <Badge className="bg-orange-100 text-orange-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Suspended
          </Badge>
        );
      case 'BANNED':
        return (
          <Badge className="bg-red-100 text-red-800">
            <Ban className="w-3 h-3 mr-1" />
            Banned
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getRoleBadge = (role: UserRole) => {
    if (role === UserRole.CREATOR) {
      return (
        <Badge className="bg-purple-100 text-purple-800">
          <Star className="w-3 h-3 mr-1" />
          Creator
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-100 text-blue-800">
        <UserIcon className="w-3 h-3 mr-1" />
        Customer
      </Badge>
    );
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <UsersIcon className="w-8 h-8 text-blue-600 mx-auto mb-2 animate-pulse" />
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-2">Regular customer accounts (Creators and Businesses are in separate tabs)</p>
        </div>
        <Button
          onClick={handleExportCSV}
          disabled={users.length === 0}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV ({users.length})
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg border space-y-4">
        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyQuickFilter('active')}
            className="text-xs"
          >
            Active Users
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyQuickFilter('suspended')}
            className="text-xs"
          >
            Suspended
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyQuickFilter('kyc')}
            className="text-xs"
          >
            KYC Verified
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyQuickFilter('high-points')}
            className="text-xs"
          >
            High Points (1000+)
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyQuickFilter('new')}
            className="text-xs"
          >
            New (Last 30 Days)
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowFilters(!showFilters)}
            className="text-xs ml-auto"
          >
            <Filter className="w-3 h-3 mr-1" />
            {showFilters ? 'Hide' : 'Show'} Advanced Filters
          </Button>
          {(statusFilter !== 'ALL' || kycFilter !== 'ALL' || joinDateFrom || joinDateTo || minPoints || maxPoints) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={clearAllFilters}
              className="text-xs text-red-600 hover:text-red-700"
            >
              <X className="w-3 h-3 mr-1" />
              Clear All
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          style={{ display: showFilters ? 'grid' : 'none' }}
        >
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="flex gap-2">
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} size="icon">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Role Filter - Hidden since we only show customers */}
          {/* 
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value={UserRole.CUSTOMER}>Customers</SelectItem>
              <SelectItem value={UserRole.CREATOR}>Creators</SelectItem>
            </SelectContent>
          </Select>
          */}

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
              <SelectItem value="BANNED">Banned</SelectItem>
            </SelectContent>
          </Select>

          {/* KYC Filter */}
          <Select value={kycFilter} onValueChange={setKycFilter}>
            <SelectTrigger>
              <SelectValue placeholder="KYC" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All KYC</SelectItem>
              <SelectItem value="VERIFIED">Verified</SelectItem>
              <SelectItem value="UNVERIFIED">Not Verified</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
            {/* Join Date From */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <Calendar className="w-3 h-3 inline mr-1" />
                Join Date From
              </label>
              <Input
                type="date"
                value={joinDateFrom}
                onChange={(e) => setJoinDateFrom(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Join Date To */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <Calendar className="w-3 h-3 inline mr-1" />
                Join Date To
              </label>
              <Input
                type="date"
                value={joinDateTo}
                onChange={(e) => setJoinDateTo(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Min Points */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Min Points
              </label>
              <Input
                type="number"
                placeholder="0"
                value={minPoints}
                onChange={(e) => setMinPoints(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Max Points */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Max Points
              </label>
              <Input
                type="number"
                placeholder="No limit"
                value={maxPoints}
                onChange={(e) => setMaxPoints(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
        )}

        {/* Results count */}
        <div className="text-sm text-gray-600">
          Showing {users.length} user{users.length !== 1 ? 's' : ''}
          {selectedUsers.size > 0 && (
            <span className="ml-2 text-blue-600 font-medium">
              ({selectedUsers.size} selected)
            </span>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedUsers.size > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-blue-900">
              {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedUsers(new Set())}
            >
              Clear Selection
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleBulkActivate}
              disabled={bulkActionLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <UserCheck className="w-4 h-4 mr-1" />
              Activate
            </Button>
            <Button
              size="sm"
              onClick={handleBulkSuspend}
              disabled={bulkActionLoading}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <UserX className="w-4 h-4 mr-1" />
              Suspend
            </Button>
            <Button
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkActionLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Checkbox
                    checked={selectedUsers.size === users.length && users.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Country
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verification
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Checkbox
                        checked={selectedUsers.has(user.id)}
                        onCheckedChange={() => toggleSelectUser(user.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.displayName || user.email?.split('@')[0] || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.countryCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {user.totalPoints?.toLocaleString() || '0'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Lifetime: {user.lifetimePoints?.toLocaleString() || '0'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {user.emailVerified && (
                          <span className="text-xs text-green-600 flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Email
                          </span>
                        )}
                        {user.phoneVerified && (
                          <span className="text-xs text-green-600 flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Phone
                          </span>
                        )}
                        {user.kycVerified && (
                          <span className="text-xs text-green-600 flex items-center">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            KYC
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/users/${user.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">This page is under construction</p>
      </div>
    </div>
  );
}
