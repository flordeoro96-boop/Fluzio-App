/**
 * Creator Service Packages Display Component
 * 
 * Public-facing display of creator's service packages
 * Shows packages in tier columns (Bronze/Silver/Gold)
 */

import React, { useState, useEffect } from 'react';
import {
  Check,
  Clock,
  RefreshCw,
  Star,
  Package,
  Loader,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import {
  getActiveCreatorPackages,
  getPackageComparison,
  ServicePackage
} from '../services/creatorPackagesService';
import type { PackageComparison } from '../services/creatorPackagesService';

interface CreatorServicePackagesDisplayProps {
  creatorId: string;
  onSelectPackage?: (pkg: ServicePackage) => void;
  showCompactView?: boolean;
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

const tierDescriptions = {
  bronze: 'Essential package',
  silver: 'Most popular choice',
  gold: 'Premium experience',
  custom: 'Tailored solution'
};

export const CreatorServicePackagesDisplay: React.FC<CreatorServicePackagesDisplayProps> = ({
  creatorId,
  onSelectPackage,
  showCompactView = false
}) => {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [comparison, setComparison] = useState<PackageComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'comparison'>('grid');

  useEffect(() => {
    loadPackages();
  }, [creatorId]);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const [packagesData, comparisonData] = await Promise.all([
        getActiveCreatorPackages(creatorId),
        getPackageComparison(creatorId)
      ]);
      setPackages(packagesData);
      setComparison(comparisonData);
    } catch (error) {
      console.error('Error loading packages:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#6C4BFF]" />
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-600">No service packages available yet</p>
      </div>
    );
  }

  if (showCompactView) {
    return <CompactPackageView packages={packages} onSelectPackage={onSelectPackage} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Service Packages</h3>
          <p className="text-gray-600 mt-1">Choose the package that fits your needs</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'grid'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Grid View
          </button>
          <button
            onClick={() => setViewMode('comparison')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'comparison'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Compare
          </button>
        </div>
      </div>

      {/* Packages Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map(pkg => (
            <PackageCard
              key={pkg.id}
              package={pkg}
              onSelect={onSelectPackage}
            />
          ))}
        </div>
      ) : (
        <PackageComparison
          comparison={comparison!}
          onSelect={onSelectPackage}
        />
      )}
    </div>
  );
};

/**
 * Individual Package Card Component
 */
interface PackageCardProps {
  package: ServicePackage;
  onSelect?: (pkg: ServicePackage) => void;
}

const PackageCard: React.FC<PackageCardProps> = ({ package: pkg, onSelect }) => {
  return (
    <div
      className={`bg-white rounded-2xl shadow-lg border-2 overflow-hidden transition-transform hover:scale-105 ${
        pkg.isPopular ? 'border-[#6C4BFF] ring-2 ring-[#6C4BFF]/20' : 'border-gray-200'
      }`}
    >
      {/* Popular Badge */}
      {pkg.isPopular && (
        <div className="bg-gradient-to-r from-[#6C4BFF] to-[#5a3dd9] text-white text-center py-2 text-sm font-semibold flex items-center justify-center gap-2">
          <Star className="w-4 h-4" />
          Most Popular
        </div>
      )}

      {/* Package Header */}
      <div className={`bg-gradient-to-r ${tierColors[pkg.tier]} p-6 text-white`}>
        <div className="text-sm font-medium opacity-90 mb-1">{tierLabels[pkg.tier]}</div>
        <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold">${pkg.price}</span>
          <span className="text-sm opacity-75">USD</span>
        </div>
      </div>

      {/* Package Content */}
      <div className="p-6">
        <p className="text-gray-600 mb-6">{pkg.description}</p>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
          <div className="text-center">
            <Clock className="w-5 h-5 text-gray-400 mx-auto mb-1" />
            <div className="text-sm font-semibold text-gray-900">{pkg.deliveryDays} Days</div>
            <div className="text-xs text-gray-500">Delivery</div>
          </div>
          <div className="text-center">
            <RefreshCw className="w-5 h-5 text-gray-400 mx-auto mb-1" />
            <div className="text-sm font-semibold text-gray-900">
              {pkg.revisions === -1 ? 'Unlimited' : pkg.revisions}
            </div>
            <div className="text-xs text-gray-500">Revisions</div>
          </div>
        </div>

        {/* Features */}
        <div className="mb-6">
          <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
            Features Included
          </div>
          <div className="space-y-2">
            {pkg.features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Deliverables */}
        {pkg.deliverables && pkg.deliverables.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
              You Will Receive
            </div>
            <div className="space-y-2">
              {pkg.deliverables.map((deliverable, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                    <Sparkles className="w-3 h-3 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-700">{deliverable}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Select Button */}
        {onSelect && (
          <button
            onClick={() => onSelect(pkg)}
            className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              pkg.isPopular
                ? 'bg-gradient-to-r from-[#6C4BFF] to-[#5a3dd9] text-white hover:shadow-lg'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            Select Package
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Package Comparison View Component
 */
interface PackageComparisonProps {
  comparison: PackageComparison;
  onSelect?: (pkg: ServicePackage) => void;
}

const PackageComparison: React.FC<PackageComparisonProps> = ({ comparison, onSelect }) => {
  const tiers: Array<{ key: keyof PackageComparison; label: string }> = [
    { key: 'bronze', label: 'Bronze' },
    { key: 'silver', label: 'Silver' },
    { key: 'gold', label: 'Gold' }
  ];

  const activeTiers = tiers.filter(tier => comparison[tier.key]);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="p-6 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Compare Packages
              </th>
              {activeTiers.map(tier => {
                const pkg = comparison[tier.key];
                if (!pkg) return null;
                
                return (
                  <th key={tier.key} className="p-6 text-center">
                    <div className={`inline-block bg-gradient-to-r ${tierColors[tier.key as 'bronze' | 'silver' | 'gold']} text-white px-4 py-2 rounded-full text-sm font-semibold mb-2`}>
                      {tier.label}
                    </div>
                    {!Array.isArray(pkg) && pkg.isPopular && (
                      <div className="flex items-center justify-center gap-1 text-xs text-[#6C4BFF] font-semibold mt-1">
                        <Star className="w-3 h-3" />
                        Most Popular
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {/* Price */}
            <tr className="border-b border-gray-100">
              <td className="p-6 text-sm font-medium text-gray-700">Price</td>
              {activeTiers.map(tier => {
                const pkg = comparison[tier.key];
                return (
                  <td key={tier.key} className="p-6 text-center">
                    <div className="text-2xl font-bold text-gray-900">${!Array.isArray(pkg) && pkg?.price}</div>
                  </td>
                );
              })}
            </tr>

            {/* Delivery Time */}
            <tr className="border-b border-gray-100 bg-gray-50">
              <td className="p-6 text-sm font-medium text-gray-700">Delivery Time</td>
              {activeTiers.map(tier => {
                const pkg = comparison[tier.key];
                return (
                  <td key={tier.key} className="p-6 text-center text-gray-900 font-semibold">
                    {!Array.isArray(pkg) && pkg?.deliveryDays} days
                  </td>
                );
              })}
            </tr>

            {/* Revisions */}
            <tr className="border-b border-gray-100">
              <td className="p-6 text-sm font-medium text-gray-700">Revisions</td>
              {activeTiers.map(tier => {
                const pkg = comparison[tier.key];
                return (
                  <td key={tier.key} className="p-6 text-center text-gray-900 font-semibold">
                    {!Array.isArray(pkg) && (pkg?.revisions === -1 ? 'Unlimited' : pkg?.revisions)}
                  </td>
                );
              })}
            </tr>

            {/* Features (all unique features across packages) */}
            {(() => {
              const allFeatures = new Set<string>();
              activeTiers.forEach(tier => {
                const pkg = comparison[tier.key];
                if (!Array.isArray(pkg)) {
                  pkg?.features.forEach(f => allFeatures.add(f));
                }
              });

              return Array.from(allFeatures).map((feature, idx) => (
                <tr key={idx} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-gray-50' : ''}`}>
                  <td className="p-6 text-sm text-gray-700">{feature}</td>
                  {activeTiers.map(tier => {
                    const pkg = comparison[tier.key];
                    const hasFeature = !Array.isArray(pkg) && pkg?.features.includes(feature);
                    return (
                      <td key={tier.key} className="p-6 text-center">
                        {hasFeature ? (
                          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
                            <Check className="w-4 h-4 text-green-600" />
                          </div>
                        ) : (
                          <div className="inline-block w-2 h-2 rounded-full bg-gray-300" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ));
            })()}

            {/* Select Buttons */}
            {onSelect && (
              <tr>
                <td className="p-6"></td>
                {activeTiers.map(tier => {
                  const pkg = comparison[tier.key];
                  if (!pkg || Array.isArray(pkg)) return null;
                  
                  return (
                    <td key={tier.key} className="p-6">
                      <button
                        onClick={() => onSelect(pkg)}
                        className={`w-full py-3 rounded-lg font-semibold transition-all ${
                          pkg.isPopular
                            ? 'bg-gradient-to-r from-[#6C4BFF] to-[#5a3dd9] text-white hover:shadow-lg'
                            : 'bg-gray-900 text-white hover:bg-gray-800'
                        }`}
                      >
                        Select
                      </button>
                    </td>
                  );
                })}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * Compact Package View (for smaller spaces)
 */
interface CompactPackageViewProps {
  packages: ServicePackage[];
  onSelectPackage?: (pkg: ServicePackage) => void;
}

const CompactPackageView: React.FC<CompactPackageViewProps> = ({ packages, onSelectPackage }) => {
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-gray-700 mb-2">Service Packages</div>
      {packages.slice(0, 3).map(pkg => (
        <div
          key={pkg.id}
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onSelectPackage?.(pkg)}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${tierColors[pkg.tier]}`} />
              <span className="font-semibold text-gray-900">{pkg.name}</span>
              {pkg.isPopular && (
                <div className="bg-[#6C4BFF]/10 text-[#6C4BFF] px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Popular
                </div>
              )}
            </div>
            <div className="text-lg font-bold text-gray-900">${pkg.price}</div>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {pkg.deliveryDays}d
            </div>
            <div className="flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              {pkg.revisions === -1 ? '∞' : pkg.revisions} rev
            </div>
            <div className="flex items-center gap-1">
              <Check className="w-3 h-3" />
              {pkg.features.length} features
            </div>
          </div>
        </div>
      ))}
      {packages.length > 3 && (
        <div className="text-center text-sm text-gray-600">
          +{packages.length - 3} more packages
        </div>
      )}
    </div>
  );
};
