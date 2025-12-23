import React, { useState } from 'react';
import { Modal, Button } from './Common';
import { Calendar, Clock, Phone, Mail, MessageSquare, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { createAppointmentRequest, AppointmentType } from '../services/appointmentBookingService';

interface AppointmentBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mission: {
    id: string;
    title: string;
    businessId: string;
    businessName: string;
    reward: { points: number };
  };
  user: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
}

export const AppointmentBookingModal: React.FC<AppointmentBookingModalProps> = ({
  isOpen,
  onClose,
  mission,
  user
}) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'FORM' | 'SUCCESS' | 'ERROR'>('FORM');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Form state
  const [phone, setPhone] = useState(user.phone || '');
  const [email, setEmail] = useState(user.email || '');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [alternativeDate, setAlternativeDate] = useState('');
  const [alternativeTime, setAlternativeTime] = useState('');
  const [appointmentType, setAppointmentType] = useState<AppointmentType>('IN_PERSON');
  const [serviceRequested, setServiceRequested] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!phone || !email || !preferredDate || !preferredTime || !serviceRequested) {
      setStatus('ERROR');
      setErrorMessage('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setStatus('FORM');
    
    try {
      const result = await createAppointmentRequest(
        mission.id,
        mission.businessId,
        mission.businessName,
        user.id,
        user.name,
        {
          phone,
          email
        },
        {
          preferredDate: new Date(preferredDate + 'T' + preferredTime),
          preferredTime,
          alternativeDate: alternativeDate ? new Date(alternativeDate + 'T' + alternativeTime) : undefined,
          alternativeTime: alternativeTime || undefined,
          appointmentType,
          serviceRequested,
          notes: notes || undefined
        },
        mission.reward.points
      );

      if (result.success) {
        setStatus('SUCCESS');
        // Auto-close after 3 seconds
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        setStatus('ERROR');
        setErrorMessage(result.error || 'Failed to create appointment request');
      }
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      setStatus('ERROR');
      setErrorMessage(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (status === 'SUCCESS') {
      return (
        <div className="text-center py-8 space-y-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Request Sent!</h3>
          <p className="text-gray-600">
            Your appointment request has been sent to {mission.businessName}.
            <br />
            You'll receive a notification when they confirm your booking.
          </p>
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-sm text-blue-800 font-medium">
              💰 You'll earn {mission.reward.points} points 3 days after your appointment is completed!
            </p>
          </div>
        </div>
      );
    }

    if (status === 'ERROR') {
      return (
        <div className="space-y-6">
          <div className="p-4 bg-red-50 rounded-xl border border-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-red-900 mb-1">Error</h4>
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          </div>
          <Button
            onClick={() => setStatus('FORM')}
            className="w-full"
          >
            Try Again
          </Button>
        </div>
      );
    }

    // Get minimum date (today)
    const today = new Date().toISOString().split('T')[0];

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Contact Information</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="w-4 h-4 inline mr-2" />
              Phone Number *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Email Address *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Appointment Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Appointment Type *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAppointmentType('IN_PERSON')}
              className={`px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                appointmentType === 'IN_PERSON'
                  ? 'border-blue-600 bg-blue-50 text-blue-900'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              🏢 In-Person
            </button>
            <button
              type="button"
              onClick={() => setAppointmentType('VIRTUAL')}
              className={`px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                appointmentType === 'VIRTUAL'
                  ? 'border-blue-600 bg-blue-50 text-blue-900'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              💻 Virtual
            </button>
            <button
              type="button"
              onClick={() => setAppointmentType('PHONE')}
              className={`px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                appointmentType === 'PHONE'
                  ? 'border-blue-600 bg-blue-50 text-blue-900'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              📞 Phone
            </button>
            <button
              type="button"
              onClick={() => setAppointmentType('VIDEO')}
              className={`px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                appointmentType === 'VIDEO'
                  ? 'border-blue-600 bg-blue-50 text-blue-900'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              📹 Video
            </button>
          </div>
        </div>

        {/* Service Requested */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service Requested *
          </label>
          <input
            type="text"
            value={serviceRequested}
            onChange={(e) => setServiceRequested(e.target.value)}
            placeholder="e.g., Hair cut, Legal consultation, Financial planning"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Preferred Date & Time */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Preferred Date & Time</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Date *
              </label>
              <input
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                min={today}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Time *
              </label>
              <input
                type="time"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        </div>

        {/* Alternative Date & Time (Optional) */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide flex items-center gap-2">
            Alternative Date & Time 
            <span className="text-xs text-gray-500 font-normal">(Optional)</span>
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Date
              </label>
              <input
                type="date"
                value={alternativeDate}
                onChange={(e) => setAlternativeDate(e.target.value)}
                min={today}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Time
              </label>
              <input
                type="time"
                value={alternativeTime}
                onChange={(e) => setAlternativeTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MessageSquare className="w-4 h-4 inline mr-2" />
            Additional Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special requests or information..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>What happens next:</strong>
            <br />
            1. {mission.businessName} will review your request
            <br />
            2. You'll receive a confirmation notification
            <br />
            3. After your appointment, earn {mission.reward.points} points!
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <Button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5 mr-2" />
                Request Appointment
              </>
            )}
          </Button>
        </div>
      </form>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={status === 'SUCCESS' ? '' : `Book Appointment - ${mission.businessName}`}
    >
      {renderContent()}
    </Modal>
  );
};
