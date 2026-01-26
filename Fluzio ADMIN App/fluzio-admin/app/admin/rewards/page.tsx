'use client';

import { useState, useEffect } from 'react';
import { getRedemptionStatsAction } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, TrendingUp, Award, Users, MapPin } from 'lucide-react';

interface BusinessRedemptionStats {
  businessId: string;
  businessName: string;
  city: string;
  country: string;
  totalRedemptions: number;
  uniqueCustomers: number;
  totalPointsRedeemed: number;
  topRewards: Array<{
    rewardId: string;
    rewardTitle: string;
    count: number;
  }>;
}

export default function RewardsPage() {
  const [stats, setStats] = useState<BusinessRedemptionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState('All');
  const [cityFilter, setCityFilter] = useState('All');
  const [countries, setCountries] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    loadRedemptionStats();
  }, []);

  const loadRedemptionStats = async () => {
    try {
      setLoading(true);
      
      const result = await getRedemptionStatsAction();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load redemption data');
      }

      setStats(result.stats || []);
      setCountries(result.countries || ['All']);
      setCities(result.cities || ['All']);
    } catch (error) {
      console.error('[RewardsPage] Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStats = stats.filter(stat => {
    const matchesSearch = !searchQuery || 
      stat.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stat.city.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCountry = countryFilter === 'All' || stat.country === countryFilter;
    const matchesCity = cityFilter === 'All' || stat.city === cityFilter;

    return matchesSearch && matchesCountry && matchesCity;
  });

  const totalRedemptions = filteredStats.reduce((sum, s) => sum + s.totalRedemptions, 0);
  const totalCustomers = filteredStats.reduce((sum, s) => sum + s.uniqueCustomers, 0);
  const totalPoints = filteredStats.reduce((sum, s) => sum + s.totalPointsRedeemed, 0);

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Rewards Analytics</h1>
          <p className="text-gray-600 mt-2">Loading redemption statistics...</p>
        </div>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Rewards Analytics</h1>
        <p className="text-gray-600 mt-2">Redemption statistics by business</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Redemptions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{totalRedemptions.toLocaleString()}</div>
              <Award className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Unique Customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{totalCustomers.toLocaleString()}</div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Points Redeemed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{totalPoints.toLocaleString()}</div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search Business</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Search by name or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="country">Country</Label>
              <select
                id="country"
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="city">City</Label>
              <select
                id="city"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Rankings */}
      <Card>
        <CardHeader>
          <CardTitle>Business Rankings</CardTitle>
          <CardDescription>Sorted by number of unique customers</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredStats.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No redemption data found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStats.map((stat, index) => (
                <div
                  key={stat.businessId}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                        ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-100 text-gray-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-50 text-blue-700'}
                      `}>
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{stat.businessName}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <MapPin className="w-4 h-4" />
                          <span>{stat.city}, {stat.country}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="text-center p-2 bg-purple-50 rounded">
                      <div className="text-2xl font-bold text-purple-700">{stat.uniqueCustomers}</div>
                      <div className="text-xs text-gray-600">Customers</div>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <div className="text-2xl font-bold text-blue-700">{stat.totalRedemptions}</div>
                      <div className="text-xs text-gray-600">Redemptions</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="text-2xl font-bold text-green-700">{stat.totalPointsRedeemed.toLocaleString()}</div>
                      <div className="text-xs text-gray-600">Points</div>
                    </div>
                  </div>

                  {stat.topRewards.length > 0 && (
                    <div className="border-t pt-3">
                      <div className="text-sm font-medium text-gray-700 mb-2">Top Rewards:</div>
                      <div className="space-y-1">
                        {stat.topRewards.map((reward, idx) => (
                          <div key={reward.rewardId} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 truncate flex-1">
                              {idx + 1}. {reward.rewardTitle}
                            </span>
                            <span className="font-semibold text-purple-600 ml-2">{reward.count}x</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
