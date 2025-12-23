'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCreatorsAction } from './actions';
import { Creator, VerificationStatus } from '@/lib/types';
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
          c.instagramHandle?.toLowerCase().includes(query) ||
          c.tiktokHandle?.toLowerCase().includes(query) ||
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
      const data = await getCreatorsAction();
      setCreators(data);
      setFilteredCreators(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load creators');
    } finally {
      setLoading(false);
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
      </div>

      {/* Creators table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
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
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No creators found
                    </td>
                  </tr>
                ) : (
                  filteredCreators.map((creator) => (
                    <tr key={creator.id} className="hover:bg-gray-50">
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
                          {creator.instagramHandle && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">IG:</span>
                              <span className="font-medium">
                                @{creator.instagramHandle}
                              </span>
                              {creator.instagramFollowers && (
                                <span className="text-gray-400 text-xs">
                                  ({(creator.instagramFollowers / 1000).toFixed(1)}K)
                                </span>
                              )}
                            </div>
                          )}
                          {creator.tiktokHandle && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">TT:</span>
                              <span className="font-medium">
                                @{creator.tiktokHandle}
                              </span>
                              {creator.tiktokFollowers && (
                                <span className="text-gray-400 text-xs">
                                  ({(creator.tiktokFollowers / 1000).toFixed(1)}K)
                                </span>
                              )}
                            </div>
                          )}
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
