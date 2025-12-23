import React, { useState, useEffect } from 'react';
import { 
  Store, Search, CheckCircle, XCircle, Eye, Clock,
  MapPin, Mail, Phone, Award, TrendingUp, AlertCircle,
  FileText, Calendar, Ban
} from 'lucide-react';
import { collection, getDocs, query, where, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/AuthContext';
import { AdminPermissions, filterByScope } from '../../services/adminAuthService';

interface Business {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: string;
  businessName?: string;
  businessType?: string;
  description?: string;
  city?: string;
  country?: string;
  address?: string;
  phone?: string;
  photoUrl?: string;
  avatarUrl?: string;
  businessLevel?: number;
  points?: number;
  businessVerified?: boolean;
  subscriptionLevel?: string;
  createdAt?: any;
  emailVerified?: boolean;
  banned?: boolean;
  verificationSubmittedAt?: any;
  verificationStatus?: string;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvalNotes?: string;
  approvedAt?: string;
  approvedBy?: string;
}

interface VerificationRequest {
  id: string;
  userId: string;
  businessName: string;
  businessType: string;
  documentUrl: string;
  proofUrl: string;
  status: string;
  submittedAt: any;
  reviewedAt?: any;
  reviewedBy?: string;
}

interface AdminBusinessManagementProps {
  adminId: string;
  adminPerms: AdminPermissions;
}

export const AdminBusinessManagement: React.FC<AdminBusinessManagementProps> = ({ adminId, adminPerms }) => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'UNVERIFIED' | 'PENDING' | 'PENDING_APPROVAL'>('ALL');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<VerificationRequest | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterBusinesses();
  }, [searchQuery, statusFilter, businesses]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load businesses - simplified query without orderBy to avoid index requirement
      const usersCol = collection(db, 'users');
      const q = query(
        usersCol, 
        where('role', '==', 'BUSINESS'),
        limit(500)
      );
      const snapshot = await getDocs(q);
      
      const businessData = snapshot.docs.map(doc => ({
        id: doc.id,
        uid: doc.id,
        ...doc.data()
      } as Business));
      
      console.log('[AdminBusinessManagement] Loaded businesses:', businessData.length);
      console.log('[AdminBusinessManagement] Approval statuses:', businessData.map(b => ({ name: b.businessName, status: b.approvalStatus })));
      
      // Sort in JavaScript instead
      businessData.sort((a, b) => {
        const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return bDate.getTime() - aDate.getTime();
      });
      
      // Apply geographic scope filtering
      const scopedBusinesses = filterByScope(
        businessData,
        adminPerms,
        (business) => business.country,
        (business) => business.city
      );
      
      setBusinesses(scopedBusinesses);

      // Load verification requests
      const verifyCol = collection(db, 'verificationRequests');
      const verifyQ = query(verifyCol, where('status', '==', 'PENDING'));
      const verifySnapshot = await getDocs(verifyQ);
      
      const verifyData = verifySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as VerificationRequest));
      
      setVerificationRequests(verifyData);
    } catch (error) {
      console.error('Error loading businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBusinesses = () => {
    let filtered = [...businesses];

    // Status filter
    if (statusFilter === 'VERIFIED') {
      filtered = filtered.filter(b => b.businessVerified === true);
    } else if (statusFilter === 'UNVERIFIED') {
      filtered = filtered.filter(b => b.businessVerified === false || !b.businessVerified);
    } else if (statusFilter === 'PENDING') {
      filtered = filtered.filter(b => b.verificationStatus === 'PENDING');
    } else if (statusFilter === 'PENDING_APPROVAL') {
      filtered = filtered.filter(b => b.approvalStatus === 'PENDING');
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(b => 
        b.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.city?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredBusinesses(filtered);
  };

  const handleApproveVerification = async (request: VerificationRequest) => {
    if (!confirm(`Approve verification for ${request.businessName}?`)) {
      return;
    }

    setActionLoading(request.id);
    try {
      // Call Cloud Function
      const response = await fetch('https://us-central1-fluzio-13af2.cloudfunctions.net/approveVerification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: adminId,
          userId: request.userId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Verification approved successfully!');
        await loadData();
        setShowVerificationModal(false);
        setSelectedVerification(null);
      } else {
        alert(`Failed to approve: ${result.error}`);
      }
    } catch (error) {
      console.error('Error approving verification:', error);
      alert('Failed to approve verification');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectVerification = async (request: VerificationRequest) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) {
      alert('Rejection reason is required');
      return;
    }

    setActionLoading(request.id);
    try {
      // Call Cloud Function
      const response = await fetch('https://us-central1-fluzio-13af2.cloudfunctions.net/rejectVerification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: adminId,
          userId: request.userId,
          reason: reason
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Verification rejected');
        await loadData();
        setShowVerificationModal(false);
        setSelectedVerification(null);
      } else {
        alert(`Failed to reject: ${result.error}`);
      }
    } catch (error) {
      console.error('Error rejecting verification:', error);
      alert('Failed to reject verification');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBanBusiness = async (businessId: string, currentBanStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentBanStatus ? 'unban' : 'ban'} this business?`)) {
      return;
    }

    setActionLoading(businessId);
    try {
      const businessRef = doc(db, 'users', businessId);
      await updateDoc(businessRef, {
        banned: !currentBanStatus,
        bannedAt: !currentBanStatus ? new Date() : null,
        bannedBy: !currentBanStatus ? adminId : null
      });
      
      await loadData();
      alert(`Business ${currentBanStatus ? 'unbanned' : 'banned'} successfully`);
    } catch (error) {
      console.error('Error banning business:', error);
      alert('Failed to update business status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveBusiness = async (businessId: string) => {
    if (!confirm('Approve this business signup?')) {
      return;
    }

    setActionLoading(businessId);
    try {
      const businessRef = doc(db, 'users', businessId);
      await updateDoc(businessRef, {
        approvalStatus: 'APPROVED',
        approvedAt: new Date().toISOString(),
        approvedBy: adminId
      });
      
      // Reload data and force UI update
      await loadData();
      alert('Business approved successfully!');
    } catch (error) {
      console.error('Error approving business:', error);
      alert('Failed to approve business');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectBusiness = async (businessId: string) => {
    const notes = prompt('Enter rejection reason (will be shown to the business):');
    if (!notes) {
      return;
    }

    setActionLoading(businessId);
    try {
      const businessRef = doc(db, 'users', businessId);
      await updateDoc(businessRef, {
        approvalStatus: 'REJECTED',
        approvalNotes: notes,
        approvedAt: new Date().toISOString(),
        approvedBy: adminId
      });
      
      await loadData();
      alert('Business signup rejected');
    } catch (error) {
      console.error('Error rejecting business:', error);
      alert('Failed to reject business');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (business: Business) => {
    if (business.banned) {
      return <span className="px-3 py-1 bg-red-100 text-red-700 border border-red-200 rounded-full text-xs font-bold">BANNED</span>;
    }
    if (business.approvalStatus === 'PENDING') {
      return <span className="px-3 py-1 bg-orange-100 text-orange-700 border border-orange-200 rounded-full text-xs font-bold flex items-center gap-1">
        <Clock className="w-3 h-3" />
        PENDING APPROVAL
      </span>;
    }
    if (business.approvalStatus === 'REJECTED') {
      return <span className="px-3 py-1 bg-red-100 text-red-700 border border-red-200 rounded-full text-xs font-bold">
        SIGNUP REJECTED
      </span>;
    }
    if (business.businessVerified) {
      return <span className="px-3 py-1 bg-green-100 text-green-700 border border-green-200 rounded-full text-xs font-bold flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        VERIFIED
      </span>;
    }
    if (business.verificationStatus === 'PENDING') {
      return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-full text-xs font-bold flex items-center gap-1">
        <Clock className="w-3 h-3" />
        PENDING
      </span>;
    }
    return <span className="px-3 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-full text-xs font-bold">UNVERIFIED</span>;
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
          <div className="text-sm text-gray-600 mb-1">Total Businesses</div>
          <div className="text-2xl font-bold text-[#1E0E62]">{businesses.length}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Pending Approval</div>
          <div className="text-2xl font-bold text-orange-600">
            {businesses.filter(b => b.approvalStatus === 'PENDING').length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Verified</div>
          <div className="text-2xl font-bold text-green-600">
            {businesses.filter(b => b.businessVerified).length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Pending Verification</div>
          <div className="text-2xl font-bold text-yellow-600">
            {verificationRequests.length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Banned</div>
          <div className="text-2xl font-bold text-red-600">
            {businesses.filter(b => b.banned).length}
          </div>
        </div>
      </div>

      {/* Pending Approval Alert */}
      {businesses.filter(b => b.approvalStatus === 'PENDING').length > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-6 rounded-r-xl">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-orange-600" />
            <div className="flex-1">
              <h3 className="font-bold text-orange-800">
                {businesses.filter(b => b.approvalStatus === 'PENDING').length} Business{businesses.filter(b => b.approvalStatus === 'PENDING').length > 1 ? 'es' : ''} Awaiting Approval
              </h3>
              <p className="text-sm text-orange-700">
                Review and approve new business signups
              </p>
            </div>
            <button
              onClick={() => setStatusFilter('PENDING_APPROVAL')}
              className="px-4 py-2 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors"
            >
              Review Now
            </button>
          </div>
        </div>
      )}

      {/* Pending Verifications Alert */}
      {verificationRequests.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-xl">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600" />
            <div className="flex-1">
              <h3 className="font-bold text-yellow-800">
                {verificationRequests.length} Pending Verification{verificationRequests.length > 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-yellow-700">
                Review and approve business verification requests
              </p>
            </div>
            <button
              onClick={() => setShowVerificationModal(true)}
              className="px-4 py-2 bg-yellow-600 text-white rounded-xl font-bold hover:bg-yellow-700 transition-colors"
            >
              Review Now
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by business name, email, or city..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent bg-white"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING">Pending Verification</option>
            <option value="UNVERIFIED">Unverified</option>
          </select>
        </div>
      </div>

      {/* Business List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Business</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Level/Points</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBusinesses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No businesses found</p>
                  </td>
                </tr>
              ) : (
                filteredBusinesses.map(business => (
                  <tr key={business.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {business.photoUrl || business.avatarUrl ? (
                          <img
                            src={business.photoUrl || business.avatarUrl}
                            alt={business.businessName || business.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#00E5FF] to-[#6C4BFF] flex items-center justify-center text-white font-bold">
                            {(business.businessName || business.name)?.charAt(0) || 'B'}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-[#1E0E62]">
                            {business.businessName || business.name}
                          </div>
                          <div className="text-sm text-gray-500">{business.email}</div>
                          {business.city && (
                            <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" />
                              {business.city}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {business.businessType || 'Not specified'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {business.businessLevel && (
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-bold flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            L{business.businessLevel}
                          </span>
                        )}
                        {business.points !== undefined && (
                          <span className="text-sm font-medium text-gray-700">
                            {business.points.toLocaleString()} pts
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(business)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {business.approvalStatus === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApproveBusiness(business.id)}
                              disabled={actionLoading === business.id}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors text-xs flex items-center gap-1"
                              title="Approve signup"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectBusiness(business.id)}
                              disabled={actionLoading === business.id}
                              className="px-3 py-1.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors text-xs flex items-center gap-1"
                              title="Reject signup"
                            >
                              <XCircle className="w-3 h-3" />
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setSelectedBusiness(business)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleBanBusiness(business.id, business.banned || false)}
                          disabled={actionLoading === business.id}
                          className="p-2 hover:bg-orange-50 rounded-lg transition-colors"
                          title={business.banned ? 'Unban business' : 'Ban business'}
                        >
                          <Ban className={`w-4 h-4 ${business.banned ? 'text-orange-600' : 'text-gray-600'}`} />
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

      {/* Business Detail Modal */}
      {selectedBusiness && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-[#1E0E62]">Business Details</h2>
              <button
                onClick={() => setSelectedBusiness(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile */}
              <div className="flex items-center gap-4">
                {selectedBusiness.photoUrl || selectedBusiness.avatarUrl ? (
                  <img
                    src={selectedBusiness.photoUrl || selectedBusiness.avatarUrl}
                    alt={selectedBusiness.businessName || selectedBusiness.name}
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#00E5FF] to-[#6C4BFF] flex items-center justify-center text-white text-2xl font-bold">
                    {(selectedBusiness.businessName || selectedBusiness.name)?.charAt(0) || 'B'}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-[#1E0E62]">
                    {selectedBusiness.businessName || selectedBusiness.name}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">{selectedBusiness.businessType}</p>
                  {getStatusBadge(selectedBusiness)}
                </div>
              </div>

              {/* Description */}
              {selectedBusiness.description && (
                <div>
                  <h4 className="font-bold text-[#1E0E62] mb-2">Description</h4>
                  <p className="text-gray-600">{selectedBusiness.description}</p>
                </div>
              )}

              {/* Contact Info */}
              <div>
                <h4 className="font-bold text-[#1E0E62] mb-3">Contact Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    {selectedBusiness.email}
                  </div>
                  {selectedBusiness.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      {selectedBusiness.phone}
                    </div>
                  )}
                  {selectedBusiness.address && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {selectedBusiness.address}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div>
                <h4 className="font-bold text-[#1E0E62] mb-3">Business Stats</h4>
                <div className="grid grid-cols-2 gap-4">
                  {selectedBusiness.businessLevel && (
                    <div className="bg-purple-50 rounded-xl p-4">
                      <div className="text-sm text-gray-600 mb-1">Level</div>
                      <div className="text-2xl font-bold text-[#1E0E62]">
                        {selectedBusiness.businessLevel}
                      </div>
                    </div>
                  )}
                  {selectedBusiness.points !== undefined && (
                    <div className="bg-blue-50 rounded-xl p-4">
                      <div className="text-sm text-gray-600 mb-1">Points</div>
                      <div className="text-2xl font-bold text-[#1E0E62]">
                        {selectedBusiness.points.toLocaleString()}
                      </div>
                    </div>
                  )}
                  {selectedBusiness.subscriptionLevel && (
                    <div className="bg-yellow-50 rounded-xl p-4">
                      <div className="text-sm text-gray-600 mb-1">Subscription</div>
                      <div className="text-xl font-bold text-[#1E0E62]">
                        {selectedBusiness.subscriptionLevel}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => handleBanBusiness(selectedBusiness.id, selectedBusiness.banned || false)}
                  disabled={actionLoading === selectedBusiness.id}
                  className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    selectedBusiness.banned
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-orange-500 text-white hover:bg-orange-600'
                  }`}
                >
                  <Ban className="w-5 h-5" />
                  {selectedBusiness.banned ? 'Unban' : 'Ban'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification Requests Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-[#1E0E62]">Pending Verifications</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {verificationRequests.length} request{verificationRequests.length > 1 ? 's' : ''} awaiting review
                </p>
              </div>
              <button
                onClick={() => {
                  setShowVerificationModal(false);
                  setSelectedVerification(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {verificationRequests.map(request => (
                <div key={request.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-[#1E0E62]">{request.businessName}</h3>
                      <p className="text-sm text-gray-600">{request.businessType}</p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Submitted {new Date(request.submittedAt?.toDate()).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-full text-xs font-bold">
                      PENDING
                    </span>
                  </div>

                  {/* Document Preview */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-bold text-gray-700 mb-2">Business Document</p>
                      {request.documentUrl && (
                        <a
                          href={request.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full h-40 bg-white rounded-lg border-2 border-gray-200 hover:border-[#00E5FF] transition-colors flex items-center justify-center"
                        >
                          <FileText className="w-12 h-12 text-gray-400" />
                        </a>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-700 mb-2">Proof of Ownership</p>
                      {request.proofUrl && (
                        <a
                          href={request.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full h-40 bg-white rounded-lg border-2 border-gray-200 hover:border-[#00E5FF] transition-colors flex items-center justify-center"
                        >
                          <FileText className="w-12 h-12 text-gray-400" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApproveVerification(request)}
                      disabled={actionLoading === request.id}
                      className="flex-1 bg-green-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectVerification(request)}
                      disabled={actionLoading === request.id}
                      className="flex-1 bg-red-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
