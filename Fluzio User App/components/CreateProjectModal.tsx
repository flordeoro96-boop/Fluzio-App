import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Sparkles, Loader2, Calendar, MapPin, Info } from 'lucide-react';
import { ProjectSlot, ProjectType, Project } from '../types';
import { generateProjectIdeas } from '../services/openaiService';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: { 
    title: string;
    description: string;
    projectType: ProjectType;
    city: string;
    dateRange: { start: string; end: string };
    slots: ProjectSlot[];
    creatorRoles?: Array<{ role: string; budget: number; description?: string }>;
  }, projectId?: string) => void;
  businessId: string;
  businessName?: string;
  businessType?: string;
  category?: string;
  editingProject?: Project | null;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  businessId,
  businessName = 'Your Business',
  businessType,
  category,
  editingProject
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('PHOTOSHOOT');
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [slots, setSlots] = useState<ProjectSlot[]>([
    { role: '', cost: 0, status: 'OPEN' }
  ]);
  const [creatorRoles, setCreatorRoles] = useState<Array<{ role: string; budget: number; quantity?: number; description?: string }>>([]);
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // Populate form when editing
  useEffect(() => {
    if (editingProject && isOpen) {
      setTitle(editingProject.title);
      setDescription(editingProject.description);
      setProjectType(editingProject.projectType);
      setCity(editingProject.city);
      setStartDate(editingProject.dateRange.start);
      setEndDate(editingProject.dateRange.end);
      
      // Convert business roles back to slots
      const businessSlots = editingProject.businessRoles.map(role => ({
        role: role.title,
        cost: role.costShare,
        status: 'OPEN' as const
      }));
      setSlots(businessSlots.length > 0 ? businessSlots : [{ role: '', cost: 0, status: 'OPEN' }]);
      
      // Set creator roles
      const creators = editingProject.creatorRoles.map(role => ({
        role: role.title,
        budget: role.budget,
        quantity: 1,
        description: ''
      }));
      setCreatorRoles(creators);
    } else if (!isOpen) {
      // Reset form when modal closes
      setTitle('');
      setDescription('');
      setProjectType('PHOTOSHOOT');
      setCity('');
      setStartDate('');
      setEndDate('');
      setSlots([{ role: '', cost: 0, status: 'OPEN' }]);
      setCreatorRoles([]);
      setShowSuggestions(false);
    }
  }, [editingProject, isOpen]);

  const addSlot = () => {
    setSlots([...slots, { role: '', cost: 0, status: 'OPEN' }]);
  };

  const removeSlot = (index: number) => {
    if (slots.length > 1) {
      setSlots(slots.filter((_, i) => i !== index));
    }
  };

  const updateSlot = (index: number, field: 'role' | 'cost', value: string | number) => {
    const newSlots = [...slots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setSlots(newSlots);
  };

  const handleGetIdeas = async () => {
    setIsLoadingIdeas(true);
    try {
      const ideas = await generateProjectIdeas({
        businessName,
        businessType,
        category
      });
      setSuggestions(ideas);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Failed to generate ideas:', error);
    } finally {
      setIsLoadingIdeas(false);
    }
  };

  const handleUseIdea = (idea: any) => {
    setTitle(idea.title);
    setDescription(idea.description || '');
    // Store business partners as slots
    if (idea.businessPartners) {
      setSlots(idea.businessPartners.map((partner: any) => ({
        role: partner.role,
        cost: partner.cost,
        status: 'OPEN' as const
      })));
      // Store creator roles separately
      if (idea.creatorRoles) {
        setCreatorRoles(idea.creatorRoles.map((creator: any) => ({
          role: creator.role,
          budget: creator.budget,
          quantity: creator.quantity || 1,
          description: creator.description
        })));
      }
    } else if (idea.slots) {
      // Fallback for old format
      setSlots(idea.slots.map((slot: any) => ({
        role: slot.role,
        cost: slot.cost,
        status: 'OPEN' as const
      })));
    }
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !city.trim() || !startDate || !endDate) {
      alert('Please fill in all required fields');
      return;
    }
    if (slots.some(s => !s.role.trim())) {
      alert('Please fill in all business partner roles');
      return;
    }
    if (creatorRoles.some(c => !c.role.trim() || c.budget <= 0)) {
      alert('Please fill in all creator roles with valid budgets');
      return;
    }

    onSubmit({ 
      title: title.trim(),
      description: description.trim(),
      projectType,
      city: city.trim(),
      dateRange: { start: startDate, end: endDate },
      slots, // Business partner roles
      creatorRoles: creatorRoles.length > 0 ? creatorRoles : undefined
    }, editingProject?.id);
    
    // Reset form handled by useEffect
    onClose();
  };

  if (!isOpen) return null;

  const totalCost = slots.reduce((sum, slot) => sum + Number(slot.cost), 0);
  const totalCreatorBudget = creatorRoles.reduce((sum, creator) => 
    sum + (Number(creator.budget) * (creator.quantity || 1)), 0
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingProject ? 'Edit Project' : 'Create Partnership Project'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* AI Suggestions Button */}
            {!showSuggestions && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Need inspiration?</div>
                      <div className="text-sm text-gray-600">Get AI-powered project ideas tailored for {businessName}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGetIdeas}
                    disabled={isLoadingIdeas}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2 font-medium"
                  >
                    {isLoadingIdeas ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Get Ideas
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* AI Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    AI Project Ideas
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowSuggestions(false)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Hide suggestions
                  </button>
                </div>
                <div className="grid gap-3 max-h-96 overflow-y-auto">
                  {suggestions.map((idea, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:bg-purple-50/30 transition-all cursor-pointer"
                      onClick={() => handleUseIdea(idea)}
                    >
                      <div className="font-semibold text-gray-900 mb-1">{idea.title}</div>
                      <div className="text-sm text-gray-600 mb-3">{idea.description}</div>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="text-xs">
                          <div className="font-semibold text-purple-600 mb-1">Business Partners:</div>
                          {idea.businessPartners?.map((partner: any, i: number) => (
                            <div key={i} className="text-gray-600">• {partner.role}</div>
                          ))}
                        </div>
                        <div className="text-xs">
                          <div className="font-semibold text-blue-600 mb-1">Creator Roles:</div>
                          {idea.creatorRoles?.map((creator: any, i: number) => (
                            <div key={i} className="text-gray-600">• {creator.role}</div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          €{idea.estimatedCost} total
                        </div>
                        <div className="text-xs text-purple-600 font-medium">Click to use →</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Project Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Project Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Glamorous Gold — Jewelry Photoshoot"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            {/* Project Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Project Goal *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the project goal in 1-2 sentences (e.g., Create shared marketing visuals for participating brands to use across web and social media)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={3}
                required
              />
            </div>

            {/* Project Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Project Type *
              </label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value as ProjectType)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="PHOTOSHOOT">Photoshoot</option>
                <option value="CAMPAIGN">Campaign</option>
                <option value="EVENT_ACTIVATION">Event Activation</option>
                <option value="CONTENT_DAY">Content Day</option>
              </select>
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                City *
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., Munich"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Start Date *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Info Box: Businesses vs Creators */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-gray-900 mb-1">Businesses vs Creators</div>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p><strong>Businesses</strong> join the project as partners and share costs.</p>
                    <p><strong>Creators</strong> are hired later to execute the work.</p>
                    <p className="text-gray-600 italic mt-2">These two numbers don't need to match.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Partner Slots */}
            <div>
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Business Partner Slots *
                  </label>
                  <button
                    type="button"
                    onClick={addSlot}
                    className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add Partner
                  </button>
                </div>
                <p className="text-xs text-gray-600">
                  Define which businesses will join as co-producers and share the total cost
                </p>
              </div>

              <div className="space-y-3">
                {slots.map((slot, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={slot.role}
                        onChange={(e) => updateSlot(index, 'role', e.target.value)}
                        placeholder="Business role (e.g., Venue Provider, Catering Partner)"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>
                    {slots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSlot(index)}
                        className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-500 mt-2">
                Each business provides products/services/location and shares the total project cost
              </p>
            </div>

            {/* Creator Roles Section */}
            <div>
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Creator Roles & Budgets *
                  </label>
                  <button
                    type="button"
                    onClick={() => setCreatorRoles([...creatorRoles, { role: '', budget: 0, quantity: 1 }])}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add Creator
                  </button>
                </div>
                <p className="text-xs text-gray-600">
                  Define which creators you need, how many, and their budgets (e.g., 2 Models @ €600 each)
                </p>
              </div>

              <div className="space-y-3">
                {creatorRoles.map((creator, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={creator.role}
                        onChange={(e) => {
                          const updated = [...creatorRoles];
                          updated[index].role = e.target.value;
                          setCreatorRoles(updated);
                        }}
                        placeholder="Creator role (e.g., Photographer, Model)"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div className="w-20">
                      <input
                        type="number"
                        value={creator.quantity || 1}
                        onChange={(e) => {
                          const updated = [...creatorRoles];
                          updated[index].quantity = Number(e.target.value);
                          setCreatorRoles(updated);
                        }}
                        placeholder="Qty"
                        min="1"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                        required
                      />
                    </div>
                    <div className="w-32">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          €
                        </span>
                        <input
                          type="number"
                          value={creator.budget || ''}
                          onChange={(e) => {
                            const updated = [...creatorRoles];
                            updated[index].budget = Number(e.target.value);
                            setCreatorRoles(updated);
                          }}
                          placeholder="0"
                          min="1"
                          className="w-full pl-7 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                    {creatorRoles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = creatorRoles.filter((_, i) => i !== index);
                          setCreatorRoles(updated);
                        }}
                        className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-500 mt-2">
                Creators are paid individually for their work on the project
              </p>
            </div>

            {/* Total Cost Summary */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Total Creator Budget</span>
                <span className="text-2xl font-bold text-purple-600">€{totalCreatorBudget}</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {slots.length} business partner{slots.length !== 1 ? 's' : ''} will share this cost
              </p>
              {slots.length > 0 && totalCreatorBudget > 0 && (
                <p className="text-xs text-gray-700 mt-2 font-medium">
                  Cost per business: €{(totalCreatorBudget / slots.length).toFixed(2)}
                </p>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg font-medium transition-all"
          >
            {editingProject ? 'Update Project' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
};
