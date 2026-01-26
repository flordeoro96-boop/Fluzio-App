/**
 * Creator Booking Modal Component
 * 
 * Allows businesses to book a creator's services
 * - Package selection
 * - Date selection with availability check
 * - Requirements input
 * - Booking summary and confirmation
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  DollarSign,
  Check,
  AlertCircle,
  Loader,
  ChevronRight,
  Package,
  FileText
} from 'lucide-react';
import {
  getActiveCreatorPackages,
  ServicePackage
} from '../services/creatorPackagesService';
import {
  createBooking,
  isDateAvailable
} from '../services/creatorBookingService';
import { getNextAvailableDates } from '../services/creatorAvailabilityService';

interface CreatorBookingModalProps {
  creatorId: string;
  creatorName: string;
  businessId: string;
  businessName: string;
  onClose: () => void;
  onBookingCreated: (bookingId: string) => void;
}

type Step = 'package' | 'date' | 'requirements' | 'review';

const tierColors = {
  bronze: 'from-orange-400 to-orange-600',
  silver: 'from-gray-400 to-gray-600',
  gold: 'from-yellow-400 to-yellow-600',
  custom: 'from-purple-400 to-purple-600'
};

export const CreatorBookingModal: React.FC<CreatorBookingModalProps> = ({
  creatorId,
  creatorName,
  businessId,
  businessName,
  onClose,
  onBookingCreated
}) => {
  const [step, setStep] = useState<Step>('package');
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [requirements, setRequirements] = useState('');
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPackages();
  }, [creatorId]);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const data = await getActiveCreatorPackages(creatorId);
      setPackages(data);
    } catch (error) {
      console.error('Error loading packages:', error);
      setError('Failed to load service packages');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableDates = async () => {
    try {
      setLoading(true);
      const dates = await getNextAvailableDates(creatorId, 30);
      setAvailableDates(dates.map(d => new Date(d)));
    } catch (error) {
      console.error('Error loading available dates:', error);
      setError('Failed to load available dates');
    } finally {
      setLoading(false);
    }
  };

  const handlePackageSelect = (pkg: ServicePackage) => {
    setSelectedPackage(pkg);
    setStep('date');
    loadAvailableDates();
  };

  const handleDateSelect = async (date: Date) => {
    try {
      const available = await isDateAvailable(creatorId, date);
      if (available) {
        setSelectedDate(date);
        setError('');
      } else {
        setError('This date is no longer available. Please select another date.');
      }
    } catch (error) {
      setError('Failed to check date availability');
    }
  };

  const handleCreateBooking = async () => {
    if (!selectedPackage || !selectedDate || !requirements.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setCreating(true);
      setError('');

      const bookingId = await createBooking(
        {
          businessId,
          businessName,
          creatorId,
          creatorName,
          packageId: selectedPackage.id,
          startDate: selectedDate,
          requirements: requirements.trim()
        },
        {
          name: selectedPackage.name,
          tier: selectedPackage.tier,
          price: selectedPackage.price,
          currency: selectedPackage.currency,
          deliveryDays: selectedPackage.deliveryDays,
          features: selectedPackage.features,
          deliverables: selectedPackage.deliverables
        }
      );

      onBookingCreated(bookingId);
    } catch (error) {
      console.error('Error creating booking:', error);
      setError('Failed to create booking. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'package' as Step, label: 'Package' },
      { key: 'date' as Step, label: 'Date' },
      { key: 'requirements' as Step, label: 'Details' },
      { key: 'review' as Step, label: 'Review' }
    ];

    const currentIndex = steps.findIndex(s => s.key === step);

    return (
      <div className="flex items-center justify-between mb-6">
        {steps.map((s, idx) => (
          <React.Fragment key={s.key}>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  idx <= currentIndex
                    ? 'bg-[#6C4BFF] text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {idx < currentIndex ? <Check className="w-4 h-4" /> : idx + 1}
              </div>
              <span
                className={`text-sm font-medium ${
                  idx <= currentIndex ? 'text-gray-900' : 'text-gray-500'
                }`}
              >
                {s.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 ${
                  idx < currentIndex ? 'bg-[#6C4BFF]' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Book {creatorName}</h2>
            <p className="text-gray-600 mt-1">Select a package and schedule your booking</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="p-6 border-b border-gray-100">
          {renderStepIndicator()}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-red-900">Error</div>
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-[#6C4BFF]" />
            </div>
          )}

          {/* Step 1: Package Selection */}
          {step === 'package' && !loading && (
            <div className="space-y-4">
              {packages.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No packages available</p>
                </div>
              ) : (
                packages.map(pkg => (
                  <button
                    key={pkg.id}
                    onClick={() => handlePackageSelect(pkg)}
                    className="w-full text-left border-2 border-gray-200 rounded-xl p-6 hover:border-[#6C4BFF] hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className={`inline-block bg-gradient-to-r ${tierColors[pkg.tier]} text-white px-3 py-1 rounded-full text-xs font-semibold mb-2`}>
                          {pkg.tier.charAt(0).toUpperCase() + pkg.tier.slice(1)}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{pkg.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-gray-900">${pkg.price}</div>
                        <div className="text-sm text-gray-600">USD</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {pkg.deliveryDays} days
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        {pkg.revisions === -1 ? 'Unlimited' : pkg.revisions} revisions
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {pkg.features.slice(0, 4).map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Step 2: Date Selection */}
          {step === 'date' && !loading && selectedPackage && (
            <div>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{selectedPackage.name}</div>
                    <div className="text-sm text-gray-600">
                      ${selectedPackage.price} • {selectedPackage.deliveryDays} day delivery
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setStep('package');
                      setSelectedDate(null);
                    }}
                    className="text-sm text-[#6C4BFF] hover:text-[#5a3dd9] font-medium"
                  >
                    Change
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Select Start Date</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Choose when you want the creator to start working on your project
                </p>
              </div>

              {availableDates.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No available dates in the next 30 days</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {availableDates.slice(0, 15).map((date, idx) => {
                    const isSelected = selectedDate && 
                      date.toDateString() === selectedDate.toDateString();
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => handleDateSelect(date)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-[#6C4BFF] bg-[#6C4BFF]/10'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`text-xs font-medium ${
                          isSelected ? 'text-[#6C4BFF]' : 'text-gray-600'
                        }`}>
                          {date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className={`text-lg font-bold ${
                          isSelected ? 'text-[#6C4BFF]' : 'text-gray-900'
                        }`}>
                          {date.getDate()}
                        </div>
                        <div className={`text-xs ${
                          isSelected ? 'text-[#6C4BFF]' : 'text-gray-600'
                        }`}>
                          {date.toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedDate && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-900 font-semibold mb-1">
                    <Check className="w-5 h-5 text-green-600" />
                    Date Selected
                  </div>
                  <div className="text-sm text-green-700">
                    Start: {selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="text-sm text-green-700">
                    Est. Delivery: {new Date(
                      selectedDate.getTime() + selectedPackage.deliveryDays * 24 * 60 * 60 * 1000
                    ).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Requirements */}
          {step === 'requirements' && selectedPackage && selectedDate && (
            <div>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600 mb-1">Package</div>
                    <div className="font-semibold text-gray-900">{selectedPackage.name}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 mb-1">Start Date</div>
                    <div className="font-semibold text-gray-900">
                      {selectedDate.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Project Requirements *
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Provide detailed information about what you need. Be as specific as possible.
                </p>
                <textarea
                  value={requirements}
                  onChange={e => setRequirements(e.target.value)}
                  placeholder="Describe your project requirements, goals, target audience, brand guidelines, preferred style, any reference materials, etc."
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C4BFF] focus:border-transparent resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="text-xs text-gray-500">
                    {requirements.length} characters
                  </div>
                  {requirements.length < 50 && requirements.length > 0 && (
                    <div className="text-xs text-orange-600">
                      Please provide more details (min. 50 characters)
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 'review' && selectedPackage && selectedDate && (
            <div>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Booking Summary</h3>
                
                {/* Package Info */}
                <div className="bg-white rounded-lg p-4 mb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className={`inline-block bg-gradient-to-r ${tierColors[selectedPackage.tier]} text-white px-3 py-1 rounded-full text-xs font-semibold mb-2`}>
                        {selectedPackage.tier.charAt(0).toUpperCase() + selectedPackage.tier.slice(1)}
                      </div>
                      <div className="font-semibold text-gray-900">{selectedPackage.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">${selectedPackage.price}</div>
                      <div className="text-xs text-gray-600">USD</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {selectedPackage.description}
                  </div>
                </div>

                {/* Schedule */}
                <div className="bg-white rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Start Date</div>
                      <div className="font-semibold text-gray-900">
                        {selectedDate.toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Est. Delivery</div>
                      <div className="font-semibold text-gray-900">
                        {new Date(
                          selectedDate.getTime() + selectedPackage.deliveryDays * 24 * 60 * 60 * 1000
                        ).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Breakdown */}
                <div className="bg-white rounded-lg p-4">
                  <div className="font-semibold text-gray-900 mb-3">Payment Schedule</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Deposit (50%)</span>
                      <span className="font-semibold text-gray-900">
                        ${(selectedPackage.price * 0.5).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Final Payment (50%)</span>
                      <span className="font-semibold text-gray-900">
                        ${(selectedPackage.price * 0.5).toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">Total</span>
                        <span className="text-xl font-bold text-gray-900">
                          ${selectedPackage.price}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <div className="font-semibold mb-1">Before you book:</div>
                    <ul className="list-disc list-inside space-y-1 text-blue-800">
                      <li>50% deposit required to confirm booking</li>
                      <li>Final 50% due upon delivery</li>
                      <li>Cancellations must be made 48 hours before start date</li>
                      <li>Creator will confirm availability within 24 hours</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-between">
          {step !== 'package' && (
            <button
              onClick={() => {
                if (step === 'date') setStep('package');
                else if (step === 'requirements') setStep('date');
                else if (step === 'review') setStep('requirements');
              }}
              disabled={creating}
              className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Back
            </button>
          )}

          <div className="flex-1" />

          {step !== 'review' ? (
            <button
              onClick={() => {
                if (step === 'package') {
                  // Package must be selected to proceed
                  return;
                } else if (step === 'date') {
                  if (selectedDate) setStep('requirements');
                } else if (step === 'requirements') {
                  if (requirements.trim().length >= 50) {
                    setStep('review');
                  } else {
                    setError('Please provide at least 50 characters in the requirements');
                  }
                }
              }}
              disabled={
                (step === 'date' && !selectedDate) ||
                (step === 'requirements' && requirements.trim().length < 50)
              }
              className="px-6 py-3 bg-[#6C4BFF] text-white rounded-lg hover:bg-[#5a3dd9] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleCreateBooking}
              disabled={creating}
              className="px-6 py-3 bg-[#6C4BFF] text-white rounded-lg hover:bg-[#5a3dd9] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {creating ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Creating Booking...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirm Booking
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
