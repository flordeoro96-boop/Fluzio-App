'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  getUserByIdAction,
  suspendUserAction,
  unsuspendUserAction,
  updateUserKYCAction,
  addUserStrikeAction,
} from '../actions';
import { User, UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  CheckCircle2,
  AlertCircle,
  Ban,
  ShieldCheck,
  Star,
  Target,
  Gift,
  Users,
  TrendingUp,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  AlertTriangle,
} from 'lucide-react';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dialogs
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showUnsuspendDialog, setShowUnsuspendDialog] = useState(false);
  const [showKYCDialog, setShowKYCDialog] = useState(false);
  const [showStrikeDialog, setShowStrikeDialog] = useState(false);
  
  // Form states
  const [suspendReason, setSuspendReason] = useState('');
  const [strikeReason, setStrikeReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadUser();
  }, [params.id]);

  async function loadUser() {
    try {
      setLoading(true);
      const data = await getUserByIdAction(params.id as string);
      setUser(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load user');
    } finally {
      setLoading(false);
    }
  }

  async function handleSuspend() {
    if (!user || !suspendReason.trim()) return;
    
    try {
      setIsSubmitting(true);
      await suspendUserAction({ userId: user.id, reason: suspendReason });
      setShowSuspendDialog(false);
      setSuspendReason('');
      await loadUser();
    } catch (err: any) {
      setError(err.message || 'Failed to suspend user');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUnsuspend() {
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      await unsuspendUserAction({ userId: user.id });
      setShowUnsuspendDialog(false);
      await loadUser();
    } catch (err: any) {
      setError(err.message || 'Failed to unsuspend user');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleKYCToggle(verified: boolean) {
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      await updateUserKYCAction({ userId: user.id, verified });
      setShowKYCDialog(false);
      await loadUser();
    } catch (err: any) {
      setError(err.message || 'Failed to update KYC');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddStrike() {
    if (!user || !strikeReason.trim()) return;
    
    try {
      setIsSubmitting(true);
      await addUserStrikeAction({ userId: user.id, reason: strikeReason });
      setShowStrikeDialog(false);
      setStrikeReason('');
      await loadUser();
    } catch (err: any) {
      setError(err.message || 'Failed to add strike');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Users className="w-8 h-8 text-blue-600 mx-auto mb-2 animate-pulse" />
          <p className="text-gray-600">Loading user...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">User not found</p>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold">{user.displayName}</h1>
            <div className="flex items-center space-x-2 mt-1">
              {user.role === UserRole.CREATOR && (
                <Badge className="bg-purple-100 text-purple-800">
                  <Star className="w-3 h-3 mr-1" />
                  Creator
                </Badge>
              )}
              {user.status === 'ACTIVE' && (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              )}
              {user.status === 'SUSPENDED' && (
                <Badge className="bg-orange-100 text-orange-800">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Suspended
                </Badge>
              )}
              {user.kycVerified && (
                <Badge className="bg-blue-100 text-blue-800">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  KYC Verified
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          {user.status === 'ACTIVE' ? (
            <Button variant="destructive" onClick={() => setShowSuspendDialog(true)}>
              <Ban className="w-4 h-4 mr-2" />
              Suspend User
            </Button>
          ) : (
            <Button onClick={() => setShowUnsuspendDialog(true)}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Unsuspend User
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowStrikeDialog(true)}>
            <AlertTriangle className="w-4 h-4 mr-2" />
            Add Strike
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Points Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.totalPoints?.toLocaleString() || '0'}</div>
            <p className="text-xs text-gray-500 mt-1">
              Lifetime: {user.lifetimePoints?.toLocaleString() || '0'}
            </p>
          </CardContent>
        </Card>

        {/* Streak Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Current Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.currentStreak || 0} days</div>
            <p className="text-xs text-gray-500 mt-1">
              Longest: {user.longestStreak || 0} days
            </p>
          </CardContent>
        </Card>

        {/* Missions Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Missions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.stats?.missionsCompleted || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Completed</p>
          </CardContent>
        </Card>

        {/* Rewards Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.stats?.rewardsRedeemed || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Redeemed</p>
          </CardContent>
        </Card>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Details */}
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center text-sm">
              <Mail className="w-4 h-4 mr-2 text-gray-500" />
              <span className="font-medium mr-2">Email:</span>
              <span>{user.email}</span>
              {user.emailVerified && (
                <CheckCircle2 className="w-4 h-4 ml-2 text-green-600" />
              )}
            </div>
            
            {user.phoneNumber && (
              <div className="flex items-center text-sm">
                <Phone className="w-4 h-4 mr-2 text-gray-500" />
                <span className="font-medium mr-2">Phone:</span>
                <span>{user.phoneNumber}</span>
                {user.phoneVerified && (
                  <CheckCircle2 className="w-4 h-4 ml-2 text-green-600" />
                )}
              </div>
            )}
            
            <div className="flex items-center text-sm">
              <MapPin className="w-4 h-4 mr-2 text-gray-500" />
              <span className="font-medium mr-2">Country:</span>
              <span>{user.countryCode}</span>
            </div>
            
            <div className="flex items-center text-sm">
              <Calendar className="w-4 h-4 mr-2 text-gray-500" />
              <span className="font-medium mr-2">Joined:</span>
              <span>{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
            
            {user.lastLoginAt && (
              <div className="flex items-center text-sm">
                <TrendingUp className="w-4 h-4 mr-2 text-gray-500" />
                <span className="font-medium mr-2">Last Login:</span>
                <span>{new Date(user.lastLoginAt).toLocaleDateString()}</span>
              </div>
            )}
            
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">KYC Status:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowKYCDialog(true)}
                >
                  {user.kycVerified ? 'Revoke KYC' : 'Verify KYC'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Moderation */}
        <Card>
          <CardHeader>
            <CardTitle>Moderation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="font-medium">Strikes: {user.strikes}/3</span>
              </div>
              {user.strikes > 0 && user.lastStrikeAt && (
                <span className="text-xs text-gray-500">
                  Last: {new Date(user.lastStrikeAt).toLocaleDateString()}
                </span>
              )}
            </div>
            
            {user.status === 'SUSPENDED' && user.suspensionReason && (
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="flex items-center mb-2">
                  <Ban className="w-4 h-4 text-red-600 mr-2" />
                  <span className="font-medium text-red-900">Suspended</span>
                </div>
                <p className="text-sm text-red-700">{user.suspensionReason}</p>
                {user.suspendedAt && (
                  <p className="text-xs text-red-600 mt-1">
                    Since: {new Date(user.suspendedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
            
            {user.strikes === 0 && user.status === 'ACTIVE' && (
              <div className="text-center py-4 text-gray-500">
                No moderation issues
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Creator Profile (if applicable) */}
      {user.role === UserRole.CREATOR && user.creatorProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="w-5 h-5 mr-2 text-purple-600" />
              Creator Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-gray-600">Trust Score</span>
                <div className="text-xl font-bold">{user.creatorProfile.trustScore}/100</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Total Earnings</span>
                <div className="text-xl font-bold">
                  ${user.creatorProfile.totalEarnings.toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Pending Payout</span>
                <div className="text-xl font-bold">
                  ${user.creatorProfile.pendingPayout.toLocaleString()}
                </div>
              </div>
            </div>
            
            {user.creatorProfile.instagramHandle && (
              <div className="mt-4 pt-4 border-t">
                <span className="text-sm text-gray-600">Instagram: </span>
                <span className="font-medium">@{user.creatorProfile.instagramHandle}</span>
                {user.creatorProfile.instagramFollowers && (
                  <span className="text-sm text-gray-500 ml-2">
                    ({user.creatorProfile.instagramFollowers.toLocaleString()} followers)
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Suspend Dialog */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Provide a reason for suspending this user account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="suspendReason">Suspension Reason</Label>
              <Textarea
                id="suspendReason"
                value={suspendReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSuspendReason(e.target.value)}
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
              {isSubmitting ? 'Suspending...' : 'Suspend User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsuspend Dialog */}
      <AlertDialog open={showUnsuspendDialog} onOpenChange={setShowUnsuspendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsuspend User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unsuspend this user? They will regain full access to the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnsuspend} disabled={isSubmitting}>
              {isSubmitting ? 'Unsuspending...' : 'Unsuspend User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* KYC Dialog */}
      <AlertDialog open={showKYCDialog} onOpenChange={setShowKYCDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {user.kycVerified ? 'Revoke KYC Verification' : 'Verify KYC'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {user.kycVerified
                ? 'Are you sure you want to revoke this user\'s KYC verification?'
                : 'Are you sure you want to mark this user as KYC verified?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleKYCToggle(!user.kycVerified)}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Strike Dialog */}
      <Dialog open={showStrikeDialog} onOpenChange={setShowStrikeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Strike</DialogTitle>
            <DialogDescription>
              Add a strike to this user's account. Users with 3 strikes will be automatically suspended.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="strikeReason">Strike Reason</Label>
              <Textarea
                id="strikeReason"
                value={strikeReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setStrikeReason(e.target.value)}
                placeholder="Enter reason for strike..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStrikeDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddStrike}
              disabled={isSubmitting || strikeReason.length < 10}
            >
              {isSubmitting ? 'Adding...' : 'Add Strike'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
