
import { Conversation, User, ActivityProposal } from '../types';
import { db } from './AuthContext';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';

/**
 * Squad chat and activity proposal service - Firestore integrated
 * Handles squad-specific conversations and activity proposals
 */

export const getOrCreateSquadChat = async (
  squadId: string, 
  memberIds: string[], 
  squadName: string
): Promise<string> => {
  try {
    // 1. Check if squad chat already exists
    const q = query(
      collection(db, 'conversations'),
      where('type', '==', 'SQUAD_GROUP'),
      where('squadId', '==', squadId)
    );
    
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }

    // 2. Create new squad chat in Firestore
    const conversationRef = doc(collection(db, 'conversations'));
    const conversationData = {
      type: 'SQUAD_GROUP',
      name: squadName,
      squadId: squadId,
      participants: memberIds,
      participantCount: memberIds.length,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: {
        text: 'Squad chat created',
        senderId: 'system',
        timestamp: new Date().toISOString(),
        type: 'SYSTEM'
      }
    };

    await setDoc(conversationRef, conversationData);
    
    console.log('[chatService] Created squad chat in Firestore:', conversationRef.id);
    return conversationRef.id;
  } catch (error) {
    console.error('[chatService] Error creating squad chat:', error);
    throw error;
  }
};

export const proposeActivity = async (
  conversationId: string,
  proposerId: string,
  activity: {
    title: string;
    location: string;
    description: string;
    duration: string;
    estimatedCost: string;
    bestTimeOfDay: string;
    meetupType: 'fun' | 'work';
  }
): Promise<string> => {
  try {
    const proposalRef = doc(collection(db, 'activityProposals'));
    const proposalData = {
      ...activity,
      conversationId,
      proposedBy: proposerId,
      proposedAt: serverTimestamp(),
      votes: {},
      status: 'PROPOSED',
      createdAt: serverTimestamp()
    };

    await setDoc(proposalRef, proposalData);
    
    // Update conversation with latest activity
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      lastMessage: {
        text: `💡 ${activity.title} proposed`,
        senderId: proposerId,
        timestamp: new Date().toISOString(),
        type: 'ACTIVITY_PROPOSAL'
      },
      updatedAt: serverTimestamp()
    });

    console.log('[chatService] Activity proposed:', activity.title);
    return proposalRef.id;
  } catch (error) {
    console.error('[chatService] Error proposing activity:', error);
    throw error;
  }
};

export const voteOnActivity = async (
  conversationId: string,
  proposalId: string,
  userId: string,
  vote: boolean
): Promise<void> => {
  try {
    const proposalRef = doc(db, 'activityProposals', proposalId);
    const proposalDoc = await getDoc(proposalRef);
    
    if (!proposalDoc.exists()) {
      throw new Error('Proposal not found');
    }

    const proposal = proposalDoc.data();
    const votes = proposal.votes || {};
    votes[userId] = vote;
    
    // Update votes
    await updateDoc(proposalRef, { votes });
    
    // Check if majority reached
    const voteValues = Object.values(votes);
    const yesVotes = voteValues.filter((v: any) => v === true).length;
    
    if (yesVotes >= Math.ceil(voteValues.length / 2)) {
      await updateDoc(proposalRef, { status: 'ACCEPTED' });
      console.log('[chatService] Activity accepted!');
    }
  } catch (error) {
    console.error('[chatService] Error voting on activity:', error);
    throw error;
  }
};

export const getActivityProposal = async (
  conversationId: string,
  proposalId: string
): Promise<ActivityProposal | null> => {
  try {
    const proposalRef = doc(db, 'activityProposals', proposalId);
    const proposalDoc = await getDoc(proposalRef);
    
    if (!proposalDoc.exists()) {
      return null;
    }
    
    return {
      id: proposalDoc.id,
      ...proposalDoc.data(),
      proposedAt: proposalDoc.data().proposedAt?.toDate?.()?.toISOString() || proposalDoc.data().proposedAt
    } as ActivityProposal;
  } catch (error) {
    console.error('[chatService] Error fetching proposal:', error);
    return null;
  }
};

export const getActivityProposals = async (conversationId: string): Promise<ActivityProposal[]> => {
  try {
    const q = query(
      collection(db, 'activityProposals'),
      where('conversationId', '==', conversationId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      proposedAt: doc.data().proposedAt?.toDate?.()?.toISOString() || doc.data().proposedAt
    })) as ActivityProposal[];
  } catch (error) {
    console.error('[chatService] Error fetching proposals:', error);
    return [];
  }
};

export const getProposalVoteResults = (proposal: ActivityProposal, totalMembers: number) => {
  const votes = Object.values(proposal.votes);
  const yesVotes = votes.filter(v => v === true).length;
  const noVotes = votes.filter(v => v === false).length;
  const notVoted = totalMembers - votes.length;
  const majority = Math.ceil(totalMembers / 2);
  const isAccepted = yesVotes >= majority;

  return {
    yesVotes,
    noVotes,
    notVoted,
    totalVotes: votes.length,
    totalMembers,
    majority,
    isAccepted,
    percentage: totalMembers > 0 ? Math.round((yesVotes / totalMembers) * 100) : 0
  };
};
