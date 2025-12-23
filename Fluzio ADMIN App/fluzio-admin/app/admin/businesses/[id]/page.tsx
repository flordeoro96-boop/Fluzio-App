'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  getBusinessByIdAction,
  updateBusinessTierAction,
  verifyBusinessAction,
  suspendBusinessAction,
  unsuspendBusinessAction,
} from '../actions';
import { Business, BusinessTier, VerificationStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  ArrowLeft,
  Building2,
  CheckCircle2,
  AlertCircle,
  Ban,
  ShieldCheck,
  Award,
  Target,
  Gift,
  DollarSign,
  Mail,
  Phone,
  Globe,
  MapPin,
  User,
  Calendar,
  XCircle,
  Clock,
} from 'lucide-react';

export default function BusinessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dialogs
  const [showTierDialog, setShowTierDialog] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showUnsuspendDialog, setShowUnsuspendDialog] = useState(false);

  // Form states
  const [selectedTier, setSelectedTier] = useState<BusinessTier>(BusinessTier.FREE);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadBusiness();
  }, [params.id]);

  async function loadBusiness() {
    try {
      setLoading(true);
      const data = await getBusinessByIdAction(params.id as string);
      setBusiness(data);
      if (data) setSelectedTier(data.tier);
    } catch (err: any) {
      setError(err.message || 'Failed to load business');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateTier() {
    if (!business) return;

    try {
      setIsSubmitting(true);
      await updateBusinessTierAction({
        businessId: business.id,
        tier: selectedTier,
      });
      setShowTierDialog(false);
      await loadBusiness();
    } catch (err: any) {
      setError(err.message || 'Failed to update tier');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerify(approved: boolean) {
    if (!business) return;

    try {
      setIsSubmitting(true);
      await verifyBusinessAction({
        businessId: business.id,
        approved,
        notes: verificationNotes,
      });
      setShowVerifyDialog(false);
      setVerificationNotes('');
      await loadBusiness();
    } catch (err: any) {
      setError(err.message || 'Failed to verify business');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSuspend() {
    if (!business || !suspendReason.trim()) return;

    try {
      setIsSubmitting(true);
      await suspendBusinessAction({
        businessId: business.id,
        reason: suspendReason,
      });
      setShowSuspendDialog(false);
      setSuspendReason('');
      await loadBusiness();
    } catch (err: any) {
      setError(err.message || 'Failed to suspend business');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUnsuspend() {
    if (!business) return;

    try {
      setIsSubmitting(true);
      await unsuspendBusinessAction({ businessId: business.id });
      setShowUnsuspendDialog(false);
      await loadBusiness();
    } catch (err: any) {
      setError(err.message || 'Failed to unsuspend business');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building2 className="w-8 h-8 text-blue-600 mx-auto mb-2 animate-pulse" />
          <p className="text-gray-600">Loading business...</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Business not found</p>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const getTierColor = (tier: BusinessTier) => {
    const colors = {
      [BusinessTier.FREE]: 'text-gray-800',
      [BusinessTier.SILVER]: 'text-slate-600',
      [BusinessTier.GOLD]: 'text-yellow-600',
      [BusinessTier.PLATINUM]: 'text-purple-600',
    };
    return colors[tier];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{business.name}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <Badge className={`bg-${getTierColor(business.tier)}-100`}>
                <Award className="w-3 h-3 mr-1" />
                {business.tier}
              </Badge>
              {business.status === 'ACTIVE' && (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              )}
              {business.status === 'SUSPENDED' && (
                <Badge className="bg-orange-100 text-orange-800">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Suspended
                </Badge>
              )}
              {business.verified && (
                <Badge className="bg-blue-100 text-blue-800">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {!business.verified &&
            business.verificationStatus === VerificationStatus.PENDING && (
              <Button onClick={() => setShowVerifyDialog(true)}>
                <ShieldCheck className="w-4 h-4 mr-2" />
                Review Verification
              </Button>
            )}
          <Button variant="outline" onClick={() => setShowTierDialog(true)}>
            <Award className="w-4 h-4 mr-2" />
            Change Tier
          </Button>
          {business.status === 'ACTIVE' ? (
            <Button
              variant="destructive"
              onClick={() => setShowSuspendDialog(true)}
            >
              <Ban className="w-4 h-4 mr-2" />
              Suspend
            </Button>
          ) : (
            <Button onClick={() => setShowUnsuspendDialog(true)}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Unsuspend
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Missions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {business.stats.totalMissions}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {business.stats.activeMissions} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Redemptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {business.stats.totalRedemptions}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total redemptions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${business.stats.totalSpent?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-gray-500 mt-1">Platform spending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Risk Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{business.riskScore}/100</div>
            <p className="text-xs text-gray-500 mt-1">
              {business.disputeCount} disputes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Info */}
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center text-sm">
              <Mail className="w-4 h-4 mr-2 text-gray-500" />
              <span className="font-medium mr-2">Email:</span>
              <span>{business.email}</span>
            </div>

            {business.phoneNumber && (
              <div className="flex items-center text-sm">
                <Phone className="w-4 h-4 mr-2 text-gray-500" />
                <span className="font-medium mr-2">Phone:</span>
                <span>{business.phoneNumber}</span>
              </div>
            )}

            {business.website && (
              <div className="flex items-center text-sm">
                <Globe className="w-4 h-4 mr-2 text-gray-500" />
                <span className="font-medium mr-2">Website:</span>
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {business.website}
                </a>
              </div>
            )}

            {business.address && (
              <div className="flex items-start text-sm">
                <MapPin className="w-4 h-4 mr-2 text-gray-500 mt-0.5" />
                <div>
                  <span className="font-medium mr-2">Address:</span>
                  <span>{business.address}</span>
                </div>
              </div>
            )}

            <div className="flex items-center text-sm">
              <MapPin className="w-4 h-4 mr-2 text-gray-500" />
              <span className="font-medium mr-2">Country:</span>
              <span>{business.countryCode}</span>
            </div>

            <div className="flex items-center text-sm">
              <Building2 className="w-4 h-4 mr-2 text-gray-500" />
              <span className="font-medium mr-2">Industry:</span>
              <span>{business.industry}</span>
            </div>

            {business.description && (
              <div className="pt-2 border-t">
                <span className="text-sm font-medium">Description:</span>
                <p className="text-sm text-gray-600 mt-1">
                  {business.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Owner Info */}
        <Card>
          <CardHeader>
            <CardTitle>Owner Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center text-sm">
              <User className="w-4 h-4 mr-2 text-gray-500" />
              <span className="font-medium mr-2">Name:</span>
              <span>{business.ownerName}</span>
            </div>

            <div className="flex items-center text-sm">
              <Mail className="w-4 h-4 mr-2 text-gray-500" />
              <span className="font-medium mr-2">Email:</span>
              <span>{business.ownerEmail}</span>
            </div>

            <div className="flex items-center text-sm">
              <Calendar className="w-4 h-4 mr-2 text-gray-500" />
              <span className="font-medium mr-2">Joined:</span>
              <span>{new Date(business.createdAt).toLocaleDateString()}</span>
            </div>

            {business.verifiedAt && (
              <div className="flex items-center text-sm">
                <ShieldCheck className="w-4 h-4 mr-2 text-green-600" />
                <span className="font-medium mr-2">Verified:</span>
                <span>{new Date(business.verifiedAt).toLocaleDateString()}</span>
              </div>
            )}

            {!business.verified && business.verificationStatus === VerificationStatus.PENDING && (
              <div className="pt-3 border-t">
                <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                  <span className="text-sm font-medium">Verification Pending</span>
                </div>
              </div>
            )}

            {business.verificationStatus === VerificationStatus.REJECTED && business.verificationNotes && (
              <div className="pt-3 border-t">
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <XCircle className="w-4 h-4 text-red-600 mr-2" />
                    <span className="font-medium text-red-900">
                      Verification Rejected
                    </span>
                  </div>
                  <p className="text-sm text-red-700">
                    {business.verificationNotes}
                  </p>
                </div>
              </div>
            )}

            {business.status === 'SUSPENDED' && business.suspensionReason && (
              <div className="pt-3 border-t">
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Ban className="w-4 h-4 text-red-600 mr-2" />
                    <span className="font-medium text-red-900">Suspended</span>
                  </div>
                  <p className="text-sm text-red-700">
                    {business.suspensionReason}
                  </p>
                  {business.suspendedAt && (
                    <p className="text-xs text-red-600 mt-1">
                      Since: {new Date(business.suspendedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tier Dialog */}
      <Dialog open={showTierDialog} onOpenChange={setShowTierDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Business Tier</DialogTitle>
            <DialogDescription>
              Select a new tier for this business account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Tier</Label>
              <Select
                value={selectedTier}
                onValueChange={(v) => setSelectedTier(v as BusinessTier)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={BusinessTier.FREE}>Free</SelectItem>
                  <SelectItem value={BusinessTier.SILVER}>Silver</SelectItem>
                  <SelectItem value={BusinessTier.GOLD}>Gold</SelectItem>
                  <SelectItem value={BusinessTier.PLATINUM}>Platinum</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTierDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateTier} disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Tier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Business Verification</DialogTitle>
            <DialogDescription>
              Approve or reject this business verification request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                value={verificationNotes}
                onChange={(e: any) => setVerificationNotes(e.target.value)}
                placeholder="Add any notes about the verification decision..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowVerifyDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleVerify(false)}
              disabled={isSubmitting}
            >
              Reject
            </Button>
            <Button onClick={() => handleVerify(true)} disabled={isSubmitting}>
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Business</DialogTitle>
            <DialogDescription>
              Provide a reason for suspending this business account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Suspension Reason</Label>
              <Textarea
                value={suspendReason}
                onChange={(e: any) => setSuspendReason(e.target.value)}
                placeholder="Enter reason for suspension..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSuspendDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspend}
              disabled={isSubmitting || suspendReason.length < 10}
            >
              {isSubmitting ? 'Suspending...' : 'Suspend Business'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsuspend Dialog */}
      <AlertDialog open={showUnsuspendDialog} onOpenChange={setShowUnsuspendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsuspend Business</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unsuspend this business? They will regain
              full access to the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnsuspend} disabled={isSubmitting}>
              {isSubmitting ? 'Unsuspending...' : 'Unsuspend Business'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
