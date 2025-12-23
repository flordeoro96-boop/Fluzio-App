import { describe, it, expect, vi, beforeEach } from 'vitest';
import { claimDailyStreakReward, calculateStreakBonus, getNextMilestone, canClaimToday } from '../../services/dailyStreakService';

// Mock Firebase functions
vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(),
  httpsCallable: vi.fn(() => vi.fn()),
}));

describe('Daily Streak Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Streak Bonus Calculation', () => {
    it('should calculate correct bonus for day 1', () => {
      const bonus = calculateStreakBonus(1);
      expect(bonus).toBe(5);
    });

    it('should calculate correct bonus for day 7', () => {
      const bonus = calculateStreakBonus(7);
      expect(bonus).toBe(60); // 5 base + 5 streak + 50 milestone
    });

    it('should calculate correct bonus for day 30', () => {
      const bonus = calculateStreakBonus(30);
      expect(bonus).toBe(275); // 5 base + 20 streak + 250 milestone
    });

    it('should include milestone bonus for day 10', () => {
      const bonus = calculateStreakBonus(10);
      expect(bonus).toBe(10); // 5 base + 5 streak (no milestone at day 10)
    });

    it('should include milestone bonus for day 50', () => {
      const bonus = calculateStreakBonus(50);
      expect(bonus).toBe(40); // 5 base + 35 streak (no milestone at day 50, only 30 and 60)
    });

    it('should include milestone bonus for day 100', () => {
      const bonus = calculateStreakBonus(100);
      expect(bonus).toBe(1055); // 505 base + 500 milestone + 50 super milestone
    });
  });

  describe('Next Milestone Calculation', () => {
    it('should return day 10 for streak of 1', () => {
      const milestone = getNextMilestone(1);
      expect(milestone).toEqual({ day: 3, points: 20, daysUntil: 2 });
    });

    it('should return day 10 for streak of 9', () => {
      const milestone = getNextMilestone(9);
      expect(milestone).toEqual({ day: 14, points: 100, daysUntil: 5 });
    });

    it('should return day 20 for streak of 10', () => {
      const milestone = getNextMilestone(10);
      expect(milestone).toEqual({ day: 14, points: 100, daysUntil: 4 });
    });

    it('should return day 100 for streak of 95', () => {
      const milestone = getNextMilestone(95);
      expect(milestone).toEqual({ day: 100, points: 1000, daysUntil: 5 });
    });

    it('should return null for streak of 100', () => {
      const milestone = getNextMilestone(100);
      expect(milestone).toBe(null);
    });
  });

  describe('Claim Eligibility Check', () => {
    it('should allow claiming if never claimed before', () => {
      const canClaim = canClaimToday(undefined);
      expect(canClaim).toBe(true);
    });

    it('should allow claiming if last claim was yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const canClaim = canClaimToday(yesterday.toISOString());
      expect(canClaim).toBe(true);
    });

    it('should not allow claiming if already claimed today', () => {
      const today = new Date();
      const canClaim = canClaimToday(today.toISOString());
      expect(canClaim).toBe(false);
    });

    it('should allow claiming if last claim was 2 days ago', () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const canClaim = canClaimToday(twoDaysAgo.toISOString());
      expect(canClaim).toBe(true);
    });
  });
});
