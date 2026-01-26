'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, AlertCircle } from 'lucide-react';
import { createEventAction } from '../actions';
import Image from 'next/image';

export default function NewEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAIGenerated, setIsAIGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);
  const [aiEventData, setAiEventData] = useState<any>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    city: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    capacity: '',
    countryId: 'DE',
    type: 'FUN_MEETUP',
    category: 'MEETUP',
    categories: [] as string[],
    targetAudience: [] as string[],
    ticketingMode: 'FREE' as 'FREE' | 'PAID',
    ticketingPrice: '',
    acceptMoney: true,
    acceptPoints: false,
    pointsPrice: '',
    requirements: '',
    benefits: '',
    highlights: [] as string[],
    imageUrl: '',
  });

  useEffect(() => {
    // Check if AI-generated data is passed
    const aiData = searchParams.get('ai');
    if (aiData) {
      try {
        const parsed = JSON.parse(decodeURIComponent(aiData));
        console.log('[NewEventPage] AI data:', parsed);
        setAiEventData(parsed);
        
        setFormData({
          title: parsed.title || '',
          description: parsed.description || '',
          location: parsed.location || '',
          city: parsed.city || '',
          startDate: parsed.startDate || '',
          startTime: parsed.startTime || '',
          endDate: parsed.endDate || '',
          endTime: parsed.endTime || '',
          capacity: parsed.capacity?.toString() || '',
          countryId: parsed.countryId || 'DE',
          type: parsed.type || 'FUN_MEETUP',
          category: parsed.category || parsed.categories?.[0] || 'MEETUP',
          categories: parsed.categories || [],
          targetAudience: parsed.targetAudience || [],
          ticketingMode: (parsed.ticketing?.mode === 'PAID' ? 'PAID' : 'FREE') as 'FREE' | 'PAID',
          ticketingPrice: parsed.ticketing?.price?.toString() || '',
          acceptMoney: parsed.ticketing?.paymentOptions?.acceptMoney !== false,
          acceptPoints: parsed.ticketing?.paymentOptions?.acceptPoints || false,
          pointsPrice: parsed.ticketing?.paymentOptions?.pointsPrice?.toString() || '',
          requirements: parsed.requirements || '',
          benefits: parsed.benefits || '',
          highlights: parsed.highlights || [],
          imageUrl: parsed.imageUrl || '',
        });
        
        setIsAIGenerated(true);
      } catch (e) {
        console.error('Failed to parse AI data:', e);
        setError('Failed to load AI-generated data');
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      console.log('[NewEventPage] Creating event with data:', formData);
      
      const result = await createEventAction({
        title: formData.title,
        description: formData.description,
        type: formData.type,
        category: formData.category,
        categories: formData.categories.length > 0 ? formData.categories : [formData.category],
        location: formData.location,
        city: formData.city,
        startDate: formData.startDate,
        startTime: formData.startTime,
        endDate: formData.endDate,
        endTime: formData.endTime,
        duration: aiEventData?.duration || 1,
        capacity: parseInt(formData.capacity) || 50,
        countryId: formData.countryId,
        imageUrl: formData.imageUrl || '',
        targetAudience: formData.targetAudience,
        ticketing: {
          mode: formData.ticketingMode,
          price: formData.ticketingMode === 'PAID' ? parseFloat(formData.ticketingPrice) || 0 : 0,
          paymentOptions: formData.ticketingMode === 'PAID' ? {
            acceptMoney: formData.acceptMoney,
            acceptPoints: formData.acceptPoints,
            pointsPrice: formData.acceptPoints ? parseInt(formData.pointsPrice) || 0 : 0
          } : undefined
        },
        highlights: formData.highlights,
        requirements: formData.requirements,
        benefits: formData.benefits,
      });

      if (result.success) {
        console.log('[NewEventPage] Event created successfully:', result.eventId);
        router.push('/admin/events');
      }
    } catch (error: any) {
      console.error('[NewEventPage] Error creating event:', error);
      setError(error.message || 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Only JPG, PNG, WebP, and GIF are allowed.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.');
      return;
    }

    try {
      setUploadingImage(true);
      setError(null);

      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload image');
      }

      const data = await response.json();
      setFormData({ ...formData, imageUrl: data.url });
    } catch (err: any) {
      console.error('[handleImageUpload] Error:', err);
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, imageUrl: '' });
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

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Event Banner Preview */}
      {formData.imageUrl && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Event Banner Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-gray-100">
              <Image
                src={formData.imageUrl}
                alt={formData.title || 'Event banner'}
                fill
                className="object-cover"
                priority
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div>
              <Label htmlFor="imageUpload">Event Banner Image</Label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    id="imageUpload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('imageUpload')?.click()}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Uploading...
                      </>
                    ) : (
                      <>
                        📁 Choose Image
                      </>
                    )}
                  </Button>
                  {formData.imageUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRemoveImage}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      🗑️ Remove Image
                    </Button>
                  )}
                  <span className="text-sm text-gray-500">
                    {formData.imageUrl ? '✓ Image uploaded' : 'JPG, PNG, WebP, GIF (max 5MB)'}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Or paste image URL:
                </div>
                <Input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/event-banner.jpg"
                />
              </div>
            </div>

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

            {/* Payment Section */}
            <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg">Payment Options</h3>
              
              <div>
                <Label htmlFor="ticketingMode">Ticketing Mode *</Label>
                <select
                  id="ticketingMode"
                  required
                  value={formData.ticketingMode}
                  onChange={(e) => setFormData({ ...formData, ticketingMode: e.target.value as 'FREE' | 'PAID' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="FREE">Free Event</option>
                  <option value="PAID">Paid Event</option>
                </select>
              </div>

              {formData.ticketingMode === 'PAID' && (
                <>
                  <div className="space-y-3 border-l-4 border-purple-500 pl-4">
                    <p className="text-sm text-gray-600">Select payment methods attendees can use:</p>
                    
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.acceptMoney}
                          onChange={(e) => setFormData({ ...formData, acceptMoney: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="font-medium">💳 Accept Money</span>
                      </label>
                      
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.acceptPoints}
                          onChange={(e) => setFormData({ ...formData, acceptPoints: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="font-medium">⭐ Accept Points</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {formData.acceptMoney && (
                      <div>
                        <Label htmlFor="ticketingPrice">Price (€) *</Label>
                        <Input
                          id="ticketingPrice"
                          type="number"
                          required={formData.acceptMoney}
                          value={formData.ticketingPrice}
                          onChange={(e) => setFormData({ ...formData, ticketingPrice: e.target.value })}
                          placeholder="0.00"
                          step="0.01"
                        />
                      </div>
                    )}
                    
                    {formData.acceptPoints && (
                      <div>
                        <Label htmlFor="pointsPrice">Price in Points *</Label>
                        <Input
                          id="pointsPrice"
                          type="number"
                          required={formData.acceptPoints}
                          value={formData.pointsPrice}
                          onChange={(e) => setFormData({ ...formData, pointsPrice: e.target.value })}
                          placeholder="100"
                          step="1"
                        />
                      </div>
                    )}
                  </div>

                  {formData.acceptMoney && formData.acceptPoints && (
                    <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-800">
                      ✨ <strong>Flexible Payment:</strong> Attendees can choose to pay with either money or points!
                    </div>
                  )}
                </>
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
