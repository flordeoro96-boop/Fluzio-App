/**
 * Creator Setup Modal
 * Onboarding flow for creators to set up their profile
 */

import React, { useState } from 'react';
import { MapPin, Briefcase, Crosshair, CheckCircle2, X } from 'lucide-react';
import { User } from '../types';

interface CreatorSetupModalProps {
  user: User;
  onComplete: (setupData: CreatorSetupData) => Promise<void>;
  onClose?: () => void;
}

export interface CreatorSetupData {
  city: string;
  roles: string[];
  radiusKm: number;
}

const AVAILABLE_ROLES = [
  { id: 'model', label: 'Model', icon: '👤' },
  { id: 'photographer', label: 'Photographer', icon: '📸' },
  { id: 'videographer', label: 'Videographer', icon: '🎥' },
  { id: 'content_creator', label: 'Content Creator', icon: '✨' },
  { id: 'smm', label: 'Social Media Manager', icon: '📱' },
  { id: 'graphic_designer', label: 'Graphic Designer', icon: '🎨' },
  { id: 'makeup_artist', label: 'Makeup Artist', icon: '💄' },
  { id: 'stylist', label: 'Stylist', icon: '👗' },
  { id: 'event_host', label: 'Event Host', icon: '🎤' },
  { id: 'writer', label: 'Writer', icon: '✍️' },
  { id: 'influencer', label: 'Influencer', icon: '⭐' },
  { id: 'voice_over', label: 'Voice Over Artist', icon: '🎙️' },
];

export const CreatorSetupModal: React.FC<CreatorSetupModalProps> = ({ 
  user, 
  onComplete,
  onClose 
}) => {
  const [step, setStep] = useState<'city' | 'roles' | 'radius'>('city');
  const [city, setCity] = useState(user.currentCity || '');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [radiusKm, setRadiusKm] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles(prev => 
      prev.includes(roleId) 
        ? prev.filter(r => r !== roleId)
        : [...prev, roleId]
    );
  };

  const handleNext = () => {
    setError('');
    
    if (step === 'city') {
      if (!city.trim()) {
        setError('Please enter your city');
        return;
      }
      setStep('roles');
    } else if (step === 'roles') {
      if (selectedRoles.length === 0) {
        setError('Please select at least one role');
        return;
      }
      setStep('radius');
    }
  };

  const handleComplete = async () => {
    if (selectedRoles.length === 0) {
      setError('Please select at least one role');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      await onComplete({
        city: city.trim(),
        roles: selectedRoles,
        radiusKm
      });
    } catch (err: any) {
      console.error('Error completing creator setup:', err);
      setError(err.message || 'Failed to save setup. Please try again.');
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 'city') return city.trim().length > 0;
    if (step === 'roles') return selectedRoles.length > 0;
    if (step === 'radius') return true;
    return false;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-[#1E0E62]">
              Complete Your Creator Profile
            </h2>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            )}
          </div>
          <p className="text-gray-600">
            Help us match you with the perfect opportunities
          </p>
          
          {/* Progress */}
          <div className="flex items-center gap-2 mt-4">
            <div className={`flex-1 h-2 rounded-full ${
              step === 'city' ? 'bg-purple-600' : 'bg-gray-200'
            }`} />
            <div className={`flex-1 h-2 rounded-full ${
              step === 'roles' ? 'bg-purple-600' : 'bg-gray-200'
            }`} />
            <div className={`flex-1 h-2 rounded-full ${
              step === 'radius' ? 'bg-purple-600' : 'bg-gray-200'
            }`} />
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* City Step */}
          {step === 'city' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
                  <MapPin size={32} className="text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-[#1E0E62] mb-2">
                  Where are you based?
                </h3>
                <p className="text-gray-600">
                  We'll show you opportunities in your area
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g., Munich, Berlin, Hamburg"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  autoFocus
                />
                <p className="mt-2 text-sm text-gray-500">
                  Enter the city where you're primarily located
                </p>
              </div>
            </div>
          )}

          {/* Roles Step */}
          {step === 'roles' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
                  <Briefcase size={32} className="text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-[#1E0E62] mb-2">
                  What do you do?
                </h3>
                <p className="text-gray-600">
                  Select all roles that apply to you (you can change this later)
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AVAILABLE_ROLES.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => handleRoleToggle(role.id)}
                    className={`p-4 border-2 rounded-xl transition-all text-left ${
                      selectedRoles.includes(role.id)
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{role.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-[#1E0E62]">
                          {role.label}
                        </div>
                        {selectedRoles.includes(role.id) && (
                          <CheckCircle2 size={16} className="text-purple-600 mt-1" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {selectedRoles.length > 0 && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-purple-900 font-medium">
                    Selected {selectedRoles.length} role{selectedRoles.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Radius Step */}
          {step === 'radius' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
                  <Crosshair size={32} className="text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-[#1E0E62] mb-2">
                  How far will you travel?
                </h3>
                <p className="text-gray-600">
                  Set your preferred search radius for opportunities
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-medium text-gray-700">
                    Search Radius
                  </label>
                  <span className="text-2xl font-bold text-purple-600">
                    {radiusKm} km
                  </span>
                </div>
                
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                  style={{
                    background: `linear-gradient(to right, #7209b7 0%, #7209b7 ${((radiusKm - 5) / 45) * 100}%, #e5e7eb ${((radiusKm - 5) / 45) * 100}%, #e5e7eb 100%)`
                  }}
                />
                
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>5 km</span>
                  <span>25 km</span>
                  <span>50 km</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  💡 <strong>Tip:</strong> You can always change this later in your settings. 
                  We'll show opportunities within {radiusKm}km of {city}.
                </p>
              </div>

              {/* Summary */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-[#1E0E62] mb-3">Your Profile Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-gray-400" />
                    <span className="text-gray-700">{city}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Briefcase size={16} className="text-gray-400 mt-0.5" />
                    <span className="text-gray-700">
                      {selectedRoles.map(id => 
                        AVAILABLE_ROLES.find(r => r.id === id)?.label
                      ).join(', ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Crosshair size={16} className="text-gray-400" />
                    <span className="text-gray-700">{radiusKm}km radius</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          {step !== 'city' && (
            <button
              onClick={() => {
                if (step === 'roles') setStep('city');
                else if (step === 'radius') setStep('roles');
              }}
              className="px-6 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              disabled={loading}
            >
              Back
            </button>
          )}
          {step === 'city' && <div />}
          
          <button
            onClick={step === 'radius' ? handleComplete : handleNext}
            disabled={!canProceed() || loading}
            className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
              canProceed() && !loading
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </div>
            ) : step === 'radius' ? (
              'Complete Setup'
            ) : (
              'Next'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
