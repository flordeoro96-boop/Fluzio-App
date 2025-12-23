import React, { useState } from 'react';
import { Notification, NotificationType } from '../types';
import { markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, deleteAllNotifications } from '../services/notificationService';
import { Camera, Handshake, Users, Info, Circle, X, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface NotificationListProps {
  notifications: Notification[];
  onClose: () => void;
  onNavigate: (link: string) => void;
  userId?: string;
}

export const NotificationList: React.FC<NotificationListProps> = ({ notifications, onClose, onNavigate, userId }) => {
  const { t } = useTranslation();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const handleItemClick = async (notification: Notification) => {
    try {
      await markNotificationAsRead(notification.id);
      onNavigate(notification.actionLink);
      onClose();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    setDeletingId(notificationId);
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!userId) return;
    try {
      await markAllNotificationsAsRead(userId);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDeleteAll = async () => {
    if (!userId) return;
    if (!confirm(t('notifications.deleteAll'))) return;
    try {
      await deleteAllNotifications(userId);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'VERIFY_MISSION': return <Camera className="w-5 h-5 text-[#6C4BFF]" />;
      case 'B2B_MATCH': return <Handshake className="w-5 h-5 text-[#00E5FF]" />;
      case 'SQUAD_ALERT': return <Users className="w-5 h-5 text-[#FFB86C]" />;
      default: return <Info className="w-5 h-5 text-[#8F8FA3]" />;
    }
  };

  const getBgColor = (type: NotificationType) => {
      switch (type) {
        case 'VERIFY_MISSION': return 'bg-[#6C4BFF]/10';
        case 'B2B_MATCH': return 'bg-[#00E5FF]/10';
        case 'SQUAD_ALERT': return 'bg-[#FFB86C]/10';
        default: return 'bg-gray-50';
      }
  };

  return (
    <div className="absolute top-20 right-4 w-96 bg-white/90 backdrop-blur-2xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/50 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right font-sans">
      <div className="p-5 border-b border-gray-100/50 flex justify-between items-center bg-white/50">
          <h3 className="font-clash font-bold text-[#1E0E62] text-lg tracking-tight">{t('notifications.title')}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5 text-[#8F8FA3]" />
          </button>
      </div>

      <div className="max-h-[400px] overflow-y-auto p-2">
          {notifications.length === 0 ? (
              <div className="p-10 text-center text-[#8F8FA3] text-sm font-medium">
                  {t('notifications.noNotifications')}
              </div>
          ) : (
              notifications.map(n => (
                  <button 
                    key={n.id} 
                    onClick={() => handleItemClick(n)}
                    className={`w-full text-left p-4 flex gap-4 hover:bg-white rounded-2xl transition-all active:scale-[0.98] mb-1 group ${!n.isRead ? 'bg-[#4CC9F0]/5' : 'bg-transparent'}`}
                  >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${getBgColor(n.type)}`}>
                          {getIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                              <h4 className={`text-sm truncate pr-2 ${!n.isRead ? 'font-bold text-[#1E0E62]' : 'font-medium text-[#8F8FA3]'}`}>
                                  {n.title}
                              </h4>
                              <div className="flex items-center gap-2">
                                  {!n.isRead && <Circle className="w-2 h-2 fill-[#00E5FF] text-[#00E5FF] shrink-0 mt-1.5" />}
                                  <button
                                    onClick={(e) => handleDelete(e, n.id)}
                                    disabled={deletingId === n.id}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded-lg transition-all"
                                    title={t('notifications.deleteNotification')}
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                  </button>
                              </div>
                          </div>
                          <p className="text-xs text-[#8F8FA3] line-clamp-2 mb-2 font-medium leading-relaxed">{n.message}</p>
                          <div className="text-[10px] text-[#8F8FA3]/70 font-bold uppercase tracking-wide">
                              {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}
                          </div>
                      </div>
                  </button>
              ))
          )}
      </div>
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-2">
            <button 
              onClick={handleMarkAllAsRead}
              className="text-xs text-[#6C4BFF] font-bold cursor-pointer hover:underline"
            >
              {t('notifications.markAllRead')}
            </button>
            <button
              onClick={handleDeleteAll}
              className="text-xs text-red-500 font-bold cursor-pointer hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              {t('common.delete')} {t('common.all')}
            </button>
        </div>
      )}
    </div>
  );
};