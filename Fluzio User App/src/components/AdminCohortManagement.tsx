import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Users, Trophy, Lock, TrendingUp, Calendar, Eye, CheckCircle, XCircle } from 'lucide-react';
import type { CityCohort, CohortStats, CreateCohortRequest } from '../types/cohorts';
import { ENDPOINTS } from '../config/firebaseFunctions';

interface AdminCohortManagementProps {
  adminId: string;
  onClose?: () => void;
}

/**
 * AdminCohortManagement Component
 * 
 * Manage city cohorts with scarcity slots
 * - List cohorts (scope-filtered by admin role)
 * - Create new cohorts (SUPER_ADMIN, COUNTRY_ADMIN)
 * - Activate cohorts (PENDING → OPEN)
 * - View stats and member list
 */
const AdminCohortManagement: React.FC<AdminCohortManagementProps> = ({ adminId, onClose }) => {
  const [cohorts, setCohorts] = useState<(CityCohort & { stats?: CohortStats })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchCohorts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${ENDPOINTS.getCityCohorts}?adminId=${adminId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch cohorts');
      }

      const data = await response.json();

      if (data.success) {
        // Fetch stats for each cohort
        const cohortsWithStats = await Promise.all(
          data.cohorts.map(async (cohort: CityCohort) => {
            const statsResponse = await fetch(
              ENDPOINTS.getCohortStats,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminId, cohortId: cohort.id })
              }
            );

            if (statsResponse.ok) {
              const statsData = await statsResponse.json();
              return { ...cohort, stats: statsData.stats };
            }

            return cohort;
          })
        );

        setCohorts(cohortsWithStats);
      } else {
        setError(data.error || 'Failed to fetch cohorts');
      }
    } catch (err) {
      console.error('Error fetching cohorts:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCohorts();
  }, [adminId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-red-100 text-red-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN': return <CheckCircle className="w-4 h-4" />;
      case 'CLOSED': return <Lock className="w-4 h-4" />;
      case 'PENDING': return <Calendar className="w-4 h-4" />;
      case 'ARCHIVED': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const calculateProgress = (usedSlots: number, maxSlots: number) => {
    return (usedSlots / maxSlots) * 100;
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cohort Management</h1>
          <p className="text-gray-600 mt-1">Manage city-based founding partner cohorts</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Cohort
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      )}

      {/* Cohorts Grid */}
      {!loading && cohorts.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No cohorts yet</h3>
          <p className="text-gray-600">Create your first founding partner cohort</p>
        </div>
      )}

      {!loading && cohorts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cohorts.map((cohort) => {
            const progress = calculateProgress(cohort.usedSlots, cohort.maxSlots);
            const isAlmostFull = progress >= 80 && progress < 100;
            const isFull = progress >= 100;

            return (
              <div
                key={cohort.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedCohort(cohort.id)}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{cohort.cohortName}</h3>
                    <p className="text-sm text-gray-600">{cohort.cityName}</p>
                  </div>
                  <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(cohort.status)}`}>
                    {getStatusIcon(cohort.status)}
                    {cohort.status}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Slots Filled</span>
                    <span className="font-semibold text-gray-900">
                      {cohort.usedSlots} / {cohort.maxSlots}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        isFull ? 'bg-red-500' : isAlmostFull ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Founding Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-gray-700">{cohort.foundingBadgeLabel}</span>
                </div>

                {/* Pricing Lock */}
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700">
                    {cohort.pricingLockMonths} month{cohort.pricingLockMonths !== 1 ? 's' : ''} pricing lock
                  </span>
                </div>

                {/* Stats (if available) */}
                {cohort.stats && (
                  <div className="pt-4 border-t border-gray-200 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-600">Active Members</p>
                      <p className="text-lg font-semibold text-gray-900">{cohort.stats.activeMembersCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Avg Level</p>
                      <p className="text-lg font-semibold text-gray-900">{cohort.stats.averageLevel.toFixed(1)}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  {cohort.status === 'PENDING' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        activateCohort(cohort.id);
                      }}
                      className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      Activate
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCohort(cohort.id);
                    }}
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Cohort Modal */}
      {showCreateModal && (
        <CreateCohortModal
          adminId={adminId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchCohorts();
          }}
        />
      )}

      {/* Cohort Details Modal */}
      {selectedCohort && (
        <CohortDetailsModal
          adminId={adminId}
          cohortId={selectedCohort}
          onClose={() => setSelectedCohort(null)}
        />
      )}
    </div>
  );

  async function activateCohort(cohortId: string) {
    try {
      const response = await fetch(
        ENDPOINTS.activateCohort,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminId, cohortId })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to activate cohort');
      }

      const data = await response.json();
      if (data.success) {
        alert('Cohort activated successfully!');
        fetchCohorts();
      } else {
        alert(data.error || 'Failed to activate cohort');
      }
    } catch (err) {
      console.error('Error activating cohort:', err);
      alert('Failed to activate cohort');
    }
  }
};

/**
 * Create Cohort Modal
 */
interface CreateCohortModalProps {
  adminId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateCohortModal: React.FC<CreateCohortModalProps> = ({ adminId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<Partial<CreateCohortRequest>>({
    cohortName: '',
    cityId: '',
    cityName: '',
    countryId: '',
    maxSlots: 40,
    foundingBadgeLabel: 'Founding Partner',
    pricingLockMonths: 12,
    description: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        ENDPOINTS.createCityCohort,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminId, ...formData })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create cohort');
      }

      const data = await response.json();
      if (data.success) {
        onSuccess();
      } else {
        setError(data.error || 'Failed to create cohort');
      }
    } catch (err) {
      console.error('Error creating cohort:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Cohort</h2>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cohort Name *
              </label>
              <input
                type="text"
                required
                value={formData.cohortName}
                onChange={(e) => setFormData({ ...formData, cohortName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Q1 2024 Founding Partners"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City ID *
                </label>
                <input
                  type="text"
                  required
                  value={formData.cityId}
                  onChange={(e) => setFormData({ ...formData, cityId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., munich"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.cityName}
                  onChange={(e) => setFormData({ ...formData, cityName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Munich"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country ID
              </label>
              <input
                type="text"
                value={formData.countryId}
                onChange={(e) => setFormData({ ...formData, countryId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., DE"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Slots *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.maxSlots}
                  onChange={(e) => setFormData({ ...formData, maxSlots: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Munich: 100, Others: 40</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pricing Lock (Months) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.pricingLockMonths}
                  onChange={(e) => setFormData({ ...formData, pricingLockMonths: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Founding Badge Label *
              </label>
              <input
                type="text"
                required
                value={formData.foundingBadgeLabel}
                onChange={(e) => setFormData({ ...formData, foundingBadgeLabel: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Founding Partner"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={3}
                placeholder="Optional description..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Cohort'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

/**
 * Cohort Details Modal (placeholder for now)
 */
interface CohortDetailsModalProps {
  adminId: string;
  cohortId: string;
  onClose: () => void;
}

const CohortDetailsModal: React.FC<CohortDetailsModalProps> = ({ adminId, cohortId, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Cohort Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <p className="text-gray-600">Member list and detailed stats coming soon...</p>
      </div>
    </div>
  );
};

export default AdminCohortManagement;
