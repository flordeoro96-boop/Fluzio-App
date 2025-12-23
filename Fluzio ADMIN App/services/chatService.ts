
import { Conversation, User, ActivityProposal } from '../types';

/**
 * TEMPORARY: Squad chat and activity proposal service
 * TODO: Migrate to Firestore - currently using in-memory storage
 * This is specialized logic for squad activity proposals that needs
 * to be integrated with conversationService once Firebase migration is complete
 */

// Temporary in-memory storage until Firebase migration
const conversations: Conversation[] = [];
const activityProposals = new Map<string, ActivityProposal>();

export const getOrCreateSquadChat = (squadId: string, memberIds: string[], squadName: string): string => {
  console.warn('[chatService] Using temporary in-memory storage - needs Firebase implementation');
  
  // 1. Check if chat exists
  const existingChat = conversations.find(c => 
    c.type === 'SQUAD_GROUP' && 
    c.name === squadName
  );

  if (existingChat) {
    return existingChat.id;
  }

  // 2. Create new chat (simplified without full user objects)
  const newChat: Conversation = {
    id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'SQUAD_GROUP',
    name: squadName,
    participants: memberIds.map(id => ({ 
      id, 
      name: 'User', 
      email: '', 
      role: 'CREATOR' as const,
      avatarUrl: '',
      location: '',
      points: 0,
      level: 1,
      bio: '',
      subscriptionLevel: 'FREE',
      badges: [],
      socialLinks: {}
    } as any)),
    lastMessage: {
      id: 'msg_init',
      conversationId: '',
      senderId: 'system',
      text: 'Squad chat created',
      type: 'SYSTEM',
      timestamp: new Date().toISOString(),
      isRead: true
    },
    unreadCount: 0
  };
  
  newChat.lastMessage.conversationId = newChat.id;
  conversations.push(newChat);

  return newChat.id;
};

export const proposeActivity = (
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
): string => {
  const proposal: ActivityProposal = {
    id: `proposal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...activity,
    proposedBy: proposerId,
    proposedAt: new Date().toISOString(),
    votes: {},
    status: 'PROPOSED'
  };

  // Store proposal (in-memory for now)
  activityProposals.set(proposal.id, proposal);

  // TODO: Send notification via notificationService once integrated
  console.log('[chatService] Activity proposed:', activity.title);

  return proposal.id;
};

export const voteOnActivity = (
  conversationId: string,
  proposalId: string,
  userId: string,
  vote: boolean
): void => {
  const proposal = activityProposals.get(proposalId);
  if (proposal) {
    proposal.votes[userId] = vote;
    
    // Check if majority reached (simplified logic)
    const votes = Object.values(proposal.votes);
    const yesVotes = votes.filter(v => v === true).length;
    
    if (yesVotes >= Math.ceil(votes.length / 2)) {
      proposal.status = 'ACCEPTED';
    }
  }
};

export const getActivityProposal = (
  conversationId: string,
  proposalId: string
): ActivityProposal | undefined => {
  return activityProposals.get(proposalId);
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
