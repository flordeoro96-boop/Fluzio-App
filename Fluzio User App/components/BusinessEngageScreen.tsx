import React, { useState } from 'react';
import { User } from '../types';
import { Target, Gift } from 'lucide-react';
import { MissionsView } from '../App';
import { RewardsAndPointsHub } from './RewardsAndPointsHub';

interface BusinessEngageScreenProps {
  user: User;
  onNavigate: (route: string, params?: any) => void;
}

type EngageView = 'missions' | 'rewards';

export const BusinessEngageScreen: React.FC<BusinessEngageScreenProps> = ({ user, onNavigate }) => {
  const [activeView, setActiveView] = useState<EngageView>('missions');

  return (
    <div className="h-full flex flex-col bg-[#F8F9FE]">
      {/* Segmented Control */}
      <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-3 sticky top-0 z-10">
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setActiveView('missions')}
            className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              activeView === 'missions'
                ? 'bg-white text-[#6C4BFF] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Target className="w-4 h-4" />
            Missions
          </button>
          <button
            onClick={() => setActiveView('rewards')}
            className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              activeView === 'rewards'
                ? 'bg-white text-[#6C4BFF] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Gift className="w-4 h-4" />
            Rewards
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeView === 'missions' ? (
          <MissionsView user={user} onNavigate={onNavigate} />
        ) : (
          <div className="p-6">
            <RewardsAndPointsHub
              businessId={user.id}
              businessName={user.name}
              businessLogo={user.avatarUrl}
              currentPoints={user.points || 0}
              onPointsChange={() => {
                console.log('[BusinessEngageScreen] Points changed');
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
