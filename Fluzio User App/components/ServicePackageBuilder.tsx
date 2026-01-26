/**
 * Service Package Builder Component
 * 
 * Allows creators to create and manage service packages
 * Bronze, Silver, Gold tiers with customizable features
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  DollarSign, 
  Clock, 
  RefreshCw,
  Package,
  Star,
  Loader,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  getCreatorPackages,
  createServicePackage,
  updateServicePackage,
  deleteServicePackage,
  togglePackageStatus,
  getPackageTemplates,
  ServicePackage,
  PackageTier
} from '../services/creatorPackagesService';

interface ServicePackageBuilderProps {
  creatorId: string;
  creatorName: string;
}

const tierColors = {
  bronze: 'from-orange-400 to-orange-600',
  silver: 'from-gray-400 to-gray-600',
  gold: 'from-yellow-400 to-yellow-600',
  custom: 'from-purple-400 to-purple-600'
};

const tierLabels = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  custom: 'Custom'
};

export const ServicePackageBuilder: React.FC<ServicePackageBuilderProps> = ({
  creatorId,
  creatorName
}) => {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPackages();
  }, [creatorId]);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const data = await getCreatorPackages(creatorId);
      setPackages(data);
    } catch (error) {
      console.error('Error loading packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    const newPackage: Partial<ServicePackage> = {
      creatorId,
      creatorName,
      tier: 'bronze',
      name: '',
      description: '',
      price: 0,
      currency: 'USD',
      deliveryDays: 7,
      revisions: 2,
      features: [''],
      deliverables: [''],
      isActive: true,
      isPopular: false,
      displayOrder: packages.length + 1
    };
    setEditingPackage(newPackage as ServicePackage);
    setShowEditor(true);
  };

  const handleEdit = (pkg: ServicePackage) => {
    setEditingPackage(pkg);
    setShowEditor(true);
  };

  const handleDelete = async (packageId: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return;
    
    try {
      await deleteServicePackage(packageId);
      await loadPackages();
    } catch (error) {
      console.error('Error deleting package:', error);
    }
  };

  const handleToggleStatus = async (packageId: string, isActive: boolean) => {
    try {
      await togglePackageStatus(packageId, !isActive);
      await loadPackages();
    } catch (error) {
      console.error('Error toggling package status:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#6C4BFF]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Service Packages</h2>
            <p className="text-gray-600">
              Create packages to showcase your services and pricing
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 bg-[#6C4BFF] text-white rounded-lg hover:bg-[#5a3dd9] transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Package
          </button>
        </div>
      </div>

      {/* Packages Grid */}
      {packages.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map(pkg => (
            <div
              key={pkg.id}
              className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden ${
                pkg.isActive ? 'border-gray-200' : 'border-gray-300 opacity-60'
              }`}
            >
              {/* Package Header */}
              <div className={`bg-gradient-to-r ${tierColors[pkg.tier]} p-6 text-white relative`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-sm font-medium opacity-90">{tierLabels[pkg.tier]}</div>
                    <h3 className="text-xl font-bold">{pkg.name}</h3>
                  </div>
                  {pkg.isPopular && (
                    <div className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-xs">
                      <Star className="w-3 h-3" />
                      Popular
                    </div>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">${pkg.price}</span>
                  <span className="text-sm opacity-75">USD</span>
                </div>
              </div>

              {/* Package Content */}
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4">{pkg.description}</p>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{pkg.deliveryDays} days</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <RefreshCw className="w-4 h-4" />
                    <span>{pkg.revisions === -1 ? 'Unlimited' : `${pkg.revisions} rev`}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="mb-4">
                  <div className="text-xs font-semibold text-gray-700 mb-2">Features ({pkg.features.length})</div>
                  <div className="space-y-1">
                    {pkg.features.slice(0, 3).map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                        <Check className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{feature}</span>
                      </div>
                    ))}
                    {pkg.features.length > 3 && (
                      <div className="text-xs text-gray-500">+{pkg.features.length - 3} more</div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleEdit(pkg)}
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleStatus(pkg.id, pkg.isActive)}
                    className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                      pkg.isActive
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    title={pkg.isActive ? 'Hide package' : 'Show package'}
                  >
                    {pkg.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(pkg.id)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                    title="Delete package"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No packages yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first service package to start showcasing your offerings
          </p>
          <button
            onClick={handleCreateNew}
            className="px-6 py-3 bg-[#6C4BFF] text-white rounded-lg hover:bg-[#5a3dd9] transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Your First Package
          </button>
        </div>
      )}

      {/* Package Editor Modal */}
      {showEditor && editingPackage && (
        <PackageEditorModal
          package={editingPackage}
          creatorId={creatorId}
          creatorName={creatorName}
          onSave={async () => {
            await loadPackages();
            setShowEditor(false);
            setEditingPackage(null);
          }}
          onClose={() => {
            setShowEditor(false);
            setEditingPackage(null);
          }}
        />
      )}
    </div>
  );
};

/**
 * Package Editor Modal Component
 */
interface PackageEditorModalProps {
  package: ServicePackage;
  creatorId: string;
  creatorName: string;
  onSave: () => void;
  onClose: () => void;
}

const PackageEditorModal: React.FC<PackageEditorModalProps> = ({
  package: pkg,
  creatorId,
  creatorName,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState<Partial<ServicePackage>>(pkg);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (pkg.id) {
        // Update existing
        await updateServicePackage(pkg.id, formData);
      } else {
        // Create new
        await createServicePackage({
          ...formData,
          creatorId,
          creatorName
        } as Omit<ServicePackage, 'id' | 'createdAt' | 'updatedAt'>);
      }
      
      onSave();
    } catch (error) {
      console.error('Error saving package:', error);
    } finally {
      setSaving(false);
    }
  };

  const addFeature = () => {
    setFormData({
      ...formData,
      features: [...(formData.features || []), '']
    });
  };

  const removeFeature = (index: number) => {
    const newFeatures = [...(formData.features || [])];
    newFeatures.splice(index, 1);
    setFormData({ ...formData, features: newFeatures });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...(formData.features || [])];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const addDeliverable = () => {
    setFormData({
      ...formData,
      deliverables: [...(formData.deliverables || []), '']
    });
  };

  const removeDeliverable = (index: number) => {
    const newDeliverables = [...(formData.deliverables || [])];
    newDeliverables.splice(index, 1);
    setFormData({ ...formData, deliverables: newDeliverables });
  };

  const updateDeliverable = (index: number, value: string) => {
    const newDeliverables = [...(formData.deliverables || [])];
    newDeliverables[index] = value;
    setFormData({ ...formData, deliverables: newDeliverables });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {pkg.id ? 'Edit Package' : 'Create Package'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Tier Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tier</label>
            <div className="grid grid-cols-4 gap-2">
              {(['bronze', 'silver', 'gold', 'custom'] as PackageTier[]).map(tier => (
                <button
                  key={tier}
                  onClick={() => setFormData({ ...formData, tier })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.tier === tier
                      ? 'border-[#6C4BFF] bg-[#6C4BFF]/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm font-medium">{tierLabels[tier]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Package Name</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Professional Package"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C4BFF] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Price (USD)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={formData.price || 0}
                  onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                  placeholder="0"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C4BFF] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of what's included..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C4BFF] focus:border-transparent resize-none"
            />
          </div>

          {/* Delivery & Revisions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Time (days)</label>
              <input
                type="number"
                value={formData.deliveryDays || 7}
                onChange={e => setFormData({ ...formData, deliveryDays: Number(e.target.value) })}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C4BFF] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Revisions</label>
              <select
                value={formData.revisions === -1 ? 'unlimited' : formData.revisions}
                onChange={e => setFormData({ 
                  ...formData, 
                  revisions: e.target.value === 'unlimited' ? -1 : Number(e.target.value) 
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C4BFF] focus:border-transparent"
              >
                <option value="1">1 Revision</option>
                <option value="2">2 Revisions</option>
                <option value="3">3 Revisions</option>
                <option value="4">4 Revisions</option>
                <option value="5">5 Revisions</option>
                <option value="unlimited">Unlimited</option>
              </select>
            </div>
          </div>

          {/* Features */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">Features</label>
              <button
                onClick={addFeature}
                className="text-sm text-[#6C4BFF] hover:text-[#5a3dd9] flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Feature
              </button>
            </div>
            <div className="space-y-2">
              {(formData.features || []).map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={e => updateFeature(idx, e.target.value)}
                    placeholder="Enter feature..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C4BFF] focus:border-transparent"
                  />
                  <button
                    onClick={() => removeFeature(idx)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Deliverables */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">Deliverables</label>
              <button
                onClick={addDeliverable}
                className="text-sm text-[#6C4BFF] hover:text-[#5a3dd9] flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Deliverable
              </button>
            </div>
            <div className="space-y-2">
              {(formData.deliverables || []).map((deliverable, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={deliverable}
                    onChange={e => updateDeliverable(idx, e.target.value)}
                    placeholder="Enter deliverable..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C4BFF] focus:border-transparent"
                  />
                  <button
                    onClick={() => removeDeliverable(idx)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPopular || false}
                onChange={e => setFormData({ ...formData, isPopular: e.target.checked })}
                className="w-5 h-5 text-[#6C4BFF] border-gray-300 rounded focus:ring-[#6C4BFF]"
              />
              <span className="text-sm text-gray-700">Mark as Popular</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive !== false}
                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-5 h-5 text-[#6C4BFF] border-gray-300 rounded focus:ring-[#6C4BFF]"
              />
              <span className="text-sm text-gray-700">Active (visible to businesses)</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !formData.name || !formData.price}
            className="px-6 py-2 bg-[#6C4BFF] text-white rounded-lg hover:bg-[#5a3dd9] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Package
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
