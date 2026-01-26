import React, { useState, useEffect } from 'react';
import { 
  Target, Search, Eye, Ban, Trash2, CheckCircle, XCircle,
  MapPin, Calendar, Users, Award, TrendingUp, AlertCircle, Clock
} from 'lucide-react';
import { collection, getDocs, query, orderBy, limit, doc, updateDoc, deleteDoc, where } from '../../services/firestoreCompat';
import { db } from '../../services/apiService';
import { AdminPermissions, filterByScope } from '../../services/adminAuthService';
import type { Mission, MissionLifecycleStatus } from '../../types';

interface AdminMissionManagementProps {
  adminId: string;
  adminPerms: AdminPermissions;
}

export const AdminMissionManagement: React.FC<AdminMissionManagementProps> = ({ adminId, adminPerms }) => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [filteredMissions, setFilteredMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | MissionLifecycleStatus>('ALL');
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadMissions();
  }, []);

  useEffect(() => {
    filterMissions();
  }, [searchQuery, statusFilter, missions]);

  const loadMissions = async () => {
    setLoading(true);
    try {
      const missionsCol = collection(db, 'missions');
      const q = query(missionsCol, orderBy('createdAt', 'desc'), limit(500));
      const snapshot = await getDocs(q);
      
      const missionData = snapshot.docs.map(doc => ({
        id: doc.id,
        firestoreId: doc.id,
        ...doc.data()
      } as Mission));
      
      // Apply geographic scope filtering based on business location
      const scopedMissions = filterByScope(
        missionData,
        adminPerms,
        (mission) => mission.country,
        (mission) => mission.city
      );
      
      setMissions(scopedMissions);
    } catch (error) {
      console.error('Error loading missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMissions = () => {
    let filtered = [...missions];

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(m => m.lifecycleStatus === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(m => 
        m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredMissions(filtered);
  };

  const handleDeleteMission = async (missionId: string, missionTitle: string) => {
    if (!confirm(`Delete mission "${missionTitle}"? This cannot be undone.`)) {
      return;
    }

    const confirmText = prompt('Type DELETE to confirm:');
    if (confirmText !== 'DELETE') {
      alert('Deletion cancelled');
      return;
    }

    setActionLoading(missionId);
    try {
      await deleteDoc(doc(db, 'missions', missionId));
      await loadMissions();
      alert('Mission deleted successfully');
      setSelectedMission(null);
    } catch (error) {
      console.error('Error deleting mission:', error);
      alert('Failed to delete mission');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleMissionStatus = async (missionId: string, currentStatus: MissionLifecycleStatus) => {
    const newStatus: MissionLifecycleStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    
    setActionLoading(missionId);
    try {
      const missionRef = doc(db, 'missions', missionId);
      await updateDoc(missionRef, {
        lifecycleStatus: newStatus,
        isActive: newStatus === 'ACTIVE'
      });
      
      await loadMissions();
      alert(`Mission ${newStatus === 'ACTIVE' ? 'activated' : 'paused'} successfully`);
    } catch (error) {
      console.error('Error updating mission status:', error);
      alert('Failed to update mission status');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status?: MissionLifecycleStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-3 py-1 bg-green-100 text-green-700 border border-green-200 rounded-full text-xs font-bold flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          ACTIVE
        </span>;
      case 'PAUSED':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-full text-xs font-bold flex items-center gap-1">
          <Clock className="w-3 h-3" />
          PAUSED
        </span>;
      case 'COMPLETED':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded-full text-xs font-bold">COMPLETED</span>;
      case 'EXPIRED':
        return <span className="px-3 py-1 bg-red-100 text-red-700 border border-red-200 rounded-full text-xs font-bold">EXPIRED</span>;
      case 'CANCELLED':
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-full text-xs font-bold">CANCELLED</span>;
      case 'DRAFT':
        return <span className="px-3 py-1 bg-purple-100 text-purple-700 border border-purple-200 rounded-full text-xs font-bold">DRAFT</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-full text-xs font-bold">UNKNOWN</span>;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      INSTAGRAM: 'bg-pink-50 text-pink-700',
      TIKTOK: 'bg-purple-50 text-purple-700',
      FACEBOOK: 'bg-blue-50 text-blue-700',
      YOUTUBE: 'bg-red-50 text-red-700',
      LINKEDIN: 'bg-indigo-50 text-indigo-700',
      TWITTER: 'bg-cyan-50 text-cyan-700',
    };
    return colors[category] || 'bg-gray-50 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#00E5FF] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Total Missions</div>
          <div className="text-2xl font-bold text-[#1E0E62]">{missions.length}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Active</div>
          <div className="text-2xl font-bold text-green-600">
            {missions.filter(m => m.lifecycleStatus === 'ACTIVE').length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Paused</div>
          <div className="text-2xl font-bold text-yellow-600">
            {missions.filter(m => m.lifecycleStatus === 'PAUSED').length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Completed</div>
          <div className="text-2xl font-bold text-blue-600">
            {missions.filter(m => m.lifecycleStatus === 'COMPLETED').length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Expired</div>
          <div className="text-2xl font-bold text-red-600">
            {missions.filter(m => m.lifecycleStatus === 'EXPIRED').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, business, or description..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent bg-white"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="COMPLETED">Completed</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>
      </div>

      {/* Mission List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Mission</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Business</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Participants</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No missions found</p>
                  </td>
                </tr>
              ) : (
                filteredMissions.map(mission => (
                  <tr key={mission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {mission.image ? (
                          <img
                            src={mission.image}
                            alt={mission.title}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#00E5FF] to-[#6C4BFF] flex items-center justify-center text-white font-bold text-xl">
                            {mission.title?.charAt(0) || 'M'}
                          </div>
                        )}
                        <div className="max-w-xs">
                          <div className="font-bold text-[#1E0E62] truncate">{mission.title}</div>
                          <div className="text-sm text-gray-500 truncate">{mission.description}</div>
                          {mission.location && (
                            <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {mission.location}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${getCategoryColor(mission.category)}`}>
                              {mission.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-700">{mission.businessName || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">
                          {mission.currentParticipants}
                          {mission.maxParticipants && ` / ${mission.maxParticipants}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(mission.lifecycleStatus)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedMission(mission)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleToggleMissionStatus(mission.firestoreId || mission.id, mission.lifecycleStatus || 'ACTIVE')}
                          disabled={actionLoading === mission.id}
                          className="p-2 hover:bg-yellow-50 rounded-lg transition-colors"
                          title={mission.lifecycleStatus === 'ACTIVE' ? 'Pause mission' : 'Activate mission'}
                        >
                          <Ban className={`w-4 h-4 ${mission.lifecycleStatus === 'ACTIVE' ? 'text-yellow-600' : 'text-green-600'}`} />
                        </button>
                        <button
                          onClick={() => handleDeleteMission(mission.firestoreId || mission.id, mission.title)}
                          disabled={actionLoading === mission.id}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete mission"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mission Detail Modal */}
      {selectedMission && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-[#1E0E62]">Mission Details</h2>
              <button
                onClick={() => setSelectedMission(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Mission Header */}
              <div className="flex items-start gap-4">
                {selectedMission.image ? (
                  <img
                    src={selectedMission.image}
                    alt={selectedMission.title}
                    className="w-24 h-24 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-[#00E5FF] to-[#6C4BFF] flex items-center justify-center text-white text-3xl font-bold">
                    {selectedMission.title?.charAt(0) || 'M'}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-[#1E0E62] mb-2">{selectedMission.title}</h3>
                  <p className="text-gray-600 mb-3">{selectedMission.description}</p>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedMission.lifecycleStatus)}
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getCategoryColor(selectedMission.category)}`}>
                      {selectedMission.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Business Info */}
              <div>
                <h4 className="font-bold text-[#1E0E62] mb-2">Business</h4>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="font-medium text-gray-700">{selectedMission.businessName || 'Unknown Business'}</div>
                  <div className="text-sm text-gray-500">Business ID: {selectedMission.businessId}</div>
                </div>
              </div>

              {/* Requirements */}
              {selectedMission.requirements && selectedMission.requirements.length > 0 && (
                <div>
                  <h4 className="font-bold text-[#1E0E62] mb-2">Requirements</h4>
                  <ul className="bg-gray-50 rounded-xl p-4 space-y-2">
                    {selectedMission.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-50 rounded-xl p-4">
                  <div className="text-sm text-gray-600 mb-1">Participants</div>
                  <div className="text-2xl font-bold text-[#1E0E62] flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {selectedMission.currentParticipants}
                    {selectedMission.maxParticipants && ` / ${selectedMission.maxParticipants}`}
                  </div>
                </div>

                {selectedMission.reward && (
                  <div className="bg-yellow-50 rounded-xl p-4">
                    <div className="text-sm text-gray-600 mb-1">Reward</div>
                    <div className="text-2xl font-bold text-[#1E0E62] flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      {selectedMission.reward.points} pts
                    </div>
                  </div>
                )}

                {selectedMission.location && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="text-sm text-gray-600 mb-1">Location</div>
                    <div className="text-sm font-bold text-[#1E0E62] flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {selectedMission.location}
                    </div>
                  </div>
                )}

                {selectedMission.validUntil && (
                  <div className="bg-red-50 rounded-xl p-4">
                    <div className="text-sm text-gray-600 mb-1">Valid Until</div>
                    <div className="text-sm font-bold text-[#1E0E62] flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(selectedMission.validUntil).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => handleToggleMissionStatus(selectedMission.firestoreId || selectedMission.id, selectedMission.lifecycleStatus || 'ACTIVE')}
                  disabled={actionLoading === selectedMission.id}
                  className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    selectedMission.lifecycleStatus === 'ACTIVE'
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  <Ban className="w-5 h-5" />
                  {selectedMission.lifecycleStatus === 'ACTIVE' ? 'Pause' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDeleteMission(selectedMission.firestoreId || selectedMission.id, selectedMission.title)}
                  disabled={actionLoading === selectedMission.id}
                  className="flex-1 bg-red-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
