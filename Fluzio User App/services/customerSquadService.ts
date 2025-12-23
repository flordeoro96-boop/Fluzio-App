import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, Timestamp } from 'firebase/firestore';
import { db } from './AuthContext';
import { User } from '../types';

export interface SquadMember {
  id: string;
  name: string;
  avatarUrl: string;
  level: number;
  interests: string[];
  city: string;
  joinedAt: string;
}

export interface SquadMeetup {
  id: string;
  title: string;
  type: 'fun' | 'skill-sharing';
  date: string;
  time: string;
  location: string;
  attendees: string[];
  proposedBy: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface SquadChallenge {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  xpReward: number;
  status: 'active' | 'completed';
}

export interface CustomerSquad {
  id: string;
  city: string;
  members: string[]; // User IDs
  leaderId: string;
  createdAt: string;
  meetups: SquadMeetup[];
  challenges: SquadChallenge[];
  chatId?: string;
  genderPreference?: 'all-girls' | 'mixed'; // Squad gender preference
  matchingType?: 'ai' | 'random'; // How squad was formed
  sharedInterests?: string[]; // Common interests among members
}

/**
 * Calculate interest similarity score between two users
 */
function calculateInterestScore(user1Interests: string[], user2Interests: string[]): number {
  if (!user1Interests?.length || !user2Interests?.length) return 0;
  
  const intersection = user1Interests.filter(interest => 
    user2Interests.includes(interest)
  );
  
  return intersection.length / Math.max(user1Interests.length, user2Interests.length);
}

/**
 * Find the best matching squad using AI-powered interest matching
 */
async function findBestMatchingSquad(
  currentUser: User,
  availableSquads: CustomerSquad[],
  genderPreference: 'all-girls' | 'mixed'
): Promise<CustomerSquad | null> {
  console.log('[AI Matching] 🤖 Starting AI matching for:', currentUser.name);
  console.log('[AI Matching] 📊 User interests:', currentUser.interests);
  console.log('[AI Matching] 📊 Available squads to check:', availableSquads.length);
  
  if (availableSquads.length === 0) return null;

  const userInterests = currentUser.interests || [];
  let bestSquad: CustomerSquad | null = null;
  let bestScore = -1;

  for (const squad of availableSquads) {
    console.log('[AI Matching] 🔍 Checking squad:', squad.id, {
      genderPreference: squad.genderPreference,
      memberCount: squad.members.length,
      sharedInterests: squad.sharedInterests
    });
    
    // Skip if gender preference doesn't match
    if (squad.genderPreference && squad.genderPreference !== genderPreference) {
      console.log('[AI Matching] ⏭️ Skipping squad due to gender preference mismatch:', squad.genderPreference, '!==', genderPreference);
      continue;
    }

    // Get squad members to check gender and interests
    const memberDocs = await Promise.all(
      squad.members.map(memberId => getDoc(doc(db, 'users', memberId)))
    );
    
    const members = memberDocs
      .filter(doc => doc.exists())
      .map(doc => ({ id: doc.id, ...doc.data() } as User));
    
    console.log('[AI Matching] 👥 Squad members:', members.map(m => ({ name: m.name, gender: m.gender, interests: m.interests })));

    // Check gender compatibility
    if (genderPreference === 'all-girls') {
      const allFemale = members.every(m => m.gender === 'FEMALE');
      const currentUserFemale = currentUser.gender === 'FEMALE';
      console.log('[AI Matching] 👭 All-girls check:', { allMembersFemale: allFemale, currentUserFemale: currentUserFemale });
      if (!allFemale || !currentUserFemale) {
        console.log('[AI Matching] ⏭️ Skipping squad - not all female');
        continue;
      }
    }

    // Calculate average interest match score
    let totalScore = 0;
    const individualScores = [];
    for (const member of members) {
      const memberInterests = member.interests || [];
      const score = calculateInterestScore(userInterests, memberInterests);
      individualScores.push({ name: member.name, score });
      totalScore += score;
    }
    const avgScore = members.length > 0 ? totalScore / members.length : 0;
    
    console.log('[AI Matching] 📊 Interest scores:', individualScores);
    console.log('[AI Matching] 📈 Average score:', avgScore);

    // Prefer squads with higher interest overlap
    if (avgScore > bestScore) {
      console.log('[AI Matching] ⭐ New best squad! Score:', avgScore, 'Previous best:', bestScore);
      bestScore = avgScore;
      bestSquad = squad;
    } else {
      console.log('[AI Matching] 📉 Lower score than current best');
    }
  }

  if (bestSquad) {
    console.log('[AI Matching] ✅ Best match found:', bestSquad.id, 'with score:', bestScore);
  } else {
    console.log('[AI Matching] ❌ No compatible squad found');
  }

  return bestSquad;
}

/**
 * Find or create a squad for a customer based on their city, interests, and gender preference
 */
export async function findOrCreateCustomerSquad(
  userId: string,
  genderPreference: 'all-girls' | 'mixed' = 'mixed'
): Promise<CustomerSquad | null> {
  try {
    console.log('[CustomerSquadService] 🔍 Starting squad search for user:', userId, 'preference:', genderPreference);
    
    // Get current user
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      console.error('[CustomerSquadService] ❌ User not found:', userId);
      return null;
    }

    const currentUser = { id: userDoc.id, ...userDoc.data() } as User;
    const userCity = currentUser.currentCity || currentUser.city || currentUser.geo?.city;
    console.log('[CustomerSquadService] 👤 User details:', {
      name: currentUser.name,
      city: userCity,
      gender: currentUser.gender,
      interests: currentUser.interests
    });

    if (!userCity) {
      console.error('[CustomerSquadService] ❌ User has no city:', userId);
      return null;
    }

    // Check if user is already in a squad with matching preference
    console.log('[CustomerSquadService] 🔎 Checking for existing squad...');
    const existingSquadQuery = query(
      collection(db, 'customerSquads'),
      where('members', 'array-contains', userId)
    );
    const existingSquadSnapshot = await getDocs(existingSquadQuery);

    if (!existingSquadSnapshot.empty) {
      const squadDoc = existingSquadSnapshot.docs[0];
      const existingSquad = { id: squadDoc.id, ...squadDoc.data() } as CustomerSquad;
      console.log('[CustomerSquadService] ✅ Found existing squad:', {
        squadId: existingSquad.id,
        city: existingSquad.city,
        members: existingSquad.members,
        genderPreference: existingSquad.genderPreference,
        memberCount: existingSquad.members.length
      });
      
      // Check if existing squad matches the current gender preference
      const squadPrefMatches = existingSquad.genderPreference === genderPreference || !existingSquad.genderPreference;
      console.log('[CustomerSquadService] 🔍 Preference check:', {
        squadPreference: existingSquad.genderPreference,
        userPreference: genderPreference,
        matches: squadPrefMatches
      });
      
      if (squadPrefMatches) {
        console.log('[CustomerSquadService] ✅ Squad matches preference, returning existing squad');
        
        // Update old squads to have the current preference if they don't have one
        if (!existingSquad.genderPreference) {
          console.log('[CustomerSquadService] 🔧 Updating old squad with gender preference:', genderPreference);
          await updateDoc(doc(db, 'customerSquads', existingSquad.id), {
            genderPreference: genderPreference
          });
          existingSquad.genderPreference = genderPreference;
        }
        
        return existingSquad;
      }
      
      // User wants different preference, remove from current squad and find new one
      console.log('[CustomerSquadService] ⚠️ Gender preference changed from', existingSquad.genderPreference, 'to', genderPreference, '- removing from current squad');
      await updateDoc(doc(db, 'customerSquads', existingSquad.id), {
        members: arrayRemove(userId)
      });
      console.log('[CustomerSquadService] ✅ Removed user from old squad, continuing search...');
      // Continue to find a new squad with the preferred gender setting
    } else {
      console.log('[CustomerSquadService] ℹ️ User not in any squad yet');
    }

    // Look for squads in the same city with space (< 4 members)
    console.log('[CustomerSquadService] 🔎 Searching for squads in', userCity);
    const citySquadsQuery = query(
      collection(db, 'customerSquads'),
      where('city', '==', userCity)
    );
    const citySquadsSnapshot = await getDocs(citySquadsQuery);
    console.log('[CustomerSquadService] 📊 Found', citySquadsSnapshot.docs.length, 'squads in city');

    // Filter squads with space (excluding user's own squads)
    const availableSquads = citySquadsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as CustomerSquad))
      .filter(squad => squad.members.length < 4 && !squad.members.includes(userId));
    
    console.log('[CustomerSquadService] 📊 Available squads with space (excluding user):', availableSquads.map(s => ({
      id: s.id,
      members: s.members.length,
      memberIds: s.members,
      genderPreference: s.genderPreference,
      sharedInterests: s.sharedInterests
    })));

    if (availableSquads.length > 0) {
      console.log('[CustomerSquadService] 🤖 Running AI matching...');
      // Use AI to find best matching squad
      let bestSquad = await findBestMatchingSquad(currentUser, availableSquads, genderPreference);
      
      if (bestSquad) {
        console.log('[CustomerSquadService] ✅ AI found best match:', bestSquad.id);
      } else {
        console.log('[CustomerSquadService] ⚠️ AI found no match, trying random compatible squad...');
      }
      
      // If no AI match found but there are compatible squads, use random from compatible ones
      if (!bestSquad) {
        const compatibleSquads = availableSquads.filter(s => 
          !s.genderPreference || s.genderPreference === genderPreference
        );
        console.log('[CustomerSquadService] 📊 Compatible squads for', genderPreference, ':', compatibleSquads.length);
        if (compatibleSquads.length > 0) {
          bestSquad = compatibleSquads[Math.floor(Math.random() * compatibleSquads.length)];
          console.log('[CustomerSquadService] 🎲 Randomly selected compatible squad:', bestSquad.id);
        } else {
          console.log('[CustomerSquadService] ❌ No compatible squads found');
        }
      }

      // If we found a compatible squad, join it
      if (bestSquad) {
        console.log('[CustomerSquadService] ➕ Adding user to squad:', bestSquad.id);
        await updateDoc(doc(db, 'customerSquads', bestSquad.id), {
          members: arrayUnion(userId)
        });
      
        // Return updated squad
        const updatedSquadDoc = await getDoc(doc(db, 'customerSquads', bestSquad.id));
        const updatedSquad = { id: updatedSquadDoc.id, ...updatedSquadDoc.data() } as CustomerSquad;
        console.log('[CustomerSquadService] ✅ Successfully joined squad:', {
          squadId: updatedSquad.id,
          memberCount: updatedSquad.members.length,
          members: updatedSquad.members
        });
        return updatedSquad;
      }
    }

    // No available squad found, create a new one
    console.log('[CustomerSquadService] 🆕 No available squads, creating new squad...');
    const sharedInterests = currentUser.interests || [];
    const newSquad: Omit<CustomerSquad, 'id'> = {
      city: userCity,
      members: [userId],
      leaderId: userId,
      createdAt: new Date().toISOString(),
      genderPreference: genderPreference,
      matchingType: 'ai',
      sharedInterests: sharedInterests.slice(0, 3), // Top 3 interests
      meetups: [],
      challenges: [
        {
          id: 'challenge-1',
          title: 'Explore 5 New Places',
          description: 'Visit 5 different businesses together',
          progress: 0,
          target: 5,
          xpReward: 500,
          status: 'active'
        },
        {
          id: 'challenge-2',
          title: 'Attend 3 Squad Meetups',
          description: 'Participate in 3 squad meetups',
          progress: 0,
          target: 3,
          xpReward: 1000,
          status: 'active'
        }
      ]
    };

    const squadRef = doc(collection(db, 'customerSquads'));
    await setDoc(squadRef, newSquad);
    console.log('[CustomerSquadService] ✅ Created new squad:', {
      squadId: squadRef.id,
      city: newSquad.city,
      genderPreference: newSquad.genderPreference,
      leader: userId
    });

    return { id: squadRef.id, ...newSquad } as CustomerSquad;
  } catch (error) {
    console.error('[CustomerSquadService] ❌ Error finding/creating squad:', error);
    return null;
  }
}

/**
 * Get squad members details
 */
export async function getSquadMembers(memberIds: string[]): Promise<SquadMember[]> {
  try {
    const members: SquadMember[] = [];

    for (const memberId of memberIds) {
      const userDoc = await getDoc(doc(db, 'users', memberId));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        members.push({
          id: userDoc.id,
          name: userData.name,
          avatarUrl: userData.avatarUrl,
          level: userData.level || 1,
          interests: userData.vibeTags || userData.interests || [],
          city: userData.currentCity || userData.city || '',
          joinedAt: userData.createdAt || new Date().toISOString()
        });
      }
    }

    return members;
  } catch (error) {
    console.error('[CustomerSquadService] Error getting squad members:', error);
    return [];
  }
}

/**
 * Get squad meetups
 */
export async function getSquadMeetups(squadId: string): Promise<SquadMeetup[]> {
  try {
    const squadDoc = await getDoc(doc(db, 'customerSquads', squadId));
    if (!squadDoc.exists()) return [];

    const squad = squadDoc.data() as CustomerSquad;
    return squad.meetups || [];
  } catch (error) {
    console.error('[CustomerSquadService] Error getting squad meetups:', error);
    return [];
  }
}

/**
 * Propose a new squad meetup
 */
export async function proposeSquadMeetup(
  squadId: string,
  userId: string,
  meetupData: Omit<SquadMeetup, 'id' | 'proposedBy' | 'attendees' | 'status'>
): Promise<boolean> {
  try {
    const newMeetup: SquadMeetup = {
      id: `meetup-${Date.now()}`,
      ...meetupData,
      proposedBy: userId,
      attendees: [userId],
      status: 'scheduled'
    };

    await updateDoc(doc(db, 'customerSquads', squadId), {
      meetups: arrayUnion(newMeetup)
    });

    return true;
  } catch (error) {
    console.error('[CustomerSquadService] Error proposing meetup:', error);
    return false;
  }
}

/**
 * Confirm attendance for a meetup
 */
export async function confirmMeetupAttendance(
  squadId: string,
  meetupId: string,
  userId: string
): Promise<boolean> {
  try {
    const squadDoc = await getDoc(doc(db, 'customerSquads', squadId));
    if (!squadDoc.exists()) return false;

    const squad = squadDoc.data() as CustomerSquad;
    const updatedMeetups = squad.meetups.map(meetup => {
      if (meetup.id === meetupId && !meetup.attendees.includes(userId)) {
        return {
          ...meetup,
          attendees: [...meetup.attendees, userId]
        };
      }
      return meetup;
    });

    await updateDoc(doc(db, 'customerSquads', squadId), {
      meetups: updatedMeetups
    });

    return true;
  } catch (error) {
    console.error('[CustomerSquadService] Error confirming attendance:', error);
    return false;
  }
}

/**
 * Update squad challenge progress
 */
export async function updateChallengeProgress(
  squadId: string,
  challengeId: string,
  increment: number = 1
): Promise<boolean> {
  try {
    const squadDoc = await getDoc(doc(db, 'customerSquads', squadId));
    if (!squadDoc.exists()) return false;

    const squad = squadDoc.data() as CustomerSquad;
    const updatedChallenges = squad.challenges.map(challenge => {
      if (challenge.id === challengeId) {
        const newProgress = challenge.progress + increment;
        return {
          ...challenge,
          progress: Math.min(newProgress, challenge.target),
          status: newProgress >= challenge.target ? 'completed' : 'active'
        } as SquadChallenge;
      }
      return challenge;
    });

    await updateDoc(doc(db, 'customerSquads', squadId), {
      challenges: updatedChallenges
    });

    return true;
  } catch (error) {
    console.error('[CustomerSquadService] Error updating challenge:', error);
    return false;
  }
}

/**
 * Leave squad
 */
export async function leaveSquad(squadId: string, userId: string): Promise<boolean> {
  try {
    const squadDoc = await getDoc(doc(db, 'customerSquads', squadId));
    if (!squadDoc.exists()) return false;

    const squad = squadDoc.data() as CustomerSquad;

    // Remove user from members
    await updateDoc(doc(db, 'customerSquads', squadId), {
      members: arrayRemove(userId)
    });

    // If this was the leader and there are other members, assign new leader
    if (squad.leaderId === userId && squad.members.length > 1) {
      const newLeader = squad.members.find(id => id !== userId);
      if (newLeader) {
        await updateDoc(doc(db, 'customerSquads', squadId), {
          leaderId: newLeader
        });
      }
    }

    // If squad is empty, optionally delete it
    if (squad.members.length === 1) {
      // Could delete the squad here if desired
    }

    return true;
  } catch (error) {
    console.error('[CustomerSquadService] Error leaving squad:', error);
    return false;
  }
}
