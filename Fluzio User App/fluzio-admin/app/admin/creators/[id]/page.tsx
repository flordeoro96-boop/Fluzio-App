'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getCreatorByIdAction,
  verifyCreatorAction,
  updateTrustScoreAction,
  freezePayoutAction,
  unfreezePayoutAction,
  suspendCreatorAction,
  unsuspendCreatorAction,
} from '../actions';
import { Creator } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

export default function CreatorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const creatorId = params.id as string;

  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [trustScoreDialogOpen, setTrustScoreDialogOpen] = useState(false);
  const [freezePayoutDialogOpen, setFreezePayoutDialogOpen] = useState(false);
  const [unfreezePayoutDialogOpen, setUnfreezePayoutDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [unsuspendDialogOpen, setUnsuspendDialogOpen] = useState(false);

  // Form states
  const [verifyApproved, setVerifyApproved] = useState(true);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [newTrustScore, setNewTrustScore] = useState(75);
  const [freezeReason, setFreezeReason] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadCreator();
  }, [creatorId]);

  async function loadCreator() {
    try {
      setLoading(true);
      setError(null);
      const data = await getCreatorByIdAction(creatorId);
      if (!data) {
        setError('Creator not found');
        return;
      }
      setCreator(data);
      setNewTrustScore(data.trustScore);
    } catch (err: any) {
      setError(err.message || 'Failed to load creator');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    try {
      setActionLoading(true);
      await verifyCreatorAction({
        creatorId,
        approved: verifyApproved,
        notes: verifyNotes,
      });
      setVerifyDialogOpen(false);
      setVerifyNotes('');
      await loadCreator();
    } catch (err: any) {
      alert(err.message || 'Failed to verify creator');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUpdateTrustScore() {
    try {
      setActionLoading(true);
      await updateTrustScoreAction({
        creatorId,
        trustScore: newTrustScore,
      });
      setTrustScoreDialogOpen(false);
      await loadCreator();
    } catch (err: any) {
      alert(err.message || 'Failed to update trust score');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleFreezePayout() {
    try {
      setActionLoading(true);
      await freezePayoutAction({
        creatorId,
        reason: freezeReason,
      });
      setFreezePayoutDialogOpen(false);
      setFreezeReason('');
      await loadCreator();
    } catch (err: any) {
      alert(err.message || 'Failed to freeze payout');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUnfreezePayout() {
    try {
      setActionLoading(true);
      await unfreezePayoutAction({ creatorId });
      setUnfreezePayoutDialogOpen(false);
      await loadCreator();
    } catch (err: any) {
      alert(err.message || 'Failed to unfreeze payout');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSuspend() {
    try {
      setActionLoading(true);
      await suspendCreatorAction({
        creatorId,
        reason: suspendReason,
      });
      setSuspendDialogOpen(false);
      setSuspendReason('');
      await loadCreator();
    } catch (err: any) {
      alert(err.message || 'Failed to suspend creator');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUnsuspend() {
    try {
      setActionLoading(true);
      await unsuspendCreatorAction({ creatorId });
      setUnsuspendDialogOpen(false);
      await loadCreator();
    } catch (err: any) {
      alert(err.message || 'Failed to unsuspend creator');
    } finally {
      setActionLoading(false);
    }
  }

  function getTrustScoreColor(score: number): string {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center">
          <div className="text-gray-500">Loading creator...</div>
        </div>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          Error: {error || 'Creator not found'}
        </div>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          ← Back to Creators
        </Button>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {creator.profilePhoto ? (
              <img
                src={creator.profilePhoto}
                alt={creator.displayName}
                className="w-20 h-20 rounded-full"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-2xl text-gray-600 font-medium">
                  {creator.displayName?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold">{creator.displayName}</h1>
              <p className="text-gray-600 mt-1">{creator.bio}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{creator.countryCode}</Badge>
                {creator.verified && (
                  <Badge variant="default">✓ Verified</Badge>
                )}
                {creator.status === 'SUSPENDED' && (
                  <Badge variant="destructive">Suspended</Badge>
                )}
                {creator.status === 'BANNED' && (
                  <Badge variant="destructive">Banned</Badge>
                )}
                {creator.payoutFrozen && (
                  <Badge className="bg-red-100 text-red-700">
                    Payout Frozen
                  </Badge>
                )}
                {creator.verificationStatus === 'PENDING' && (
                  <Badge className="bg-yellow-100 text-yellow-700">
                    Pending Review
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {creator.verificationStatus === 'PENDING' && (
              <Button onClick={() => setVerifyDialogOpen(true)}>
                Review Verification
              </Button>
            )}
            {creator.status === 'ACTIVE' && (
              <Button
                variant="destructive"
                onClick={() => setSuspendDialogOpen(true)}
              >
                Suspend
              </Button>
            )}
            {creator.status === 'SUSPENDED' && (
              <Button onClick={() => setUnsuspendDialogOpen(true)}>
                Unsuspend
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {creator.status === 'SUSPENDED' && creator.suspensionReason && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Account Suspended</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{creator.suspensionReason}</p>
            {creator.suspendedAt && (
              <p className="text-sm text-red-500 mt-2">
                Suspended on:{' '}
                {new Date(creator.suspendedAt).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {creator.payoutFrozen && creator.payoutFrozenReason && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-700">Payout Frozen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-600">{creator.payoutFrozenReason}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Stats & Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Missions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {creator.stats.totalMissions}
                </div>
                <p className="text-xs text-green-600 mt-1">
                  {creator.stats.completedMissions} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Earnings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${creator.stats.totalEarnings.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Pending Payout</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${creator.stats.pendingPayout.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Rating</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {creator.stats.averageRating.toFixed(1)} ★
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {creator.stats.totalReviews} reviews
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Social Media */}
          <Card>
            <CardHeader>
              <CardTitle>Social Media</CardTitle>
              <CardDescription>Connected platforms and audience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {creator.instagramHandle && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-semibold">Instagram</div>
                    <div className="text-sm text-gray-600">
                      @{creator.instagramHandle}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      {creator.instagramFollowers?.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">followers</div>
                  </div>
                </div>
              )}

              {creator.tiktokHandle && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-semibold">TikTok</div>
                    <div className="text-sm text-gray-600">
                      @{creator.tiktokHandle}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      {creator.tiktokFollowers?.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">followers</div>
                  </div>
                </div>
              )}

              {creator.youtubeHandle && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-semibold">YouTube</div>
                    <div className="text-sm text-gray-600">
                      @{creator.youtubeHandle}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      {creator.youtubeSubscribers?.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">subscribers</div>
                  </div>
                </div>
              )}

              {!creator.instagramHandle &&
                !creator.tiktokHandle &&
                !creator.youtubeHandle && (
                  <div className="text-center text-gray-500 py-4">
                    No social media connected
                  </div>
                )}
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Creator reliability and quality</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Completion Rate</span>
                <span className="text-sm">
                  {creator.stats.totalMissions > 0
                    ? (
                        (creator.stats.completedMissions /
                          creator.stats.totalMissions) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Risk Score</span>
                <Badge
                  variant={
                    creator.riskScore < 30
                      ? 'default'
                      : creator.riskScore < 60
                        ? 'secondary'
                        : 'destructive'
                  }
                >
                  {creator.riskScore}/100
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Dispute Count</span>
                <span className="text-sm">{creator.disputeCount}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Trust Score & Actions */}
        <div className="space-y-6">
          {/* Trust Score */}
          <Card>
            <CardHeader>
              <CardTitle>Trust Score</CardTitle>
              <CardDescription>Creator reputation score</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center mb-4">
                <div
                  className={`w-32 h-32 rounded-full flex items-center justify-center ${getTrustScoreColor(
                    creator.trustScore
                  )}`}
                >
                  <span className="text-4xl font-bold">
                    {creator.trustScore}
                  </span>
                </div>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
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
              <Button
                className="w-full"
                onClick={() => setTrustScoreDialogOpen(true)}
              >
                Adjust Trust Score
              </Button>
            </CardContent>
          </Card>

          {/* Payout Management */}
          <Card>
            <CardHeader>
              <CardTitle>Payout Management</CardTitle>
              <CardDescription>Control creator earnings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Pending Payout</div>
                <div className="text-2xl font-bold">
                  ${creator.stats.pendingPayout.toFixed(2)}
                </div>
              </div>
              {creator.payoutFrozen ? (
                <Button
                  className="w-full"
                  variant="default"
                  onClick={() => setUnfreezePayoutDialogOpen(true)}
                >
                  Unfreeze Payout
                </Button>
              ) : (
                <Button
                  className="w-full"
                  variant="destructive"
                  onClick={() => setFreezePayoutDialogOpen(true)}
                >
                  Freeze Payout
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Verification Status */}
          <Card>
            <CardHeader>
              <CardTitle>Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Status</span>
                <Badge
                  variant={
                    creator.verificationStatus === 'APPROVED'
                      ? 'default'
                      : creator.verificationStatus === 'REJECTED'
                        ? 'destructive'
                        : 'secondary'
                  }
                >
                  {creator.verificationStatus}
                </Badge>
              </div>
              {creator.verificationNotes && (
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  {creator.verificationNotes}
                </div>
              )}
              {creator.verifiedAt && (
                <div className="text-xs text-gray-500">
                  Verified on:{' '}
                  {new Date(creator.verifiedAt).toLocaleDateString()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle>Account Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Created</span>
                <span>{new Date(creator.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Updated</span>
                <span>{new Date(creator.updatedAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Verify Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Creator Verification</DialogTitle>
            <DialogDescription>
              Approve or reject this creator's verification request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button
                variant={verifyApproved ? 'default' : 'outline'}
                onClick={() => setVerifyApproved(true)}
                className="flex-1"
              >
                Approve
              </Button>
              <Button
                variant={!verifyApproved ? 'destructive' : 'outline'}
                onClick={() => setVerifyApproved(false)}
                className="flex-1"
              >
                Reject
              </Button>
            </div>
            <div>
              <Label htmlFor="verify-notes">Notes (optional)</Label>
              <Textarea
                id="verify-notes"
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                placeholder="Add notes about this decision..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVerifyDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleVerify} disabled={actionLoading}>
              {actionLoading ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trust Score Dialog */}
      <Dialog
        open={trustScoreDialogOpen}
        onOpenChange={setTrustScoreDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Trust Score</DialogTitle>
            <DialogDescription>
              Set the trust score for this creator (0-100)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="trust-score">Trust Score: {newTrustScore}</Label>
              <Input
                id="trust-score"
                type="range"
                min="0"
                max="100"
                value={newTrustScore}
                onChange={(e) => setNewTrustScore(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0 (Low)</span>
                <span>50 (Medium)</span>
                <span>100 (High)</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTrustScoreDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateTrustScore} disabled={actionLoading}>
              {actionLoading ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Freeze Payout Dialog */}
      <Dialog
        open={freezePayoutDialogOpen}
        onOpenChange={setFreezePayoutDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Freeze Payout</DialogTitle>
            <DialogDescription>
              Freeze this creator's pending payout. They will not be able to
              withdraw funds until unfrozen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="freeze-reason">Reason *</Label>
              <Textarea
                id="freeze-reason"
                value={freezeReason}
                onChange={(e) => setFreezeReason(e.target.value)}
                placeholder="Explain why the payout is being frozen..."
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFreezePayoutDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleFreezePayout}
              disabled={actionLoading || freezeReason.length < 10}
            >
              {actionLoading ? 'Freezing...' : 'Freeze Payout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unfreeze Payout Dialog */}
      <Dialog
        open={unfreezePayoutDialogOpen}
        onOpenChange={setUnfreezePayoutDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unfreeze Payout</DialogTitle>
            <DialogDescription>
              Allow this creator to withdraw their pending payout again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUnfreezePayoutDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleUnfreezePayout} disabled={actionLoading}>
              {actionLoading ? 'Unfreezing...' : 'Unfreeze Payout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Creator</DialogTitle>
            <DialogDescription>
              Suspend this creator account. They will not be able to access
              their account or complete missions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="suspend-reason">Reason *</Label>
              <Textarea
                id="suspend-reason"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Explain why the account is being suspended..."
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSuspendDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspend}
              disabled={actionLoading || suspendReason.length < 10}
            >
              {actionLoading ? 'Suspending...' : 'Suspend Creator'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsuspend Dialog */}
      <Dialog open={unsuspendDialogOpen} onOpenChange={setUnsuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsuspend Creator</DialogTitle>
            <DialogDescription>
              Restore this creator's account access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUnsuspendDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleUnsuspend} disabled={actionLoading}>
              {actionLoading ? 'Unsuspending...' : 'Unsuspend Creator'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
