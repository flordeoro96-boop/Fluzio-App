import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Award, Flame, Star, Calendar, Target } from 'lucide-react';
import { getUserProgression, getLevelProgress } from '../services/progressionService';
import { PassportStamp } from '../types';

interface UserStatsBarProps {
  userId: string;
  onViewPassport?: () => void;
}

export function UserStatsBar({ userId, onViewPassport }: UserStatsBarProps) {
  const { t } = useTranslation();
  const [stats, setStats] = useState<{
    totalXP: number;
    level: number;
    passportStamps: PassportStamp[];
    badges: string[];
    meetupsCompleted: number;
    currentStreak: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [userId]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const progression = await getUserProgression(userId);
      if (progression) {
        setStats(progression);
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 animate-pulse">
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const levelProgress = getLevelProgress(stats.totalXP, stats.level);

  return (
    <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 rounded-xl p-4 text-white shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center font-bold text-lg">
            {stats.level}
          </div>
          <div>
            <p className="text-sm text-white/80">{t('userStats.level', { level: stats.level })}</p>
            <p className="text-xs text-white/60">
              {Math.round(levelProgress.currentLevelXP)} / {Math.round(levelProgress.nextLevelXP)} XP
            </p>
          </div>
        </div>

        {/* Streak */}
        {stats.currentStreak > 0 && (
          <div className="flex items-center gap-1 bg-orange-500/30 backdrop-blur-sm px-3 py-1 rounded-full">
            <Flame className="w-4 h-4 text-orange-200" />
            <span className="font-bold">{stats.currentStreak}</span>
            <span className="text-xs text-white/80">{t('userStats.dayStreak')}</span>
          </div>
        )}
      </div>

      {/* XP Progress Bar */}
      <div className="mb-3">
        <div className="bg-white/20 backdrop-blur-sm rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${levelProgress.progress}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={onViewPassport}
          className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center hover:bg-white/20 transition-all"
        >
          <div className="text-lg mb-1">🎫</div>
          <p className="text-xs text-white/80">{t('userStats.stamps')}</p>
          <p className="font-bold text-sm">{stats.passportStamps.length}/10</p>
        </button>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
          <Award className="w-5 h-5 mx-auto mb-1 text-yellow-300" />
          <p className="text-xs text-white/80">{t('userStats.badges')}</p>
          <p className="font-bold text-sm">{stats.badges.length}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
          <Calendar className="w-5 h-5 mx-auto mb-1" />
          <p className="text-xs text-white/80">{t('userStats.meetups')}</p>
          <p className="font-bold text-sm">{stats.meetupsCompleted}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
          <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-300" />
          <p className="text-xs text-white/80">{t('userStats.totalXp')}</p>
          <p className="font-bold text-sm">{stats.totalXP}</p>
        </div>
      </div>

      {/* New Badge Notification */}
      {stats.badges.length > 0 && (
        <div className="mt-3 bg-yellow-400/20 backdrop-blur-sm rounded-lg p-2 flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-300" />
          <p className="text-xs text-white/90">{t('userStats.latestBadge', { badge: stats.badges[stats.badges.length - 1] })}</p>
        </div>
      )}
    </div>
  );
}
