'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { getEventsAction, updateEventAction } from '../actions';
import Image from 'next/image';
import { Event } from '@/lib/types';

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
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
    imageUrl: '',
    ticketingMode: 'FREE' as 'FREE' | 'PAID',
    ticketingPrice: '',
    acceptMoney: true,
    acceptPoints: false,
    pointsPrice: '',
  });

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const result = await getEventsAction({});
      
      if (result.success && result.events) {
        const foundEvent = result.events.find(e => e.id === eventId);
        if (foundEvent) {
          setEvent(foundEvent);
          setFormData({
            title: foundEvent.title || '',
            description: foundEvent.description || '',
            location: foundEvent.location || '',
            city: foundEvent.city || '',
            startDate: foundEvent.startDate || '',
            startTime: foundEvent.startTime || '',
            endDate: foundEvent.endDate || '',
            endTime: foundEvent.endTime || '',
            capacity: foundEvent.capacity?.toString() || '',
            countryId: foundEvent.countryId || 'DE',
            type: foundEvent.type || 'FUN_MEETUP',
            category: foundEvent.categories?.[0] || 'MEETUP',
            imageUrl: foundEvent.imageUrl || '',
            ticketingMode: foundEvent.ticketing?.mode || 'FREE',
            ticketingPrice: foundEvent.ticketing?.price?.toString() || '',
            acceptMoney: foundEvent.ticketing?.paymentOptions?.acceptMoney !== false,
            acceptPoints: foundEvent.ticketing?.paymentOptions?.acceptPoints || false,
            pointsPrice: foundEvent.ticketing?.paymentOptions?.pointsPrice?.toString() || '',
          });
        } else {
          setError('Event not found');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await updateEventAction(eventId, {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        category: formData.category,
        location: formData.location,
        city: formData.city,
        startDate: formData.startDate,
        startTime: formData.startTime,
        endDate: formData.endDate,
        endTime: formData.endTime,
        capacity: parseInt(formData.capacity) || 50,
        imageUrl: formData.imageUrl,
        ticketing: {
          mode: formData.ticketingMode,
          price: formData.ticketingMode === 'PAID' ? parseFloat(formData.ticketingPrice) || 0 : 0,
          paymentOptions: formData.ticketingMode === 'PAID' ? {
            acceptMoney: formData.acceptMoney,
            acceptPoints: formData.acceptPoints,
            pointsPrice: formData.acceptPoints ? parseInt(formData.pointsPrice) || 0 : 0
          } : undefined
        },
      });

      router.push('/admin/events');
    } catch (error: any) {
      console.error('[EditEventPage] Error updating event:', error);
      setError(error.message || 'Failed to update event');
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

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
        <Button onClick={() => router.back()} className="mt-4">
          ← Back to Events
        </Button>
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
        <p className="text-gray-600 mt-2">Update event details</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {formData.imageUrl && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Event Banner</CardTitle>
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
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Berlin"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="countryId">Country *</Label>
                <select
                  id="countryId"
                  required
                  value={formData.countryId}
                  onChange={(e) => setFormData({ ...formData, countryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  <option value="NETWORKING">Networking</option>
                  <option value="WORKSHOP">Workshop</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="capacity">Capacity *</Label>
              <Input
                id="capacity"
                type="number"
                required
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                placeholder="100"
              />
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
                          min="0"
                          step="0.01"
                          value={formData.ticketingPrice}
                          onChange={(e) => setFormData({ ...formData, ticketingPrice: e.target.value })}
                          placeholder="10.00"
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
                          min="0"
                          step="1"
                          value={formData.pointsPrice}
                          onChange={(e) => setFormData({ ...formData, pointsPrice: e.target.value })}
                          placeholder="100"
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

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Event'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
