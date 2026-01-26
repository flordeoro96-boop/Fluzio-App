import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  addDoc,
  query, 
  where, 
  orderBy, 
  limit as limitQuery,
  onSnapshot,
  Timestamp,
  updateDoc,
  serverTimestamp 
} from '../services/firestoreCompat';
import { db } from './apiService';

export interface MeetupChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  message: string;
  imageUrl?: string;
  timestamp: string;
  readBy: string[];
}

export interface MeetupChat {
  id: string;
  meetupId: string;
  participants: {
    userId: string;
    userName: string;
    userAvatar?: string;
    joinedAt: string;
  }[];
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: string;
  };
}

/**
 * Creates a group chat for a meetup when it starts
 */
export async function createMeetupChat(
  meetupId: string,
  participants: Array<{ userId: string; userName: string; userAvatar?: string }>
): Promise<{ success: boolean; chatId?: string; error?: string }> {
  try {
    // Check if chat already exists
    const existingChat = await getMeetupChat(meetupId);
    if (existingChat) {
      return { success: true, chatId: existingChat.id };
    }

    // Create new chat
    const chatRef = doc(collection(db, 'meetupChats'));
    const chatId = chatRef.id;

    // Set expiration to 24 hours after meetup ends (assuming 2-hour meetup)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 26);

    const chatData: Omit<MeetupChat, 'id'> = {
      meetupId,
      participants: participants.map(p => ({
        ...p,
        joinedAt: new Date().toISOString()
      })),
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      isActive: true
    };

    await setDoc(chatRef, chatData);

    // Send welcome message
    await sendMeetupMessage(chatId, 'system', 'Welcome to the meetup chat! 🎉', 'System');

    return { success: true, chatId };
  } catch (error) {
    console.error('Error creating meetup chat:', error);
    return { success: false, error: 'Failed to create chat' };
  }
}

/**
 * Gets the chat for a specific meetup
 */
export async function getMeetupChat(meetupId: string): Promise<MeetupChat | null> {
  try {
    const chatsRef = collection(db, 'meetupChats');
    const q = query(chatsRef, where('meetupId', '==', meetupId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as MeetupChat;
  } catch (error) {
    console.error('Error getting meetup chat:', error);
    return null;
  }
}

/**
 * Sends a message to a meetup chat
 */
export async function sendMeetupMessage(
  chatId: string,
  senderId: string,
  message: string,
  senderName: string,
  senderAvatar?: string,
  imageUrl?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const messagesRef = collection(db, 'meetupChats', chatId, 'messages');
    
    const messageData = {
      chatId,
      senderId,
      senderName,
      senderAvatar: senderAvatar || null,
      message,
      imageUrl: imageUrl || null,
      timestamp: Timestamp.now(),
      readBy: [senderId]
    };

    const messageDoc = await addDoc(messagesRef, messageData);

    // Update chat's last message
    const chatRef = doc(db, 'meetupChats', chatId);
    await updateDoc(chatRef, {
      lastMessage: {
        text: message,
        senderId,
        timestamp: new Date().toISOString()
      }
    });

    return { success: true, messageId: messageDoc.id };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error: 'Failed to send message' };
  }
}

/**
 * Gets messages for a chat
 */
export async function getMeetupMessages(
  chatId: string,
  limitCount: number = 50
): Promise<MeetupChatMessage[]> {
  try {
    const messagesRef = collection(db, 'meetupChats', chatId, 'messages');
    const q = query(
      messagesRef,
      orderBy('timestamp', 'desc'),
      limitQuery(limitCount)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
    })) as MeetupChatMessage[];
  } catch (error) {
    console.error('Error getting messages:', error);
    return [];
  }
}

/**
 * Subscribes to real-time chat messages
 */
export function subscribeToChatMessages(
  chatId: string,
  callback: (messages: MeetupChatMessage[]) => void,
  limitCount: number = 50
): () => void {
  const messagesRef = collection(db, 'meetupChats', chatId, 'messages');
  const q = query(
    messagesRef,
    orderBy('timestamp', 'asc'),
    limitQuery(limitCount)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
    })) as MeetupChatMessage[];
    
    callback(messages);
  });

  return unsubscribe;
}

/**
 * Marks messages as read by user
 */
export async function markMessagesAsRead(
  chatId: string,
  userId: string
): Promise<void> {
  try {
    const messagesRef = collection(db, 'meetupChats', chatId, 'messages');
    const q = query(messagesRef, where('readBy', 'not-in', [[userId]]));
    const snapshot = await getDocs(q);

    const updates = snapshot.docs.map(doc => 
      updateDoc(doc.ref, {
        readBy: [...(doc.data().readBy || []), userId]
      })
    );

    await Promise.all(updates);
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
}

/**
 * Gets unread message count for a user
 */
export async function getUnreadCount(
  chatId: string,
  userId: string
): Promise<number> {
  try {
    const messagesRef = collection(db, 'meetupChats', chatId, 'messages');
    const snapshot = await getDocs(messagesRef);
    
    return snapshot.docs.filter(doc => {
      const readBy = doc.data().readBy || [];
      return !readBy.includes(userId);
    }).length;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

/**
 * Deactivates chat after expiration (called by scheduled function)
 */
export async function deactivateMeetupChat(chatId: string): Promise<void> {
  try {
    const chatRef = doc(db, 'meetupChats', chatId);
    await updateDoc(chatRef, {
      isActive: false,
      deactivatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error deactivating chat:', error);
  }
}

/**
 * Adds a participant to an existing chat (if they join late)
 */
export async function addChatParticipant(
  chatId: string,
  participant: { userId: string; userName: string; userAvatar?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const chatRef = doc(db, 'meetupChats', chatId);
    const chatDoc = await getDoc(chatRef);
    
    if (!chatDoc.exists()) {
      return { success: false, error: 'Chat not found' };
    }

    const chatData = chatDoc.data() as MeetupChat;
    const existingParticipant = chatData.participants.find(p => p.userId === participant.userId);
    
    if (existingParticipant) {
      return { success: true }; // Already a participant
    }

    await updateDoc(chatRef, {
      participants: [
        ...chatData.participants,
        {
          ...participant,
          joinedAt: new Date().toISOString()
        }
      ]
    });

    // Send notification message
    await sendMeetupMessage(
      chatId,
      'system',
      `${participant.userName} joined the chat`,
      'System'
    );

    return { success: true };
  } catch (error) {
    console.error('Error adding chat participant:', error);
    return { success: false, error: 'Failed to add participant' };
  }
}
