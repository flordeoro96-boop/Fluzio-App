'use client';

import { useState, useEffect } from 'react';
import { getEventPaymentStatsAction } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, TrendingUp, CreditCard, Coins, Gift, Users } from 'lucide-react';
import Link from 'next/link';

interface EventPaymentStats {
  eventId: string;
  eventTitle: string;
  businessName: string;
  totalRegistrations: number;
  moneyPayments: number;
  pointsPayments: number;
  freeCredits: number;
  complimentary: number;
  totalMoneyCollected: number;
  totalPointsCollected: number;
  currency: string;
  eventDate: string;
}

export default function EventAnalyticsPage() {
  const [stats, setStats] = useState<EventPaymentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEventPaymentStats();
  }, []);

  const loadEventPaymentStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getEventPaymentStatsAction();

      if (!result.success) {
        throw new Error(result.error || 'Failed to load event payment data');
      }

      setStats(result.stats || []);
    } catch (err: any) {
      console.error('[EventAnalytics] Error:', err);
      setError(err.message || 'Failed to load event payment data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totals = stats.reduce(
    (acc, event) => ({
      totalEvents: acc.totalEvents + 1,
      totalRegistrations: acc.totalRegistrations + event.totalRegistrations,
      totalMoneyPayments: acc.totalMoneyPayments + event.moneyPayments,
      totalPointsPayments: acc.totalPointsPayments + event.pointsPayments,
      totalFreeCredits: acc.totalFreeCredits + event.freeCredits,
      totalComplimentary: acc.totalComplimentary + event.complimentary,
      totalMoney: acc.totalMoney + event.totalMoneyCollected,
      totalPoints: acc.totalPoints + event.totalPointsCollected,
    }),
    {
      totalEvents: 0,
      totalRegistrations: 0,
      totalMoneyPayments: 0,
      totalPointsPayments: 0,
      totalFreeCredits: 0,
      totalComplimentary: 0,
      totalMoney: 0,
      totalPoints: 0,
    }
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/events" className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Event Payment Analytics</h1>
          <p className="text-gray-600 mt-1">Track how attendees paid for events - money vs points</p>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      {/* Summary Cards */}
      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                  <div className="text-3xl font-bold text-gray-900">{totals.totalEvents}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Registrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="w-8 h-8 text-green-600" />
                  <div className="text-3xl font-bold text-gray-900">{totals.totalRegistrations}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Money Collected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-8 h-8 text-emerald-600" />
                  <div className="text-3xl font-bold text-gray-900">€{totals.totalMoney.toFixed(2)}</div>
                </div>
                <p className="text-sm text-gray-600 mt-1">{totals.totalMoneyPayments} payments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Points Collected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Coins className="w-8 h-8 text-purple-600" />
                  <div className="text-3xl font-bold text-gray-900">{totals.totalPoints}</div>
                </div>
                <p className="text-sm text-gray-600 mt-1">{totals.totalPointsPayments} payments</p>
              </CardContent>
            </Card>
          </div>

          {/* Event List */}
          {stats.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">No event registration data found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {stats.map((event) => (
                <Card key={event.eventId}>
                  <CardHeader>
                    <CardTitle className="text-xl">{event.eventTitle}</CardTitle>
                    <CardDescription>
                      {event.businessName} • {new Date(event.eventDate).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">Total</div>
                        <div className="text-2xl font-bold text-gray-900">{event.totalRegistrations}</div>
                      </div>

                      <div className="bg-emerald-50 p-3 rounded-lg">
                        <div className="text-sm text-emerald-700 mb-1 flex items-center gap-1">
                          <CreditCard className="w-4 h-4" />
                          Money
                        </div>
                        <div className="text-2xl font-bold text-emerald-900">{event.moneyPayments}</div>
                        <div className="text-xs text-emerald-700 mt-1">
                          €{event.totalMoneyCollected.toFixed(2)}
                        </div>
                      </div>

                      <div className="bg-purple-50 p-3 rounded-lg">
                        <div className="text-sm text-purple-700 mb-1 flex items-center gap-1">
                          <Coins className="w-4 h-4" />
                          Points
                        </div>
                        <div className="text-2xl font-bold text-purple-900">{event.pointsPayments}</div>
                        <div className="text-xs text-purple-700 mt-1">
                          {event.totalPointsCollected} pts
                        </div>
                      </div>

                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-sm text-blue-700 mb-1 flex items-center gap-1">
                          <Gift className="w-4 h-4" />
                          Free Credits
                        </div>
                        <div className="text-2xl font-bold text-blue-900">{event.freeCredits}</div>
                      </div>

                      <div className="bg-amber-50 p-3 rounded-lg">
                        <div className="text-sm text-amber-700 mb-1">Complimentary</div>
                        <div className="text-2xl font-bold text-amber-900">{event.complimentary}</div>
                      </div>

                      <div className="bg-gray-100 p-3 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">Revenue</div>
                        <div className="text-lg font-bold text-gray-900">
                          €{event.totalMoneyCollected.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-600">
                          + {event.totalPointsCollected} pts
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
