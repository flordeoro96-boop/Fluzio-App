import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Ban, Trash2, Edit, Eye, 
  CheckCircle, XCircle, Crown, MapPin, Calendar, Mail,
  Phone, Shield, Award, TrendingUp
} from 'lucide-react';
import { collection, getDocs, updateDoc, doc, deleteDoc, query, orderBy, limit } from '../../services/firestoreCompat';
import { db } from '../../services/apiService';
import { AdminPermissions, filterByScope, canPerformAction } from '../../services/adminAuthService';

interface User {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'BUSINESS' | 'ADMIN';
  avatarUrl?: string;
  photoUrl?: string;
  city?: string;
  country?: string;
  phone?: string;
  points?: number;
  level?: number;
  businessLevel?: number;
  createdAt?: any;
  emailVerified?: boolean;
  banned?: boolean;
  subscriptionLevel?: string;
}

interface AdminUserManagementProps {
  adminId: string;
  adminPerms: AdminPermissions;
}

export const AdminUserManagement: React.FC<AdminUserManagementProps> = ({ adminId, adminPerms }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'CUSTOMER' | 'BUSINESS' | 'ADMIN'>('ALL');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, roleFilter, users]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const usersCol = collection(db, 'users');
      const q = query(usersCol, orderBy('createdAt', 'desc'), limit(500));
      const snapshot = await getDocs(q);
      
      const userData = snapshot.docs.map(doc => ({
        id: doc.id,
        uid: doc.id,
        ...doc.data()
      } as User));
      
      // Apply geographic scope filtering
      const scopedUsers = filterByScope(
        userData,
        adminPerms,
        (user) => user.country,
        (user) => user.city
      );
      
      setUsers(scopedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Role filter
    if (roleFilter !== 'ALL') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(u => 
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.city?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const handleBanUser = async (userId: string, currentBanStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentBanStatus ? 'unban' : 'ban'} this user?`)) {
      return;
    }

    setActionLoading(userId);
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        banned: !currentBanStatus,
        bannedAt: !currentBanStatus ? new Date() : null,
        bannedBy: !currentBanStatus ? adminId : null
      });
      
      await loadUsers();
      alert(`User ${currentBanStatus ? 'unbanned' : 'banned'} successfully`);
    } catch (error) {
      console.error('Error banning user:', error);
      alert('Failed to update user status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to DELETE ${userName}? This action cannot be undone.`)) {
      return;
    }

    const confirmText = prompt('Type DELETE to confirm:');
    if (confirmText !== 'DELETE') {
      alert('Deletion cancelled');
      return;
    }

    setActionLoading(userId);
    try {
      await deleteDoc(doc(db, 'users', userId));
      await loadUsers();
      alert('User deleted successfully');
      setSelectedUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAdjustPoints = async (userId: string, currentPoints: number) => {
    const newPoints = prompt(`Current points: ${currentPoints}\nEnter new points value:`);
    if (!newPoints) return;

    const pointsNum = parseInt(newPoints);
    if (isNaN(pointsNum) || pointsNum < 0) {
      alert('Invalid points value');
      return;
    }

    setActionLoading(userId);
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        points: pointsNum
      });
      
      await loadUsers();
      alert('Points updated successfully');
    } catch (error) {
      console.error('Error updating points:', error);
      alert('Failed to update points');
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'BUSINESS':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'CUSTOMER':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
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
    <div>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Total Users</div>
          <div className="text-2xl font-bold text-[#1E0E62]">{users.length}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Customers</div>
          <div className="text-2xl font-bold text-green-600">
            {users.filter(u => u.role === 'CUSTOMER').length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Businesses</div>
          <div className="text-2xl font-bold text-blue-600">
            {users.filter(u => u.role === 'BUSINESS').length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Banned</div>
          <div className="text-2xl font-bold text-red-600">
            {users.filter(u => u.banned).length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or city..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent bg-white"
          >
            <option value="ALL">All Roles</option>
            <option value="CUSTOMER">Customers</option>
            <option value="BUSINESS">Businesses</option>
            <option value="ADMIN">Admins</option>
          </select>
        </div>
      </div>

      {/* User List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Points/Level</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No users found</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.avatarUrl || user.photoUrl ? (
                          <img
                            src={user.avatarUrl || user.photoUrl}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00E5FF] to-[#6C4BFF] flex items-center justify-center text-white font-bold">
                            {user.name?.charAt(0) || '?'}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-[#1E0E62]">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.city && (
                            <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" />
                              {user.city}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {user.points !== undefined && (
                          <span className="text-sm font-medium text-gray-700">
                            {user.points.toLocaleString()} pts
                          </span>
                        )}
                        {user.role === 'BUSINESS' && user.businessLevel && (
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-bold">
                            L{user.businessLevel}
                          </span>
                        )}
                        {user.level && user.role === 'CUSTOMER' && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-bold">
                            L{user.level}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {user.emailVerified ? (
                          <span className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <XCircle className="w-3 h-3" />
                            Not verified
                          </span>
                        )}
                        {user.banned && (
                          <span className="text-xs text-red-600 font-bold">BANNED</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleBanUser(user.id, user.banned || false)}
                          disabled={actionLoading === user.id}
                          className="p-2 hover:bg-orange-50 rounded-lg transition-colors"
                          title={user.banned ? 'Unban user' : 'Ban user'}
                        >
                          <Ban className={`w-4 h-4 ${user.banned ? 'text-orange-600' : 'text-gray-600'}`} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          disabled={actionLoading === user.id}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-[#1E0E62]">User Details</h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile */}
              <div className="flex items-center gap-4">
                {selectedUser.avatarUrl || selectedUser.photoUrl ? (
                  <img
                    src={selectedUser.avatarUrl || selectedUser.photoUrl}
                    alt={selectedUser.name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00E5FF] to-[#6C4BFF] flex items-center justify-center text-white text-2xl font-bold">
                    {selectedUser.name?.charAt(0) || '?'}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-[#1E0E62]">{selectedUser.name}</h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border mt-1 ${getRoleBadgeColor(selectedUser.role)}`}>
                    {selectedUser.role}
                  </span>
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <h4 className="font-bold text-[#1E0E62] mb-3">Contact Information</h4>
                <div className="space-y-2">
                  {selectedUser.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      {selectedUser.email}
                      {selectedUser.emailVerified && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  )}
                  {selectedUser.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      {selectedUser.phone}
                    </div>
                  )}
                  {selectedUser.city && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {selectedUser.city}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div>
                <h4 className="font-bold text-[#1E0E62] mb-3">Account Stats</h4>
                <div className="grid grid-cols-2 gap-4">
                  {selectedUser.points !== undefined && (
                    <div className="bg-purple-50 rounded-xl p-4">
                      <div className="text-sm text-gray-600 mb-1">Points</div>
                      <div className="text-2xl font-bold text-[#1E0E62]">
                        {selectedUser.points.toLocaleString()}
                      </div>
                    </div>
                  )}
                  {selectedUser.role === 'BUSINESS' && selectedUser.businessLevel && (
                    <div className="bg-blue-50 rounded-xl p-4">
                      <div className="text-sm text-gray-600 mb-1">Business Level</div>
                      <div className="text-2xl font-bold text-[#1E0E62]">
                        {selectedUser.businessLevel}
                      </div>
                    </div>
                  )}
                  {selectedUser.subscriptionLevel && (
                    <div className="bg-yellow-50 rounded-xl p-4">
                      <div className="text-sm text-gray-600 mb-1">Subscription</div>
                      <div className="text-xl font-bold text-[#1E0E62]">
                        {selectedUser.subscriptionLevel}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => handleAdjustPoints(selectedUser.id, selectedUser.points || 0)}
                  disabled={actionLoading === selectedUser.id}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Award className="w-5 h-5" />
                  Adjust Points
                </button>
                <button
                  onClick={() => handleBanUser(selectedUser.id, selectedUser.banned || false)}
                  disabled={actionLoading === selectedUser.id}
                  className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    selectedUser.banned
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-orange-500 text-white hover:bg-orange-600'
                  }`}
                >
                  <Ban className="w-5 h-5" />
                  {selectedUser.banned ? 'Unban' : 'Ban'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
