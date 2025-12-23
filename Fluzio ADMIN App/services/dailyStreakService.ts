/**
 * Daily Login Streak Service
 * Handles daily login rewards and streak tracking
 */

import { DailyStreakResult } from '../types';
import { captureError } from './sentryService';
import { createNotification } from './notificationService';

const CLOUD_FUNCTIONS_BASE_URL = 'https://us-central1-fluzio-13af2.cloudfunctions.net';

/**
 * Update daily login streak and claim reward points
 */
export async function claimDailyStreakReward(userId: string): Promise<DailyStreakResult> {
  try {
    const response = await fetch(`${CLOUD_FUNCTIONS_BASE_URL}/updatedailystreak`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to claim daily streak reward');
    }

    const result = await response.json();
    
    // Send notification on successful claim
    if (result.success && result.pointsAwarded) {
      const milestoneMsg = result.milestoneReached 
        ? ` 🎉 Milestone reached: ${result.milestoneReached} days!` 
        : '';
      
      await createNotification(userId, {
        type: 'STREAK_CLAIMED',
        title: `Daily Streak Claimed! 🔥`,
        message: `You earned ${result.pointsAwarded} points for your ${result.streak}-day streak!${milestoneMsg}`,
        actionLink: '/home'
      }).catch(err => console.error('Failed to send streak notification:', err));
    }
    
    return result;
  } catch (error) {
    console.error('[dailyStreakService] Error claiming streak:', error);
    
    // Track error in Sentry
    captureError(error as Error, {
      service: 'dailyStreakService',
      function: 'claimDailyStreakReward',
      userId,
    });
    
    throw error;
  }
}

/**
 * Calculate streak bonus preview (client-side estimation)
 */
export function calculateStreakBonus(streakDays: number): number {
  const basePoints = 5;
  const streakBonus = Math.min(Math.floor(streakDays / 7) * 5, 50);
  
  const milestones: Record<number, number> = {
    3: 20,
    7: 50,
    14: 100,
    30: 250,
    60: 500,
    100: 1000
  };
  
  const milestoneBonus = milestones[streakDays] || 0;
  return basePoints + streakBonus + milestoneBonus;
}

/**
 * Get next milestone info
 */
export function getNextMilestone(currentStreak: number): { day: number; points: number; daysUntil: number } | null {
  const milestones = [3, 7, 14, 30, 60, 100];
  const nextMilestone = milestones.find(m => m > currentStreak);
  
  if (!nextMilestone) return null;
  
  const milestonePoints: Record<number, number> = {
    3: 20,
    7: 50,
    14: 100,
    30: 250,
    60: 500,
    100: 1000
  };
  
  return {
    day: nextMilestone,
    points: milestonePoints[nextMilestone],
    daysUntil: nextMilestone - currentStreak
  };
}

/**
 * Check if user can claim today's streak reward
 */
export function canClaimToday(lastStreakRewardClaimed?: string): boolean {
  if (!lastStreakRewardClaimed) return true;
  
  const lastClaimed = new Date(lastStreakRewardClaimed).toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];
  
  return lastClaimed !== today;
}

/**
 * Get streak status message
 */
export function getStreakStatusMessage(
  loginStreak: number,
  lastStreakRewardClaimed?: string
): string {
  if (!canClaimToday(lastStreakRewardClaimed)) {
    return 'Claimed today ✓';
  }
  
  if (loginStreak === 0 || !loginStreak) {
    return 'Start your streak!';
  }
  
  const nextMilestone = getNextMilestone(loginStreak);
  if (nextMilestone && nextMilestone.daysUntil <= 3) {
    return `${nextMilestone.daysUntil} days to ${nextMilestone.points}pts!`;
  }
  
  return 'Claim daily reward!';
}
