import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityProposal, User } from '../types';
import { Card, Button, Badge } from './Common';
import { MapPin, Clock, DollarSign, Users, ThumbsUp, ThumbsDown, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { voteOnActivity, getProposalVoteResults } from '../services/chatService';

interface ActivityProposalCardProps {
  proposal: ActivityProposal;
  conversationId: string;
  currentUserId: string;
  participants: User[];
  onVote?: () => void;
}

export const ActivityProposalCard: React.FC<ActivityProposalCardProps> = ({
  proposal,
  conversationId,
  currentUserId,
  participants,
  onVote
}) => {
  const proposer = participants.find(p => p.id === proposal.proposedBy);
  const currentUserVote = proposal.votes[currentUserId];
  const hasVoted = currentUserVote !== undefined;
  const voteResults = getProposalVoteResults(proposal, participants.length);

  const handleVote = (vote: boolean) => {
    voteOnActivity(conversationId, proposal.id, currentUserId, vote);
    onVote?.();
  };

  const isFunMeetup = proposal.meetupType === 'fun';

  return (
    <Card className={`p-4 border-2 ${
      proposal.status === 'ACCEPTED' ? 'border-green-400 bg-green-50' :
      proposal.status === 'REJECTED' ? 'border-red-400 bg-red-50' :
      isFunMeetup ? 'border-purple-300 bg-purple-50' : 'border-blue-300 bg-blue-50'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge 
              text={isFunMeetup ? '🎉 Fun Meetup' : '💼 Work Session'} 
              color={isFunMeetup ? 'bg-purple-200 text-purple-800' : 'bg-blue-200 text-blue-800'}
            />
            {proposal.status === 'ACCEPTED' && (
              <Badge text="✅ Accepted" color="bg-green-200 text-green-800" />
            )}
            {proposal.status === 'REJECTED' && (
              <Badge text="❌ Not Selected" color="bg-red-200 text-red-800" />
            )}
          </div>
          <h4 className={`font-bold text-lg ${
            isFunMeetup ? 'text-purple-900' : 'text-blue-900'
          }`}>
            {proposal.title}
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            Proposed by {proposer?.name || 'Unknown'}
          </p>
        </div>
      </div>

      {/* Location & Details */}
      <div className="mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
          <MapPin className="w-4 h-4" />
          <span>{proposal.location}</span>
        </div>
        <p className="text-sm text-gray-600">{proposal.description}</p>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <Clock className="w-3 h-3" />
          <span>{proposal.duration}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <DollarSign className="w-3 h-3" />
          <span>{proposal.estimatedCost}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <Users className="w-3 h-3" />
          <span>{proposal.bestTimeOfDay}</span>
        </div>
      </div>

      {/* Voting Section */}
      {proposal.status === 'PROPOSED' && (
        <>
          <div className="border-t border-gray-200 pt-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Vote on this activity:</span>
              <span className="text-xs text-gray-500">
                {voteResults.totalVotes}/{voteResults.totalMembers} voted
              </span>
            </div>

            {/* Vote Progress */}
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-green-500 h-full transition-all duration-300"
                    style={{ width: `${voteResults.percentage}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-700">
                  {voteResults.percentage}%
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>👍 {voteResults.yesVotes} Yes</span>
                <span>👎 {voteResults.noVotes} No</span>
                <span>⏳ {voteResults.notVoted} Not voted</span>
              </div>
            </div>

            {/* Vote Buttons */}
            {!hasVoted ? (
              <div className="flex gap-2">
                <Button
                  onClick={() => handleVote(true)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white border-none"
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  I'm In!
                </Button>
                <Button
                  onClick={() => handleVote(false)}
                  variant="outline"
                  className="flex-1 border-gray-300 hover:bg-gray-100"
                >
                  <ThumbsDown className="w-4 h-4 mr-2" />
                  Pass
                </Button>
              </div>
            ) : (
              <div className={`p-3 rounded-lg text-center ${
                currentUserVote 
                  ? 'bg-green-100 border border-green-300' 
                  : 'bg-gray-100 border border-gray-300'
              }`}>
                <div className="flex items-center justify-center gap-2">
                  {currentUserVote ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-700" />
                      <span className="text-sm font-medium text-green-700">
                        You voted YES
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-gray-700" />
                      <span className="text-sm font-medium text-gray-700">
                        You passed on this
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Acceptance Status */}
          {voteResults.isAccepted && (
            <div className="bg-green-100 border border-green-300 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-green-800">
                <CheckCircle className="w-5 h-5" />
                <span className="font-bold">Majority Reached!</span>
              </div>
              <p className="text-xs text-green-700 mt-1">
                This activity has enough votes to proceed
              </p>
            </div>
          )}
        </>
      )}

      {/* Accepted Status */}
      {proposal.status === 'ACCEPTED' && (
        <div className="border-t border-green-300 pt-3">
          <div className="bg-green-100 border border-green-300 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-800 mb-2">
              <Calendar className="w-4 h-4" />
              <span className="font-bold text-sm">Activity Confirmed!</span>
            </div>
            <p className="text-xs text-green-700">
              {voteResults.yesVotes}/{voteResults.totalMembers} squad members are attending. 
              Add to your calendar to save the date!
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};
