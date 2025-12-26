'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Search,
  Users,
  FileText,
  Settings,
  ShieldCheck,
  ShieldOff,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Admin, AdminStatus, Policy } from '@/lib/types';
import {
  getAdminsAction,
  updateAdminStatusAction,
  getAuditLogsAction,
  getPolicyAction,
  updatePolicyAction,
} from './actions';

export default function GovernancePage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showPolicyDialog, setShowPolicyDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<AdminStatus>('ACTIVE');
  const [processing, setProcessing] = useState(false);

  // Policy form state
  const [eventApprovalLimit, setEventApprovalLimit] = useState(20000);
  const [payoutReleaseTrustMin, setPayoutReleaseTrustMin] = useState(70);
  const [highRiskScore, setHighRiskScore] = useState(80);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load admins
      const adminFilters: any = {};
      if (statusFilter !== 'ALL') adminFilters.status = statusFilter;
      if (searchQuery) adminFilters.search = searchQuery;
      const adminsResult = await getAdminsAction(adminFilters);
      setAdmins(adminsResult.admins);

      // Load audit logs
      const logsResult = await getAuditLogsAction({ limit: 100 });
      setAuditLogs(logsResult.logs);

      // Load policy
      const policyResult = await getPolicyAction();
      if (policyResult.policy) {
        setPolicy(policyResult.policy);
        setEventApprovalLimit(policyResult.policy.thresholds.eventApprovalLimit);
        setPayoutReleaseTrustMin(policyResult.policy.thresholds.payoutReleaseTrustMin);
        setHighRiskScore(policyResult.policy.thresholds.highRiskScore);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load governance data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadData();
  };

  const handleUpdateAdminStatus = async () => {
    if (!selectedAdmin) return;

    try {
      setProcessing(true);
      setError(null);
      await updateAdminStatusAction(selectedAdmin.uid, newStatus);
      setShowStatusDialog(false);
      setSelectedAdmin(null);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update admin status');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdatePolicy = async () => {
    try {
      setProcessing(true);
      setError(null);
      await updatePolicyAction({
        eventApprovalLimit,
        payoutReleaseTrustMin,
        highRiskScore,
      });
      setShowPolicyDialog(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update policy');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: AdminStatus) => {
    const configs = {
      ACTIVE: { color: 'bg-green-100 text-green-800', icon: ShieldCheck },
      SUSPENDED: { color: 'bg-red-100 text-red-800', icon: ShieldOff },
    };
    const config = configs[status] || configs.ACTIVE;
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Governance</h1>
          <p className="text-gray-600 mt-2">Manage admin accounts, policies, and audit logs</p>
        </div>
        <Button onClick={() => setShowPolicyDialog(true)}>
          <Settings className="w-4 h-4 mr-2" />
          Update Policy
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Total Admins</div>
                <div className="text-2xl font-bold">{admins.length}</div>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Active Admins</div>
                <div className="text-2xl font-bold text-green-600">
                  {admins.filter((a) => a.status === 'ACTIVE').length}
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <ShieldCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Policy Version</div>
                <div className="text-2xl font-bold">{policy?.version || 0}</div>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="admins" className="space-y-6">
        <TabsList>
          <TabsTrigger value="admins">Admins</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="policy">Policy</TabsTrigger>
        </TabsList>

        {/* Admins Tab */}
        <TabsContent value="admins" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex gap-2">
                  <Input
                    placeholder="Search admins..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} variant="secondary">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Admins List */}
          {loading ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">Loading admins...</div>
              </CardContent>
            </Card>
          ) : admins.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No admins found</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {admins.map((admin) => (
                <Card key={admin.uid} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusBadge(admin.status)}
                          <Badge>{admin.role}</Badge>
                          <span className="font-medium">{admin.email}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Country Scopes: {admin.countryScopes.join(', ')}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAdmin(admin);
                          setNewStatus(admin.status);
                          setShowStatusDialog(true);
                        }}
                      >
                        Update Status
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">Loading audit logs...</div>
              </CardContent>
            </Card>
          ) : auditLogs.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No audit logs found</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <Card key={log.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{log.action}</Badge>
                          <Badge variant="outline">{log.resource}</Badge>
                          <span className="text-xs text-gray-600">{log.resourceId}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Admin: {log.adminId}
                        </div>
                        {log.details && (
                          <div className="text-xs text-gray-500 mt-1">
                            {JSON.stringify(log.details)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>
                          {log.timestamp
                            ? new Date(
                                typeof log.timestamp === 'object' && 'toMillis' in log.timestamp
                                  ? log.timestamp.toMillis()
                                  : log.timestamp
                              ).toLocaleString()
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Policy Tab */}
        <TabsContent value="policy">
          <Card>
            <CardHeader>
              <CardTitle>Platform Policy (v{policy?.version || 0})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {policy ? (
                <>
                  <div>
                    <label className="text-sm font-medium">Event Approval Limit</label>
                    <div className="text-2xl font-bold">${policy.thresholds.eventApprovalLimit.toLocaleString()}</div>
                    <p className="text-sm text-gray-600">Maximum budget for auto-approval</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Payout Release Trust Minimum</label>
                    <div className="text-2xl font-bold">{policy.thresholds.payoutReleaseTrustMin}%</div>
                    <p className="text-sm text-gray-600">Minimum trust score for instant payouts</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">High Risk Score Threshold</label>
                    <div className="text-2xl font-bold">{policy.thresholds.highRiskScore}</div>
                    <p className="text-sm text-gray-600">Score above which entity is flagged</p>
                  </div>
                  <div className="text-sm text-gray-600">
                    Last updated: {policy.updatedAt ? new Date(
                      typeof policy.updatedAt === 'object' && 'toMillis' in policy.updatedAt
                        ? policy.updatedAt.toMillis()
                        : policy.updatedAt
                    ).toLocaleString() : 'N/A'}
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-500 py-8">No policy configured</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Admin Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Admin Status</DialogTitle>
            <DialogDescription>
              Change status for: {selectedAdmin?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newStatus} onValueChange={(val) => setNewStatus(val as AdminStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAdminStatus} disabled={processing}>
              {processing ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Policy Update Dialog */}
      <Dialog open={showPolicyDialog} onOpenChange={setShowPolicyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Platform Policy</DialogTitle>
            <DialogDescription>
              Create a new policy version with updated thresholds
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium block mb-2">Event Approval Limit ($)</label>
              <Input
                type="number"
                value={eventApprovalLimit}
                onChange={(e) => setEventApprovalLimit(parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Payout Release Trust Min (%)</label>
              <Input
                type="number"
                value={payoutReleaseTrustMin}
                onChange={(e) => setPayoutReleaseTrustMin(parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">High Risk Score</label>
              <Input
                type="number"
                value={highRiskScore}
                onChange={(e) => setHighRiskScore(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPolicyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePolicy} disabled={processing}>
              {processing ? 'Updating...' : 'Create New Version'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
