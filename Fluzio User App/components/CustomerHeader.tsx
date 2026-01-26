import React from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../types';
import { MessageCircle, Sparkles, Search } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { Notification } from '../services/notificationServiceEnhanced';

interface CustomerHeaderProps {
  user: User;
  onMenuClick: () => void;
  onNotificationClick?: (notification: Notification) => void;
  onMessagingClick: () => void;
  onSearchClick: () => void;
  unreadMessages: number;
}

export const CustomerHeader: React.FC<CustomerHeaderProps> = ({
  user,
  onMenuClick,
  onNotificationClick,
  onMessagingClick,
  onSearchClick,
  unreadMessages
}) => {
  const { t } = useTranslation();
  return (
    <header className="fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-4 z-40 bg-white/85 backdrop-blur-xl border-b border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.03)]" style={{ paddingTop: 'env(safe-area-inset-top, 0)' }}>
      {/* Left: Avatar (Drawer Trigger) */}
      <button onClick={onMenuClick} className="group relative min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Open menu">
        <div className="absolute -inset-[3px] bg-gradient-to-tr from-[#FFB86C] via-[#00E5FF] to-[#6C4BFF] rounded-full opacity-100 group-hover:scale-105 transition-transform"></div>
        <div className="relative bg-white p-[2px] rounded-full">
          <img 
            src={user.avatarUrl} 
            alt={t('header.profileAlt')} 
            className="w-8 h-8 rounded-full object-cover" 
          />
        </div>
      </button>

      {/* Center: Logo */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center pointer-events-none">
        <img src="/beevvy-logo.png?v=2" alt="Beevvy" className="h-10 w-auto" />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search */}
        <button 
          onClick={onSearchClick} 
          className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#1E0E62] hover:bg-white/50 rounded-full transition-all active:scale-90 relative"
          title={t('header.searchTooltip')}
          aria-label="Search"
        >
          <Search className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2px]" />
        </button>

        {/* Messages */}
        <button 
          onClick={onMessagingClick} 
          className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#1E0E62] hover:bg-white/50 rounded-full transition-all active:scale-90 relative"
          aria-label={`Messages ${unreadMessages > 0 ? `(${unreadMessages} unread)` : ''}`}
        >
          <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2px]" />
          {unreadMessages > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#6C4BFF] rounded-full ring-2 ring-white"></span>
          )}
        </button>

        {/* Notifications - Now using NotificationBell component */}
        <NotificationBell onNotificationClick={onNotificationClick} />
      </div>
    </header>
  );
};