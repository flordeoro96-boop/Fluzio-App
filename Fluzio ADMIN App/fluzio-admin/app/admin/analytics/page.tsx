'use client';

import { useEffect, useState } from 'react';
import { getAnalyticsDataAction, AnalyticsData } from './actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  DollarSign,
  Activity,
  BarChart3,
  Globe,
  Award,
} from 'lucide-react';

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      setLoading(true);
      setError('');
      const analytics = await getAnalyticsDataAction();
      setData(analytics);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error || 'Failed to load analytics'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-2">Comprehensive insights and performance metrics</p>
      </div>

      {/* User Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.userEngagement.map((metric) => {
          const isPositive = metric.change.startsWith('+');
          return (
            <Card key={metric.metric} className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {metric.metric}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {metric.value.toLocaleString()}
                  {metric.metric.includes('Rate') && '%'}
                </div>
                <div className="flex items-center">
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {metric.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs last month</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* User Growth Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">User Growth (Last 6 Months)</CardTitle>
            <Badge variant="outline" className="text-sm">
              <TrendingUp className="w-3 h-3 mr-1" />
              Trending
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.userGrowth.map((item, index) => {
              const maxCount = Math.max(...data.userGrowth.map(i => i.count));
              const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
              const monthName = new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

              return (
                <div key={item.month} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{monthName}</span>
                    <span className="font-bold text-gray-900">{item.count.toLocaleString()} users</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Country */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center">
              <Globe className="w-5 h-5 mr-2 text-green-600" />
              Revenue by Country
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.revenueByCountry.map((item, index) => {
                const maxRevenue = Math.max(...data.revenueByCountry.map(i => i.revenue));
                const percentage = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;

                return (
                  <div key={item.country} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-lg font-bold text-gray-700 mr-2">#{index + 1}</span>
                        <Badge variant="outline">{item.country}</Badge>
                      </div>
                      <span className="font-bold text-green-600">
                        ${item.revenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-full rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Businesses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center">
              <Award className="w-5 h-5 mr-2 text-yellow-600" />
              Top Performing Businesses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topBusinesses.map((business, index) => (
                <div
                  key={business.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="ml-3">
                      <p className="font-semibold text-gray-900">{business.name}</p>
                      <p className="text-xs text-gray-500">{business.orders} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">${business.revenue.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Country Metrics Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
            Performance by Country
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Country
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Users className="w-4 h-4 inline mr-1" />
                    Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Building2 className="w-4 h-4 inline mr-1" />
                    Businesses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Revenue/Business
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.countryMetrics.map((country) => {
                  const avgRevenue = country.businesses > 0 
                    ? country.revenue / country.businesses 
                    : 0;

                  return (
                    <tr key={country.country} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline" className="font-semibold">
                          {country.country}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {country.users.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {country.businesses.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                        ${country.revenue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        ${Math.round(avgRevenue).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
