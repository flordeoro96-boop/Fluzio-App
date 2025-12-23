import React, { useEffect } from 'react';
import { User } from '../types';
import { Home, Search, Gift, Target, Calendar } from 'lucide-react';
import { CustomerHeader } from './CustomerHeader';
import { UserSwitcher } from './UserSwitcher';
import { store } from '../services/mockStore';
import { useTranslation } from 'react-i18next';
import { startGeofencing, isGeofencingActive } from '../services/geofencingService';

export enum CustomerTab {
  HOME = 'HOME',
  DISCOVER = 'DISCOVER',
  REWARDS = 'REWARDS',
  MISSIONS = 'MISSIONS',
  EVENTS = 'EVENTS'
}

interface CustomerLayoutProps {
  children: React.ReactNode;
  user: User;
  activeTab: CustomerTab;
  onTabChange: (tab: CustomerTab) => void;
  // Header Props
  onMenuClick: () => void;
  onNotificationClick: () => void;
  onMessagingClick: () => void;
  onSearchClick: () => void;
  unreadNotifications?: number;
  unreadMessages?: number;
}

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({ 
  children, 
  user, 
  activeTab, 
  onTabChange,
  onMenuClick,
  onNotificationClick,
  onMessagingClick,
  onSearchClick,
  unreadNotifications = 0,
  unreadMessages = 0
}) => {
  const { t } = useTranslation();
  
  // Auto-start geofencing if user had it enabled
  useEffect(() => {
    const initGeofencing = async () => {
      // Check if user has location tracking enabled in their profile
      if (user.locationTrackingEnabled && !isGeofencingActive()) {
        try {
          await startGeofencing(user.id);
          console.log('[CustomerLayout] Geofencing auto-started for user');
        } catch (error) {
          console.error('[CustomerLayout] Error auto-starting geofencing:', error);
        }
      }
    };

    initGeofencing();
  }, [user.id, user.locationTrackingEnabled]);
  
  const tabs = [
    { id: CustomerTab.HOME, icon: Home, label: t('navigation.home'), dataAttr: 'home-tab' },
    { id: CustomerTab.DISCOVER, icon: Search, label: t('navigation.explore'), dataAttr: 'explore-tab' },
    { id: CustomerTab.REWARDS, icon: Gift, label: t('navigation.rewards'), dataAttr: 'rewards-tab' },
    { id: CustomerTab.MISSIONS, icon: Target, label: t('navigation.missions'), dataAttr: 'missions-tab' },
    { id: CustomerTab.EVENTS, icon: Calendar, label: t('navigation.events'), dataAttr: 'meetups-tab' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FE] flex flex-col font-sans text-[#1E0E62]">
      {/* Header */}
      <CustomerHeader 
        user={user}
        onMenuClick={onMenuClick}
        onNotificationClick={onNotificationClick}
        onMessagingClick={onMessagingClick}
        onSearchClick={onSearchClick}
        unreadMessages={unreadMessages}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl mx-auto w-full bg-[#F8F9FE] relative mt-16">
        {/* Dev User Switcher - Top Right Corner */}
        <div className="fixed top-20 right-4 z-40">
          <UserSwitcher 
            currentUser={user} 
            onUserChange={(newUser) => store.setCurrentUser(newUser)}
          />
        </div>
        
        {children}
      </main>

      {/* Floating Bottom Navigation */}
      <nav className="fixed bottom-6 left-4 right-4 max-w-lg mx-auto z-50">
        <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-[32px] shadow-[0_20px_40px_rgba(114,9,183,0.1)] h-[72px] flex items-center justify-around px-2 relative overflow-hidden">
           
           {tabs.map(tab => {
             const isActive = activeTab === tab.id;
             return (
               <button
                 key={tab.id}
                 onClick={() => onTabChange(tab.id)}
                 data-onboarding={tab.dataAttr}
                 className="relative flex flex-col items-center justify-center w-full h-full group active:scale-90 transition-transform"
               >
                 <div className={`mb-1 transition-all duration-300 p-2 rounded-full ${isActive ? 'bg-gradient-to-tr from-[#FFC300] via-[#F72585] to-[#7209B7] text-white shadow-lg shadow-[#F72585]/30' : 'text-[#8F8FA3] group-hover:bg-gray-50'}`}>
                    <tab.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
                 </div>
                 {isActive && (
                   <span className="absolute -bottom-1 w-1 h-1 bg-[#1E0E62] rounded-full"></span>
                 )}
               </button>
             );
           })}
        </div>
      </nav>
    </div>
  );
};