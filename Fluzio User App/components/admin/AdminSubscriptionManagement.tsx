import React, { useState, useEffect } from 'react';
import { 
  Crown, Users, TrendingUp, AlertCircle, CheckCircle, 
  XCircle, Edit, RefreshCw, DollarSign, Calendar,
  Shield, AlertTriangle, ChevronDown, ChevronUp
} from 'lucide-react';
import { db } from '../../services/AuthContext';
import { collection, getDocs, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { Level2Tier } from '../../services/level2SubscriptionService';
import { Level1Tier } from '../../services/level1SubscriptionService';
import { AdminPermissions, canPerformAction } from '../../services/adminAuthService';

interface SubscriptionData {
  userId: string;
  userName?: string;
  businessName?: string;
  level: number;
  tier: Level1Tier | Level2Tier;
  status: string;
  activeMissionsCount?: number;
  participantsThisMonth?: number;
  googleReviewsThisMonth?: number;
  referralMissionsThisMonth?: number;
  squadMeetupsAttendedThisMonth?: number;
  eventsAttendedThisMonth?: number;
  lastMonthlyReset?: Date;
  startDate?: Date;
}

interface AdminSubscriptionManagementProps {
  adminId: string;
  adminPerms: AdminPermissions;
}

export const AdminSubscriptionManagement: React.FC<AdminSubscriptionManagementProps> = ({ adminId, adminPerms }) => {
  // Check if user can manage subscriptions
  const canManage = canPerformAction(adminPerms, 'MANAGE_SUBSCRIPTIONS');
  const [loading, setLoading] = useState(true);
  const [level1Subs, setLevel1Subs] = useState<SubscriptionData[]>([]);
  const [level2Subs, setLevel2Subs] = useState<SubscriptionData[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<1 | 2>(2);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [resetting, setResetting] = useState(false);

  // Analytics
  const [analytics, setAnalytics] = useState({
    level1: {
      total: 0,
      free: 0,
      silver: 0,
      gold: 0
    },
    level2: {
      total: 0,
      free: 0,
      silver: 0,
      gold: 0,
      platinum: 0
    },
    totalRevenue: 0
  });

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      // Load Level 1 subscriptions
      const level1Snapshot = await getDocs(collection(db, 'level1Subscriptions'));
      const level1Data: SubscriptionData[] = [];
      
      for (const docSnap of level1Snapshot.docs) {
        const data = docSnap.data();
        // Get user data
        const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', data.userId)));
        const userData = userDoc.docs[0]?.data();
        
        level1Data.push({
          userId: data.userId,
          userName: userData?.name || 'Unknown',
          businessName: userData?.businessName || userData?.name,
          level: 1,
          tier: data.tier as Level1Tier,
          status: data.status,
          squadMeetupsAttendedThisMonth: data.squadMeetupsAttendedThisMonth || 0,
          eventsAttendedThisMonth: data.eventsAttendedThisMonth || 0,
          lastMonthlyReset: data.lastMonthlyReset?.toDate(),
          startDate: data.startDate?.toDate()
        });
      }

      // Load Level 2 subscriptions
      const level2Snapshot = await getDocs(collection(db, 'level2Subscriptions'));
      const level2Data: SubscriptionData[] = [];
      
      for (const docSnap of level2Snapshot.docs) {
        const data = docSnap.data();
        // Get user data
        const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', data.userId)));
        const userData = userDoc.docs[0]?.data();
        
        level2Data.push({
          userId: data.userId,
          userName: userData?.name || 'Unknown',
          businessName: userData?.businessName || userData?.name,
          level: 2,
          tier: data.tier as Level2Tier,
          status: data.status,
          activeMissionsCount: data.activeMissionsCount || 0,
          participantsThisMonth: data.participantsThisMonth || 0,
          googleReviewsThisMonth: data.googleReviewsThisMonth || 0,
          referralMissionsThisMonth: data.referralMissionsThisMonth || 0,
          lastMonthlyReset: data.lastMonthlyReset?.toDate(),
          startDate: data.startDate?.toDate()
        });
      }

      setLevel1Subs(level1Data);
      setLevel2Subs(level2Data);

      // Calculate analytics
      const level1Free = level1Data.filter(s => s.tier === 'FREE').length;
      const level1Silver = level1Data.filter(s => s.tier === 'SILVER').length;
      const level1Gold = level1Data.filter(s => s.tier === 'GOLD').length;

      const level2Free = level2Data.filter(s => s.tier === 'FREE').length;
      const level2Silver = level2Data.filter(s => s.tier === 'SILVER').length;
      const level2Gold = level2Data.filter(s => s.tier === 'GOLD').length;
      const level2Platinum = level2Data.filter(s => s.tier === 'PLATINUM').length;

      const revenue = 
        (level1Silver * 14) + 
        (level1Gold * 24) + 
        (level2Silver * 29) + 
        (level2Gold * 59) + 
        (level2Platinum * 99);

      setAnalytics({
        level1: {
          total: level1Data.length,
          free: level1Free,
          silver: level1Silver,
          gold: level1Gold
        },
        level2: {
          total: level2Data.length,
          free: level2Free,
          silver: level2Silver,
          gold: level2Gold,
          platinum: level2Platinum
        },
        totalRevenue: revenue
      });

    } catch (error) {
      console.error('[AdminSubscriptionManagement] Error loading subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetAllCounters = async () => {
    if (!confirm('Reset all subscription counters? This will reset monthly quotas for all users.')) {
      return;
    }

    setResetting(true);
    try {
      // Call the cloud function
      const response = await fetch(
        'https://us-central1-fluzio-13af2.cloudfunctions.net/triggerSubscriptionReset',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const result = await response.json();
      
      if (result.success) {
        alert(`Reset complete: ${result.level1Updated} Level 1 + ${result.level2Updated} Level 2 subscriptions`);
        await loadSubscriptions();
      } else {
        alert('Failed to reset counters: ' + result.error);
      }
    } catch (error) {
      console.error('[AdminSubscriptionManagement] Error resetting counters:', error);
      alert('Error resetting counters. Check console for details.');
    } finally {
      setResetting(false);
    }
  };

  const handleEditSubscription = (sub: SubscriptionData) => {
    setEditingUser(sub.userId);
    setEditFormData({
      tier: sub.tier,
      status: sub.status,
      activeMissionsCount: sub.activeMissionsCount || 0,
      participantsThisMonth: sub.participantsThisMonth || 0,
      googleReviewsThisMonth: sub.googleReviewsThisMonth || 0,
      referralMissionsThisMonth: sub.referralMissionsThisMonth || 0,
      squadMeetupsAttendedThisMonth: sub.squadMeetupsAttendedThisMonth || 0,
      eventsAttendedThisMonth: sub.eventsAttendedThisMonth || 0
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      const level = level1Subs.find(s => s.userId === editingUser) ? 1 : 2;
      const collection = level === 1 ? 'level1Subscriptions' : 'level2Subscriptions';
      
      await updateDoc(doc(db, collection, editingUser), editFormData);
      
      alert('Subscription updated successfully');
      setEditingUser(null);
      await loadSubscriptions();
    } catch (error) {
      console.error('[AdminSubscriptionManagement] Error updating subscription:', error);
      alert('Failed to update subscription');
    }
  };

  const renderSubscriptionCard = (sub: SubscriptionData) => {
    const isExpanded = expandedUser === sub.userId;
    const isEditing = editingUser === sub.userId;

    const getTierColor = (tier: string) => {
      switch (tier) {
        case 'FREE': return 'text-gray-600 bg-gray-100';
        case 'SILVER': return 'text-blue-600 bg-blue-100';
        case 'GOLD': return 'text-yellow-600 bg-yellow-100';
        case 'PLATINUM': return 'text-purple-600 bg-purple-100';
        default: return 'text-gray-600 bg-gray-100';
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'ACTIVE': return 'text-green-600 bg-green-100';
        case 'CANCELED': return 'text-red-600 bg-red-100';
        case 'PAST_DUE': return 'text-orange-600 bg-orange-100';
        default: return 'text-gray-600 bg-gray-100';
      }
    };

    return (
      <div key={sub.userId} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50" onClick={() => setExpandedUser(isExpanded ? null : sub.userId)}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
              {sub.businessName?.charAt(0) || 'B'}
            </div>
            <div>
              <h3 className="font-bold text-[#1E0E62]">{sub.businessName}</h3>
              <p className="text-sm text-[#8F8FA3]">Level {sub.level} Business</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getTierColor(sub.tier)}`}>
              {sub.tier}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(sub.status)}`}>
              {sub.status}
            </span>
            {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            {isEditing ? (
              // Edit Form
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#1E0E62] mb-1">Tier</label>
                    <select
                      value={editFormData.tier}
                      onChange={(e) => setEditFormData({ ...editFormData, tier: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="FREE">FREE</option>
                      <option value="SILVER">SILVER</option>
                      <option value="GOLD">GOLD</option>
                      {sub.level === 2 && <option value="PLATINUM">PLATINUM</option>}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#1E0E62] mb-1">Status</label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="CANCELED">CANCELED</option>
                      <option value="PAST_DUE">PAST_DUE</option>
                    </select>
                  </div>
                </div>

                {sub.level === 2 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#1E0E62] mb-1">Active Missions</label>
                      <input
                        type="number"
                        value={editFormData.activeMissionsCount}
                        onChange={(e) => setEditFormData({ ...editFormData, activeMissionsCount: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#1E0E62] mb-1">Participants This Month</label>
                      <input
                        type="number"
                        value={editFormData.participantsThisMonth}
                        onChange={(e) => setEditFormData({ ...editFormData, participantsThisMonth: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#1E0E62] mb-1">Google Reviews</label>
                      <input
                        type="number"
                        value={editFormData.googleReviewsThisMonth}
                        onChange={(e) => setEditFormData({ ...editFormData, googleReviewsThisMonth: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#1E0E62] mb-1">Referral Missions</label>
                      <input
                        type="number"
                        value={editFormData.referralMissionsThisMonth}
                        onChange={(e) => setEditFormData({ ...editFormData, referralMissionsThisMonth: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                )}

                {sub.level === 1 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#1E0E62] mb-1">Squad Meetups</label>
                      <input
                        type="number"
                        value={editFormData.squadMeetupsAttendedThisMonth}
                        onChange={(e) => setEditFormData({ ...editFormData, squadMeetupsAttendedThisMonth: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#1E0E62] mb-1">Events Attended</label>
                      <input
                        type="number"
                        value={editFormData.eventsAttendedThisMonth}
                        onChange={(e) => setEditFormData({ ...editFormData, eventsAttendedThisMonth: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                  >
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {sub.level === 2 ? (
                    <>
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-xs text-[#8F8FA3] mb-1">Active Missions</p>
                        <p className="text-xl font-bold text-[#1E0E62]">{sub.activeMissionsCount || 0}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-xs text-[#8F8FA3] mb-1">Participants</p>
                        <p className="text-xl font-bold text-[#1E0E62]">{sub.participantsThisMonth || 0}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-xs text-[#8F8FA3] mb-1">Google Reviews</p>
                        <p className="text-xl font-bold text-[#1E0E62]">{sub.googleReviewsThisMonth || 0}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-xs text-[#8F8FA3] mb-1">Referrals</p>
                        <p className="text-xl font-bold text-[#1E0E62]">{sub.referralMissionsThisMonth || 0}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-xs text-[#8F8FA3] mb-1">Squad Meetups</p>
                        <p className="text-xl font-bold text-[#1E0E62]">{sub.squadMeetupsAttendedThisMonth || 0}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-xs text-[#8F8FA3] mb-1">Events</p>
                        <p className="text-xl font-bold text-[#1E0E62]">{sub.eventsAttendedThisMonth || 0}</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-[#8F8FA3]">
                  <Calendar className="w-4 h-4" />
                  Last Reset: {sub.lastMonthlyReset?.toLocaleDateString() || 'Never'}
                </div>

                <button
                  onClick={() => handleEditSubscription(sub)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
                >
                  <Edit className="w-4 h-4 inline mr-2" />
                  Edit Subscription
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const currentSubs = selectedLevel === 1 ? level1Subs : level2Subs;

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <DollarSign className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-sm opacity-90 mb-1">Monthly Revenue</p>
          <p className="text-3xl font-bold">€{analytics.totalRevenue}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <Users className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-sm opacity-90 mb-1">Level 1 Subs</p>
          <p className="text-3xl font-bold">{analytics.level1.total}</p>
          <p className="text-xs opacity-75 mt-1">
            {analytics.level1.free} Free · {analytics.level1.silver} Silver · {analytics.level1.gold} Gold
          </p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl p-6 text-white">
          <Crown className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-sm opacity-90 mb-1">Level 2 Subs</p>
          <p className="text-3xl font-bold">{analytics.level2.total}</p>
          <p className="text-xs opacity-75 mt-1">
            {analytics.level2.free} Free · {analytics.level2.silver} Silver · {analytics.level2.gold} Gold · {analytics.level2.platinum} Platinum
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <TrendingUp className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-sm opacity-90 mb-1">Conversion Rate</p>
          <p className="text-3xl font-bold">
            {analytics.level1.total + analytics.level2.total > 0 
              ? Math.round(((analytics.level1.silver + analytics.level1.gold + analytics.level2.silver + analytics.level2.gold + analytics.level2.platinum) / (analytics.level1.total + analytics.level2.total)) * 100)
              : 0}%
          </p>
          <p className="text-xs opacity-75 mt-1">Paid Subscriptions</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedLevel(1)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              selectedLevel === 1 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Level 1 ({analytics.level1.total})
          </button>
          <button
            onClick={() => setSelectedLevel(2)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              selectedLevel === 2 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Level 2 ({analytics.level2.total})
          </button>
        </div>

        <button
          onClick={handleResetAllCounters}
          disabled={resetting}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} />
          Reset All Counters
        </button>
      </div>

      {/* Subscriptions List */}
      <div className="space-y-4">
        {currentSubs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No Level {selectedLevel} subscriptions found</p>
          </div>
        ) : (
          currentSubs.map(renderSubscriptionCard)
        )}
      </div>
    </div>
  );
};
