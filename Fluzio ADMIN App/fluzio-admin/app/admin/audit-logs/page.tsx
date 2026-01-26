'use client';

import { useEffect, useState } from 'react';
import { getAuditLogsAction, exportAuditLogsAction, AuditLogEntry } from './actions';
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
  FileText,
  Search,
  Download,
  Calendar,
  User,
  Shield,
  Database,
  AlertCircle,
  CheckCircle,
  XCircle,
  Filter,
} from 'lucide-react';
import { exportToCSV } from '@/lib/utils/csvExport';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [adminFilter, setAdminFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [resourceFilter, setResourceFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadLogs();
  }, [actionFilter, resourceFilter, startDate, endDate]);

  async function loadLogs() {
    try {
      setLoading(true);
      setError('');
      
      const filters: any = {};
      
      if (adminFilter) filters.adminId = adminFilter;
      if (actionFilter !== 'ALL') filters.action = actionFilter;
      if (resourceFilter !== 'ALL') filters.resourceType = resourceFilter;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      
      const data = await getAuditLogsAction(filters);
      setLogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    try {
      const filters: any = {};
      if (adminFilter) filters.adminId = adminFilter;
      if (actionFilter !== 'ALL') filters.action = actionFilter;
      if (resourceFilter !== 'ALL') filters.resourceType = resourceFilter;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const exportData = await exportAuditLogsAction(filters);
      
      const csvData = exportData.map(log => ({
        'Timestamp': new Date(log.timestamp).toLocaleString(),
        'Admin': log.adminEmail,
        'Action': log.action,
        'Resource Type': log.resourceType,
        'Resource ID': log.resourceId || '',
        'Details': JSON.stringify(log.details || {}),
      }));

      exportToCSV(csvData, `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      alert(`Exported ${exportData.length} audit logs`);
    } catch (err: any) {
      alert('Failed to export: ' + err.message);
    }
  }

  const filteredLogs = logs.filter(log => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        log.adminEmail?.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query) ||
        log.resourceType.toLowerCase().includes(query) ||
        log.resourceId?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      USER_CREATED: 'bg-green-100 text-green-800',
      USER_UPDATED: 'bg-blue-100 text-blue-800',
      USER_SUSPENDED: 'bg-red-100 text-red-800',
      USER_ACTIVATED: 'bg-green-100 text-green-800',
      USER_DELETED: 'bg-red-100 text-red-800',
      BUSINESS_APPROVED: 'bg-green-100 text-green-800',
      BUSINESS_REJECTED: 'bg-red-100 text-red-800',
      BUSINESS_SUSPENDED: 'bg-red-100 text-red-800',
      BUSINESS_DELETED: 'bg-red-100 text-red-800',
      CREATOR_VERIFIED: 'bg-green-100 text-green-800',
      CREATOR_SUSPENDED: 'bg-red-100 text-red-800',
      CREATOR_DELETED: 'bg-red-100 text-red-800',
      ADMIN_CREATED: 'bg-purple-100 text-purple-800',
      ADMIN_UPDATED: 'bg-blue-100 text-blue-800',
      ADMIN_DELETED: 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={colors[action] || 'bg-gray-100 text-gray-800'}>
        {action.includes('CREATED') || action.includes('APPROVED') || action.includes('VERIFIED') ? (
          <CheckCircle className="w-3 h-3 mr-1" />
        ) : action.includes('DELETED') || action.includes('SUSPENDED') || action.includes('REJECTED') ? (
          <XCircle className="w-3 h-3 mr-1" />
        ) : (
          <AlertCircle className="w-3 h-3 mr-1" />
        )}
        {action.replace(/_/g, ' ')}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-2">Track all administrative actions and changes</p>
        </div>
        <Button
          onClick={handleExport}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg border space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              <User className="w-4 h-4 inline mr-1" />
              Admin ID (Optional)
            </label>
            <Input
              placeholder="Filter by admin UID..."
              value={adminFilter}
              onChange={(e) => setAdminFilter(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              <Shield className="w-4 h-4 inline mr-1" />
              Action
            </label>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Actions</SelectItem>
                <SelectItem value="USER_CREATED">User Created</SelectItem>
                <SelectItem value="USER_SUSPENDED">User Suspended</SelectItem>
                <SelectItem value="USER_ACTIVATED">User Activated</SelectItem>
                <SelectItem value="USER_DELETED">User Deleted</SelectItem>
                <SelectItem value="BUSINESS_APPROVED">Business Approved</SelectItem>
                <SelectItem value="BUSINESS_REJECTED">Business Rejected</SelectItem>
                <SelectItem value="BUSINESS_SUSPENDED">Business Suspended</SelectItem>
                <SelectItem value="CREATOR_VERIFIED">Creator Verified</SelectItem>
                <SelectItem value="CREATOR_SUSPENDED">Creator Suspended</SelectItem>
                <SelectItem value="ADMIN_CREATED">Admin Created</SelectItem>
                <SelectItem value="ADMIN_UPDATED">Admin Updated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              <Database className="w-4 h-4 inline mr-1" />
              Resource Type
            </label>
            <Select value={resourceFilter} onValueChange={setResourceFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Resources</SelectItem>
                <SelectItem value="USER">Users</SelectItem>
                <SelectItem value="BUSINESS">Businesses</SelectItem>
                <SelectItem value="CREATOR">Creators</SelectItem>
                <SelectItem value="ADMIN">Admins</SelectItem>
                <SelectItem value="COUNTRY">Countries</SelectItem>
                <SelectItem value="EVENT">Events</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              <Search className="w-4 h-4 inline mr-1" />
              Search
            </label>
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              <Calendar className="w-4 h-4 inline mr-1" />
              Start Date
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              <Calendar className="w-4 h-4 inline mr-1" />
              End Date
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={loadLogs} variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Apply Filters
          </Button>
          <Button
            onClick={() => {
              setAdminFilter('');
              setActionFilter('ALL');
              setResourceFilter('ALL');
              setStartDate('');
              setEndDate('');
              setSearchQuery('');
              loadLogs();
            }}
            variant="outline"
          >
            Clear Filters
          </Button>
        </div>

        <div className="text-sm text-gray-600">
          Showing {filteredLogs.length} of {logs.length} logs
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No audit logs found</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {log.adminEmail}
                      </div>
                      <div className="text-xs text-gray-500">
                        {log.adminId.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {log.resourceType}
                      </div>
                      {log.resourceId && (
                        <div className="text-xs text-gray-500">
                          ID: {log.resourceId.substring(0, 12)}...
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {log.details && (
                        <pre className="text-xs max-w-md overflow-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
