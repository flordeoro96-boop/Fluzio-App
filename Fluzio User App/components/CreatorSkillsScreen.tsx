import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../types';
import { Card, Button, Input, Modal } from './Common';
import { 
  Plus, X, Search, Camera, Video, Palette, Code, 
  Megaphone, TrendingUp, Coffee, Briefcase, Star, 
  CheckCircle2, ArrowLeft, Edit2, Trash2
} from 'lucide-react';
import { api } from '../services/AuthContext';
import { useAuth } from '../services/AuthContext';

interface CreatorSkillsScreenProps {
  user: User;
  onBack: () => void;
}

interface Skill {
  id: string;
  name: string;
  category: string;
  proficiency: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  yearsOfExperience?: number;
}

const SKILL_CATEGORIES = [
  { id: 'CONTENT_CREATION', name: 'Content Creation', icon: Camera, color: 'text-pink-600 bg-pink-50' },
  { id: 'VIDEO_PRODUCTION', name: 'Video & Film', icon: Video, color: 'text-purple-600 bg-purple-50' },
  { id: 'DESIGN', name: 'Design & Graphics', icon: Palette, color: 'text-blue-600 bg-blue-50' },
  { id: 'TECH', name: 'Tech & Development', icon: Code, color: 'text-green-600 bg-green-50' },
  { id: 'MARKETING', name: 'Marketing & Growth', icon: Megaphone, color: 'text-orange-600 bg-orange-50' },
  { id: 'BUSINESS', name: 'Business & Strategy', icon: Briefcase, color: 'text-indigo-600 bg-indigo-50' },
  { id: 'OTHER', name: 'Other Skills', icon: Star, color: 'text-yellow-600 bg-yellow-50' },
];

const SKILL_SUGGESTIONS: Record<string, string[]> = {
  CONTENT_CREATION: [
    'Photography', 'Copywriting', 'Blogging', 'Podcasting', 
    'Social Media Management', 'Influencer Marketing', 'Content Strategy'
  ],
  VIDEO_PRODUCTION: [
    'Videography', 'Video Editing', 'Animation', 'Cinematography',
    'Live Streaming', 'Sound Design', 'Directing'
  ],
  DESIGN: [
    'Graphic Design', 'UI/UX Design', 'Brand Design', 'Illustration',
    'Motion Graphics', 'Photo Editing', '3D Modeling'
  ],
  TECH: [
    'Web Development', 'App Development', 'SEO', 'Data Analysis',
    'AI/ML', 'Automation', 'WordPress'
  ],
  MARKETING: [
    'Digital Marketing', 'Email Marketing', 'Growth Hacking', 'Analytics',
    'Paid Advertising', 'Community Management', 'PR'
  ],
  BUSINESS: [
    'Project Management', 'Consulting', 'Sales', 'Entrepreneurship',
    'Event Planning', 'Partnerships', 'Product Management'
  ],
  OTHER: [
    'Public Speaking', 'Translation', 'Research', 'Coaching',
    'Networking', 'Crisis Management'
  ]
};

export const CreatorSkillsScreen: React.FC<CreatorSkillsScreenProps> = ({ user, onBack }) => {
  const { userProfile, refreshUserProfile } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [customSkillName, setCustomSkillName] = useState('');
  const [selectedProficiency, setSelectedProficiency] = useState<Skill['proficiency']>('INTERMEDIATE');
  const [yearsExperience, setYearsExperience] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);

  useEffect(() => {
    // Load skills from user profile
    if (userProfile?.skills) {
      const loadedSkills: Skill[] = userProfile.skills.map((skill: any, index: number) => ({
        id: skill.id || `skill-${index}`,
        name: skill.name || skill,
        category: skill.category || 'OTHER',
        proficiency: skill.proficiency || 'INTERMEDIATE',
        yearsOfExperience: skill.yearsOfExperience || 1
      }));
      setSkills(loadedSkills);
    }
  }, [userProfile]);

  const handleAddSkill = async (skillName: string) => {
    if (!skillName.trim() || !selectedCategory) return;

    const newSkill: Skill = {
      id: `skill-${Date.now()}`,
      name: skillName.trim(),
      category: selectedCategory,
      proficiency: selectedProficiency,
      yearsOfExperience: yearsExperience
    };

    const updatedSkills = [...skills, newSkill];
    setSkills(updatedSkills);
    
    // Save to Firestore
    await saveSkills(updatedSkills);
    
    // Reset form
    setCustomSkillName('');
    setSelectedCategory(null);
    setIsAddingSkill(false);
  };

  const handleUpdateSkill = async (skillId: string) => {
    if (!editingSkill) return;

    const updatedSkills = skills.map(s => 
      s.id === skillId ? editingSkill : s
    );
    setSkills(updatedSkills);
    await saveSkills(updatedSkills);
    setEditingSkill(null);
  };

  const handleDeleteSkill = async (skillId: string) => {
    const confirmed = confirm('Remove this skill from your profile?');
    if (!confirmed) return;

    const updatedSkills = skills.filter(s => s.id !== skillId);
    setSkills(updatedSkills);
    await saveSkills(updatedSkills);
  };

  const saveSkills = async (updatedSkills: Skill[]) => {
    setIsSaving(true);
    try {
      await api.updateUser(user.id, { 
        skills: updatedSkills.map(s => ({
          id: s.id,
          name: s.name,
          category: s.category,
          proficiency: s.proficiency,
          yearsOfExperience: s.yearsOfExperience
        }))
      });
      await refreshUserProfile();
    } catch (error) {
      console.error('Failed to save skills:', error);
      alert('Failed to save skills. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getProficiencyColor = (proficiency: string) => {
    switch (proficiency) {
      case 'BEGINNER': return 'bg-gray-100 text-gray-600';
      case 'INTERMEDIATE': return 'bg-blue-100 text-blue-600';
      case 'ADVANCED': return 'bg-purple-100 text-purple-600';
      case 'EXPERT': return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getProficiencyStars = (proficiency: string) => {
    switch (proficiency) {
      case 'BEGINNER': return 1;
      case 'INTERMEDIATE': return 2;
      case 'ADVANCED': return 3;
      case 'EXPERT': return 4;
      default: return 2;
    }
  };

  const filteredSuggestions = selectedCategory && SKILL_SUGGESTIONS[selectedCategory]
    ? SKILL_SUGGESTIONS[selectedCategory].filter(s => 
        s.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const skillsByCategory = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  return (
    <div className="fixed inset-0 bg-[#F8F9FE] z-50 overflow-y-auto pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-clash font-bold text-[#1E0E62]">My Skills</h1>
                <p className="text-sm text-[#8F8FA3] font-medium">
                  {skills.length} skill{skills.length !== 1 ? 's' : ''} • Showcase your expertise
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsAddingSkill(true)}
              variant="gradient"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Skill
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        
        {/* Empty State */}
        {skills.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Star className="w-10 h-10 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-[#1E0E62] mb-2">Add Your First Skill</h2>
            <p className="text-[#8F8FA3] mb-6 max-w-md mx-auto">
              Showcase your expertise to businesses. The more skills you add, the better your matches!
            </p>
            <Button
              onClick={() => setIsAddingSkill(true)}
              variant="gradient"
              className="inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Get Started
            </Button>
          </div>
        )}

        {/* Skills by Category */}
        {Object.keys(skillsByCategory).map(categoryId => {
          const category = SKILL_CATEGORIES.find(c => c.id === categoryId);
          if (!category) return null;

          const categorySkills = skillsByCategory[categoryId];
          const Icon = category.icon;

          return (
            <div key={categoryId} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl ${category.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1E0E62]">{category.name}</h3>
                  <p className="text-xs text-[#8F8FA3]">{categorySkills.length} skill{categorySkills.length !== 1 ? 's' : ''}</p>
                </div>
              </div>

              <div className="grid gap-3">
                {categorySkills.map(skill => (
                  <Card key={skill.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-bold text-[#1E0E62]">{skill.name}</h4>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${getProficiencyColor(skill.proficiency)}`}>
                            {skill.proficiency}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-[#8F8FA3]">
                          {/* Star Rating */}
                          <div className="flex items-center gap-1">
                            {Array.from({ length: getProficiencyStars(skill.proficiency) }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            ))}
                            {Array.from({ length: 4 - getProficiencyStars(skill.proficiency) }).map((_, i) => (
                              <Star key={i + 10} className="w-3 h-3 text-gray-300" />
                            ))}
                          </div>
                          {skill.yearsOfExperience && (
                            <span>• {skill.yearsOfExperience} year{skill.yearsOfExperience > 1 ? 's' : ''} experience</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingSkill(skill)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-[#6C4BFF]"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSkill(skill.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Skill Modal */}
      <Modal
        isOpen={isAddingSkill}
        onClose={() => {
          setIsAddingSkill(false);
          setSelectedCategory(null);
          setCustomSkillName('');
          setSearchQuery('');
        }}
        title="Add a New Skill"
      >
        <div className="space-y-6">
          {/* Step 1: Select Category */}
          {!selectedCategory && (
            <>
              <p className="text-sm text-[#8F8FA3]">Choose a category for your skill</p>
              <div className="grid grid-cols-2 gap-3">
                {SKILL_CATEGORIES.map(category => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${category.color} border-transparent hover:scale-105`}
                    >
                      <Icon className="w-6 h-6 mx-auto mb-2" />
                      <div className="text-xs font-bold text-center">{category.name}</div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Step 2: Select or Enter Skill */}
          {selectedCategory && (
            <>
              <div>
                <label className="text-sm font-bold text-[#1E0E62] mb-2 block">Search or create skill</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery || customSkillName}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCustomSkillName(e.target.value);
                    }}
                    placeholder="Type to search or add custom skill..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#6C4BFF] outline-none"
                  />
                </div>
              </div>

              {/* Skill Suggestions */}
              {filteredSuggestions.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-[#8F8FA3] uppercase tracking-wider mb-2 block">
                    Popular Skills
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {filteredSuggestions.map(suggestion => (
                      <button
                        key={suggestion}
                        onClick={() => setCustomSkillName(suggestion)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          customSkillName === suggestion
                            ? 'bg-[#6C4BFF] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Proficiency Level */}
              <div>
                <label className="text-sm font-bold text-[#1E0E62] mb-2 block">Proficiency Level</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] as const).map(level => (
                    <button
                      key={level}
                      onClick={() => setSelectedProficiency(level)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        selectedProficiency === level
                          ? 'border-[#6C4BFF] bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-sm font-bold text-[#1E0E62]">{level}</div>
                      <div className="flex items-center gap-0.5 mt-1 justify-center">
                        {Array.from({ length: getProficiencyStars(level) }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Years of Experience */}
              <div>
                <label className="text-sm font-bold text-[#1E0E62] mb-2 block">
                  Years of Experience (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#6C4BFF] outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setSelectedCategory(null);
                    setCustomSkillName('');
                    setSearchQuery('');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={() => handleAddSkill(customSkillName)}
                  disabled={!customSkillName.trim() || isSaving}
                  isLoading={isSaving}
                  variant="gradient"
                  className="flex-1"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Add Skill
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Edit Skill Modal */}
      {editingSkill && (
        <Modal
          isOpen={true}
          onClose={() => setEditingSkill(null)}
          title="Edit Skill"
        >
          <div className="space-y-6">
            <div>
              <label className="text-sm font-bold text-[#1E0E62] mb-2 block">Skill Name</label>
              <input
                type="text"
                value={editingSkill.name}
                onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#6C4BFF] outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-[#1E0E62] mb-2 block">Proficiency Level</label>
              <div className="grid grid-cols-2 gap-2">
                {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] as const).map(level => (
                  <button
                    key={level}
                    onClick={() => setEditingSkill({ ...editingSkill, proficiency: level })}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      editingSkill.proficiency === level
                        ? 'border-[#6C4BFF] bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-bold text-[#1E0E62]">{level}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-[#1E0E62] mb-2 block">Years of Experience</label>
              <input
                type="number"
                min="0"
                max="50"
                value={editingSkill.yearsOfExperience || 0}
                onChange={(e) => setEditingSkill({ ...editingSkill, yearsOfExperience: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#6C4BFF] outline-none"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setEditingSkill(null)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleUpdateSkill(editingSkill.id)}
                disabled={isSaving}
                isLoading={isSaving}
                variant="gradient"
                className="flex-1"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
