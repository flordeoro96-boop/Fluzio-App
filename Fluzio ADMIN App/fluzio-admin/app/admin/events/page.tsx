'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Search,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Trash2,
  Sparkles,
  Edit,
} from 'lucide-react';
import { Event, EventStatus } from '@/lib/types';
import { getEventsAction, updateEventStatusAction, deleteEventAction } from './actions';

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);
  const [showEventOptions, setShowEventOptions] = useState(false);
  const [generatedEventOptions, setGeneratedEventOptions] = useState<any[]>([]);
  const [aiEventType, setAiEventType] = useState<string>('FUN_MEETUP');
  const [aiCategories, setAiCategories] = useState<string[]>(['NETWORKING']);
  const [aiCountry, setAiCountry] = useState<string>('DE');
  const [aiTargetAudience, setAiTargetAudience] = useState<string[]>(['CUSTOMERS']);
  const [aiTicketing, setAiTicketing] = useState<'FREE' | 'PAID'>('FREE');
  const [aiCapacity, setAiCapacity] = useState<number>(50);
  const [aiDuration, setAiDuration] = useState<number>(1);
  const [aiLocation, setAiLocation] = useState<string>('');
  const [aiCity, setAiCity] = useState<string>('');
  const [aiStartDate, setAiStartDate] = useState<string>('');
  const [aiStartTime, setAiStartTime] = useState<string>('18:00');
  const [aiPriceTier, setAiPriceTier] = useState<string>('10');
  const [newStatus, setNewStatus] = useState<EventStatus>('PUBLISHED');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [statusFilter]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getEventsAction({
        status: statusFilter === 'ALL' ? undefined : statusFilter as EventStatus,
      });
      
      if (result.success && result.events) {
        setEvents(result.events);
      } else {
        setError(result.error || 'Failed to load events');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;

    try {
      setGeneratingAI(true);
      setError(null);

      const enhancedPrompt = `${aiPrompt}

Event Configuration:
- Type: ${aiEventType}
- Categories: ${aiCategories.join(', ')}
- Duration: ${aiDuration} ${aiDuration === 1 ? 'day' : 'days'}
- Location: ${aiCity || aiLocation || 'To be determined'}
- Country: ${aiCountry}
- Target Audience: ${aiTargetAudience.join(', ')}
- Ticketing: ${aiTicketing}${aiTicketing === 'PAID' ? ` (${aiPriceTier}€)` : ''}
- Estimated Capacity: ${aiCapacity} people
- Start Date: ${aiStartDate || 'To be determined'}
- Start Time: ${aiStartTime}`;

      const response = await fetch('/api/ai/generate-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: enhancedPrompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate event');
      }

      const data = await response.json();

      if (!data.events || !Array.isArray(data.events)) {
        throw new Error('Invalid response from AI');
      }

      setGeneratedEventOptions(data.events);
      setShowAIDialog(false);
      setShowEventOptions(true);

    } catch (err: any) {
      setError(err.message || 'Failed to generate event with AI');
      setGeneratingAI(false);
    }
  };

  const selectEventOption = async (selectedEvent: any, index: number) => {
    try {
      console.log('[selectEventOption] Starting:', index, selectedEvent);

      const eventData = {
        ...selectedEvent,
        type: aiEventType,
        category: aiCategories[0] || selectedEvent.category,
        categories: aiCategories,
        duration: aiDuration,
        location: aiLocation || selectedEvent.location,
        city: aiCity || selectedEvent.city,
        countryId: aiCountry,
        targetAudience: aiTargetAudience,
        startDate: aiStartDate,
        startTime: aiStartTime,
        ticketing: {
          mode: aiTicketing,
          price: aiTicketing === 'PAID' ? parseFloat(aiPriceTier) : 0
        },
        capacity: aiCapacity,
      };
      
      console.log('[selectEventOption] Redirecting...');
      router.push(`/admin/events/new?ai=${encodeURIComponent(JSON.stringify(eventData))}`);
    } catch (err: any) {
      console.error('[selectEventOption] Error:', err);
      setError(err.message || 'Failed to process selected event');
      setShowEventOptions(false);
      setAiPrompt('');
    }
  };

  const toggleCategory = (category: string) => {
    setAiCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleAudience = (audience: string) => {
    setAiTargetAudience(prev =>
      prev.includes(audience)
        ? prev.filter(a => a !== audience)
        : [...prev, audience]
    );
  };

  const handleStatusChange = async () => {
    if (!selectedEvent) return;

    try {
      setProcessing(true);
      await updateEventStatusAction(selectedEvent.id, newStatus);
      await loadEvents();
      setShowStatusDialog(false);
      setSelectedEvent(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;

    try {
      setProcessing(true);
      await deleteEventAction(selectedEvent.id);
      await loadEvents();
      setShowDeleteDialog(false);
      setSelectedEvent(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete event');
    } finally {
      setProcessing(false);
    }
  };

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: events.length,
    draft: events.filter(e => e.status === 'DRAFT').length,
    published: events.filter(e => e.status === 'PUBLISHED').length,
    completed: events.filter(e => e.status === 'COMPLETED').length,
    cancelled: events.filter(e => e.status === 'CANCELLED').length,
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600 mt-2">Manage events and approval workflow</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowAIDialog(true)} variant="outline">
            <Sparkles className="w-4 h-4 mr-2" />
            AI Generate
          </Button>
          <Button onClick={() => router.push('/admin/events/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Events</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
            <div className="text-sm text-gray-600">Draft</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.published}</div>
            <div className="text-sm text-gray-600">Published</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            <div className="text-sm text-gray-600">Cancelled</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Events List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">No events found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{event.title}</h3>
                      <Badge
                        variant={
                          event.status === 'PUBLISHED' ? 'default' :
                          event.status === 'DRAFT' ? 'secondary' :
                          event.status === 'COMPLETED' ? 'default' :
                          'destructive'
                        }
                      >
                        {event.status}
                      </Badge>
                      <Badge variant="outline">{event.type}</Badge>
                    </div>
                    <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{event.startDate ? new Date(event.startDate).toLocaleDateString() : 'TBD'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location || 'Location TBD'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{event.capacity} capacity</span>
                      </div>
                      {event.ticketing && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span>{event.ticketing.mode === 'FREE' ? 'Free' : `€${event.ticketing.price}`}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/admin/events/${event.id}`)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedEvent(event);
                        setNewStatus(event.status);
                        setShowStatusDialog(true);
                      }}
                    >
                      <Clock className="w-4 h-4 mr-1" />
                      Status
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Event Status</DialogTitle>
            <DialogDescription>
              Change the status of "{selectedEvent?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>New Status</Label>
            <Select value={newStatus} onValueChange={(v) => setNewStatus(v as EventStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusChange} disabled={processing}>
              {processing ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedEvent?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={processing}>
              {processing ? 'Deleting...' : 'Delete Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Generate Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                AI Event Generator
              </div>
            </DialogTitle>
            <DialogDescription>
              Describe your event idea and configure options. AI will generate 5 different concepts for you to choose from.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Prompt Input */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Event Description</Label>
              <Textarea
                placeholder="e.g., A networking event for tech entrepreneurs in Berlin..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Event Type */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Event Type</Label>
              <div className="grid grid-cols-3 gap-3">
                {['FUN_MEETUP', 'NETWORKING', 'WORKSHOP'].map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={aiEventType === type ? 'default' : 'outline'}
                    onClick={() => setAiEventType(type)}
                    className="h-auto py-3"
                  >
                    {type.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Event Categories (select multiple) - {aiCategories.length} selected
              </Label>
              <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto border rounded-md p-3">
                {/* Business & Entrepreneurship */}
                <div className="col-span-3 text-xs font-semibold text-gray-500 mt-2">Business & Entrepreneurship</div>
                {['NETWORKING', 'PITCH_EVENT', 'STARTUP', 'INVESTOR_MEETUP', 'CONFERENCE', 'TRADE_SHOW'].map((cat) => (
                  <Button
                    key={cat}
                    type="button"
                    variant={aiCategories.includes(cat) ? 'default' : 'outline'}
                    onClick={() => toggleCategory(cat)}
                    className="h-auto py-2 text-xs justify-start"
                  >
                    {cat.replace('_', ' ')}
                  </Button>
                ))}

                {/* Learning & Development */}
                <div className="col-span-3 text-xs font-semibold text-gray-500 mt-2">Learning & Development</div>
                {['WORKSHOP', 'SEMINAR', 'TRAINING', 'HACKATHON'].map((cat) => (
                  <Button
                    key={cat}
                    type="button"
                    variant={aiCategories.includes(cat) ? 'default' : 'outline'}
                    onClick={() => toggleCategory(cat)}
                    className="h-auto py-2 text-xs justify-start"
                  >
                    {cat.replace('_', ' ')}
                  </Button>
                ))}

                {/* Creative & Arts */}
                <div className="col-span-3 text-xs font-semibold text-gray-500 mt-2">Creative & Arts</div>
                {['ART_EXHIBITION', 'MUSIC', 'PHOTOGRAPHY', 'DESIGN', 'CULTURAL'].map((cat) => (
                  <Button
                    key={cat}
                    type="button"
                    variant={aiCategories.includes(cat) ? 'default' : 'outline'}
                    onClick={() => toggleCategory(cat)}
                    className="h-auto py-2 text-xs justify-start"
                  >
                    {cat.replace('_', ' ')}
                  </Button>
                ))}

                {/* Social & Community */}
                <div className="col-span-3 text-xs font-semibold text-gray-500 mt-2">Social & Community</div>
                {['MEETUP', 'PARTY', 'COMMUNITY', 'CHARITY'].map((cat) => (
                  <Button
                    key={cat}
                    type="button"
                    variant={aiCategories.includes(cat) ? 'default' : 'outline'}
                    onClick={() => toggleCategory(cat)}
                    className="h-auto py-2 text-xs justify-start"
                  >
                    {cat.replace('_', ' ')}
                  </Button>
                ))}

                {/* Lifestyle & Wellness */}
                <div className="col-span-3 text-xs font-semibold text-gray-500 mt-2">Lifestyle & Wellness</div>
                {['SPORTS', 'WELLNESS', 'FOOD_DRINK', 'ENTERTAINMENT'].map((cat) => (
                  <Button
                    key={cat}
                    type="button"
                    variant={aiCategories.includes(cat) ? 'default' : 'outline'}
                    onClick={() => toggleCategory(cat)}
                    className="h-auto py-2 text-xs justify-start"
                  >
                    {cat.replace('_', ' ')}
                  </Button>
                ))}

                {/* Business Services */}
                <div className="col-span-3 text-xs font-semibold text-gray-500 mt-2">Business Services</div>
                {['PRODUCT_LAUNCH', 'MARKET', 'EXPO', 'OTHER'].map((cat) => (
                  <Button
                    key={cat}
                    type="button"
                    variant={aiCategories.includes(cat) ? 'default' : 'outline'}
                    onClick={() => toggleCategory(cat)}
                    className="h-auto py-2 text-xs justify-start"
                  >
                    {cat.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Event Duration</Label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[1, 2, 3, 5].map((days) => (
                  <Button
                    key={days}
                    type="button"
                    variant={aiDuration === days ? 'default' : 'outline'}
                    onClick={() => setAiDuration(days)}
                    className="h-auto py-2"
                  >
                    {days} Day{days > 1 ? 's' : ''}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-xs text-gray-600">Custom:</Label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={aiDuration}
                  onChange={(e) => setAiDuration(Math.max(1, Math.min(30, Number(e.target.value))))}
                  className="w-20 px-2 py-1 border rounded text-sm"
                />
                <span className="text-xs text-gray-500">days (max 30)</span>
              </div>
            </div>

            {/* Country */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Country</Label>
              <select
                value={aiCountry}
                onChange={(e) => setAiCountry(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="DE">🇩🇪 Germany</option>
                <option value="US">🇺🇸 United States</option>
                <option value="UK">🇬🇧 United Kingdom</option>
                <option value="FR">🇫🇷 France</option>
                <option value="ES">🇪🇸 Spain</option>
                <option value="IT">🇮🇹 Italy</option>
                <option value="NL">🇳🇱 Netherlands</option>
                <option value="BE">🇧🇪 Belgium</option>
                <option value="AT">🇦🇹 Austria</option>
                <option value="CH">🇨🇭 Switzerland</option>
              </select>
            </div>

            {/* Location & City */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium mb-2 block">City</Label>
                <input
                  type="text"
                  value={aiCity}
                  onChange={(e) => setAiCity(e.target.value)}
                  placeholder="e.g., Berlin, Munich"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Venue/Location</Label>
                <input
                  type="text"
                  value={aiLocation}
                  onChange={(e) => setAiLocation(e.target.value)}
                  placeholder="e.g., Tech Hub Berlin"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium mb-2 block">Start Date</Label>
                <input
                  type="date"
                  value={aiStartDate}
                  onChange={(e) => setAiStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Start Time</Label>
                <input
                  type="time"
                  value={aiStartTime}
                  onChange={(e) => setAiStartTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>

            {/* Target Audience */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Target Audience (select multiple)</Label>
              <div className="grid grid-cols-3 gap-3">
                {['BUSINESSES', 'CUSTOMERS', 'CREATORS'].map((aud) => (
                  <Button
                    key={aud}
                    type="button"
                    variant={aiTargetAudience.includes(aud) ? 'default' : 'outline'}
                    onClick={() => toggleAudience(aud)}
                    className="h-auto py-3 flex-col"
                  >
                    <span className="text-2xl mb-1">
                      {aud === 'BUSINESSES' ? '🏢' : aud === 'CUSTOMERS' ? '👤' : '✨'}
                    </span>
                    <span className="text-xs">{aud}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Ticketing */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Ticketing</Label>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Button
                  type="button"
                  variant={aiTicketing === 'FREE' ? 'default' : 'outline'}
                  onClick={() => setAiTicketing('FREE')}
                  className="h-auto py-3 flex-col"
                >
                  <span className="text-2xl mb-1">🎁</span>
                  <span className="text-xs">Free Entry</span>
                </Button>
                <Button
                  type="button"
                  variant={aiTicketing === 'PAID' ? 'default' : 'outline'}
                  onClick={() => setAiTicketing('PAID')}
                  className="h-auto py-3 flex-col"
                >
                  <span className="text-2xl mb-1">💳</span>
                  <span className="text-xs">Paid Tickets</span>
                </Button>
              </div>
              
              {aiTicketing === 'PAID' && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Price Tier</Label>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {['5', '10', '25', '50'].map((price) => (
                      <Button
                        key={price}
                        type="button"
                        variant={aiPriceTier === price ? 'default' : 'outline'}
                        onClick={() => setAiPriceTier(price)}
                        className="h-auto py-2 text-xs"
                      >
                        {price}€
                      </Button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Custom:</Label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={aiPriceTier}
                      onChange={(e) => setAiPriceTier(e.target.value)}
                      className="w-24 px-2 py-1 border rounded text-sm"
                    />
                    <span className="text-xs text-gray-500">€</span>
                  </div>
                </div>
              )}
            </div>

            {/* Capacity */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Expected Capacity: <span className="text-purple-600 font-bold">{aiCapacity}</span> people
              </Label>
              <input
                type="range"
                min="10"
                max="500"
                step="10"
                value={aiCapacity}
                onChange={(e) => setAiCapacity(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>10</span>
                <span>500</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAIDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAIGenerate} disabled={generatingAI || !aiPrompt.trim()}>
              {generatingAI ? (
                <>
                  <span className="animate-spin mr-2">⚡</span>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate 5 Event Ideas
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Options Selection Dialog */}
      <Dialog open={showEventOptions} onOpenChange={setShowEventOptions}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Choose Your Event Concept
              </div>
            </DialogTitle>
            <DialogDescription>
              Select one of the 5 AI-generated event concepts below. Click to view details and continue.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {generatedEventOptions.map((event, index) => (
              <Card 
                key={index}
                className="cursor-pointer hover:border-purple-500 transition-all"
                onClick={() => selectEventOption(event, index)}
              >
                <CardHeader>
                  <CardTitle className="text-lg flex items-start justify-between">
                    <span>{event.title}</span>
                    <Badge variant={event.ticketing?.mode === 'FREE' ? 'secondary' : 'default'}>
                      {event.ticketing?.mode === 'FREE' ? 'Free' : `${event.ticketing?.price}€`}
                    </Badge>
                  </CardTitle>
                  <div className="flex gap-2 flex-wrap mt-2">
                    <Badge variant="outline" className="text-xs">
                      {event.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {event.capacity} people
                    </Badge>
                    {event.targetAudience?.map((aud: string) => (
                      <Badge key={aud} variant="outline" className="text-xs">
                        {aud}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {event.description}
                  </p>
                  {event.highlights && event.highlights.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {event.highlights.slice(0, 3).map((highlight: string, idx: number) => (
                        <div key={idx} className="text-xs text-gray-700 flex items-start gap-1">
                          <span className="text-purple-600">✓</span>
                          <span>{highlight}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEventOptions(false);
                setShowAIDialog(true);
              }}
            >
              ← Back to Generator
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
