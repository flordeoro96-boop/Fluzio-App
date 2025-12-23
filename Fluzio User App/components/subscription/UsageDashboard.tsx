import React, { useState, useEffect } from 'react';
import { Target, Users, Zap, TrendingUp, AlertCircle, ChevronRight } from 'lucide-react';
import { db } from '../../services/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import type { FluzioBusinessUser } from '../../src/lib/levels/subscriptionTypes';

interface UsageDashboardProps {
  userId: string;
  onUpgradeClick: () => void;
}

export const UsageDashboard: React.FC<UsageDashboardProps> = ({ userId, onUpgradeClick }) => {
  const [userData, setUserData] = useState<FluzioBusinessUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setUserData(snapshot.data() as FluzioBusinessUser);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="text-center p-8 bg-red-50 rounded-xl">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <p className="text-red-700 font-semibold">Failed to load usage data</p>
      </div>
    );
  }

  const { missionUsage, meetupUsage, growthCredits, subscription } = userData;

  const calculatePercentage = (current: number, max: number): number => {
    if (max === -1) return 0; // Unlimited
    if (max === 0) return 0; // No access
    return Math.min((current / max) * 100, 100);
  };

  const getStatusColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatNumber = (num: number): string => {
    return num === -1 ? '∞' : num.toLocaleString();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-2">Your Usage Dashboard</h2>
        <p className="opacity-90">
          Current Plan: <span className="font-bold">{subscription.tier}</span> • 
          <span className="ml-2">{subscription.billingCycle === 'ANNUAL' ? 'Annual' : 'Monthly'} billing</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Growth Credits Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-100 hover:border-purple-300 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-[#1E0E62]">Growth Credits</h3>
              <p className="text-sm text-[#8F8FA3]">Available balance</p>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-[#1E0E62]">
                {growthCredits.available.toLocaleString()}
              </span>
              <span className="text-sm text-[#8F8FA3]">FGC</span>
            </div>
            <p className="text-sm text-green-600 font-semibold mt-1">
              +{growthCredits.monthlyAllocation.toLocaleString()} credits next month
            </p>
          </div>

          {/* Usage This Month */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[#8F8FA3]">Used this month</span>
              <span className="font-semibold text-[#1E0E62]">{growthCredits.usageThisMonth.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min((growthCredits.usageThisMonth / growthCredits.monthlyAllocation) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#8F8FA3]">Total Earned</span>
              <span className="font-semibold">{growthCredits.totalEarned.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8F8FA3]">Total Purchased</span>
              <span className="font-semibold">{growthCredits.totalPurchased.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8F8FA3]">Total Used</span>
              <span className="font-semibold">{growthCredits.used.toLocaleString()}</span>
            </div>
          </div>

          {growthCredits.available < 100 && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Low balance! Purchase more credits
              </p>
            </div>
          )}

          <button className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all">
            Purchase Credits
          </button>
        </div>

        {/* Mission Usage Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-100 hover:border-blue-300 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-[#1E0E62]">Missions</h3>
              <p className="text-sm text-[#8F8FA3]">This month</p>
            </div>
          </div>

          {missionUsage.maxMissionsPerMonth === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#8F8FA3] mb-4">Mission creation not available at Level 1</p>
              <button
                onClick={onUpgradeClick}
                className="text-blue-600 font-semibold flex items-center gap-1 mx-auto hover:gap-2 transition-all"
              >
                Reach Level 2 to unlock <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-4xl font-bold text-[#1E0E62]">
                    {missionUsage.missionsCreatedThisMonth}
                  </span>
                  <span className="text-lg text-[#8F8FA3]">
                    / {formatNumber(missionUsage.maxMissionsPerMonth)}
                  </span>
                </div>
                
                {missionUsage.maxMissionsPerMonth !== -1 && (
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${getStatusColor(
                        calculatePercentage(missionUsage.missionsCreatedThisMonth, missionUsage.maxMissionsPerMonth)
                      )}`}
                      style={{
                        width: `${calculatePercentage(missionUsage.missionsCreatedThisMonth, missionUsage.maxMissionsPerMonth)}%`
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#8F8FA3]">Active Missions</span>
                    <span className="font-semibold">{missionUsage.activeMissions}</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#8F8FA3]">Max Participants</span>
                    <span className="font-semibold">{formatNumber(missionUsage.maxParticipantsPerMission)}</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#8F8FA3]">Geographic Reach</span>
                    <span className="font-semibold text-xs">{missionUsage.geographicReach.replace('_', ' ')}</span>
                  </div>
                </div>

                {missionUsage.boostsAvailableThisMonth > 0 && (
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-yellow-800 font-semibold">Mission Boosts</span>
                      <span className="font-bold text-yellow-700">
                        {missionUsage.boostsAvailableThisMonth - missionUsage.boostsUsedThisMonth} left
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {missionUsage.maxMissionsPerMonth !== -1 && 
               calculatePercentage(missionUsage.missionsCreatedThisMonth, missionUsage.maxMissionsPerMonth) >= 80 && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800 font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Approaching monthly limit!
                  </p>
                  <button
                    onClick={onUpgradeClick}
                    className="text-xs text-blue-600 font-semibold mt-1 flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    Upgrade for more missions <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Meetup Usage Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-100 hover:border-green-300 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-[#1E0E62]">Meetups</h3>
              <p className="text-sm text-[#8F8FA3]">This month</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Hosting */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-sm text-[#8F8FA3]">Hosted</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-[#1E0E62]">
                    {meetupUsage.meetupsHostedThisMonth}
                  </span>
                  <span className="text-sm text-[#8F8FA3]">
                    / {formatNumber(meetupUsage.maxHostPerMonth)}
                  </span>
                </div>
              </div>
              
              {meetupUsage.maxHostPerMonth === 0 ? (
                <div className="bg-gray-100 rounded-lg p-2 text-center">
                  <p className="text-xs text-[#8F8FA3]">Hosting requires Level 2+</p>
                </div>
              ) : meetupUsage.maxHostPerMonth !== -1 ? (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getStatusColor(
                      calculatePercentage(meetupUsage.meetupsHostedThisMonth, meetupUsage.maxHostPerMonth)
                    )}`}
                    style={{
                      width: `${calculatePercentage(meetupUsage.meetupsHostedThisMonth, meetupUsage.maxHostPerMonth)}%`
                    }}
                  />
                </div>
              ) : (
                <div className="text-xs text-green-600 font-semibold">✓ Unlimited hosting</div>
              )}
            </div>

            {/* Joining */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-sm text-[#8F8FA3]">Joined</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-[#1E0E62]">
                    {meetupUsage.meetupsJoinedThisMonth}
                  </span>
                  <span className="text-sm text-[#8F8FA3]">
                    / {formatNumber(meetupUsage.maxJoinPerMonth)}
                  </span>
                </div>
              </div>
              
              {meetupUsage.maxJoinPerMonth !== -1 ? (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getStatusColor(
                      calculatePercentage(meetupUsage.meetupsJoinedThisMonth, meetupUsage.maxJoinPerMonth)
                    )}`}
                    style={{
                      width: `${calculatePercentage(meetupUsage.meetupsJoinedThisMonth, meetupUsage.maxJoinPerMonth)}%`
                    }}
                  />
                </div>
              ) : (
                <div className="text-xs text-green-600 font-semibold">✓ Unlimited joining</div>
              )}
            </div>

            {/* Stats */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#8F8FA3]">Active Meetups</span>
                <span className="font-semibold">{meetupUsage.meetupsHostedThisMonth + meetupUsage.meetupsJoinedThisMonth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8F8FA3]">Total This Month</span>
                <span className="font-semibold">{meetupUsage.meetupsJoinedThisMonth} joined</span>
              </div>
            </div>

            {meetupUsage.maxHostPerMonth !== -1 && meetupUsage.maxHostPerMonth > 0 &&
             calculatePercentage(meetupUsage.meetupsHostedThisMonth, meetupUsage.maxHostPerMonth) >= 80 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Almost at hosting limit!
                </p>
                <button
                  onClick={onUpgradeClick}
                  className="text-xs text-blue-600 font-semibold mt-1 flex items-center gap-1 hover:gap-2 transition-all"
                >
                  Upgrade for more <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="font-bold text-[#1E0E62] mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          All-Time Performance
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{missionUsage.missionsCreatedThisMonth + (missionUsage.missionsCreatedLastMonth || 0)}</div>
            <div className="text-sm text-[#8F8FA3]">Total Missions</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{growthCredits.totalEarned}</div>
            <div className="text-sm text-[#8F8FA3]">Credits Earned</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{meetupUsage.meetupsHostedThisMonth}</div>
            <div className="text-sm text-[#8F8FA3]">Meetups Hosted</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{missionUsage.totalParticipantsThisMonth}</div>
            <div className="text-sm text-[#8F8FA3]">Total Participants</div>
          </div>
        </div>
      </div>
    </div>
  );
};
