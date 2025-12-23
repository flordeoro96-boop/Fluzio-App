import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, ViewState, Mission, MissionStatus, Participation, MissionCategory, ProofType, RewardType, Conversation, Message, StrategicMatch, BusinessGoal, SubscriptionLevel, MainTab, MissionTheme, OnboardingState, CreatorInsight, RegularInsight, Squad, Project, Notification, BusinessCategory } from './types';
import { store } from './services/mockStore';
import { useTranslation } from 'react-i18next';
import { api } from './services/apiService';
import { initSentry, SentryErrorBoundary } from './services/sentryService';
import { MISSION_THEMES, getThemesForBusiness } from './services/missionThemes';
import { findStrategicMatches } from './services/geminiService';
import { updateUserLocation, watchUserLocation, stopWatchingLocation } from './services/locationService';
import { getParticipationsForBusiness, approveParticipation } from './src/services/participationService';
import { Card, Button, Input, Select, TextArea, Badge, Modal } from './components/Common';
import { MissionCard } from './components/MissionCard';
import { SquadView } from './components/SquadView';
import { MatchView } from './components/MatchView';
import { ProjectList } from './components/ProjectList';
import { CreateProjectModal } from './components/CreateProjectModal';
import { AICollaborationSuggestions } from './components/AICollaborationSuggestions';
import { LocationChangeModal } from './components/LocationChangeModal';
import { ServiceMarketplace } from './components/ServiceMarketplace';
import { PremiumEvents } from './components/PremiumEvents';
import { SubscriptionView } from './components/SubscriptionView';
import { WalletView } from './components/WalletView';
import { SettingsView } from './components/SettingsView';
import { InboxScreen } from './components/InboxScreen';
import { NotificationList } from './components/NotificationList';
import { NotificationPreferences } from './components/notifications/NotificationPreferences';
import { EnhancedNotificationList } from './components/notifications/EnhancedNotificationList';
import { StandardMissionsList } from './components/StandardMissionsList';
import { CustomerLayout, CustomerTab } from './components/CustomerLayout';
import { MissionsScreen, CommunityScreen } from './components/CustomerScreens';
import { ExploreScreen } from './components/ExploreScreen';
import { RewardsScreen } from './components/RewardsScreen';
import RewardsRedemption from './components/RewardsRedemption';
import { MeetupsScreen } from './components/MeetupsScreen';
import { CreatorWalletScreen } from './components/CreatorWalletScreen';
import { CreatorSkillsScreen } from './components/CreatorSkillsScreen';
import { CreatorPortfolioScreen } from './components/CreatorPortfolioScreen';
import { CollaborationRequestsScreen } from './components/CollaborationRequestsScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { SidebarMenu } from './src/components/SidebarMenu';
import { ZeroState } from './components/ZeroState';
import { HelpSheet } from './components/HelpSheet';
import { SignUpScreen } from './components/SignUpScreen';
import { PendingApprovalScreen } from './components/PendingApprovalScreen';
import { VerifyScreen } from './components/VerifyScreen';
import { BusinessProfileScreen } from './components/BusinessProfileScreen';
import { EditBusinessProfile } from './components/EditBusinessProfile';
import { QRCodeView } from './components/QRCodeView';
import { PasswordResetModal } from './components/PasswordResetModal';
import { EmailVerificationBanner } from './components/EmailVerificationBanner';
import { InstagramCallbackScreen } from './components/InstagramCallbackScreen';
import { CustomerProfileModal } from './components/CustomerProfileModal';
import { CustomerSettingsModal } from './components/CustomerSettingsModal';
import { CustomerSubscriptionModal } from './components/CustomerSubscriptionModal';
import { LinkedAccountsModal } from './components/LinkedAccountsModal';
import { HelpModal } from './components/HelpModal';
import { AnalyticsView } from './components/AnalyticsView';
import { MissionCreationModal } from './components/MissionCreationModal';
import { OnboardingFlow } from './components/OnboardingFlow';
import { GlobalSearch } from './components/GlobalSearch';
import { FriendsModal } from './components/FriendsModal';
import { OfflineDetector } from './components/OfflineDetector';
import { AccessibilityModal } from './components/AccessibilityModal';
import { AnalyticsDashboard } from './components/business/AnalyticsDashboard';
import { CustomerCRM } from './components/business/CustomerCRM';
import { AdminDashboard } from './components/AdminDashboard';
import RewardsAndPointsHub from './components/RewardsAndPointsHub';
import { useAuth } from './services/AuthContext';
import { 
  LayoutDashboard, Users, Store, Handshake, 
  Menu, X, Sparkles, Bell, Settings, LogOut, 
  CreditCard, Wallet, ChevronRight, ArrowLeft, ArrowRight,
  Building2, User as UserIcon, MessageSquare,
  MapPin, Smartphone, TrendingUp, Heart, Camera, PlusCircle,
  Star, Clapperboard, Martini, Package, ShoppingBag, Play, Sun, Dumbbell, Search, Mic, UserPlus, ThumbsUp, MessageCircle, Video,
  Share2, Info, Globe, QrCode, BarChart3, Gift, HelpCircle, Tag, Shield
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// --- Layout Wrapper (Business) ---

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  onMenuClick: () => void;
  onMessagingClick: () => void;
  unreadMessages: number;
  // Notification Props
  notifications: Notification[];
  unreadNotifications: number;
  onNotificationClick: () => void;
  isNotificationsOpen: boolean;
  closeNotifications: () => void;
  onNavigate: (link: string) => void;
}

const BusinessLayout: React.FC<LayoutProps> = ({ 
  children, user, activeTab, onTabChange, onMenuClick, onMessagingClick, unreadMessages,
  notifications, unreadNotifications, onNotificationClick, isNotificationsOpen, closeNotifications, onNavigate
}) => {

  return (
    <div className="min-h-screen bg-[#F8F9FE] flex flex-col font-sans text-[#1E0E62]">
      {/* Top Bar */}
      <TopBar 
         user={user} 
         onMenuClick={onMenuClick} 
         onMessagingClick={onMessagingClick}
         unreadMessages={unreadMessages}
         onNotificationClick={onNotificationClick}
         unreadNotifications={unreadNotifications}
       />
       
       {/* Notification Dropdown */}
       {isNotificationsOpen && (
         <>
            <div className="fixed inset-0 z-40" onClick={closeNotifications}></div>
            <NotificationList 
                notifications={notifications} 
                onClose={closeNotifications}
                onNavigate={onNavigate}
                userId={user.id}
            />
         </>
       )}

       {/* Main Content Area */}
       <main className="flex-1 pt-20 pb-24 px-4 max-w-2xl mx-auto w-full">
         {children}
       </main>

       {/* Bottom Navigation */}
       <BottomNav activeTab={activeTab} onChange={onTabChange} />
    </div>
  );
};

// --- Components ---

const TopBar: React.FC<{ 
    onMenuClick: () => void; 
    onMessagingClick: () => void;
    unreadMessages: number;
    user: User;
    onNotificationClick: () => void;
    unreadNotifications: number;
}> = ({ onMenuClick, onMessagingClick, unreadMessages, user, onNotificationClick, unreadNotifications }) => {
    const isAdmin = user.role === UserRole.ADMIN || user.email === 'admin@fluzio.com';
    
    return (
    <header className="fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-4 z-40 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm">
        {/* Left: Avatar (Opens Drawer) - Gradient Ring */}
        <button onClick={onMenuClick} className="group relative">
             <div className="absolute -inset-[3px] bg-gradient-to-tr from-[#FFC300] via-[#F72585] to-[#7209B7] rounded-full opacity-100 group-hover:opacity-90 transition-opacity"></div>
             <div className="relative bg-white p-[2px] rounded-full">
                <img src={user.avatarUrl} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
             </div>
             {isAdmin && (
               <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                 <Shield className="w-3 h-3 text-white" />
               </div>
             )}
        </button>

        {/* Center: Logo */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#FFC300] via-[#F72585] to-[#7209B7] rounded-xl text-white flex items-center justify-center shadow-lg shadow-[#F72585]/30">
                <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-clash font-bold text-xl text-[#1E0E62] tracking-tight">Fluzio</span>
              {isAdmin && (
                <span className="text-[9px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 -mt-1">ADMIN MODE</span>
              )}
            </div>
        </div>

        {/* Right: Icons */}
        <div className="flex items-center gap-3">
            <button onClick={onNotificationClick} className="p-2 text-[#8F8FA3] hover:bg-gray-100/50 rounded-full transition-all active:scale-90 relative">
                <Bell className="w-6 h-6" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-[#F72585] rounded-full ring-2 ring-white animate-pulse"></span>
                )}
            </button>
            <button onClick={onMessagingClick} className="p-2 text-[#8F8FA3] hover:bg-gray-100/50 rounded-full transition-all active:scale-90 relative">
                <MessageSquare className="w-6 h-6" />
                {unreadMessages > 0 && (
                    <span className="absolute top-1 right-1 bg-[#7209B7] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] flex items-center justify-center border border-white shadow-sm">
                        {unreadMessages}
                    </span>
                )}
            </button>
        </div>
    </header>
    );
};

const BottomNav: React.FC<{ activeTab: MainTab, onChange: (tab: MainTab) => void }> = ({ activeTab, onChange }) => {
    const { t } = useTranslation();
    const tabs = [
        { id: MainTab.DASHBOARD, icon: LayoutDashboard, label: t('navigation.home') },
        { id: MainTab.CUSTOMERS, icon: Users, label: 'Customers' },
        { id: MainTab.MISSIONS, icon: Store, label: t('navigation.missions') },
        { id: MainTab.REWARDS, icon: Tag, label: 'Rewards' },
        { id: MainTab.B2B, icon: Handshake, label: t('business.partners') },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-white/50 pb-safe-bottom z-40 shadow-[0_-8px_30px_rgba(114,9,183,0.05)]">
            <div className="flex justify-around items-center h-20 px-2">
                {tabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button 
                            key={tab.id}
                            onClick={() => onChange(tab.id)}
                            className={`flex flex-col items-center justify-center w-full h-full transition-all active:scale-95`}
                        >
                            <div className={`mb-1 transition-all duration-300 ${isActive ? '-translate-y-1' : ''}`}>
                                {isActive ? (
                                    <div className="text-transparent bg-clip-text bg-gradient-to-tr from-[#F72585] to-[#7209B7]">
                                        <tab.icon className="w-7 h-7 stroke-[2.5px] text-[#F72585]" />
                                    </div>
                                ) : (
                                    <tab.icon className="w-7 h-7 stroke-[1.5px] text-[#8F8FA3]" />
                                )}
                            </div>
                            <span className={`text-[10px] font-bold tracking-wide transition-colors ${isActive ? 'text-[#1E0E62]' : 'text-[#8F8FA3]'}`}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

// --- Components (Drawer, etc) --- 

const UserDrawer: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  user: User; 
  onLogout: () => void;
  onSwitchProfile: () => void;
  onOpenSubscription: () => void;
  onOpenWallet: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenAdminPanel?: () => void;
}> = ({ isOpen, onClose, user, onLogout, onSwitchProfile, onOpenSubscription, onOpenWallet, onOpenSettings, onOpenProfile, onOpenAdminPanel }) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const isAdmin = user.role === UserRole.ADMIN || user.email === 'admin@fluzio.com';

  return (
    <div className="fixed inset-0 z-[100] flex">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-[#1E0E62]/20 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      {/* Drawer Content */}
      <div className="relative w-80 bg-white h-full shadow-2xl transform transition-transform duration-300 flex flex-col animate-in slide-in-from-left rounded-r-[32px]">
        {/* Header */}
        <div className="p-8 bg-gradient-to-br from-[#1E0E62] to-[#2b148a] text-white">
            <div className="flex justify-between items-start mb-6">
               <div className="p-[2px] rounded-full bg-gradient-to-tr from-[#FFC300] via-[#F72585] to-[#7209B7]">
                   <img src={user.avatarUrl} alt={user.name} className="w-16 h-16 rounded-full border-4 border-[#1E0E62] object-cover" />
               </div>
               <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                   <X className="w-6 h-6 text-white/70" />
               </button>
            </div>
            <h2 className="text-2xl font-clash font-bold">{user.name}</h2>
            <div className="flex items-center gap-2 mt-2">
                <Badge text={`${user.subscriptionLevel}`} color="bg-[#F72585] text-white border-none shadow-lg shadow-pink-500/20" />
                <span className="text-xs text-gray-300 font-bold capitalize tracking-wider">{user.role.toLowerCase()}</span>
            </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-6 space-y-1">
            {/* Subscription & Wallet */}
            <MenuItem icon={CreditCard} label={t('settings.subscription')} subLabel={t('business.dashboard')} onClick={onOpenSubscription} />
            <MenuItem icon={Wallet} label={t('business.wallet')} subLabel={`${user.points} ${t('rewards.credits')}`} onClick={onOpenWallet} />
            
            {/* Admin Panel - Only for ADMIN users */}
            {isAdmin && onOpenAdminPanel && (
              <>
                <div className="mx-6 my-4 h-px bg-gray-100"></div>
                <button 
                  onClick={onOpenAdminPanel}
                  className="w-full flex items-center gap-4 px-8 py-4 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all text-left group"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-[#1E0E62] flex items-center gap-2">
                      Admin Panel
                      <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] rounded-full font-bold">ADMIN</span>
                    </div>
                    <div className="text-xs text-[#8F8FA3] font-medium">Platform Management & Control</div>
                  </div>
                </button>
              </>
            )}
            
            <div className="mx-6 my-4 h-px bg-gray-100"></div>
            
            {/* Switch Profile */}
            <button 
                onClick={onSwitchProfile}
                className="w-full flex items-center gap-4 px-8 py-4 hover:bg-gray-50 transition-colors text-left group"
            >
                <div className="w-10 h-10 bg-[#4CC9F0]/10 rounded-full flex items-center justify-center group-hover:bg-[#4CC9F0]/20 transition-colors">
                        <UserIcon className="w-5 h-5 text-[#4CC9F0]" />
                </div>
                <div className="flex-1">
                    <div className="font-bold text-sm text-[#1E0E62]">{t('profile.switchProfile')}</div>
                    <div className="text-xs text-[#8F8FA3] font-medium">{t('business.title')} ↔ {t('profile.creator')}</div>
                </div>
            </button>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-white">
             {/* Business Profile Button - Prominent */}
             <button 
                onClick={onOpenProfile}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-3 group mb-6"
             >
                <div className="w-10 h-10 rounded-full bg-white text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Building2 className="w-5 h-5" />
                </div>
                <div className="text-left flex-1">
                    <div className="font-bold text-white text-sm">
                        🏢 {t('settings.businessProfile')}
                    </div>
                    <div className="text-xs text-purple-100">
                        {t('profile.viewProfile')} & {t('profile.editProfile')}
                    </div>
                </div>
             </button>
             
             {/* Small Icon Row - Settings, Help, Logout */}
             <div className="flex justify-between mb-4">
                <button onClick={onOpenSettings} className="flex flex-col items-center gap-1 text-[#8F8FA3] hover:text-[#1E0E62] transition-colors">
                    <Settings className="w-5 h-5" />
                    <span className="text-[10px] font-bold">{t('navigation.settings')}</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-[#8F8FA3] hover:text-[#1E0E62] transition-colors">
                    <HelpCircle className="w-5 h-5" />
                    <span className="text-[10px] font-bold">{t('settings.help')}</span>
                </button>
                <button onClick={onLogout} className="flex flex-col items-center gap-1 text-red-400 hover:text-red-600 transition-colors">
                    <LogOut className="w-5 h-5" />
                    <span className="text-[10px] font-bold">{t('auth.signOut')}</span>
                </button>
             </div>
        </div>
      </div>
    </div>
  );
};

const MenuItem: React.FC<{ icon: any, label: string, subLabel?: string, onClick?: () => void }> = ({ icon: Icon, label, subLabel, onClick }) => (
    <button onClick={onClick} className="w-full flex items-center gap-4 px-8 py-4 hover:bg-gray-50 transition-colors text-left active:scale-[0.98]">
        <Icon className="w-5 h-5 text-[#8F8FA3]" />
        <div className="flex-1">
            <div className="font-bold text-[#1E0E62]">{label}</div>
            {subLabel && <div className="text-xs text-[#8F8FA3] font-medium">{subLabel}</div>}
        </div>
    </button>
);

const SubTabs: React.FC<{ tabs: string[], active: string, onChange: (t: string) => void }> = ({ tabs, active, onChange }) => (
    <div className="sticky top-16 bg-[#F8F9FE]/95 backdrop-blur z-30 pt-2 pb-2 mb-4">
        <div className="flex gap-2 md:gap-3 overflow-x-auto no-scrollbar px-1">
            {tabs.map(t => {
                const isActive = active === t;
                return (
                <button
                    key={t}
                    onClick={() => onChange(t)}
                    className={`px-3 md:px-5 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                        isActive 
                        ? 'bg-[#1E0E62] text-white shadow-lg shadow-[#1E0E62]/20' 
                        : 'bg-white text-[#8F8FA3] border border-white hover:bg-gray-50'
                    }`}
                >
                    {t}
                </button>
            )})}
        </div>
    </div>
  );

// --- Views Content ---

const TaskRow: React.FC<{ icon: any, color: string, bgColor: string, title: string, subtext: string, onClick: () => void }> = ({ 
    icon: Icon, color, bgColor, title, subtext, onClick 
}) => (
    <button 
        onClick={onClick}
        className="w-full flex items-center justify-between p-4 bg-white/90 backdrop-blur-xl rounded-[24px] border border-white shadow-sm hover:shadow-md transition-all active:scale-[0.98] group"
    >
        <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${bgColor} ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6" />
            </div>
            <div className="text-left">
                <div className="font-bold text-[#1E0E62] text-sm group-hover:text-[#F72585] transition-colors">{title}</div>
                <div className="text-xs text-[#8F8FA3] font-medium">{subtext}</div>
            </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-[#1E0E62] group-hover:bg-[#1E0E62] group-hover:text-white transition-all">
            <ArrowRight className="w-4 h-4" />
        </div>
    </button>
);

// Active Missions Section
const ActiveMissionsSection: React.FC<{ user: User, onNavigate: (path: string) => void, refreshTrigger?: number }> = ({ user, onNavigate, refreshTrigger }) => {
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentMaxParticipants, setCurrentMaxParticipants] = useState(10);
    
    useEffect(() => {
        // Get current subscription's max participants
        const loadMaxParticipants = async () => {
            const { getMaxParticipantsBySubscription } = await import('./services/missionService');
            const currentUser = store.getUser(user.id);
            if (currentUser?.subscriptionLevel) {
                setCurrentMaxParticipants(getMaxParticipantsBySubscription(currentUser.subscriptionLevel));
            }
        };
        loadMaxParticipants();
    }, [user.id]);

    useEffect(() => {
        const loadMissions = async () => {
            setLoading(true);
            try {
                const { getMissionsByBusiness } = await import('./services/missionService');
                const activeMissions = await getMissionsByBusiness(user.id, 'ACTIVE');
                setMissions(activeMissions.slice(0, 3)); // Show top 3
            } catch (error) {
                console.error('Error loading missions:', error);
                // Fallback to mock data
                setMissions(store.getMissionsByBusiness(user.id).slice(0, 3));
            } finally {
                setLoading(false);
            }
        };
        loadMissions();
    }, [user.id, refreshTrigger]);

    if (loading) {
        return (
            <div className="space-y-4">
                <h3 className="font-clash font-bold text-[#1E0E62] text-lg px-1">Active Missions</h3>
                <div className="bg-white/90 rounded-[24px] p-6 border border-white shadow-sm">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F72585]"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (missions.length === 0) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="font-clash font-bold text-[#1E0E62] text-lg">Active Missions</h3>
                </div>
                <div className="bg-white/90 rounded-[24px] p-6 border border-white shadow-sm text-center">
                    <div className="text-gray-400 mb-2">🎯</div>
                    <p className="text-sm text-[#8F8FA3] font-medium">No active missions yet.</p>
                    <p className="text-xs text-[#8F8FA3] mt-1">Create your first mission to engage creators!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h3 className="font-clash font-bold text-[#1E0E62] text-lg">Active Missions</h3>
                <button 
                    onClick={() => onNavigate('/missions')}
                    className="text-xs font-bold text-[#F72585] hover:text-[#D91D6A] flex items-center gap-1"
                >
                    View All <ChevronRight className="w-4 h-4" />
                </button>
            </div>
            
            <div className="space-y-3">
                {missions.map((mission) => (
                    <div 
                        key={mission.id}
                        className="bg-white/90 rounded-[24px] p-4 border border-white shadow-sm hover:shadow-md transition-all cursor-pointer"
                        onClick={() => onNavigate(`/missions/${mission.id}`)}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <h4 className="font-bold text-[#1E0E62] text-sm mb-1">{mission.title}</h4>
                                <p className="text-xs text-[#8F8FA3] line-clamp-2">{mission.description}</p>
                            </div>
                            {mission.image && (
                                <img 
                                    src={mission.image} 
                                    alt={mission.title}
                                    className="w-16 h-16 rounded-xl object-cover ml-3"
                                />
                            )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1 text-xs text-[#8F8FA3]">
                                    <Users className="w-3 h-3" />
                                    <span>{mission.currentParticipants}/{currentMaxParticipants}</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs font-bold text-[#F72585]">
                                    <Gift className="w-3 h-3" />
                                    <span>{mission.reward.points} pts</span>
                                </div>
                            </div>
                            
                            <div className="text-xs text-[#8F8FA3]">
                                {mission.validUntil && new Date(mission.validUntil) > new Date() 
                                    ? `Ends ${formatDistanceToNow(new Date(mission.validUntil), { addSuffix: true })}`
                                    : 'Expired'
                                }
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Creators & Regulars Section
const CreatorsAndRegularsSection: React.FC<{ user: User }> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<'creators' | 'regulars'>('creators');
    const [topCreators, setTopCreators] = useState<CreatorInsight[]>([]);
    const [topRegulars, setTopRegulars] = useState<RegularInsight[]>([]);
    const [loading, setLoading] = useState(true);
    const businessMode = user.businessMode || 'PHYSICAL'; // Default to PHYSICAL
    
    // Load real data from Firestore
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Import the tracking service dynamically
                const { getTopCreators, getTopRegulars } = await import('./services/trackingService');
                
                // Load creators and regulars
                const [creatorsResult, regularsResult] = await Promise.all([
                    getTopCreators(user.id, 10),
                    getTopRegulars(user.id, 10)
                ]);

                if (creatorsResult.success && creatorsResult.creators) {
                    setTopCreators(creatorsResult.creators);
                }

                if (regularsResult.success && regularsResult.regulars) {
                    setTopRegulars(regularsResult.regulars);
                }

                // If no real data, show mock data for demo
                if ((!creatorsResult.creators || creatorsResult.creators.length === 0) &&
                    (!regularsResult.regulars || regularsResult.regulars.length === 0)) {
                    setTopCreators(getMockCreators(businessMode));
                    setTopRegulars(getMockRegulars(businessMode));
                }
            } catch (error) {
                console.error('[CreatorsAndRegularsSection] Error loading data:', error);
                // Fallback to mock data
                setTopCreators(getMockCreators(businessMode));
                setTopRegulars(getMockRegulars(businessMode));
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user.id, businessMode]);

    const getMockCreators = (mode: string): CreatorInsight[] => [
        {
            userId: '1',
            name: 'Sarah Weber',
            handle: '@sarahstyle',
            avatarUrl: 'https://i.pravatar.cc/150?img=1',
            visitsCount: 12,
            missionsCompleted: 8,
            checkInsCount: 12,
            lastActivityAt: '2024-01-15T10:30:00Z',
            referralsCount: 3,
            totalReach: 15400,
            avgEngagement: 4.2,
            postsCreated: 8,
            conversionsGenerated: mode === 'ONLINE' ? 24 : undefined,
        },
        {
            userId: '2',
            name: 'Max Fischer',
            handle: '@maxflow',
            avatarUrl: 'https://i.pravatar.cc/150?img=12',
            visitsCount: 8,
            missionsCompleted: 6,
            checkInsCount: 8,
            lastActivityAt: '2024-01-14T15:20:00Z',
            referralsCount: 2,
            totalReach: 8200,
            avgEngagement: 5.1,
            postsCreated: 6,
            conversionsGenerated: mode === 'ONLINE' ? 15 : undefined,
        },
        {
            userId: '3',
            name: 'Lisa Chen',
            handle: '@lisastyles',
            avatarUrl: 'https://i.pravatar.cc/150?img=5',
            visitsCount: 15,
            missionsCompleted: 10,
            checkInsCount: 15,
            lastActivityAt: '2024-01-16T09:15:00Z',
            referralsCount: 5,
            totalReach: 22100,
            avgEngagement: 3.8,
            postsCreated: 10,
            conversionsGenerated: mode === 'ONLINE' ? 31 : undefined,
        }
    ];

    const getMockRegulars = (mode: string): RegularInsight[] => [
        {
            userId: '4',
            name: 'Anna Schmidt',
            handle: '@annaschmidt',
            avatarUrl: 'https://i.pravatar.cc/150?img=9',
            visitsCount: 28,
            missionsCompleted: 3,
            checkInsCount: 28,
            lastVisitAt: '2024-01-17T14:00:00Z',
            lastActivityAt: '2024-01-17T14:00:00Z',
            referralsCount: 1,
            customerNotes: 'Loves the cappuccino',
            preferredProducts: ['Cappuccino', 'Croissant'],
            ordersInfluenced: mode === 'ONLINE' ? 8 : undefined,
        },
        {
            userId: '5',
            name: 'Tom Mueller',
            avatarUrl: 'https://i.pravatar.cc/150?img=13',
            visitsCount: 22,
            missionsCompleted: 2,
            checkInsCount: 22,
            lastVisitAt: '2024-01-16T18:30:00Z',
            lastActivityAt: '2024-01-16T18:30:00Z',
            referralsCount: 0,
            customerNotes: 'Always comes on Fridays',
            preferredProducts: ['Latte Macchiato'],
            ordersInfluenced: mode === 'ONLINE' ? 5 : undefined,
        },
        {
            userId: '6',
            name: 'Julia Braun',
            avatarUrl: 'https://i.pravatar.cc/150?img=20',
            visitsCount: 19,
            missionsCompleted: 4,
            checkInsCount: 19,
            lastVisitAt: '2024-01-15T11:45:00Z',
            lastActivityAt: '2024-01-15T11:45:00Z',
            referralsCount: 2,
            customerNotes: 'Brings friends often',
            preferredProducts: ['Espresso', 'Tiramisu'],
            ordersInfluenced: mode === 'ONLINE' ? 12 : undefined,
        }
    ];

    const formatDate = (isoDate?: string) => {
        if (!isoDate) return 'N/A';
        const date = new Date(isoDate);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div>
            <div className="flex items-center gap-2 mb-4 px-1">
                <h3 className="font-clash font-bold text-[#1E0E62] text-lg">Creators & Regulars</h3>
                <span className="text-[#F72585]">👥</span>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-2xl">
                <button
                    onClick={() => setActiveTab('creators')}
                    className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all ${
                        activeTab === 'creators'
                            ? 'bg-white text-[#1E0E62] shadow-sm'
                            : 'text-[#8F8FA3] hover:text-[#1E0E62]'
                    }`}
                >
                    Top Creators
                </button>
                <button
                    onClick={() => setActiveTab('regulars')}
                    className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all ${
                        activeTab === 'regulars'
                            ? 'bg-white text-[#1E0E62] shadow-sm'
                            : 'text-[#8F8FA3] hover:text-[#1E0E62]'
                    }`}
                >
                    Your Regulars
                </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-[24px] border border-white/60 shadow-[0_10px_30px_rgba(247,37,133,0.08)] overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                        <p className="text-sm text-[#8F8FA3]">Loading insights...</p>
                    </div>
                ) : activeTab === 'creators' ? (
                    <div className="p-5 space-y-3">
                        {topCreators.map((creator, index) => (
                            <div 
                                key={creator.userId}
                                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="relative">
                                        <img 
                                            src={creator.avatarUrl} 
                                            alt={creator.name}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-[#F72585] to-[#7209B7] rounded-full flex items-center justify-center text-white text-xs font-bold">
                                            {index + 1}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-[#1E0E62] text-sm truncate">{creator.name}</div>
                                        <div className="text-xs text-[#8F8FA3] truncate">{creator.handle}</div>
                                    </div>
                                </div>
                                
                                {businessMode === 'PHYSICAL' || businessMode === 'HYBRID' ? (
                                    <div className="flex items-center gap-4 text-xs">
                                        <div className="text-center">
                                            <div className="font-bold text-[#1E0E62]">{creator.missionsCompleted}</div>
                                            <div className="text-[#8F8FA3]">Missions</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-[#1E0E62]">{creator.postsCreated}</div>
                                            <div className="text-[#8F8FA3]">Posts</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-[#1E0E62]">{(creator.totalReach / 1000).toFixed(1)}k</div>
                                            <div className="text-[#8F8FA3]">Reach</div>
                                        </div>
                                        <div className="text-center min-w-[60px]">
                                            <div className="font-bold text-[#8F8FA3] text-[10px]">{formatDate(creator.lastActivityAt)}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4 text-xs">
                                        <div className="text-center">
                                            <div className="font-bold text-[#1E0E62]">{creator.missionsCompleted}</div>
                                            <div className="text-[#8F8FA3]">Missions</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-[#1E0E62]">{creator.conversionsGenerated || 0}</div>
                                            <div className="text-[#8F8FA3]">Sales</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-[#1E0E62]">{(creator.totalReach / 1000).toFixed(1)}k</div>
                                            <div className="text-[#8F8FA3]">Reach</div>
                                        </div>
                                        <div className="text-center min-w-[60px]">
                                            <div className="font-bold text-[#8F8FA3] text-[10px]">{formatDate(creator.lastActivityAt)}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        {topCreators.length === 0 && (
                            <div className="text-center py-8 text-[#8F8FA3] text-sm">
                                No creators yet. Launch missions to attract content creators!
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-5 space-y-3">
                        {topRegulars.map((regular, index) => (
                            <div 
                                key={regular.userId}
                                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="relative">
                                        <img 
                                            src={regular.avatarUrl} 
                                            alt={regular.name}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                        <div className="absolute -bottom-1 -right-1 text-lg">⭐</div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-[#1E0E62] text-sm truncate">{regular.name}</div>
                                        {regular.customerNotes && (
                                            <div className="text-xs text-[#8F8FA3] truncate italic">{regular.customerNotes}</div>
                                        )}
                                    </div>
                                </div>
                                
                                {businessMode === 'PHYSICAL' || businessMode === 'HYBRID' ? (
                                    <div className="flex items-center gap-4 text-xs">
                                        <div className="text-center">
                                            <div className="font-bold text-[#1E0E62]">{regular.visitsCount}</div>
                                            <div className="text-[#8F8FA3]">Visits</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-[#1E0E62]">{regular.missionsCompleted}</div>
                                            <div className="text-[#8F8FA3]">Missions</div>
                                        </div>
                                        <div className="text-center min-w-[60px]">
                                            <div className="font-bold text-[#8F8FA3] text-[10px]">{formatDate(regular.lastVisitAt)}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4 text-xs">
                                        <div className="text-center">
                                            <div className="font-bold text-[#1E0E62]">{regular.missionsCompleted}</div>
                                            <div className="text-[#8F8FA3]">Missions</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-[#1E0E62]">{regular.ordersInfluenced || 0}</div>
                                            <div className="text-[#8F8FA3]">Orders</div>
                                        </div>
                                        <div className="text-center min-w-[60px]">
                                            <div className="font-bold text-[#8F8FA3] text-[10px]">{formatDate(regular.lastActivityAt)}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        {topRegulars.length === 0 && (
                            <div className="text-center py-8 text-[#8F8FA3] text-sm">
                                No regulars yet. Keep engaging with your community!
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const DashboardView: React.FC<{ user: User, onNavigate: (path: string) => void }> = ({ user, onNavigate }) => {
    const { t } = useTranslation();
    const { userProfile } = useAuth();
    const [showQRCode, setShowQRCode] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showCreateMission, setShowCreateMission] = useState(false);
    const [refreshMissions, setRefreshMissions] = useState(0);
    const [stats, setStats] = useState({
        activeMissions: 0,
        totalApplications: 0,
        completedMissions: 0,
        pendingReviews: 0,
        storeCheckIns: 0,
        socialReach: 12500,
        activeAmbassadors: 0,
        followerGrowth: 0,
        localRank: 10,
        districtName: userProfile?.address?.city || user.address?.city || 'Your City'
    });
    
    // Get current subscription from store (includes localStorage override)
    const currentUser = store.getUser(user.id);
    const currentSubscription = currentUser?.subscriptionLevel || user.subscriptionLevel;
    
    // Load real stats from Firestore
    useEffect(() => {
        const loadStats = async () => {
            try {
                const { getMissionsByBusiness } = await import('./services/missionService');
                const { getParticipationsForBusiness } = await import('./src/services/participationService');
                
                const missions = await getMissionsByBusiness(userProfile?.uid || user.id);
                const participations = await getParticipationsForBusiness(userProfile?.uid || user.id);
                
                const activeMissions = missions.filter(m => m.lifecycleStatus === 'ACTIVE' && m.isActive).length;
                const completedMissions = missions.filter(m => m.lifecycleStatus === 'COMPLETED' || !m.isActive).length;
                const pendingReviews = participations.filter(p => p.status === 'PENDING').length;
                const totalApplications = participations.length;
                
                setStats({
                    activeMissions,
                    totalApplications,
                    completedMissions,
                    pendingReviews,
                    storeCheckIns: 0, // TODO: Implement check-ins
                    socialReach: 12500, // TODO: Calculate from creator followers
                    activeAmbassadors: new Set(participations.map(p => p.userId)).size,
                    followerGrowth: 0, // TODO: Calculate growth
                    localRank: 10,
                    districtName: userProfile?.address?.city || user.address?.city || 'Your City'
                });
            } catch (error) {
                console.error('[DashboardView] Error loading stats:', error);
            }
        };
        
        if (userProfile || user) {
            loadStats();
        }
    }, [userProfile, user, refreshMissions]);
    
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Update */}
            <div className="flex justify-between items-center pt-2">
                 <div>
                    <h1 className="text-2xl font-clash font-bold text-[#1E0E62]">Hi, {user.name} 👋</h1>
                    <p className="text-[#8F8FA3] font-medium text-sm mt-0.5">Let's grow your community.</p>
                 </div>
                 <div className="flex items-center gap-2">
                    {(user.businessMode === 'PHYSICAL' || user.businessMode === 'HYBRID') && (
                        <button
                            onClick={() => setShowQRCode(true)}
                            className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-[#1E0E62] text-xs font-bold hover:border-[#F72585] hover:text-[#F72585] transition-all flex items-center gap-1.5 shadow-sm"
                        >
                            <QrCode className="w-4 h-4" />
                            Check-In QR
                        </button>
                    )}
                    <div className="px-3 py-1.5 rounded-full bg-[#FFC300] text-[#1E0E62] text-xs font-bold border border-white shadow-sm flex items-center gap-1">
                        <span>🥈</span> {user.subscriptionLevel} Tier
                    </div>
                 </div>
            </div>

            <QRCodeView isOpen={showQRCode} onClose={() => setShowQRCode(false)} user={user} />
            <AnalyticsView isOpen={showAnalytics} onClose={() => setShowAnalytics(false)} user={user} />
            <MissionCreationModal 
                isOpen={showCreateMission} 
                onClose={() => {
                    console.log('[Dashboard] Closing mission modal');
                    setShowCreateMission(false);
                }} 
                businessId={userProfile?.uid || user.id}
                businessName={userProfile?.name || user.name}
                businessLogo={userProfile?.photoUrl || user.avatarUrl}
                businessType={userProfile?.businessType || user.businessType}
                category={(userProfile?.category || user.category) as any}
                website={userProfile?.socialLinks?.website || user.socialLinks?.website}
                subscriptionLevel={currentSubscription}
                onMissionCreated={() => {
                    setShowCreateMission(false);
                    setRefreshMissions(prev => prev + 1); // Trigger refresh
                }}
            />

            {/* Hero Card: Social Impact */}
            <div className="w-full rounded-[32px] p-6 bg-gradient-to-br from-[#FFC300] via-[#F72585] to-[#7209B7] shadow-xl shadow-[#F72585]/20 text-white relative overflow-hidden group">
                 <div className="absolute -top-6 -right-6 p-8 opacity-10 group-hover:opacity-20 transition-opacity rotate-12">
                    <TrendingUp className="w-40 h-40" />
                 </div>
                 
                 <div className="relative z-10 flex flex-col h-full justify-between min-h-[140px]">
                     <div className="flex items-center gap-2 opacity-90">
                        <div className="p-1.5 bg-white/20 rounded-full backdrop-blur-sm">
                            <Smartphone className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider">Local Influence</span>
                     </div>
                     
                     <div>
                         <div className="text-5xl font-clash font-bold mb-2 tracking-tight">{(stats.socialReach / 1000).toFixed(1)}k</div>
                         <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold border border-white/10">
                            <span>🔥</span> Top {stats.localRank || 10}% in {stats.districtName || user.address?.city || 'Munich'}
                         </div>
                     </div>
                 </div>
            </div>

            {/* Metric Cards Row */}
            <div className="grid grid-cols-2 gap-4">
                {/* Check-ins */}
                <div className="bg-white p-5 rounded-[24px] border border-white/60 shadow-[0_10px_30px_rgba(247,37,133,0.08)] flex flex-col justify-between aspect-[1/1]">
                     <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-500 flex items-center justify-center">
                        <MapPin className="w-5 h-5" />
                     </div>
                     <div>
                        <div className="text-3xl font-clash font-bold text-[#1E0E62] mb-1">{stats.storeCheckIns}</div>
                        <div className="text-xs font-bold text-[#8F8FA3] uppercase tracking-wide">Store Visits</div>
                     </div>
                </div>

                {/* Tribe */}
                <div className="bg-white p-5 rounded-[24px] border border-white/60 shadow-[0_10px_30px_rgba(247,37,133,0.08)] flex flex-col justify-between aspect-[1/1]">
                     <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center">
                        <Users className="w-5 h-5" />
                     </div>
                     <div>
                        <div className="text-3xl font-clash font-bold text-[#1E0E62] mb-1">{stats.activeAmbassadors}</div>
                        <div className="text-xs font-bold text-[#8F8FA3] uppercase tracking-wide">Active Tribe</div>
                     </div>
                </div>
            </div>

            {/* AI Focus Section */}
            <div>
                 <div className="flex items-center gap-2 mb-4 px-1">
                    <h3 className="font-clash font-bold text-[#1E0E62] text-lg">{t('business.actionRequired')}</h3>
                    <span className="text-amber-500 animate-pulse">⚡</span>
                 </div>
                 
                 <div className="space-y-3">
                    <TaskRow 
                        icon={PlusCircle} 
                        color="text-green-600"
                        bgColor="bg-green-50"
                        title={t('missions.createMission')}
                        subtext={t('business.launchCampaign')}
                        onClick={() => {
                            console.log('[Dashboard] Create Mission clicked');
                            setShowCreateMission(true);
                        }}
                    />
                    <TaskRow 
                        icon={BarChart3} 
                        color="text-blue-600"
                        bgColor="bg-blue-50"
                        title={t('business.viewAnalytics')}
                        subtext={t('business.trackPerformance')}
                        onClick={() => setShowAnalytics(true)}
                    />
                    <TaskRow 
                        icon={Camera} 
                        color="text-[#F72585]"
                        bgColor="bg-[#F72585]/10"
                        title={t('business.verifyMissions', { count: stats.pendingReviews || 3 })}
                        subtext={t('business.creatorsWaiting')}
                        onClick={() => onNavigate('/missions/verify')}
                    />
                    <TaskRow 
                        icon={Handshake} 
                        color="text-[#7209B7]"
                        bgColor="bg-[#7209B7]/10"
                        title={t('business.reviewMatch')}
                        subtext={t('business.matchPercentage', { business: 'Urban Outfitters', percentage: 95 })}
                        onClick={() => onNavigate('/b2b/match')}
                    />
                 </div>
            </div>

            {/* Active Missions Section */}
            <ActiveMissionsSection user={user} onNavigate={onNavigate} refreshTrigger={refreshMissions} />

            {/* Creators & Regulars Section */}
            <CreatorsAndRegularsSection user={user} />
        </div>
    );
};

const MissionsView: React.FC<{ user: User, onNavigate: (path: string) => void }> = ({ user, onNavigate }) => {
    const { t } = useTranslation();
    const { userProfile } = useAuth();
    const [subTab, setSubTab] = useState(t('missions.active'));
    const [showHelp, setShowHelp] = useState(false);
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(true);
    const [togglingMission, setTogglingMission] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [missionStats, setMissionStats] = useState<Map<string, { applicants: number; completed: number }>>(new Map());
    
    // Use consistent businessId - same logic as CreateMissionContent
    const businessId = userProfile?.uid || user.id;
    
    // Enforce these exact tabs as per requirement
    const tabs = [t('missions.active'), t('missions.createMission'), t('missions.verify')];

    // Load missions when Active tab is selected
    useEffect(() => {
        if (subTab === t('missions.active')) {
            loadMissions();
        }
    }, [subTab, user.id, refreshTrigger]);

    const loadMissions = async () => {
        setLoading(true);
        try {
            const { getMissionsByBusiness } = await import('./services/missionService');
            const { getParticipationsForBusiness } = await import('./src/services/participationService');
            
            console.log('[MissionsView] ===== BUSINESS LOADING MISSIONS =====');
            console.log('[MissionsView] user.id:', user.id);
            console.log('[MissionsView] userProfile?.uid:', userProfile?.uid);
            console.log('[MissionsView] Using businessId:', businessId);
            console.log('[MissionsView] ========================================');
            const allMissions = await getMissionsByBusiness(businessId);
            
            // Filter to show only unique mission titles (prevent duplicate standard missions)
            const uniqueMissions = allMissions.reduce((acc: Mission[], current) => {
                const exists = acc.find(m => m.title === current.title);
                if (!exists) {
                    acc.push(current);
                }
                return acc;
            }, []);
            
            // Load participation stats for each mission
            console.log('[MissionsView] ===== QUERYING PARTICIPATIONS =====');
            console.log('[MissionsView] Query businessId:', businessId);
            const participations = await getParticipationsForBusiness(businessId);
            console.log('[MissionsView] Found', participations.length, 'participations');
            participations.forEach(p => {
                console.log('[MissionsView]   - Participation:', {
                    id: p.id,
                    missionId: p.missionId,
                    userId: p.userId,
                    businessId: p.businessId,
                    status: p.status
                });
            });
            console.log('[MissionsView] =====================================');
            
            const statsMap = new Map<string, { applicants: number; completed: number }>();
            uniqueMissions.forEach(mission => {
                const missionParticipations = participations.filter(p => p.missionId === mission.id);
                const applicants = missionParticipations.length;
                const completed = missionParticipations.filter(p => p.status === 'APPROVED').length;
                statsMap.set(mission.id, { applicants, completed });
                console.log(`[MissionsView] Mission "${mission.title}": ${applicants} applicants, ${completed} completed`);
            });
            
            setMissionStats(statsMap);
            setMissions(uniqueMissions);
        } catch (error) {
            console.error('Error loading missions:', error);
            setMissions(store.getMissionsByBusiness(user.id));
        } finally {
            setLoading(false);
        }
    };
    
    const handleToggleMission = async (missionId: string, currentStatus: boolean) => {
        setTogglingMission(missionId);
        try {
            const { toggleMissionStatus } = await import('./services/missionService');
            const result = await toggleMissionStatus(missionId, currentStatus); // Pass true to pause, false to activate
            
            if (result.success) {
                // Update local state
                setMissions(prev => prev.map(m => 
                    m.id === missionId 
                        ? { ...m, isActive: !currentStatus, lifecycleStatus: currentStatus ? 'PAUSED' : 'ACTIVE' }
                        : m
                ));
                
                // Trigger refresh for other tabs (especially Create tab)
                setRefreshTrigger(prev => prev + 1);
            } else {
                console.error('Failed to toggle mission:', result.error);
            }
        } catch (error) {
            console.error('Error toggling mission:', error);
        } finally {
            setTogglingMission(null);
        }
    };

    return (
        <div className="animate-in slide-in-from-bottom-4 duration-500 relative">
            {/* Header with Help */}
            <div className="flex justify-between items-center mb-2 px-1">
                <h2 className="font-clash font-bold text-xl text-[#1E0E62]">{t('missions.title')}</h2>
                <button onClick={() => setShowHelp(true)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                    <Info className="w-5 h-5" />
                </button>
            </div>

            <SubTabs tabs={tabs} active={subTab} onChange={setSubTab} />
            <div className="space-y-6">
                {subTab === t('missions.active') && (
                    <div className="space-y-4">
                         {loading ? (
                            <div className="flex items-center justify-center py-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F72585]"></div>
                            </div>
                         ) : missions.length > 0 ? (
                            missions.map(m => (
                                <MissionCard 
                                    key={m.id} 
                                    mission={m} 
                                    isOwner 
                                    stats={missionStats.get(m.id) || {applicants: 0, completed: 0}} 
                                    onToggleActive={handleToggleMission}
                                    isToggling={togglingMission === m.id}
                                    businessId={user.id}
                                />
                            ))
                         ) : (
                            <div className="text-center py-10">
                                <div className="text-4xl mb-3">🎯</div>
                                <p className="text-[#8F8FA3] font-medium mb-2">{t('business.noMissionsYet')}</p>
                                <p className="text-sm text-[#8F8FA3] mb-4">{t('business.createFirstMission')}</p>
                                <button
                                    onClick={() => setSubTab(t('missions.createMission'))}
                                    className="px-6 py-2 bg-[#F72585] text-white rounded-lg font-bold hover:bg-[#D91D6A] transition-colors"
                                >
                                    {t('missions.createMission')}
                                </button>
                            </div>
                         )}
                    </div>
                )}
                {subTab === t('missions.createMission') && (
                    <CreateMissionContent 
                        user={user} 
                        onCreated={() => { 
                            setSubTab(t('missions.active')); 
                            loadMissions(); 
                        }} 
                        refreshTrigger={refreshTrigger}
                        onMissionToggled={() => setRefreshTrigger(prev => prev + 1)}
                    />
                )}
                {subTab === t('missions.verify') && (
                     <ParticipantsContent user={user} onOpenVerify={() => onNavigate('/missions/verify')} />
                )}
            </div>

            <HelpSheet
                isOpen={showHelp}
                onClose={() => setShowHelp(false)}
                title="Missions Explained"
                heroIcon={Store}
                steps={[
                    { title: "Create a Mission", text: "Choose a task (e.g., 'Post a Story') and set a reward." },
                    { title: "Locals Visit", text: "Creators see your mission on their map and visit your store." },
                    { title: "Verify & Grow", text: "Review their content proofs and watch your reach grow." }
                ]}
                proTip="Standard missions like 'Google Review' are the easiest way to start."
            />
        </div>
    );
};

// Helper to render Icons dynamically
const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
    const icons: any = {
        Camera, Star, Heart, Clapperboard, Martini, Users, Package, ShoppingBag, 
        Play, Smartphone, Video, Search, Dumbbell, TrendingUp, Sun, MapPin, 
        UserPlus, ThumbsUp, MessageCircle
    };
    const Icon = icons[name] || Star;
    return <Icon className={className} />;
};

const CreateMissionContent: React.FC<{ 
    user: User; 
    onCreated: () => void;
    refreshTrigger?: number;
    onMissionToggled?: () => void;
}> = ({ user, onCreated, refreshTrigger, onMissionToggled }) => {
    const { userProfile } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [standardMissions, setStandardMissions] = useState<Mission[]>([]);
    const [activeMissions, setActiveMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(true);
    const [togglingMission, setTogglingMission] = useState<string | null>(null);
    
    // Get current subscription from store (includes localStorage override)
    const currentUser = store.getUser(user.id);
    const currentSubscription = currentUser?.subscriptionLevel || user.subscriptionLevel;

    // Load Standard Missions and Active Firestore missions
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Load standard missions using the generator function
                const { generateStandardMissionTemplates } = await import('./services/mockStore');
                const standards = generateStandardMissionTemplates(
                    userProfile?.uid || user.id,
                    userProfile?.name || user.name,
                    userProfile?.photoUrl || user.avatarUrl || '',
                    (userProfile?.category || user.category) as any,
                    user.geo
                );
                console.log('[CreateMissionContent] Loaded standard missions from store:', standards.length, standards);
                
                // Load active missions from Firestore
                const { getMissionsByBusiness } = await import('./services/missionService');
                const firestoreMissions = await getMissionsByBusiness(userProfile?.uid || user.id);
                
                console.log('[CreateMissionContent] Initial load - Firestore missions:', firestoreMissions.map(m => ({ title: m.title, status: m.lifecycleStatus, isActive: m.isActive })));
                console.log('[CreateMissionContent] Initial load - Standard missions:', standards.map(s => ({ title: s.title, isActive: s.isActive })));
                
                // Update standard missions with active status from Firestore
                // Only mark as active if the Firestore mission is actually ACTIVE
                const updatedStandards = standards.map(sm => {
                    const activeFirestoreMission = firestoreMissions.find(fm => 
                        fm.title === sm.title && 
                        (fm.lifecycleStatus === 'ACTIVE' || fm.isActive)
                    );
                    if (activeFirestoreMission) {
                        console.log('[CreateMissionContent] Initial load - Matched active:', sm.title);
                        return {
                            ...sm,
                            isActive: true,
                            firestoreId: activeFirestoreMission.id
                        };
                    }
                    // No active match found - mark as inactive
                    console.log('[CreateMissionContent] Initial load - Marking inactive:', sm.title);
                    return { ...sm, isActive: false };
                });
                
                setStandardMissions(updatedStandards);
                setActiveMissions(firestoreMissions);
                console.log('[CreateMissionContent] State updated - standardMissions count:', updatedStandards.length);
            } catch (error) {
                console.error('Error loading missions:', error);
                // Fallback: generate standard missions directly
                const { generateStandardMissionTemplates } = await import('./services/mockStore');
                const fallbackStandards = generateStandardMissionTemplates(
                    userProfile?.uid || user.id,
                    userProfile?.name || user.name,
                    userProfile?.photoUrl || user.avatarUrl || '',
                    (userProfile?.category || user.category) as any,
                    user.geo
                );
                setStandardMissions(fallbackStandards);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [user.id, refreshTrigger]);

    const handleStandardToggle = async (id: string, mission: Mission) => {
        setTogglingMission(id);
        try {
            if (!mission.isActive) {
                // Activating - toggle in mock store first
                store.toggleMissionStatus(id);
                // StandardMissionsList will handle Firestore creation
            } else {
                // Deactivating - pause in Firestore if we have the ID
                if (mission.firestoreId) {
                    const { toggleMissionStatus } = await import('./services/missionService');
                    await toggleMissionStatus(mission.firestoreId, true); // true = pause
                }
                // Toggle in mock store
                store.toggleMissionStatus(id);
            }
            
            // Small delay to ensure Firestore operations complete
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Reload data from Firestore to get fresh status
            const standards = store.getStandardMissions(user.id);
            const { getMissionsByBusiness } = await import('./services/missionService');
            const firestoreMissions = await getMissionsByBusiness(user.id);
            
            console.log('[CreateMissionContent] Firestore missions:', firestoreMissions.map(m => ({ title: m.title, status: m.lifecycleStatus, isActive: m.isActive })));
            
            // Update standard missions: only mark as active if found in ACTIVE Firestore missions
            const updatedStandards = standards.map(sm => {
                const activeFirestoreMission = firestoreMissions.find(fm => 
                    fm.title === sm.title && 
                    (fm.lifecycleStatus === 'ACTIVE' || fm.isActive)
                );
                if (activeFirestoreMission) {
                    console.log('[CreateMissionContent] Matched active mission:', sm.title);
                    return { ...sm, isActive: true, firestoreId: activeFirestoreMission.id };
                }
                // Not found or not active = mark as inactive
                console.log('[CreateMissionContent] Marking inactive:', sm.title);
                return { ...sm, isActive: false, firestoreId: undefined };
            });
            
            setStandardMissions(updatedStandards);
            setActiveMissions(firestoreMissions);
            
            // Notify parent when toggling is complete
            if (onMissionToggled) {
                onMissionToggled();
            }
        } catch (error) {
            console.error('Error toggling mission:', error);
        } finally {
            setTogglingMission(null);
        }
    };

    return (
        <div className="space-y-8">
            
            {/* Quick Activate Section */}
            <section>
                <div className="flex items-center justify-between mb-4 px-1">
                    <div>
                        <h3 className="font-clash font-bold text-[#1E0E62] text-lg">Quick Activate</h3>
                        <p className="text-xs text-[#8F8FA3] font-medium">Standard missions loved by the community. Toggle on to activate.</p>
                    </div>
                </div>
                {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F72585]"></div>
                    </div>
                ) : (
                    <StandardMissionsList 
                        missions={standardMissions} 
                        user={user} 
                        onToggle={handleStandardToggle}
                        onMissionActivated={() => {}}
                        togglingMissionId={togglingMission}
                    />
                )}
            </section>

            <div className="flex items-center justify-center py-2">
                <div className="h-px bg-gray-200 w-full"></div>
                <span className="px-4 text-xs font-bold text-gray-400 uppercase">Or</span>
                <div className="h-px bg-gray-200 w-full"></div>
            </div>

            {/* Create Custom Mission Button */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4 px-1">
                    <div className="p-1.5 bg-purple-100 rounded-lg text-purple-600">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="font-clash font-bold text-[#1E0E62] text-lg">Create Custom Mission</h3>
                        <p className="text-xs text-[#8F8FA3] font-medium">Get AI-powered suggestions or build from scratch</p>
                    </div>
                </div>
                <Button 
                    variant="primary" 
                    className="w-full py-6 text-base bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700" 
                    onClick={() => {
                        console.log('[CreateMissionContent] Create New Mission clicked');
                        setShowModal(true);
                    }}
                >
                    <PlusCircle className="w-5 h-5 mr-2" />
                    Create New Mission
                </Button>
            </div>

            {/* Mission Creation Modal */}
            <MissionCreationModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                businessId={userProfile?.uid || user.id}
                businessName={userProfile?.name || user.name}
                businessLogo={userProfile?.photoUrl || user.avatarUrl}
                businessType={userProfile?.businessType || user.businessType}
                category={(userProfile?.category || user.category) as any}
                website={userProfile?.socialLinks?.website || user.socialLinks?.website}
                subscriptionLevel={currentSubscription}
                onMissionCreated={() => {
                    setShowModal(false);
                    onCreated();
                }}
            />
        </div>
    );
};

const ParticipantsContent: React.FC<{ user: User, onOpenVerify: () => void }> = ({ user, onOpenVerify }) => {
    const { userProfile } = useAuth();
    const [participations, setParticipations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userCache, setUserCache] = useState<Map<string, any>>(new Map());
    
    // Use consistent businessId - same logic as MissionsView and CreateMissionContent
    const businessId = userProfile?.uid || user.id;

    useEffect(() => {
        const loadParticipations = async () => {
            setLoading(true);
            try {
                console.log('[ParticipantsContent] Loading participations for businessId:', businessId);
                const data = await getParticipationsForBusiness(businessId);
                console.log('[ParticipantsContent] Loaded participations:', data.length, data);
                setParticipations(data);
                
                // Fetch user data for each participation
                const users = new Map<string, any>();
                for (const p of data) {
                    if (!users.has(p.userId)) {
                        try {
                            const { api } = await import('./services/apiService');
                            const result = await api.getUser(p.userId);
                            console.log('[ParticipantsContent] API result for user', p.userId, ':', result);
                            if (result.success && result.user) {
                                users.set(p.userId, result.user);
                                console.log('[ParticipantsContent] ✅ Cached user:', result.user.name);
                            } else {
                                console.error('[ParticipantsContent] ❌ Failed to get user:', result.error);
                            }
                        } catch (error) {
                            console.error('[ParticipantsContent] Error fetching user:', p.userId, error);
                        }
                    }
                }
                setUserCache(users);
            } catch (error) {
                console.error('Error loading participations:', error);
            } finally {
                setLoading(false);
            }
        };
        loadParticipations();
    }, [user.id, businessId]);

    const pendingCount = participations.filter(p => p.status === 'PENDING').length;

    const handleApprove = async (participationId: string) => {
        console.log('[ParticipantsContent] Approving participation:', participationId);
        const result = await approveParticipation(participationId);
        if (result.success) {
            console.log('[ParticipantsContent] ✅ Approval successful');
            // Reload participations
            const data = await getParticipationsForBusiness(businessId);
            setParticipations(data);
        } else {
            console.error('[ParticipantsContent] ❌ Approval failed:', result.error);
            alert('Failed to approve: ' + result.error);
        }
    };

    return (
        <div className="space-y-4">
             {loading && (
                <div className="text-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F72585] mx-auto"></div>
                </div>
             )}
             {!loading && pendingCount > 0 && (
                <div className="bg-gradient-to-r from-[#1E0E62] to-[#4a2e8e] p-5 rounded-2xl text-white flex items-center justify-between shadow-lg">
                    <div>
                        <div className="font-bold text-lg">{pendingCount} Pending Proofs</div>
                        <div className="text-xs text-white/70">Review submissions from creators</div>
                    </div>
                    <Button onClick={onOpenVerify} className="bg-white text-[#1E0E62] hover:bg-gray-100 border-none">
                        Start Verification
                    </Button>
                </div>
             )}

             {!loading && participations.map(p => {
                 const participantUser = userCache.get(p.userId);
                 return (
                 <Card key={p.id} className="p-5 flex justify-between items-center">
                     <div className="flex items-center gap-3">
                         {participantUser ? (
                             <>
                                 <img 
                                     src={participantUser.photoUrl || participantUser.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(participantUser.name || 'User')}`} 
                                     className="w-10 h-10 rounded-full object-cover border border-gray-200" 
                                     alt={participantUser.name}
                                 />
                                 <div>
                                     <div className="font-bold text-[#1E0E62]">{participantUser.name || 'Unknown User'}</div>
                                     <div className="text-xs text-[#8F8FA3] font-medium bg-gray-100 px-2 py-1 rounded inline-block mt-1">{p.status}</div>
                                 </div>
                             </>
                         ) : (
                             <>
                                 <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                     <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#F72585]"></div>
                                 </div>
                                 <div>
                                     <div className="font-bold text-[#1E0E62]">Loading...</div>
                                     <div className="text-xs text-[#8F8FA3] font-medium bg-gray-100 px-2 py-1 rounded inline-block mt-1">{p.status}</div>
                                 </div>
                             </>
                         )}
                     </div>
                     {p.status === 'PENDING' && (
                         <Button size="sm" onClick={() => handleApprove(p.id)} className="px-6">Approve</Button>
                     )}
                 </Card>
                 );
             })}
             {participations.length === 0 && <div className="text-center py-10 text-[#8F8FA3] font-medium">No participants to verify.</div>}
        </div>
    );
};

const PeopleView: React.FC<{ user: User }> = ({ user }) => {
    const [subTab, setSubTab] = useState('Ambassadors');
    const tabs = ['Ambassadors', 'My Network', 'Customers'];

    return (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
             <SubTabs tabs={tabs} active={subTab} onChange={setSubTab} />
             <div className="mt-4">
                {subTab === 'Ambassadors' ? (
                    <ZeroState 
                        icon={Share2}
                        title="Build Your Tribe"
                        description="Track which customers bring you the most sales. Turn your regulars into your marketing team."
                        actionLabel="Share Invite Link"
                        onAction={() => alert("Invite Link Copied!")}
                    />
                ) : (
                    <div className="p-4 flex flex-col items-center justify-center text-center min-h-[50vh] bg-white rounded-3xl border border-white">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-[#8F8FA3]">
                            <Users className="w-8 h-8" />
                        </div>
                        <h3 className="font-clash font-bold text-[#1E0E62] text-xl mb-2">{subTab}</h3>
                        <p className="text-[#8F8FA3] max-w-xs font-medium">Manage your {subTab.toLowerCase()} relationships here.</p>
                    </div>
                )}
             </div>
        </div>
    );
};

const B2BView: React.FC<{ 
  user: User, 
  activeSubTab: string, 
  onSubTabChange: (tab: string) => void,
  onOpenChat: (chatId: string) => void,
  currentSquad?: Squad,
  projects: Project[],
  onCreateProject: () => void
}> = ({ user, activeSubTab, onSubTabChange, onOpenChat, currentSquad, projects, onCreateProject }) => {
    const tabs = ['My Squad', 'Match', 'Projects', 'Market', 'Events'];
    const [isLocationModalOpen, setIsLocationModalOpen] = React.useState(false);

    return (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
             <SubTabs tabs={tabs} active={activeSubTab} onChange={onSubTabChange} />
             <div className="space-y-6">
                 {activeSubTab === 'My Squad' && (
                     <SquadView squad={currentSquad} currentUser={user} onOpenChat={onOpenChat} />
                 )}

                 {activeSubTab === 'Match' && (
                     <div className="space-y-6">
                         {/* Location Change Button (Platinum Only) */}
                         {user.subscriptionLevel === SubscriptionLevel.PLATINUM && (
                             <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
                                 <div className="flex items-center justify-between">
                                     <div className="flex items-center gap-3">
                                         <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                                             <MapPin className="w-6 h-6 text-white" />
                                         </div>
                                         <div>
                                             <div className="font-bold text-lg mb-1">
                                                 {user.temporaryLocation?.city 
                                                     ? `🌍 Exploring: ${user.temporaryLocation.city}`
                                                     : `📍 Home: ${user.homeCity || user.city}`
                                                 }
                                             </div>
                                             <div className="text-sm text-white/90">
                                                 {user.temporaryLocation 
                                                     ? `Expires ${new Date(user.temporaryLocation.expiresAt).toLocaleDateString()}`
                                                     : 'Platinum members can explore any city'
                                                 }
                                             </div>
                                         </div>
                                     </div>
                                     <button
                                         onClick={() => setIsLocationModalOpen(true)}
                                         className="bg-white text-purple-600 px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
                                     >
                                         Change Location
                                     </button>
                                 </div>
                             </div>
                         )}

                         {/* AI Collaboration Suggestions */}
                         <AICollaborationSuggestions 
                             user={user}
                             onOpenChat={onOpenChat}
                             onViewProfile={(businessId) => {
                                 console.log('View business profile:', businessId);
                                 // TODO: Implement profile view
                             }}
                         />

                         {/* Location Change Modal */}
                         <LocationChangeModal
                             isOpen={isLocationModalOpen}
                             onClose={() => setIsLocationModalOpen(false)}
                             user={user}
                             onLocationChanged={(newCity) => {
                                 console.log('Location changed to:', newCity);
                                 // Refresh suggestions after location change
                                 window.location.reload();
                             }}
                         />

                         {/* Original Match View - can be kept or removed */}
                         <MatchView user={user} />
                     </div>
                 )}

                 {activeSubTab === 'Projects' && (
                     <ProjectList 
                       projects={projects} 
                       onCreateProject={onCreateProject}
                     />
                 )}

                 {activeSubTab === 'Market' && (
                    <ServiceMarketplace user={user} />
                 )}

                 {activeSubTab === 'Events' && (
                    <PremiumEvents user={user} />
                 )}
             </div>
        </div>
    );
};

// --- Main App ---

const App: React.FC = () => {
  const { userProfile, signOut, signInWithEmail, refreshUserProfile } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [viewState, setViewState] = useState<ViewState>(ViewState.LOGIN);

  // Initialize Sentry on app mount
  useEffect(() => {
    initSentry();
  }, []);

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);  // Business Tab State
  const [activeTab, setActiveTab] = useState<MainTab>(MainTab.DASHBOARD);
  
  // Customer Tab State
  const [activeCustomerTab, setActiveCustomerTab] = useState<CustomerTab>(CustomerTab.HOME);

  // Sub-tab state lifted for external navigation (Wallet -> Market)
  const [b2bSubTab, setB2bSubTab] = useState('My Squad');

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCustomerSettingsOpen, setIsCustomerSettingsOpen] = useState(false);
  const [isCustomerSubscriptionOpen, setIsCustomerSubscriptionOpen] = useState(false);
  const [isLinkedAccountsOpen, setIsLinkedAccountsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [isBusinessProfileOpen, setIsBusinessProfileOpen] = useState(false);
  const [isEditBusinessProfileOpen, setIsEditBusinessProfileOpen] = useState(false);
  const [isCustomerProfileOpen, setIsCustomerProfileOpen] = useState(false);
  const [isInstagramCallbackOpen, setIsInstagramCallbackOpen] = useState(false);
  
  // Creator Mode Screens
  const [isCreatorSkillsOpen, setIsCreatorSkillsOpen] = useState(false);
  const [isCreatorPortfolioOpen, setIsCreatorPortfolioOpen] = useState(false);
  const [isCollaborationRequestsOpen, setIsCollaborationRequestsOpen] = useState(false);
  
  // Creator Mode Toggle State
  const [isTogglingCreatorMode, setIsTogglingCreatorMode] = useState(false);
  
  // Chat Deep Link State
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  
  // Notifications State (real-time from Firestore)
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  
  // Conversations State (real-time from Firestore)
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  
  // Squads State (from Firestore)
  const [currentSquad, setCurrentSquad] = useState<Squad | undefined>(undefined);
  
  // Projects State (from Firestore)
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreateProject, setShowCreateProject] = useState(false);
  
  // Onboarding State
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  // Global Search State
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);

  // Friends Modal State
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);

  // Online Status State
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Accessibility Modal State
  const [isAccessibilityModalOpen, setIsAccessibilityModalOpen] = useState(false);
  const [showNotificationPreferences, setShowNotificationPreferences] = useState(false);
  const [showEnhancedNotifications, setShowEnhancedNotifications] = useState(false);

  // Analytics Dashboard State
  const [showAnalyticsDashboard, setShowAnalyticsDashboard] = useState(false);

  // Admin Dashboard State
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);

  // Check for Instagram OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    // Check if this is an Instagram OAuth callback (code/error present)
    if (code || error) {
      console.log('[App] Instagram OAuth callback detected');
      console.log('[App] URL:', window.location.href);
      console.log('[App] Code:', code);
      console.log('[App] Error:', error);
      setIsInstagramCallbackOpen(true);
    }
  }, []);

  // Global Search Keyboard Shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen(prev => !prev);
      }
      // Secret admin shortcut: Ctrl+Shift+A
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        if (user?.role === UserRole.ADMIN || user?.email === 'admin@fluzio.com') {
          setShowAdminDashboard(prev => !prev);
        } else {
          console.log('🔒 Admin access denied');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user]);

  // Firebase Auth Integration - sync userProfile with mock store
  useEffect(() => {
    if (userProfile) {
      console.log('🔥 [App] Firebase user profile loaded from Firestore:');
      console.log('  UID:', userProfile.uid);
      console.log('  Email:', userProfile.email);
      console.log('  Name:', userProfile.name);
      console.log('  Role:', userProfile.role);
      console.log('  City:', userProfile.city);
      console.log('  Full profile:', userProfile);
      
      // Find or create mock user based on Firebase UID
      let mockUser = store.getUserByFirebaseUid(userProfile.uid);
      
      if (!mockUser) {
        console.log('✨ [App] Creating NEW mock user for Firebase UID:', userProfile.uid);
        // Create a new mock user from the Firebase profile
        mockUser = store.createUserFromFirebase(userProfile);
        console.log('✅ [App] Created mock user:', mockUser.name, 'Role:', mockUser.role, 'creatorMode:', mockUser.creatorMode);
      } else {
        console.log('♻️ [App] Found EXISTING mock user:', mockUser.name, 'Role:', mockUser.role, 'creatorMode:', mockUser.creatorMode);
        
        // Update existing user with latest Firestore data
        const updates: Partial<User> = {};
        
        // Ensure creatorMode is set (default to true for CREATOR role if missing)
        if (mockUser.creatorMode === undefined) {
          const defaultCreatorMode = userProfile.creatorMode !== undefined 
            ? userProfile.creatorMode 
            : userProfile.role === 'CREATOR';
          updates.creatorMode = defaultCreatorMode;
          console.log('[App] 🎨 Setting creatorMode for existing user:', defaultCreatorMode);
        }
        
        // Sync other fields from Firestore
        if (userProfile.name && mockUser.name !== userProfile.name) {
          updates.name = userProfile.name;
        }
        if (userProfile.photoUrl && mockUser.avatarUrl !== userProfile.photoUrl) {
          updates.avatarUrl = userProfile.photoUrl;
        }
        if (userProfile.points !== undefined && mockUser.points !== userProfile.points) {
          updates.points = userProfile.points;
          console.log('[App] 💰 Syncing points from Firestore:', userProfile.points);
        }
        
        // Apply updates if needed
        if (Object.keys(updates).length > 0) {
          mockUser = store.updateUser(mockUser.id, updates);
          console.log('[App] ✏️ Updated existing user with:', updates);
        }
      }
      
      // Set as current user and log in
      store.setCurrentUser(mockUser);
      setUser(mockUser);
      console.log('👤 [App] Logged in as:', mockUser.name, '(', mockUser.email, ')');
      setViewState(ViewState.APP);
      
      // Check if onboarding is needed (for MEMBER role only)
      if (mockUser.role === UserRole.MEMBER && !userProfile.onboardingCompleted) {
        console.log('[App] 🎓 First time user - showing onboarding');
        setShowOnboarding(true);
        setOnboardingComplete(false);
      } else {
        setOnboardingComplete(true);
      }
      
      // Set appropriate tab based on role
      if (mockUser.role === UserRole.BUSINESS) {
        setActiveTab(MainTab.DASHBOARD);
      } else {
        setActiveCustomerTab(CustomerTab.HOME);
      }
    } else if (!user) {
      // No Firebase user and no mock user - show login
      setViewState(ViewState.LOGIN);
    }
  }, [userProfile]);

  // Location tracking - DISABLED continuous watching to save mobile resources
  useEffect(() => {
    if (!user) return;

    console.log('[App] Setting initial location for user:', user.id);
    
    // Get initial location only - no continuous watching
    updateUserLocation(user.id).then((location) => {
      if (location) {
        console.log('[App] Initial location set:', location.city);
        setUser(prev => prev ? {
          ...prev,
          geo: location,
          homeCity: location.city,
          location: location.city
        } : null);
      }
    });

    // Continuous location watching disabled to save resources on mobile
  }, [user?.id]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadNotificationsCount(0);
      return;
    }

    console.log('[App] Subscribing to notifications for user:', user.id);
    
    let unsubscribe: (() => void) | null = null;
    
    // Dynamic import to avoid circular dependencies
    import('./services/notificationService').then(({ subscribeToNotifications }) => {
      // Check if user is still logged in before subscribing
      if (!user?.id) return;
      
      unsubscribe = subscribeToNotifications(
        user.id,
        (newNotifications) => {
          console.log('[App] Received notifications update:', newNotifications.length, 'notifications');
          setNotifications(newNotifications);
          const unreadCount = newNotifications.filter(n => !n.isRead).length;
          setUnreadNotificationsCount(unreadCount);
          console.log('[App] Unread notifications:', unreadCount);
        },
        (error) => {
          console.error('[App] Notification subscription error:', error);
        }
      );
    }).catch(err => {
      console.error('[App] Failed to load notification service:', err);
    });

    return () => {
      console.log('[App] Unsubscribing from notifications');
      if (unsubscribe) unsubscribe();
    };
  }, [user?.id]);

  // Subscribe to real-time conversations
  useEffect(() => {
    if (!user?.id) {
      setConversations([]);
      setUnreadMessagesCount(0);
      return;
    }

    console.log('[App] Subscribing to conversations for user:', user.id);
    
    let unsubscribe: (() => void) | null = null;
    
    import('./services/conversationService').then(({ subscribeToConversations }) => {
      // Check if user is still logged in before subscribing
      if (!user?.id) return;
      
      unsubscribe = subscribeToConversations(
        user.id,
        (newConversations) => {
          console.log('[App] Received conversations update:', newConversations.length, 'conversations');
          // Convert SimpleConversation to match what UI expects
          const conversationsForUI = newConversations.map(c => ({
            ...c,
            unreadCount: c.unreadCounts[user.id] || 0,
            lastMessage: c.lastMessageText,
            otherUserName: c.participantNames[c.participants.find(p => p !== user.id) || ''] || 'Unknown',
            otherUserAvatar: c.participantAvatars?.[c.participants.find(p => p !== user.id) || '']
          }));
          setConversations(conversationsForUI as any);
          const unreadCount = conversationsForUI.reduce((acc, c) => acc + c.unreadCount, 0);
          setUnreadMessagesCount(unreadCount);
          console.log('[App] Unread messages:', unreadCount);
        },
        (error) => {
          console.error('[App] Conversation subscription error:', error);
        }
      );
    }).catch(err => {
      console.error('[App] Failed to load conversation service:', err);
    });

    return () => {
      console.log('[App] Unsubscribing from conversations');
      if (unsubscribe) unsubscribe();
    };
  }, [user?.id]);

  // Load squad and projects
  useEffect(() => {
    if (!user?.id || user.role !== UserRole.BUSINESS) {
      setCurrentSquad(undefined);
      setProjects([]);
      return;
    }

    console.log('[App] Loading squad and projects for user:', user.id);
    
    // Load squad
    import('./services/squadService').then(({ getSquadForUser }) => {
      getSquadForUser(user.id).then(squad => {
        console.log('[App] Loaded squad:', squad?.id || 'none');
        setCurrentSquad(squad);
      });
    });
    
    // Load projects
    import('./services/projectService').then(({ getProjects }) => {
      getProjects().then(projectList => {
        console.log('[App] Loaded projects:', projectList.length);
        setProjects(projectList);
      });
    });
  }, [user?.id, user?.role]);

  // Sync mock user with Firestore profile and localStorage subscription changes
  useEffect(() => {
    if (user) {
      let needsUpdate = false;
      const updates: any = {};

      // Sync with Firestore profile
      if (userProfile) {
        if (userProfile.name && user.name !== userProfile.name) {
          console.log('[App] Syncing user name from Firestore:', userProfile.name);
          updates.name = userProfile.name;
          needsUpdate = true;
        }

        // Skip role sync during creator mode toggle to prevent switching to business profile
        if (!isTogglingCreatorMode && userProfile.role && user.role !== userProfile.role) {
          console.log('[App] Syncing user role from Firestore:', userProfile.role);
          updates.role = userProfile.role;
          needsUpdate = true;
        }

        if (userProfile.photoUrl && user.avatarUrl !== userProfile.photoUrl) {
          console.log('[App] Syncing user avatar from Firestore:', userProfile.photoUrl);
          updates.avatarUrl = userProfile.photoUrl;
          needsUpdate = true;
        }

        if (userProfile.points !== undefined && user.points !== userProfile.points) {
          console.log('[App] 💰 Syncing user points from Firestore:', userProfile.points);
          updates.points = userProfile.points;
          needsUpdate = true;
        }

        if (userProfile.level !== undefined && user.level !== userProfile.level) {
          console.log('[App] 🏆 Syncing user level from Firestore:', userProfile.level);
          updates.level = userProfile.level;
          needsUpdate = true;
        }

        // REMOVED: creatorMode sync - local state is source of truth
        // We save to Firestore but don't sync back to avoid race conditions
      }

      // Check for subscription changes from localStorage
      const currentUser = store.getUser(user.id);
      if (currentUser && currentUser.subscriptionLevel !== user.subscriptionLevel) {
        console.log('[App] Syncing subscription level from localStorage:', currentUser.subscriptionLevel);
        updates.subscriptionLevel = currentUser.subscriptionLevel;
        needsUpdate = true;
      }

      if (needsUpdate) {
        setUser(prev => prev ? { ...prev, ...updates } : null);
      }
    }
  }, [user, userProfile, isTogglingCreatorMode]);

  // Create email verification notification if user is not verified
  useEffect(() => {
    const createEmailVerificationNotification = async () => {
      if (user?.id && userProfile && !userProfile.emailVerified) {
        try {
          const { createNotification } = await import('./services/notificationService');
          
          // Check if notification already exists
          const existingNotifications = notifications.filter(n => 
            n.type === 'SYSTEM' && 
            n.title === 'Verify Your Email' && 
            !n.isRead
          );
          
          // Only create if no existing unread verification notification
          if (existingNotifications.length === 0) {
            await createNotification(user.id, {
              type: 'SYSTEM',
              title: 'Verify Your Email',
              message: 'Please verify your email address to unlock all features. Check your inbox for the verification link.',
              actionLink: '/settings'
            });
          }
        } catch (error) {
          console.error('[App] Error creating email verification notification:', error);
        }
      }
    };

    createEmailVerificationNotification();
  }, [user?.id, userProfile?.emailVerified, notifications]);

  // Listen for notification settings custom event
  useEffect(() => {
    const handleOpenNotificationSettings = () => {
      setShowNotificationPreferences(true);
    };

    window.addEventListener('open-notification-settings', handleOpenNotificationSettings);
    return () => {
      window.removeEventListener('open-notification-settings', handleOpenNotificationSettings);
    };
  }, []);

  // Initialize push notifications when user logs in
  useEffect(() => {
    if (user?.id) {
      initializePushNotifications(user.id);
    }
  }, [user?.id]);

  const initializePushNotifications = async (userId: string) => {
    try {
      const { initializeMessaging, onForegroundMessage, showBrowserNotification } = await import('./services/pushNotificationService');
      
      // Initialize messaging
      await initializeMessaging();
      
      // Listen for foreground messages
      const unsubscribe = onForegroundMessage((payload) => {
        const title = payload.notification?.title || 'Fluzio';
        const body = payload.notification?.body || 'You have a new notification';
        
        // Show browser notification
        showBrowserNotification(title, {
          body,
          icon: '/logo.png',
          data: payload.data
        });
      });

      // Cleanup on unmount
      return () => {
        if (unsubscribe) unsubscribe();
      };
    } catch (error) {
      console.error('[App] Failed to initialize push notifications:', error);
    }
  };

  // Refresh projects from Firestore
  const refreshProjects = async () => {
    if (!user?.id) return;
    try {
      const { getProjects } = await import('./services/projectService');
      const projectList = await getProjects();
      console.log('[App] Refreshed projects:', projectList.length);
      setProjects(projectList);
    } catch (error) {
      console.error('[App] Failed to refresh projects:', error);
    }
  };

  // Handle project creation
  const handleCreateProject = async (projectData: { title: string; slots: any[] }) => {
    if (!user?.id) return;
    try {
      const { createProject } = await import('./services/projectService');
      await createProject(user.id, projectData.title, projectData.slots);
      await refreshProjects();
    } catch (error) {
      console.error('[App] Failed to create project:', error);
      alert('Failed to create project. Please try again.');
    }
  };

  const handleLogin = (role: UserRole) => {
      setUser(store.login(role));
      setViewState(ViewState.APP);
      setActiveTab(MainTab.DASHBOARD);
      setActiveCustomerTab(CustomerTab.HOME);
      // Reset Login Fields
      setLoginEmail('');
      setLoginPassword('');
  };

  const handleEmailLogin = async () => {
    // 1. Normalize input
    const email = loginEmail.toLowerCase().trim();
    const password = loginPassword.trim();
    
    if (!email) {
      console.log('⚠️ [App] No email provided');
      return;
    }

    console.log('📧 [App] Login attempt with email:', email);

    // 2. If password provided, use Firebase Authentication
    if (password) {
      try {
        console.log('🔐 [App] Attempting Firebase authentication...');
        await signInWithEmail(email, password);
        console.log('✅ [App] Firebase authentication successful');
        // onAuthStateChanged will handle the rest (loading profile, creating mock user, etc.)
        setLoginEmail('');
        setLoginPassword('');
        return;
      } catch (error: any) {
        console.error('❌ [App] Firebase authentication failed:', error.message);
        alert(`Login failed: ${error.message}`);
        return;
      }
    }

    // 3. Fallback: Check against Mock Store (for demo/testing without password)
    const users = store.getUsers();
    console.log('👥 [App] Checking mock users:', users.length, 'users');
    users.forEach(u => console.log('  -', u.email, '/', u.name, '(Role:', u.role, ')'));
    
    const userMatch = users.find(u => 
        u.email.toLowerCase() === email || 
        u.name.toLowerCase().replace(/\s+/g, '').includes(email.replace(/\s+/g, ''))
    );

    if (userMatch) {
        console.log('✅ [App] Mock store login FOUND user:', userMatch.name, 'Role:', userMatch.role);
        store.setCurrentUser(userMatch);
        setUser(userMatch);
        setViewState(ViewState.APP);
        setActiveTab(MainTab.DASHBOARD);
        setActiveCustomerTab(CustomerTab.HOME);
        setLoginEmail('');
        setLoginPassword('');
        return;
    }

    // 4. Keyword/Demo Logic (Keep for easy demo access)
    const isBusinessKeyword = 
        email.includes('business') || 
        email.includes('contact') || 
        email === 'b1';
    
    const targetRole = isBusinessKeyword ? UserRole.BUSINESS : UserRole.MEMBER;

    // 5. Log in with role (gets first user of that role)
    handleLogin(targetRole);
  };

  const handleSignUpComplete = (data: OnboardingState) => {
      const newUser = store.signup(data);
      setUser(newUser);
      if (data.role === 'BUSINESS') {
          setViewState(ViewState.PENDING_APPROVAL);
      } else {
          setViewState(ViewState.APP);
          setActiveCustomerTab(CustomerTab.HOME);
      }
  };

  const handleLogout = async () => {
      console.log('🚪 [App] Logging out...');
      
      // Log out from Firebase Auth
      try {
          await signOut();
          console.log('✅ [App] Firebase signOut successful');
      } catch (error) {
          console.error('❌ [App] Firebase signOut failed:', error);
      }
      
      // Clear local mock store
      store.logout();
      setUser(null);
      setViewState(ViewState.LOGIN);
      setIsDrawerOpen(false);
      setActiveConversationId(null);
      setIsVerifyOpen(false);
      
      console.log('👋 [App] Logout complete');
  };

  const handleSwitchProfile = () => {
      if (user) {
          const newRole = user.role === UserRole.BUSINESS ? UserRole.MEMBER : UserRole.BUSINESS;
          setUser(store.login(newRole));
          setActiveTab(MainTab.DASHBOARD);
          setActiveCustomerTab(CustomerTab.HOME);
          setIsDrawerOpen(false);
      }
  };

  const handleOpenSubscription = () => {
    setIsDrawerOpen(false);
    setIsSubscriptionOpen(true);
  };

  const handleOpenWallet = () => {
    setIsDrawerOpen(false);
    setIsWalletOpen(true);
  };

  const handleOpenSettings = () => {
      setIsDrawerOpen(false);
      
      // Open appropriate settings based on user role
      if (user?.role === UserRole.BUSINESS) {
          // For businesses, open the SettingsView modal
          setIsSettingsOpen(true);
      } else {
          // For customers, open the customer settings modal
          setIsCustomerSettingsOpen(true);
      }
  };

  const handleManageSubscription = () => {
      setIsDrawerOpen(false);
      setIsCustomerSubscriptionOpen(true);
  };

  const handleUpgradeSubscription = async (tier: SubscriptionLevel) => {
      if (user && userProfile) {
        console.log('[App] Upgrading subscription to:', tier);
        
        // Update mock store (includes localStorage persistence)
        store.updateUserSubscription(user.id, tier);
        
        // Update local state immediately
        setUser({ ...user, subscriptionLevel: tier });
        
        // Save to localStorage
        const users = JSON.parse(localStorage.getItem('fluzio_users') || '[]');
        const updatedUsers = users.map((u: User) => 
          u.id === user.id ? { ...u, subscriptionLevel: tier } : u
        );
        localStorage.setItem('fluzio_users', JSON.stringify(updatedUsers));
        
        // Update current user in localStorage
        const currentUser = JSON.parse(localStorage.getItem('fluzio_current_user') || 'null');
        if (currentUser) {
          currentUser.subscriptionLevel = tier;
          localStorage.setItem('fluzio_current_user', JSON.stringify(currentUser));
        }
        
        // Update Firestore via API
        try {
          await api.updateUser(userProfile.uid, {
            subscriptionLevel: tier
          });
          console.log('[App] Subscription updated in Firestore');
        } catch (error) {
          console.error('[App] Failed to update subscription in Firestore:', error);
        }
      }
  };

  const handleUpdateSocialLinks = (links: User['socialLinks']) => {
      if (user) {
        console.log('[App] Updating social links:', links);
        setUser({ ...user, socialLinks: links });
        // Save to localStorage
        const users = JSON.parse(localStorage.getItem('fluzio_users') || '[]');
        const updatedUsers = users.map((u: User) => 
          u.id === user.id ? { ...u, socialLinks: links } : u
        );
        localStorage.setItem('fluzio_users', JSON.stringify(updatedUsers));
        // TODO: Call API to update in backend
      }
  };

  const handleSpendPoints = () => {
      setIsWalletOpen(false);
      if (user?.role === UserRole.MEMBER) {
          setActiveCustomerTab(CustomerTab.REWARDS); // Go to Rewards to redeem points
      } else {
          setActiveTab(MainTab.B2B);
          setB2bSubTab('Market');
      }
  };

  const handleNavigate = (link: string) => {
    console.log("Navigating to:", link);
    // Simple routing logic for demo
    if (user?.role === UserRole.BUSINESS) {
        if (link.includes('/missions/verify')) { setIsVerifyOpen(true); }
        else if (link.includes('/missions')) setActiveTab(MainTab.MISSIONS);
        else if (link.includes('/b2b/match')) { setActiveTab(MainTab.B2B); setB2bSubTab('Match'); }
        else if (link.includes('/b2b/squad')) { setActiveTab(MainTab.B2B); setB2bSubTab('My Squad'); }
    } else {
        if (link.includes('/missions')) setActiveCustomerTab(CustomerTab.MISSIONS);
    }
  };

  const handleGlobalSearchNavigate = (type: 'mission' | 'business' | 'meetup' | 'user', id: string) => {
    console.log('[App] Global search navigation:', type, id);
    
    if (type === 'mission') {
      setActiveCustomerTab(CustomerTab.MISSIONS);
      // TODO: Could add state to scroll to/highlight specific mission
    } else if (type === 'business') {
      setActiveCustomerTab(CustomerTab.DISCOVER);
      // TODO: Could add state to navigate to specific business details
    } else if (type === 'meetup') {
      setActiveCustomerTab(CustomerTab.EVENTS);
      // TODO: Could add state to navigate to specific meetup
    } else if (type === 'user') {
      // TODO: Could open user profile modal
      console.log('[App] Navigate to user profile:', id);
    }
  };

  const handleOpenSpecificChat = (chatId: string) => {
      setActiveConversationId(chatId);
      setIsMessagingOpen(true);
  };

  // --- Auth Screens ---
  if (viewState === ViewState.LOGIN) {
      return (
          <div className="min-h-screen bg-[#F8F9FE] flex flex-col items-center justify-center p-6 relative overflow-hidden">
              {/* Background Blobs */}
              <div className="absolute top-0 left-0 w-96 h-96 bg-[#FFC300] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#F72585] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
              <div className="absolute -bottom-8 left-20 w-96 h-96 bg-[#7209B7] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

              <div className="mb-8 text-center relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-tr from-[#F72585] to-[#7209B7] rounded-3xl text-white flex items-center justify-center shadow-2xl shadow-[#F72585]/40 mx-auto mb-6 rotate-6 hover:rotate-12 transition-transform duration-500">
                    <Sparkles className="w-10 h-10" />
                  </div>
                  <h1 className="text-4xl font-clash font-bold text-[#1E0E62] tracking-tight mb-2">Fluzio</h1>
                  <p className="text-lg text-[#8F8FA3] font-medium">Community marketing for the modern world.</p>
              </div>
              
              <div className="w-full max-w-sm bg-white/80 backdrop-blur-lg p-8 rounded-[32px] shadow-2xl shadow-purple-500/10 border border-white relative z-10">
                  <h2 className="text-2xl font-clash font-bold text-[#1E0E62] mb-6 text-center">Welcome Back</h2>
                  
                  <div className="space-y-4">
                      <Input 
                          label="Email or Username" 
                          placeholder="Enter your email or username" 
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          autoFocus
                      />
                      <div>
                        <Input 
                            label="Password" 
                            type="password" 
                            placeholder="Enter your password" 
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                        />
                        <div className="text-right mt-1">
                            <button 
                              onClick={() => setShowPasswordReset(true)}
                              className="text-xs font-bold text-[#F72585] hover:underline"
                            >
                              Forgot Password?
                            </button>
                        </div>
                      </div>
                      
                      <Button onClick={handleEmailLogin} className="w-full py-4 text-lg shadow-lg shadow-[#F72585]/20">
                          Log In
                      </Button>
                  </div>

                  {/* Demo Section - Minimized */}
                  <div className="mt-8 pt-6 border-t border-gray-100">
                      <p className="text-center text-[10px] font-bold text-gray-300 uppercase mb-3 tracking-wider">Quick Access (Demo)</p>
                      <div className="grid grid-cols-2 gap-3">
                           <button onClick={() => handleLogin(UserRole.MEMBER)} className="py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 hover:text-[#1E0E62] transition-all">
                              Creator Demo
                           </button>
                           <button onClick={() => handleLogin(UserRole.BUSINESS)} className="py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 hover:text-[#1E0E62] transition-all">
                              Business Demo
                           </button>
                      </div>
                  </div>

                  <div className="mt-6 text-center">
                      <span className="text-[#8F8FA3] font-medium text-sm">New to Fluzio? </span>
                      <button 
                          onClick={() => setViewState(ViewState.SIGNUP)}
                          className="text-[#7209B7] font-bold text-sm hover:underline"
                      >
                          Create Account
                      </button>
                  </div>
              </div>
              
              <PasswordResetModal 
                isOpen={showPasswordReset}
                onClose={() => setShowPasswordReset(false)}
              />
          </div>
      );
  }

  if (viewState === ViewState.SIGNUP) {
      return (
          <SignUpScreen 
            onComplete={handleSignUpComplete} 
            onBack={() => setViewState(ViewState.LOGIN)} 
          />
      );
  }

  if (viewState === ViewState.PENDING_APPROVAL) {
      return (
          <PendingApprovalScreen 
            onEnableNotifications={() => alert("Notifications Enabled!")}
            onBackToLogin={handleLogout}
          />
      );
  }

  // --- Instagram OAuth Callback (Priority Render) ---
  if (isInstagramCallbackOpen) {
    console.log('[App] 🔄 Rendering Instagram Callback Screen');
    return (
      <InstagramCallbackScreen 
        user={user} 
        onComplete={() => {
          setIsInstagramCallbackOpen(false);
          // Clear URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
        }}
      />
    );
  }

  // --- Main App Render ---
  if (!user) return null;

  // Determine role from Firestore profile first, fallback to mock user
  // During creator mode toggle, use current user.role to prevent view switching
  // During toggle, lock to current view to prevent flash
  // Otherwise derive from userProfile role, with CREATOR mapped to MEMBER
  const effectiveRole = isTogglingCreatorMode ? UserRole.MEMBER :
                        userProfile?.role === 'BUSINESS' ? UserRole.BUSINESS : 
                        userProfile?.role === 'CREATOR' ? UserRole.MEMBER :
                        user.role;

  // Log effective role for debugging
  if (isTogglingCreatorMode) {
    console.log('[App] 🔒 Toggle active - locked to MEMBER view to prevent flash');
  }

  // --- Customer App Render ---
  if (effectiveRole === UserRole.MEMBER) {
      return (
        <>
            <CustomerLayout
                user={user}
                activeTab={activeCustomerTab}
                onTabChange={setActiveCustomerTab}
                onMenuClick={() => setIsDrawerOpen(true)}
                onNotificationClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                onMessagingClick={() => setIsMessagingOpen(true)}
                onSearchClick={() => setIsGlobalSearchOpen(true)}
                unreadNotifications={unreadNotificationsCount}
                unreadMessages={unreadMessagesCount}
            >
                 <div className="transition-opacity duration-200 ease-in-out" style={{ opacity: 1 }}>
                   {activeCustomerTab === CustomerTab.HOME && (
                       <HomeScreen 
                          onNavigate={(screen, params) => {
                              console.log('Navigate to:', screen, params);
                              if (screen === 'Missions' || screen === 'MissionsScreen') {
                                  setActiveCustomerTab(CustomerTab.MISSIONS);
                              } else if (screen === 'Discover' || screen === 'DiscoverScreen') {
                                  setActiveCustomerTab(CustomerTab.DISCOVER);
                              } else if (screen === 'Rewards' || screen === 'RewardsScreen') {
                                  setActiveCustomerTab(CustomerTab.REWARDS);
                              } else if (screen === 'Events' || screen === 'EventsScreen') {
                                  setActiveCustomerTab(CustomerTab.EVENTS);
                              }
                          }}
                       />
                   )}
                   {activeCustomerTab === CustomerTab.DISCOVER && <ExploreScreen user={user} />}
                   {activeCustomerTab === CustomerTab.REWARDS && (
                     <RewardsRedemption 
                       user={user}
                     />
                   )}
                   {activeCustomerTab === CustomerTab.MISSIONS && <MissionsScreen user={user} />}
                   {activeCustomerTab === CustomerTab.EVENTS && <MeetupsScreen />}
                 </div>
            </CustomerLayout>

            {/* Onboarding Flow for New Users */}
            {showOnboarding && user && (
              <OnboardingFlow
                user={user}
                onComplete={() => {
                  console.log('[App] 🎓 Onboarding completed');
                  setShowOnboarding(false);
                  setOnboardingComplete(true);
                }}
                onSkip={() => {
                  console.log('[App] ⏭️ Onboarding skipped');
                  setShowOnboarding(false);
                  setOnboardingComplete(true);
                }}
              />
            )}

            {/* Global Search */}
            <GlobalSearch
              isOpen={isGlobalSearchOpen}
              onClose={() => setIsGlobalSearchOpen(false)}
              onNavigate={handleGlobalSearchNavigate}
              currentUserId={user.id}
            />

            {/* Friends Modal */}
            <FriendsModal
              isOpen={isFriendsModalOpen}
              onClose={() => setIsFriendsModalOpen(false)}
              currentUser={user}
            />

            {/* Offline Detector */}
            <OfflineDetector onStatusChange={setIsOnline} />

            {/* Accessibility Modal */}
            <AccessibilityModal
              isOpen={isAccessibilityModalOpen}
              onClose={() => setIsAccessibilityModalOpen(false)}
            />

            {/* Analytics Dashboard Modal/Screen */}
            {showAnalyticsDashboard && (
              <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 z-10">
                  <button
                    onClick={() => setShowAnalyticsDashboard(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <h2 className="text-lg font-semibold">Analytics</h2>
                </div>
                <AnalyticsDashboard 
                  businessId={user.id}
                  businessName={userProfile?.displayName || userProfile?.businessName || 'My Business'}
                />
              </div>
            )}

            {/* Sidebar Menu Drawer */}
            {isDrawerOpen && (
              <div className="fixed inset-0 z-[100] flex">
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 bg-[#1E0E62]/30 backdrop-blur-sm transition-opacity" 
                  onClick={() => setIsDrawerOpen(false)} 
                />
                
                {/* Sidebar Content */}
                <div className="relative w-80 bg-white h-full shadow-2xl transform transition-transform duration-300 animate-in slide-in-from-left rounded-r-[32px] overflow-hidden">
                  <SidebarMenu
                    user={{
                      id: userProfile?.id || user.id,
                      uid: userProfile?.uid || user.id,
                      name: userProfile?.name || user.name,
                      handle: '@' + (user.socialLinks?.instagram?.username || user.name.toLowerCase().replace(' ', '_')),
                      email: userProfile?.email || user.contactEmail || '',
                      city: userProfile?.homeCity || user.currentCity || 'Global',
                      avatarUrl: userProfile?.photoUrl || user.avatarUrl,
                      creatorMode: (() => {
                        const mode = user.creatorMode || false;
                        console.log('[App] 🎨 SidebarMenu creatorMode:', mode, 'user.creatorMode:', user.creatorMode, 'user.role:', user.role);
                        return mode;
                      })(),
                      points: userProfile?.credits || user.points || 150,
                      level: userProfile?.level || 1,
                      role: (userProfile?.role || user.role) as any,
                      createdAt: userProfile?.createdAt || new Date().toISOString(),
                      subscriptionLevel: user.subscriptionLevel || 'FREE',
                      socialLinks: {
                        instagram: user.socialLinks?.instagram?.connected ? {
                          connected: true,
                          handle: user.socialLinks.instagram.username || '',
                          url: user.socialLinks.instagram.username ? `https://instagram.com/${user.socialLinks.instagram.username}` : undefined
                        } : undefined,
                        facebook: user.socialLinks?.facebook ? {
                          handle: user.socialLinks.facebook,
                          url: `https://facebook.com/${user.socialLinks.facebook}`
                        } : undefined,
                        linkedin: user.socialLinks?.linkedin ? {
                          handle: user.socialLinks.linkedin,
                          url: `https://linkedin.com/in/${user.socialLinks.linkedin}`
                        } : undefined
                      }
                    }}
                    onNavigate={(route) => {
                      console.log('[App] 🔗 SidebarMenu navigation triggered:', route);
                      // Handle navigation from sidebar
                      if (route === 'profile') {
                        setIsCustomerProfileOpen(true);
                      } else if (route === 'settings') {
                        handleOpenSettings();
                      } else if (route === 'manage-subscription') {
                        handleManageSubscription();
                      } else if (route === 'edit-profile') {
                        setIsCustomerProfileOpen(true);
                      } else if (route === 'linked-accounts') {
                        setIsDrawerOpen(false);
                        setIsLinkedAccountsOpen(true);
                      } else if (route === 'friends') {
                        setIsDrawerOpen(false);
                        setIsFriendsModalOpen(true);
                      } else if (route === 'accessibility') {
                        setIsDrawerOpen(false);
                        setIsAccessibilityModalOpen(true);
                      } else if (route === 'notifications') {
                        setIsDrawerOpen(false);
                        setShowEnhancedNotifications(true);
                      } else if (route === 'notification-settings') {
                        setIsDrawerOpen(false);
                        setShowNotificationPreferences(true);
                      } else if (route === 'analytics') {
                        setIsDrawerOpen(false);
                        setActiveTab(MainTab.ANALYTICS);
                      } else if (route === 'customers') {
                        setIsDrawerOpen(false);
                        setActiveTab(MainTab.CUSTOMERS);
                      } else if (route === 'help') {
                        setIsDrawerOpen(false);
                        setIsHelpOpen(true);
                      } else if (route === 'privacy' || route === 'terms') {
                        // TODO: Open legal pages
                        console.log('Navigate to', route);
                      }
                      // Creator Zone routes
                      else if (route === 'creator-skills') {
                        console.log('[App] 📋 Opening Creator Skills screen');
                        setIsDrawerOpen(false);
                        setIsCreatorSkillsOpen(true);
                      } else if (route === 'creator-portfolio') {
                        console.log('[App] 🖼️ Opening Creator Portfolio screen');
                        setIsDrawerOpen(false);
                        setIsCreatorPortfolioOpen(true);
                      } else if (route === 'collaboration-requests') {
                        console.log('[App] 🤝 Opening Collaboration Requests screen');
                        setIsDrawerOpen(false);
                        setIsCollaborationRequestsOpen(true);
                      } else if (route === 'creator-missions' || route === 'creator-jobs') {
                        // TODO: Implement creator missions and jobs screens
                        console.log('Navigate to', route);
                      }
                    }}
                    onLogout={handleLogout}
                    onClose={() => setIsDrawerOpen(false)}
                    onToggleCreatorMode={async () => {
                      // Optimistic update - toggle immediately for instant feedback
                      const newCreatorMode = !user.creatorMode;
                      const previousMode = user.creatorMode;
                      
                      console.log('[App] 🔄 Toggling creator mode:', previousMode, '→', newCreatorMode);
                      console.log('[App] 🔒 Locking sync effects');
                      setIsTogglingCreatorMode(true); // Prevent sync interference
                      setUser(prev => prev ? { ...prev, creatorMode: newCreatorMode } : null);
                      
                      // Persist to Firestore in background
                      try {
                        await api.updateUser(user.id, { creatorMode: newCreatorMode });
                        console.log('[App] ✅ Creator mode saved to Firestore:', newCreatorMode);
                      } catch (error) {
                        console.error('[App] ❌ Failed to update creator mode:', error);
                        // Revert on error
                        setUser(prev => prev ? { ...prev, creatorMode: previousMode } : null);
                        alert('Failed to update creator mode. Please try again.');
                      } finally {
                        setIsTogglingCreatorMode(false); // Re-enable sync
                      }
                    }}
                    onSwitchAccount={handleSwitchProfile}
                  />
                </div>
              </div>
            )}
            
            <InboxScreen 
                isOpen={isMessagingOpen} 
                onClose={() => { setIsMessagingOpen(false); setActiveConversationId(null); }} 
                user={user}
                initialConversationId={activeConversationId}
            />
            
            {isNotificationsOpen && (
             <>
                <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)}></div>
                <NotificationList 
                    notifications={notifications} 
                    onClose={() => setIsNotificationsOpen(false)}
                    onNavigate={handleNavigate}
                    userId={user?.id || userProfile?.uid}
                />
             </>
           )}

           <SettingsView 
                isOpen={isSettingsOpen} 
                onClose={() => setIsSettingsOpen(false)} 
                user={user} 
            />

            <CustomerSettingsModal
              isOpen={isCustomerSettingsOpen}
              onClose={() => setIsCustomerSettingsOpen(false)}
              user={user}
              onLogout={handleLogout}
              onManageSubscription={handleManageSubscription}
            />

            <CustomerSubscriptionModal
              isOpen={isCustomerSubscriptionOpen}
              onClose={() => setIsCustomerSubscriptionOpen(false)}
              user={user}
              onUpgrade={handleUpgradeSubscription}
            />

            <LinkedAccountsModal
              isOpen={isLinkedAccountsOpen}
              onClose={() => setIsLinkedAccountsOpen(false)}
              user={user}
              onUpdateSocialLinks={handleUpdateSocialLinks}
            />

            <HelpModal
              isOpen={isHelpOpen}
              onClose={() => setIsHelpOpen(false)}
            />

            <CustomerProfileModal
              isOpen={isCustomerProfileOpen}
              onClose={() => setIsCustomerProfileOpen(false)}
              user={user}
              onManageSubscription={handleManageSubscription}
            />

            {/* Creator Mode Screens */}
            {isCreatorSkillsOpen && (
              <>
                {console.log('[App] ✅ Rendering CreatorSkillsScreen')}
                <CreatorSkillsScreen
                  user={user}
                  onBack={() => setIsCreatorSkillsOpen(false)}
                />
              </>
            )}

            {isCreatorPortfolioOpen && (
              <>
                {console.log('[App] ✅ Rendering CreatorPortfolioScreen')}
                <CreatorPortfolioScreen
                  user={user}
                  onBack={() => setIsCreatorPortfolioOpen(false)}
                />
              </>
            )}

            {isCollaborationRequestsOpen && (
              <>
                {console.log('[App] ✅ Rendering CollaborationRequestsScreen')}
                <CollaborationRequestsScreen
                  user={user}
                  onBack={() => setIsCollaborationRequestsOpen(false)}
                  onOpenChat={(businessId) => {
                    setIsCollaborationRequestsOpen(false);
                    setIsMessagingOpen(true);
                    // Find conversation with business by checking participant IDs
                    const conv = conversations.find(c => 
                      c.participants.some(p => typeof p === 'string' ? p === businessId : p.id === businessId)
                    );
                    if (conv) setActiveConversationId(conv.id);
                  }}
                />
              </>
            )}

            {isBusinessProfileOpen && (() => {
              // Merge mock user with Firestore userProfile for complete business data
              const mergedBusiness = {
                ...user,
                ...(userProfile && {
                  bio: userProfile.bio || user.bio,
                  mission: userProfile.mission,
                  languages: userProfile.languages,
                  offers: userProfile.offers,
                  yearFounded: userProfile.yearFounded,
                  teamSize: userProfile.teamSize,
                  rating: userProfile.rating,
                  reviewsCount: userProfile.reviewsCount,
                  collabsCompleted: userProfile.collabsCompleted,
                  creatorFavorites: userProfile.creatorFavorites,
                  responseTime: userProfile.responseTime,
                  vibe: userProfile.vibeTags || userProfile.vibe || user.vibe,
                  avatarUrl: userProfile.photoUrl || user.avatarUrl,
                  socialLinks: userProfile.socialLinks || user.socialLinks,
                  homeCity: userProfile.homeCity || user.homeCity,
                  category: (userProfile.category || user.category) as BusinessCategory
                })
              };
              
              return (
                <BusinessProfileScreen 
                  business={mergedBusiness as User}
                  isOwner={true}
                  onEdit={() => {
                    setIsBusinessProfileOpen(false);
                    setIsEditBusinessProfileOpen(true);
                  }}
                  onBack={() => setIsBusinessProfileOpen(false)}
                />
              );
            })()}

            <EditBusinessProfile 
              isOpen={isEditBusinessProfileOpen}
              onClose={() => setIsEditBusinessProfileOpen(false)}
              business={user}
              onSave={async () => {
                // Refresh user profile from Firestore after save
                if (userProfile) {
                  const result = await api.getUser(userProfile.uid);
                  if (result.success && result.user) {
                    // Update local user state with all Firestore data
                    setUser(prev => prev ? { ...prev, ...result.user } : null);
                  }
                }
              }}
            />
        </>
      );
  }

  // --- Business App Render ---

  if (isVerifyOpen) {
      return (
          <VerifyScreen 
              user={user} 
              onBack={() => setIsVerifyOpen(false)} 
          />
      );
  }

  return (
    <>
      <BusinessLayout 
        user={user} 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onMenuClick={() => setIsDrawerOpen(true)}
        onMessagingClick={() => setIsMessagingOpen(true)}
        unreadMessages={unreadMessagesCount}
        notifications={notifications}
        unreadNotifications={unreadNotificationsCount}
        onNotificationClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
        isNotificationsOpen={isNotificationsOpen}
        closeNotifications={() => setIsNotificationsOpen(false)}
        onNavigate={handleNavigate}
      >
           {activeTab === MainTab.DASHBOARD && <DashboardView user={user} onNavigate={handleNavigate} />}
           {activeTab === MainTab.ANALYTICS && (
             <AnalyticsDashboard
               businessId={user.id}
               businessName={user.name}
             />
           )}
           {activeTab === MainTab.CUSTOMERS && (
             <CustomerCRM
               businessId={user.id}
               businessName={user.name}
             />
           )}
           {activeTab === MainTab.MISSIONS && <MissionsView user={user} onNavigate={handleNavigate} />}
           {activeTab === MainTab.REWARDS && (
             <div className="p-6">
               <RewardsAndPointsHub
                 businessId={user.id}
                 businessName={user.name}
                 businessLogo={user.avatarUrl}
                 currentPoints={user.points || 0}
                 onPointsChange={() => {
                   // Refresh user data to update points display
                   const updatedUser = store.getUser(user.id);
                   if (updatedUser) setUser(updatedUser);
                 }}
               />
             </div>
           )}
           {activeTab === MainTab.PEOPLE && <PeopleView user={user} />}
           {activeTab === MainTab.B2B && (
               <B2BView 
                 user={user} 
                 activeSubTab={b2bSubTab} 
                 onSubTabChange={setB2bSubTab}
                 onOpenChat={handleOpenSpecificChat}
                 currentSquad={currentSquad}
                 projects={projects}
                 onCreateProject={() => setShowCreateProject(true)}
               />
           )}
      </BusinessLayout>

      <UserDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        user={user}
        onLogout={handleLogout}
        onSwitchProfile={handleSwitchProfile}
        onOpenSubscription={handleOpenSubscription}
        onOpenWallet={handleOpenWallet}
        onOpenSettings={handleOpenSettings}
        onOpenProfile={() => {
          console.log('[App] Opening Business Profile, isBusinessProfileOpen will be set to true');
          setIsBusinessProfileOpen(true);
          setIsDrawerOpen(false); // Close drawer when opening profile
        }}
        onOpenAdminPanel={() => {
          setShowAdminDashboard(true);
          setIsDrawerOpen(false); // Close drawer when opening admin panel
        }}
      />

      <SubscriptionView 
        isOpen={isSubscriptionOpen} 
        onClose={() => setIsSubscriptionOpen(false)} 
        user={user} 
      />

      <WalletView 
        isOpen={isWalletOpen} 
        onClose={() => setIsWalletOpen(false)} 
        user={user} 
        onSpend={handleSpendPoints}
      />

      <SettingsView 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        user={user} 
      />

      <InboxScreen 
        isOpen={isMessagingOpen} 
        onClose={() => { setIsMessagingOpen(false); setActiveConversationId(null); }} 
        user={user}
        initialConversationId={activeConversationId}
      />

      {isBusinessProfileOpen && (() => {
        console.log('[App] Rendering BusinessProfileScreen, user:', user.name, 'userProfile:', userProfile);
        // Merge mock user with Firestore userProfile for complete business data
        const mergedBusiness = {
          ...user,
          id: userProfile?.uid || user.id, // Use Firebase UID for real backend calls
          ...(userProfile && {
            bio: userProfile.bio || user.bio,
            aboutText: userProfile.aboutText,
            tagline: userProfile.tagline,
            aboutAiSource: userProfile.aboutAiSource,
            mission: userProfile.mission,
            languages: userProfile.languages,
            offers: userProfile.offers,
            yearFounded: userProfile.yearFounded,
            teamSize: userProfile.teamSize,
            rating: userProfile.rating,
            reviewsCount: userProfile.reviewsCount,
            collabsCompleted: userProfile.collabsCompleted,
            creatorFavorites: userProfile.creatorFavorites,
            responseTime: userProfile.responseTime,
            vibe: userProfile.vibeTags || userProfile.vibe || user.vibe,
            vibeTags: userProfile.vibeTags || userProfile.vibe || user.vibe,
            avatarUrl: userProfile.photoUrl || user.avatarUrl,
            socialLinks: userProfile.socialLinks || user.socialLinks,
            socialAccounts: userProfile.socialAccounts || user.socialAccounts,
            homeCity: userProfile.homeCity || user.homeCity,
            category: (userProfile.category || user.category) as BusinessCategory,
            geo: userProfile.geo || user.geo,
            location: userProfile.location || user.location,
            address: userProfile.address || user.address,
            phone: userProfile.phone || user.phone,
            countryCode: userProfile.countryCode || user.countryCode,
            contactEmail: userProfile.contactEmail || user.contactEmail,
            website: userProfile.website || user.website
          })
        };
        
        console.log('[App] Merged business data:', {
          name: mergedBusiness.name,
          geo: mergedBusiness.geo,
          location: mergedBusiness.location,
          address: mergedBusiness.address,
          socialAccounts: mergedBusiness.socialAccounts
        });
        
        return (
          <BusinessProfileScreen 
            business={mergedBusiness as User}
            isOwner={true}
            onEdit={() => {
              setIsBusinessProfileOpen(false);
              setIsEditBusinessProfileOpen(true);
            }}
            onBack={() => setIsBusinessProfileOpen(false)}
          />
        );
      })()}

      <EditBusinessProfile 
        isOpen={isEditBusinessProfileOpen}
        onClose={() => setIsEditBusinessProfileOpen(false)}
        business={user}
        onSave={async () => {
          // Refresh user profile from Firestore after save
          if (userProfile) {
            const result = await api.getUser(userProfile.uid);
            if (result.success && result.user) {
              // Update local user state with all Firestore data
              setUser(prev => prev ? { ...prev, ...result.user } : null);
            }
          }
        }}
      />

      {/* Notification Preferences Modal */}
      {showNotificationPreferences && user && (
        <NotificationPreferences
          userId={user.id}
          onClose={() => setShowNotificationPreferences(false)}
        />
      )}

      {/* Enhanced Notifications View */}
      {showEnhancedNotifications && user && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-10">
            <h2 className="text-xl font-bold text-[#1E0E62]">Notifications</h2>
            <button
              onClick={() => setShowEnhancedNotifications(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <EnhancedNotificationList
            userId={user.id}
            onNavigate={(route) => {
              setShowEnhancedNotifications(false);
              handleNavigate(route);
            }}
            onOpenPreferences={() => {
              setShowEnhancedNotifications(false);
              setShowNotificationPreferences(true);
            }}
          />
        </div>
      )}

      {/* Create Project Modal */}
      {user && (
        <CreateProjectModal
          isOpen={showCreateProject}
          onClose={() => setShowCreateProject(false)}
          businessId={user.id}
          businessName={userProfile?.name || user.name}
          businessType={userProfile?.businessType || user.businessType}
          category={(userProfile?.category || user.category) as any}
          onSubmit={handleCreateProject}
        />
      )}

      {/* Admin Dashboard */}
      {showAdminDashboard && (user?.role === UserRole.ADMIN || user?.email === 'admin@fluzio.com') && (
        <AdminDashboard />
      )}
    </>
  );
};

export default App;