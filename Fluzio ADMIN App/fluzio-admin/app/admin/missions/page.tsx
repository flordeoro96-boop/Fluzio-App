'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getMissionsAction, updateMissionStatusAction } from './actions';
import { Mission } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Target,
  Calendar,
  MapPin,
  DollarSign,
  Download,
} from 'lucide-react';

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [filteredMissions, setFilteredMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');

  // Action dialogs
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadMissions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [missions, searchQuery, statusFilter, countryFilter]);

  async function loadMissions() {
    try {
      setLoading(true);
      setError(null);
      const data = await getMissionsAction();
      setMissions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load missions');
    } finally {
      setLoading(false);
    }
  }

  function exportToCSV() {
    const headers = ['ID', 'Title', 'Business', 'Status', 'Country', 'Points', 'Created'];
    const rows = filteredMissions.map((m) => [
      m.id,
      m.title || 'Untitled',
      m.businessName || 'N/A',
      m.status,
      m.countryId,
      m.pointsReward || '0',
      m.createdAt
        ? new Date(
            typeof m.createdAt === 'object' && 'toMillis' in m.createdAt
              ? m.createdAt.toMillis()
              : m.createdAt
          ).toLocaleDateString()
        : 'N/A',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\\n');

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `missions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function applyFilters() {
    let filtered = [...missions];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.title?.toLowerCase().includes(query) ||
          m.businessName?.toLowerCase().includes(query) ||
          m.description?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((m) => m.status === statusFilter);
    }

    // Country filter
    if (countryFilter !== 'all') {
      filtered = filtered.filter((m) => m.countryId === countryFilter);
    }

    setFilteredMissions(filtered);
  }

  async function handleApproveMission() {
    if (!selectedMission) return;

    try {
      setActionInProgress(true);
      await updateMissionStatusAction(selectedMission.id, 'APPROVED');
      await loadMissions();
      setShowApproveDialog(false);
      setSelectedMission(null);
    } catch (err: any) {
      setError(err.message || 'Failed to approve mission');
    } finally {
      setActionInProgress(false);
    }
  }

  async function handleRejectMission() {
    if (!selectedMission || !rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    try {
      setActionInProgress(true);
      await updateMissionStatusAction(
        selectedMission.id,
        'REJECTED',
        rejectionReason
      );
      await loadMissions();
      setShowRejectDialog(false);
      setSelectedMission(null);
      setRejectionReason('');
    } catch (err: any) {
      setError(err.message || 'Failed to reject mission');
    } finally {
      setActionInProgress(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'PENDING_APPROVAL':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      case 'FLAGGED':
        return (
          <Badge className="bg-orange-100 text-orange-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Flagged
          </Badge>
        );
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const uniqueCountries = Array.from(
    new Set(missions.map((m) => m.countryId).filter(Boolean))
  );

  const stats = {
    total: missions.length,
    pending: missions.filter((m) => m.status === 'PENDING_APPROVAL').length,
    approved: missions.filter((m) => m.status === 'APPROVED').length,
    rejected: missions.filter((m) => m.status === 'REJECTED').length,
    flagged: missions.filter((m) => m.status === 'FLAGGED').length,
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Missions</h1>
          <p className="text-gray-600 mt-2">
            Review and manage mission submissions and disputes
          </p>
        </div>
        <LoadingSkeleton count={8} />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Missions</h1>
          <p className="text-gray-600 mt-2">
            Review and manage mission submissions and disputes
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline" disabled={filteredMissions.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Missions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.approved}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.rejected}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Flagged
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.flagged}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search missions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING_APPROVAL">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="FLAGGED">Flagged</SelectItem>
              </SelectContent>
            </Select>

            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {uniqueCountries.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setCountryFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Missions List */}
      <div className="space-y-4">
        {filteredMissions.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No missions found"
            description={
              missions.length === 0
                ? 'Missions will appear here once businesses create them. Check back soon!'
                : 'Try adjusting your filters or search criteria to see more results.'
            }
            action={
              searchQuery || statusFilter !== 'all' || countryFilter !== 'all'
                ? {
                    label: 'Clear all filters',
                    onClick: () => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setCountryFilter('all');
                      setCurrentPage(1);
                    },
                  }
                : undefined
            }
          />
        ) : (
          <>
            {filteredMissions
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((mission) => (
            <Card key={mission.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        {mission.title || 'Untitled Mission'}
                      </h3>
                      {getStatusBadge(mission.status)}
                      <Badge variant="outline">{mission.countryId}</Badge>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">
                      {mission.description || 'No description provided'}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Target className="w-4 h-4" />
                        <span>{mission.businessName || 'Unknown Business'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {mission.createdAt
                            ? new Date(
                                typeof mission.createdAt === 'object' && 'toMillis' in mission.createdAt
                                  ? mission.createdAt.toMillis()
                                  : mission.createdAt
                              ).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="w-4 h-4" />
                        <span>{mission.pointsReward || 0} pts</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{mission.location || 'No location'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    {mission.status === 'PENDING_APPROVAL' && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            setSelectedMission(mission);
                            setShowApproveDialog(true);
                          }}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedMission(mission);
                            setShowRejectDialog(true);
                          }}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/missions/${mission.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
            <Pagination
              currentPage={currentPage}
              totalItems={filteredMissions.length}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </>
        )}
      </div>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Mission</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve "{selectedMission?.title}"? This
              mission will become visible to users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionInProgress}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApproveMission}
              disabled={actionInProgress}
            >
              {actionInProgress ? 'Approving...' : 'Approve'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Mission</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting "{selectedMission?.title}".
              This will be sent to the business owner.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <textarea
              className="w-full min-h-[100px] p-3 border rounded-md"
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionInProgress}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectMission}
              disabled={actionInProgress || !rejectionReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionInProgress ? 'Rejecting...' : 'Reject Mission'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
