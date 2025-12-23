import React, { useState, useEffect } from 'react';
import { Award, Trophy, Users, Flame, Star, Lock, TrendingUp, X } from 'lucide-react';
import { getUserAchievements, getAchievementsByCategory, Achievement } from '../../services/achievementService';

interface AchievementViewProps {
  userId: string;
}

interface UserAchievementProgress {
  achievement: Achievement;
  unlocked: boolean;
  unlockedAt?: Date;
  progress?: number;
}

export default function AchievementView({ userId }: AchievementViewProps) {
  const [achievements, setAchievements] = useState<UserAchievementProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<UserAchievementProgress | null>(null);

  useEffect(() => {
    loadAchievements();
  }, [userId]);

  const loadAchievements = async () => {
    setLoading(true);
    try {
      const data = await getUserAchievements(userId);
      
      // Combine unlocked and locked achievements
      const allAchievements: UserAchievementProgress[] = [
        ...data.unlocked.map(ua => ({
          achievement: ua.achievement,
          unlocked: true,
          unlockedAt: ua.unlockedAt,
          progress: 100
        })),
        ...data.locked.map(la => ({
          achievement: la.achievement,
          unlocked: false,
          progress: la.progress
        }))
      ];

      setAchievements(allAchievements);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAchievements = achievements.filter(a => 
    selectedCategory === 'all' || a.achievement.category === selectedCategory
  );

  const stats = {
    total: achievements.length,
    unlocked: achievements.filter(a => a.unlocked).length,
    points: achievements
      .filter(a => a.unlocked)
      .reduce((sum, a) => sum + a.achievement.reward.points, 0)
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'missions':
        return <Trophy className="w-5 h-5" />;
      case 'social':
        return <Users className="w-5 h-5" />;
      case 'points':
        return <Star className="w-5 h-5" />;
      case 'streak':
        return <Flame className="w-5 h-5" />;
      case 'special':
        return <Award className="w-5 h-5" />;
      default:
        return <Award className="w-5 h-5" />;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'from-gray-400 to-gray-500';
      case 'rare':
        return 'from-blue-400 to-blue-600';
      case 'epic':
        return 'from-purple-400 to-purple-600';
      case 'legendary':
        return 'from-yellow-400 to-orange-500';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'border-gray-300';
      case 'rare':
        return 'border-blue-400';
      case 'epic':
        return 'border-purple-400';
      case 'legendary':
        return 'border-yellow-400';
      default:
        return 'border-gray-300';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Award className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Achievements</h1>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <div className="text-2xl font-bold">{stats.unlocked}</div>
              <div className="text-sm opacity-90">Unlocked</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm opacity-90">Total</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <div className="text-2xl font-bold">{stats.points}</div>
              <div className="text-sm opacity-90">Points Earned</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white/20 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-white h-full transition-all duration-500 rounded-full"
              style={{ width: `${(stats.unlocked / stats.total) * 100}%` }}
            />
          </div>
          <div className="text-sm opacity-90 mt-2 text-center">
            {Math.round((stats.unlocked / stats.total) * 100)}% Complete
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-4">
        {/* Category Filter */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex gap-2 overflow-x-auto">
            {[
              { id: 'all', label: 'All', icon: <Award className="w-4 h-4" /> },
              { id: 'missions', label: 'Missions', icon: <Trophy className="w-4 h-4" /> },
              { id: 'points', label: 'Points', icon: <Star className="w-4 h-4" /> },
              { id: 'social', label: 'Social', icon: <Users className="w-4 h-4" /> },
              { id: 'streak', label: 'Streak', icon: <Flame className="w-4 h-4" /> },
              { id: 'special', label: 'Special', icon: <TrendingUp className="w-4 h-4" /> }
            ].map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category.icon}
                <span>{category.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Achievements Grid */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading achievements...</p>
          </div>
        ) : filteredAchievements.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No achievements in this category yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map((item, index) => {
              const { achievement, unlocked, unlockedAt, progress } = item;
              
              return (
                <button
                  key={achievement.id}
                  onClick={() => setSelectedAchievement(item)}
                  className={`bg-white rounded-xl shadow-md p-4 text-left transition-all hover:shadow-lg border-2 ${
                    unlocked ? getRarityBorder(achievement.rarity) : 'border-gray-200'
                  } ${!unlocked && 'opacity-60'}`}
                >
                  {/* Icon and Rarity Badge */}
                  <div className="flex items-start justify-between mb-3">
                    <div className={`text-4xl p-3 rounded-xl bg-gradient-to-br ${
                      unlocked 
                        ? getRarityColor(achievement.rarity)
                        : 'from-gray-200 to-gray-300'
                    } ${!unlocked && 'grayscale'}`}>
                      {achievement.icon}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                      achievement.rarity === 'common' ? 'bg-gray-100 text-gray-700' :
                      achievement.rarity === 'rare' ? 'bg-blue-100 text-blue-700' :
                      achievement.rarity === 'epic' ? 'bg-purple-100 text-purple-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
                    </div>
                  </div>

                  {/* Name and Description */}
                  <div className="mb-3">
                    <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                      {achievement.name}
                      {!unlocked && <Lock className="w-4 h-4 text-gray-400" />}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {achievement.description}
                    </p>
                  </div>

                  {/* Reward */}
                  <div className="flex items-center gap-2 text-sm mb-3">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="font-semibold text-gray-900">
                      {achievement.reward.points} points
                    </span>
                    {achievement.reward.title && (
                      <span className="text-gray-500">
                        + "{achievement.reward.title}" title
                      </span>
                    )}
                  </div>

                  {/* Progress Bar (if locked) */}
                  {!unlocked && progress !== undefined && (
                    <div>
                      <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1 text-right">
                        {Math.round(progress)}% Complete
                      </div>
                    </div>
                  )}

                  {/* Unlock Date (if unlocked) */}
                  {unlocked && unlockedAt && (
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      Unlocked {formatDate(unlockedAt)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Achievement Detail Modal */}
      {selectedAchievement && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedAchievement(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`text-6xl p-4 rounded-2xl bg-gradient-to-br ${
                selectedAchievement.unlocked 
                  ? getRarityColor(selectedAchievement.achievement.rarity)
                  : 'from-gray-200 to-gray-300'
              } ${!selectedAchievement.unlocked && 'grayscale'}`}>
                {selectedAchievement.achievement.icon}
              </div>
              <button
                onClick={() => setSelectedAchievement(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedAchievement.achievement.name}
                </h2>
                {!selectedAchievement.unlocked && (
                  <Lock className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className={`inline-block text-xs px-3 py-1 rounded-full font-medium mb-3 ${
                selectedAchievement.achievement.rarity === 'common' ? 'bg-gray-100 text-gray-700' :
                selectedAchievement.achievement.rarity === 'rare' ? 'bg-blue-100 text-blue-700' :
                selectedAchievement.achievement.rarity === 'epic' ? 'bg-purple-100 text-purple-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {selectedAchievement.achievement.rarity.charAt(0).toUpperCase() + 
                 selectedAchievement.achievement.rarity.slice(1)} Achievement
              </div>
            </div>

            <p className="text-gray-600 mb-4">
              {selectedAchievement.achievement.description}
            </p>

            {/* Requirement */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="text-sm font-semibold text-gray-700 mb-1">Requirement:</div>
              <div className="text-gray-600">
                {selectedAchievement.achievement.requirement.type === 'missions_completed' && 
                  `Complete ${selectedAchievement.achievement.requirement.value} missions`}
                {selectedAchievement.achievement.requirement.type === 'points_earned' && 
                  `Earn ${selectedAchievement.achievement.requirement.value} points`}
                {selectedAchievement.achievement.requirement.type === 'connections' && 
                  `Make ${selectedAchievement.achievement.requirement.value} connections`}
                {selectedAchievement.achievement.requirement.type === 'login_streak' && 
                  `Login for ${selectedAchievement.achievement.requirement.value} days in a row`}
                {selectedAchievement.achievement.requirement.type === 'account_age' && 
                  `Have an account for ${selectedAchievement.achievement.requirement.value} days`}
                {selectedAchievement.achievement.requirement.type === 'rating' && 
                  `Maintain a ${selectedAchievement.achievement.requirement.value} star rating`}
                {selectedAchievement.achievement.requirement.type === 'followers' && 
                  `Get ${selectedAchievement.achievement.requirement.value} followers`}
                {selectedAchievement.achievement.requirement.type === 'referrals' && 
                  `Refer ${selectedAchievement.achievement.requirement.value} users`}
              </div>
            </div>

            {/* Reward */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
              <div className="text-sm font-semibold text-gray-700 mb-2">Reward:</div>
              <div className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <Star className="w-5 h-5 text-yellow-500" />
                {selectedAchievement.achievement.reward.points} points
              </div>
              {selectedAchievement.achievement.reward.title && (
                <div className="text-sm text-gray-600 mt-1">
                  + "{selectedAchievement.achievement.reward.title}" title
                </div>
              )}
            </div>

            {/* Progress or Unlock Date */}
            {selectedAchievement.unlocked && selectedAchievement.unlockedAt ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="font-semibold text-green-900 mb-1">Achievement Unlocked!</div>
                <div className="text-sm text-green-700">
                  {formatDate(selectedAchievement.unlockedAt)}
                </div>
              </div>
            ) : (
              <div>
                <div className="bg-gray-200 rounded-full h-3 overflow-hidden mb-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-500"
                    style={{ width: `${selectedAchievement.progress || 0}%` }}
                  />
                </div>
                <div className="text-sm text-gray-600 text-center">
                  {Math.round(selectedAchievement.progress || 0)}% Complete
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
