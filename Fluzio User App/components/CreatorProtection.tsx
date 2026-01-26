import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  FileText, 
  AlertTriangle, 
  Lock,
  Plus,
  CheckCircle,
  X,
  Eye,
  Book,
  ExternalLink
} from 'lucide-react';
import {
  getProtectionStats,
  getCreatorDisputes,
  getCreatorContracts,
  getProtectedContent,
  createDispute,
  registerContent,
  Dispute,
  Contract,
  ContentProtection
} from '../services/creatorProtectionService';

interface CreatorProtectionProps {
  creatorId: string;
  creatorName: string;
}

const CreatorProtection: React.FC<CreatorProtectionProps> = ({
  creatorId,
  creatorName
}) => {
  const [stats, setStats] = useState<any>(null);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [protectedContent, setProtectedContent] = useState<ContentProtection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'DISPUTES' | 'CONTRACTS' | 'CONTENT' | 'RESOURCES'>('DISPUTES');
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);

  const [disputeForm, setDisputeForm] = useState({
    title: '',
    description: '',
    category: 'PAYMENT' as Dispute['category'],
    priority: 'MEDIUM' as Dispute['priority'],
    clientId: ''
  });

  const [contentForm, setContentForm] = useState({
    title: '',
    description: '',
    contentType: 'IMAGE' as ContentProtection['contentType'],
    usageRights: 'ALL_RIGHTS_RESERVED' as ContentProtection['usageRights']
  });

  useEffect(() => {
    loadData();
  }, [creatorId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, disputesData, contractsData, contentData] = await Promise.all([
        getProtectionStats(creatorId),
        getCreatorDisputes(creatorId),
        getCreatorContracts(creatorId),
        getProtectedContent(creatorId)
      ]);
      setStats(statsData);
      setDisputes(disputesData);
      setContracts(contractsData);
      setProtectedContent(contentData);
    } catch (error) {
      console.error('Error loading protection data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDispute = async () => {
    if (!disputeForm.title || !disputeForm.description || !disputeForm.clientId) {
      alert('Please fill in all required fields');
      return;
    }

    const result = await createDispute(
      creatorId,
      disputeForm.clientId,
      disputeForm.title,
      disputeForm.description,
      disputeForm.category,
      disputeForm.priority
    );

    if (result.success) {
      setShowDisputeModal(false);
      resetDisputeForm();
      loadData();
    } else {
      alert(`Error creating dispute: ${result.error}`);
    }
  };

  const handleRegisterContent = async () => {
    if (!contentForm.title || !contentForm.description) {
      alert('Please fill in all required fields');
      return;
    }

    const result = await registerContent(
      creatorId,
      contentForm.contentType,
      contentForm.title,
      contentForm.description,
      contentForm.usageRights
    );

    if (result.success) {
      setShowContentModal(false);
      resetContentForm();
      loadData();
    } else {
      alert(`Error registering content: ${result.error}`);
    }
  };

  const resetDisputeForm = () => {
    setDisputeForm({
      title: '',
      description: '',
      category: 'PAYMENT',
      priority: 'MEDIUM',
      clientId: ''
    });
  };

  const resetContentForm = () => {
    setContentForm({
      title: '',
      description: '',
      contentType: 'IMAGE',
      usageRights: 'ALL_RIGHTS_RESERVED'
    });
  };

  const getDisputeStatusColor = (status: Dispute['status']) => {
    switch (status) {
      case 'RESOLVED': return 'text-emerald-600 bg-emerald-100';
      case 'OPEN': return 'text-blue-600 bg-blue-100';
      case 'IN_REVIEW': return 'text-yellow-600 bg-yellow-100';
      case 'ESCALATED': return 'text-red-600 bg-red-100';
      case 'CLOSED': return 'text-gray-600 bg-gray-100';
    }
  };

  const getContractStatusColor = (status: Contract['status']) => {
    switch (status) {
      case 'SIGNED': return 'text-emerald-600 bg-emerald-100';
      case 'ACTIVE': return 'text-blue-600 bg-blue-100';
      case 'DRAFT': return 'text-gray-600 bg-gray-100';
      case 'SENT': return 'text-yellow-600 bg-yellow-100';
      case 'COMPLETED': return 'text-purple-600 bg-purple-100';
      case 'TERMINATED': return 'text-red-600 bg-red-100';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const legalResources = [
    { title: 'Creator Contract Templates', category: 'CONTRACT', description: 'Professional contract templates for various project types' },
    { title: 'Copyright Protection Guide', category: 'COPYRIGHT', description: 'Understanding your rights and how to protect your work' },
    { title: 'Dispute Resolution Process', category: 'DISPUTE', description: 'Step-by-step guide to resolving client disputes' },
    { title: 'Tax Guidelines for Creators', category: 'TAXATION', description: 'Tax obligations and deductions for freelancers' }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border-2 border-blue-200 rounded-xl p-4">
            <AlertTriangle className="w-6 h-6 text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.activeDisputes}</p>
            <p className="text-xs text-gray-600">Active Disputes</p>
          </div>

          <div className="bg-white border-2 border-emerald-200 rounded-xl p-4">
            <FileText className="w-6 h-6 text-emerald-600 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.activeContracts}</p>
            <p className="text-xs text-gray-600">Active Contracts</p>
          </div>

          <div className="bg-white border-2 border-purple-200 rounded-xl p-4">
            <Lock className="w-6 h-6 text-purple-600 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.protectedAssets}</p>
            <p className="text-xs text-gray-600">Protected Assets</p>
          </div>

          <div className="bg-white border-2 border-green-200 rounded-xl p-4">
            <CheckCircle className="w-6 h-6 text-green-600 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.resolvedDisputes}</p>
            <p className="text-xs text-gray-600">Resolved</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b-2 border-gray-200">
        {(['DISPUTES', 'CONTRACTS', 'CONTENT', 'RESOURCES'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium transition-all ${
              activeTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600 -mb-0.5'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Disputes Tab */}
      {activeTab === 'DISPUTES' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Disputes & Resolution</h3>
            <button
              onClick={() => setShowDisputeModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              File Dispute
            </button>
          </div>

          {disputes.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No disputes filed</p>
              <p className="text-sm text-gray-500 mt-1">Your work is protected - file a dispute if issues arise</p>
            </div>
          ) : (
            disputes.map(dispute => (
              <div key={dispute.id} className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-1">{dispute.title}</h4>
                    <p className="text-sm text-gray-600">{dispute.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDisputeStatusColor(dispute.status)}`}>
                    {dispute.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{dispute.category}</span>
                  <span>•</span>
                  <span>Priority: {dispute.priority}</span>
                  <span>•</span>
                  <span>Filed: {formatDate(dispute.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Contracts Tab */}
      {activeTab === 'CONTRACTS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Contract Management</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
              <Plus className="w-4 h-4" />
              Create Contract
            </button>
          </div>

          {contracts.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No contracts created</p>
              <p className="text-sm text-gray-500 mt-1">Protect yourself with professional contracts</p>
            </div>
          ) : (
            contracts.map(contract => (
              <div key={contract.id} className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-1">{contract.title}</h4>
                    <p className="text-sm text-gray-600">{contract.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getContractStatusColor(contract.status)}`}>
                    {contract.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-600">Payment</p>
                    <p className="font-bold">${contract.payment.amount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Timeline</p>
                    <p className="font-bold">{contract.timeline}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Content Protection Tab */}
      {activeTab === 'CONTENT' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Content Protection</h3>
            <button
              onClick={() => setShowContentModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Plus className="w-4 h-4" />
              Register Content
            </button>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-900">
              <strong>Tip:</strong> Register your original content to establish proof of ownership and copyright protection.
            </p>
          </div>

          {protectedContent.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <Lock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No content registered</p>
              <p className="text-sm text-gray-500 mt-1">Register your creative work for copyright protection</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {protectedContent.map(content => (
                <div key={content.id} className="bg-white border-2 border-gray-200 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-gray-900">{content.title}</h4>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                      {content.contentType}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{content.description}</p>
                  <div className="text-xs text-gray-500">
                    <p>{content.copyrightNotice}</p>
                    <p className="mt-1">Registered: {formatDate(content.registeredAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legal Resources Tab */}
      {activeTab === 'RESOURCES' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Book className="w-5 h-5 text-blue-600" />
            Legal Resources & Guides
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {legalResources.map((resource, idx) => (
              <div key={idx} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-colors">
                <h4 className="font-bold text-gray-900 mb-2">{resource.title}</h4>
                <p className="text-sm text-gray-600 mb-4">{resource.description}</p>
                <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                  <ExternalLink className="w-4 h-4" />
                  View Resource
                </button>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
            <h4 className="text-xl font-bold mb-2">Need Legal Assistance?</h4>
            <p className="text-sm opacity-90 mb-4">
              Connect with legal professionals who specialize in creator rights and freelance protection.
            </p>
            <button className="px-6 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 font-medium">
              Find a Lawyer
            </button>
          </div>
        </div>
      )}

      {/* Create Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">File a Dispute</h2>
              <button onClick={() => setShowDisputeModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dispute Title *</label>
                <input
                  type="text"
                  value={disputeForm.title}
                  onChange={(e) => setDisputeForm({ ...disputeForm, title: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="Brief description of the issue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  value={disputeForm.description}
                  onChange={(e) => setDisputeForm({ ...disputeForm, description: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  rows={4}
                  placeholder="Detailed explanation of the dispute..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    value={disputeForm.category}
                    onChange={(e) => setDisputeForm({ ...disputeForm, category: e.target.value as any })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="PAYMENT">Payment Issue</option>
                    <option value="SCOPE">Scope Creep</option>
                    <option value="QUALITY">Quality Dispute</option>
                    <option value="COMMUNICATION">Communication</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={disputeForm.priority}
                    onChange={(e) => setDisputeForm({ ...disputeForm, priority: e.target.value as any })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client ID *</label>
                <input
                  type="text"
                  value={disputeForm.clientId}
                  onChange={(e) => setDisputeForm({ ...disputeForm, clientId: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="Client identifier"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowDisputeModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateDispute}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  File Dispute
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Register Content Modal */}
      {showContentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Register Content</h2>
              <button onClick={() => setShowContentModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content Title *</label>
                <input
                  type="text"
                  value={contentForm.title}
                  onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  placeholder="Name of your work"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  value={contentForm.description}
                  onChange={(e) => setContentForm({ ...contentForm, description: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  rows={3}
                  placeholder="Describe your original content..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content Type *</label>
                  <select
                    value={contentForm.contentType}
                    onChange={(e) => setContentForm({ ...contentForm, contentType: e.target.value as any })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  >
                    <option value="IMAGE">Image</option>
                    <option value="VIDEO">Video</option>
                    <option value="AUDIO">Audio</option>
                    <option value="TEXT">Text/Writing</option>
                    <option value="DESIGN">Design</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Usage Rights</label>
                  <select
                    value={contentForm.usageRights}
                    onChange={(e) => setContentForm({ ...contentForm, usageRights: e.target.value as any })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  >
                    <option value="ALL_RIGHTS_RESERVED">All Rights Reserved</option>
                    <option value="LIMITED_LICENSE">Limited License</option>
                    <option value="COMMERCIAL_LICENSE">Commercial License</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowContentModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRegisterContent}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                >
                  Register
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorProtection;
