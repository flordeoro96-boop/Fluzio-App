'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Mission } from '@/lib/types';
import { getMissionByIdAction } from './actions';

export default function MissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMission();
  }, [params.id]);

  const loadMission = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getMissionByIdAction(params.id as string);
      setMission(result.mission);
    } catch (err: any) {
      setError(err.message || 'Failed to load mission');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, any> = {
      PENDING_APPROVAL: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      APPROVED: { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      REJECTED: { color: 'bg-red-100 text-red-800', icon: XCircle },
      FLAGGED: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
      ACTIVE: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle2 },
      COMPLETED: { color: 'bg-gray-100 text-gray-800', icon: CheckCircle2 },
    };
    const config = configs[status] || { color: 'bg-gray-100 text-gray-800', icon: Clock };
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">Loading mission...</div>
      </div>
    );
  }

  if (error || !mission) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-red-800">{error || 'Mission not found'}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Missions
      </Button>

      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">
                  {mission.title || 'Untitled Mission'}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {getStatusBadge(mission.status)}
                  <Badge variant="outline">{mission.countryId}</Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {mission.description && (
              <p className="text-gray-700 mb-4">{mission.description}</p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>{mission.location || 'N/A'}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
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

              {mission.pointsReward && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span>{mission.pointsReward} points</span>
                </div>
              )}

              {mission.businessName && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span>{mission.businessName}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Approval History */}
        {(mission.approvedBy || mission.rejectedBy) && (
          <Card>
            <CardHeader>
              <CardTitle>Approval History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mission.approvedBy && (
                <div>
                  <div className="text-sm font-medium text-green-800">Approved</div>
                  <div className="text-sm text-gray-600">By: {mission.approvedBy}</div>
                  {mission.approvedAt && (
                    <div className="text-xs text-gray-500">
                      {new Date(
                        typeof mission.approvedAt === 'object' && 'toMillis' in mission.approvedAt
                          ? (mission.approvedAt as any).toMillis()
                          : mission.approvedAt
                      ).toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              {mission.rejectedBy && (
                <div>
                  <div className="text-sm font-medium text-red-800">Rejected</div>
                  <div className="text-sm text-gray-600">By: {mission.rejectedBy}</div>
                  {mission.rejectionReason && (
                    <div className="text-sm text-gray-700 mt-1">
                      Reason: {mission.rejectionReason}
                    </div>
                  )}
                  {mission.rejectedAt && (
                    <div className="text-xs text-gray-500">
                      {new Date(
                        typeof mission.rejectedAt === 'object' && 'toMillis' in mission.rejectedAt
                          ? (mission.rejectedAt as any).toMillis()
                          : mission.rejectedAt
                      ).toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Raw Data (for debugging) */}
        <Card>
          <CardHeader>
            <CardTitle>Mission Data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-50 p-4 rounded overflow-x-auto">
              {JSON.stringify(mission, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
