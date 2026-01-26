import React, { useState, useEffect } from 'react';
import { Trophy, Target, Flame, Star, TrendingUp, CheckCircle } from 'lucide-react';
import { 
  detectUserHabits, 
  generateHabitChallenges, 
  getHabitInsights,
  UserHabit,
  HabitChallenge,
  HabitInsight 
} from '../services/habitBuilderService';

interface HabitTrackerWidgetProps {
  userId: string;
}

/**
 * Habit Tracker Widget
 * Gamified progress tracking and challenges
 * Simple drop-in for customer profile/dashboard
 */
export const HabitTrackerWidget: React.FC<HabitTrackerWidgetProps> = ({ userId }) => {
  const [habits, setHabits] = useState<UserHabit[]>([]);
  const [challenges, setChallenges] = useState<HabitChallenge[]>([]);
  const [insights, setInsights] = useState<HabitInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHabits();
  }, [userId]);

  const loadHabits = async () => {
    try {
      setLoading(true);
      const [habitsData, challengesData, insightsData] = await Promise.all([
        detectUserHabits(userId),
        generateHabitChallenges(userId),
        getHabitInsights(userId)
      ]);
      
      setHabits(habitsData);
      setChallenges(challengesData);
      setInsights(insightsData);
    } catch (error) {
      console.error('[Habit Tracker] Error loading habits:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-xl shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-orange-600" />
          <h3 className="text-xl font-bold text-gray-900">Your Habits</h3>
        </div>
      </div>

      {/* Current Streaks */}
      {habits.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Active Streaks</h4>
          {habits.map((habit) => (
            <div key={habit.habitId} className="bg-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Flame className={`w-5 h-5 ${habit.currentStreak > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
                  <span className="font-semibold text-gray-900">{habit.pattern}</span>
                </div>
                <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                  Level {habit.level}
                </span>
              </div>
              
              {habit.currentStreak > 0 && (
                <p className="text-sm text-gray-600 mb-3">
                  🔥 {habit.currentStreak} day streak! (Best: {habit.longestStreak})
                </p>
              )}
              
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-pink-500 h-full rounded-full"
                    style={{ width: `${habit.progress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 font-medium">{Math.round(habit.progress)}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Challenges */}
      {challenges.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Challenges
          </h4>
          {challenges.slice(0, 3).map((challenge) => (
            <div key={challenge.challengeId} className="bg-white rounded-lg p-4 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-semibold text-gray-900">{challenge.title}</h5>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  challenge.difficulty === 'EASY'
                    ? 'bg-green-100 text-green-700'
                    : challenge.difficulty === 'MEDIUM'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {challenge.difficulty}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{challenge.description}</p>
              
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{ width: `${(challenge.current / challenge.goal) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {challenge.current}/{challenge.goal}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">{challenge.motivationalMessage}</span>
                <span className="text-purple-600 font-bold">+{challenge.reward.points} pts</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Star className="w-5 h-5 text-blue-600" />
            Insights
          </h4>
          {insights.slice(0, 2).map((insight, index) => (
            <div key={index} className="mb-3 last:mb-0">
              <p className="text-sm text-gray-700 font-medium mb-1">{insight.insight}</p>
              {insight.recommendation && (
                <p className="text-xs text-blue-600">💡 {insight.recommendation}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {habits.length === 0 && challenges.length === 0 && (
        <div className="text-center py-8">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Start building habits!</p>
          <p className="text-sm text-gray-500">
            Complete missions and check in regularly to unlock challenges and streaks.
          </p>
        </div>
      )}
    </div>
  );
};

export default HabitTrackerWidget;
