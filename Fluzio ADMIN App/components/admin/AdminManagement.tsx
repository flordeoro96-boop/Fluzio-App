import React, { useState, useEffect } from 'react';
import { 
  Shield, Plus, Edit2, Trash2, Eye, Search, 
  UserCheck, Globe, MapPin, Calendar, AlertCircle,
  CheckCircle, XCircle, Save, X, Activity
} from 'lucide-react';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, orderBy, addDoc } from 'firebase/firestore';
import { db } from '../../services/AuthContext';
import { AdminRole, AdminUser } from '../../types';
import { AdminPermissions, getRoleName, getRoleColor, getScopeDescription } from '../../services/adminAuthService';

interface AdminLog {
  id: string;
  adminUserId: string;
  adminEmail: string;
  adminRole: AdminRole;
  action: string;
  targetType: string;
  targetId: string;
  targetEmail?: string;
  details: any;
  timestamp: Date;
}

interface AdminManagementProps {
  adminId: string;
  adminPerms: AdminPermissions;
}

export const AdminManagement: React.FC<AdminManagementProps> = ({ adminId, adminPerms }) => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [viewingLogs, setViewingLogs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    userId: '',
    email: '',
    role: 'SUPPORT_ADMIN' as AdminRole,
    countryId: '',
    cityId: '',
    assignedEventIds: [] as string[],
    notes: ''
  });

  // Only Super Admins can manage other admins
  if (adminPerms.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[#1E0E62] mb-2">Super Admin Only</h3>
          <p className="text-[#8F8FA3]">Only Super Admins can manage admin users</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadAdmins();
    if (viewingLogs) loadLogs();
  }, [viewingLogs]);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const adminsCol = collection(db, 'adminUsers');
      const q = query(adminsCol, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const adminData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AdminUser));
      
      setAdmins(adminData);
    } catch (error) {
      console.error('Error loading admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const logsCol = collection(db, 'adminLogs');
      const q = query(logsCol, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      
      const logData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp)
        } as AdminLog;
      });
      
      setLogs(logData.slice(0, 100)); // Last 100 logs
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const handleCreateAdmin = async () => {
    if (!formData.userId || !formData.email || !formData.role) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const newAdmin = {
        userId: formData.userId,
        email: formData.email,
        role: formData.role,
        countryId: formData.countryId || undefined,
        cityId: formData.cityId || undefined,
        assignedEventIds: formData.assignedEventIds.length > 0 ? formData.assignedEventIds : undefined,
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: adminId,
        notes: formData.notes
      };

      await setDoc(doc(db, 'adminUsers', formData.userId), newAdmin);
      
      alert('✅ Admin user created successfully!');
      setShowCreateModal(false);
      resetForm();
      loadAdmins();
    } catch (error) {
      console.error('Error creating admin:', error);
      alert('❌ Failed to create admin: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAdmin = async () => {
    if (!editingAdmin) return;

    setSaving(true);
    try {
      const updates = {
        role: formData.role,
        countryId: formData.countryId || undefined,
        cityId: formData.cityId || undefined,
        assignedEventIds: formData.assignedEventIds.length > 0 ? formData.assignedEventIds : undefined,
        notes: formData.notes
      };

      await updateDoc(doc(db, 'adminUsers', editingAdmin.userId), updates);
      
      alert('✅ Admin updated successfully!');
      setEditingAdmin(null);
      resetForm();
      loadAdmins();
    } catch (error) {
      console.error('Error updating admin:', error);
      alert('❌ Failed to update admin');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (admin: AdminUser) => {
    if (!confirm(`${admin.isActive ? 'Deactivate' : 'Activate'} admin ${admin.email}?`)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'adminUsers', admin.userId), {
        isActive: !admin.isActive
      });
      loadAdmins();
    } catch (error) {
      console.error('Error toggling admin:', error);
      alert('Failed to update admin status');
    }
  };

  const handleDeleteAdmin = async (admin: AdminUser) => {
    if (admin.userId === adminId) {
      alert('Cannot delete your own admin account');
      return;
    }

    if (!confirm(`Delete admin ${admin.email}? This cannot be undone.`)) {
      return;
    }

    const confirmText = prompt('Type DELETE to confirm:');
    if (confirmText !== 'DELETE') {
      alert('Deletion cancelled');
      return;
    }

    try {
      await deleteDoc(doc(db, 'adminUsers', admin.userId));
      alert('Admin deleted successfully');
      loadAdmins();
    } catch (error) {
      console.error('Error deleting admin:', error);
      alert('Failed to delete admin');
    }
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      email: '',
      role: AdminRole.SUPER_ADMIN,
      countryId: '',
      cityId: '',
      assignedEventIds: [],
      notes: ''
    });
  };

  const openEditModal = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setFormData({
      userId: admin.userId,
      email: admin.email,
      role: admin.role,
      countryId: admin.countryId || '',
      cityId: admin.cityId || '',
      assignedEventIds: admin.assignedEventIds || [],
      notes: admin.notes || ''
    });
  };

  const filteredAdmins = admins.filter(admin =>
    admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getRoleName(admin.role).toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-pulse" />
          <p className="text-[#8F8FA3]">Loading admin users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1E0E62]">Admin User Management</h2>
          <p className="text-[#8F8FA3] text-sm">Manage admin roles and permissions</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setViewingLogs(!viewingLogs)}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition-colors flex items-center gap-2"
          >
            <Activity className="w-4 h-4" />
            {viewingLogs ? 'Hide Logs' : 'View Activity Logs'}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Admin
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="text-2xl font-bold text-[#1E0E62]">{admins.length}</div>
          <div className="text-sm text-[#8F8FA3]">Total Admins</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">
            {admins.filter(a => a.role === 'SUPER_ADMIN').length}
          </div>
          <div className="text-sm text-[#8F8FA3]">Super Admins</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">
            {admins.filter(a => a.role === 'COUNTRY_ADMIN').length}
          </div>
          <div className="text-sm text-[#8F8FA3]">Country Admins</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {admins.filter(a => a.role === 'CITY_ADMIN').length}
          </div>
          <div className="text-sm text-[#8F8FA3]">City Admins</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="text-2xl font-bold text-orange-600">
            {admins.filter(a => !a.isActive).length}
          </div>
          <div className="text-sm text-[#8F8FA3]">Inactive</div>
        </div>
      </div>

      {/* Activity Logs View */}
      {viewingLogs && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-[#1E0E62] mb-4">Recent Activity</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.map(log => (
              <div key={log.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-1 rounded text-xs font-bold text-white ${getRoleColor(log.adminRole)}`}>
                      {getRoleName(log.adminRole)}
                    </div>
                    <span className="font-semibold text-[#1E0E62]">{log.adminEmail}</span>
                    <span className="text-[#8F8FA3]">performed</span>
                    <span className="font-semibold text-purple-600">{log.action}</span>
                  </div>
                  <span className="text-xs text-[#8F8FA3]">
                    {log.timestamp.toLocaleString()}
                  </span>
                </div>
                {log.targetEmail && (
                  <div className="text-[#8F8FA3] mt-1">
                    Target: {log.targetEmail}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#8F8FA3] w-5 h-5" />
        <input
          type="text"
          placeholder="Search admins by email, ID, or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
        />
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#8F8FA3] uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#8F8FA3] uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#8F8FA3] uppercase">Scope</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#8F8FA3] uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#8F8FA3] uppercase">Created</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[#8F8FA3] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAdmins.map((admin) => (
                <tr key={admin.userId} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-semibold text-[#1E0E62]">{admin.email}</div>
                      <div className="text-sm text-[#8F8FA3]">{admin.userId}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white ${getRoleColor(admin.role)}`}>
                      {getRoleName(admin.role)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-[#8F8FA3]">
                      {admin.countryId && (
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {admin.countryId}
                        </div>
                      )}
                      {admin.cityId && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {admin.cityId}
                        </div>
                      )}
                      {admin.assignedEventIds && admin.assignedEventIds.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {admin.assignedEventIds.length} events
                        </div>
                      )}
                      {!admin.countryId && !admin.cityId && !admin.assignedEventIds && 'Global'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {admin.isActive ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600 text-sm">
                        <XCircle className="w-4 h-4" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#8F8FA3]">
                    {new Date(admin.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(admin)}
                        className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(admin)}
                        className="p-2 hover:bg-yellow-100 rounded-lg transition-colors"
                        title={admin.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {admin.isActive ? (
                          <XCircle className="w-4 h-4 text-yellow-600" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </button>
                      {admin.userId !== adminId && (
                        <button
                          onClick={() => handleDeleteAdmin(admin)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingAdmin) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#1E0E62]">
                {editingAdmin ? 'Edit Admin' : 'Create New Admin'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingAdmin(null);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {!editingAdmin && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-[#1E0E62] mb-2">
                      User ID (Firebase UID) *
                    </label>
                    <input
                      type="text"
                      value={formData.userId}
                      onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                      placeholder="e.g., abc123xyz456..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#1E0E62] mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                      placeholder="admin@example.com"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-semibold text-[#1E0E62] mb-2">
                  Admin Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as AdminRole })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                >
                  <option value="SUPPORT_ADMIN">Support Admin (Limited)</option>
                  <option value="EVENT_ADMIN">Event Admin (Assigned Events)</option>
                  <option value="CITY_ADMIN">City Admin (City Scope)</option>
                  <option value="COUNTRY_ADMIN">Country Admin (Country Scope)</option>
                  <option value="SUPER_ADMIN">Super Admin (Global)</option>
                </select>
              </div>

              {(formData.role === 'COUNTRY_ADMIN' || formData.role === 'CITY_ADMIN') && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-[#1E0E62] mb-2">
                      Country Code (ISO)
                    </label>
                    <input
                      type="text"
                      value={formData.countryId}
                      onChange={(e) => setFormData({ ...formData, countryId: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                      placeholder="e.g., US, GB, DE"
                      maxLength={2}
                    />
                  </div>

                  {formData.role === 'CITY_ADMIN' && (
                    <div>
                      <label className="block text-sm font-semibold text-[#1E0E62] mb-2">
                        City Name
                      </label>
                      <input
                        type="text"
                        value={formData.cityId}
                        onChange={(e) => setFormData({ ...formData, cityId: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                        placeholder="e.g., New York, London, Berlin"
                      />
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-sm font-semibold text-[#1E0E62] mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                  rows={3}
                  placeholder="Optional notes about this admin..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={editingAdmin ? handleUpdateAdmin : handleCreateAdmin}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {editingAdmin ? 'Update Admin' : 'Create Admin'}
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingAdmin(null);
                  resetForm();
                }}
                className="px-4 py-3 bg-gray-100 text-[#1E0E62] rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
