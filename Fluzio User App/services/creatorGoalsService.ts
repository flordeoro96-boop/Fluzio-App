/**
 * Creator Goals Gamification Service
 * 
 * Goal setting, tracking, achievements, and milestone rewards for creators.
 * Helps creators stay motivated and track their professional growth.
 */

import { db } from './apiService';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  orderBy,
  limit,
  Timestamp,
  getDoc
} from '../services/firestoreCompat';

export interface SubTask {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: Timestamp;
  createdAt: Timestamp;
}

export interface CreatorGoal {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  category: 'EARNINGS' | 'PROJECTS' | 'RATING' | 'SKILLS' | 'CLIENTS' | 'CUSTOM';
  targetValue: number;
  currentValue: number;
  unit: string; // '$', 'projects', 'points', 'clients'
  progress: number; // 0-100
  deadline: Timestamp;
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'ABANDONED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  reward?: string;
  milestones: GoalMilestone[];
  subtasks: SubTask[];
  createdAt: Timestamp;
  completedAt?: Timestamp;
}

export interface GoalMilestone {
  percentage: number; // 25, 50, 75, 100
  value: number;
  achieved: boolean;
  achievedAt?: Timestamp;
  reward?: string;
}

export interface CreatorAchievement {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  earnedAt: Timestamp;
  points: number;
}

export interface GoalStats {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  failedGoals: number;
  completionRate: number;
  totalAchievements: number;
  totalPoints: number;
  currentStreak: number; // days with goal progress
  longestStreak: number;
}

export interface GoalTemplate {
  title: string;
  description: string;
  category: CreatorGoal['category'];
  targetValue: number;
  unit: string;
  suggestedDeadlineDays: number;
}

/**
 * Predefined goal templates for quick setup
 */
export const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    title: 'Earn $5,000 this month',
    description: 'Reach a monthly earnings goal of $5,000',
    category: 'EARNINGS',
    targetValue: 5000,
    unit: '$',
    suggestedDeadlineDays: 30
  },
  {
    title: 'Complete 10 projects',
    description: 'Finish 10 client projects successfully',
    category: 'PROJECTS',
    targetValue: 10,
    unit: 'projects',
    suggestedDeadlineDays: 60
  },
  {
    title: 'Reach 4.8 rating',
    description: 'Maintain a client satisfaction rating of 4.8 or higher',
    category: 'RATING',
    targetValue: 4.8,
    unit: 'stars',
    suggestedDeadlineDays: 90
  },
  {
    title: 'Learn 3 new skills',
    description: 'Add 3 new professional skills to your portfolio',
    category: 'SKILLS',
    targetValue: 3,
    unit: 'skills',
    suggestedDeadlineDays: 60
  },
  {
    title: 'Acquire 20 new clients',
    description: 'Build relationships with 20 new clients',
    category: 'CLIENTS',
    targetValue: 20,
    unit: 'clients',
    suggestedDeadlineDays: 90
  }
];

/**
 * Create a new goal
 */
export const createGoal = async (
  creatorId: string,
  title: string,
  description: string,
  category: CreatorGoal['category'],
  targetValue: number,
  unit: string,
  deadlineDays: number,
  priority: CreatorGoal['priority'] = 'MEDIUM'
): Promise<{ success: boolean; goalId?: string; error?: string }> => {
  try {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + deadlineDays);

    // Generate milestones at 25%, 50%, 75%, 100%
    const milestones: GoalMilestone[] = [25, 50, 75, 100].map(percentage => ({
      percentage,
      value: (targetValue * percentage) / 100,
      achieved: false,
      reward: percentage === 100 ? '🏆 Goal Completed!' : `${percentage}% Milestone`
    }));

    const goal: Omit<CreatorGoal, 'id'> = {
      creatorId,
      title,
      description,
      category,
      targetValue,
      currentValue: 0,
      unit,
      progress: 0,
      deadline: Timestamp.fromDate(deadline),
      status: 'ACTIVE',
      priority,
      milestones,
      subtasks: [],
      createdAt: serverTimestamp() as Timestamp
    };

    const docRef = await addDoc(collection(db, 'creatorGoals'), goal);
    return { success: true, goalId: docRef.id };
  } catch (error) {
    console.error('[GoalsService] Error creating goal:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Update goal progress
 */
export const updateGoalProgress = async (
  goalId: string,
  newValue: number
): Promise<{ success: boolean; milestonesAchieved?: number[]; error?: string }> => {
  try {
    const goalRef = doc(db, 'creatorGoals', goalId);
    const goalSnap = await getDoc(goalRef);
    
    if (!goalSnap.exists()) {
      return { success: false, error: 'Goal not found' };
    }

    const goal = goalSnap.data() as CreatorGoal;
    const progress = Math.min(100, (newValue / goal.targetValue) * 100);
    
    // Check for newly achieved milestones
    const milestonesAchieved: number[] = [];
    const updatedMilestones = goal.milestones.map(milestone => {
      if (!milestone.achieved && newValue >= milestone.value) {
        milestonesAchieved.push(milestone.percentage);
        return { ...milestone, achieved: true, achievedAt: Timestamp.now() };
      }
      return milestone;
    });

    const updateData: any = {
      currentValue: newValue,
      progress,
      milestones: updatedMilestones
    };

    // Check if goal is completed
    if (progress >= 100 && goal.status === 'ACTIVE') {
      updateData.status = 'COMPLETED';
      updateData.completedAt = serverTimestamp();
      
      // Award achievement
      await awardAchievement(goal.creatorId, {
        title: `Goal Achieved: ${goal.title}`,
        description: goal.description,
        icon: '🎯',
        category: goal.category,
        rarity: 'RARE',
        points: 100
      });
    }

    await updateDoc(goalRef, updateData);
    return { success: true, milestonesAchieved };
  } catch (error) {
    console.error('[GoalsService] Error updating goal:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Get goals for creator
 */
export const getCreatorGoals = async (
  creatorId: string,
  status?: CreatorGoal['status']
): Promise<CreatorGoal[]> => {
  try {
    const goalsRef = collection(db, 'creatorGoals');
    let q = query(
      goalsRef,
      where('creatorId', '==', creatorId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    if (status) {
      q = query(
        goalsRef,
        where('creatorId', '==', creatorId),
        where('status', '==', status),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CreatorGoal));
  } catch (error) {
    console.error('[GoalsService] Error getting goals:', error);
    return [];
  }
};

/**
 * Update goal status
 */
export const updateGoalStatus = async (
  goalId: string,
  status: CreatorGoal['status']
): Promise<{ success: boolean; error?: string }> => {
  try {
    const goalRef = doc(db, 'creatorGoals', goalId);
    const updateData: any = { status };

    if (status === 'COMPLETED') {
      updateData.completedAt = serverTimestamp();
    }

    await updateDoc(goalRef, updateData);
    return { success: true };
  } catch (error) {
    console.error('[GoalsService] Error updating status:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Award achievement to creator
 */
export const awardAchievement = async (
  creatorId: string,
  achievement: Omit<CreatorAchievement, 'id' | 'creatorId' | 'earnedAt'>
): Promise<{ success: boolean; achievementId?: string; error?: string }> => {
  try {
    const newAchievement = {
      ...achievement,
      creatorId,
      earnedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'creatorAchievements'), newAchievement);
    return { success: true, achievementId: docRef.id };
  } catch (error) {
    console.error('[GoalsService] Error awarding achievement:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Add a subtask to a goal
 */
export const addSubTask = async (
  goalId: string,
  title: string,
  description?: string
): Promise<{ success: boolean; error?: string; subtaskId?: string }> => {
  try {
    const goalRef = doc(db, 'creatorGoals', goalId);
    const goalDoc = await getDoc(goalRef);
    
    if (!goalDoc.exists()) {
      return { success: false, error: 'Goal not found' };
    }

    const goal = goalDoc.data() as CreatorGoal;
    const newSubtask: SubTask = {
      id: `subtask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      completed: false,
      createdAt: Timestamp.now()
    };

    const updatedSubtasks = [...(goal.subtasks || []), newSubtask];
    
    await updateDoc(goalRef, {
      subtasks: updatedSubtasks
    });

    return { success: true, subtaskId: newSubtask.id };
  } catch (error) {
    console.error('[GoalsService] Error adding subtask:', error);
    return { success: false, error: 'Failed to add subtask' };
  }
};

/**
 * Toggle subtask completion
 */
export const toggleSubTask = async (
  goalId: string,
  subtaskId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const goalRef = doc(db, 'creatorGoals', goalId);
    const goalDoc = await getDoc(goalRef);
    
    if (!goalDoc.exists()) {
      return { success: false, error: 'Goal not found' };
    }

    const goal = goalDoc.data() as CreatorGoal;
    const updatedSubtasks = (goal.subtasks || []).map(subtask => {
      if (subtask.id === subtaskId) {
        return {
          ...subtask,
          completed: !subtask.completed,
          completedAt: !subtask.completed ? Timestamp.now() : undefined
        };
      }
      return subtask;
    });
    
    await updateDoc(goalRef, {
      subtasks: updatedSubtasks
    });

    return { success: true };
  } catch (error) {
    console.error('[GoalsService] Error toggling subtask:', error);
    return { success: false, error: 'Failed to toggle subtask' };
  }
};

/**
 * Delete a subtask
 */
export const deleteSubTask = async (
  goalId: string,
  subtaskId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const goalRef = doc(db, 'creatorGoals', goalId);
    const goalDoc = await getDoc(goalRef);
    
    if (!goalDoc.exists()) {
      return { success: false, error: 'Goal not found' };
    }

    const goal = goalDoc.data() as CreatorGoal;
    const updatedSubtasks = (goal.subtasks || []).filter(subtask => subtask.id !== subtaskId);
    
    await updateDoc(goalRef, {
      subtasks: updatedSubtasks
    });

    return { success: true };
  } catch (error) {
    console.error('[GoalsService] Error deleting subtask:', error);
    return { success: false, error: 'Failed to delete subtask' };
  }
};

/**
 * Get creator achievements
 */
export const getCreatorAchievements = async (creatorId: string): Promise<CreatorAchievement[]> => {
  try {
    const achievementsRef = collection(db, 'creatorAchievements');
    const q = query(
      achievementsRef,
      where('creatorId', '==', creatorId),
      orderBy('earnedAt', 'desc'),
      limit(100)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CreatorAchievement));
  } catch (error) {
    console.error('[GoalsService] Error getting achievements:', error);
    return [];
  }
};

/**
 * Get goal statistics
 */
export const getGoalStats = async (creatorId: string): Promise<GoalStats> => {
  try {
    const goals = await getCreatorGoals(creatorId);
    const achievements = await getCreatorAchievements(creatorId);

    const activeGoals = goals.filter(g => g.status === 'ACTIVE').length;
    const completedGoals = goals.filter(g => g.status === 'COMPLETED').length;
    const failedGoals = goals.filter(g => g.status === 'FAILED').length;
    const completionRate = goals.length > 0 ? (completedGoals / goals.length) * 100 : 0;
    const totalPoints = achievements.reduce((sum, a) => sum + a.points, 0);

    // Calculate streak (mock implementation - would track daily progress)
    const currentStreak = 7; // Mock data
    const longestStreak = 14; // Mock data

    return {
      totalGoals: goals.length,
      activeGoals,
      completedGoals,
      failedGoals,
      completionRate,
      totalAchievements: achievements.length,
      totalPoints,
      currentStreak,
      longestStreak
    };
  } catch (error) {
    console.error('[GoalsService] Error getting stats:', error);
    return {
      totalGoals: 0,
      activeGoals: 0,
      completedGoals: 0,
      failedGoals: 0,
      completionRate: 0,
      totalAchievements: 0,
      totalPoints: 0,
      currentStreak: 0,
      longestStreak: 0
    };
  }
};

/**
 * Check and update overdue goals
 */
export const checkOverdueGoals = async (creatorId: string): Promise<void> => {
  try {
    const activeGoals = await getCreatorGoals(creatorId, 'ACTIVE');
    const now = new Date();

    for (const goal of activeGoals) {
      const deadline = goal.deadline.toDate();
      if (deadline < now && goal.progress < 100) {
        await updateGoalStatus(goal.id, 'FAILED');
      }
    }
  } catch (error) {
    console.error('[GoalsService] Error checking overdue goals:', error);
  }
};
