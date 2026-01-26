'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCreatorsAction } from './actions';
import { bulkVerifyCreatorsAction, bulkSuspendCreatorsAction, bulkDeleteCreatorsAction } from './bulk-actions';
import { Creator, VerificationStatus, UserRole } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Download, Trash2, UserX, UserCheck, ShieldCheck } from 'lucide-react';
import { exportToCSV } from '@/lib/utils/csvExport';
import { Checkbox } from '@/components/ui/checkbox';

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [filteredCreators, setFilteredCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [verifiedFilter, setVerifiedFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [verificationStatusFilter, setVerificationStatusFilter] =
    useState<string>('all');
  const [payoutFilter, setPayoutFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Bulk selection
  const [selectedCreators, setSelectedCreators] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Load creators
  useEffect(() => {
    loadCreators();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...creators];

    // Verified filter
    if (verifiedFilter !== 'all') {
      filtered = filtered.filter(
        (c) => c.verified === (verifiedFilter === 'true')
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    // Verification status filter
    if (verificationStatusFilter !== 'all') {
      filtered = filtered.filter(
        (c) => c.verificationStatus === verificationStatusFilter
      );
    }

    // Payout filter
    if (payoutFilter !== 'all') {
      filtered = filtered.filter(
        (c) => c.payoutFrozen === (payoutFilter === 'true')
      );
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.displayName?.toLowerCase().includes(query) ||
          c.youtubeHandle?.toLowerCase().includes(query)
      );
    }

    setFilteredCreators(filtered);
  }, [
    creators,
    verifiedFilter,
    statusFilter,
    verificationStatusFilter,
    payoutFilter,
    searchQuery,
  ]);

  async function loadCreators() {
    try {
      setLoading(true);
      setError(null);
      console.log('🎨 Loading creators (users with CREATOR role)...');
      
      // Load from users collection with CREATOR role filter
      const { getUsersAction } = await import('../users/actions');
      const allUsers = await getUsersAction({ role: UserRole.CREATOR });
      
      // Map user data to creator format (using available User fields)
      const creatorsData = allUsers.map((user: any) => ({
        id: user.id,
        userId: user.id,
        countryCode: user.countryCode || 'DE',
        displayName: user.name || user.handle || user.displayName || user.email?.split('@')[0] || 'Unknown',
        bio: user.bio || '',
        profilePhoto: user.profilePhoto || user.photoURL,
        verified: user.creatorProfile?.verified || user.verified || false,
        verificationStatus: (user.verificationStatus || user.approvalStatus || 'PENDING') as VerificationStatus,
        status: user.status || 'ACTIVE',
        trustScore: user.creatorProfile?.trustScore || 50,
        riskScore: 0,
        stats: {
          totalMissions: 0,
          completedMissions: 0,
          totalEarnings: user.creatorProfile?.totalEarnings || 0,
          pendingPayout: user.creatorProfile?.pendingPayout || 0,
          averageRating: 0,
          totalReviews: 0,
        },
        payoutFrozen: false,
        disputeCount: 0,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));
      
      console.log('📦 Total creators received:', creatorsData.length);
      console.log('🔍 Creators verification status:', {
        total: creatorsData.length,
        pending: creatorsData.filter(c => c.verificationStatus === 'PENDING').length,
        approved: creatorsData.filter(c => c.verificationStatus === 'APPROVED').length,
        rejected: creatorsData.filter(c => c.verificationStatus === 'REJECTED').length,
      });
      setCreators(creatorsData);
      setFilteredCreators(creatorsData);
    } catch (err: any) {
      console.error('❌ Error loading creators:', err);
      setError(err.message || 'Failed to load creators');
    } finally {
      setLoading(false);
    }
  }

  function handleExportCSV() {
    const exportData = filteredCreators.map(creator => ({
      id: creator.id,
      displayName: creator.displayName || '',
      youtubeHandle: creator.youtubeHandle || '',
      verified: creator.verified ? 'Yes' : 'No',
      verificationStatus: creator.verificationStatus,
      status: creator.status,
      trustScore: creator.trustScore || 0,
      payoutFrozen: creator.payoutFrozen ? 'Yes' : 'No',
      countryCode: creator.countryCode || '',
      totalMissions: creator.stats?.totalMissions || 0,
      totalEarnings: creator.stats?.totalEarnings || 0,
      createdAt: creator.createdAt ? new Date(creator.createdAt).toLocaleDateString() : '',
    }));

    exportToCSV(exportData, 'fluzio_creators', [
      { key: 'id', label: 'Creator ID' },
      { key: 'displayName', label: 'Display Name' },
      { key: 'youtubeHandle', label: 'YouTube' },
      { key: 'verified', label: 'Verified' },
      { key: 'verificationStatus', label: 'Verification Status' },
      { key: 'status', label: 'Account Status' },
      { key: 'trustScore', label: 'Trust Score' },
      { key: 'payoutFrozen', label: 'Payout Frozen' },
      { key: 'countryCode', label: 'Country' },
      { key: 'totalMissions', label: 'Total Missions' },
      { key: 'totalEarnings', label: 'Total Earnings' },
      { key: 'createdAt', label: 'Joined Date' },
    ]);
  }

  // Bulk selection handlers
  function toggleSelectAll() {
    if (selectedCreators.size === filteredCreators.length) {
      setSelectedCreators(new Set());
    } else {
      setSelectedCreators(new Set(filteredCreators.map(c => c.id)));
    }
  }

  function toggleSelectCreator(creatorId: string) {
    const newSelected = new Set(selectedCreators);
    if (newSelected.has(creatorId)) {
      newSelected.delete(creatorId);
    } else {
      newSelected.add(creatorId);
    }
    setSelectedCreators(newSelected);
  }

  async function handleBulkVerify() {
    if (selectedCreators.size === 0) return;
    
    if (!confirm(`Verify ${selectedCreators.size} selected creators?`)) return;
    
    setBulkActionLoading(true);
    try {
      const creatorIds = Array.from(selectedCreators);
      const result = await bulkVerifyCreatorsAction(creatorIds);
      
      if (result.success) {
        alert(`Successfully verified ${result.successCount} creators.${result.failedCount > 0 ? ` Failed: ${result.failedCount}` : ''}`);
        setSelectedCreators(new Set());
        loadCreators();
      } else {
        alert('Failed to verify creators: ' + result.errors.join(', '));
      }
    } catch (err: any) {
      console.error('Bulk verify error:', err);
      alert('Failed to verify creators: ' + err.message);
    } finally {
      setBulkActionLoading(false);
    }
  }

  async function handleBulkSuspend() {
    if (selectedCreators.size === 0) return;
    
    if (!confirm(`Suspend ${selectedCreators.size} selected creators?`)) return;
    
    setBulkActionLoading(true);
    try {
      const creatorIds = Array.from(selectedCreators);
      const result = await bulkSuspendCreatorsAction(creatorIds);
      
      if (result.success) {
        alert(`Successfully suspended ${result.successCount} creators.${result.failedCount > 0 ? ` Failed: ${result.failedCount}` : ''}`);
        setSelectedCreators(new Set());
        loadCreators();
      } else {
        alert('Failed to suspend creators: ' + result.errors.join(', '));
      }
    } catch (err: any) {
      console.error('Bulk suspend error:', err);
      alert('Failed to suspend creators: ' + err.message);
    } finally {
      setBulkActionLoading(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedCreators.size === 0) return;
    
    if (!confirm(`⚠️ DELETE ${selectedCreators.size} selected creators? This action cannot be undone!`)) return;
    
    setBulkActionLoading(true);
    try {
      const creatorIds = Array.from(selectedCreators);
      const result = await bulkDeleteCreatorsAction(creatorIds);
      
      if (result.success) {
        alert(`Successfully deleted ${result.successCount} creators.${result.failedCount > 0 ? ` Failed: ${result.failedCount}` : ''}`);
        setSelectedCreators(new Set());
        loadCreators();
      } else {
        alert('Failed to delete creators: ' + result.errors.join(', '));
      }
    } catch (err: any) {
      console.error('Bulk delete error:', err);
      alert('Failed to delete creators: ' + err.message);
    } finally {
      setBulkActionLoading(false);
    }
  }

  function getTrustScoreColor(score: number): string {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  }

  function getTrustScoreBg(score: number): string {
    if (score >= 80) return 'bg-green-100';
    if (score >= 50) return 'bg-yellow-100';
    return 'bg-red-100';
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center">
          <div className="text-gray-500">Loading creators...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          Error: {error}
        </div>
        <Button onClick={loadCreators} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Creators</h1>
          <p className="text-gray-600 mt-1">
            Manage content creators and influencers
          </p>
        </div>
        <Button
          onClick={handleExportCSV}
          disabled={filteredCreators.length === 0}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV ({filteredCreators.length})
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter creators by status and attributes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <Input
                placeholder="Search by name or social handle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Verified */}
            <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Verified" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Creators</SelectItem>
                <SelectItem value="true">Verified</SelectItem>
                <SelectItem value="false">Unverified</SelectItem>
              </SelectContent>
            </Select>

            {/* Status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="BANNED">Banned</SelectItem>
              </SelectContent>
            </Select>

            {/* Verification Status */}
            <Select
              value={verificationStatusFilter}
              onValueChange={setVerificationStatusFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Verification</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {/* Payout Status */}
            <Select value={payoutFilter} onValueChange={setPayoutFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Payout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payouts</SelectItem>
                <SelectItem value="false">Normal</SelectItem>
                <SelectItem value="true">Frozen</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredCreators.length} of {creators.length} creators
        {selectedCreators.size > 0 && (
          <span className="ml-2 text-blue-600 font-medium">
            ({selectedCreators.size} selected)
          </span>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedCreators.size > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-blue-900">
              {selectedCreators.size} creator{selectedCreators.size !== 1 ? 's' : ''} selected
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedCreators(new Set())}
            >
              Clear Selection
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleBulkVerify}
              disabled={bulkActionLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ShieldCheck className="w-4 h-4 mr-1" />
              Verify
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

      {/* Creators table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Checkbox
                      checked={selectedCreators.size === filteredCreators.length && filteredCreators.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Social Media
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trust Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Earnings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCreators.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No creators found
                    </td>
                  </tr>
                ) : (
                  filteredCreators.map((creator) => (
                    <tr key={creator.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Checkbox
                          checked={selectedCreators.has(creator.id)}
                          onCheckedChange={() => toggleSelectCreator(creator.id)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {creator.profilePhoto ? (
                              <img
                                className="h-10 w-10 rounded-full"
                                src={creator.profilePhoto}
                                alt=""
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-600 font-medium">
                                  {creator.displayName?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {creator.displayName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {creator.countryCode}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm space-y-1">
                          {creator.youtubeHandle && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">YT:</span>
                              <span className="font-medium">
                                @{creator.youtubeHandle}
                              </span>
                              {creator.youtubeSubscribers && (
                                <span className="text-gray-400 text-xs">
                                  ({(creator.youtubeSubscribers / 1000).toFixed(1)}K)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div
                            className={`text-sm font-bold ${getTrustScoreColor(
                              creator.trustScore
                            )}`}
                          >
                            {creator.trustScore}
                          </div>
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                creator.trustScore >= 80
                                  ? 'bg-green-500'
                                  : creator.trustScore >= 50
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                              }`}
                              style={{ width: `${creator.trustScore}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            ${creator.stats.totalEarnings.toFixed(2)}
                          </div>
                          <div className="text-gray-500">
                            Pending: ${creator.stats.pendingPayout.toFixed(2)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {creator.verified && (
                            <Badge variant="default" className="w-fit">
                              Verified
                            </Badge>
                          )}
                          {creator.status === 'SUSPENDED' && (
                            <Badge variant="destructive" className="w-fit">
                              Suspended
                            </Badge>
                          )}
                          {creator.status === 'BANNED' && (
                            <Badge variant="destructive" className="w-fit">
                              Banned
                            </Badge>
                          )}
                          {creator.payoutFrozen && (
                            <Badge variant="secondary" className="w-fit bg-red-100 text-red-700">
                              Payout Frozen
                            </Badge>
                          )}
                          {creator.verificationStatus === 'PENDING' && (
                            <Badge variant="secondary" className="w-fit bg-yellow-100 text-yellow-700">
                              Pending Review
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link href={`/admin/creators/${creator.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
