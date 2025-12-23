/**
 * SidebarMenu Component
 * 
 * Comprehensive sidebar navigation for Fluzio app.
 * Includes profile header, creator zone, activity tracking, and account management.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  User, 
  Target, 
  Gift, 
  MapPin, 
  Heart, 
  Calendar,
  Briefcase,
  Image,
  Users,
  Building2,
  TrendingUp,
  Trophy,
  Handshake,
  Folder,
  Zap,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  Instagram,
  Facebook,
  Linkedin,
  Link as LinkIcon,
  Bookmark,
  UserCircle,
  Settings,
  Edit3,
  RefreshCw,
  Crown,
  Coins,
  CreditCard,
  Eye
} from 'lucide-react';
import { UserProfile } from '../types/models';

// ============================================================================
// TYPES
// ============================================================================

interface SidebarMenuProps {
  /** Current user profile */
  user: UserProfile;
  
  /** Navigation callback */
  onNavigate: (routeName: string) => void;
  
  /** Logout callback */
  onLogout: () => void;
  
  /** Optional: callback to close sidebar (for mobile) */
  onClose?: () => void;
  
  /** Optional: callback for account switch */
  onSwitchAccount?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  route: string;
  badge?: number | string;
  showOnlyForCreators?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
  showOnlyForCreators?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const SidebarMenu: React.FC<SidebarMenuProps> = ({ 
  user, 
  onNavigate, 
  onLogout,
  onClose,
  onSwitchAccount
}) => {
  
  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  const handleNavigate = (route: string) => {
    onNavigate(route);
    onClose?.();
  };

  const handleLogout = () => {
    onLogout();
    onClose?.();
  };

  const handleSwitchAccount = () => {
    if (onSwitchAccount) {
      onSwitchAccount();
      onClose?.();
    }
  };

  // ============================================================================
  // USER TIER DISPLAY
  // ============================================================================
  
  const getTierDisplay = () => {
    return user.subscriptionLevel || 'FREE';
  };

  const getTierColor = () => {
    const tier = user.subscriptionLevel || 'FREE';
    if (tier === 'PLATINUM') return 'text-purple-600';
    if (tier === 'GOLD') return 'text-yellow-600';
    if (tier === 'SILVER') return 'text-gray-700';
    return 'text-gray-600';
  };

  // ============================================================================
  // MENU SECTIONS CONFIGURATION
  // ============================================================================

  console.log('[SidebarMenu] User role:', user.role, 'Type:', typeof user.role);
  console.log('[SidebarMenu] User accountType:', user.accountType);
  console.log('[SidebarMenu] Should show business tools:', user.role === 'BUSINESS');

  const creatorZoneItems: MenuItem[] = [
    { id: 'my-skills', label: 'Skills', icon: Briefcase, route: 'creator-skills' },
    { id: 'my-portfolio', label: 'Portfolio', icon: Image, route: 'creator-portfolio' },
    { id: 'collaboration-requests', label: 'Collaboration Requests', icon: Handshake, route: 'collaboration-requests', badge: 3 },
    { id: 'creator-missions', label: 'Creator Missions', icon: Zap, route: 'creator-missions' },
    { id: 'creator-jobs', label: 'Creator Jobs', icon: Folder, route: 'creator-jobs' }
  ];

  const userLevel = user.level || 2;
  const accountItems: MenuItem[] = [
    // Level 1 businesses see "Choose Your Plan", Level 2+ see "Manage Subscription"
    ...(user.role === 'BUSINESS' && userLevel === 1 ? [
      { id: 'level1-subscription', label: 'Choose Your Plan', icon: Crown, route: 'level1-subscription' }
    ] : user.role === 'BUSINESS' && userLevel >= 2 ? [
      { id: 'level2-subscription', label: 'Manage Subscription', icon: Crown, route: 'level2-subscription' }
    ] : [
      { id: 'manage-subscription', label: 'Manage Subscription', icon: CreditCard, route: 'manage-subscription' }
    ]),
    ...(user.role === 'BUSINESS' ? [
      { id: 'business-wallet', label: 'Business Wallet', icon: Coins, route: 'business-wallet' }
    ] : user.accountType === 'creator' ? [
      { id: 'creator-wallet', label: 'Creator Wallet', icon: Coins, route: 'creator-wallet' }
    ] : [])
  ];
  
  console.log('[SidebarMenu] accountItems:', accountItems.length, 'items', accountItems.map(i => i.label));

  const toolsItems: MenuItem[] = [
    { id: 'notifications', label: 'Notifications', icon: Bell, route: 'notifications' },
    { id: 'friends', label: 'Friends', icon: Users, route: 'friends' },
    { id: 'accessibility', label: 'Accessibility', icon: Eye, route: 'accessibility' },
    { id: 'settings', label: 'Settings', icon: Settings, route: 'settings' },
    { id: 'help', label: 'Help', icon: HelpCircle, route: 'help' }
  ];

  // Filter business tools based on level (Level 1 = aspiring businesses, no analytics/customers yet)
  const allBusinessTools = [
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, route: 'analytics', minLevel: 2 },
    { id: 'customers', label: 'Customer CRM', icon: Users, route: 'customers', minLevel: 2 },
    { id: 'leaderboard', label: 'Business Leaderboard', icon: Trophy, route: 'leaderboard', minLevel: 1 },
    { id: 'achievements', label: 'Achievements', icon: Trophy, route: 'achievements', minLevel: 1 }
  ];
  const businessToolsItems: MenuItem[] = allBusinessTools.filter((item: any) => userLevel >= (item.minLevel || 1));

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderMenuItem = (item: MenuItem) => (
    <button
      key={item.id}
      onClick={() => handleNavigate(item.route)}
      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <item.icon className="w-4 h-4 text-gray-500 group-hover:text-[#00E5FF]" />
        <span className="text-sm font-medium text-gray-700 group-hover:text-[#1E0E62]">
          {item.label}
        </span>
      </div>
      {item.badge && (
        <span className="bg-[#00E5FF] text-white text-xs font-bold px-2 py-0.5 rounded-full">
          {item.badge}
        </span>
      )}
    </button>
  );

  const renderSection = (title: string, items: MenuItem[]) => (
    <div className="mb-4">
      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">
        {title}
      </h3>
      <div className="space-y-0.5">
        {items.map(renderMenuItem)}
      </div>
    </div>
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      
      {/* PROFILE HEADER */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start gap-3 mb-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {user.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt={user.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-[#00E5FF]"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00E5FF] to-[#6C4BFF] flex items-center justify-center">
                <User className="w-7 h-7 text-white" />
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-base text-[#1E0E62] truncate">
              {user.name}
            </h2>
            <p className="text-xs text-gray-500 truncate">
              {user.handle}
            </p>
            <p className="text-xs text-gray-400 truncate mt-0.5">
              📍 {user.city}
            </p>
          </div>
        </div>

        {/* Tier & Credits */}
        <div className="flex items-center gap-2 mb-3">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-md bg-gray-50 ${getTierColor()}`}>
            <Crown className="w-3 h-3" />
            <span className="text-xs font-bold">
              {getTierDisplay()}
            </span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-purple-50">
            <Coins className="w-3 h-3 text-purple-600" />
            <span className="text-xs font-bold text-purple-600">
              {user.points.toLocaleString()}
            </span>
          </div>
        </div>

        {/* View Profile Button */}
        <button
          onClick={() => handleNavigate('profile')}
          className="w-full bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white font-bold text-sm py-2 px-4 rounded-lg hover:shadow-lg transition-all"
        >
          View Profile
        </button>
      </div>

      {/* Scrollable Menu Content */}
      <div className="flex-1 overflow-y-auto py-3 px-2">
        
        {/* CONNECTIONS */}
        <div className="mb-4">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Connections
          </h3>
          <div className="space-y-0.5">
            <button
              onClick={() => handleNavigate('linked-accounts')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <LinkIcon className="w-4 h-4 text-gray-500 group-hover:text-[#00E5FF]" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-[#1E0E62]">
                  Linked Accounts
                </span>
              </div>
              <div className="flex items-center gap-1">
                {user.socialLinks?.instagram?.connected && <Instagram className="w-3.5 h-3.5 text-pink-500" />}
                {user.socialLinks?.facebook && <Facebook className="w-3.5 h-3.5 text-blue-600" />}
                {user.socialLinks?.linkedin && <Linkedin className="w-3.5 h-3.5 text-blue-700" />}
              </div>
            </button>
          </div>
        </div>

        {/* CREATOR ZONE (only if creator account) */}
        {user.accountType === 'creator' && (
          <>
            {renderSection('Creator Zone', creatorZoneItems)}
          </>
        )}

        {/* ACCOUNT */}
        {renderSection('Account', accountItems)}

        {/* BUSINESS TOOLS (only for business users) */}
        {user.role === 'BUSINESS' && renderSection('Business Tools', businessToolsItems)}

        {/* TOOLS */}
        <div className="mb-4">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Tools
          </h3>
          <div className="space-y-0.5">
            {toolsItems.filter(item => !['settings', 'help'].includes(item.id)).map(renderMenuItem)}
          </div>
        </div>
      </div>

      {/* Footer - Horizontal Layout for Settings, Help, Sign Out */}
      <div className="p-3 border-t border-gray-100 bg-gray-50">
        <div className="flex justify-around items-center gap-2 mb-3">
          {/* Settings */}
          <button
            onClick={() => onNavigate('settings')}
            className="flex flex-col items-center gap-1.5 text-gray-500 hover:text-[#1E0E62] transition-colors flex-1"
          >
            <Settings className="w-6 h-6" />
            <span className="text-xs font-medium">Settings</span>
          </button>

          {/* Help */}
          <button
            onClick={() => onNavigate('help')}
            className="flex flex-col items-center gap-1.5 text-gray-500 hover:text-[#1E0E62] transition-colors flex-1"
          >
            <HelpCircle className="w-6 h-6" />
            <span className="text-xs font-medium">Help</span>
          </button>

          {/* Sign Out */}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-1.5 text-red-400 hover:text-red-600 transition-colors flex-1"
          >
            <LogOut className="w-6 h-6" />
            <span className="text-xs font-medium text-red-500 hover:text-red-600">Sign Out</span>
          </button>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Fluzio v1.0</span>
          <div className="flex gap-2">
            <button 
              onClick={() => handleNavigate('privacy')}
              className="hover:text-[#00E5FF]"
            >
              Privacy
            </button>
            <span>·</span>
            <button 
              onClick={() => handleNavigate('terms')}
              className="hover:text-[#00E5FF]"
            >
              Terms
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarMenu;
