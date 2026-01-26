import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Trophy, 
  TrendingUp, 
  Calendar,
  Plus,
  CheckCircle,
  X,
  Flag,
  Zap,
  Star,
  Award,
  Flame
} from 'lucide-react';
import {
  createGoal,
  getCreatorGoals,
  getCreatorAchievements,
  getGoalStats,
  updateGoalProgress,
  updateGoalStatus,
  addSubTask,
  toggleSubTask,
  deleteSubTask,
  CreatorGoal,
  CreatorAchievement,
  GoalStats,
  SubTask,
  GOAL_TEMPLATES
} from '../services/creatorGoalsService';

interface CreatorGoalsGamificationProps {
  creatorId: string;
  creatorName: string;
}

const CreatorGoalsGamification: React.FC<CreatorGoalsGamificationProps> = ({
  creatorId,
  creatorName
}) => {
  const [goals, setGoals] = useState<CreatorGoal[]>([]);
  const [achievements, setAchievements] = useState<CreatorAchievement[]>([]);
  const [stats, setStats] = useState<GoalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | CreatorGoal['status']>('ALL');
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const [newSubtaskText, setNewSubtaskText] = useState<{[key: string]: string}>({});

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'EARNINGS' as CreatorGoal['category'],
    targetValue: 0,
    unit: '$',
    deadlineDays: 30,
    priority: 'MEDIUM' as CreatorGoal['priority']
  });

  useEffect(() => {
    loadData();
  }, [creatorId, selectedFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [goalsData, achievementsData, statsData] = await Promise.all([
        getCreatorGoals(creatorId, selectedFilter === 'ALL' ? undefined : selectedFilter),
        getCreatorAchievements(creatorId),
        getGoalStats(creatorId)
      ]);
      setGoals(goalsData);
      setAchievements(achievementsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading goals data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!formData.title || formData.targetValue <= 0) {
      alert('Please fill in all required fields');
      return;
    }

    const result = await createGoal(
      creatorId,
      formData.title,
      formData.description,
      formData.category,
      formData.targetValue,
      formData.unit,
      formData.deadlineDays,
      formData.priority
    );

    if (result.success) {
      setShowCreateModal(false);
      resetForm();
      loadData();
    } else {
      alert(`Error creating goal: ${result.error}`);
    }
  };

  const handleUseTemplate = (template: typeof GOAL_TEMPLATES[0]) => {
    setFormData({
      title: template.title,
      description: template.description,
      category: template.category,
      targetValue: template.targetValue,
      unit: template.unit,
      deadlineDays: template.suggestedDeadlineDays,
      priority: 'MEDIUM'
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'EARNINGS',
      targetValue: 0,
      unit: '$',
      deadlineDays: 30,
      priority: 'MEDIUM'
    });
  };

  const handleAbandonGoal = async (goalId: string) => {
    if (confirm('Are you sure you want to abandon this goal?')) {
      await updateGoalStatus(goalId, 'ABANDONED');
      loadData();
    }
  };

  const toggleGoalExpanded = (goalId: string) => {
    const newExpanded = new Set(expandedGoals);
    if (newExpanded.has(goalId)) {
      newExpanded.delete(goalId);
    } else {
      newExpanded.add(goalId);
    }
    setExpandedGoals(newExpanded);
  };

  const handleAddSubtask = async (goalId: string) => {
    const text = newSubtaskText[goalId]?.trim();
    if (!text) return;

    const result = await addSubTask(goalId, text);
    if (result.success) {
      setNewSubtaskText({ ...newSubtaskText, [goalId]: '' });
      loadData();
    } else {
      alert(`Error adding subtask: ${result.error}`);
    }
  };

  const handleToggleSubtask = async (goalId: string, subtaskId: string) => {
    const result = await toggleSubTask(goalId, subtaskId);
    if (result.success) {
      loadData();
    }
  };

  const handleDeleteSubtask = async (goalId: string, subtaskId: string) => {
    const result = await deleteSubTask(goalId, subtaskId);
    if (result.success) {
      loadData();
    }
  };

  const getPriorityColor = (priority: CreatorGoal['priority']) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600 bg-red-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-green-600 bg-green-100';
    }
  };

  const getStatusColor = (status: CreatorGoal['status']) => {
    switch (status) {
      case 'COMPLETED': return 'text-emerald-600 bg-emerald-100';
      case 'ACTIVE': return 'text-blue-600 bg-blue-100';
      case 'FAILED': return 'text-red-600 bg-red-100';
      case 'ABANDONED': return 'text-gray-600 bg-gray-100';
    }
  };

  const getRarityColor = (rarity: CreatorAchievement['rarity']) => {
    switch (rarity) {
      case 'LEGENDARY': return 'from-yellow-400 to-orange-500';
      case 'EPIC': return 'from-purple-400 to-pink-500';
      case 'RARE': return 'from-blue-400 to-cyan-500';
      case 'COMMON': return 'from-gray-400 to-gray-500';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getDaysRemaining = (deadline: any) => {
    const deadlineDate = deadline.toDate ? deadline.toDate() : new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Dashboard */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <Target className="w-6 h-6 mb-2 opacity-90" />
            <p className="text-2xl font-bold">{stats.activeGoals}</p>
            <p className="text-xs opacity-75">Active Goals</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
            <CheckCircle className="w-6 h-6 mb-2 opacity-90" />
            <p className="text-2xl font-bold">{stats.completedGoals}</p>
            <p className="text-xs opacity-75">Completed</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
            <Trophy className="w-6 h-6 mb-2 opacity-90" />
            <p className="text-2xl font-bold">{stats.totalAchievements}</p>
            <p className="text-xs opacity-75">Achievements</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
            <Flame className="w-6 h-6 mb-2 opacity-90" />
            <p className="text-2xl font-bold">{stats.currentStreak}</p>
            <p className="text-xs opacity-75">Day Streak</p>
          </div>
        </div>
      )}

      {/* Progress Overview */}
      {stats && stats.totalGoals > 0 && (
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Overall Progress</h3>
            <span className="text-2xl font-bold text-emerald-600">{Math.round(stats.completionRate)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-green-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">
            {stats.completedGoals} of {stats.totalGoals} goals completed
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['ALL', 'ACTIVE', 'COMPLETED', 'FAILED'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedFilter === filter
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Goal
        </button>
      </div>

      {/* Goals List */}
      <div className="space-y-3">
        {goals.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No goals found</p>
            <p className="text-sm text-gray-500 mt-1">Create your first goal to get started</p>
          </div>
        ) : (
          goals.map(goal => {
            const daysRemaining = getDaysRemaining(goal.deadline);
            const isOverdue = daysRemaining < 0;
            
            return (
              <div key={goal.id} className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-indigo-300 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{goal.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(goal.status)}`}>
                        {goal.status}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(goal.priority)}`}>
                        {goal.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                    
                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-bold text-gray-900">
                          {goal.currentValue.toFixed(0)} / {goal.targetValue.toFixed(0)} {goal.unit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            goal.progress >= 100 ? 'bg-emerald-500' : 
                            goal.progress >= 75 ? 'bg-blue-500' :
                            goal.progress >= 50 ? 'bg-yellow-500' :
                            'bg-gray-400'
                          }`}
                          style={{ width: `${Math.min(100, goal.progress)}%` }}
                        />
                      </div>
                    </div>

                    {/* Milestones */}
                    <div className="flex gap-2 mb-3">
                      {goal.milestones.map((milestone, idx) => (
                        <div 
                          key={idx}
                          className={`flex-1 p-2 rounded-lg text-center text-xs ${
                            milestone.achieved 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          <div className="font-bold">{milestone.percentage}%</div>
                          {milestone.achieved && <CheckCircle className="w-3 h-3 mx-auto mt-1" />}
                        </div>
                      ))}
                    </div>

                    {/* Deadline */}
                    <div className={`flex items-center gap-2 text-sm ${
                      isOverdue ? 'text-red-600' : daysRemaining <= 7 ? 'text-orange-600' : 'text-gray-600'
                    }`}>
                      <Calendar className="w-4 h-4" />
                      <span>
                        {isOverdue 
                          ? `Overdue by ${Math.abs(daysRemaining)} days` 
                          : `${daysRemaining} days remaining`}
                      </span>
                    </div>
                  </div>

                  {goal.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleAbandonGoal(goal.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Abandon goal"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Subtasks Section */}
                {goal.status === 'ACTIVE' && (
                  <div className="mt-4 border-t pt-4">
                    <button
                      onClick={() => toggleGoalExpanded(goal.id)}
                      className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 mb-3"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Subtasks ({(goal.subtasks || []).filter(st => st.completed).length}/{(goal.subtasks || []).length})</span>
                      <span className="text-gray-400">{expandedGoals.has(goal.id) ? '▼' : '▶'}</span>
                    </button>

                    {expandedGoals.has(goal.id) && (
                      <div className="space-y-2">
                        {/* Existing Subtasks */}
                        {(goal.subtasks || []).map(subtask => (
                          <div key={subtask.id} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg group">
                            <input
                              type="checkbox"
                              checked={subtask.completed}
                              onChange={() => handleToggleSubtask(goal.id, subtask.id)}
                              className="w-4 h-4 text-indigo-600 rounded"
                            />
                            <span className={`flex-1 text-sm ${
                              subtask.completed ? 'line-through text-gray-400' : 'text-gray-700'
                            }`}>
                              {subtask.title}
                            </span>
                            <button
                              onClick={() => handleDeleteSubtask(goal.id, subtask.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}

                        {/* Add Subtask Input */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newSubtaskText[goal.id] || ''}
                            onChange={(e) => setNewSubtaskText({ ...newSubtaskText, [goal.id]: e.target.value })}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask(goal.id)}
                            placeholder="Add a subtask..."
                            className="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                          <button
                            onClick={() => handleAddSubtask(goal.id)}
                            className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Achievements Showcase */}
      {achievements.length > 0 && (
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            Recent Achievements
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {achievements.slice(0, 8).map(achievement => (
              <div 
                key={achievement.id}
                className={`bg-gradient-to-br ${getRarityColor(achievement.rarity)} p-4 rounded-xl text-white text-center`}
              >
                <div className="text-3xl mb-2">{achievement.icon}</div>
                <p className="text-sm font-bold mb-1">{achievement.title}</p>
                <p className="text-xs opacity-90 mb-2">{achievement.description}</p>
                <div className="flex items-center justify-center gap-1 text-xs">
                  <Star className="w-3 h-3" />
                  <span>{achievement.points} pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Goal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Create New Goal</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Templates */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Start Templates
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {GOAL_TEMPLATES.map((template, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleUseTemplate(template)}
                      className="p-3 text-left bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-200 rounded-lg transition-colors"
                    >
                      <p className="text-sm font-semibold text-indigo-900">{template.title}</p>
                      <p className="text-xs text-indigo-600 mt-1">{template.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Goal Form */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Or Create Custom Goal</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Goal Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                      placeholder="e.g., Earn $10,000 this quarter"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                      rows={3}
                      placeholder="Describe what you want to achieve..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="EARNINGS">Earnings</option>
                        <option value="PROJECTS">Projects</option>
                        <option value="RATING">Rating</option>
                        <option value="SKILLS">Skills</option>
                        <option value="CLIENTS">Clients</option>
                        <option value="CUSTOM">Custom</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Value *
                      </label>
                      <input
                        type="number"
                        value={formData.targetValue}
                        onChange={(e) => setFormData({ ...formData, targetValue: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                        placeholder="10000"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit
                      </label>
                      <input
                        type="text"
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                        placeholder="$, projects, points"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deadline (days from now) *
                    </label>
                    <input
                      type="number"
                      value={formData.deadlineDays}
                      onChange={(e) => setFormData({ ...formData, deadlineDays: parseInt(e.target.value) || 30 })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                      placeholder="30"
                      min="1"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGoal}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                >
                  Create Goal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorGoalsGamification;
