'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  getCountryByIdAction,
  updateChecklistAction,
  launchCountryAction,
  suspendCountryAction,
  getCitiesByCountryAction,
  getBusinessesByCountryAction,
  getCreatorsByCountryAction,
} from '../actions';
import { Country, LaunchChecklistItem, City } from '@/lib/types';
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
  Users,
  Building2,
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import Link from 'next/link';

type TabType = 'overview' | 'cities' | 'businesses' | 'creators' | 'launch' | 'analytics';

export default function CountryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const countryId = params?.id as string;
  const currentTab = (searchParams?.get('tab') as TabType) || 'overview';

  const [country, setCountry] = useState<Country | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [businessesLoading, setBusinessesLoading] = useState(false);
  const [creatorsLoading, setCreatorsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showLaunchDialog, setShowLaunchDialog] = useState(false);

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: Globe },
    { id: 'cities', label: 'Cities', icon: MapPin },
    { id: 'businesses', label: 'Businesses', icon: Building2 },
    { id: 'creators', label: 'Creators', icon: Users },
    { id: 'launch', label: 'Launch & Rules', icon: Rocket },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const setTab = (tab: TabType) => {
    router.push(`/admin/countries/${countryId}?tab=${tab}`);
  };

  useEffect(() => {
    loadCountry();
  }, [countryId]);

  useEffect(() => {
    if (currentTab === 'cities' && country) {
      loadCities();
    } else if (currentTab === 'businesses' && country) {
      loadBusinesses();
    } else if (currentTab === 'creators' && country) {
      loadCreators();
    }
  }, [currentTab, country]);

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

  async function loadCities() {
    if (!country) return;
    try {
      setCitiesLoading(true);
      const countryCode = country.countryId || country.code || country.id;
      const data = await getCitiesByCountryAction(countryCode);
      setCities(data);
    } catch (err: any) {
      console.error('Failed to load cities:', err);
    } finally {
      setCitiesLoading(false);
    }
  }

  async function loadBusinesses() {
    if (!country) return;
    try {
      setBusinessesLoading(true);
      const countryCode = country.countryId || country.code || country.id;
      const data = await getBusinessesByCountryAction(countryCode);
      setBusinesses(data);
    } catch (err: any) {
      console.error('Failed to load businesses:', err);
    } finally {
      setBusinessesLoading(false);
    }
  }

  async function loadCreators() {
    if (!country) return;
    try {
      setCreatorsLoading(true);
      const countryCode = country.countryId || country.code || country.id;
      const data = await getCreatorsByCountryAction(countryCode);
      setCreators(data);
    } catch (err: any) {
      console.error('Failed to load creators:', err);
    } finally {
      setCreatorsLoading(false);
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

  const completedItems = country.launchChecklist?.filter((item) => item.completed).length || 0;
  const totalItems = country.launchChecklist?.length || 0;
  const requiredItems = country.launchChecklist?.filter((item) => item.required) || [];
  const completedRequired = requiredItems.filter((item) => item.completed).length;
  const canLaunch =
    country.status === 'SETUP' && completedRequired === requiredItems.length && requiredItems.length > 0;

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
            {/* Edit functionality coming soon
            <Button variant="outline" asChild>
              <Link href={`/admin/countries/${countryId}/edit`}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Link>
            </Button>
            */}
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

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={`flex items-center space-x-2 pb-4 border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {currentTab === 'overview' && (
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
                <span className="text-gray-600">Customers</span>
                <span className="font-semibold text-lg">
                  {country.stats?.customers?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Businesses</span>
                <span className="font-semibold text-lg text-green-600">
                  {country.stats?.activeBusinesses?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Aspiring Businesses</span>
                <span className="font-semibold text-lg text-orange-600">
                  {country.stats?.aspiringBusinesses?.toLocaleString() || 0}
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
                <CardTitle>Country Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Status</span>
                  <div className="mt-1">{getStatusBadge(country.status)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Timezone</span>
                  <p className="mt-1 font-medium">{country.timezone || 'Not set'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Currency</span>
                  <p className="mt-1 font-medium">{country.currency}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Language</span>
                  <p className="mt-1 font-medium">{country.language.toUpperCase()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      )}

      {currentTab === 'cities' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Cities in {country.name}</CardTitle>
                <div className="text-sm text-gray-600">
                  {cities.length} {cities.length === 1 ? 'city' : 'cities'}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {citiesLoading ? (
                <div className="text-center py-12">
                  <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-2 animate-pulse" />
                  <p className="text-gray-600">Loading cities...</p>
                </div>
              ) : cities.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-2">No cities found</p>
                  <p className="text-sm text-gray-500">
                    Cities will appear automatically as users sign up with addresses in this country.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">City</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Users</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Businesses</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Creators</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Missions</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cities.map((city) => (
                        <tr key={city.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">{city.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={city.status === 'ACTIVE' ? 'default' : 'secondary'}
                              className={city.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : ''}
                            >
                              {city.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right font-medium">
                            {city.stats.totalUsers.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-medium">
                            {city.stats.activeBusinesses.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-medium">
                            {city.stats.verifiedCreators.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-medium">
                            {city.stats.activeMissions.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {new Date(city.stats.lastUpdated).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {currentTab === 'businesses' && (
        <Card>
          <CardHeader>
            <CardTitle>Businesses in {country?.name}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{businesses.length} total businesses</p>
          </CardHeader>
          <CardContent>
            {businessesLoading ? (
              <div className="text-center py-8 text-gray-500">Loading businesses...</div>
            ) : businesses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No businesses found in this country</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Business
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        City
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Level
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {businesses.map((business) => (
                      <tr key={business.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            {business.photoUrl ? (
                              <img
                                src={business.photoUrl}
                                alt={business.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">{business.name || 'Unnamed Business'}</div>
                              <div className="text-sm text-gray-500">{business.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {business.city || business.homeCity || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {business.category || '-'}
                        </td>
                        <td className="py-3 px-4">
                          {(() => {
                            const level = business.businessLevel || business.level || 1;
                            const isAspiring = level === 1;
                            return (
                              <div className="flex items-center space-x-2">
                                <Badge variant={isAspiring ? "secondary" : "default"} className={isAspiring ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"}>
                                  Level {level}
                                </Badge>
                                {isAspiring && (
                                  <span className="text-xs text-orange-600">Aspiring</span>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(business.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/admin/businesses/${business.id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {currentTab === 'creators' && (
        <Card>
          <CardHeader>
            <CardTitle>Creators in {country?.name}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{creators.length} total creators</p>
          </CardHeader>
          <CardContent>
            {creatorsLoading ? (
              <div className="text-center py-8 text-gray-500">Loading creators...</div>
            ) : creators.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No creators found in this country</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Creator
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        City
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {creators.map((creator) => (
                      <tr key={creator.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            {creator.photoUrl ? (
                              <img
                                src={creator.photoUrl}
                                alt={creator.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <Users className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">{creator.name || 'Unnamed Creator'}</div>
                              <div className="text-sm text-gray-500">{creator.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {creator.city || creator.homeCity || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {creator.category || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={creator.verificationStatus === 'APPROVED' ? 'default' : 'outline'}>
                            {creator.verificationStatus || 'Pending'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(creator.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/admin/creators/${creator.id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {currentTab === 'launch' && (
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
              {!country.launchChecklist || country.launchChecklist.length === 0 ? (
                <div className="text-center py-12">
                  <Rocket className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Launch Checklist</h3>
                  <p className="text-gray-600 mb-6">
                    This country doesn't have a launch checklist configured yet.
                  </p>
                  
                  {/* Default Checklist Template */}
                  <div className="text-left max-w-2xl mx-auto space-y-3">
                    <p className="text-sm font-medium text-gray-700 mb-4">Typical launch checklist items include:</p>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-start space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span>Legal entity and business registration</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span>Payment processing integration</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span>Tax and compliance setup</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span>Customer support infrastructure</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span>Localization and translations</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span>Marketing and launch campaigns</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span>Partner onboarding and training</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">
                      Contact a system administrator to configure the launch checklist for this country.
                    </p>
                  </div>
                </div>
              ) : (
                <>
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
            </>
            )}
            </CardContent>
          </Card>
        </div>
      )}

      {currentTab === 'analytics' && (
        <div className="space-y-6">
          {/* Key Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {country.stats?.totalUsers?.toLocaleString() || 0}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
                <div className="flex items-center mt-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600">Growth metric coming soon</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Businesses</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {((country.stats?.activeBusinesses || 0) + (country.stats?.aspiringBusinesses || 0)).toLocaleString()}
                    </p>
                  </div>
                  <Building2 className="w-8 h-8 text-green-500" />
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  <span className="text-green-600 font-medium">{country.stats?.activeBusinesses || 0} active</span>
                  {' • '}
                  <span className="text-orange-600 font-medium">{country.stats?.aspiringBusinesses || 0} aspiring</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Creators</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {country.stats?.verifiedCreators?.toLocaleString() || 0}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-purple-500" />
                </div>
                <div className="flex items-center mt-2 text-sm">
                  <span className="text-gray-600">Verified creators</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Customers</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {country.stats?.customers?.toLocaleString() || 0}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-orange-500" />
                </div>
                <div className="flex items-center mt-2 text-sm">
                  <span className="text-gray-600">Registered members</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>User Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Customers</span>
                    <span className="text-sm text-gray-600">
                      {country.stats?.customers || 0} ({((country.stats?.customers || 0) / (country.stats?.totalUsers || 1) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: `${((country.stats?.customers || 0) / (country.stats?.totalUsers || 1) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Active Businesses (Level 2+)</span>
                    <span className="text-sm text-gray-600">
                      {country.stats?.activeBusinesses || 0} ({((country.stats?.activeBusinesses || 0) / (country.stats?.totalUsers || 1) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${((country.stats?.activeBusinesses || 0) / (country.stats?.totalUsers || 1) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Aspiring Businesses (Level 1)</span>
                    <span className="text-sm text-gray-600">
                      {country.stats?.aspiringBusinesses || 0} ({((country.stats?.aspiringBusinesses || 0) / (country.stats?.totalUsers || 1) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{ width: `${((country.stats?.aspiringBusinesses || 0) / (country.stats?.totalUsers || 1) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Verified Creators</span>
                    <span className="text-sm text-gray-600">
                      {country.stats?.verifiedCreators || 0} ({((country.stats?.verifiedCreators || 0) / (country.stats?.totalUsers || 1) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${((country.stats?.verifiedCreators || 0) / (country.stats?.totalUsers || 1) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Engagement Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Maturity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Business Conversion Rate</p>
                      <p className="text-xs text-gray-500 mt-1">Aspiring → Active</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {(() => {
                        const total = (country.stats?.activeBusinesses || 0) + (country.stats?.aspiringBusinesses || 0);
                        const rate = total > 0 ? ((country.stats?.activeBusinesses || 0) / total * 100) : 0;
                        return rate.toFixed(1);
                      })()}%
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Active Missions</p>
                      <p className="text-xs text-gray-500 mt-1">Currently running</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {country.stats?.activeMissions?.toLocaleString() || 0}
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Cities</p>
                      <p className="text-xs text-gray-500 mt-1">Active locations</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {cities.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Country Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Current Status</p>
                      <p className="text-xs text-gray-500 mt-1">Launch phase</p>
                    </div>
                    {getStatusBadge(country.status)}
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Launch Progress</p>
                      <p className="text-xs text-gray-500 mt-1">Checklist completion</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0}%
                    </p>
                  </div>

                  {country.launchedAt && (
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">Launched On</p>
                        <p className="text-xs text-gray-500 mt-1">Go-live date</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(country.launchedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Last Updated</p>
                      <p className="text-xs text-gray-500 mt-1">Data refresh</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(country.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Future Analytics Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Growth Trends</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Historical data and trends coming soon</p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="font-medium">Time-series Analytics</p>
                <p className="text-sm mt-2">User growth, engagement trends, and business metrics over time</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
