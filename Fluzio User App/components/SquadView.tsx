
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Squad, CalendarEvent, User } from '../types';
import { store } from '../services/mockStore';
import { getOrCreateSquadChat, proposeActivity } from '../services/chatService';
import { downloadIcsFile, getGoogleCalendarUrl } from '../utils/calendarUtils';
import { Card, Button, Badge, Modal } from './Common';
import { Users, MessageCircle, Calendar, MapPin, User as UserIcon, Coffee, Info, RefreshCw, CalendarPlus, ChevronRight, Navigation, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { HelpSheet } from './HelpSheet';
import { SquadActivityPlanner } from './SquadActivityPlanner';
import { findSquadMembers, NearbyCityInfo } from '../services/squadMatchingService';

interface SquadViewProps {
  squad?: Squad;
  currentUser: User;
  onOpenChat?: (chatId: string) => void;
}

export const SquadView: React.FC<SquadViewProps> = ({ squad, currentUser, onOpenChat }) => {
  const [showHelp, setShowHelp] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [squadMatch, setSquadMatch] = useState<ReturnType<typeof findSquadMembers> | null>(null);

  useEffect(() => {
    // Find squad members based on location
    const allUsers = store.getAllUsers();
    const matchResult = findSquadMembers(currentUser, allUsers);
    setSquadMatch(matchResult);
  }, [currentUser]);

  if (!squadMatch) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="text-gray-500 mt-4">Finding squad members in your area...</p>
      </div>
    );
  }

  // No squad found - show nearby cities
  if (!squadMatch.hasSquad && squadMatch.nearbyCities && squadMatch.nearbyCities.length > 0) {
    return (
      <div className="space-y-6 p-6">
        {/* No Local Squad Message */}
        <Card className="p-6 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-orange-900 mb-2">No Squad Members in {squadMatch.city}</h3>
              <p className="text-sm text-orange-700">
                {squadMatch.message}
              </p>
              <p className="text-sm text-orange-600 mt-2">
                You can either wait for more businesses to join in {squadMatch.city}, or explore nearby cities below.
              </p>
            </div>
          </div>
        </Card>

        {/* Nearby Cities */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Navigation className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-gray-900 text-lg">Nearby Cities with Businesses</h3>
          </div>

          <div className="space-y-3">
            {squadMatch.nearbyCities.map((cityInfo) => (
              <Card 
                key={cityInfo.city}
                className="p-4 hover:shadow-md transition-all border-l-4 border-l-purple-400"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{cityInfo.city}</h4>
                      <p className="text-sm text-gray-500">{cityInfo.distance} km away</p>
                    </div>
                  </div>
                  <Badge 
                    text={`${cityInfo.userCount} ${cityInfo.userCount === 1 ? 'business' : 'businesses'}`}
                    color="bg-purple-100 text-purple-700"
                  />
                </div>

                {/* Show businesses in this city */}
                <div className="flex -space-x-3 mb-3 ml-2">
                  {cityInfo.users.slice(0, 4).map((user) => (
                    <img
                      key={user.id}
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-8 h-8 rounded-full border-2 border-white object-cover"
                      title={user.name}
                    />
                  ))}
                  {cityInfo.userCount > 4 && (
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                      +{cityInfo.userCount - 4}
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-600 mb-3">
                  {cityInfo.users.slice(0, 3).map(u => u.name).join(', ')}
                  {cityInfo.userCount > 3 && ` and ${cityInfo.userCount - 3} more`}
                </p>

                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => {
                    alert(`Feature coming soon: Join ${cityInfo.city} squad remotely or plan a meetup there!`);
                  }}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Explore {cityInfo.city} Squad
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* Help Button */}
        <Button
          variant="outline"
          onClick={() => setShowHelp(true)}
          className="w-full"
        >
          <Info className="w-4 h-4 mr-2" />
          How Squads Work
        </Button>

        {/* Help Sheet */}
        <HelpSheet
          isOpen={showHelp}
          onClose={() => setShowHelp(false)}
          title="How Squads Work"
          heroIcon={Users}
          steps={[
            { title: "Local Matching", text: "We match you with up to 4 businesses in your city (including you)." },
            { title: "Meet & Connect", text: "Meet twice a month: 1 fun meetup + 1 business deep dive." },
            { title: "Grow Together", text: "Share experiences, solve challenges, and build your network." }
          ]}
          proTip="Squads work best with 2-4 members. If your city is small, consider joining a nearby city's squad!"
        />
      </div>
    );
  }

  // Squad found - show normal squad view
  const members = squadMatch.members;
  
  // Get events with backward compatibility fallback
  let eventsToRender = squad?.events || [];
  if (eventsToRender.length === 0 && squad?.schedule) {
      eventsToRender = [
        {
          id: 'legacy_fun', 
          title: 'Fun Meetup', 
          date: squad.schedule.funMeetup.date,
          location: squad.schedule.funMeetup.location, 
          type: 'FUN' as const
        },
        {
          id: 'legacy_work', 
          title: 'Deep Dive', 
          date: squad.schedule.deepDive.date,
          location: 'TBD', 
          description: `Host: ${store.getUser(squad.schedule.deepDive.hostId)?.name || 'TBD'}`, 
          type: 'WORK' as const
        }
      ];
  }

  const handleChatClick = async () => {
    if (onOpenChat && squad) {
        try {
          // Import conversation service to create group chat
          const { createConversation, getConversations } = await import('../services/conversationService');
          
          // Get all participant IDs
          const participantIds = members.map(m => m.id);
          
          // Check if conversation already exists for this squad
          const existingConversations = await getConversations(currentUser.id);
          const existingSquadChat = existingConversations.find(conv => {
            // Check if participants match (same members, regardless of order)
            const convParticipants = conv.participants.sort().join(',');
            const squadParticipants = participantIds.sort().join(',');
            return convParticipants === squadParticipants;
          });
          
          let conversationId: string;
          
          if (existingSquadChat) {
            // Use existing conversation
            conversationId = existingSquadChat.id;
            console.log('[SquadView] Using existing squad conversation:', conversationId);
          } else {
            // Create new group conversation
            const participantNames: Record<string, string> = {};
            const participantAvatars: Record<string, string> = {};
            const participantRoles: Record<string, string> = {};
            
            members.forEach(m => {
              participantNames[m.id] = m.name;
              participantAvatars[m.id] = m.avatarUrl;
              participantRoles[m.id] = m.role;
            });
            
            const groupName = `${squadMatch.city} Squad - ${squad.month}`;
            
            conversationId = await createConversation(
              participantIds,
              participantNames,
              participantAvatars,
              participantRoles,
              groupName
            );
            
            console.log('[SquadView] Created new squad conversation:', conversationId);
            
            // Send initial welcome message
            const { sendMessage } = await import('../services/conversationService');
            await sendMessage(
              conversationId,
              currentUser.id,
              `Welcome to ${groupName}! Let's collaborate and grow together. 🚀`,
              currentUser.name
            );
          }
          
          // Open the chat
          onOpenChat(conversationId);
        } catch (error) {
          console.error('[SquadView] Error creating/opening squad chat:', error);
          alert('Failed to open squad chat. Please try again.');
        }
    } else {
        alert("Messaging module not connected.");
    }
  };

  const handleAddToCalendar = (event: CalendarEvent) => {
      setSelectedEvent(event);
  };

  return (
    <div className="space-y-6">
      {/* Squad Header Card */}
      <Card className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-none shadow-lg shadow-blue-200">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 text-blue-100 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium uppercase tracking-wider">
                {squadMatch.city} Squad
              </span>
              <button onClick={() => setShowHelp(true)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                  <Info className="w-3.5 h-3.5" />
              </button>
            </div>
            <h2 className="text-2xl font-bold text-white">
              {squad?.month || 'November'} Cycle
            </h2>
            <p className="text-sm text-blue-100 mt-1">{squadMatch.message}</p>
          </div>
          <Badge text={`${members.length}/4 Members`} color="bg-white/20 text-white border border-white/30 backdrop-blur-sm" />
        </div>

        <div className="flex justify-between items-center">
           <div className="flex -space-x-4">
              {members.map((m) => (
                <div key={m.id} className="relative group cursor-pointer">
                    <img 
                        src={m.avatarUrl} 
                        alt={m.name} 
                        className="w-12 h-12 rounded-full border-2 border-blue-500 object-cover shadow-sm bg-white"
                    />
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {m.name}
                    </div>
                </div>
              ))}
              {members.length < 4 && Array.from({ length: 4 - members.length }).map((_, i) => (
                <div key={`empty-${i}`} className="relative group cursor-pointer">
                  <div className="w-12 h-12 rounded-full border-2 border-blue-400 border-dashed bg-blue-500/20 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-blue-200" />
                  </div>
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Waiting for member
                  </div>
                </div>
              ))}
           </div>
           {squad && (
             <Button 
              variant="secondary" 
              className="bg-white text-blue-700 hover:bg-blue-50 border-none shadow-sm"
              onClick={handleChatClick}
             >
                <MessageCircle className="w-4 h-4 mr-2" />
                Group Chat
             </Button>
           )}
        </div>
      </Card>

      {/* Schedule Widget */}
      {eventsToRender.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-900 mb-3 px-1">Monthly Schedule</h3>
          <div className="grid gap-4">
            {eventsToRender.map((event, idx) => {
                const isWork = event.type === 'WORK';
                const accentColor = isWork ? 'border-l-purple-400' : 'border-l-amber-400';
                const iconBg = isWork ? 'bg-purple-50 text-purple-500' : 'bg-amber-50 text-amber-500';
                const Icon = isWork ? UserIcon : Coffee;

                return (
                    <Card key={event.id || idx} className={`p-4 border-l-4 ${accentColor} flex gap-4 items-center group relative`}>
                        <div className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center shrink-0`}>
                            <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900">{event.title}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(event.date), 'MMM d, h:mm a')}</span>
                                <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3" /> {event.location}</span>
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => handleAddToCalendar(event)}
                            className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                            <CalendarPlus className="w-4 h-4" />
                        </button>
                    </Card>
                );
            })}
        </div>
      </div>
      )}

      {/* Activity Planner */}
      <div>
        <SquadActivityPlanner
          city={squadMatch.city}
          month={squad?.month || 'November'}
          squadSize={members.length}
          previousActivities={eventsToRender.filter(e => e.type === 'FUN').map(e => e.title)}
          onSelectActivity={async (activity, meetupType) => {
            console.log('Selected activity:', activity, 'Type:', meetupType);
            
            // Create or get squad chat
            if (squad) {
              try {
                const chatId = await getOrCreateSquadChat(
                  squad.id,
                  squad.members,
                  squad.name
                );
                
                // Propose activity in chat
                const proposalId = await proposeActivity(chatId, currentUser.id, {
                  ...activity,
                  meetupType
                });
                
                console.log('Activity proposed in chat:', proposalId);
                
                // Open chat to show proposal
                handleChatClick();
              } catch (error) {
                console.error('Error proposing activity:', error);
                alert('Failed to propose activity. Please try again.');
              }
            }
          }}
        />
      </div>

      {/* Calendar Action Modal */}
      <Modal isOpen={!!selectedEvent} onClose={() => setSelectedEvent(null)} title="Add to Calendar">
         {selectedEvent && (
             <div className="space-y-4">
                 <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 mb-4">
                     <h4 className="font-bold text-blue-900">{selectedEvent.title}</h4>
                     <div className="text-sm text-blue-700 mt-1 flex flex-col gap-1">
                         <span>{format(new Date(selectedEvent.date), 'EEEE, MMMM d • h:mm a')}</span>
                         <span>📍 {selectedEvent.location}</span>
                     </div>
                 </div>

                 <Button 
                    className="w-full justify-between group" 
                    variant="outline"
                    onClick={() => {
                        window.open(getGoogleCalendarUrl(selectedEvent), '_blank');
                        setSelectedEvent(null);
                    }}
                 >
                     <span className="flex items-center gap-2">Google Calendar</span>
                     <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#1E0E62]" />
                 </Button>
                 
                 <Button 
                    className="w-full justify-between group" 
                    variant="outline"
                    onClick={() => {
                        downloadIcsFile(selectedEvent);
                        setSelectedEvent(null);
                    }}
                 >
                     <span className="flex items-center gap-2">Apple / Outlook (ICS File)</span>
                     <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#1E0E62]" />
                 </Button>
             </div>
         )}
      </Modal>

      {/* Help Sheet */}
      <HelpSheet
          isOpen={showHelp}
          onClose={() => setShowHelp(false)}
          title="How Squads Work"
          heroIcon={Users}
          steps={[
              { title: "Local Matching", text: "We match you with up to 3 other businesses in your city (2-4 total)." },
              { title: "Meet & Connect", text: "Meet twice a month: 1 fun meetup + 1 business deep dive." },
              { title: "Flexible Size", text: "Squads work with 2-4 members. Start small and grow!" }
          ]}
          proTip="If your city has few businesses, explore nearby cities to connect with more entrepreneurs."
      />
    </div>
  );
};
