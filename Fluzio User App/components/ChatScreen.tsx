
import React, { useState, useEffect, useRef } from 'react';
import { User, Message } from '../types';
import { store } from '../services/mockStore';
import { ActivityProposalCard } from './ActivityProposalCard';
import { ArrowLeft, Send, Paperclip, MoreVertical, CheckCircle2, Check, CheckCheck, AlertCircle, Copy, Trash, Forward, Smile, X } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface ExtendedMessage extends Message {
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  error?: string;
}

interface ChatScreenProps {
  conversationId: string;
  currentUser: User;
  onBack: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ conversationId, currentUser, onBack }) => {
  const { t } = useTranslation();
  console.log('[ChatScreen] 🎬 Component mounted with conversationId:', conversationId);
  console.log('[ChatScreen] Current user:', currentUser?.id, currentUser?.name);
  
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationData, setConversationData] = useState<any>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(true);
  const [failedMessages, setFailedMessages] = useState<Set<string>>(new Set());
  const [activeMessageMenu, setActiveMessageMenu] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Try to get conversation from both mock store and Firestore
  const mockConversation = store.getConversation(conversationId);
  const conversation = conversationData || mockConversation;
  const participants = conversation?.participants || [];
  
  console.log('[ChatScreen] 💾 Conversation state:', {
    hasMockConversation: !!mockConversation,
    hasConversationData: !!conversationData,
    hasConversation: !!conversation,
    participantCount: participants.length
  });
  
  // Filter out current user to show other participants in header
  const otherParticipants = participants.filter((p: any) => p.id !== currentUser.id);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Subscribe to Firestore messages in real-time
  useEffect(() => {
    console.log('[ChatScreen] 🔄 useEffect triggered for conversationId:', conversationId);
    
    if (!conversationId) {
      console.log('[ChatScreen] ❌ No conversationId, exiting useEffect');
      return;
    }

    console.log('[ChatScreen] ✅ Valid conversationId, proceeding with subscription');
    
    // Try loading from mock store first
    const mockMessages = store.getMessages(conversationId);
    console.log('[ChatScreen] Checked mock store, found', mockMessages.length, 'messages');
    
    if (mockMessages.length > 0) {
      setMessages(mockMessages);
      setIsLoadingConversation(false);
      store.markConversationAsRead(conversationId, currentUser.id);
      setTimeout(scrollToBottom, 100);
      return; // Use mock store data if available
    }

    // Otherwise, subscribe to Firestore
    console.log('[ChatScreen] 📡 Loading from Firestore...');
    import('../services/conversationService').then(({ subscribeToMessages, getConversationData, markConversationAsRead }) => {
      console.log('[ChatScreen] ✅ Conversation service loaded, fetching conversation data');
      
      // Get conversation metadata
      getConversationData(conversationId).then(data => {
        console.log('[ChatScreen] 📥 getConversationData response:', data);
        
        if (data) {
          console.log('[ChatScreen] ✅ Conversation data loaded:', {
            id: data.id,
            participants: data.participants,
            participantNames: data.participantNames
          });
          // Convert Firestore format to UI format
          const participants = data.participants.map((pId: string) => ({
            id: pId,
            name: data.participantNames[pId] || 'Unknown',
            avatarUrl: data.participantAvatars?.[pId] || ''
          }));
          
          const conversationObj = {
            id: data.id,
            participants,
            name: data.participantNames[data.participants.find((p: string) => p !== currentUser.id) || ''] || 'Chat'
          };
          
          console.log('[ChatScreen] 🔧 Setting conversation data state:', conversationObj);
          setConversationData(conversationObj);
          setIsLoadingConversation(false);
          
          // Mark conversation as read when opening it
          markConversationAsRead(conversationId, currentUser.id).catch(err => {
            console.error('[ChatScreen] Error marking conversation as read:', err);
          });
        } else {
          console.log('[ChatScreen] ❌ No conversation data returned');
          setIsLoadingConversation(false);
        }
      }).catch(err => {
        console.error('[ChatScreen] ❌ Error fetching conversation data:', err);
        setIsLoadingConversation(false);
      });

      console.log('[ChatScreen] 📡 Setting up message subscription');
      
      const unsubscribe = subscribeToMessages(
        conversationId,
        (newMessages) => {
          console.log('[ChatScreen] 📨 Received messages update:', newMessages.length, 'messages');
          // Convert Firestore messages to UI format with status
          const messagesForUI: ExtendedMessage[] = newMessages.map(m => {
            // Determine status based on isRead and if it's from current user
            let status: 'sent' | 'delivered' | 'read' = 'sent';
            if (m.senderId !== currentUser.id) {
              // Received messages don't need status
              status = 'delivered';
            } else {
              // For sent messages, check if read
              status = m.isRead ? 'read' : 'delivered';
            }
            
            return {
              id: m.id,
              conversationId: m.conversationId,
              senderId: m.senderId,
              text: m.text,
              type: m.type || 'TEXT',
              timestamp: m.timestamp,
              isRead: m.isRead,
              status,
              attachment: m.attachment,
              activityProposal: m.activityProposal
            };
          });
          setMessages(messagesForUI);
          setTimeout(scrollToBottom, 100);
        },
        (error) => {
          console.error('[ChatScreen] Message subscription error:', error);
        }
      );

      return () => {
        console.log('[ChatScreen] Unsubscribing from messages');
        unsubscribe();
      };
    });
  }, [conversationId, currentUser.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (retryMessageId?: string) => {
    console.log('[ChatScreen] 📤 handleSend called, inputText:', inputText);
    
    if (!inputText.trim() && !retryMessageId) {
      console.log('[ChatScreen] ❌ Empty message, ignoring');
      return;
    }

    const messageText = retryMessageId ? messages.find(m => m.id === retryMessageId)?.text || '' : inputText;
    const tempId = retryMessageId || `temp-${Date.now()}`;
    
    console.log('[ChatScreen] Sending message:', messageText);
    
    if (!retryMessageId) {
      setInputText(''); // Clear input immediately for better UX
      
      // Optimistic update - add message immediately
      const optimisticMessage: ExtendedMessage = {
        id: tempId,
        conversationId,
        senderId: currentUser.id,
        text: messageText,
        type: 'TEXT',
        timestamp: new Date().toISOString(),
        isRead: false,
        status: 'sending'
      };
      setMessages(prev => [...prev, optimisticMessage]);
    } else {
      // Update retry message status
      setMessages(prev => prev.map(m => 
        m.id === retryMessageId ? { ...m, status: 'sending' as const, error: undefined } : m
      ));
      setFailedMessages(prev => {
        const next = new Set(prev);
        next.delete(retryMessageId);
        return next;
      });
    }

    try {
      // Check if this is a Firestore conversation
      console.log('[ChatScreen] Checking conversation type - conversationData:', !!conversationData, 'mockConversation:', !!mockConversation);
      
      if (conversationData || !mockConversation) {
        // Send via Firestore
        console.log('[ChatScreen] 📡 Sending via Firestore');
        const { sendMessage } = await import('../services/conversationService');
        console.log('[ChatScreen] Calling sendMessage with:', {
          conversationId,
          senderId: currentUser.id,
          text: messageText,
          senderName: currentUser.name
        });
        
        const messageId = await sendMessage(conversationId, currentUser.id, messageText, currentUser.name);
        
        // Update optimistic message with real ID and sent status
        setMessages(prev => prev.map(m => 
          m.id === tempId ? { ...m, id: messageId, status: 'sent' as const } : m
        ));
        
        console.log('[ChatScreen] ✅ Message sent to Firestore successfully');
      } else {
        // Mock store compatibility - just update the temp message
        console.warn('[ChatScreen] Using mock store (migration to conversationService needed)');
        setMessages(prev => prev.map((m): ExtendedMessage => 
          m.id === tempId ? { ...m, status: 'sent' } : m
        ));
        
        // Mock Reply Interaction
        setIsTyping(true);
        setTimeout(() => {
          const replySender = otherParticipants.length > 0 ? otherParticipants[0] : { id: 'bot', name: 'Bot' };
          const mockReply: ExtendedMessage = {
            id: `msg_${Date.now()}`,
            conversationId,
            senderId: replySender.id,
            text: "That sounds great! Let's make it happen.",
            timestamp: new Date().toISOString(),
            isRead: false,
            status: 'delivered',
            type: 'TEXT'
          };
          setMessages(prev => [...prev, mockReply]);
          setIsTyping(false);
        }, 2000);
      }
    } catch (error) {
      console.error('[ChatScreen] Error sending message:', error);
      
      // Mark message as failed
      setMessages(prev => prev.map(m => 
        m.id === tempId || m.id === retryMessageId ? { 
          ...m, 
          status: 'failed' as const,
          error: error instanceof Error ? error.message : 'Failed to send'
        } : m
      ));
      setFailedMessages(prev => new Set([...prev, retryMessageId || tempId]));
    }
  };

  const getAvatar = (userId: string) => {
      const user = participants.find((p: any) => p.id === userId);
      return user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(getName(userId))}&background=F72585&color=fff`;
  };

  const getName = (userId: string) => {
      const user = participants.find((p: any) => p.id === userId);
      return user?.name || 'Unknown';
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    setActiveMessageMenu(null);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Delete this message?')) return;
    // TODO: Implement message deletion in Firestore
    setMessages(prev => prev.filter(m => m.id !== messageId));
    setActiveMessageMenu(null);
  };

  const handleRetryMessage = (messageId: string) => {
    handleSend(messageId);
  };
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file
    const { validateFile, generateImageThumbnail } = await import('../services/fileUploadService');
    const validation = validateFile(file);
    
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    
    setSelectedFile(file);
    
    // Generate preview for images
    if (file.type.startsWith('image/')) {
      try {
        const preview = await generateImageThumbnail(file);
        setFilePreview(preview);
      } catch (error) {
        console.error('Error generating preview:', error);
      }
    }
  };
  
  const handleCancelFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleSendWithFile = async () => {
    if (!selectedFile) {
      handleSend();
      return;
    }
    
    setUploadingFile(true);
    
    try {
      // Upload file first
      const { uploadMessageFile } = await import('../services/fileUploadService');
      const uploadResult = await uploadMessageFile(
        selectedFile,
        conversationId,
        currentUser.id
      );
      
      const messageText = inputText.trim() || `Sent a ${selectedFile.type.split('/')[0]}`;
      setInputText('');
      setSelectedFile(null);
      setFilePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Send message with attachment
      const tempId = `temp-${Date.now()}`;
      const optimisticMessage: ExtendedMessage = {
        id: tempId,
        conversationId,
        senderId: currentUser.id,
        text: messageText,
        type: uploadResult.fileType.startsWith('image/') ? 'IMAGE' : 'FILE',
        timestamp: new Date().toISOString(),
        isRead: false,
        status: 'sending',
        attachment: uploadResult
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      
      // Send via Firestore
      const { sendMessage } = await import('../services/conversationService');
      const messageId = await sendMessage(
        conversationId,
        currentUser.id,
        messageText,
        currentUser.name,
        uploadResult
      );
      
      setMessages(prev => prev.map(m => 
        m.id === tempId ? { ...m, id: messageId, status: 'sent' as const } : m
      ));
      
    } catch (error) {
      console.error('Error sending file:', error);
      alert('Failed to send file. Please try again.');
    } finally {
      setUploadingFile(false);
    }
  };

  const getReadReceiptIcon = (status?: string) => {
    switch (status) {
      case 'sending':
        return <div className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />;
      case 'sent':
        return <Check className="w-3 h-3" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-400" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return <Check className="w-3 h-3" />;
    }
  };

  // Show loading state if conversation data hasn't loaded yet
  if (isLoadingConversation) {
    return (
      <div className="fixed inset-0 z-[200] bg-[#E0E5EC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#00E5FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#8F8FA3] font-medium">{t('chat.loadingConversation')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-[#E0E5EC] flex flex-col animate-in slide-in-from-right duration-300 font-sans">
        
        {/* --- Header --- */}
        <div className="h-20 bg-white/90 backdrop-blur-md border-b border-white/50 flex items-center px-4 gap-4 shadow-sm z-20">
             <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-[#1E0E62]">
                 <ArrowLeft className="w-6 h-6" />
             </button>
             
             <div className="flex-1 flex flex-col justify-center">
                 <h2 className="font-clash font-bold text-lg text-[#1E0E62] leading-tight line-clamp-1">
                     {conversation.name || otherParticipants[0]?.name || 'Chat'}
                 </h2>
                 
                 {/* Subtitle / Avatars */}
                 <div className="flex items-center gap-2 mt-0.5">
                    {otherParticipants.length === 1 ? (
                        <span className="text-xs text-green-600 font-bold flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Online
                        </span>
                    ) : (
                        <div className="flex items-center">
                             <div className="flex -space-x-2 mr-2">
                                {otherParticipants.slice(0, 3).map(p => (
                                    <img key={p.id} src={p.avatarUrl} className="w-5 h-5 rounded-full border border-white" alt={p.name} />
                                ))}
                             </div>
                             <span className="text-xs text-gray-500 font-medium">{otherParticipants.length} members</span>
                        </div>
                    )}
                 </div>
             </div>

             <button className="p-2 text-gray-400 hover:text-[#1E0E62]">
                 <MoreVertical className="w-5 h-5" />
             </button>
        </div>

        {/* --- Message List --- */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24 bg-gradient-to-b from-[#F0F2F5] to-[#E0E5EC]">
            {messages.map((msg, index) => {
                const isMe = msg.senderId === currentUser.id;
                const isSystem = msg.type === 'SYSTEM';
                const isActivityProposal = msg.type === 'ACTIVITY_PROPOSAL';
                const showAvatar = !isMe && !isSystem && !isActivityProposal && (index === 0 || messages[index-1].senderId !== msg.senderId);

                if (isSystem) {
                    return (
                        <div key={msg.id} className="flex justify-center my-4">
                            <span className="px-3 py-1 bg-gray-200/60 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-wide shadow-sm">
                                {msg.text}
                            </span>
                        </div>
                    );
                }

                // Activity Proposal Card
                if (isActivityProposal && msg.activityProposal) {
                    return (
                        <div key={msg.id} className="my-4">
                            <div className="flex items-center gap-2 mb-2">
                                <img src={getAvatar(msg.senderId)} className="w-6 h-6 rounded-full" alt="Proposer" />
                                <span className="text-xs text-gray-600">
                                    <span className="font-bold">{getName(msg.senderId)}</span> proposed an activity
                                </span>
                                <span className="text-xs text-gray-400">
                                    {format(new Date(msg.timestamp), 'HH:mm')}
                                </span>
                            </div>
                            <ActivityProposalCard
                                proposal={msg.activityProposal}
                                conversationId={conversationId}
                                currentUserId={currentUser.id}
                                participants={participants}
                                onVote={() => {
                                    // Refresh messages to show updated vote count
                                    setMessages(store.getMessages(conversationId));
                                }}
                            />
                        </div>
                    );
                }

                return (
                    <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2 group`}>
                        
                        {!isMe && (
                            <div className="w-8 flex-shrink-0">
                                {showAvatar ? (
                                    <img src={getAvatar(msg.senderId)} className="w-8 h-8 rounded-full border border-white shadow-sm object-cover" alt="Sender" />
                                ) : (
                                    <div className="w-8" />
                                )}
                            </div>
                        )}

                        <div className="relative max-w-[75%] group/message">
                            <div className={`shadow-md text-sm leading-relaxed relative transition-all ${
                                isMe 
                                ? 'bg-[linear-gradient(135deg,#FFB86C_0%,#00E5FF_50%,#6C4BFF_100%)] text-white rounded-2xl rounded-tr-none' 
                                : 'bg-white/90 backdrop-blur-sm text-[#1E0E62] rounded-2xl rounded-tl-none border border-white'
                            } ${msg.status === 'failed' ? 'border-2 border-red-500' : ''} ${msg.attachment ? 'p-0' : 'p-3'}`}>
                                {!isMe && showAvatar && !msg.attachment && (
                                    <div className="text-[10px] font-bold text-[#00E5FF] mb-1 opacity-80">
                                        {getName(msg.senderId)}
                                    </div>
                                )}
                                
                                {/* Image/File Attachment */}
                                {msg.attachment && (
                                    <div className="overflow-hidden">
                                        {msg.type === 'IMAGE' && msg.attachment.url && (
                                            <img 
                                                src={msg.attachment.url} 
                                                alt={msg.attachment.fileName}
                                                className="w-full max-w-xs rounded-t-2xl cursor-pointer hover:opacity-90 transition-opacity"
                                                onClick={() => window.open(msg.attachment?.url, '_blank')}
                                            />
                                        )}
                                        {(msg.type === 'FILE' || msg.type === 'VIDEO' || msg.type === 'AUDIO') && (
                                            <a 
                                                href={msg.attachment.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className={`flex items-center gap-3 p-3 hover:opacity-80 transition-opacity ${
                                                    isMe ? 'text-white' : 'text-[#1E0E62]'
                                                }`}
                                            >
                                                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-xl">
                                                    {msg.type === 'VIDEO' ? '🎥' : msg.type === 'AUDIO' ? '🎵' : '📄'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate text-sm">{msg.attachment.fileName}</p>
                                                    <p className={`text-xs ${isMe ? 'text-white/70' : 'text-gray-500'}`}>
                                                        {(msg.attachment.fileSize / 1024).toFixed(1)} KB
                                                    </p>
                                                </div>
                                            </a>
                                        )}
                                        {msg.text && (
                                            <div className="p-3 pt-2">
                                                {msg.text}
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {/* Regular text message */}
                                {!msg.attachment && msg.text}

                                <div className={`text-[9px] font-bold mt-1 flex items-center justify-end gap-1 ${
                                    isMe ? 'text-white/70' : 'text-gray-400'
                                } ${msg.attachment ? 'px-3 pb-2' : ''}`}>
                                    {format(new Date(msg.timestamp), 'HH:mm')}
                                    {isMe && (
                                        <span className="ml-1">{getReadReceiptIcon(msg.status)}</span>
                                    )}
                                </div>
                            </div>

                            {/* Error retry button */}
                            {msg.status === 'failed' && isMe && (
                                <button
                                    onClick={() => handleRetryMessage(msg.id)}
                                    className="mt-1 text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                                >
                                    <AlertCircle className="w-3 h-3" />
                                    Tap to retry
                                </button>
                            )}

                            {/* Message actions menu */}
                            {!isSystem && !isActivityProposal && (
                                <div className="absolute top-0 right-full mr-2 opacity-0 group-hover/message:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => setActiveMessageMenu(activeMessageMenu === msg.id ? null : msg.id)}
                                        className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50 text-gray-600"
                                    >
                                        <MoreVertical className="w-3.5 h-3.5" />
                                    </button>
                                    
                                    {activeMessageMenu === msg.id && (
                                        <div className="absolute right-0 top-8 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[120px] z-10">
                                            <button
                                                onClick={() => handleCopyMessage(msg.text)}
                                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                                            >
                                                <Copy className="w-3.5 h-3.5" />
                                                Copy
                                            </button>
                                            {isMe && (
                                                <button
                                                    onClick={() => handleDeleteMessage(msg.id)}
                                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                                                >
                                                    <Trash className="w-3.5 h-3.5" />
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
            
            {isTyping && (
                <div className="flex justify-start items-end gap-2 ml-10">
                     <div className="bg-white/80 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm border border-white flex gap-1">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                     </div>
                </div>
            )}
            <div ref={scrollRef} />
        </div>

        {/* --- Input Area --- */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-white/20">
            {/* File Preview */}
            {selectedFile && (
                <div className="px-4 pt-3 pb-2 border-b border-gray-200">
                    <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                        {filePreview ? (
                            <img src={filePreview} alt="Preview" className="w-16 h-16 rounded object-cover" />
                        ) : (
                            <div className="w-16 h-16 rounded bg-gray-200 flex items-center justify-center text-2xl">
                                📎
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                            <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button 
                            onClick={handleCancelFile}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
            
            <div className="p-4">
                <div className="flex items-center gap-2 bg-white rounded-full px-2 py-2 shadow-lg shadow-purple-500/5 border border-gray-100">
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileSelect}
                        accept="image/*,video/*,audio/*,.pdf"
                        className="hidden"
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingFile}
                        className="p-2 text-gray-400 hover:text-[#6C4BFF] hover:bg-purple-50 rounded-full transition-colors disabled:opacity-50"
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>
                    
                    <input 
                        type="text"
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (selectedFile ? handleSendWithFile() : handleSend())}
                        placeholder={uploadingFile ? "Uploading..." : "Type a message..."}
                        disabled={uploadingFile}
                        className="flex-1 bg-transparent outline-none text-[#1E0E62] font-medium placeholder:text-gray-400 px-2 disabled:opacity-50"
                    />
                    
                    <button 
                        onClick={() => selectedFile ? handleSendWithFile() : handleSend()}
                        disabled={(!inputText.trim() && !selectedFile) || uploadingFile}
                        className="w-10 h-10 rounded-full bg-[linear-gradient(135deg,#FFB86C_0%,#00E5FF_50%,#6C4BFF_100%)] flex items-center justify-center text-white shadow-md shadow-purple-500/30 disabled:opacity-50 disabled:shadow-none transition-all active:scale-90"
                    >
                        {uploadingFile ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Send className="w-4 h-4 ml-0.5" />
                        )}
                    </button>
                </div>
            </div>
        </div>

    </div>
  );
};
