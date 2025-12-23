import React, { useState, useEffect } from 'react';
import { Trophy, Star, Lock, TrendingUp, Award, Target, Zap, Calendar } from 'lucide-react';
import { getUserAchievements, getDailyQuests, getAllAchievements, type Achievement, type DailyQuest } from '../services/achievementsService';
import { useAuth } from '../services/AuthContext';

export const GamificationHub: React.FC = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'achievements' | 'quests' | 'battlepass'>('achievements');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [dailyQuests, setDailyQuests] = useState<DailyQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [userProfile?.id]);

  const loadData = async () => {
    if (!userProfile?.id) return;

    setLoading(true);
    try {
      const [userAchievements, quests] = await Promise.all([
        getUserAchievements(userProfile.id),
        getDailyQuests(userProfile.id),
      ]);

      // Merge unlocked achievements with all achievements
      const allAchievements = getAllAchievements();
      const unlockedMap = new Map(userAchievements.achievements.map(a => [a.id, a]));
      
      const merged = allAchievements.map(achievement => {
        const unlocked = unlockedMap.get(achievement.id);
        return unlocked || { ...achievement, progress: 0 };
      });

      setAchievements(merged);
      setDailyQuests(quests);
    } catch (error) {
      console.error('Error loading gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'from-amber-600 to-orange-600';
      case 'silver': return 'from-gray-400 to-gray-600';
      case 'gold': return 'from-yellow-400 to-yellow-600';
      case 'platinum': return 'from-cyan-400 to-blue-600';
      case 'diamond': return 'from-purple-400 to-pink-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'bronze': return '🥉';
      case 'silver': return '🥈';
      case 'gold': return '🥇';
      case 'platinum': return '💎';
      case 'diamond': return '💠';
      default: return '⭐';
    }
  };

  const categories = ['all', 'social', 'missions', 'rewards', 'events', 'exploration', 'streak', 'special'];

  const filteredAchievements = achievements.filter(a => 
    selectedCategory === 'all' || a.category === selectedCategory
  );

  const unlockedCount = achievements.filter(a => a.unlockedAt).length;
  const totalXp = achievements.filter(a => a.unlockedAt).reduce((sum, a) => sum + a.xpReward, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Gamification Hub</h2>
              <p className="text-sm opacity-90">Achievements, Quests & Rewards</p>
            </div>
          </div>
          
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
            <div className="text-xs opacity-90">Total XP Earned</div>
            <div className="text-2xl font-bold">{totalXp.toLocaleString()}</div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'achievements'
                ? 'bg-white text-[#6C4BFF]'
                : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            <Trophy className="w-4 h-4 inline mr-2" />
            Achievements ({unlockedCount}/{achievements.length})
          </button>
          <button
            onClick={() => setActiveTab('quests')}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'quests'
                ? 'bg-white text-[#6C4BFF]'
                : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            <Target className="w-4 h-4 inline mr-2" />
            Daily Quests ({dailyQuests.filter(q => q.completed).length}/{dailyQuests.length})
          </button>
          <button
            onClick={() => setActiveTab('battlepass')}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'battlepass'
                ? 'bg-white text-[#6C4BFF]'
                : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            <Zap className="w-4 h-4 inline mr-2" />
            Battle Pass
          </button>
        </div>
      </div>

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="space-y-4">
          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          {/* Achievements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map((achievement) => {
              const isUnlocked = !!achievement.unlockedAt;
              const isSecret = achievement.isSecret && !isUnlocked;

              return (
                <div
                  key={achievement.id}
                  className={`relative bg-white rounded-xl shadow-lg p-6 transition-all hover:shadow-xl ${
                    isUnlocked ? 'border-2 border-[#00E5FF]' : 'border border-gray-200'
                  } ${isSecret ? 'opacity-60' : ''}`}
                >
                  {isUnlocked && (
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] rounded-full p-1">
                      <Award className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    <div className={`text-4xl ${isSecret ? 'blur-sm' : ''}`}>
                      {isSecret ? '❓' : achievement.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-[#1E0E62]">
                          {isSecret ? '???' : achievement.title}
                        </h3>
                        <span className="text-xs">{getTierBadge(achievement.tier)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {isSecret ? 'Hidden achievement' : achievement.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm font-semibold text-[#6C4BFF]">
                          <Star className="w-4 h-4" />
                          <span>+{achievement.xpReward} XP</span>
                        </div>
                        
                        {isUnlocked ? (
                          <div className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                            <Award className="w-3 h-3" />
                            Unlocked!
                          </div>
                        ) : !isSecret && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Lock className="w-3 h-3" />
                            {achievement.progress || 0}/{achievement.requirement.target}
                          </div>
                        )}
                      </div>

                      {!isSecret && !isUnlocked && achievement.progress !== undefined && (
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full bg-gradient-to-r ${getTierColor(achievement.tier)}`}
                              style={{ width: `${Math.min((achievement.progress / achievement.requirement.target) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Daily Quests Tab */}
      {activeTab === 'quests' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#1E0E62]">Today's Quests</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Resets at midnight</span>
              </div>
            </div>

            <div className="space-y-4">
              {dailyQuests.map((quest) => (
                <div
                  key={quest.id}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    quest.completed
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                      : 'bg-gray-50 border-gray-200 hover:border-[#00E5FF]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{quest.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-[#1E0E62]">{quest.title}</h4>
                        <div className="flex items-center gap-1 text-sm font-semibold text-[#6C4BFF]">
                          <Star className="w-4 h-4" />
                          <span>+{quest.xpReward} XP</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{quest.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-gray-700">
                          Progress: {quest.progress}/{quest.target}
                        </div>
                        {quest.completed && (
                          <div className="flex items-center gap-1 text-sm text-green-600 font-semibold">
                            <Award className="w-4 h-4" />
                            Completed!
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all ${
                              quest.completed
                                ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                                : 'bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF]'
                            }`}
                            style={{ width: `${Math.min((quest.progress / quest.target) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Battle Pass Tab */}
      {activeTab === 'battlepass' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-center py-12">
            <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Battle Pass Coming Soon!</h3>
            <p className="text-gray-600 mb-4">
              Unlock exclusive rewards and climb through 30+ tiers of amazing prizes
            </p>
            <div className="text-sm text-gray-500">
              Launch Date: January 2026
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
