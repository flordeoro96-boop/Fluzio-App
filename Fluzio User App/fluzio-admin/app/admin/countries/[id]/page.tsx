'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  getCountryByIdAction,
  updateChecklistAction,
  launchCountryAction,
  suspendCountryAction,
} from '../actions';
import { Country, LaunchChecklistItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
  Globe,
  CheckCircle2,
  Clock,
  AlertCircle,
  Ban,
  Rocket,
  Edit,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';

export default function CountryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const countryId = params?.id as string;

  const [country, setCountry] = useState<Country | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showLaunchDialog, setShowLaunchDialog] = useState(false);

  useEffect(() => {
    loadCountry();
  }, [countryId]);

  async function loadCountry() {
    try {
      setLoading(true);
      const data = await getCountryByIdAction(countryId);
      setCountry(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load country');
    } finally {
      setLoading(false);
    }
  }

  async function handleChecklistToggle(itemId: string) {
    if (!country) return;

    try {
      setSaving(true);
      const updatedChecklist = country.launchChecklist.map((item) =>
        item.id === itemId
          ? {
              ...item,
              completed: !item.completed,
              completedAt: !item.completed ? new Date() : undefined,
            }
          : item
      );

      await updateChecklistAction(countryId, updatedChecklist);
      setCountry({ ...country, launchChecklist: updatedChecklist });
    } catch (err: any) {
      setError(err.message || 'Failed to update checklist');
    } finally {
      setSaving(false);
    }
  }

  async function handleLaunch() {
    try {
      setSaving(true);
      await launchCountryAction(countryId);
      await loadCountry();
      setShowLaunchDialog(false);
    } catch (err: any) {
      setError(err.message || 'Failed to launch country');
    } finally {
      setSaving(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Active
          </Badge>
        );
      case 'SETUP':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="w-4 h-4 mr-1" />
            Setup
          </Badge>
        );
      case 'PENDING_LAUNCH':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-4 h-4 mr-1" />
            Pending Launch
          </Badge>
        );
      case 'SUSPENDED':
        return (
          <Badge className="bg-red-100 text-red-800">
            <Ban className="w-4 h-4 mr-1" />
            Suspended
          </Badge>
        );
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Globe className="w-8 h-8 text-blue-600 mx-auto mb-2 animate-pulse" />
          <p className="text-gray-600">Loading country...</p>
        </div>
      </div>
    );
  }

  if (!country) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Country not found</p>
        <Button asChild variant="outline">
          <Link href="/admin/countries">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Countries
          </Link>
        </Button>
      </div>
    );
  }

  const completedItems = country.launchChecklist.filter((item) => item.completed).length;
  const totalItems = country.launchChecklist.length;
  const requiredItems = country.launchChecklist.filter((item) => item.required);
  const completedRequired = requiredItems.filter((item) => item.completed).length;
  const canLaunch =
    country.status === 'SETUP' && completedRequired === requiredItems.length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/admin/countries">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Countries
          </Link>
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-6xl">{country.flag || '🌍'}</div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{country.name}</h1>
              <p className="text-gray-600 mt-1">
                {country.code} • {country.currency} • {country.language.toUpperCase()}
              </p>
              <div className="mt-2">{getStatusBadge(country.status)}</div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" asChild>
              <Link href={`/admin/countries/${countryId}/edit`}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Link>
            </Button>
            {canLaunch && (
              <Button onClick={() => setShowLaunchDialog(true)}>
                <Rocket className="w-4 h-4 mr-2" />
                Launch Country
              </Button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Users</span>
                <span className="font-semibold text-lg">
                  {country.stats?.totalUsers?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Businesses</span>
                <span className="font-semibold text-lg">
                  {country.stats?.activeBusinesses?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Verified Creators</span>
                <span className="font-semibold text-lg">
                  {country.stats?.verifiedCreators?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Missions</span>
                <span className="font-semibold text-lg">
                  {country.stats?.activeMissions?.toLocaleString() || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Business Verification</span>
                <Badge variant={country.settings?.enableBusinessVerification ? 'default' : 'secondary'}>
                  {country.settings?.enableBusinessVerification ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Creator Payouts</span>
                <Badge variant={country.settings?.enableCreatorPayouts ? 'default' : 'secondary'}>
                  {country.settings?.enableCreatorPayouts ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Events</span>
                <Badge variant={country.settings?.enableEvents ? 'default' : 'secondary'}>
                  {country.settings?.enableEvents ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Launch Checklist */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Launch Checklist</CardTitle>
                <div className="text-sm text-gray-600">
                  {completedItems} / {totalItems} completed
                </div>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(completedItems / totalItems) * 100}%` }}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {country.launchChecklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => handleChecklistToggle(item.id)}
                      disabled={saving || country.status !== 'SETUP'}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4
                          className={`font-medium ${
                            item.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                          }`}
                        >
                          {item.title}
                        </h4>
                        {item.required && (
                          <Badge variant="outline" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      {item.completed && item.completedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Completed {new Date(item.completedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {canLaunch && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-green-900">Ready to Launch</h4>
                      <p className="text-sm text-green-700 mt-1">
                        All required checklist items are complete. You can now launch this country.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Launch Confirmation Dialog */}
      <AlertDialog open={showLaunchDialog} onOpenChange={setShowLaunchDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Launch {country.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will activate the country and make it available to users. This action requires all required checklist items to be completed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLaunch} disabled={saving}>
              {saving ? 'Launching...' : 'Launch Country'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
