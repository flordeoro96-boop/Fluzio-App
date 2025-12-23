import React, { useState, useEffect } from 'react';
import { 
  Calendar, Plus, Edit2, Trash2, Eye, MapPin, Users, Clock,
  Search, Filter, Save, X, Image as ImageIcon, AlertCircle, Sparkles, Zap
} from 'lucide-react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../services/AuthContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../services/AuthContext';
import { generateEventIdeas } from '../../services/openaiService';
import { AdminPermissions, filterByScope } from '../../services/adminAuthService';

interface AdminEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  endTime?: string;
  location: string;
  city: string;
  country?: string;
  address?: string;
  imageUrl?: string;
  maxAttendees?: number;
  category: string;
  type: 'NETWORKING' | 'WORKSHOP' | 'CONFERENCE' | 'MEETUP' | 'TRAINING' | 'SOCIAL' | 'RETREAT' | 'BOOTCAMP' | 'CAMP';
  duration?: '1-day' | '3-day' | '7-day' | 'multi-day';
  targetAudience: 'ALL' | 'BUSINESSES' | 'CREATORS' | 'PREMIUM';
  genderRestriction?: 'mixed' | 'men' | 'women';
  minBusinessLevel?: number;
  minSubscriptionTier?: 'FREE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  pricing?: {
    pointsCost?: number;
    moneyCost?: number;
    currency?: string;
  };
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
  createdBy: string;
  createdAt: any;
  updatedAt?: any;
  registeredCount?: number;
}

interface AdminEventManagementProps {
  adminId: string;
  adminPerms: AdminPermissions;
}

export const AdminEventManagement: React.FC<AdminEventManagementProps> = ({ adminId, adminPerms }) => {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED' | 'CANCELLED'>('ALL');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const eventsCol = collection(db, 'adminEvents');
      const q = query(eventsCol, orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AdminEvent));
      
      // Apply geographic scope filtering
      // EVENT_ADMIN: Filter to only assigned events
      let scopedEvents = eventsData;
      if (adminPerms.role === 'EVENT_ADMIN' && adminPerms.assignedEventIds) {
        scopedEvents = eventsData.filter(event => adminPerms.assignedEventIds?.includes(event.id));
      } else {
        // Other admins: Filter by geographic scope
        scopedEvents = filterByScope(
          eventsData,
          adminPerms,
          (event) => event.country,
          (event) => event.city
        );
      }
      
      setEvents(scopedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setShowCreateModal(true);
  };

  const handleEditEvent = (event: AdminEvent) => {
    setEditingEvent(event);
    setShowCreateModal(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'adminEvents', eventId));
      await loadEvents();
      alert('Event deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.location?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || event.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1E0E62]">Event Management</h2>
          <p className="text-[#8F8FA3] mt-1">Create and manage platform-wide events</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAIGenerator(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            <Sparkles className="w-5 h-5" />
            AI Event Ideas
          </button>
          <button
            onClick={handleCreateEvent}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Create Event
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-[#8F8FA3] mb-1">Total Events</div>
          <div className="text-2xl font-bold text-[#1E0E62]">{events.length}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-[#8F8FA3] mb-1">Published</div>
          <div className="text-2xl font-bold text-green-600">
            {events.filter(e => e.status === 'PUBLISHED').length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-[#8F8FA3] mb-1">Drafts</div>
          <div className="text-2xl font-bold text-orange-600">
            {events.filter(e => e.status === 'DRAFT').length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-[#8F8FA3] mb-1">Total Registrations</div>
          <div className="text-2xl font-bold text-purple-600">
            {events.reduce((sum, e) => sum + (e.registeredCount || 0), 0)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-[#8F8FA3] absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="ALL">All Status</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-[#8F8FA3] mt-4">Loading events...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
          <Calendar className="w-16 h-16 text-[#8F8FA3] mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[#1E0E62] mb-2">No events found</h3>
          <p className="text-[#8F8FA3] mb-6">
            {searchQuery || statusFilter !== 'ALL' 
              ? 'Try adjusting your filters' 
              : 'Create your first event to get started'}
          </p>
          {!searchQuery && statusFilter === 'ALL' && (
            <button
              onClick={handleCreateEvent}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold"
            >
              Create Event
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={() => handleEditEvent(event)}
              onDelete={() => handleDeleteEvent(event.id)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <EventFormModal
          event={editingEvent}
          adminId={adminId}
          onClose={() => {
            setShowCreateModal(false);
            setEditingEvent(null);
          }}
          onSave={() => {
            loadEvents();
            setShowCreateModal(false);
            setEditingEvent(null);
          }}
        />
      )}

      {/* AI Event Generator Modal */}
      {showAIGenerator && (
        <AIEventGeneratorModal
          adminId={adminId}
          onClose={() => setShowAIGenerator(false)}
          onUseIdea={(idea, context) => {
            // Determine city based on location scope
            // If scope is 'city', use the locationName as city
            // If scope is 'country' or 'continent', extract city from AI suggestion
            let cityName = '';
            if (context.locationName) {
              // If user specified a city scope, use locationName as city
              if (context.locationScope === 'city') {
                cityName = context.locationName.split(',')[0].trim();
              } else {
                // For country/continent, extract city from AI suggestion (e.g., "Mykonos" from "Mykonos, on a beachfront villa")
                cityName = idea.suggestedLocation?.split(',')[0].trim() || '';
              }
            }

            // Map target audience
            const targetAudienceMap: Record<string, 'BUSINESSES' | 'INFLUENCERS' | 'ALL'> = {
              'businesses': 'BUSINESSES',
              'influencers': 'INFLUENCERS',
              'all': 'ALL'
            };

            setEditingEvent({
              id: '',
              title: idea.title,
              description: idea.description,
              type: idea.type as any,
              location: idea.suggestedLocation,
              address: idea.suggestedLocation || '', // Use AI-generated location as address
              city: cityName || idea.suggestedLocation, // Use extracted city
              maxAttendees: idea.estimatedAttendees,
              category: context.category || idea.type,
              date: '',
              time: '',
              targetAudience: targetAudienceMap[context.targetAudience] || 'BUSINESSES',
              genderRestriction: context.genderRestriction || 'mixed',
              pricing: { pointsCost: undefined, moneyCost: undefined, currency: 'EUR' },
              status: 'DRAFT',
              createdBy: adminId,
              createdAt: new Date()
            } as AdminEvent);
            setShowAIGenerator(false);
            setShowCreateModal(true);
          }}
        />
      )}
    </div>
  );
};

// Event Card Component
const EventCard: React.FC<{
  event: AdminEvent;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ event, onEdit, onDelete }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-700 border-green-200';
      case 'DRAFT': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'NETWORKING': return 'bg-purple-100 text-purple-700';
      case 'WORKSHOP': return 'bg-blue-100 text-blue-700';
      case 'CONFERENCE': return 'bg-indigo-100 text-indigo-700';
      case 'TRAINING': return 'bg-cyan-100 text-cyan-700';
      case 'SOCIAL': return 'bg-pink-100 text-pink-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4 flex-1">
          {event.imageUrl && (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-24 h-24 rounded-lg object-cover"
            />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-bold text-[#1E0E62]">{event.title}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(event.status)}`}>
                {event.status}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTypeColor(event.type)}`}>
                {event.type}
              </span>
            </div>
            <p className="text-[#8F8FA3] text-sm mb-3 line-clamp-2">{event.description}</p>
            <div className="flex items-center gap-4 text-sm text-[#8F8FA3]">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {event.date}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {event.time}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {event.location}
              </div>
              {event.maxAttendees && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {event.registeredCount || 0}/{event.maxAttendees}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all"
            title="Edit"
          >
            <Edit2 className="w-5 h-5 text-[#8F8FA3]" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 hover:bg-red-50 rounded-lg transition-all"
            title="Delete"
          >
            <Trash2 className="w-5 h-5 text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Event Form Modal
const EventFormModal: React.FC<{
  event: AdminEvent | null;
  adminId: string;
  onClose: () => void;
  onSave: () => void;
}> = ({ event, adminId, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    date: event?.date || '',
    time: event?.time || '',
    endTime: event?.endTime || '',
    location: event?.location || '',
    city: event?.city || 'Berlin',
    address: event?.address || '',
    imageUrl: event?.imageUrl || '',
    maxAttendees: event?.maxAttendees?.toString() || '',
    category: event?.category || '',
    type: event?.type || 'NETWORKING',
    targetAudience: event?.targetAudience || 'ALL',
    genderRestriction: event?.genderRestriction || 'mixed',
    minBusinessLevel: event?.minBusinessLevel,
    minSubscriptionTier: event?.minSubscriptionTier,
    status: event?.status || 'DRAFT',
    pricing: event?.pricing || { pointsCost: undefined, moneyCost: undefined, currency: 'EUR' }
  });
  
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `events/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setFormData(prev => ({ ...prev, imageUrl: url }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.date || !formData.time || !formData.location) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const eventData = {
        ...formData,
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : null,
        updatedAt: Timestamp.now()
      };

      if (event?.id) {
        // Update existing event
        await updateDoc(doc(db, 'adminEvents', event.id), eventData);
      } else {
        // Create new event
        await addDoc(collection(db, 'adminEvents'), {
          ...eventData,
          createdBy: adminId,
          createdAt: Timestamp.now(),
          registeredCount: 0
        });
      }

      alert(event?.id ? 'Event updated successfully!' : 'Event created successfully!');
      onSave();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#1E0E62]">
            {event ? 'Edit Event' : 'Create New Event'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-[#1E0E62] mb-2">
              Event Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Summer Networking Event"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-[#1E0E62] mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={3}
              placeholder="Describe the event..."
              required
            />
          </div>

          {/* Type & Target Audience */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#1E0E62] mb-2">
                Event Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="NETWORKING">Networking</option>
                <option value="WORKSHOP">Workshop</option>
                <option value="CONFERENCE">Conference</option>
                <option value="MEETUP">Meetup</option>
                <option value="TRAINING">Training</option>
                <option value="SOCIAL">Social</option>
                <option value="RETREAT">Retreat</option>
                <option value="BOOTCAMP">Bootcamp</option>
                <option value="CAMP">Camp</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1E0E62] mb-2">
                Target Audience *
              </label>
              <select
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="ALL">All Users</option>
                <option value="BUSINESSES">Businesses Only</option>
                <option value="CREATORS">Creators Only</option>
                <option value="PREMIUM">Premium Members</option>
              </select>
            </div>
          </div>

          {/* Access Requirements */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#1E0E62] mb-2">
                Minimum Business Level
              </label>
              <select
                value={formData.minBusinessLevel || ''}
                onChange={(e) => setFormData({ ...formData, minBusinessLevel: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">No requirement (All levels)</option>
                <option value="1">Level 1+ (Explorer)</option>
                <option value="2">Level 2+ (Builder)</option>
                <option value="3">Level 3+ (Operator)</option>
                <option value="4">Level 4+ (Growth Leader)</option>
                <option value="5">Level 5+ (Expert)</option>
                <option value="6">Level 6 only (Elite)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1E0E62] mb-2">
                Minimum Subscription Tier
              </label>
              <select
                value={formData.minSubscriptionTier || ''}
                onChange={(e) => setFormData({ ...formData, minSubscriptionTier: (e.target.value as 'FREE' | 'SILVER' | 'GOLD' | 'PLATINUM') || undefined })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">No requirement (All tiers)</option>
                <option value="FREE">Free tier only</option>
                <option value="SILVER">Silver+ (€29/month)</option>
                <option value="GOLD">Gold+ (€59/month)</option>
                <option value="PLATINUM">Platinum only (€99/month)</option>
              </select>
            </div>
          </div>

          {/* Gender Restriction */}
          <div>
            <label className="block text-sm font-semibold text-[#1E0E62] mb-2">
              Gender Restriction *
            </label>
            <select
              value={formData.genderRestriction}
              onChange={(e) => setFormData({ ...formData, genderRestriction: e.target.value as 'mixed' | 'men' | 'women' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="mixed">🚻 Mixed Gender - Open to all</option>
              <option value="men">♂️ Men Only</option>
              <option value="women">♀️ Women Only</option>
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#1E0E62] mb-2">
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1E0E62] mb-2">
                Start Time *
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1E0E62] mb-2">
                End Time
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#1E0E62] mb-2">
                Venue Name *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Downtown Conference Center"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1E0E62] mb-2">
                City *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Berlin"
                required
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-[#1E0E62] mb-2">
              Full Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="123 Main Street, Berlin"
            />
          </div>

          {/* Max Attendees */}
          <div>
            <label className="block text-sm font-semibold text-[#1E0E62] mb-2">
              Max Attendees (optional)
            </label>
            <input
              type="number"
              value={formData.maxAttendees}
              onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="100"
              min="1"
            />
          </div>

          {/* Pricing Section */}
          <div className="col-span-2 bg-purple-50 rounded-lg p-4 border border-purple-200">
            <h3 className="text-sm font-semibold text-[#1E0E62] mb-3 flex items-center gap-2">
              💰 Event Pricing (optional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points Cost
                </label>
                <input
                  type="number"
                  value={formData.pricing?.pointsCost || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    pricing: { 
                      ...formData.pricing, 
                      pointsCost: e.target.value ? parseInt(e.target.value) : undefined 
                    } 
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="1000"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Money Cost
                </label>
                <input
                  type="number"
                  value={formData.pricing?.moneyCost || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    pricing: { 
                      ...formData.pricing, 
                      moneyCost: e.target.value ? parseFloat(e.target.value) : undefined 
                    } 
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="50.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={formData.pricing?.currency || 'EUR'}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    pricing: { 
                      ...formData.pricing, 
                      currency: e.target.value 
                    } 
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Leave both empty for free events. Set one or both pricing options for paid events.
            </p>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-[#1E0E62] mb-2">
              Event Image
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="event-image-upload"
              />
              <label
                htmlFor="event-image-upload"
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <ImageIcon className="w-5 h-5" />
                {uploading ? 'Uploading...' : 'Upload Image'}
              </label>
              {formData.imageUrl && (
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-[#1E0E62] mb-2">
              Status *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// AI Event Generator Modal
const AIEventGeneratorModal: React.FC<{
  adminId: string;
  onClose: () => void;
  onUseIdea: (idea: any, context: { targetAudience: string; locationName: string; locationScope: 'continent' | 'country' | 'city'; category: string; duration: string; season: string; genderRestriction: 'mixed' | 'men' | 'women' }) => void;
}> = ({ adminId, onClose, onUseIdea }) => {
  const [duration, setDuration] = useState<'1-day' | '3-day' | '7-day' | 'camp'>('1-day');
  const [categories, setCategories] = useState<('workshop' | 'sports' | 'soccer' | 'basketball' | 'tennis' | 'golf' | 'running' | 'cycling' | 'swimming' | 'yoga' | 'martial_arts' | 'gaming' | 'dancing' | 'comedy' | 'cooking' | 'wine_tasting' | 'photography' | 'adventure' | 'hiking' | 'sailing' | 'skiing' | 'networking' | 'retreat' | 'conference' | 'wellness' | 'tech' | 'food' | 'travel' | 'art' | 'music' | 'outdoors' | 'business' | 'entrepreneurship' | 'leadership' | 'marketing' | 'finance' | 'personal_development' | 'content_creation' | 'social_media' | 'branding' | 'innovation' | 'mindfulness' | 'fitness' | 'career' | 'creativity' | 'community')[]>([]);
  const [targetAudience, setTargetAudience] = useState<'businesses' | 'influencers' | 'all'>('all');
  const [genderRestriction, setGenderRestriction] = useState<'mixed' | 'men' | 'women'>('mixed');
  const [location, setLocation] = useState<'continent' | 'country' | 'city'>('city');
  const [locationName, setLocationName] = useState('');
  const [season, setSeason] = useState<'spring' | 'summer' | 'fall' | 'winter' | 'all'>('all');
  const [generating, setGenerating] = useState(false);
  const [ideas, setIdeas] = useState<any[]>([]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const generatedIdeas = await generateEventIdeas(
        duration, 
        (categories.length > 0 ? categories.join(',') : 'all') as any, 
        targetAudience,
        location,
        locationName || undefined,
        season,
        genderRestriction
      );
      setIdeas(generatedIdeas);
    } catch (error) {
      console.error('Error generating ideas:', error);
      alert('Failed to generate ideas');
    } finally {
      setGenerating(false);
    }
  };

  const handleUseIdea = (idea: any) => {
    onUseIdea(idea, {
      targetAudience,
      locationName: locationName || '',
      locationScope: location,
      category: categories.length > 0 ? categories.join(',') : '',
      duration,
      season: season === 'all' ? '' : season,
      genderRestriction
    });
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'workshop': return '🎓';
      case 'sports': return '⚽';
      case 'soccer': return '⚽';
      case 'basketball': return '🏀';
      case 'tennis': return '🎾';
      case 'golf': return '⛳';
      case 'running': return '🏃';
      case 'cycling': return '🚴';
      case 'swimming': return '🏊';
      case 'yoga': return '🧘‍♀️';
      case 'martial_arts': return '🥋';
      case 'gaming': return '🎮';
      case 'dancing': return '💃';
      case 'comedy': return '😂';
      case 'cooking': return '👨‍🍳';
      case 'wine_tasting': return '🍷';
      case 'photography': return '📷';
      case 'adventure': return '🧗';
      case 'hiking': return '🥾';
      case 'sailing': return '⛵';
      case 'skiing': return '⛷️';
      case 'networking': return '🤝';
      case 'retreat': return '🏖️';
      case 'conference': return '🎤';
      case 'wellness': return '🧘';
      case 'tech': return '💻';
      case 'food': return '🍽️';
      case 'travel': return '✈️';
      case 'art': return '🎨';
      case 'music': return '🎵';
      case 'outdoors': return '🏔️';
      case 'business': return '💼';
      case 'entrepreneurship': return '🚀';
      case 'leadership': return '👔';
      case 'marketing': return '📣';
      case 'finance': return '💰';
      case 'personal_development': return '🌟';
      case 'content_creation': return '📸';
      case 'social_media': return '📱';
      case 'branding': return '🎯';
      case 'innovation': return '💡';
      case 'mindfulness': return '🧠';
      case 'fitness': return '💪';
      case 'career': return '📈';
      case 'creativity': return '✨';
      case 'community': return '🌍';
      default: return '✨';
    }
  };

  const getDurationLabel = (dur: string) => {
    switch (dur) {
      case '1-day': return 'Single Day Events';
      case '3-day': return '3-Day Programs';
      case '7-day': return 'Week-Long Programs';
      case 'camp': return 'Multi-Week Camps';
      default: return dur;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1E0E62]">AI Event Generator</h2>
              <p className="text-sm text-[#8F8FA3]">Get creative event ideas powered by AI</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Configuration */}
          <div className="grid grid-cols-3 gap-6">
            {/* Duration */}
            <div>
              <label className="block text-sm font-semibold text-[#1E0E62] mb-3">
                Event Duration
              </label>
              <div className="space-y-2">
                {(['1-day', '3-day', '7-day', 'camp'] as const).map((dur) => (
                  <button
                    key={dur}
                    onClick={() => setDuration(dur)}
                    className={`w-full px-4 py-2.5 rounded-lg text-left font-medium transition-all ${
                      duration === dur
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                        : 'bg-gray-100 text-[#1E0E62] hover:bg-gray-200'
                    }`}
                  >
                    {getDurationLabel(dur)}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-[#1E0E62] mb-3">
                Event Category (Multi-select)
              </label>
              <div className="space-y-2 max-h-[280px] overflow-y-auto">
                {/* All Button */}
                <button
                  type="button"
                  onClick={() => setCategories([])}
                  className={`w-full px-4 py-2.5 rounded-lg text-left font-medium transition-all flex items-center gap-2 ${
                    categories.length === 0
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'bg-gray-100 text-[#1E0E62] hover:bg-gray-200'
                  }`}
                >
                  <span className="text-xl">✨</span>
                  <span>All</span>
                </button>
                
                {/* Individual Categories - Organized by Priority */}
                {(['networking', 'business', 'entrepreneurship', 'leadership', 'conference', 'workshop', 'marketing', 'content_creation', 'social_media', 'branding', 'tech', 'innovation', 'personal_development', 'career', 'finance', 'creativity', 'wellness', 'fitness', 'mindfulness', 'yoga', 'sports', 'soccer', 'basketball', 'tennis', 'golf', 'running', 'cycling', 'swimming', 'hiking', 'adventure', 'skiing', 'martial_arts', 'community', 'food', 'cooking', 'wine_tasting', 'gaming', 'music', 'dancing', 'comedy', 'art', 'photography', 'travel', 'sailing', 'outdoors', 'retreat'] as const).map((cat) => {
                  const isSelected = categories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setCategories(categories.filter(c => c !== cat));
                        } else {
                          setCategories([...categories, cat]);
                        }
                      }}
                      className={`w-full px-4 py-2.5 rounded-lg text-left font-medium transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                          : 'bg-gray-100 text-[#1E0E62] hover:bg-gray-200'
                      }`}
                    >
                      <span className="text-xl">{getCategoryIcon(cat)}</span>
                      <span className="capitalize">{cat.replace(/_/g, ' ')}</span>
                      {isSelected && <span className="ml-auto">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Audience */}
            <div>
              <label className="block text-sm font-semibold text-[#1E0E62] mb-3">
                Target Audience
              </label>
              <div className="space-y-2 mb-4">
                {(['all', 'businesses', 'influencers'] as const).map((aud) => (
                  <button
                    key={aud}
                    onClick={() => setTargetAudience(aud)}
                    className={`w-full px-4 py-2.5 rounded-lg text-left font-medium transition-all flex items-center gap-2 ${
                      targetAudience === aud
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                        : 'bg-gray-100 text-[#1E0E62] hover:bg-gray-200'
                    }`}
                  >
                    {aud === 'businesses' && '🏢'}
                    {aud === 'influencers' && '⭐'}
                    {aud === 'all' && '🌍'}
                    <span className="capitalize">{aud === 'influencers' ? 'Influencers/People' : aud}</span>
                  </button>
                ))}
              </div>

              <label className="block text-sm font-semibold text-[#1E0E62] mb-3 mt-6">
                Gender Restrictions
              </label>
              <div className="space-y-2 mb-4">
                {(['mixed', 'men', 'women'] as const).map((gender) => (
                  <button
                    key={gender}
                    onClick={() => setGenderRestriction(gender)}
                    className={`w-full px-4 py-2.5 rounded-lg text-left font-medium transition-all flex items-center gap-2 ${
                      genderRestriction === gender
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                        : 'bg-gray-100 text-[#1E0E62] hover:bg-gray-200'
                    }`}
                  >
                    {gender === 'mixed' && '🚻'}
                    {gender === 'men' && '♂️'}
                    {gender === 'women' && '♀️'}
                    <span className="capitalize">
                      {gender === 'mixed' ? 'Mixed Gender' : gender === 'men' ? 'Men Only' : 'Women Only'}
                    </span>
                  </button>
                ))}
              </div>

              <label className="block text-sm font-semibold text-[#1E0E62] mb-3 mt-6">
                Season / Time of Year
              </label>
              <div className="space-y-2">
                {(['all', 'spring', 'summer', 'fall', 'winter'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSeason(s)}
                    className={`w-full px-4 py-2.5 rounded-lg text-left font-medium transition-all flex items-center gap-2 ${
                      season === s
                        ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg'
                        : 'bg-gray-100 text-[#1E0E62] hover:bg-gray-200'
                    }`}
                  >
                    {s === 'spring' && '🌸'}
                    {s === 'summer' && '☀️'}
                    {s === 'fall' && '🍂'}
                    {s === 'winter' && '❄️'}
                    {s === 'all' && '🗓️'}
                    <span className="capitalize">{s === 'all' ? 'Any Season' : s}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Location Configuration */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <label className="block text-sm font-semibold text-[#1E0E62] mb-3">
              📍 Location Scope & Details
            </label>
            <div className="flex gap-4 mb-3">
              {(['city', 'country', 'continent'] as const).map((loc) => (
                <button
                  key={loc}
                  onClick={() => setLocation(loc)}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                    location === loc
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                      : 'bg-white text-[#1E0E62] hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {loc === 'city' && '🏙️'} {loc === 'country' && '🗺️'} {loc === 'continent' && '🌍'}
                  <span className="ml-2 capitalize">{loc}</span>
                </button>
              ))}
            </div>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder={`Enter ${location} name (e.g., ${location === 'city' ? 'Berlin, Munich' : location === 'country' ? 'Germany, Spain' : 'Europe, Asia'})`}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-2">Leave empty for any location</p>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            <Zap className="w-6 h-6" />
            {generating ? 'Generating Ideas...' : 'Generate Event Ideas'}
          </button>

          {/* Generated Ideas */}
          {ideas.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[#1E0E62] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                AI-Generated Event Ideas
              </h3>
              {ideas.map((idea, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-[#1E0E62] mb-2">{idea.title}</h4>
                      <p className="text-[#8F8FA3] mb-4">{idea.description}</p>
                      
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-purple-600" />
                          <span className="text-[#1E0E62] font-medium">{idea.suggestedLocation}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-purple-600" />
                          <span className="text-[#1E0E62] font-medium">{idea.estimatedAttendees} attendees</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-purple-600" />
                          <span className="text-[#1E0E62] font-medium">{idea.type}</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-semibold text-[#1E0E62] mb-2">Key Activities:</div>
                        <div className="flex flex-wrap gap-2">
                          {idea.keyActivities.map((activity: string, i: number) => (
                            <span
                              key={i}
                              className="px-3 py-1 bg-white border border-purple-300 text-purple-700 rounded-full text-xs font-medium"
                            >
                              {activity}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUseIdea(idea)}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all whitespace-nowrap"
                    >
                      Use This Idea
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {generating && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
              <p className="text-[#8F8FA3] font-medium">Generating creative event ideas...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
