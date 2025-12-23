import React, { useState } from 'react';
import { MapPin, Plus, Edit2, Trash2, Power, Save, X } from 'lucide-react';
import { User, SubscriptionLevel, BusinessLocation } from '../../types';

// Multi-location limits by subscription level
const LOCATION_LIMITS: Record<SubscriptionLevel, number> = {
  FREE: 1,      // Single location only
  SILVER: 3,    // Up to 3 locations
  GOLD: 10,     // Up to 10 locations
  PLATINUM: 999 // Unlimited locations
};

interface LocationManagerProps {
  user: User;
  onUpdateLocations: (locations: BusinessLocation[]) => Promise<void>;
}

const LocationManager: React.FC<LocationManagerProps> = ({ user, onUpdateLocations }) => {
  // Initialize locations from user data or default primary location
  const [locations, setLocations] = useState<BusinessLocation[]>(() => {
    // Check if user has locations stored (we'll add this field to User later)
    const existingLocations = (user as any).locations;
    if (existingLocations && Array.isArray(existingLocations)) {
      return existingLocations;
    }
    
    // Create default primary location from user's current address
    return [{
      id: 'primary',
      name: 'Main Location',
      address: user.address?.street || '',
      city: user.address?.city || user.location || '',
      country: user.country || '',
      geo: user.geo ? {
        latitude: user.geo.latitude,
        longitude: user.geo.longitude
      } : undefined,
      phone: user.phone,
      isActive: true,
      isPrimary: true,
      createdAt: new Date().toISOString()
    }];
  });

  const [editingLocation, setEditingLocation] = useState<BusinessLocation | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const maxLocations = LOCATION_LIMITS[user.subscriptionLevel];
  const canAddMore = locations.length < maxLocations;

  const handleAddLocation = () => {
    if (!canAddMore) {
      alert(`Your ${user.subscriptionLevel} plan allows up to ${maxLocations} location${maxLocations > 1 ? 's' : ''}. Upgrade to add more!`);
      return;
    }

    const newLocation: BusinessLocation = {
      id: `loc_${Date.now()}`,
      name: '',
      address: '',
      city: '',
      country: user.country || '',
      isActive: true,
      isPrimary: false,
      createdAt: new Date().toISOString(),
      geo: { latitude: 0, longitude: 0 }
    };

    setEditingLocation(newLocation);
    setIsAddingNew(true);
  };

  const handleSaveLocation = async () => {
    if (!editingLocation) return;

    // Validate required fields
    if (!editingLocation.name.trim()) {
      alert('Location name is required');
      return;
    }
    const addressStr = typeof editingLocation.address === 'string' ? editingLocation.address : editingLocation.address?.street || '';
    if (!addressStr.trim()) {
      alert('Address is required');
      return;
    }
    if (!editingLocation.city || !editingLocation.city.trim()) {
      alert('City is required');
      return;
    }

    setIsSaving(true);
    try {
      let updatedLocations: BusinessLocation[];

      if (isAddingNew) {
        updatedLocations = [...locations, editingLocation];
      } else {
        updatedLocations = locations.map(loc => 
          loc.id === editingLocation.id ? editingLocation : loc
        );
      }

      await onUpdateLocations(updatedLocations);
      setLocations(updatedLocations);
      setEditingLocation(null);
      setIsAddingNew(false);
    } catch (error) {
      console.error('Error saving location:', error);
      alert('Failed to save location. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    const location = locations.find(loc => loc.id === locationId);
    if (location?.isPrimary) {
      alert('Cannot delete primary location. Set another location as primary first.');
      return;
    }

    if (!confirm('Are you sure you want to delete this location?')) {
      return;
    }

    setIsSaving(true);
    try {
      const updatedLocations = locations.filter(loc => loc.id !== locationId);
      await onUpdateLocations(updatedLocations);
      setLocations(updatedLocations);
    } catch (error) {
      console.error('Error deleting location:', error);
      alert('Failed to delete location. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (locationId: string) => {
    const location = locations.find(loc => loc.id === locationId);
    if (location?.isPrimary && location.isActive) {
      alert('Cannot deactivate primary location.');
      return;
    }

    setIsSaving(true);
    try {
      const updatedLocations = locations.map(loc =>
        loc.id === locationId ? { ...loc, isActive: !loc.isActive } : loc
      );
      await onUpdateLocations(updatedLocations);
      setLocations(updatedLocations);
    } catch (error) {
      console.error('Error toggling location status:', error);
      alert('Failed to update location status. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetPrimary = async (locationId: string) => {
    setIsSaving(true);
    try {
      const updatedLocations = locations.map(loc => ({
        ...loc,
        isPrimary: loc.id === locationId,
        isActive: loc.id === locationId ? true : loc.isActive // Ensure primary is always active
      }));
      await onUpdateLocations(updatedLocations);
      setLocations(updatedLocations);
    } catch (error) {
      console.error('Error setting primary location:', error);
      alert('Failed to set primary location. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Business Locations</h3>
          <p className="text-sm text-gray-400 mt-1">
            Manage your business locations. Your plan allows up to {maxLocations} location{maxLocations > 1 ? 's' : ''}.
          </p>
        </div>
        <button
          onClick={handleAddLocation}
          disabled={!canAddMore || isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-[#9333ea] text-white rounded-lg hover:bg-[#7e22ce] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Location
        </button>
      </div>

      {/* Location List */}
      <div className="space-y-3">
        {locations.map((location) => (
          <div
            key={location.id}
            className={`bg-black/40 backdrop-blur-sm border rounded-xl p-4 ${
              location.isPrimary ? 'border-[#9333ea]' : 'border-white/10'
            }`}
          >
            {editingLocation?.id === location.id ? (
              /* Edit Mode */
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Location Name *
                    </label>
                    <input
                      type="text"
                      value={editingLocation.name}
                      onChange={(e) => setEditingLocation({ ...editingLocation, name: e.target.value })}
                      placeholder="e.g., Downtown Store"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#9333ea]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={editingLocation.phone || ''}
                      onChange={(e) => setEditingLocation({ ...editingLocation, phone: e.target.value })}
                      placeholder="+1 234 567 8900"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#9333ea]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    value={typeof editingLocation.address === 'string' ? editingLocation.address : (editingLocation.address?.street || '')}
                    onChange={(e) => setEditingLocation({ ...editingLocation, address: e.target.value })}
                    placeholder="123 Main St"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#9333ea]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      value={editingLocation.city}
                      onChange={(e) => setEditingLocation({ ...editingLocation, city: e.target.value })}
                      placeholder="New York"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#9333ea]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Country *
                    </label>
                    <input
                      type="text"
                      value={editingLocation.country}
                      onChange={(e) => setEditingLocation({ ...editingLocation, country: e.target.value })}
                      placeholder="USA"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#9333ea]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setEditingLocation(null);
                      setIsAddingNew(false);
                    }}
                    disabled={isSaving}
                    className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 disabled:opacity-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSaveLocation}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-[#9333ea] text-white rounded-lg hover:bg-[#7e22ce] disabled:opacity-50 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <MapPin className={`w-5 h-5 mt-1 ${location.isPrimary ? 'text-[#9333ea]' : 'text-gray-400'}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-white">{location.name}</h4>
                      {location.isPrimary && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-[#9333ea]/20 text-[#9333ea] border border-[#9333ea]/30 rounded">
                          Primary
                        </span>
                      )}
                      {!location.isActive && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{typeof location.address === 'string' ? location.address : (location.address?.street || 'No address')}</p>
                    <p className="text-sm text-gray-400">{location.city}, {location.country}</p>
                    {location.phone && (
                      <p className="text-sm text-gray-400 mt-1">📞 {location.phone}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!location.isPrimary && (
                    <button
                      onClick={() => handleSetPrimary(location.id)}
                      disabled={isSaving}
                      className="p-2 text-gray-400 hover:text-[#9333ea] hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                      title="Set as primary location"
                    >
                      <MapPin className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleToggleActive(location.id)}
                    disabled={isSaving}
                    className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                      location.isActive
                        ? 'text-green-400 hover:text-green-300 hover:bg-white/5'
                        : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                    }`}
                    title={location.isActive ? 'Deactivate location' : 'Activate location'}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingLocation(location)}
                    disabled={isSaving}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                    title="Edit location"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {!location.isPrimary && (
                    <button
                      onClick={() => handleDeleteLocation(location.id)}
                      disabled={isSaving}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete location"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Upgrade Prompt */}
      {!canAddMore && user.subscriptionLevel !== SubscriptionLevel.PLATINUM && (
        <div className="bg-[#9333ea]/10 border border-[#9333ea]/30 rounded-xl p-4">
          <p className="text-sm text-gray-300">
            <strong>Need more locations?</strong> Upgrade your subscription to manage more business locations.
          </p>
          <button className="mt-2 px-4 py-2 bg-[#9333ea] text-white rounded-lg hover:bg-[#7e22ce] text-sm transition-colors">
            Upgrade Plan
          </button>
        </div>
      )}
    </div>
  );
};

export default LocationManager;
