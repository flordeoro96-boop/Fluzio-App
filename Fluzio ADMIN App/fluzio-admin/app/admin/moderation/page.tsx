'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  Search,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Trash2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { ModerationReport, ModerationReportStatus } from '@/lib/types';
import { getModerationReportsAction, updateReportStatusAction, deleteReportAction } from './actions';

export default function ModerationPage() {
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('ALL');
  const [selectedReport, setSelectedReport] = useState<ModerationReport | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<ModerationReportStatus>('IN_REVIEW');
  const [strikesAdded, setStrikesAdded] = useState<number>(0);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadReports();
  }, [statusFilter, entityTypeFilter]);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: any = {};
      if (statusFilter !== 'ALL') filters.status = statusFilter;
      if (entityTypeFilter !== 'ALL') filters.entityType = entityTypeFilter;
      if (searchQuery) filters.search = searchQuery;

      const result = await getModerationReportsAction(filters);
      setReports(result.reports);
    } catch (err: any) {
      setError(err.message || 'Failed to load moderation reports');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadReports();
  };

  const handleUpdateStatus = async () => {
    if (!selectedReport) return;

    try {
      setProcessing(true);
      setError(null);
      await updateReportStatusAction(selectedReport.id, newStatus, strikesAdded);
      setShowStatusDialog(false);
      setSelectedReport(null);
      setStrikesAdded(0);
      loadReports();
    } catch (err: any) {
      setError(err.message || 'Failed to update report status');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedReport) return;

    try {
      setProcessing(true);
      setError(null);
      await deleteReportAction(selectedReport.id);
      setShowDeleteDialog(false);
      setSelectedReport(null);
      loadReports();
    } catch (err: any) {
      setError(err.message || 'Failed to delete report');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: ModerationReportStatus) => {
    const configs = {
      OPEN: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      IN_REVIEW: { color: 'bg-blue-100 text-blue-800', icon: Eye },
      RESOLVED: { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
    };
    const config = configs[status] || configs.OPEN;
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getEntityTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      BUSINESS: 'bg-blue-100 text-blue-800',
      CREATOR: 'bg-purple-100 text-purple-800',
      MISSION: 'bg-green-100 text-green-800',
      EVENT: 'bg-orange-100 text-orange-800',
    };
    return (
      <Badge className={colors[type] || 'bg-gray-100 text-gray-800'}>
        {type}
      </Badge>
    );
  };

  const stats = {
    total: reports.length,
    open: reports.filter((r) => r.status === 'OPEN').length,
    inReview: reports.filter((r) => r.status === 'IN_REVIEW').length,
    resolved: reports.filter((r) => r.status === 'RESOLVED').length,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Moderation</h1>
        <p className="text-gray-600 mt-2">Review reports and manage content moderation</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Reports</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.open}</div>
            <div className="text-sm text-gray-600">Open</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.inReview}</div>
            <div className="text-sm text-gray-600">In Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <div className="text-sm text-gray-600">Resolved</div>
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

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search reports..."
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
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_REVIEW">In Review</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
              </SelectContent>
            </Select>

            <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="BUSINESS">Business</SelectItem>
                <SelectItem value="CREATOR">Creator</SelectItem>
                <SelectItem value="MISSION">Mission</SelectItem>
                <SelectItem value="EVENT">Event</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">Loading reports...</div>
          </CardContent>
        </Card>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No moderation reports found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {getStatusBadge(report.status)}
                      {getEntityTypeBadge(report.entityType)}
                      <span className="text-sm text-gray-600">{report.id}</span>
                    </div>

                    <div className="mb-3">
                      <div className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Entity ID:</span> {report.entityId}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Reason:</span> {report.reason}
                      </div>
                      {report.strikesAdded !== undefined && report.strikesAdded > 0 && (
                        <div className="text-sm text-red-600 mt-1">
                          <span className="font-medium">Strikes Added:</span> {report.strikesAdded}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>
                        {report.createdAt
                          ? new Date(
                              typeof report.createdAt === 'object' && 'toMillis' in report.createdAt
                                ? report.createdAt.toMillis()
                                : report.createdAt
                            ).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedReport(report);
                        setNewStatus(report.status);
                        setStrikesAdded(report.strikesAdded || 0);
                        setShowStatusDialog(true);
                      }}
                    >
                      Update
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedReport(report);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Report Status</DialogTitle>
            <DialogDescription>
              Change the status and strikes for: {selectedReport?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={newStatus} onValueChange={(val) => setNewStatus(val as ModerationReportStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_REVIEW">In Review</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Strikes Added</label>
              <Input
                type="number"
                min="0"
                value={strikesAdded}
                onChange={(e) => setStrikesAdded(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={processing}>
              {processing ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Report</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete report: {selectedReport?.id}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={processing}>
              {processing ? 'Deleting...' : 'Delete Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
