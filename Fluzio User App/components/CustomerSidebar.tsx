import React from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../types';
import { useAuth } from '../services/AuthContext';
import { store } from '../services/mockStore';
import { 
  X, User as UserIcon, Link as LinkIcon, Plane, Repeat, 
  Settings, HelpCircle, LogOut, Instagram, Video, CheckCircle2, AlertCircle, Wallet, Eye
} from 'lucide-react';
import { Badge } from './Common';

interface CustomerSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onLogout: () => void;
  onSwitchProfile: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  userProfileRole?: string;
}

export const CustomerSidebar: React.FC<CustomerSidebarProps> = ({
  isOpen,
  onClose,
  user,
  onLogout,
  onSwitchProfile,
  onOpenProfile,
  onOpenSettings,
  userProfileRole
}) => {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  
  if (!isOpen) return null;

  // Use Firestore profile data if available, otherwise fallback to mock user
  const displayName = userProfile?.name || user.name;
  const displayPhoto = userProfile?.photoUrl || user.avatarUrl;
  
  // Check if user is business - check multiple sources
  const isBusiness = userProfileRole === 'BUSINESS' || 
                     userProfile?.role === 'BUSINESS' || 
                     user.role === 'BUSINESS' ||
                     user.businessType !== undefined || // Has businessType field = business user
                     user.category !== undefined; // Has category field = business user
  
  const displayRole = isBusiness ? 'Business' : 'Creator';
  // Get current subscription from userProfile
  const displayPlanTier = userProfile?.subscriptionLevel || user.subscriptionLevel || 'SILVER';
  const displayCredits = userProfile?.credits || user.points || 150;
  const displayCity = userProfile?.homeCity || user.currentCity || 'Global';

  // Debug log
  console.log('CustomerSidebar - isBusiness:', isBusiness, 'displayRole:', displayRole, 'userProfileRole:', userProfileRole, 'user.role:', user.role, 'user.businessType:', user.businessType, 'user.category:', user.category);

  return (
    <div className="fixed inset-0 z-[100] flex">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-[#1E0E62]/30 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      {/* Sidebar Content */}
      <div className="relative w-80 bg-[#F8F9FE] h-full shadow-2xl transform transition-transform duration-300 flex flex-col animate-in slide-in-from-left rounded-r-[32px] overflow-hidden">
        
        {/* --- Section A: Identity Header --- */}
        <div className="p-8 bg-white relative">
            <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-400" />
            </button>

            <div className="flex flex-col items-center text-center">
                <div className="p-[3px] bg-gradient-to-br from-[#FFB86C] via-[#00E5FF] to-[#6C4BFF] rounded-full mb-4 shadow-lg shadow-[#00E5FF]/20">
                    <img 
                        src={displayPhoto} 
                        alt={displayName} 
                        className="w-20 h-20 rounded-full border-4 border-white object-cover" 
                    />
                </div>
                <h2 className="text-2xl font-clash font-bold text-[#1E0E62]">{displayName}</h2>
                <p className="text-sm text-[#8F8FA3] font-medium mb-4">
                    @{user.socialLinks?.instagram?.username?.replace('@', '') || displayName.toLowerCase().replace(' ', '_')}
                </p>

                <div className="flex flex-wrap gap-2 justify-center">
                    {/* Plan Tier Badge */}
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#FFB86C]/10 border border-[#FFB86C]/50 text-[#d9a500] text-xs font-bold">
                        <span className="mr-1">🥈</span> {displayPlanTier}
                    </div>
                    {/* Role Badge */}
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200">
                        {displayRole}
                    </div>
                    {/* Location Badge */}
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-[#8F8FA3] text-xs font-bold border border-gray-200">
                        📍 {displayCity}
                    </div>
                </div>

                {/* Credits Display */}
                <div className="mt-4 w-full bg-gradient-to-r from-[#FFB86C]/10 to-[#00E5FF]/10 p-3 rounded-2xl border border-[#FFB86C]/30">
                    <div className="flex items-center justify-center gap-2">
                        <Wallet className="w-4 h-4 text-[#00E5FF]" />
                        <span className="text-lg font-clash font-bold text-[#1E0E62]">{displayCredits}</span>
                        <span className="text-xs text-[#8F8FA3] font-bold">Credits</span>
                    </div>
                </div>
            </div>
        </div>

        {/* --- Section B: Menu Items --- */}
        <div className="flex-1 overflow-y-auto py-4 px-4 space-y-3">

            {/* Item 1: Social Connections */}
            <button className="w-full bg-white p-4 rounded-2xl border border-white shadow-sm hover:shadow-md transition-all flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-full bg-pink-50 text-[#00E5FF] flex items-center justify-center group-hover:bg-[#00E5FF] group-hover:text-white transition-colors">
                    <LinkIcon className="w-5 h-5" />
                </div>
                <div className="text-left flex-1">
                    <div className="font-bold text-[#1E0E62] text-sm">{t('settings.linkedAccounts')}</div>
                    <div className="text-xs text-[#8F8FA3]">{t('linkedAccounts.subtitle')}</div>
                </div>
                {/* Status Indicators */}
                <div className="flex -space-x-2">
                   <div className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${user.socialLinks?.instagram?.connected ? 'bg-gradient-to-tr from-yellow-400 to-purple-600' : 'bg-gray-200'}`}>
                       <Instagram className="w-3 h-3 text-white" />
                       {user.socialLinks?.instagram?.connected && <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white"></div>}
                   </div>
                   <div className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${user.socialLinks?.tiktok?.connected ? 'bg-black' : 'bg-gray-200'}`}>
                       <Video className="w-3 h-3 text-white" />
                       {user.socialLinks?.tiktok?.connected && <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white"></div>}
                   </div>
                </div>
            </button>

            {/* Item 3: Jetsetter Pass */}
            <button className="w-full bg-gradient-to-r from-[#FFB86C]/20 to-[#00E5FF]/10 p-4 rounded-2xl border border-[#FFB86C]/30 shadow-[0_4px_15px_rgba(255,195,0,0.2)] hover:shadow-[0_4px_20px_rgba(255,195,0,0.4)] transition-all flex items-center gap-4 group relative overflow-hidden">
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFB86C] to-orange-400 text-white flex items-center justify-center relative z-10 shadow-lg shadow-orange-300/50">
                    <Plane className="w-5 h-5" />
                </div>
                <div className="text-left flex-1 relative z-10">
                    <div className="font-clash font-bold text-[#1E0E62] text-sm flex items-center gap-1">
                        {t('sidebar.jetsetterPass', 'Jetsetter Pass')} <span className="text-[10px] bg-[#FFB86C] text-[#1E0E62] px-1.5 rounded font-black">PRO</span>
                    </div>
                    <div className="text-xs text-[#1E0E62]/70 font-medium">{t('sidebar.unlockGlobal', 'Unlock Global Missions')}</div>
                </div>
            </button>

            {/* Item 4: Switch Account */}
            <button onClick={onSwitchProfile} className="w-full bg-white p-4 rounded-2xl border border-white shadow-sm hover:shadow-md transition-all flex items-center gap-4 group mt-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center group-hover:bg-[#1E0E62] group-hover:text-white transition-colors">
                    <Repeat className="w-5 h-5" />
                </div>
                <div className="text-left flex-1">
                    <div className="font-bold text-[#1E0E62] text-sm">{t('profile.switchProfile')}</div>
                    <div className="text-xs text-[#8F8FA3]">{t('sidebar.businessPersonal', 'Business ↔ Personal')}</div>
                </div>
            </button>

        </div>

        {/* --- Section C: Footer --- */}
        <div className="p-6 bg-white border-t border-gray-100">
             {/* My Profile Button - Customer-specific */}
             <button 
                onClick={onOpenProfile} 
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-3 group mb-4"
             >
                <div className="w-10 h-10 rounded-full bg-white text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UserIcon className="w-5 h-5" />
                </div>
                <div className="text-left flex-1">
                    <div className="font-bold text-white text-sm">
                        ✨ {t('profile.yourProfile')}
                    </div>
                    <div className="text-xs text-purple-100">
                        {t('customerProfile.viewAndManage')}
                    </div>
                </div>
             </button>
             
             {/* Tools Section - Vertical List */}
             <div className="space-y-0 mb-4">
                {/* Accessibility */}
                <button className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 transition-colors group">
                    <Eye className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                        {t('navigation.accessibility', 'Accessibility')}
                    </span>
                </button>
                
                {/* Settings */}
                <button onClick={onOpenSettings} className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 transition-colors group">
                    <Settings className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                        {t('navigation.settings')}
                    </span>
                </button>

                {/* Help */}
                <button className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 transition-colors group">
                    <HelpCircle className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                        {t('settings.help')}
                    </span>
                </button>

                {/* Log Out */}
                <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 transition-colors group">
                    <LogOut className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                        {t('auth.signOut')}
                    </span>
                </button>
             </div>
             
             <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Beevvy v1.2.0</span>
                <div className="flex gap-2">
                    <button className="hover:text-[#00E5FF]">Privacy</button>
                    <span>·</span>
                    <button className="hover:text-[#00E5FF]">Terms</button>
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};
