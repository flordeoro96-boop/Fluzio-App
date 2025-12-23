/**
 * Rewards & Points Hub
 * Combined interface for rewards management, redemptions, and points marketplace
 */

import React, { useState } from 'react';
import RewardsManagement from './RewardsManagement';
import PointsMarketplace from './PointsMarketplace';
import { RedemptionsManagement } from './RedemptionsManagement';
import { Gift, ShoppingBag, Receipt } from 'lucide-react';

interface RewardsAndPointsHubProps {
  businessId: string;
  businessName: string;
  businessLogo?: string;
  currentPoints: number;
  onPointsChange?: () => void;
}

export const RewardsAndPointsHub: React.FC<RewardsAndPointsHubProps> = ({
  businessId,
  businessName,
  businessLogo,
  currentPoints,
  onPointsChange
}) => {
  const [activeSection, setActiveSection] = useState<'rewards' | 'redemptions' | 'marketplace'>('rewards');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Section Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveSection('rewards')}
              className={`px-4 md:px-6 py-4 font-bold text-xs md:text-sm transition-all relative whitespace-nowrap flex-shrink-0 ${
                activeSection === 'rewards'
                  ? 'text-[#6C4BFF]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Rewards Catalog</span>
                <span className="sm:hidden">Rewards</span>
              </div>
              {activeSection === 'rewards' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveSection('redemptions')}
              className={`px-4 md:px-6 py-4 font-bold text-xs md:text-sm transition-all relative whitespace-nowrap flex-shrink-0 ${
                activeSection === 'redemptions'
                  ? 'text-[#6C4BFF]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 md:w-5 md:h-5" />
                <span>Redemptions</span>
              </div>
              {activeSection === 'redemptions' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveSection('marketplace')}
              className={`px-4 md:px-6 py-4 font-bold text-xs md:text-sm transition-all relative whitespace-nowrap flex-shrink-0 ${
                activeSection === 'marketplace'
                  ? 'text-[#6C4BFF]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Points Marketplace</span>
                <span className="sm:hidden">Marketplace</span>
              </div>
              {activeSection === 'marketplace' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] rounded-t-full" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeSection === 'rewards' && (
          <RewardsManagement
            businessId={businessId}
            businessName={businessName}
            businessLogo={businessLogo}
          />
        )}
        {activeSection === 'redemptions' && (
          <RedemptionsManagement
            businessId={businessId}
          />
        )}
        {activeSection === 'marketplace' && (
          <PointsMarketplace
            businessId={businessId}
            businessName={businessName}
            currentPoints={currentPoints}
            onPointsChange={onPointsChange}
          />
        )}
      </div>
    </div>
  );
};

export default RewardsAndPointsHub;
