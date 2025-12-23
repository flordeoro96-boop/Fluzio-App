import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Send, Image as ImageIcon, Users, Clock } from 'lucide-react';
import { MeetupChat, MeetupChatMessage, subscribeToChatMessages, sendMeetupMessage, markMessagesAsRead } from '../services/meetupChatService';
import { useAuth } from '../services/AuthContext';
import { useToast } from '../hooks/useToast';

interface MeetupChatModalProps {
  chat: MeetupChat;
  onClose: () => void;
}

export function MeetupChatModal({ chat, onClose }: MeetupChatModalProps) {
  const { userProfile } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [messages, setMessages] = useState<MeetupChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chat.id) return;

    // Subscribe to messages
    const unsubscribe = subscribeToChatMessages(chat.id, (newMessages) => {
      setMessages(newMessages);
      scrollToBottom();
    });

    // Mark messages as read
    if (userProfile?.id) {
      markMessagesAsRead(chat.id, userProfile.id);
    }

    return () => unsubscribe();
  }, [chat.id, userProfile?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !userProfile) return;

    setSending(true);
    try {
      const result = await sendMeetupMessage(
        chat.id,
        userProfile.id,
        newMessage.trim(),
        userProfile.name,
        userProfile.avatarUrl
      );

      if (result.success) {
        setNewMessage('');
      } else {
        showToast(t('meetups.chat.failedToSend'), 'error');
      }
    } catch (error) {
      showToast(t('meetups.chat.errorSending'), 'error');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const isExpiringSoon = () => {
    const expiresAt = new Date(chat.expiresAt);
    const now = new Date();
    const hoursLeft = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursLeft < 6 && hoursLeft > 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Chat Window */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5" />
              <div>
                <h3 className="font-semibold">{t('meetups.chat.header')}</h3>
                <p className="text-xs text-white/80">
                  {t('meetups.chat.participantsCount', { count: chat.participants.length })}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Expiration Warning */}
          {isExpiringSoon() && (
            <div className="bg-orange-500/30 backdrop-blur-sm rounded-lg p-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <p className="text-xs">{t('meetups.chat.expiresInHours', { hours: Math.ceil((new Date(chat.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60)) })}</p>
            </div>
          )}
        </div>

        {/* Participants Bar */}
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <div className="flex items-center gap-2 overflow-x-auto">
            {chat.participants.map((participant) => (
              <div key={participant.userId} className="flex items-center gap-2 bg-white rounded-full px-3 py-1 border border-gray-200 whitespace-nowrap">
                {participant.userAvatar ? (
                  <img 
                    src={participant.userAvatar} 
                    alt={participant.userName}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center font-bold">
                    {participant.userName.charAt(0)}
                  </div>
                )}
                <span className="text-xs font-medium text-gray-700">{participant.userName}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-gray-600">{t('meetups.chat.noMessages')}</p>
              <p className="text-sm text-gray-500">{t('meetups.chat.sayHi')}</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.senderId === userProfile?.id;
              const isSystem = message.senderId === 'system';

              if (isSystem) {
                return (
                  <div key={message.id} className="text-center">
                    <p className="text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1 inline-block">
                      {message.message}
                    </p>
                  </div>
                );
              }

              return (
                <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                    {!isOwn && (
                      <div className="flex items-center gap-2 mb-1">
                        {message.senderAvatar ? (
                          <img 
                            src={message.senderAvatar} 
                            alt={message.senderName}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-gray-400 text-white text-xs flex items-center justify-center font-bold">
                            {message.senderName.charAt(0)}
                          </div>
                        )}
                        <span className="text-xs font-medium text-gray-700">{message.senderName}</span>
                      </div>
                    )}
                    
                    <div className={`rounded-2xl px-4 py-2 ${
                      isOwn 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm break-words">{message.message}</p>
                    </div>
                    
                    <p className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {chat.isActive ? (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex items-end gap-2">
              <div className="flex-1 bg-white rounded-2xl border border-gray-300 focus-within:border-purple-500 transition-all">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t('messages.typeMessage')}
                  className="w-full px-4 py-3 bg-transparent outline-none resize-none"
                  rows={1}
                  style={{ maxHeight: '100px' }}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!newMessage.trim() || sending}
                className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">{t('meetups.chat.sendHint')}</p>
          </div>
        ) : (
          <div className="border-t border-gray-200 p-4 bg-gray-100 text-center">
            <p className="text-sm text-gray-600">{t('meetups.chat.expired')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
