import { db } from './AuthContext';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, Timestamp, increment } from 'firebase/firestore';
import { MeetupCategory } from '../types';

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
  categories?: string[];
  isForEveryone?: boolean;
  allowedLevels?: number[];
  requiresAdminApproval?: boolean;
  genderRestriction?: 'mixed' | 'men' | 'women';
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
      category: eventData.category || eventData.categories?.[0] || 'NETWORKING',
      categories: eventData.categories || [],
      status: 'REGISTRATION_OPEN',
      organizerId: 'ADMIN',
      organizerName: 'Fluzio',
      imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      price: 0,
      isPremium: true,
      attendees: [],
      
      // Level restrictions
      isForEveryone: eventData.isForEveryone !== false,
      allowedLevels: eventData.isForEveryone ? [] : (eventData.allowedLevels || []),
      
      // Gender restrictions
      genderRestriction: eventData.genderRestriction || 'mixed',
      
      // Admin approval settings
      requiresAdminApproval: eventData.requiresAdminApproval || false,
      pendingApprovals: [],
      approvedRegistrants: [],
      rejectedRegistrants: [],
      
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

// Create Admin Meetup
export const createAdminMeetup = async (meetupData: {
  title: string;
  description: string;
  category: MeetupCategory;
  startDate: string;
  startTime: string;
  endTime: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  organizerType: 'business' | 'influencer';
  organizerId: string;
  organizerName: string;
  levelRequired: number;
  xpReward: number;
  femaleOnly: boolean;
  isPremium: boolean;
  isPartnerEvent: boolean;
  venue?: string;
  coverPhoto?: string;
}) => {
  try {
    const meetupsRef = collection(db, 'meetups');
    
    // Combine date and times into timestamps
    const startDateTime = new Date(`${meetupData.startDate}T${meetupData.startTime}`);
    const endDateTime = new Date(`${meetupData.startDate}T${meetupData.endTime}`);
    
    const meetupDoc = {
      // Required fields
      businessId: meetupData.organizerId,
      businessName: meetupData.organizerName,
      businessLogo: '',
      businessIsPartner: meetupData.organizerType === 'business' && meetupData.isPartnerEvent,
      
      category: meetupData.category,
      title: meetupData.title,
      description: meetupData.description,
      
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      
      capacity: 4, // Always 4 seats per Meetup definition
      participants: [],
      
      location: {
        latitude: meetupData.latitude,
        longitude: meetupData.longitude,
        address: meetupData.address,
        city: meetupData.city,
        district: ''
      },
      
      levelRequired: meetupData.levelRequired,
      femaleOnly: meetupData.femaleOnly,
      
      // Rewards
      missions: [],
      xpReward: meetupData.xpReward,
      
      // Media
      coverPhoto: meetupData.coverPhoto || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800',
      photos: [],
      
      status: 'upcoming',
      aiGenerated: false,
      partnerPriority: meetupData.isPartnerEvent ? 100 : 50,
      
      // Smart matching
      distanceLimit: 5000, // 5km default
      
      // Analytics
      viewCount: 0,
      joinRequestCount: 0,
      
      // Additional properties for EventCard display
      isPartnerEvent: meetupData.isPartnerEvent,
      isPremium: meetupData.isPremium,
      image: meetupData.coverPhoto || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800',
      venue: meetupData.venue || meetupData.address,
      vibeTags: [],
      attendees: [],
      
      // Metadata
      createdAt: Timestamp.now().toDate().toISOString(),
      updatedAt: Timestamp.now().toDate().toISOString(),
      createdBy: 'ADMIN',
      organizerType: meetupData.organizerType
    };

    const docRef = await addDoc(meetupsRef, meetupDoc);

    console.log('[AdminService] Meetup created:', {
      id: docRef.id,
      title: meetupData.title,
      organizerType: meetupData.organizerType,
      organizer: meetupData.organizerName
    });
    
    return { success: true, meetupId: docRef.id };
  } catch (error) {
    console.error('[AdminService] Error creating meetup:', error);
    return { success: false, error };
  }
};

// Approve Event Registration
export const approveEventRegistration = async (eventId: string, userId: string) => {
  try {
    const eventRef = doc(db, 'adminEvents', eventId);
    const eventDoc = await getDocs(query(collection(db, 'adminEvents'), where('__name__', '==', eventId)));
    
    if (eventDoc.empty) {
      throw new Error('Event not found');
    }

    const eventData = eventDoc.docs[0].data();
    const pendingApprovals = eventData.pendingApprovals || [];
    const approvedRegistrants = eventData.approvedRegistrants || [];

    // Remove from pending and add to approved
    await updateDoc(eventRef, {
      pendingApprovals: pendingApprovals.filter((id: string) => id !== userId),
      approvedRegistrants: [...approvedRegistrants, userId],
      registered: increment(1)
    });

    // Update registration status
    const registrationsRef = collection(db, 'eventRegistrations');
    const registrationQuery = query(
      registrationsRef,
      where('eventId', '==', eventId),
      where('userId', '==', userId)
    );
    const registrationSnapshot = await getDocs(registrationQuery);
    
    if (!registrationSnapshot.empty) {
      const registrationDoc = registrationSnapshot.docs[0];
      await updateDoc(doc(db, 'eventRegistrations', registrationDoc.id), {
        status: 'confirmed',
        approvedAt: Timestamp.now()
      });

      // Deduct points if payment was with points
      const registrationData = registrationDoc.data();
      if (registrationData.paymentMethod === 'points') {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          points: increment(-registrationData.amountPaid)
        });
      }
    }

    console.log('[AdminService] Event registration approved:', { eventId, userId });
    return { success: true };
  } catch (error) {
    console.error('[AdminService] Error approving registration:', error);
    return { success: false, error };
  }
};

// Reject Event Registration
export const rejectEventRegistration = async (eventId: string, userId: string, reason?: string) => {
  try {
    const eventRef = doc(db, 'adminEvents', eventId);
    const eventDoc = await getDocs(query(collection(db, 'adminEvents'), where('__name__', '==', eventId)));
    
    if (eventDoc.empty) {
      throw new Error('Event not found');
    }

    const eventData = eventDoc.docs[0].data();
    const pendingApprovals = eventData.pendingApprovals || [];
    const rejectedRegistrants = eventData.rejectedRegistrants || [];

    // Remove from pending and add to rejected
    await updateDoc(eventRef, {
      pendingApprovals: pendingApprovals.filter((id: string) => id !== userId),
      rejectedRegistrants: [...rejectedRegistrants, userId]
    });

    // Update registration status
    const registrationsRef = collection(db, 'eventRegistrations');
    const registrationQuery = query(
      registrationsRef,
      where('eventId', '==', eventId),
      where('userId', '==', userId)
    );
    const registrationSnapshot = await getDocs(registrationQuery);
    
    if (!registrationSnapshot.empty) {
      const registrationDoc = registrationSnapshot.docs[0];
      await updateDoc(doc(db, 'eventRegistrations', registrationDoc.id), {
        status: 'rejected',
        rejectedAt: Timestamp.now(),
        rejectionReason: reason || 'Registration declined by admin'
      });
    }

    console.log('[AdminService] Event registration rejected:', { eventId, userId, reason });
    return { success: true };
  } catch (error) {
    console.error('[AdminService] Error rejecting registration:', error);
    return { success: false, error };
  }
};

/**
 * Bulk Actions
 */

// Bulk approve mission participations
export const bulkApproveMissions = async (participationIds: string[]) => {
  try {
    const results = await Promise.allSettled(
      participationIds.map(async (id) => {
        const participationRef = doc(db, 'participations', id);
        await updateDoc(participationRef, {
          status: 'approved',
          approvedAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        return id;
      })
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log('[AdminService] Bulk approve missions:', { succeeded, failed });
    return { success: true, succeeded, failed };
  } catch (error) {
    console.error('[AdminService] Error bulk approving missions:', error);
    return { success: false, error };
  }
};

// Bulk reject mission participations
export const bulkRejectMissions = async (participationIds: string[], reason: string = 'Rejected by admin') => {
  try {
    const results = await Promise.allSettled(
      participationIds.map(async (id) => {
        const participationRef = doc(db, 'participations', id);
        await updateDoc(participationRef, {
          status: 'rejected',
          rejectedAt: Timestamp.now(),
          rejectionReason: reason,
          updatedAt: Timestamp.now()
        });
        return id;
      })
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log('[AdminService] Bulk reject missions:', { succeeded, failed });
    return { success: true, succeeded, failed };
  } catch (error) {
    console.error('[AdminService] Error bulk rejecting missions:', error);
    return { success: false, error };
  }
};

// Bulk delete missions
export const bulkDeleteMissions = async (missionIds: string[]) => {
  try {
    const results = await Promise.allSettled(
      missionIds.map(async (id) => {
        const missionRef = doc(db, 'missions', id);
        await deleteDoc(missionRef);
        return id;
      })
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log('[AdminService] Bulk delete missions:', { succeeded, failed });
    return { success: true, succeeded, failed };
  } catch (error) {
    console.error('[AdminService] Error bulk deleting missions:', error);
    return { success: false, error };
  }
};

// Bulk ban users
export const bulkBanUsers = async (userIds: string[], reason: string = 'Violates terms of service') => {
  try {
    const results = await Promise.allSettled(
      userIds.map(async (id) => {
        const userRef = doc(db, 'users', id);
        await updateDoc(userRef, {
          isBanned: true,
          banReason: reason,
          bannedAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        return id;
      })
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log('[AdminService] Bulk ban users:', { succeeded, failed });
    return { success: true, succeeded, failed };
  } catch (error) {
    console.error('[AdminService] Error bulk banning users:', error);
    return { success: false, error };
  }
};

// Bulk unban users
export const bulkUnbanUsers = async (userIds: string[]) => {
  try {
    const results = await Promise.allSettled(
      userIds.map(async (id) => {
        const userRef = doc(db, 'users', id);
        await updateDoc(userRef, {
          isBanned: false,
          banReason: null,
          bannedAt: null,
          unbannedAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        return id;
      })
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log('[AdminService] Bulk unban users:', { succeeded, failed });
    return { success: true, succeeded, failed };
  } catch (error) {
    console.error('[AdminService] Error bulk unbanning users:', error);
    return { success: false, error };
  }
};

// Bulk verify businesses
export const bulkVerifyBusinesses = async (businessIds: string[]) => {
  try {
    const results = await Promise.allSettled(
      businessIds.map(async (id) => {
        const userRef = doc(db, 'users', id);
        await updateDoc(userRef, {
          isVerified: true,
          verifiedAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        return id;
      })
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log('[AdminService] Bulk verify businesses:', { succeeded, failed });
    return { success: true, succeeded, failed };
  } catch (error) {
    console.error('[AdminService] Error bulk verifying businesses:', error);
    return { success: false, error };
  }
};

/**
 * Get all mission participations with filters
 */
export const getAllParticipations = async (filters?: {
  status?: 'pending' | 'approved' | 'rejected';
  businessId?: string;
  startDate?: Date;
  endDate?: Date;
}) => {
  try {
    const participationsRef = collection(db, 'participations');
    let q = query(participationsRef, orderBy('createdAt', 'desc'));

    if (filters?.status) {
      q = query(participationsRef, where('status', '==', filters.status), orderBy('createdAt', 'desc'));
    }

    const snapshot = await getDocs(q);
    let results = snapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date()
      };
    });

    // Client-side filtering for additional filters
    if (filters?.businessId) {
      results = results.filter(p => p.businessId === filters.businessId);
    }

    if (filters?.startDate) {
      results = results.filter(p => p.createdAt >= filters.startDate!);
    }

    if (filters?.endDate) {
      results = results.filter(p => p.createdAt <= filters.endDate!);
    }

    return results;
  } catch (error) {
    console.error('[AdminService] Error fetching participations:', error);
    return [];
  }
};

