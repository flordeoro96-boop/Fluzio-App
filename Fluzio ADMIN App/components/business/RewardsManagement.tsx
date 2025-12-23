import React, { useState, useEffect } from 'react';
import { Card, Button } from '../Common';
import { 
  Gift, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  TrendingUp,
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,
  Upload
} from 'lucide-react';

interface Reward {
  id: string;
  businessId: string;
  businessName: string;
  title: string;
  description: string;
  costPoints: number;
  type: 'DISCOUNT' | 'FREE_ITEM' | 'VOUCHER' | 'CASHBACK' | 'EXPERIENCE';
  imageUrl?: string;
  discountPercent?: number;
  city: string;
  district?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  totalAvailable?: number;
  remaining?: number;
  terms?: string;
  expiryDays: number;
  createdAt: string;
  redemptions?: {
    total: number;
    used: number;
    active: number;
  };
}

interface RewardsManagementProps {
  businessId: string;
  businessName: string;
}

export const RewardsManagement: React.FC<RewardsManagementProps> = ({ 
  businessId,
  businessName
}) => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  useEffect(() => {
    loadRewards();
  }, [businessId]);

  const loadRewards = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        'https://us-central1-fluzio-13af2.cloudfunctions.net/getBusinessRewards',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessId })
        }
      );
      const data = await response.json();
      
      if (data.success) {
        setRewards(data.rewards);
      }
    } catch (error) {
      console.error('Failed to load rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (rewardId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    
    try {
      const response = await fetch(
        'https://us-central1-fluzio-13af2.cloudfunctions.net/updateReward',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId,
            rewardId,
            updates: { status: newStatus }
          })
        }
      );
      const data = await response.json();
      
      if (data.success) {
        loadRewards();
      } else {
        alert('Failed to update reward status');
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
      alert('Error updating reward');
    }
  };

  const handleDelete = async (rewardId: string) => {
    if (!confirm('Are you sure you want to delete this reward? This cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(
        'https://us-central1-fluzio-13af2.cloudfunctions.net/deleteReward',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessId, rewardId })
        }
      );
      const data = await response.json();
      
      if (data.success) {
        loadRewards();
      } else {
        alert('Failed to delete reward');
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Error deleting reward');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DISCOUNT': return '💰';
      case 'FREE_ITEM': return '🎁';
      case 'VOUCHER': return '🎫';
      case 'CASHBACK': return '💵';
      case 'EXPERIENCE': return '✨';
      default: return '🎁';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'DISCOUNT': return 'Discount';
      case 'FREE_ITEM': return 'Free Item';
      case 'VOUCHER': return 'Voucher';
      case 'CASHBACK': return 'Cashback';
      case 'EXPERIENCE': return 'Experience';
      default: return type;
    }
  };

  const activeRewards = rewards.filter(r => r.status === 'ACTIVE');
  const inactiveRewards = rewards.filter(r => r.status === 'INACTIVE');
  const deletedRewards = rewards.filter(r => r.status === 'DELETED');

  return (
    <div className="min-h-screen bg-[#F8F9FE] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#FFB86C] via-[#00E5FF] to-[#6C4BFF] px-6 pt-6 pb-12 rounded-b-[40px]">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-clash font-bold text-3xl text-white">My Rewards</h1>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-white text-[#00E5FF] hover:bg-white/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Reward
          </Button>
        </div>
        <p className="text-white/80 text-sm">Manage your reward offerings</p>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <Card className="p-4 bg-white/95 backdrop-blur-md border-none">
            <div className="text-xs text-gray-500 mb-1">Active</div>
            <div className="text-2xl font-bold text-[#1E0E62]">{activeRewards.length}</div>
          </Card>
          <Card className="p-4 bg-white/95 backdrop-blur-md border-none">
            <div className="text-xs text-gray-500 mb-1">Total Redemptions</div>
            <div className="text-2xl font-bold text-[#1E0E62]">
              {rewards.reduce((sum, r) => sum + (r.redemptions?.total || 0), 0)}
            </div>
          </Card>
          <Card className="p-4 bg-white/95 backdrop-blur-md border-none">
            <div className="text-xs text-gray-500 mb-1">Points Given</div>
            <div className="text-2xl font-bold text-[#1E0E62]">
              {rewards.reduce((sum, r) => sum + (r.redemptions?.total || 0) * r.costPoints, 0).toLocaleString()}
            </div>
          </Card>
        </div>
      </div>

      {/* Rewards List */}
      <div className="px-6 -mt-4 space-y-6">
        {/* Active Rewards */}
        {activeRewards.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-[#1E0E62] mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Active Rewards ({activeRewards.length})
            </h2>
            <div className="space-y-3">
              {activeRewards.map(reward => (
                <RewardCard 
                  key={reward.id}
                  reward={reward}
                  onToggleStatus={handleToggleStatus}
                  onEdit={() => setEditingReward(reward)}
                  onDelete={handleDelete}
                  getTypeIcon={getTypeIcon}
                  getTypeLabel={getTypeLabel}
                />
              ))}
            </div>
          </div>
        )}

        {/* Inactive Rewards */}
        {inactiveRewards.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-[#1E0E62] mb-3 flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-gray-500" />
              Inactive Rewards ({inactiveRewards.length})
            </h2>
            <div className="space-y-3">
              {inactiveRewards.map(reward => (
                <RewardCard 
                  key={reward.id}
                  reward={reward}
                  onToggleStatus={handleToggleStatus}
                  onEdit={() => setEditingReward(reward)}
                  onDelete={handleDelete}
                  getTypeIcon={getTypeIcon}
                  getTypeLabel={getTypeLabel}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {rewards.length === 0 && !loading && (
          <Card className="p-12 text-center">
            <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#1E0E62] mb-2">No Rewards Yet</h3>
            <p className="text-gray-500 mb-6">
              Create your first reward to start attracting customers!
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Reward
            </Button>
          </Card>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E5FF] mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading rewards...</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingReward) && (
        <RewardFormModal
          businessId={businessId}
          businessName={businessName}
          reward={editingReward}
          onClose={() => {
            setShowCreateModal(false);
            setEditingReward(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingReward(null);
            loadRewards();
          }}
        />
      )}
    </div>
  );
};

// Reward Card Component
const RewardCard: React.FC<{
  reward: Reward;
  onToggleStatus: (id: string, status: string) => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
  getTypeIcon: (type: string) => string;
  getTypeLabel: (type: string) => string;
}> = ({ reward, onToggleStatus, onEdit, onDelete, getTypeIcon, getTypeLabel }) => {
  return (
    <Card className={`p-4 ${reward.status === 'ACTIVE' ? 'border-green-200' : 'border-gray-200'}`}>
      <div className="flex gap-4">
        {/* Image */}
        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden shrink-0">
          {reward.imageUrl ? (
            <img src={reward.imageUrl} alt={reward.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">
              {getTypeIcon(reward.type)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-bold text-[#1E0E62]">{reward.title}</h3>
              <p className="text-xs text-gray-500">{getTypeLabel(reward.type)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleStatus(reward.id, reward.status)}
                className={`p-2 rounded-lg ${
                  reward.status === 'ACTIVE' 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {reward.status === 'ACTIVE' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button onClick={onEdit} className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => onDelete(reward.id)} className="p-2 bg-red-100 text-red-600 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-3">{reward.description}</p>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span className="font-semibold">{reward.costPoints}</span> points
            </div>
            {reward.remaining !== undefined && (
              <div className="flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-gray-500" />
                <span>{reward.remaining} / {reward.totalAvailable} left</span>
              </div>
            )}
            {reward.redemptions && (
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                <span>{reward.redemptions.total} redeemed</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

// Form Modal Component
const RewardFormModal: React.FC<{
  businessId: string;
  businessName: string;
  reward: Reward | null;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ businessId, businessName, reward, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: reward?.title || '',
    description: reward?.description || '',
    costPoints: reward?.costPoints || 100,
    type: reward?.type || 'DISCOUNT',
    imageUrl: reward?.imageUrl || '',
    discountPercent: reward?.discountPercent || 10,
    stock: reward?.totalAvailable || 50,
    terms: reward?.terms || '',
    expiryDays: reward?.expiryDays || 30
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = reward
        ? 'https://us-central1-fluzio-13af2.cloudfunctions.net/updateReward'
        : 'https://us-central1-fluzio-13af2.cloudfunctions.net/createReward';

      const body = reward
        ? { businessId, rewardId: reward.id, updates: formData }
        : { businessId, ...formData };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        alert(reward ? '✅ Reward updated!' : '✅ Reward created!');
        onSuccess();
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to save reward:', error);
      alert('Error saving reward');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-[#1E0E62] mb-6">
            {reward ? 'Edit Reward' : 'Create New Reward'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00E5FF]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00E5FF]"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Points Cost</label>
                <input
                  type="number"
                  value={formData.costPoints}
                  onChange={(e) => setFormData({ ...formData, costPoints: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00E5FF]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00E5FF]"
                >
                  <option value="DISCOUNT">Discount</option>
                  <option value="FREE_ITEM">Free Item</option>
                  <option value="VOUCHER">Voucher</option>
                  <option value="CASHBACK">Cashback</option>
                  <option value="EXPERIENCE">Experience</option>
                </select>
              </div>
            </div>

            {formData.type === 'DISCOUNT' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Discount %</label>
                <input
                  type="number"
                  value={formData.discountPercent}
                  onChange={(e) => setFormData({ ...formData, discountPercent: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00E5FF]"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Stock (optional)</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00E5FF]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Terms & Conditions</label>
              <textarea
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00E5FF]"
                rows={2}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? 'Saving...' : reward ? 'Update Reward' : 'Create Reward'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};
