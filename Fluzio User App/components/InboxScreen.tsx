
import React, { useState, useEffect } from 'react';
import { User, Conversation } from '../types';
import { store } from '../services/mockStore';
import { ChatScreen } from './ChatScreen'; 
import { ArrowLeft, Search, Users, User as UserIcon, Briefcase, MessageSquare, Plus, X, Loader2, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from './Common';
import { useTranslation } from 'react-i18next';

interface InboxScreenProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  initialConversationId?: string | null;
  onClearConversation?: () => void;
}

type InboxTab = 'PARTNERS' | 'CREATORS' | 'INDIVIDUALS' | 'AMBASSADORS';

export const InboxScreen: React.FC<InboxScreenProps> = ({ isOpen, onClose, user, initialConversationId, onClearConversation }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<InboxTab>('PARTNERS');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [firestoreConversations, setFirestoreConversations] = useState<any[]>([]);
  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Use only Firestore conversations (mockStore is deprecated)
  const conversations = React.useMemo(() => {
    console.log('[InboxScreen] 🔄 Conversations memo updated:', {
      firestoreCount: firestoreConversations.length,
      totalCount: firestoreConversations.length,
      conversationIds: firestoreConversations.map(c => ({ id: c.id, type: c.type, name: c.name }))
    });
    return firestoreConversations;
  }, [firestoreConversations]);

  // Subscribe to Firestore conversations in real-time
  useEffect(() => {
    if (!user?.id) return;

    console.log('[InboxScreen] Subscribing to Firestore conversations for user:', user.id);
    
    import('../services/conversationService').then(({ subscribeToConversations }) => {
      const unsubscribe = subscribeToConversations(
        user.id,
        async (newConversations) => {
          console.log('[InboxScreen] Received Firestore conversations:', newConversations.length);
          // Convert Firestore conversations to UI format
          const conversationsForUI = await Promise.all(newConversations.map(async (c) => {
            const otherUserId = c.participants.find(p => p !== user.id) || '';
            
            // Check if this is already a group chat (type field exists in Firestore)
            if (c.type === 'SQUAD_GROUP' || c.type === 'BUSINESS_SQUAD_GROUP') {
              return {
                id: c.id,
                type: c.type,
                participants: c.participants.map(pId => ({
                  id: pId,
                  name: c.participantNames[pId] || 'Unknown',
                  avatarUrl: c.participantAvatars?.[pId] || ''
                })),
                lastMessage: {
                  senderId: '',
                  text: c.lastMessageText || 'No messages yet',
                  timestamp: c.lastMessageAt || new Date().toISOString()
                },
                unreadCount: c.unreadCounts[user.id] || 0,
                name: c.name || 'Group Chat'
              };
            }
            
            // Determine conversation type based on participant roles
            // Four types: B2B_DM (businesses), CREATOR_DM (creators), INDIVIDUAL_DM (members), SQUAD_GROUP (groups), BUSINESS_SQUAD_GROUP (business groups)
            let conversationType: 'B2B_DM' | 'CREATOR_DM' | 'INDIVIDUAL_DM' | 'SQUAD_GROUP' | 'BUSINESS_SQUAD_GROUP' = 'INDIVIDUAL_DM';
            
            // Check if we have participant roles stored
            const hasRoles = c.participantRoles && Object.keys(c.participantRoles).length > 0;
            
            if (hasRoles) {
              const currentUserRole = c.participantRoles[user.id];
              const otherUserRole = c.participantRoles[otherUserId];
              
              // Both are BUSINESS → Businesses tab
              if (currentUserRole === 'BUSINESS' && otherUserRole === 'BUSINESS') {
                conversationType = 'B2B_DM';
              }
              // Other is CREATOR → Creators tab
              else if (otherUserRole === 'CREATOR') {
                conversationType = 'CREATOR_DM';
              }
              // Other is MEMBER → Individuals tab
              else if (otherUserRole === 'MEMBER') {
                conversationType = 'INDIVIDUAL_DM';
              }
              // If current user is CREATOR and other is BUSINESS → Businesses tab
              else if ((currentUserRole === 'CREATOR' || currentUserRole === 'MEMBER') && otherUserRole === 'BUSINESS') {
                conversationType = 'B2B_DM';
              }
            } else if (otherUserId) {
              // Fallback: fetch other user's role from Firestore if roles not stored
              try {
                const { getUserById } = await import('../services/userService');
                const otherUser = await getUserById(otherUserId);
                
                if (otherUser) {
                  if (otherUser.role === 'BUSINESS') {
                    conversationType = 'B2B_DM';
                  } else if (otherUser.role === 'CREATOR') {
                    conversationType = 'CREATOR_DM';
                  } else {
                    conversationType = 'INDIVIDUAL_DM';
                  }
                }
              } catch (error) {
                if (process.env.NODE_ENV !== 'production') {
                  console.error('[InboxScreen] Error fetching user role:', error);
                }
              }
            }
            
            console.log('[InboxScreen] Processing conversation:', {
              id: c.id,
              type: conversationType,
              participants: c.participants,
              participantNames: c.participantNames,
              currentUserId: user.id
            });

            return {
              id: c.id,
              type: conversationType,
              participants: c.participants.map(pId => ({
                id: pId,
                name: c.participantNames[pId] || 'Unknown',
                avatarUrl: c.participantAvatars?.[pId] || ''
              })),
              lastMessage: {
                senderId: '',
                text: c.lastMessageText || 'No messages yet',
                timestamp: c.lastMessageAt || new Date().toISOString()
              },
              unreadCount: c.unreadCounts[user.id] || 0,
              name: c.participantNames[otherUserId] || 'Unknown User'
            };
          }));
          setFirestoreConversations(conversationsForUI);
        },
        (error) => {
          console.error('[InboxScreen] Conversation subscription error:', error);
        }
      );

      return () => {
        console.log('[InboxScreen] Unsubscribing from Firestore conversations');
        unsubscribe();
      };
    });
  }, [user?.id]);

  // Automatically switch tab or open chat if initialConversationId is present
  useEffect(() => {
      if (initialConversationId) {
          const target = conversations.find(c => c.id === initialConversationId);
          if (target) {
              setSelectedChatId(target.id); // Open specific chat directly
              if (target.type === 'AMBASSADOR_DM') {
                  setActiveTab('AMBASSADORS');
              } else {
                  setActiveTab('PARTNERS');
              }
          }
      }
      // Don't reset selectedChatId when initialConversationId is undefined
      // because user might have manually clicked a conversation
  }, [initialConversationId, conversations]);

  const handleCloseChat = () => {
      setSelectedChatId(null);
      // Clear the parent's initialConversationId to prevent re-opening
      if (onClearConversation) {
        onClearConversation();
      }
  };

  const handleCleanupDuplicates = async () => {
    if (!window.confirm(t('inbox.confirm.cleanDuplicates', { defaultValue: 'This will remove duplicate conversations. Continue?' }))) {
      return;
    }

    setIsCleaningDuplicates(true);
    try {
      const { cleanupDuplicateConversations } = await import('../services/conversationService');
      const result = await cleanupDuplicateConversations(user.id);
      alert(t('inbox.alerts.cleanupComplete', { removed: result.removed, kept: result.kept, defaultValue: `Cleanup complete! Removed ${result.removed} duplicates, kept ${result.kept} conversations.` }));
    } catch (error) {
      console.error('Error cleaning duplicates:', error);
      alert(t('inbox.alerts.cleanupFailed', { defaultValue: 'Failed to clean up duplicates. Check console for details.' }));
    } finally {
      setIsCleaningDuplicates(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!window.confirm(t('inbox.confirm.delete', { defaultValue: 'Delete this conversation? This cannot be undone.' }))) {
      return;
    }

    try {
      const { deleteConversation } = await import('../services/conversationService');
      await deleteConversation(conversationId);
      console.log('[InboxScreen] Deleted conversation:', conversationId);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert(t('inbox.alerts.deleteFailed', { defaultValue: 'Failed to delete conversation. Check console for details.' }));
    }
  };

  // Filter logic based on segmentation and search
  const filteredConversations = conversations.filter(c => {
      // Filter by tab
      let matchesTab = false;
      if (activeTab === 'PARTNERS') {
          matchesTab = c.type === 'B2B_DM' || c.type === 'BUSINESS_SQUAD_GROUP'; // Business 1-on-1 chats + business squad groups
      } else if (activeTab === 'CREATORS') {
          matchesTab = c.type === 'CREATOR_DM'; // Only creator chats
      } else if (activeTab === 'INDIVIDUALS') {
          matchesTab = c.type === 'INDIVIDUAL_DM' || c.type === 'SQUAD_GROUP'; // Individual chats + customer squad groups
      }
      
      if (!matchesTab) return false;
      
      // Filter by search term
      if (searchTerm.trim()) {
          const search = searchTerm.toLowerCase();
          const nameMatch = c.name?.toLowerCase().includes(search);
          const messageMatch = c.lastMessage?.text?.toLowerCase().includes(search);
          const participantMatch = c.participants?.some((p: any) => 
              p.name?.toLowerCase().includes(search)
          );
          return nameMatch || messageMatch || participantMatch;
      }
      
      return true;
  });

  // Calculate unread counts per tab
  const businessesUnreadCount = conversations
    .filter(c => c.type === 'B2B_DM' || c.type === 'BUSINESS_SQUAD_GROUP')
    .reduce((total, c) => total + (c.unreadCount || 0), 0);
  
  const creatorsUnreadCount = conversations
    .filter(c => c.type === 'CREATOR_DM')
    .reduce((total, c) => total + (c.unreadCount || 0), 0);
  
  const individualsUnreadCount = conversations
    .filter(c => c.type === 'INDIVIDUAL_DM' || c.type === 'SQUAD_GROUP')
    .reduce((total, c) => total + (c.unreadCount || 0), 0);

  // Sort: If initialConversationId exists, put it at the top, otherwise sort by time
  const sortedConversations = [...filteredConversations].sort((a, b) => {
      return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime();
  });

  console.log('[InboxScreen] 🎨 Render state:', {
    isOpen,
    selectedChatId,
    shouldShowChat: !!selectedChatId,
    conversationCount: conversations.length
  });

  if (!isOpen) return null;

  // If a specific chat is selected, show ChatScreen
  if (selectedChatId) {
      console.log('[InboxScreen] ✅ Rendering ChatScreen for conversation:', selectedChatId);
      return (
          <ChatScreen 
             key={selectedChatId}
             conversationId={selectedChatId}
             currentUser={user}
             onBack={handleCloseChat}
          />
      );
  }

  return (
    <div className="fixed inset-0 z-[150] bg-[#F8F9FE] flex flex-col animate-in slide-in-from-right duration-300 font-sans text-[#1E0E62]">
        {/* Header */}
        <div className="border-b border-white bg-white/80 backdrop-blur-xl shrink-0">
            <div className="h-20 flex items-center px-4 gap-4">
                <button onClick={onClose} className="p-3 -ml-2 hover:bg-white rounded-full text-[#1E0E62] transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="font-clash font-bold text-2xl text-[#1E0E62] tracking-tight flex-1">{t('messages.title')}</h2>
                {firestoreConversations.length > 0 && (
                  <button 
                    onClick={handleCleanupDuplicates}
                    disabled={isCleaningDuplicates}
                    className="px-3 py-1.5 text-xs font-medium text-[#6C4BFF] hover:bg-[#6C4BFF]/10 rounded-lg transition-colors disabled:opacity-50"
                    title={t('inbox.removeDuplicates', { defaultValue: 'Remove duplicate conversations' })}
                  >
                    {isCleaningDuplicates ? t('inbox.cleaning', { defaultValue: 'Cleaning...' }) : t('inbox.clean', { defaultValue: '🧹 Clean' })}
                  </button>
                )}
                <button 
                  onClick={() => setShowNewMessageModal(true)}
                  className="p-3 bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white rounded-full hover:shadow-lg transition-all active:scale-95"
                >
                  <Plus className="w-6 h-6" />
                </button>
            </div>
            
            {/* Search Bar */}
            <div className="px-4 pb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={t('search.searchByName')}
                      className="w-full pl-10 pr-10 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#6C4BFF] focus:ring-2 focus:ring-[#6C4BFF]/20 transition-all"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* Segmented Control - 3 Tabs */}
        <div className="p-4 bg-white/50 shrink-0">
            <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-white">
                 <button 
                   className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 relative ${activeTab === 'PARTNERS' ? 'bg-[#1E0E62] text-white shadow-md' : 'text-[#8F8FA3] hover:text-[#1E0E62]'}`}
                   onClick={() => setActiveTab('PARTNERS')}
                 >
                    <Briefcase className="w-4 h-4" />
                    <span className="hidden sm:inline">Businesses</span>
                    <span className="sm:hidden">B2B</span>
                    {businessesUnreadCount > 0 && (
                      <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                        activeTab === 'PARTNERS' 
                          ? 'bg-[#00E5FF] text-white' 
                          : 'bg-[#00E5FF] text-white'
                      }`}>
                        {businessesUnreadCount}
                      </span>
                    )}
                 </button>
                 <button 
                   className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 relative ${activeTab === 'CREATORS' ? 'bg-[#1E0E62] text-white shadow-md' : 'text-[#8F8FA3] hover:text-[#1E0E62]'}`}
                   onClick={() => setActiveTab('CREATORS')}
                 >
                    <UserIcon className="w-4 h-4" />
                    Creators
                    {creatorsUnreadCount > 0 && (
                      <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                        activeTab === 'CREATORS' 
                          ? 'bg-[#00E5FF] text-white' 
                          : 'bg-[#00E5FF] text-white'
                      }`}>
                        {creatorsUnreadCount}
                      </span>
                    )}
                 </button>
                 <button 
                   className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 relative ${activeTab === 'INDIVIDUALS' ? 'bg-[#1E0E62] text-white shadow-md' : 'text-[#8F8FA3] hover:text-[#1E0E62]'}`}
                   onClick={() => setActiveTab('INDIVIDUALS')}
                 >
                    <Users className="w-4 h-4" />
                    <span className="hidden sm:inline">Individuals</span>
                    <span className="sm:hidden">Users</span>
                    {individualsUnreadCount > 0 && (
                      <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                        activeTab === 'INDIVIDUALS' 
                          ? 'bg-[#00E5FF] text-white' 
                          : 'bg-[#00E5FF] text-white'
                      }`}>
                        {individualsUnreadCount}
                      </span>
                    )}
                 </button>
            </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-2">
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8F8FA3] group-focus-within:text-[#00E5FF] transition-colors" />
                <input 
                  type="text" 
                  placeholder={t('messages.searchMessages')} 
                  className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl border border-white text-sm font-medium focus:ring-2 focus:ring-[#00E5FF]/20 focus:border-[#00E5FF] outline-none transition-all placeholder:text-[#8F8FA3] shadow-[0_10px_40px_rgba(114,9,183,0.05)] text-[#1E0E62]"
                />
            </div>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {sortedConversations.length > 0 ? (
                <>
                    {/* Group Chats Section (only on Individuals tab) */}
                    {activeTab === 'INDIVIDUALS' && sortedConversations.some(c => c.type === 'SQUAD_GROUP') && (
                        <div className="mb-4">
                            <div className="flex items-center gap-2 px-2 mb-2">
                                <Users className="w-4 h-4 text-purple-600" />
                                <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider">
                                    {t('inbox.sections.groups', { defaultValue: 'Group Chats' })}
                                </h3>
                                <div className="flex-1 h-px bg-gradient-to-r from-purple-200 to-transparent"></div>
                            </div>
                            {sortedConversations
                                .filter(c => c.type === 'SQUAD_GROUP')
                                .map(c => (
                                    <InboxItem 
                                        key={c.id} 
                                        conversation={c} 
                                        currentUser={user} 
                                        onClick={() => {
                                          console.log('[InboxScreen] 🖱️ Conversation clicked:', c.id, c.name);
                                          setSelectedChatId(c.id);
                                          console.log('[InboxScreen] 📝 selectedChatId state updated to:', c.id);
                                        }}
                                        onDelete={handleDeleteConversation}
                                    />
                                ))}
                        </div>
                    )}
                    
                    {/* Direct Messages Section */}
                    {activeTab === 'AMBASSADORS' && sortedConversations.some(c => c.type === 'AMBASSADOR_DM') && (
                        <div className="mb-4">
                            <div className="flex items-center gap-2 px-2 mb-2">
                                <UserIcon className="w-4 h-4 text-gray-600" />
                                <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                                    {t('inbox.sections.direct', { defaultValue: 'Direct Messages' })}
                                </h3>
                                <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
                            </div>
                            {sortedConversations
                                .filter(c => c.type === 'AMBASSADOR_DM')
                                .map(c => (
                                    <InboxItem 
                                        key={c.id} 
                                        conversation={c} 
                                        currentUser={user} 
                                        onClick={() => {
                                          console.log('[InboxScreen] 🖱️ Conversation clicked:', c.id, c.name);
                                          setSelectedChatId(c.id);
                                          console.log('[InboxScreen] 📝 selectedChatId state updated to:', c.id);
                                        }}
                                        onDelete={handleDeleteConversation}
                                    />
                                ))}
                        </div>
                    )}
                    
                    {/* Business Messages (no section header needed since it's the only type) */}
                    {activeTab === 'PARTNERS' && sortedConversations.map(c => (
                        <InboxItem 
                            key={c.id} 
                            conversation={c} 
                            currentUser={user} 
                            onClick={() => {
                              console.log('[InboxScreen] 🖱️ Conversation clicked:', c.id, c.name);
                              setSelectedChatId(c.id);
                              console.log('[InboxScreen] 📝 selectedChatId state updated to:', c.id);
                            }}
                            onDelete={handleDeleteConversation}
                        />
                    ))}
                </>
            ) : (
                <div className="text-center py-20">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-[#8F8FA3] shadow-sm">
                        <MessageSquare className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="text-[#8F8FA3] font-medium mb-4">{t('inbox.empty.noConversations', { defaultValue: 'No conversations yet.' })}</p>
                    <Button 
                      onClick={() => setShowNewMessageModal(true)}
                      variant="primary"
                      className="mx-auto"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t('inbox.actions.startConversation', { defaultValue: 'Start a Conversation' })}
                    </Button>
                </div>
            )}
        </div>

        {/* New Message Modal */}
        {showNewMessageModal && (
          <NewMessageModal 
            isOpen={showNewMessageModal} 
            onClose={() => setShowNewMessageModal(false)}
            currentUser={user}
            firestoreConversations={firestoreConversations}
            onConversationCreated={(convId) => {
              console.log('[InboxScreen] Conversation created callback received:', convId);
              console.log('[InboxScreen] Closing modal and opening chat');
              setShowNewMessageModal(false);
              setSelectedChatId(convId);
            }}
          />
        )}
    </div>
  );
};

const InboxItem: React.FC<{ conversation: Conversation, currentUser: User, onClick: () => void, onDelete?: (id: string) => void }> = ({ conversation, currentUser, onClick, onDelete }) => {
    const [showDelete, setShowDelete] = useState(false);
  const { t } = useTranslation();
    let avatarDisplay;
    let titleDisplay;

    if (conversation.type === 'SQUAD_GROUP') {
        titleDisplay = conversation.name || t('inbox.squadChat', { defaultValue: 'Squad Chat' });
        avatarDisplay = (
            <div className="w-14 h-14 bg-gradient-to-br from-[#FFB86C] to-[#00E5FF] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#00E5FF]/20">
                <Users className="w-7 h-7" />
            </div>
        );
    } else {
        const other = conversation.participants.find(p => p.id !== currentUser.id) || conversation.participants[0];
        titleDisplay = conversation.name || other?.name || t('inbox.unknownUser', { defaultValue: 'Unknown User' });
        const avatarUrl = other?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(titleDisplay)}&background=F72585&color=fff`;
        avatarDisplay = (
            <div className="relative">
                <img 
                    src={avatarUrl} 
                    className="w-14 h-14 rounded-2xl object-cover shadow-sm border border-white" 
                    alt={titleDisplay}
                    onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(titleDisplay)}&background=F72585&color=fff`;
                    }}
                />
                {conversation.unreadCount > 0 && <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#00E5FF] rounded-full border-2 border-white"></div>}
            </div>
        );
    }

    const highlightClass = conversation.type === 'SQUAD_GROUP'
        ? 'bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border-2 border-purple-200/50 shadow-sm hover:shadow-md'
        : 'bg-white/80 border-transparent hover:border-white shadow-[0_4px_20px_rgba(114,9,183,0.02)]';

    return (
        <div className="relative group">
            <button 
                onClick={onClick}
                onContextMenu={(e) => {
                    e.preventDefault();
                    setShowDelete(!showDelete);
                }}
                className={`w-full flex items-center gap-4 p-4 backdrop-blur-sm rounded-3xl hover:bg-white transition-all active:scale-[0.98] text-left border cursor-pointer ${highlightClass}`}
            >
                {avatarDisplay}
                
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-[#1E0E62] text-base truncate">{titleDisplay}</h4>
                        <span className="text-[11px] text-[#8F8FA3] font-bold whitespace-nowrap">
                            {formatDistanceToNow(new Date(conversation.lastMessage.timestamp))}
                        </span>
                    </div>

                    {/* Context Tag */}
                    {conversation.contextTag && (
                        <div className="text-[10px] font-extrabold text-[#6C4BFF] bg-[#6C4BFF]/5 px-2 py-0.5 rounded-full inline-block mb-1.5 tracking-wide uppercase">
                            {conversation.contextTag}
                        </div>
                    )}

                    <p className={`text-sm truncate ${conversation.unreadCount > 0 ? 'font-bold text-[#1E0E62]' : 'text-[#8F8FA3] font-medium'}`}>
                      {conversation.lastMessage.senderId === currentUser.id && <span className="text-[#8F8FA3] font-normal">{t('leaderboard.you')}: </span>}
                      {conversation.lastMessage.text || t('inbox.noMessagesYet', { defaultValue: 'No messages yet' })}
                    </p>
                </div>

                {conversation.unreadCount > 0 && (
                    <div className="w-6 h-6 bg-[#00E5FF] text-white text-xs font-bold rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-[#00E5FF]/30">
                        {conversation.unreadCount}
                    </div>
                )}
            </button>
            
            {/* Delete button - shows on hover or when toggled */}
            {onDelete && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(conversation.id);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 active:scale-95"
                    title={t('inbox.actions.deleteConversation', { defaultValue: 'Delete conversation' })}
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onConversationCreated: (conversationId: string) => void;
  firestoreConversations: any[];
}

const NewMessageModal: React.FC<NewMessageModalProps> = ({ isOpen, onClose, currentUser, onConversationCreated, firestoreConversations }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [groupName, setGroupName] = useState('');
  const { t } = useTranslation();

  // Debounced search
  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const { searchUsers } = await import('../services/userService');
        const results = await searchUsers(searchTerm, currentUser.id);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, currentUser.id]);

  const handleCreateConversation = async (selectedUser: any) => {
    if (isGroupMode) {
      // Add user to selected list for group
      if (!selectedUsers.find(u => u.id === selectedUser.id)) {
        setSelectedUsers([...selectedUsers, selectedUser]);
      }
      return;
    }
    
    // Direct message flow
    console.log('[NewMessageModal] Starting conversation creation with user:', selectedUser);
    setCreating(true);
    try {
      // Check if conversation already exists in Firestore (not mock store)
      console.log('[NewMessageModal] Checking existing conversations:', firestoreConversations.length);
      const existingConv = firestoreConversations.find(c => 
        c.participants.some((p: any) => p.id === selectedUser.id)
      );

      if (existingConv) {
        // Conversation already exists, just open it
        console.log('[NewMessageModal] Found existing conversation:', existingConv.id);
        onConversationCreated(existingConv.id);
        setCreating(false);
        return;
      }
      
      console.log('[NewMessageModal] No existing conversation found, creating new one');

      // Create new conversation in Firestore
      const { createConversation } = await import('../services/conversationService');
      
      const participantNames: Record<string, string> = {
        [currentUser.id]: currentUser.name,
        [selectedUser.id]: selectedUser.name
      };

      const participantAvatars: Record<string, string> = {
        [currentUser.id]: currentUser.avatarUrl || '',
        [selectedUser.id]: selectedUser.photoUrl || ''
      };

      const participantRoles: Record<string, string> = {
        [currentUser.id]: currentUser.role,
        [selectedUser.id]: selectedUser.role
      };

      console.log('[NewMessageModal] Creating conversation with participants:', [currentUser.id, selectedUser.id]);
      console.log('[NewMessageModal] Participant names:', participantNames);
      console.log('[NewMessageModal] Participant avatars:', participantAvatars);
      console.log('[NewMessageModal] Participant roles:', participantRoles);
      
      const conversationId = await createConversation(
        [currentUser.id, selectedUser.id],
        participantNames,
        participantAvatars,
        participantRoles
      );

      console.log('[NewMessageModal] ✅ Successfully created conversation:', conversationId);
      
      // Wait a brief moment for Firestore to propagate, then open conversation
      console.log('[NewMessageModal] Waiting 300ms for Firestore sync before opening...');
      setTimeout(() => {
        console.log('[NewMessageModal] Opening conversation:', conversationId);
        onConversationCreated(conversationId);
        setCreating(false);
      }, 300);

    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Failed to create conversation. Please try again.');
      setCreating(false);
    }
  };

  const handleCreateGroupChat = async () => {
    if (selectedUsers.length < 2) {
      alert(t('inbox.modal.selectAtLeastTwo', { defaultValue: 'Please select at least 2 members for a group' }));
      return;
    }
    if (!groupName.trim()) {
      alert(t('inbox.modal.enterGroupName', { defaultValue: 'Please enter a group name' }));
      return;
    }

    setCreating(true);
    try {
      const { createConversation } = await import('../services/conversationService');
      
      const allParticipants = [currentUser, ...selectedUsers];
      const participantIds = allParticipants.map(u => u.id);
      
      const participantNames: Record<string, string> = {};
      const participantAvatars: Record<string, string> = {};
      const participantRoles: Record<string, string> = {};
      
      allParticipants.forEach(u => {
        participantNames[u.id] = u.name;
        participantAvatars[u.id] = u.photoUrl || u.avatarUrl || '';
        participantRoles[u.id] = u.role;
      });

      const conversationId = await createConversation(
        participantIds,
        participantNames,
        participantAvatars,
        participantRoles,
        groupName
      );

      // Send initial system message
      const { sendMessage } = await import('../services/conversationService');
      await sendMessage(
        conversationId,
        currentUser.id,
        `${currentUser.name} created the group "${groupName}"`,
        currentUser.name
      );

      setTimeout(() => {
        onConversationCreated(conversationId);
        setCreating(false);
      }, 300);

    } catch (error) {
      console.error('Error creating group chat:', error);
      alert('Failed to create group chat. Please try again.');
      setCreating(false);
    }
  };

  const removeUserFromGroup = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[160] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-clash font-bold text-xl text-[#1E0E62]">
              {isGroupMode ? t('inbox.modal.newGroup', { defaultValue: 'New Group' }) : t('inbox.modal.newMessage', { defaultValue: 'New Message' })}
            </h3>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => { setIsGroupMode(false); setSelectedUsers([]); setGroupName(''); }}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all ${
                !isGroupMode 
                  ? 'bg-[#00E5FF] text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <UserIcon className="w-4 h-4 inline mr-2" />
              {t('inbox.modal.directMessage', { defaultValue: 'Direct Message' })}
            </button>
            <button
              onClick={() => setIsGroupMode(true)}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all ${
                isGroupMode 
                  ? 'bg-[#00E5FF] text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              {t('inbox.modal.groupChat', { defaultValue: 'Group Chat' })}
            </button>
          </div>
        </div>

        {/* Group Name Input (only in group mode) */}
        {isGroupMode && (
          <div className="p-4 border-b border-gray-100">
            <input
              type="text"
              placeholder={t('inbox.modal.groupNamePlaceholder', { defaultValue: 'Group name...' })}
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-4 py-3 bg-[#F8F9FE] rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#00E5FF]/20 outline-none placeholder:text-[#8F8FA3] text-[#1E0E62]"
            />
          </div>
        )}

        {/* Selected Users (only in group mode) */}
        {isGroupMode && selectedUsers.length > 0 && (
          <div className="p-4 border-b border-gray-100">
            <div className="text-xs font-bold text-[#8F8FA3] mb-2">
              {t('inbox.modal.members', { count: selectedUsers.length, defaultValue: `MEMBERS (${selectedUsers.length})` })}
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map(user => (
                <div key={user.id} className="flex items-center gap-2 bg-[#F8F9FE] rounded-full pl-1 pr-3 py-1">
                  <img 
                    src={user.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=F72585&color=fff`}
                    className="w-6 h-6 rounded-full"
                    alt={user.name}
                  />
                  <span className="text-xs font-medium text-[#1E0E62]">{user.name}</span>
                  <button
                    onClick={() => removeUserFromGroup(user.id)}
                    className="ml-1 p-0.5 hover:bg-red-100 rounded-full transition-colors"
                  >
                    <X className="w-3 h-3 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Input */}
        <div className="p-6 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8F8FA3]" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#F8F9FE] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#00E5FF]/20 focus:border-[#00E5FF] outline-none transition-all placeholder:text-[#8F8FA3] text-[#1E0E62]"
              autoFocus
            />
          </div>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {searching ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-[#00E5FF]" />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleCreateConversation(user)}
                  disabled={creating}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <img 
                    src={user.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=F72585&color=fff`} 
                    className="w-12 h-12 rounded-xl object-cover"
                    alt={user.name}
                  />
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-bold text-[#1E0E62] truncate">{user.name}</div>
                    <div className="text-xs text-[#8F8FA3] truncate">{user.email}</div>
                    {user.city && (
                      <div className="text-xs text-[#8F8FA3] mt-0.5">{user.city}</div>
                    )}
                  </div>
                  {user.role === 'BUSINESS' && (
                    <div className="px-2 py-1 bg-purple-100 text-purple-600 text-xs font-bold rounded-lg">
                      {t('business.title')}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : searchTerm.trim().length >= 2 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-[#8F8FA3]">
                <Search className="w-8 h-8 opacity-50" />
              </div>
              <p className="text-[#8F8FA3] font-medium">{t('search.noResults')}</p>
              <p className="text-xs text-[#8F8FA3] mt-1">{t('search.tryDifferent')}</p>
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-gradient-to-br from-[#00E5FF] to-[#6C4BFF] rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                <UserIcon className="w-8 h-8" />
              </div>
              <p className="text-[#8F8FA3] font-medium">{t('inbox.modal.searchUsers', { defaultValue: 'Search for users' })}</p>
              <p className="text-xs text-[#8F8FA3] mt-1">{t('inbox.modal.typeToStart', { defaultValue: 'Type a name or email to get started' })}</p>
            </div>
          )}
        </div>

        {/* Create Group Button (only in group mode) */}
        {isGroupMode && selectedUsers.length >= 2 && (
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleCreateGroupChat}
              disabled={creating || !groupName.trim()}
              className="w-full py-3 bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('inbox.modal.creatingGroup', { defaultValue: 'Creating Group...' })}
                </div>
              ) : (
                t('inbox.modal.createGroupWithMembers', { count: selectedUsers.length + 1, defaultValue: `Create Group (${selectedUsers.length + 1} members)` })
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
