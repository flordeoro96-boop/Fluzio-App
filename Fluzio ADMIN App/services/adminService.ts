import { db } from './AuthContext';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';

/**
 * Admin Service - Fluzio Administration Operations
 */

// Create Event
export const createAdminEvent = async (eventData: {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  maxAttendees?: number;
  category?: string;
}) => {
  try {
    const eventsRef = collection(db, 'premium_events');
    
    // Combine date and time into a timestamp
    const startDateTime = new Date(`${eventData.date}T${eventData.time}`);
    
    const docRef = await addDoc(eventsRef, {
      title: eventData.title,
      description: eventData.description,
      location: eventData.location,
      dates: {
        start: Timestamp.fromDate(startDateTime),
        end: Timestamp.fromDate(new Date(startDateTime.getTime() + 4 * 60 * 60 * 1000)) // +4 hours
      },
      maxAttendees: eventData.maxAttendees ? Number(eventData.maxAttendees) : null,
      currentAttendees: 0,
      category: eventData.category || 'NETWORKING',
      status: 'REGISTRATION_OPEN',
      organizerId: 'ADMIN',
      organizerName: 'Fluzio',
      imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      price: 0,
      isPremium: true,
      attendees: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    console.log('[AdminService] Event created:', docRef.id);
    return { success: true, eventId: docRef.id };
  } catch (error) {
    console.error('[AdminService] Error creating event:', error);
    return { success: false, error };
  }
};

// Get All Events
export const getAllEvents = async () => {
  try {
    const eventsRef = collection(db, 'premium_events');
    const q = query(eventsRef, orderBy('dates.start', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('[AdminService] Error fetching events:', error);
    return [];
  }
};

// Update Event
export const updateAdminEvent = async (eventId: string, updates: any) => {
  try {
    const eventRef = doc(db, 'premium_events', eventId);
    await updateDoc(eventRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
    
    console.log('[AdminService] Event updated:', eventId);
    return { success: true };
  } catch (error) {
    console.error('[AdminService] Error updating event:', error);
    return { success: false, error };
  }
};

// Delete Event
export const deleteAdminEvent = async (eventId: string) => {
  try {
    const eventRef = doc(db, 'premium_events', eventId);
    await deleteDoc(eventRef);
    
    console.log('[AdminService] Event deleted:', eventId);
    return { success: true };
  } catch (error) {
    console.error('[AdminService] Error deleting event:', error);
    return { success: false, error };
  }
};

// Get Platform Statistics
export const getAdminStats = async () => {
  try {
    const [usersSnapshot, businessesSnapshot, missionsSnapshot, rewardsSnapshot] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(query(collection(db, 'users'), where('role', '==', 'BUSINESS'))),
      getDocs(collection(db, 'missions')),
      getDocs(collection(db, 'rewards'))
    ]);

    return {
      totalUsers: usersSnapshot.size,
      totalBusinesses: businessesSnapshot.size,
      totalMissions: missionsSnapshot.size,
      totalRewards: rewardsSnapshot.size,
      activeUsers: usersSnapshot.docs.filter(doc => {
        const lastActive = doc.data().lastActive;
        if (!lastActive) return false;
        const daysSinceActive = (Date.now() - lastActive.toMillis()) / (1000 * 60 * 60 * 24);
        return daysSinceActive <= 30;
      }).length,
      pendingApprovals: missionsSnapshot.docs.filter(doc => 
        doc.data().status === 'PENDING_APPROVAL'
      ).length
    };
  } catch (error) {
    console.error('[AdminService] Error fetching stats:', error);
    return {
      totalUsers: 0,
      totalBusinesses: 0,
      totalMissions: 0,
      totalRewards: 0,
      activeUsers: 0,
      pendingApprovals: 0
    };
  }
};

// Get All Users
export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('[AdminService] Error fetching users:', error);
    return [];
  }
};

// Ban User
export const banUser = async (userId: string, reason?: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      banned: true,
      banReason: reason || 'Violation of terms of service',
      bannedAt: Timestamp.now()
    });
    
    console.log('[AdminService] User banned:', userId);
    return { success: true };
  } catch (error) {
    console.error('[AdminService] Error banning user:', error);
    return { success: false, error };
  }
};

// Unban User
export const unbanUser = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      banned: false,
      banReason: null,
      bannedAt: null
    });
    
    console.log('[AdminService] User unbanned:', userId);
    return { success: true };
  } catch (error) {
    console.error('[AdminService] Error unbanning user:', error);
    return { success: false, error };
  }
};

// Verify Business
export const verifyBusiness = async (businessId: string) => {
  try {
    const businessRef = doc(db, 'users', businessId);
    await updateDoc(businessRef, {
      verified: true,
      verifiedAt: Timestamp.now()
    });
    
    console.log('[AdminService] Business verified:', businessId);
    return { success: true };
  } catch (error) {
    console.error('[AdminService] Error verifying business:', error);
    return { success: false, error };
  }
};

// Get All Missions
export const getAllMissions = async () => {
  try {
    const missionsRef = collection(db, 'missions');
    const q = query(missionsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('[AdminService] Error fetching missions:', error);
    return [];
  }
};

// Approve Mission
export const approveMission = async (missionId: string) => {
  try {
    const missionRef = doc(db, 'missions', missionId);
    await updateDoc(missionRef, {
      status: 'APPROVED',
      approvedAt: Timestamp.now(),
      approvedBy: 'ADMIN'
    });
    
    console.log('[AdminService] Mission approved:', missionId);
    return { success: true };
  } catch (error) {
    console.error('[AdminService] Error approving mission:', error);
    return { success: false, error };
  }
};

// Reject Mission
export const rejectMission = async (missionId: string, reason?: string) => {
  try {
    const missionRef = doc(db, 'missions', missionId);
    await updateDoc(missionRef, {
      status: 'REJECTED',
      rejectedAt: Timestamp.now(),
      rejectedBy: 'ADMIN',
      rejectionReason: reason || 'Does not meet platform guidelines'
    });
    
    console.log('[AdminService] Mission rejected:', missionId);
    return { success: true };
  } catch (error) {
    console.error('[AdminService] Error rejecting mission:', error);
    return { success: false, error };
  }
};
