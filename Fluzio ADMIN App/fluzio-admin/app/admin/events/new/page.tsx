'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

export default function NewEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAIGenerated, setIsAIGenerated] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    capacity: '',
    countryId: 'DE',
    type: 'FUN_MEETUP',
    category: 'MEETUP',
    targetAudience: [] as string[],
    ticketingMode: 'FREE',
    ticketingPrice: '',
    requirements: '',
    benefits: '',
  });

  useEffect(() => {
    // Check if AI-generated data is passed
    const aiData = searchParams.get('ai');
    if (aiData) {
      try {
        const parsed = JSON.parse(decodeURIComponent(aiData));
        setFormData({
          title: parsed.title || '',
          description: parsed.description || '',
          location: parsed.location || '',
          startDate: '',
          endDate: '',
          capacity: parsed.capacity?.toString() || '',
          countryId: parsed.countryId || 'DE',
          type: parsed.type || 'FUN_MEETUP',
          category: parsed.category || 'MEETUP',
          targetAudience: parsed.targetAudience || [],
          ticketingMode: parsed.ticketing?.mode || 'FREE',
          ticketingPrice: parsed.ticketing?.price?.toString() || '',
          requirements: parsed.requirements || '',
          benefits: parsed.benefits || '',
        });
        setIsAIGenerated(true);
      } catch (e) {
        console.error('Failed to parse AI data:', e);
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Implement event creation API call
      console.log('Creating event:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      router.push('/admin/events');
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="mb-4"
        >
          ← Back
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">
          Create New Event
          {isAIGenerated && (
            <Badge className="ml-3 bg-purple-100 text-purple-800">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Generated
            </Badge>
          )}
        </h1>
        <p className="text-gray-600 mt-2">Add a new event to the platform</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Berlin Tech Summit 2025"
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the event..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Venue name or address"
                />
              </div>

              <div>
                <Label htmlFor="countryId">Country *</Label>
                <select
                  id="countryId"
                  required
                  value={formData.countryId}
                  onChange={(e) => setFormData({ ...formData, countryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="DE">Germany</option>
                  <option value="US">United States</option>
                  <option value="UK">United Kingdom</option>
                  <option value="FR">France</option>
                  <option value="ES">Spain</option>
                  <option value="IT">Italy</option>
                  <option value="NL">Netherlands</option>
                  <option value="BE">Belgium</option>
                  <option value="AT">Austria</option>
                  <option value="CH">Switzerland</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="type">Event Type *</Label>
                <select
                  id="type"
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="FUN_MEETUP">Fun Meetup</option>
                  <option value="BUSINESS_EVENT">Business Event</option>
                  <option value="HYBRID">Hybrid</option>
                </select>
              </div>

              <div>
                <Label htmlFor="category">Primary Category *</Label>
                <select
                  id="category"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <optgroup label="Business & Entrepreneurship">
                    <option value="NETWORKING">🤝 Networking</option>
                    <option value="PITCH_EVENT">🎤 Pitch Event</option>
                    <option value="STARTUP">🚀 Startup</option>
                    <option value="INVESTOR_MEETUP">💰 Investor Meetup</option>
                    <option value="CONFERENCE">📊 Conference</option>
                    <option value="TRADE_SHOW">🏪 Trade Show</option>
                  </optgroup>
                  <optgroup label="Learning & Development">
                    <option value="WORKSHOP">🛠️ Workshop</option>
                    <option value="SEMINAR">📚 Seminar</option>
                    <option value="TRAINING">🎓 Training</option>
                    <option value="HACKATHON">💻 Hackathon</option>
                  </optgroup>
                  <optgroup label="Creative & Arts">
                    <option value="ART_EXHIBITION">🎨 Art Exhibition</option>
                    <option value="MUSIC">🎵 Music</option>
                    <option value="PHOTOGRAPHY">📸 Photography</option>
                    <option value="DESIGN">✏️ Design</option>
                    <option value="CULTURAL">🎭 Cultural</option>
                  </optgroup>
                  <optgroup label="Social & Community">
                    <option value="MEETUP">👥 Meetup</option>
                    <option value="PARTY">🎊 Party</option>
                    <option value="COMMUNITY">🏘️ Community</option>
                    <option value="CHARITY">❤️ Charity</option>
                  </optgroup>
                  <optgroup label="Lifestyle & Wellness">
                    <option value="SPORTS">⚽ Sports</option>
                    <option value="WELLNESS">🧘 Wellness</option>
                    <option value="FOOD_DRINK">🍷 Food & Drink</option>
                    <option value="ENTERTAINMENT">🎬 Entertainment</option>
                  </optgroup>
                  <optgroup label="Business Services">
                    <option value="PRODUCT_LAUNCH">🎁 Product Launch</option>
                    <option value="MARKET">🛍️ Market</option>
                    <option value="EXPO">🏛️ Expo</option>
                    <option value="OTHER">🌟 Other</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="Max attendees"
                />
              </div>
            </div>

            <div>
              <Label>Target Audience *</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.targetAudience.includes('BUSINESSES')}
                    onChange={(e) => {
                      const newAudience = e.target.checked
                        ? [...formData.targetAudience, 'BUSINESSES']
                        : formData.targetAudience.filter(a => a !== 'BUSINESSES');
                      setFormData({ ...formData, targetAudience: newAudience });
                    }}
                  />
                  <span>Businesses</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.targetAudience.includes('CUSTOMERS')}
                    onChange={(e) => {
                      const newAudience = e.target.checked
                        ? [...formData.targetAudience, 'CUSTOMERS']
                        : formData.targetAudience.filter(a => a !== 'CUSTOMERS');
                      setFormData({ ...formData, targetAudience: newAudience });
                    }}
                  />
                  <span>Customers</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.targetAudience.includes('CREATORS')}
                    onChange={(e) => {
                      const newAudience = e.target.checked
                        ? [...formData.targetAudience, 'CREATORS']
                        : formData.targetAudience.filter(a => a !== 'CREATORS');
                      setFormData({ ...formData, targetAudience: newAudience });
                    }}
                  />
                  <span>Creators</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ticketingMode">Ticketing *</Label>
                <select
                  id="ticketingMode"
                  required
                  value={formData.ticketingMode}
                  onChange={(e) => setFormData({ ...formData, ticketingMode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="FREE">Free</option>
                  <option value="PAID">Paid</option>
                </select>
              </div>

              {formData.ticketingMode === 'PAID' && (
                <div>
                  <Label htmlFor="ticketingPrice">Price (USD) *</Label>
                  <Input
                    id="ticketingPrice"
                    type="number"
                    required
                    value={formData.ticketingPrice}
                    onChange={(e) => setFormData({ ...formData, ticketingPrice: e.target.value })}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date & Time *</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date & Time *</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="requirements">Requirements (Optional)</Label>
              <Textarea
                id="requirements"
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                placeholder="Any requirements for attendees..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="benefits">Benefits (Optional)</Label>
              <Textarea
                id="benefits"
                value={formData.benefits}
                onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                placeholder="What attendees will gain from this event..."
                rows={3}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Event'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
