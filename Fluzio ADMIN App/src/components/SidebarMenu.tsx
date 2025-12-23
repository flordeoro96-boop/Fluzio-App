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
  
  /** Optional: callback for creator mode toggle */
  onToggleCreatorMode?: () => void;
  
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
  onToggleCreatorMode,
  onSwitchAccount
}) => {
  
  const [isTogglingCreatorMode, setIsTogglingCreatorMode] = useState(false);
  
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

  const handleToggleCreatorMode = async () => {
    if (onToggleCreatorMode) {
      setIsTogglingCreatorMode(true);
      try {
        await onToggleCreatorMode();
      } finally {
        setIsTogglingCreatorMode(false);
      }
    }
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

  const creatorZoneItems: MenuItem[] = [
    { id: 'my-skills', label: 'Skills', icon: Briefcase, route: 'creator-skills' },
    { id: 'my-portfolio', label: 'Portfolio', icon: Image, route: 'creator-portfolio' },
    { id: 'collaboration-requests', label: 'Collaboration Requests', icon: Handshake, route: 'collaboration-requests', badge: 3 },
    { id: 'creator-missions', label: 'Creator Missions', icon: Zap, route: 'creator-missions' },
    { id: 'creator-jobs', label: 'Creator Jobs', icon: Folder, route: 'creator-jobs' }
  ];

  const accountItems: MenuItem[] = [
    { id: 'manage-subscription', label: 'Manage Subscription', icon: CreditCard, route: 'manage-subscription' }
  ];

  const toolsItems: MenuItem[] = [
    { id: 'notifications', label: 'Notifications', icon: Bell, route: 'notifications' },
    { id: 'friends', label: 'Friends', icon: Users, route: 'friends' },
    { id: 'accessibility', label: 'Accessibility', icon: Eye, route: 'accessibility' },
    { id: 'settings', label: 'Settings', icon: Settings, route: 'settings' },
    { id: 'help', label: 'Help', icon: HelpCircle, route: 'help' }
  ];

  const businessToolsItems: MenuItem[] = [
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, route: 'analytics' },
    { id: 'customers', label: 'Customer CRM', icon: Users, route: 'customers' }
  ];

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
        <item.icon className="w-4 h-4 text-gray-500 group-hover:text-[#F72585]" />
        <span className="text-sm font-medium text-gray-700 group-hover:text-[#1E0E62]">
          {item.label}
        </span>
      </div>
      {item.badge && (
        <span className="bg-[#F72585] text-white text-xs font-bold px-2 py-0.5 rounded-full">
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
                className="w-14 h-14 rounded-full object-cover border-2 border-[#F72585]"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#F72585] to-[#7209B7] flex items-center justify-center">
                <User className="w-7 h-7 text-white" />
              </div>
            )}
            {user.creatorMode && (
              <div className="absolute -bottom-0.5 -right-0.5 bg-[#FFC300] rounded-full p-1">
                <Zap className="w-2.5 h-2.5 text-white" fill="white" />
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

        {/* Creator Mode Toggle */}
        <button
          onClick={handleToggleCreatorMode}
          disabled={isTogglingCreatorMode}
          className={`w-full flex items-center justify-between p-3 rounded-lg transition-all mb-2 ${
            isTogglingCreatorMode 
              ? 'bg-gray-100 cursor-wait' 
              : 'hover:bg-gray-50 active:bg-gray-100 cursor-pointer'
          }`}
        >
          <div className="flex items-center gap-2">
            <Zap 
              className={`w-4 h-4 transition-colors ${
                user.creatorMode ? 'text-[#FFC300]' : 'text-gray-400'
              } ${isTogglingCreatorMode ? 'animate-pulse' : ''}`}
              fill={user.creatorMode ? '#FFC300' : 'none'}
            />
            <span className="text-xs font-bold text-gray-700">
              Creator Mode
            </span>
          </div>
          <div className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
            user.creatorMode ? 'bg-[#FFC300]' : 'bg-gray-300'
          } ${isTogglingCreatorMode ? 'opacity-50' : ''}`}>
            <div className={`absolute w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform duration-300 ease-in-out top-0.5 ${
              user.creatorMode ? 'translate-x-5' : 'translate-x-0.5'
            }`} />
          </div>
        </button>

        {/* View Profile Button */}
        <button
          onClick={() => handleNavigate('profile')}
          className="w-full bg-gradient-to-r from-[#F72585] to-[#7209B7] text-white font-bold text-sm py-2 px-4 rounded-lg hover:shadow-lg transition-all"
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
                <LinkIcon className="w-4 h-4 text-gray-500 group-hover:text-[#F72585]" />
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

        {/* CREATOR ZONE (only if creator mode) */}
        {user.creatorMode && (
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
            {toolsItems.map(renderMenuItem)}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-red-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-4 h-4 text-gray-500 group-hover:text-red-500" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-red-600">
                  Log Out
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Fluzio v1.0</span>
          <div className="flex gap-2">
            <button 
              onClick={() => handleNavigate('privacy')}
              className="hover:text-[#F72585]"
            >
              Privacy
            </button>
            <span>·</span>
            <button 
              onClick={() => handleNavigate('terms')}
              className="hover:text-[#F72585]"
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
