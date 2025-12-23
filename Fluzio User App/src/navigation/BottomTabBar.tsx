/**
 * Bottom Tab Bar Component
 * 
 * Renders the main navigation tabs for the customer app.
 */

import React from 'react';
import { MAIN_TABS, MainTabKey } from './config';
import { Home, Search, Gift, Target, Calendar } from 'lucide-react';

// ============================================================================
// PROPS
// ============================================================================

interface BottomTabBarProps {
  /** Currently active tab key */
  activeTab: MainTabKey;
  
  /** Callback when a tab is pressed */
  onTabPress: (routeName: string, tabKey: MainTabKey) => void;
}

// ============================================================================
// ICON MAP
// ============================================================================

const IconMap = {
  home: Home,
  search: Search,
  gift: Gift,
  target: Target,
  calendar: Calendar
};

// ============================================================================
// COMPONENT
// ============================================================================

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ 
  activeTab, 
  onTabPress 
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex items-center justify-around h-16">
          {MAIN_TABS.map((tab) => {
            const Icon = IconMap[tab.key];
            const isActive = activeTab === tab.key;
            
            return (
              <button
                key={tab.key}
                onClick={() => onTabPress(tab.routeName, tab.key)}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive ? 'text-[#F72585]' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon className={`w-6 h-6 mb-1 ${isActive ? 'stroke-[2.5]' : ''}`} />
                <span className={`text-xs font-bold ${isActive ? 'font-extrabold' : ''}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
