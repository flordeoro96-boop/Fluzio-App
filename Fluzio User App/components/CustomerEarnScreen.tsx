import React, { useState } from 'react';
import { User } from '../types';
import { MissionsScreen } from './CustomerScreens';
import RewardsRedemption from './RewardsRedemption';
import { Target, Gift } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CustomerEarnScreenProps {
  user: User;
  onNavigateToCollaborate?: () => void;
}

/**
 * Combined Earn screen with Missions and Rewards tabs
 * Similar to BusinessEngageScreen for businesses
 */
export const CustomerEarnScreen: React.FC<CustomerEarnScreenProps> = ({ 
  user,
  onNavigateToCollaborate 
}) => {
  const { t } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState<'missions' | 'rewards'>('missions');

  return (
    <div className="min-h-screen bg-[#F8F9FE]">
      {/* Sub-tab Navigation */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="flex">
          <button
            onClick={() => setActiveSubTab('missions')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-semibold transition-all ${
              activeSubTab === 'missions'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Target className="w-5 h-5" />
            {t('navigation.missions')}
          </button>
          <button
            onClick={() => setActiveSubTab('rewards')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-semibold transition-all ${
              activeSubTab === 'rewards'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Gift className="w-5 h-5" />
            {t('navigation.rewards')}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="pb-24">
        {activeSubTab === 'missions' && (
          <MissionsScreen 
            user={user}
            onNavigateToCollaborate={onNavigateToCollaborate}
          />
        )}
        
        {activeSubTab === 'rewards' && (
          <RewardsRedemption user={user} />
        )}
      </div>
    </div>
  );
};
