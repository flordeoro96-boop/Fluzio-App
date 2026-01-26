/**
 * Business Squad Screen
 * Cycle-based collaboration groups for local businesses
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  MessageCircle,
  Plus,
  ChevronRight,
  Sparkles,
  Coffee,
  Repeat,
  Lightbulb,
  CheckCircle
} from 'lucide-react';
import { User, Squad as SquadType } from '../../types';
import { getSquadForUser, findOrCreateBusinessSquad } from '../../services/squadService';
import { getUserById } from '../../services/userService';
import { createConversation, getConversations, getConversationData } from '../../services/conversationService';
import { doc, updateDoc, collection, addDoc, Timestamp, query, where, getDocs, deleteDoc } from '../../services/firestoreCompat';
import { db } from '../../services/apiService';

interface BusinessSquadScreenProps {
  user: User;
  onNavigate: (route: string) => void;
}

interface SquadDisplay {
  id: string;
  name: string;
  city: string;
  cycle: string;
  nextMatch: string;
  cycleEnd: string;
  currentMembers: number;
  maxMembers: number;
  members: SquadMember[];
  hasGroupChat: boolean;
  chatId?: string | null;
  selectedActivity?: {
    id: string;
    title: string;
    description: string;
    emoji: string;
    selectedBy: string;
    selectedAt: string;
  };
  activityVotes?: Array<{
    userId: string;
    userName: string;
    activityId: string;
    activityTitle: string;
    activityEmoji: string;
    votedAt: string;
  }>;
}

interface SquadMember {
  id: string;
  name: string;
  avatar: string;
  businessName?: string;
}

interface ActivitySuggestion {
  id: string;
  title: string;
  description: string;
  icon: string;
  emoji: string;
}

const activitySuggestions: ActivitySuggestion[] = [
  {
    id: '1',
    title: 'Host a Coffee Meetup',
    description: 'Meet at a local coffee shop to share ideas.',
    icon: 'coffee',
    emoji: '☕'
  },
  {
    id: '2',
    title: 'Cross-Promote Each Other',
    description: "Highlight each other's businesses on social media.",
    icon: 'repeat',
    emoji: '🔄'
  },
  {
    id: '3',
    title: 'Organize a Mini Workshop',
    description: 'Hold a workshop to exchange expertise.',
    icon: 'lightbulb',
    emoji: '💡'
  }
];

export const BusinessSquadScreen: React.FC<BusinessSquadScreenProps> = ({
  user,
  onNavigate
}) => {
  const [squad, setSquad] = useState<SquadDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<ActivitySuggestion[]>([]);

  // Helper function to get current cycle dates
  const getCurrentCycleDates = () => {
    const now = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                             'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentDay = now.getDate();
    
    // Calculate next match date (5th of current month, or 5th of next month if past 5th)
    let nextMatchDate = new Date(currentYear, currentMonth, 5);
    if (currentDay >= 5) {
      nextMatchDate = new Date(currentYear, currentMonth + 1, 5);
    }
    
    // Calculate cycle end (last day of current month)
    const cycleEndDate = new Date(currentYear, currentMonth + 1, 0);
    
    return {
      cycle: `${monthNames[currentMonth]} Cycle`,
      nextMatch: `${monthNamesShort[nextMatchDate.getMonth()]} ${nextMatchDate.getDate()}`,
      cycleEnd: `${monthNamesShort[cycleEndDate.getMonth()]} ${cycleEndDate.getDate()}`
    };
  };

  useEffect(() => {
    loadSquadData();
  }, [user.id]);

  // Clean up old activity messages on mount
  useEffect(() => {
    const cleanupOldMessages = async () => {
      if (!squad?.chatId) return;
      
      try {
        const messagesRef = collection(db, 'conversations', squad.chatId, 'messages');
        const allMessages = await getDocs(messagesRef);
        
        // Delete old-format activity messages
        const deletePromises = allMessages.docs
          .filter(doc => {
            const data = doc.data();
            return data.type === 'SYSTEM' && data.text?.includes('Selected squad activity');
          })
          .map(doc => deleteDoc(doc.ref));
        
        if (deletePromises.length > 0) {
          await Promise.all(deletePromises);
          console.log('[Squad] Cleaned up', deletePromises.length, 'old activity messages');
        }
      } catch (error) {
        console.error('[Squad] Error cleaning up old messages:', error);
      }
    };

    if (squad?.chatId) {
      cleanupOldMessages();
    }
  }, [squad?.chatId]);

  const loadSquadData = async () => {
    try {
      setLoading(true);
      
      // Try to find or create a squad for this business
      const squadData = await findOrCreateBusinessSquad(user.id);
      
      // Get current cycle dates
      const cycleDates = getCurrentCycleDates();
      
      if (!squadData) {
        // Fallback: create display squad if something went wrong
        const displaySquad: SquadDisplay = {
          id: 'pending',
          name: `${user.currentCity || 'Munich'} Squad`,
          city: user.currentCity || 'Munich',
          cycle: cycleDates.cycle,
          nextMatch: cycleDates.nextMatch,
          cycleEnd: cycleDates.cycleEnd,
          currentMembers: 1,
          maxMembers: 4,
          members: [
            {
              id: user.id,
              name: user.name,
              avatar: user.avatarUrl || ''
            }
          ],
          hasGroupChat: false,
          chatId: null
        };
        setSquad(displaySquad);
        return;
      }

      // Convert Firestore squad to display format
      const memberDetails = await Promise.all(
        squadData.members.map(async (memberId) => {
          const memberUser = await getUserById(memberId);
          const businessLogo = memberUser?.avatarUrl || '';
          return {
            id: memberId,
            name: memberUser?.name || 'Unknown',
            avatar: businessLogo,
            businessName: memberUser?.name || 'Unknown Business'
          };
        })
      );

      const displaySquad: SquadDisplay = {
        id: squadData.id,
        name: `${user.currentCity || 'Munich'} Squad`,
        city: user.currentCity || 'Munich',
        cycle: squadData.month || cycleDates.cycle,
        nextMatch: (squadData.schedule as any)?.nextMatch || cycleDates.nextMatch,
        cycleEnd: (squadData.schedule as any)?.cycleEnd || cycleDates.cycleEnd,
        currentMembers: squadData.members.length,
        maxMembers: 4,
        members: memberDetails,
        hasGroupChat: !!squadData.chatId,
        chatId: squadData.chatId,
        selectedActivity: squadData.selectedActivity,
        activityVotes: squadData.activityVotes || []
      };

      setSquad(displaySquad);
    } catch (error) {
      console.error('[BusinessSquad] Error loading squad:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAISuggestions = async () => {
    if (!squad || loadingAI) return;
    
    setLoadingAI(true);
    try {
      const response = await fetch('https://us-central1-fluzio-13af2.cloudfunctions.net/suggestsquadactivity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: squad.city,
          month: squad.cycle,
          squadSize: squad.currentMembers,
          previousActivities: []
        })
      });

      const data = await response.json();
      
      if (data.success && data.funMeetup && data.workMeetup) {
        // Combine fun and work suggestions
        const suggestions: ActivitySuggestion[] = [];
        
        data.funMeetup.suggestions?.forEach((s: any, idx: number) => {
          suggestions.push({
            id: `fun-${idx}`,
            title: s.title,
            description: s.description,
            icon: 'coffee',
            emoji: '☕'
          });
        });
        
        data.workMeetup.suggestions?.forEach((s: any, idx: number) => {
          suggestions.push({
            id: `work-${idx}`,
            title: s.title,
            description: s.description,
            icon: 'lightbulb',
            emoji: '💡'
          });
        });
        
        setAiSuggestions(suggestions.slice(0, 3)); // Show top 3
      }
    } catch (error) {
      console.error('[Squad] Error getting AI suggestions:', error);
      alert('Failed to generate suggestions. Please try again.');
    } finally {
      setLoadingAI(false);
    }
  };

  const getIconForActivity = (iconName: string) => {
    switch (iconName) {
      case 'coffee': return Coffee;
      case 'repeat': return Repeat;
      case 'lightbulb': return Lightbulb;
      default: return Sparkles;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white pb-24">
      {/* My Squad Content */}
      {squad && (
        <div className="p-4 space-y-4">
          {/* Squad Card */}
          <div className="bg-gradient-to-br from-blue-400 via-purple-400 to-purple-500 rounded-3xl p-6 text-white shadow-xl">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  {squad.name}
                  <CheckCircle className="w-5 h-5" />
                </h2>
                <p className="text-white/90 text-lg font-medium">{squad.cycle}</p>
              </div>
              <div className="bg-white/30 backdrop-blur-sm px-4 py-2 rounded-full">
                <p className="text-sm font-semibold">
                  {squad.currentMembers}/{squad.maxMembers}
                </p>
                <p className="text-xs">Members</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm mb-4 text-white/90">
              <span>Next match: {squad.nextMatch}</span>
              <span>|</span>
              <span>Cycle ends: {squad.cycleEnd}</span>
            </div>

            {/* Squad Votes Display */}
            {squad.activityVotes && squad.activityVotes.length > 0 ? (
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 mb-4 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-xs text-purple-600 font-bold uppercase tracking-wide">Squad Votes</p>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-semibold">
                    {squad.activityVotes.length} {squad.activityVotes.length === 1 ? 'vote' : 'votes'}
                  </span>
                </div>
                <div className="space-y-2">
                  {squad.activityVotes.map((vote, idx) => {
                    const activity = [...activitySuggestions, ...aiSuggestions].find(a => a.id === vote.activityId);
                    return (
                      <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50/80">
                        <span className="text-xl">{vote.activityEmoji || activity?.emoji || '🎯'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {vote.activityTitle || activity?.title}
                          </p>
                          <p className="text-xs text-gray-600">
                            {vote.userName} {vote.userId === user.id && '(you)'}
                          </p>
                        </div>
                        {vote.userId === user.id && (
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 mb-4 border-2 border-dashed border-white/40">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/30 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white font-semibold mb-0.5">No activity selected</p>
                    <p className="text-xs text-white/80">Choose an activity below to coordinate with your squad</p>
                  </div>
                </div>
              </div>
            )}

            {/* Member Avatars */}
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {squad.members.map((member) => (
                  <div key={member.id} className="relative">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-12 h-12 rounded-full border-4 border-white object-cover bg-white"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-12 h-12 rounded-full border-4 border-white bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white font-bold text-lg"
                      style={{ display: member.avatar ? 'none' : 'flex' }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                ))}
                {[...Array(squad.maxMembers - squad.currentMembers)].map((_, idx) => (
                  <div
                    key={`placeholder-${idx}`}
                    className="w-12 h-12 rounded-full border-4 border-white bg-white/20 backdrop-blur-sm flex items-center justify-center"
                  >
                    <Users className="w-5 h-5 text-white/50" />
                  </div>
                ))}
              </div>

              <button 
                onClick={async () => {
                  if (!squad || !user.id) return;
                  
                  try {
                    let chatId = squad.chatId;
                    
                    // Check if conversation exists
                    if (chatId) {
                      const existingConversation = await getConversationData(chatId);
                      if (!existingConversation) {
                        console.log('[Squad] Chat ID exists but conversation missing, recreating...');
                        chatId = null;
                      }
                    }
                    
                    // Create group chat if it doesn't exist
                    if (!chatId) {
                      console.log('[Squad] Creating squad group chat...');
                      
                      const participantIds = squad.members.map(m => m.id);
                      const participantNames: Record<string, string> = {};
                      const participantAvatars: Record<string, string> = {};
                      const participantRoles: Record<string, string> = {};
                      
                      squad.members.forEach(member => {
                        participantNames[member.id] = member.name;
                        participantAvatars[member.id] = member.avatar || '';
                        participantRoles[member.id] = 'BUSINESS';
                      });
                      
                      chatId = await createConversation(
                        participantIds,
                        participantNames,
                        participantAvatars,
                        participantRoles,
                        `${squad.city} Business Squad`
                      );
                      
                      // Update squad with chatId
                      await updateDoc(doc(db, 'squads', squad.id), {
                        chatId: chatId
                      });
                      
                      // Update local state
                      setSquad({ ...squad, chatId, hasGroupChat: true });
                    }
                    
                    // Navigate to chat
                    onNavigate(`/chat/${chatId}`);
                  } catch (error) {
                    console.error('[Squad] Error opening chat:', error);
                    alert('Failed to open squad chat. Please try again.');
                  }
                }}
                className="ml-auto bg-gradient-to-r from-[#4A2B7C] to-[#2D1B4E] px-6 py-3 rounded-full font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
              >
                <MessageCircle className="w-5 h-5" />
                {squad.chatId ? 'Open Group Chat' : 'Create Group Chat'}
              </button>
            </div>
          </div>

          {/* First Member Card */}
          {squad.currentMembers === 1 && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-[#1E0E62] mb-3 flex items-center gap-2">
                You're the first member 🎉
              </h3>
              <p className="text-gray-600 mb-2">
                We'll automatically add up to 3 businesses that match your profile in {squad.city}.
              </p>
              <p className="text-gray-600 mb-4">
                Sit tight — or invite someone you trust.
              </p>

              <button 
                onClick={() => {
                  alert('📧 Invite feature coming soon! You\'ll be able to invite trusted businesses to join your Squad.');
                }}
                className="w-full bg-gradient-to-r from-blue-400 to-purple-500 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all mb-3"
              >
                <Plus className="w-5 h-5" />
                Invite a Business
              </button>

              <button className="text-purple-600 font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all">
                See how it works
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Grow Your Squad Section */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-[#1E0E62] mb-2">
              Grow Your Squad Together
            </h3>
            <p className="text-gray-600 mb-6">
              Your Squad meets once per cycle to exchange ideas, explore collaborations, and grow together.
            </p>

            {/* Activity Suggestions Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-bold text-[#1E0E62] flex items-center gap-2">
                  Activity Suggestions
                  {(!squad.activityVotes || squad.activityVotes.length === 0) && (
                    <span className="px-2 py-0.5 bg-gradient-to-r from-blue-400 to-purple-500 text-white text-xs rounded-full font-semibold animate-pulse">
                      Choose one!
                    </span>
                  )}
                </h4>
                <p className="text-sm text-gray-500">
                  {squad.activityVotes && squad.activityVotes.length > 0 ? 'Vote for your squad activity' : 'Click to select your squad\'s activity'}
                </p>
              </div>
              <button 
                onClick={handleAISuggestions}
                disabled={loadingAI}
                className="bg-gradient-to-r from-blue-400 to-purple-500 text-white px-5 py-2.5 rounded-full font-semibold text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loadingAI ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Get AI Suggestions
                  </>
                )}
              </button>
            </div>

            {/* Activity Cards */}
            <div className="space-y-3">
              {(aiSuggestions.length > 0 ? aiSuggestions : activitySuggestions).map((activity) => {
                const IconComponent = getIconForActivity(activity.icon);
                const userVote = squad?.activityVotes?.find(v => v.userId === user.id);
                const isSelected = userVote?.activityId === activity.id;
                const voteCount = squad?.activityVotes?.filter(v => v.activityId === activity.id).length || 0;
                return (
                  <button
                    key={activity.id}
                    onClick={async () => {
                      if (!squad?.id) return;
                      
                      try {
                        const squadRef = doc(db, 'squads', squad.id);
                        
                        // Get current votes and update/add this user's vote
                        const currentVotes = squad.activityVotes || [];
                        const newVotes = currentVotes.filter(v => v.userId !== user.id);
                        newVotes.push({
                          userId: user.id,
                          userName: user.name,
                          activityId: activity.id,
                          activityTitle: activity.title,
                          activityEmoji: activity.emoji,
                          votedAt: new Date().toISOString()
                        });
                        
                        await updateDoc(squadRef, {
                          activityVotes: newVotes
                        });
                        
                        // Update local state
                        setSquad({
                          ...squad,
                          activityVotes: newVotes
                        });
                        
                        // Post vote to group chat (DON'T delete old votes, just add new one)
                        if (squad.chatId) {
                          const messagesRef = collection(db, 'conversations', squad.chatId, 'messages');
                          
                          // Delete only THIS user's previous vote message
                          const allMessages = await getDocs(messagesRef);
                          const deletePromises = allMessages.docs
                            .filter(doc => {
                              const data = doc.data();
                              return (data.type === 'ACTIVITY_SELECTED' && data.senderId === user.id) || 
                                     (data.type === 'SYSTEM' && data.text?.includes('Selected squad activity') && data.senderId === user.id);
                            })
                            .map(doc => deleteDoc(doc.ref));
                          await Promise.all(deletePromises);
                          
                          // Add new vote message
                          await addDoc(messagesRef, {
                            senderId: user.id,
                            text: `Voted: ${activity.title}`,
                            timestamp: Timestamp.now(),
                            type: 'ACTIVITY_SELECTED',
                            activityData: {
                              emoji: activity.emoji,
                              title: activity.title,
                              description: activity.description,
                              selectedBy: user.name
                            }
                          });
                        }
                      } catch (error) {
                        console.error('[Squad] Error selecting activity:', error);
                        alert('Failed to select activity. Please try again.');
                      }
                    }}
                    className={`w-full flex items-start gap-4 p-4 rounded-2xl transition-all duration-200 text-left group relative overflow-hidden ${
                      isSelected 
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-purple-400 shadow-md' 
                        : voteCount > 0
                        ? 'bg-blue-50/50 hover:bg-blue-50 hover:shadow-sm border-2 border-blue-200'
                        : 'bg-gray-50 hover:bg-gray-100 hover:shadow-sm border-2 border-transparent'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm ${
                      isSelected ? 'bg-gradient-to-br from-blue-400 to-purple-500' : 'bg-white'
                    }`}>
                      <span className="text-2xl">{activity.emoji}</span>
                    </div>
                    <div className="flex-1 pr-8">
                      <h5 className="font-bold text-[#1E0E62] mb-1.5 text-base">
                        {activity.title}
                      </h5>
                      <p className="text-sm text-gray-600 leading-relaxed">{activity.description}</p>
                      {isSelected && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                          <span className="text-xs text-green-600 font-medium">Current activity</span>
                        </div>
                      )}
                    </div>
                    <ChevronRight className={`w-5 h-5 transition-all ${
                      isSelected ? 'text-purple-600' : 'text-gray-400 group-hover:text-purple-600 group-hover:translate-x-0.5'
                    }`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
