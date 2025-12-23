import { db } from './AuthContext';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Squad } from '../types';

/**
 * Squad Service - Firestore integration
 * Replaces MockStore squads with real data
 */

// Get squad for a specific user/business
export const getSquadForUser = async (userId: string): Promise<Squad | undefined> => {
  try {
    const squadsRef = collection(db, 'squads');
    const q = query(
      squadsRef,
      where('members', 'array-contains', userId)
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('[SquadService] No squad found for user:', userId);
      return undefined;
    }

    // Return first squad (users typically belong to one squad)
    const squadDoc = snapshot.docs[0];
    const data = squadDoc.data();

    return {
      id: squadDoc.id,
      month: data.month || new Date().toLocaleString('default', { month: 'long' }),
      members: data.members || [],
      chatId: data.chatId || null,
      events: data.events || [],
      schedule: data.schedule
    };
  } catch (error) {
    console.error('[SquadService] Error fetching squad:', error);
    return undefined;
  }
};

// Get all squads (for browsing/matching)
export const getAllSquads = async (): Promise<Squad[]> => {
  try {
    const squadsRef = collection(db, 'squads');
    const snapshot = await getDocs(squadsRef);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        month: data.month || new Date().toLocaleString('default', { month: 'long' }),
        members: data.members || [],
        chatId: data.chatId || null,
        events: data.events || [],
        schedule: data.schedule
      };
    });
  } catch (error) {
    console.error('[SquadService] Error fetching all squads:', error);
    return [];
  }
};

// Get squad by ID
export const getSquadById = async (squadId: string): Promise<Squad | undefined> => {
  try {
    const squadRef = doc(db, 'squads', squadId);
    const squadDoc = await getDoc(squadRef);

    if (!squadDoc.exists()) {
      console.log('[SquadService] Squad not found:', squadId);
      return undefined;
    }

    const data = squadDoc.data();
    return {
      id: squadDoc.id,
      month: data.month || new Date().toLocaleString('default', { month: 'long' }),
      members: data.members || [],
      chatId: data.chatId || null,
      events: data.events || [],
      schedule: data.schedule
    };
  } catch (error) {
    console.error('[SquadService] Error fetching squad by ID:', error);
    return undefined;
  }
};
