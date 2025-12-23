import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, TrendingUp, User, Mail, Calendar, Loader, Eye } from 'lucide-react';
import { getLevelName, getLevelDisplay } from '../../src/lib/levels/businessLevel';

interface PendingRequest {
  id: string;
  name: string;
  email: string;
  currentLevel: number;
  currentSubLevel: number;
  currentXp: number;
  requestedAt: Date;
}

interface BusinessLevelApprovalsProps {
  adminId: string;
}

export const BusinessLevelApprovals: React.FC<BusinessLevelApprovalsProps> = ({ adminId }) => {
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<PendingRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://us-central1-fluzio-13af2.cloudfunctions.net/getPendingUpgradeRequests');
      const result = await response.json();
      
      if (result.success) {
        // Convert timestamp strings to Date objects
        const formattedRequests = result.requests.map((req: any) => ({
          ...req,
          requestedAt: req.requestedAt?._seconds 
            ? new Date(req.requestedAt._seconds * 1000) 
            : new Date(req.requestedAt)
        }));
        setRequests(formattedRequests);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (businessId: string) => {
    setProcessing(businessId);
    try {
      const response = await fetch('https://us-central1-fluzio-13af2.cloudfunctions.net/approveBusinessLevelUpgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, adminId })
      });

      const result = await response.json();

      if (result.success) {
        // Remove from list
        setRequests(prev => prev.filter(r => r.id !== businessId));
        // Show success message
        alert(`✅ Approved! Business upgraded to Level ${result.newLevel.main}.${result.newLevel.sub}`);
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Network error. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!selectedBusiness || !rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setProcessing(selectedBusiness.id);
    try {
      const response = await fetch('https://us-central1-fluzio-13af2.cloudfunctions.net/rejectBusinessLevelUpgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          businessId: selectedBusiness.id, 
          adminId,
          reason: rejectionReason 
        })
      });

      const result = await response.json();

      if (result.success) {
        // Remove from list
        setRequests(prev => prev.filter(r => r.id !== selectedBusiness.id));
        setShowRejectModal(false);
        setRejectionReason('');
        setSelectedBusiness(null);
        alert(`✅ Request rejected with feedback sent to business`);
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Network error. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const getLevelColor = (level: number) => {
    const colors = {
      1: 'bg-gray-100 text-gray-700 border-gray-300',
      2: 'bg-green-100 text-green-700 border-green-300',
      3: 'bg-blue-100 text-blue-700 border-blue-300',
      4: 'bg-purple-100 text-purple-700 border-purple-300',
      5: 'bg-orange-100 text-orange-700 border-orange-300',
      6: 'bg-gradient-to-r from-yellow-100 to-pink-100 text-pink-700 border-pink-300'
    };
    return colors[level as keyof typeof colors] || colors[1];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-[#1E0E62] mb-2">All caught up!</h3>
        <p className="text-[#8F8FA3]">No pending level upgrade requests</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#1E0E62] mb-2">Business Level Approvals</h2>
        <p className="text-[#8F8FA3]">
          {requests.length} business{requests.length !== 1 ? 'es' : ''} waiting for level upgrade approval
        </p>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Business
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Current Level
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  XP
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Requested
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                  {/* Business Info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                        {request.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-[#1E0E62]">{request.name}</div>
                        <div className="text-sm text-[#8F8FA3] flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {request.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Current Level */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold border-2 w-fit ${getLevelColor(request.currentLevel)}`}>
                        <TrendingUp className="w-3.5 h-3.5" />
                        Level {getLevelDisplay(request.currentLevel, request.currentSubLevel)}
                      </div>
                      <span className="text-xs text-[#8F8FA3]">{getLevelName(request.currentLevel)}</span>
                    </div>
                  </td>

                  {/* XP */}
                  <td className="px-6 py-4">
                    <div className="font-semibold text-[#1E0E62]">{request.currentXp} XP</div>
                    <div className="text-xs text-[#8F8FA3]">Ready for upgrade</div>
                  </td>

                  {/* Requested Date */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-[#8F8FA3]">
                      <Calendar className="w-4 h-4" />
                      {formatDate(request.requestedAt)}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {processing === request.id ? (
                        <Loader className="w-5 h-5 animate-spin text-purple-500" />
                      ) : (
                        <>
                          <button
                            onClick={() => handleApprove(request.id)}
                            className="p-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                            title="Approve upgrade"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedBusiness(request);
                              setShowRejectModal(true);
                            }}
                            className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                            title="Reject upgrade"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedBusiness && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-[#1E0E62] mb-4">Reject Upgrade Request</h3>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-xl">
              <div className="font-semibold text-[#1E0E62] mb-1">{selectedBusiness.name}</div>
              <div className="text-sm text-[#8F8FA3]">
                Requesting upgrade from Level {getLevelDisplay(selectedBusiness.currentLevel, selectedBusiness.currentSubLevel)} to {selectedBusiness.currentLevel + 1}.1
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-[#1E0E62] mb-2">
                Reason for rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide specific feedback to help the business improve..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                rows={4}
              />
              <p className="text-xs text-[#8F8FA3] mt-1">
                This message will be sent to the business owner
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setSelectedBusiness(null);
                }}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || processing === selectedBusiness.id}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing === selectedBusiness.id ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Reject Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
