'use client';

import { useEffect, useState, useMemo } from 'react';
import { getCountriesAction, createCountryAction } from './actions';
import { Country } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Globe, CheckCircle2, Clock, AlertCircle, Ban, Search, Filter, X, Download } from 'lucide-react';
import Link from 'next/link';

export default function CountriesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [autoCreatedFilter, setAutoCreatedFilter] = useState<string>('ALL');
  const [needsReviewFilter, setNeedsReviewFilter] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('name');
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    currency: '',
    language: '',
    timezone: '',
  });

  useEffect(() => {
    loadCountries();
  }, []);

  async function loadCountries() {
    try {
      setLoading(true);
      console.log('[Countries Page] Starting to load countries...');
      const data = await getCountriesAction();
      console.log('[Countries Page] Received countries:', data);
      setCountries(data);
    } catch (err: any) {
      console.error('[Countries Page] Error loading countries:', err);
      setError(err.message || 'Failed to load countries');
    } finally {
      setLoading(false);
    }
  }

  // Filter and sort countries
  const filteredCountries = useMemo(() => {
    let filtered = countries;

    // Search by name or code
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        c =>
          c.name.toLowerCase().includes(query) ||
          c.code.toLowerCase().includes(query) ||
          c.countryId?.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    // Filter by auto-created
    if (autoCreatedFilter === 'AUTO') {
      filtered = filtered.filter(c => c.autoCreated);
    } else if (autoCreatedFilter === 'MANUAL') {
      filtered = filtered.filter(c => !c.autoCreated);
    }

    // Filter by needs review
    if (needsReviewFilter) {
      filtered = filtered.filter(c => c.needsReview);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'code':
          return a.code.localeCompare(b.code);
        case 'users':
          return (b.stats?.totalUsers || 0) - (a.stats?.totalUsers || 0);
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [countries, searchQuery, statusFilter, autoCreatedFilter, needsReviewFilter, sortBy]);

  // Export to CSV
  const handleExport = () => {
    const csvData = [
      ['Code', 'Name', 'Status', 'Currency', 'Users', 'Businesses', 'Auto-Created', 'Needs Review', 'Created At'],
      ...filteredCountries.map(c => [
        c.code,
        c.name,
        c.status,
        c.currency,
        c.stats?.totalUsers || 0,
        (c.stats?.activeBusinesses || 0) + (c.stats?.aspiringBusinesses || 0),
        c.autoCreated ? 'Yes' : 'No',
        c.needsReview ? 'Yes' : 'No',
        new Date(c.createdAt).toISOString().split('T')[0]
      ])
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `countries-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setAutoCreatedFilter('ALL');
    setNeedsReviewFilter(false);
    setSortBy('name');
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'ALL' || autoCreatedFilter !== 'ALL' || needsReviewFilter;

  async function handleCreateCountry(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      setIsCreating(true);
      setError('');
      
      await createCountryAction(formData);
      
      // Reset form and close dialog
      setFormData({
        code: '',
        name: '',
        currency: '',
        language: '',
        timezone: '',
      });
      setIsDialogOpen(false);
      
      // Reload countries
      await loadCountries();
    } catch (err: any) {
      setError(err.message || 'Failed to create country');
    } finally {
      setIsCreating(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case 'SETUP':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" />
            Setup
          </Badge>
        );
      case 'PENDING_LAUNCH':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending Launch
          </Badge>
        );
      case 'SUSPENDED':
        return (
          <Badge className="bg-red-100 text-red-800">
            <Ban className="w-3 h-3 mr-1" />
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
          <p className="text-gray-600">Loading countries...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Countries</h1>
            <p className="text-gray-600 mt-2">Manage country configurations and launch approvals</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Country
                </Button>
              </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreateCountry}>
              <DialogHeader>
                <DialogTitle>Add New Country</DialogTitle>
                <DialogDescription>
                  Create a new country configuration to begin the launch process
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="code">Country Code</Label>
                  <Input
                    id="code"
                    placeholder="US"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    maxLength={2}
                    required
                  />
                  <p className="text-xs text-gray-500">2-letter ISO code (e.g., US, GB, FR)</p>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="name">Country Name</Label>
                  <Input
                    id="name"
                    placeholder="United States"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    placeholder="USD"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                    maxLength={3}
                    required
                  />
                  <p className="text-xs text-gray-500">3-letter ISO code (e.g., USD, EUR, GBP)</p>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="language">Language</Label>
                  <Select 
                    value={formData.language}
                    onValueChange={(value) => setFormData({ ...formData, language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="ar">Arabic</SelectItem>
                      <SelectItem value="pt">Portuguese</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select 
                    value={formData.timezone}
                    onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                      <SelectItem value="America/Los_Angeles">America/Los_Angeles (PST)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Europe/Paris (CET)</SelectItem>
                      <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                      <SelectItem value="Australia/Sydney">Australia/Sydney (AEDT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isCreating}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Country'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="ml-auto text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                Clear all
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <Label htmlFor="search" className="text-xs text-gray-600">Search</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Search by name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <Label className="text-xs text-gray-600">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="SETUP">Setup</SelectItem>
                  <SelectItem value="PENDING_LAUNCH">Pending Launch</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  <SelectItem value="SOFT_LAUNCH">Soft Launch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Auto-Created Filter */}
            <div>
              <Label className="text-xs text-gray-600">Creation Type</Label>
              <Select value={autoCreatedFilter} onValueChange={setAutoCreatedFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Countries</SelectItem>
                  <SelectItem value="AUTO">Auto-Created</SelectItem>
                  <SelectItem value="MANUAL">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div>
              <Label className="text-xs text-gray-600">Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="code">Code (A-Z)</SelectItem>
                  <SelectItem value="users">Most Users</SelectItem>
                  <SelectItem value="created">Recently Created</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Filters Row */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={needsReviewFilter}
                onChange={(e) => setNeedsReviewFilter(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Show only countries needing review</span>
            </label>
            
            <div className="ml-auto text-sm text-gray-600">
              Showing <strong>{filteredCountries.length}</strong> of <strong>{countries.length}</strong> countries
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Debug Info */}
      {countries.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-semibold text-blue-900 mb-2">🔍 Debug Info:</p>
          <p className="text-xs text-blue-700 mb-3">Total countries loaded: {countries.length}</p>
          
          {/* Stats Summary */}
          <div className="space-y-2 mb-3">
            {countries.map(country => (
              <div key={country.id} className="text-xs bg-white p-2 rounded">
                <strong className="text-blue-900">{country.name} ({country.id}):</strong>
                <span className="ml-2 text-gray-700">
                  👥 Users: {country.stats?.totalUsers || 0} | 
                  🏢 Businesses: {country.stats?.activeBusinesses || 0} | 
                  ⭐ Creators: {country.stats?.verifiedCreators || 0} |
                  🎯 Missions: {country.stats?.activeMissions || 0}
                </span>
              </div>
            ))}
          </div>
          
          {/* Warning if all zeros */}
          {countries.every(c => (c.stats?.totalUsers || 0) === 0) && (
            <div className="mb-3 p-2 bg-yellow-50 border border-yellow-300 rounded">
              <p className="text-xs font-semibold text-yellow-900">⚠️ All stats showing 0?</p>
              <p className="text-xs text-yellow-800 mt-1">
                This means no users were found with <code className="bg-yellow-100 px-1">operatingCountry</code> matching the country codes.
                Check Vercel function logs for detailed query results, or users may need the operatingCountry field set.
              </p>
            </div>
          )}
          
          {countries[0] && (
            <details className="mt-2">
              <summary className="text-xs text-blue-700 cursor-pointer hover:text-blue-900">▸ View raw country data</summary>
              <pre className="text-xs mt-2 bg-white p-2 rounded overflow-auto max-h-64">
                {JSON.stringify(countries[0], null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* Countries Grid */}
      {filteredCountries.length === 0 ? (
        <div className="text-center py-12">
          <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No countries found</h3>
          <p className="text-gray-600 mb-4">
            {hasActiveFilters 
              ? 'Try adjusting your filters or search query' 
              : 'Get started by adding your first country'}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCountries.map((country) => (
            <Link
              key={country.id}
              href={`/admin/countries/${country.id}`}
              className="block bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-300 transition-all overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{country.flag || '🌍'}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base text-gray-900">{country.name}</h3>
                      {country.needsReview && (
                        <Badge className="bg-red-100 text-red-800 text-xs">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Review
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{country.code} • {country.currency} • {country.language.toUpperCase()}</p>
                    {country.autoCreated && (
                      <Badge className="bg-purple-100 text-purple-800 text-xs mt-1">
                        Auto-Created
                      </Badge>
                    )}
                  </div>
                </div>
                {getStatusBadge(country.status)}
              </div>

              {/* Metrics Row */}
              <div className="grid grid-cols-4 divide-x divide-gray-100 bg-gray-50">
                <div className="p-3 text-center">
                  <p className="text-xs text-gray-600 mb-1">Users</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {country.stats?.totalUsers?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="p-3 text-center">
                  <p className="text-xs text-gray-600 mb-1">Creators</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {country.stats?.verifiedCreators?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="p-3 text-center">
                  <p className="text-xs text-gray-600 mb-1">Businesses</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {((country.stats?.activeBusinesses || 0) + (country.stats?.aspiringBusinesses || 0)).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 text-center">
                  <p className="text-xs text-gray-600 mb-1">Missions</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {country.stats?.activeMissions?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
