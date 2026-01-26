import { db } from './apiService';
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from '../services/firestoreCompat';
import { Squad } from '../types';

/**
 * Squad Service - Firestore integration for Business Squads
 * Monthly collaboration groups for businesses in the same city
 */

/**
 * Normalize city name for consistent matching
 * Handles variations like München/Munich, removes accents, standardizes format
 */
function normalizeCity(city: string): string {
  if (!city) return '';
  
  return city
    .toLowerCase()
    .trim()
    // Remove diacritics/accents
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    // Common city name mappings
    .replace(/munchen/g, 'munich')
    .replace(/muenchen/g, 'munich');
}

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
      selectedActivity: data.selectedActivity,
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

/**
 * Find or create a squad for a business based on their city
 * Automatically matches businesses to existing squads with space in their city
 * or creates a new squad if no matches exist
 */
export const findOrCreateBusinessSquad = async (userId: string): Promise<Squad | undefined> => {
  try {
    console.log('[BusinessSquad] 🔍 Starting squad search for business:', userId);
    
    // Get current user/business
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      console.error('[BusinessSquad] ❌ Business not found:', userId);
      return undefined;
    }

    const currentUser = userDoc.data();
    const userCity = currentUser.currentCity || currentUser.city || currentUser.geo?.city;
    const normalizedCity = normalizeCity(userCity || '');
    
    console.log('[BusinessSquad] 👤 Business details:', {
      name: currentUser.name,
      city: userCity,
      normalizedCity: normalizedCity
    });

    if (!normalizedCity) {
      console.error('[BusinessSquad] ❌ Business has no city:', userId);
      return undefined;
    }

    // Check if business is already in a squad FOR CURRENT MONTH
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    console.log('[BusinessSquad] 🔎 Checking for existing squad in current month:', currentMonth);
    const existingSquadQuery = query(
      collection(db, 'squads'),
      where('members', 'array-contains', userId),
      where('month', '==', currentMonth)
    );
    const existingSquadSnapshot = await getDocs(existingSquadQuery);

    if (!existingSquadSnapshot.empty) {
      const squadDoc = existingSquadSnapshot.docs[0];
      const existingSquad = squadDoc.data();
      console.log('[BusinessSquad] ✅ Found existing squad for current month:', {
        squadId: squadDoc.id,
        city: existingSquad.city,
        month: existingSquad.month,
        members: existingSquad.members,
        memberCount: existingSquad.members.length
      });
      
      // Check if this is a single-member squad that could be consolidated
      if (existingSquad.members.length === 1) {
        console.log('[BusinessSquad] 🔍 Single-member squad detected, checking for consolidation opportunities...');
        
        // Look for other squads in the same city with space
        const citySquadsQuery = query(
          collection(db, 'squads'),
          where('normalizedCity', '==', normalizedCity)
        );
        const citySquadsSnapshot = await getDocs(citySquadsQuery);
        
        // Find squads with space, excluding current squad
        const availableSquads = citySquadsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(squad => squad.id !== squadDoc.id && squad.members.length < 4);
        
        console.log('[BusinessSquad] 📊 Found', availableSquads.length, 'other squads in city with space');
        
        if (availableSquads.length > 0) {
          const targetSquad = availableSquads[0];
          console.log('[BusinessSquad] 🔄 Consolidating: Moving business from solo squad to existing squad:', targetSquad.id);
          
          // Remove from old squad
          await updateDoc(doc(db, 'squads', squadDoc.id), {
            members: arrayRemove(userId)
          });
          
          // Add to new squad
          await updateDoc(doc(db, 'squads', targetSquad.id), {
            members: arrayUnion(userId)
          });
          
          // Get updated squad data
          const updatedSquadDoc = await getDoc(doc(db, 'squads', targetSquad.id));
          const updatedSquadData = updatedSquadDoc.data();
          
          console.log('[BusinessSquad] ✅ Successfully consolidated into squad:', {
            squadId: targetSquad.id,
            memberCount: updatedSquadData?.members?.length,
            members: updatedSquadData?.members
          });
          
          return {
            id: updatedSquadDoc.id,
            month: updatedSquadData?.month || new Date().toLocaleString('default', { month: 'long' }),
            members: updatedSquadData?.members || [],
            chatId: updatedSquadData?.chatId || null,
            events: updatedSquadData?.events || [],
            schedule: updatedSquadData?.schedule
          };
        }
      }
      
      return {
        id: squadDoc.id,
        month: existingSquad.month || new Date().toLocaleString('default', { month: 'long' }),
        members: existingSquad.members || [],
        chatId: existingSquad.chatId || null,
        events: existingSquad.events || [],
        schedule: existingSquad.schedule
      };
    }

    console.log('[BusinessSquad] ℹ️ Business not in any squad for current month');

    // Look for squads in the same city with space (< 4 members) FOR CURRENT MONTH
    console.log('[BusinessSquad] 🔎 Searching for squads in', userCity, '(normalized:', normalizedCity + ') for month:', currentMonth);
    const citySquadsQuery = query(
      collection(db, 'squads'),
      where('normalizedCity', '==', normalizedCity),
      where('month', '==', currentMonth)
    );
    const citySquadsSnapshot = await getDocs(citySquadsQuery);
    console.log('[BusinessSquad] 📊 Found', citySquadsSnapshot.docs.length, 'squads in city');

    // Filter squads with space (< 4 members)
    const availableSquads = citySquadsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(squad => squad.members.length < 4 && !squad.members.includes(userId));
    
    console.log('[BusinessSquad] 📊 Available squads with space:', availableSquads.map(s => ({
      id: s.id,
      members: s.members.length,
      memberIds: s.members
    })));

    // If there's an available squad, join it
    if (availableSquads.length > 0) {
      const targetSquad = availableSquads[0];
      console.log('[BusinessSquad] ➕ Adding business to squad:', targetSquad.id);
      
      // Use a transaction-like approach: first check again if user isn't already added
      const freshSquadDoc = await getDoc(doc(db, 'squads', targetSquad.id));
      const freshSquadData = freshSquadDoc.data();
      
      if (freshSquadData && !freshSquadData.members.includes(userId)) {
        await updateDoc(doc(db, 'squads', targetSquad.id), {
          members: arrayUnion(userId)
        });
        
        // Return updated squad
        const updatedSquadDoc = await getDoc(doc(db, 'squads', targetSquad.id));
        const updatedSquadData = updatedSquadDoc.data();
        
        console.log('[BusinessSquad] ✅ Successfully joined squad:', {
          squadId: targetSquad.id,
          memberCount: updatedSquadData?.members?.length,
          members: updatedSquadData?.members
        });
        
        return {
          id: updatedSquadDoc.id,
          month: updatedSquadData?.month || new Date().toLocaleString('default', { month: 'long' }),
          members: updatedSquadData?.members || [],
          chatId: updatedSquadData?.chatId || null,
          events: updatedSquadData?.events || [],
          schedule: updatedSquadData?.schedule
        };
      }
    }

    // Double-check one more time for squads before creating
    console.log('[BusinessSquad] 🔄 Double-checking for available squads before creating new one...');
    const recheckSquadsSnapshot = await getDocs(citySquadsQuery);
    const recheckAvailableSquads = recheckSquadsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(squad => squad.members.length < 4 && !squad.members.includes(userId));
    
    if (recheckAvailableSquads.length > 0) {
      const targetSquad = recheckAvailableSquads[0];
      console.log('[BusinessSquad] ➕ Found squad in recheck, joining:', targetSquad.id);
      
      await updateDoc(doc(db, 'squads', targetSquad.id), {
        members: arrayUnion(userId)
      });
      
      const updatedSquadDoc = await getDoc(doc(db, 'squads', targetSquad.id));
      const updatedSquadData = updatedSquadDoc.data();
      
      return {
        id: updatedSquadDoc.id,
        month: updatedSquadData?.month || new Date().toLocaleString('default', { month: 'long' }),
        members: updatedSquadData?.members || [],
        chatId: updatedSquadData?.chatId || null,
        events: updatedSquadData?.events || [],
        schedule: updatedSquadData?.schedule
      };
    }

    // No available squad found, create a new one
    console.log('[BusinessSquad] 🆕 No available squads, creating new squad...');
    
    const currentYear = new Date().getFullYear();
    
    const newSquad = {
      city: userCity,
      normalizedCity: normalizedCity,
      members: [userId],
      month: currentMonth,
      createdAt: new Date().toISOString(),
      chatId: null,
      events: [],
      schedule: {
        nextMatch: getNextMatchDate(),
        cycleEnd: getCycleEndDate()
      }
    };

    const squadRef = doc(collection(db, 'squads'));
    await setDoc(squadRef, newSquad);
    
    console.log('[BusinessSquad] ✅ Created new squad:', {
      squadId: squadRef.id,
      city: newSquad.city,
      month: newSquad.month,
      leader: userId
    });

    return {
      id: squadRef.id,
      month: newSquad.month,
      members: newSquad.members,
      chatId: null,
      events: [],
      schedule: newSquad.schedule
    };
  } catch (error) {
    console.error('[BusinessSquad] ❌ Error finding/creating squad:', error);
    return undefined;
  }
};

/**
 * Helper function to get next match date (5th of next month)
 */
function getNextMatchDate(): string {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  let nextMatchDate = new Date(currentYear, currentMonth, 5);
  if (currentDay >= 5) {
    nextMatchDate = new Date(currentYear, currentMonth + 1, 5);
  }
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[nextMatchDate.getMonth()]} ${nextMatchDate.getDate()}`;
}

/**
 * Helper function to get cycle end date (last day of current month)
 */
function getCycleEndDate(): string {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const cycleEndDate = new Date(currentYear, currentMonth + 1, 0);
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[cycleEndDate.getMonth()]} ${cycleEndDate.getDate()}`;
}
