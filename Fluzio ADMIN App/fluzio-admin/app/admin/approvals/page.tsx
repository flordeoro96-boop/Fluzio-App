'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Creator, Business, VerificationStatus, UserRole } from '@/lib/types';
import { Clock, User, Building2, AlertCircle } from 'lucide-react';

export default function ApprovalsPage() {
  const [pendingCreators, setPendingCreators] = useState<Creator[]>([]);
  const [pendingBusinesses, setPendingBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingItems();
  }, []);

  async function loadPendingItems() {
    try {
      setLoading(true);
      
      console.log('⏳ Loading pending approvals...');
      
      // Load creators from users collection with CREATOR role
      const { getUsersAction } = await import('../users/actions');
      const creatorsData = await getUsersAction({ role: UserRole.CREATOR });
      
      // Map to Creator format
      const creators = creatorsData.map((user: any) => ({
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
      
      setPendingCreators(creators.filter(c => c.verificationStatus === VerificationStatus.PENDING));

      // Load businesses from users collection with BUSINESS role
      const businessesData = await getUsersAction({ role: UserRole.BUSINESS });
      
      // Map to Business format
      const businesses = businessesData.map((user: any) => ({
        id: user.id,
        countryCode: user.countryCode || 'DE',
        name: user.name || user.handle || user.legalName || user.displayName || user.email?.split('@')[0] || 'Unknown Business',
        industry: user.category || user.subCategory || 'Other',
        description: user.description || '',
        tier: (user.subscriptionLevel || user.subscription?.tier || 'FREE') as any,
        status: user.status || 'ACTIVE',
        verified: user.kycVerified || false,
        verificationStatus: (user.verificationStatus || user.approvalStatus || 'PENDING') as VerificationStatus,
        email: user.email,
        phoneNumber: user.phone || user.phoneNumber,
        website: user.website,
        address: user.street && user.city ? `${user.street}, ${user.city}` : user.address,
        ownerName: user.name || user.handle || user.displayName || user.email?.split('@')[0] || 'Unknown',
        ownerEmail: user.email,
        stats: {
          totalMissions: 0,
          activeMissions: 0,
          totalRedemptions: 0,
          totalSpent: 0,
        },
        riskScore: 0,
        disputeCount: 0,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));
      
      setPendingBusinesses(businesses.filter(b => b.verificationStatus === VerificationStatus.PENDING));
      
      console.log('✅ Pending creators:', creators.filter(c => c.verificationStatus === VerificationStatus.PENDING).length);
      console.log('✅ Pending businesses:', businesses.filter(b => b.verificationStatus === VerificationStatus.PENDING).length);
    } catch (error) {
      console.error('❌ Failed to load pending items:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Clock className="w-12 h-12 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading pending approvals...</p>
        </div>
      </div>
    );
  }

  const totalPending = pendingCreators.length + pendingBusinesses.length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Approvals</h1>
        <p className="text-gray-600 mt-2">Review and approve pending creators and businesses</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{totalPending}</div>
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Creators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{pendingCreators.length}</div>
              <User className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Businesses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{pendingBusinesses.length}</div>
              <Building2 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Creators and Businesses */}
      <Tabs defaultValue="creators" className="w-full">
        <TabsList>
          <TabsTrigger value="creators">
            Creators ({pendingCreators.length})
          </TabsTrigger>
          <TabsTrigger value="businesses">
            Businesses ({pendingBusinesses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="creators" className="mt-6">
          {pendingCreators.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No creators pending approval</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingCreators.map((creator) => (
                <Card key={creator.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold">{creator.displayName}</h3>
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending Review
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Country:</span> {creator.countryCode}
                          </div>
                          <div>
                            <span className="font-medium">Submitted:</span>{' '}
                            {creator.createdAt ? new Date(creator.createdAt).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      </div>

                      <div className="ml-4">
                        <Link href={`/admin/creators/${creator.id}`}>
                          <Button>Review</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="businesses" className="mt-6">
          {pendingBusinesses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No businesses pending approval</p>
                <p className="text-sm text-gray-400 mt-2">
                  Businesses are created in the User App when business owners sign up
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingBusinesses.map((business) => (
                <Card key={business.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold">{business.name}</h3>
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending Review
                          </Badge>
                          <Badge variant="outline">{business.tier}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Industry:</span> {business.industry}
                          </div>
                          <div>
                            <span className="font-medium">Country:</span> {business.countryCode}
                          </div>
                          <div>
                            <span className="font-medium">Address:</span> {business.address || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Submitted:</span>{' '}
                            {business.createdAt ? new Date(business.createdAt).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      </div>

                      <div className="ml-4">
                        <Link href={`/admin/businesses/${business.id}`}>
                          <Button>Review</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
