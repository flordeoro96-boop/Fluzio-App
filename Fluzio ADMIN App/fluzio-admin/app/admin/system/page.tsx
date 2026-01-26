'use client';

import { useEffect, useState } from 'react';
import { Admin, AdminRole } from '@/lib/types';
import {
  getAdminsAction,
  createAdminAction,
  updateAdminAction,
  deleteAdminAction,
  resetAdminPasswordAction,
} from './actions';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  UserPlus,
  Shield,
  Edit,
  Trash2,
  Key,
  Search,
  CheckCircle2,
  XCircle,
  Globe,
  MapPin,
} from 'lucide-react';

export default function SystemPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: AdminRole.COUNTRY_ADMIN,
    countryScopes: [] as string[],
    status: 'ACTIVE' as 'ACTIVE' | 'SUSPENDED',
  });
  const [newPassword, setNewPassword] = useState('');
  const [countryScopeInput, setCountryScopeInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAdmins();
  }, []);

  async function loadAdmins() {
    try {
      setLoading(true);
      setError('');
      const data = await getAdminsAction();
      setAdmins(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAdmin() {
    if (!formData.email || !formData.password) {
      alert('Email and password are required');
      return;
    }

    if (formData.countryScopes.length === 0) {
      alert('At least one country scope is required');
      return;
    }

    setSubmitting(true);
    try {
      const result = await createAdminAction(formData);
      
      if (result.success) {
        alert('Admin created successfully');
        setCreateModalOpen(false);
        resetForm();
        loadAdmins();
      } else {
        alert(result.error || 'Failed to create admin');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create admin');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateAdmin() {
    if (!selectedAdmin) return;

    if (formData.countryScopes.length === 0) {
      alert('At least one country scope is required');
      return;
    }

    setSubmitting(true);
    try {
      const result = await updateAdminAction(selectedAdmin.uid, {
        role: formData.role,
        countryScopes: formData.countryScopes,
        status: formData.status,
      });
      
      if (result.success) {
        alert('Admin updated successfully');
        setEditModalOpen(false);
        setSelectedAdmin(null);
        loadAdmins();
      } else {
        alert(result.error || 'Failed to update admin');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update admin');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteAdmin() {
    if (!selectedAdmin) return;

    setSubmitting(true);
    try {
      const result = await deleteAdminAction(selectedAdmin.uid);
      
      if (result.success) {
        alert('Admin deleted successfully');
        setDeleteModalOpen(false);
        setSelectedAdmin(null);
        loadAdmins();
      } else {
        alert(result.error || 'Failed to delete admin');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete admin');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword() {
    if (!selectedAdmin || !newPassword) return;

    setSubmitting(true);
    try {
      const result = await resetAdminPasswordAction(selectedAdmin.uid, newPassword);
      
      if (result.success) {
        alert('Password reset successfully');
        setResetPasswordModalOpen(false);
        setSelectedAdmin(null);
        setNewPassword('');
      } else {
        alert(result.error || 'Failed to reset password');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  }

  function openEditModal(admin: Admin) {
    setSelectedAdmin(admin);
    setFormData({
      email: admin.email,
      password: '',
      role: admin.role,
      countryScopes: admin.countryScopes,
      status: admin.status,
    });
    setEditModalOpen(true);
  }

  function openDeleteModal(admin: Admin) {
    setSelectedAdmin(admin);
    setDeleteModalOpen(true);
  }

  function openResetPasswordModal(admin: Admin) {
    setSelectedAdmin(admin);
    setNewPassword('');
    setResetPasswordModalOpen(true);
  }

  function resetForm() {
    setFormData({
      email: '',
      password: '',
      role: AdminRole.COUNTRY_ADMIN,
      countryScopes: [],
      status: 'ACTIVE',
    });
    setCountryScopeInput('');
  }

  function addCountryScope() {
    const scope = countryScopeInput.trim().toUpperCase();
    if (scope && !formData.countryScopes.includes(scope)) {
      setFormData({
        ...formData,
        countryScopes: [...formData.countryScopes, scope],
      });
      setCountryScopeInput('');
    }
  }

  function removeCountryScope(scope: string) {
    setFormData({
      ...formData,
      countryScopes: formData.countryScopes.filter(s => s !== scope),
    });
  }

  const getRoleBadge = (role: AdminRole) => {
    const colors: Record<AdminRole, string> = {
      SUPER_ADMIN: 'bg-red-100 text-red-800',
      COUNTRY_ADMIN: 'bg-orange-100 text-orange-800',
      FINANCE: 'bg-green-100 text-green-800',
      MODERATOR: 'bg-blue-100 text-blue-800',
      OPS_SUPPORT: 'bg-purple-100 text-purple-800',
      ANALYST_READONLY: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={colors[role]}>
        <Shield className="w-3 h-3 mr-1" />
        {role.replace('_', ' ')}
      </Badge>
    );
  };

  const filteredAdmins = admins.filter(admin =>
    admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">Loading admins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Management</h1>
          <p className="text-gray-600 mt-2">Manage administrator accounts and permissions</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setCreateModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Create Admin
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6 bg-white p-4 rounded-lg border">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by email or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Showing {filteredAdmins.length} of {admins.length} admins
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Admins Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Country Scopes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No admins found
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => (
                  <tr key={admin.uid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {admin.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {admin.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            UID: {admin.uid.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(admin.role)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {admin.countryScopes.includes('GLOBAL') ? (
                          <Badge className="bg-purple-100 text-purple-800">
                            <Globe className="w-3 h-3 mr-1" />
                            GLOBAL
                          </Badge>
                        ) : (
                          admin.countryScopes.map(scope => (
                            <Badge key={scope} variant="outline" className="text-xs">
                              <MapPin className="w-3 h-3 mr-1" />
                              {scope}
                            </Badge>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {admin.status === 'ACTIVE' ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3 mr-1" />
                          Suspended
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {admin.createdAt
                        ? new Date((admin.createdAt as any).toDate?.() || admin.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(admin)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openResetPasswordModal(admin)}
                        >
                          <Key className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDeleteModal(admin)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Admin Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Admin</DialogTitle>
            <DialogDescription>
              Add a new administrator with specific role and country access
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Temporary Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Min 8 characters"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as AdminRole })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="COUNTRY_ADMIN">Country Admin</SelectItem>
                  <SelectItem value="FINANCE">Finance</SelectItem>
                  <SelectItem value="MODERATOR">Moderator</SelectItem>
                  <SelectItem value="OPS_SUPPORT">Ops Support</SelectItem>
                  <SelectItem value="ANALYST_READONLY">Analyst (Read Only)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="countryScope">Country Scopes</Label>
              <div className="flex gap-2">
                <Input
                  id="countryScope"
                  value={countryScopeInput}
                  onChange={(e) => setCountryScopeInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCountryScope()}
                  placeholder="DE, US, GLOBAL"
                />
                <Button type="button" onClick={addCountryScope}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.countryScopes.map(scope => (
                  <Badge key={scope} variant="secondary" className="cursor-pointer" onClick={() => removeCountryScope(scope)}>
                    {scope} ×
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Use "GLOBAL" for access to all countries, or specific codes like "DE", "US"
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAdmin} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Admin Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Admin</DialogTitle>
            <DialogDescription>
              Update administrator role, country scopes, or status
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input value={formData.email} disabled />
            </div>
            <div>
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as AdminRole })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="COUNTRY_ADMIN">Country Admin</SelectItem>
                  <SelectItem value="FINANCE">Finance</SelectItem>
                  <SelectItem value="MODERATOR">Moderator</SelectItem>
                  <SelectItem value="OPS_SUPPORT">Ops Support</SelectItem>
                  <SelectItem value="ANALYST_READONLY">Analyst (Read Only)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-countryScope">Country Scopes</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-countryScope"
                  value={countryScopeInput}
                  onChange={(e) => setCountryScopeInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCountryScope()}
                  placeholder="DE, US, GLOBAL"
                />
                <Button type="button" onClick={addCountryScope}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.countryScopes.map(scope => (
                  <Badge key={scope} variant="secondary" className="cursor-pointer" onClick={() => removeCountryScope(scope)}>
                    {scope} ×
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as 'ACTIVE' | 'SUSPENDED' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAdmin} disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Admin Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Admin</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedAdmin?.email}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAdmin}
              disabled={submitting}
            >
              {submitting ? 'Deleting...' : 'Delete Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog open={resetPasswordModalOpen} onOpenChange={setResetPasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedAdmin?.email}
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 8 characters"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword} disabled={submitting || !newPassword}>
              {submitting ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
