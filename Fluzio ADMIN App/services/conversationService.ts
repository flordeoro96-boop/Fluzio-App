import { db } from './AuthContext';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, Timestamp, getDocs, limit, getDoc, deleteDoc } from 'firebase/firestore';
import { Conversation, Message, User } from '../types';

/**
 * Conversation Service - Real-time Firestore integration
 * Replaces MockStore conversations and messages with live data
 * 
 * Note: This is a simplified implementation. For full functionality,
 * you'll need to expand the Firestore schema to match the complete Conversation type.
 */

// Simplified conversation type for current implementation
interface SimpleConversation {
  id: string;
  participants: string[];
  lastMessageText: string;
  lastMessageAt: string;
  unreadCounts: Record<string, number>;
  participantNames: Record<string, string>;
  participantAvatars?: Record<string, string>;
  participantRoles?: Record<string, string>;
  type?: string;
  name?: string;
}

// Subscribe to real-time conversations for a user
export const subscribeToConversations = (
  userId: string,
  onUpdate: (conversations: SimpleConversation[]) => void,
  onError?: (error: Error) => void
) => {
  try {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const conversations: SimpleConversation[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            participants: data.participants || [],
            lastMessageText: data.lastMessage || '',
            lastMessageAt: data.lastMessageAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            unreadCounts: data.unreadCounts || {},
            participantNames: data.participantNames || {},
            participantAvatars: data.participantAvatars,
            participantRoles: data.participantRoles || {},
            type: data.type,
            name: data.name
          };
        });
        onUpdate(conversations);
      },
      (error) => {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[ConversationService] Error subscribing to conversations:', error);
        }
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ConversationService] Error setting up conversation subscription:', error);
    }
    if (onError) onError(error as Error);
    return () => {};
  }
};

// Get conversations once (non-realtime)
export const getConversations = async (userId: string): Promise<SimpleConversation[]> => {
  try {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId),
      orderBy('lastMessageAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        participants: data.participants || [],
        lastMessageText: data.lastMessage || '',
        lastMessageAt: data.lastMessageAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        unreadCounts: data.unreadCounts || {},
        participantNames: data.participantNames || {},
        participantAvatars: data.participantAvatars,
        participantRoles: data.participantRoles || {},
        type: data.type,
        name: data.name
      };
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ConversationService] Error fetching conversations:', error);
    }
    return [];
  }
};

// Subscribe to messages in a conversation
export const subscribeToMessages = (
  conversationId: string,
  onUpdate: (messages: Message[]) => void,
  onError?: (error: Error) => void
) => {
  try {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messages: Message[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            conversationId,
            senderId: data.senderId,
            text: data.text,
            type: data.type || 'TEXT',
            timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
            isRead: data.isRead || false,
            activityProposal: data.activityProposal,
            attachment: data.attachment ? {
              url: data.attachment.url,
              fileName: data.attachment.fileName,
              fileType: data.attachment.fileType,
              fileSize: data.attachment.fileSize,
              thumbnailUrl: data.attachment.thumbnailUrl
            } : undefined
          };
        });
        onUpdate(messages);
      },
      (error) => {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[ConversationService] Error subscribing to messages:', error);
        }
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ConversationService] Error setting up messages subscription:', error);
    }
    if (onError) onError(error as Error);
    return () => {};
  }
};

// Send a message
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  text: string,
  senderName?: string,
  attachment?: {
    url: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    thumbnailUrl?: string;
  }
): Promise<string> => {
  try {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    
    const messageData: any = {
      senderId,
      text,
      timestamp: Timestamp.now(),
      isRead: false
    };
    
    // Add attachment if present
    if (attachment) {
      messageData.attachment = attachment;
      // Determine message type based on file type
      if (attachment.fileType.startsWith('image/')) {
        messageData.type = 'IMAGE';
      } else if (attachment.fileType.startsWith('video/')) {
        messageData.type = 'VIDEO';
      } else if (attachment.fileType.startsWith('audio/')) {
        messageData.type = 'AUDIO';
      } else {
        messageData.type = 'FILE';
      }
    }
    
    const docRef = await addDoc(messagesRef, messageData);

    // Update conversation's last message and text
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);
    const conversationData = conversationDoc.data();
    
    if (conversationData) {
      await updateDoc(conversationRef, {
        lastMessage: text,
        lastMessageText: text,
        lastMessageAt: Timestamp.now()
      });

      // Create notifications for all participants except sender
      const { createNotification } = await import('./notificationService');
      const participants = conversationData.participants as string[];
      const participantNames = conversationData.participantNames as Record<string, string>;
      const displayName = senderName || participantNames[senderId] || 'Someone';
      
      // Create notification for each recipient
      for (const participantId of participants) {
        if (participantId !== senderId) {
          await createNotification(participantId, {
            type: 'NEW_MESSAGE',
            title: 'New Message',
            message: `${displayName}: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`,
            actionLink: `/inbox/${conversationId}`
          });
        }
      }

      // Increment unread count for recipients
      const unreadUpdates: Record<string, number> = {};
      for (const participantId of participants) {
        if (participantId !== senderId) {
          const currentUnread = (conversationData.unreadCounts?.[participantId] || 0) as number;
          unreadUpdates[`unreadCounts.${participantId}`] = currentUnread + 1;
        }
      }
      
      if (Object.keys(unreadUpdates).length > 0) {
        await updateDoc(conversationRef, unreadUpdates);
      }
    }

    return docRef.id;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ConversationService] Error sending message:', error);
    }
    throw error;
  }
};

// Mark conversation as read
export const markConversationAsRead = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      [`unreadCounts.${userId}`]: 0
    });
    
    // Also mark all messages in the conversation as read
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, where('isRead', '==', false), where('senderId', '!=', userId));
    const snapshot = await getDocs(q);
    
    // Update all unread messages
    const updatePromises = snapshot.docs.map(msgDoc => 
      updateDoc(msgDoc.ref, { isRead: true })
    );
    await Promise.all(updatePromises);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('[ConversationService] Marked', snapshot.docs.length, 'messages as read');
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ConversationService] Error marking conversation as read:', error);
    }
    // Don't throw - this is a non-critical operation
  }
};

// Get total unread message count for user
export const getUnreadMessageCount = async (userId: string): Promise<number> => {
  try {
    const conversations = await getConversations(userId);
    return conversations.reduce((total, conv) => total + (conv.unreadCounts[userId] || 0), 0);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ConversationService] Error getting unread count:', error);
    }
    return 0;
  }
};

// Create a new conversation
export const createConversation = async (
  participants: string[],
  participantNames: Record<string, string>,
  participantAvatars?: Record<string, string>,
  participantRoles?: Record<string, string>,
  groupName?: string
): Promise<string> => {
  try {
    const conversationsRef = collection(db, 'conversations');
    
    // Initialize unread counts for all participants
    const unreadCounts: Record<string, number> = {};
    participants.forEach(id => {
      unreadCounts[id] = 0;
    });

    const conversationData: any = {
      participants,
      participantNames,
      participantAvatars: participantAvatars || {},
      participantRoles: participantRoles || {},
      lastMessage: '',
      lastMessageAt: Timestamp.now(),
      unreadCounts,
      createdAt: Timestamp.now()
    };

    // If it's a group chat (more than 2 participants), add group-specific fields
    if (participants.length > 2) {
      conversationData.type = 'SQUAD_GROUP';
      conversationData.name = groupName || 'Group Chat';
    }

    const docRef = await addDoc(conversationsRef, conversationData);

    return docRef.id;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ConversationService] Error creating conversation:', error);
    }
    throw error;
  }
};

// Get conversation data by ID
export const getConversationData = async (conversationId: string): Promise<any | null> => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);
    
    if (conversationDoc.exists()) {
      const data = conversationDoc.data();
      return {
        id: conversationDoc.id,
        participants: data.participants || [],
        participantNames: data.participantNames || {},
        participantAvatars: data.participantAvatars || {},
        participantRoles: data.participantRoles || {},
        lastMessageText: data.lastMessage || '',
        lastMessageAt: data.lastMessageAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        unreadCounts: data.unreadCounts || {}
      };
    }
    
    return null;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ConversationService] Error getting conversation data:', error);
    }
    return null;
  }
};

// Clean up duplicate conversations
export const cleanupDuplicateConversations = async (userId: string): Promise<{ removed: number; kept: number }> => {
  try {
    const conversations = await getConversations(userId);
    
    // Group conversations by participant sets
    const conversationGroups = new Map<string, SimpleConversation[]>();
    
    for (const conv of conversations) {
      // Create a sorted key from participants to identify duplicates
      const participantKey = [...conv.participants].sort().join('-');
      
      if (!conversationGroups.has(participantKey)) {
        conversationGroups.set(participantKey, []);
      }
      conversationGroups.get(participantKey)!.push(conv);
    }
    
    let removed = 0;
    let kept = 0;
    
    // For each group with duplicates, keep the most recent one
    for (const [key, group] of conversationGroups) {
      if (group.length > 1) {
        // Sort by lastMessageAt, keep the most recent
        group.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
        
        const toKeep = group[0];
        const toRemove = group.slice(1);
        
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[ConversationService] Found ${group.length} duplicates for ${key}, keeping ${toKeep.id}`);
        }
        
        // Delete the duplicates
        for (const conv of toRemove) {
          await deleteDoc(doc(db, 'conversations', conv.id));
          removed++;
          if (process.env.NODE_ENV !== 'production') {
            console.log(`[ConversationService] Deleted duplicate conversation ${conv.id}`);
          }
        }
        
        kept++;
      } else {
        kept++;
      }
    }
    
    return { removed, kept };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ConversationService] Error cleaning up duplicates:', error);
    }
    throw error;
  }
};

// Delete a conversation
export const deleteConversation = async (conversationId: string): Promise<void> => {
  try {
    // Delete all messages in the conversation first
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const messagesSnapshot = await getDocs(messagesRef);
    
    const deletePromises = messagesSnapshot.docs.map(msgDoc => deleteDoc(msgDoc.ref));
    await Promise.all(deletePromises);
    
    // Then delete the conversation document
    await deleteDoc(doc(db, 'conversations', conversationId));
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('[ConversationService] Deleted conversation:', conversationId);
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ConversationService] Error deleting conversation:', error);
    }
    throw error;
  }
};

// Get or create a project conversation
export const getOrCreateProjectConversation = async (
  projectId: string,
  currentUserId: string,
  projectTitle?: string
): Promise<string> => {
  try {
    // Check if conversation exists for this project
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('type', '==', 'PROJECT'),
      where('projectId', '==', projectId)
    );
    
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      // Return existing conversation
      return snapshot.docs[0].id;
    }
    
    // Create new project conversation
    const newConvData = {
      type: 'PROJECT',
      projectId,
      participants: [currentUserId],
      name: projectTitle || 'Project Discussion',
      lastMessage: '',
      lastMessageAt: Timestamp.now(),
      unreadCounts: {},
      participantNames: {},
      participantAvatars: {},
      participantRoles: {},
      createdAt: Timestamp.now()
    };
    
    const docRef = await addDoc(conversationsRef, newConvData);
    return docRef.id;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ConversationService] Error getting/creating project conversation:', error);
    }
    throw error;
  }
};
