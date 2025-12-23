import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../services/AuthContext';
import { Gift, Search, Filter, CheckCircle, Clock, XCircle, Calendar, User, Hash, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Redemption {
  id: string;
  rewardId: string;
  rewardTitle: string;
  userId: string;
  userName: string;
  businessId: string;
  pointsSpent: number;
  couponCode: string;
  status: 'PENDING' | 'USED' | 'EXPIRED';
  redeemedAt: Timestamp;
  usedAt?: Timestamp;
  expiresAt: Timestamp;
}

interface RedemptionsManagementProps {
  businessId: string;
}

export const RedemptionsManagement: React.FC<RedemptionsManagementProps> = ({ businessId }) => {
  const { t } = useTranslation();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [filteredRedemptions, setFilteredRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'USED' | 'EXPIRED'>('ALL');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest'>('recent');

  // Analytics
  const [analytics, setAnalytics] = useState({
    totalRedemptions: 0,
    pendingCount: 0,
    usedCount: 0,
    expiredCount: 0,
    totalPointsAwarded: 0,
  });

  useEffect(() => {
    loadRedemptions();
  }, [businessId]);

  useEffect(() => {
    filterAndSortRedemptions();
  }, [redemptions, searchTerm, statusFilter, sortBy]);

  const loadRedemptions = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'redemptions'),
        where('businessId', '==', businessId),
        orderBy('redeemedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const redemptionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Redemption[];

      setRedemptions(redemptionsData);
      calculateAnalytics(redemptionsData);
    } catch (error) {
      console.error('Error loading redemptions:', error);
      alert(t('errors.loadRedemptions') || 'Failed to load redemptions');
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (data: Redemption[]) => {
    const stats = {
      totalRedemptions: data.length,
      pendingCount: data.filter(r => r.status === 'PENDING').length,
      usedCount: data.filter(r => r.status === 'USED').length,
      expiredCount: data.filter(r => r.status === 'EXPIRED').length,
      totalPointsAwarded: data.reduce((sum, r) => sum + r.pointsSpent, 0),
    };
    setAnalytics(stats);
  };

  const filterAndSortRedemptions = () => {
    let filtered = [...redemptions];

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.rewardTitle.toLowerCase().includes(term) ||
        r.userName.toLowerCase().includes(term) ||
        r.couponCode.toLowerCase().includes(term)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const aTime = a.redeemedAt.toMillis();
      const bTime = b.redeemedAt.toMillis();
      return sortBy === 'recent' ? bTime - aTime : aTime - bTime;
    });

    setFilteredRedemptions(filtered);
  };

  const markAsUsed = async (redemptionId: string) => {
    try {
      const redemptionRef = doc(db, 'redemptions', redemptionId);
      await updateDoc(redemptionRef, {
        status: 'USED',
        usedAt: Timestamp.now()
      });

      // Update local state
      setRedemptions(prev => 
        prev.map(r => 
          r.id === redemptionId 
            ? { ...r, status: 'USED' as const, usedAt: Timestamp.now() }
            : r
        )
      );

      alert(t('rewards.redemptionMarkedUsed') || 'Redemption marked as used');
    } catch (error) {
      console.error('Error marking redemption as used:', error);
      alert(t('errors.updateRedemption') || 'Failed to update redemption');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'USED': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'EXPIRED': return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'USED': return <CheckCircle className="w-4 h-4" />;
      case 'EXPIRED': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpiringSoon = (expiresAt: Timestamp) => {
    const daysUntilExpiry = (expiresAt.toMillis() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('rewards.redemptionsManagement') || 'Redemptions Management'}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t('rewards.redemptionsManagementDesc') || 'View and manage customer reward redemptions'}
          </p>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.totalRedemptions}
              </p>
            </div>
            <Gift className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {analytics.pendingCount}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Used</p>
              <p className="text-2xl font-bold text-green-600">
                {analytics.usedCount}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Expired</p>
              <p className="text-2xl font-bold text-gray-600">
                {analytics.expiredCount}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-gray-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Points Given</p>
              <p className="text-2xl font-bold text-purple-600">
                {analytics.totalPointsAwarded}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('rewards.searchRedemptions') || 'Search by customer, reward, or coupon code...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white"
            >
              <option value="ALL">{t('common.all') || 'All Status'}</option>
              <option value="PENDING">{t('rewards.pending') || 'Pending'}</option>
              <option value="USED">{t('rewards.used') || 'Used'}</option>
              <option value="EXPIRED">{t('rewards.expired') || 'Expired'}</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white"
            >
              <option value="recent">{t('common.mostRecent') || 'Most Recent'}</option>
              <option value="oldest">{t('common.oldest') || 'Oldest First'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Redemptions List */}
      {filteredRedemptions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
          <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('rewards.noRedemptions') || 'No redemptions found'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || statusFilter !== 'ALL' 
              ? t('rewards.tryDifferentFilter') || 'Try adjusting your filters'
              : t('rewards.noRedemptionsYet') || 'No customers have redeemed rewards yet'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRedemptions.map((redemption) => (
            <div
              key={redemption.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Left: Reward & Customer Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                        {redemption.rewardTitle}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                        <User className="w-4 h-4" />
                        <span>{redemption.userName}</span>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(redemption.status)}`}>
                      {getStatusIcon(redemption.status)}
                      <span>{redemption.status}</span>
                    </div>
                  </div>

                  {/* Coupon Code */}
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-gray-400" />
                    <code className="px-3 py-1 bg-gray-100 dark:bg-gray-900 rounded font-mono text-sm font-semibold text-purple-600 dark:text-purple-400">
                      {redemption.couponCode}
                    </code>
                  </div>

                  {/* Dates */}
                  <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{t('rewards.redeemedOn') || 'Redeemed'}: {formatDate(redemption.redeemedAt)}</span>
                    </div>
                    {redemption.usedAt && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>{t('rewards.usedOn') || 'Used'}: {formatDate(redemption.usedAt)}</span>
                      </div>
                    )}
                    <div className={`flex items-center gap-1 ${isExpiringSoon(redemption.expiresAt) ? 'text-orange-600 font-medium' : ''}`}>
                      <Clock className="w-4 h-4" />
                      <span>
                        {t('rewards.expires') || 'Expires'}: {formatDate(redemption.expiresAt)}
                        {isExpiringSoon(redemption.expiresAt) && ' ⚠️'}
                      </span>
                    </div>
                  </div>

                  {/* Points */}
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 dark:bg-purple-900/20 rounded-full text-sm">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      +{redemption.pointsSpent} {t('common.points') || 'points'}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 text-xs">
                      ({t('rewards.earnedFromCustomer') || 'earned from customer'})
                    </span>
                  </div>
                </div>

                {/* Right: Action Button */}
                {redemption.status === 'PENDING' && (
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => markAsUsed(redemption.id)}
                      className="w-full md:w-auto px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>{t('rewards.markAsUsed') || 'Mark as Used'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
