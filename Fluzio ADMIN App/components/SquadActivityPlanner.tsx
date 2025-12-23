import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input, TextArea, Badge, Modal } from './Common';
import { Sparkles, Loader2, MapPin, Clock, Users, DollarSign, ThumbsUp, MessageSquare, Plus, X, Calendar } from 'lucide-react';
import { auth } from '../services/AuthContext';

interface ActivitySuggestion {
  title: string;
  location: string;
  description: string;
  duration: string;
  weatherSuitability: string;
  networkingBenefit: string;
  estimatedCost: string;
  bestTimeOfDay: string;
}

interface MeetupType {
  title: string;
  suggestions: ActivitySuggestion[];
}

interface SquadActivityPlannerProps {
  city: string;
  month: string;
  squadSize: number;
  previousActivities?: string[];
  onSelectActivity?: (activity: ActivitySuggestion, meetupType: 'fun' | 'work') => void;
}

export const SquadActivityPlanner: React.FC<SquadActivityPlannerProps> = ({
  city,
  month,
  squadSize,
  previousActivities = [],
  onSelectActivity
}) => {
  const [loading, setLoading] = useState(false);
  const [funMeetup, setFunMeetup] = useState<MeetupType | null>(null);
  const [workMeetup, setWorkMeetup] = useState<MeetupType | null>(null);
  const [seasonalTip, setSeasonalTip] = useState('');
  const [userSuggestion, setUserSuggestion] = useState('');
  const [showSuggestionInput, setShowSuggestionInput] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<{ activity: ActivitySuggestion; type: 'fun' | 'work' } | null>(null);

  const generateSuggestions = async (includeUserIdea: boolean = false) => {
    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('No authenticated user');
        setLoading(false);
        return;
      }

      const token = await currentUser.getIdToken();
      const requestBody = {
        city,
        month,
        squadSize,
        previousActivities,
        ...(includeUserIdea && userSuggestion ? { userSuggestion } : {})
      };

      console.log('Requesting activity suggestions:', requestBody);

      const response = await fetch('https://us-central1-fluzio-13af2.cloudfunctions.net/suggestsquadactivity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Activity suggestions received:', data);

      setFunMeetup(data.funMeetup || null);
      setWorkMeetup(data.workMeetup || null);
      setSeasonalTip(data.seasonalTip || '');
      if (includeUserIdea) {
        setShowSuggestionInput(false);
        setUserSuggestion('');
      }
    } catch (error) {
      console.error('Error generating activity suggestions:', error);
      alert('Failed to generate suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectActivity = (activity: ActivitySuggestion, type: 'fun' | 'work') => {
    setSelectedActivity({ activity, type });
  };

  const confirmSelection = () => {
    if (selectedActivity && onSelectActivity) {
      onSelectActivity(selectedActivity.activity, selectedActivity.type);
    }
    setSelectedActivity(null);
  };

  return (
    <div className="space-y-4">
      {/* Header with Generate Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">Activity Suggestions</h3>
          <p className="text-sm text-gray-500 mt-1">AI-powered ideas for your {month} meetup in {city}</p>
        </div>
        <Button 
          onClick={() => generateSuggestions(false)}
          disabled={loading}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-none"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Get AI Suggestions
            </>
          )}
        </Button>
      </div>

      {/* Seasonal Tip */}
      {seasonalTip && (
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              💡
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">{seasonalTip}</p>
            </div>
          </div>
        </Card>
      )}

      {/* User Suggestion Input */}
      {!showSuggestionInput ? (
        <button
          onClick={() => setShowSuggestionInput(true)}
          className="w-full p-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-all text-sm font-medium flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Have your own idea? Add it and get AI refinement
        </button>
      ) : (
        <Card className="p-4 border-2 border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-gray-900 text-sm">Your Activity Idea</h4>
            <button 
              onClick={() => {
                setShowSuggestionInput(false);
                setUserSuggestion('');
              }}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <TextArea
            value={userSuggestion}
            onChange={(e) => setUserSuggestion(e.target.value)}
            placeholder="E.g., 'Wine tasting tour' or 'Escape room challenge' or 'Cooking class'..."
            className="mb-3"
            rows={2}
          />
          <Button 
            onClick={() => generateSuggestions(true)}
            disabled={loading || !userSuggestion.trim()}
            className="w-full"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Refine My Idea with AI
          </Button>
        </Card>
      )}

      {/* Activity Suggestions */}
      {(funMeetup || workMeetup) && (
        <div className="space-y-6">
          {/* FUN MEETUP */}
          {funMeetup && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl font-bold text-sm">
                  Meetup 1: {funMeetup.title}
                </div>
              </div>
              <div className="space-y-3">
                {funMeetup.suggestions.map((activity, index) => (
                  <Card 
                    key={`fun-${index}`} 
                    className="p-5 hover:shadow-md transition-all cursor-pointer border-l-4 border-l-purple-400"
                    onClick={() => handleSelectActivity(activity, 'fun')}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-lg mb-1">{activity.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                          <MapPin className="w-3 h-3" />
                          <span>{activity.location}</span>
                        </div>
                      </div>
                      <Badge 
                        text={activity.weatherSuitability} 
                        color={
                          activity.weatherSuitability === 'outdoor' ? 'bg-green-100 text-green-700' :
                          activity.weatherSuitability === 'indoor' ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700'
                        }
                      />
                    </div>

                    <p className="text-sm text-gray-600 mb-4">{activity.description}</p>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Clock className="w-3 h-3" />
                        <span>{activity.duration}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <DollarSign className="w-3 h-3" />
                        <span>{activity.estimatedCost}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Users className="w-3 h-3" />
                        <span>{activity.bestTimeOfDay}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                      <div className="flex items-start gap-2">
                        <ThumbsUp className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-purple-900 mb-1">Networking Benefit</p>
                          <p className="text-xs text-purple-700">{activity.networkingBenefit}</p>
                        </div>
                      </div>
                    </div>

                    <Button 
                      className="w-full mt-4"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectActivity(activity, 'fun');
                      }}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Propose to Squad
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* WORK MEETUP */}
          {workMeetup && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-xl font-bold text-sm">
                  Meetup 2: {workMeetup.title}
                </div>
              </div>
              <div className="space-y-3">
                {workMeetup.suggestions.map((activity, index) => (
                  <Card 
                    key={`work-${index}`} 
                    className="p-5 hover:shadow-md transition-all cursor-pointer border-l-4 border-l-blue-400"
                    onClick={() => handleSelectActivity(activity, 'work')}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-lg mb-1">{activity.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                          <MapPin className="w-3 h-3" />
                          <span>{activity.location}</span>
                        </div>
                      </div>
                      <Badge 
                        text="At Member's Business" 
                        color="bg-blue-100 text-blue-700"
                      />
                    </div>

                    <p className="text-sm text-gray-600 mb-4">{activity.description}</p>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Clock className="w-3 h-3" />
                        <span>{activity.duration}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <DollarSign className="w-3 h-3" />
                        <span>{activity.estimatedCost}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Users className="w-3 h-3" />
                        <span>{activity.bestTimeOfDay}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="flex items-start gap-2">
                        <ThumbsUp className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-blue-900 mb-1">Networking Benefit</p>
                          <p className="text-xs text-blue-700">{activity.networkingBenefit}</p>
                        </div>
                      </div>
                    </div>

                    <Button 
                      className="w-full mt-4"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectActivity(activity, 'work');
                      }}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Propose to Squad
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No suggestions yet */}
      {!loading && !funMeetup && !workMeetup && (
        <Card className="p-8 text-center">
          <div className="text-4xl mb-3">🎯</div>
          <p className="text-gray-600 font-medium mb-2">Ready to plan your meetups?</p>
          <p className="text-sm text-gray-500">Get AI suggestions for both fun activities AND work sessions at member businesses</p>
        </Card>
      )}

      {/* Activity Selection Modal */}
      <Modal 
        isOpen={!!selectedActivity} 
        onClose={() => setSelectedActivity(null)}
        title={`Propose ${selectedActivity?.type === 'fun' ? 'Fun Activity' : 'Work Session'} to Squad`}
      >
        {selectedActivity && (
          <div className="space-y-4">
            <div className="mb-3">
              <Badge 
                text={selectedActivity.type === 'fun' ? 'Meetup 1: Fun Activity' : 'Meetup 2: Work Session'} 
                color={selectedActivity.type === 'fun' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}
              />
            </div>
            <Card className={`p-4 bg-gradient-to-r ${selectedActivity.type === 'fun' ? 'from-purple-50 to-pink-50 border-purple-200' : 'from-blue-50 to-cyan-50 border-blue-200'}`}>
              <h4 className={`font-bold text-lg mb-2 ${selectedActivity.type === 'fun' ? 'text-purple-900' : 'text-blue-900'}`}>
                {selectedActivity.activity.title}
              </h4>
              <div className={`flex items-center gap-2 text-sm mb-3 ${selectedActivity.type === 'fun' ? 'text-purple-700' : 'text-blue-700'}`}>
                <MapPin className="w-3 h-3" />
                <span>{selectedActivity.activity.location}</span>
              </div>
              <p className={`text-sm ${selectedActivity.type === 'fun' ? 'text-purple-800' : 'text-blue-800'}`}>
                {selectedActivity.activity.description}
              </p>
            </Card>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                {selectedActivity.type === 'fun' 
                  ? 'This fun activity will be shared with your squad in the group chat. Everyone can vote or suggest alternatives!'
                  : 'This work session at a member\'s business will be shared with your squad. Great opportunity to support each other while networking!'
                }
              </p>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setSelectedActivity(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmSelection}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-none"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Share with Squad
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
