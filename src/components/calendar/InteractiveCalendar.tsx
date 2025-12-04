'use client';

import { useState, useEffect } from 'react';
import ProgressStepper, { useProgressTracking } from '../ProgressStepper';
import { useAnalytics } from '@/hooks/useAnalytics';

interface LeadData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  sellMethod: 'pickup' | 'dropoff';
  address: string;
  distance?: number;
}

interface QuoteData {
  id: string;
  device: string;
  finalQuote: number;
  expiresAt: string;
}

interface InteractiveCalendarProps {
  leadData: LeadData;
  quoteData: QuoteData;
  onComplete: () => void;
}

interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isSameDay: boolean;
  dateTime: string;
}

export default function InteractiveCalendar({ 
  leadData,
  quoteData,
  onComplete
}: InteractiveCalendarProps) {
  const analytics = useAnalytics();
  const { trackStepCompleted, trackDropOff } = useProgressTracking(leadData.id);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingNotes, setBookingNotes] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingMessage, setBookingMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    loadAvailableSlots();
  }, [leadData.id]);

  const loadAvailableSlots = async () => {
    try {
      const response = await fetch(`/api/schedule?leadId=${leadData.id}&days=7`);
      const data = await response.json();
      
      if (data.availableSlots) {
        setAvailableSlots(data.availableSlots);
      }
    } catch (error) {
      console.error('Failed to load available slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotClick = (slot: TimeSlot) => {
    if (!slot.isAvailable) return;
    setSelectedSlot(slot);
  };

  const handleBookSlot = async () => {
    if (!selectedSlot) return;

    setIsBooking(true);
    setBookingMessage('');

    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId: leadData.id,
          date: selectedSlot.date,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          notes: bookingNotes.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setBookingMessage('✅ Appointment scheduled successfully!');
        setIsCompleted(true);
        trackStepCompleted('scheduling', 'confirmed');
        setTimeout(() => {
          onComplete();
        }, 3000);
      } else {
        setBookingMessage(`❌ ${data.error || 'Failed to schedule appointment'}`);
        trackDropOff('scheduling', 'booking_failed');
      }
    } catch (error) {
      console.error('Booking error:', error);
      setBookingMessage('❌ Failed to schedule appointment. Please try again.');
      trackDropOff('scheduling', 'booking_error');
    } finally {
      setIsBooking(false);
    }
  };

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour);
    const isPM = hourNum >= 12;
    const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    return `${displayHour}:${minute} ${isPM ? 'PM' : 'AM'}`;
  };

  const formatTimeRange = (startTime: string, endTime: string) => {
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const groupSlotsByDate = (slots: TimeSlot[]) => {
    const grouped: { [key: string]: TimeSlot[] } = {};
    slots.forEach(slot => {
      if (!grouped[slot.date]) {
        grouped[slot.date] = [];
      }
      grouped[slot.date].push(slot);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="text-gray-600">Loading available times...</p>
      </div>
    );
  }

  // Show completion state when appointment is successfully booked
  if (isCompleted) {
    return (
      <div className="space-y-6">
        <ProgressStepper currentStep="confirmed" leadId={leadData.id} />
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-green-600 text-6xl mb-6">🎉</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Appointment Confirmed!</h3>
          <p className="text-gray-600 mb-8">
            Great! Your appointment has been scheduled and we've sent you a confirmation email.
            You'll receive a reminder 2 hours before your appointment.
          </p>
          
          {/* Appointment Details */}
          <div className="bg-green-50 rounded-lg p-6 mb-8 text-left max-w-md mx-auto">
            <h4 className="font-semibold text-gray-900 mb-4">Appointment Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">{selectedSlot ? formatDate(selectedSlot.date) : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="font-medium">
                  {selectedSlot ? formatTimeRange(selectedSlot.startTime, selectedSlot.endTime) : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium">{leadData.sellMethod === 'pickup' ? 'Pickup' : 'Drop-off at Penrith'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Device:</span>
                <span className="font-medium">{quoteData.device}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expected Payment:</span>
                <span className="font-medium text-green-600">${quoteData.finalQuote}</span>
              </div>
              {leadData.address && leadData.sellMethod === 'pickup' && (
                <div className="pt-2 border-t">
                  <div className="text-gray-600 mb-1">Pickup Address:</div>
                  <div className="font-medium text-sm">{leadData.address}</div>
                </div>
              )}
            </div>
          </div>

          {/* What Happens Next */}
          <div className="text-left max-w-md mx-auto mb-8">
            <h4 className="font-semibold text-gray-900 mb-4">What happens next?</h4>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">1</div>
                <div>We'll send you a reminder 2 hours before your appointment</div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">2</div>
                <div>{leadData.sellMethod === 'pickup' ? 'Our team arrives at your location' : 'Meet us at our Penrith location'}</div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">3</div>
                <div>Quick device inspection and immediate payment</div>
              </div>
            </div>
          </div>

          {/* Contact Options */}
          <div className="border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-600 mb-4">
              Need to reschedule or have questions?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://wa.me/61415957027"
                className="inline-flex items-center justify-center bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 text-sm"
              >
                📱 WhatsApp +61 415 957 027
              </a>
              <a
                href="tel:+61415957027"
                className="inline-flex items-center justify-center bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 text-sm"
              >
                📞 Call Us
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const groupedSlots = groupSlotsByDate(availableSlots);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Choose Your Appointment Time</h3>
        <p className="text-sm text-gray-600 mt-1">
          {leadData.sellMethod === 'pickup' ? 'Pickup' : 'Drop-off at Penrith'} • Operating hours: 12:00 PM - 8:00 PM
        </p>
        {leadData.sellMethod === 'pickup' && (
          <div className="mt-2 text-xs text-blue-600">
            💡 Same-day pickup available if booked before 3:00 PM
          </div>
        )}
      </div>

      {/* Available Slots */}
      <div className="p-6">
        {Object.keys(groupedSlots).length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No available appointment times found.</p>
            <p className="text-sm mt-2">Please contact us to arrange a time.</p>
            <a 
              href="https://wa.me/61415957027" 
              className="inline-block mt-4 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
            >
              📱 WhatsApp Us
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSlots).map(([date, slots]) => (
              <div key={date}>
                <h4 className="font-medium text-gray-900 mb-3">
                  {formatDate(date)}
                  {slots.some(slot => slot.isSameDay) && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      Same Day Available
                    </span>
                  )}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {slots.map((slot, index) => (
                    <button
                      key={`${slot.date}-${slot.startTime}-${index}`}
                      onClick={() => handleSlotClick(slot)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                        selectedSlot?.dateTime === slot.dateTime
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                      } ${
                        slot.isSameDay ? 'ring-2 ring-blue-200' : ''
                      }`}
                    >
                      {formatTime(slot.startTime)}
                      {slot.isSameDay && (
                        <div className="text-xs opacity-75">Same day</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Form */}
      {selectedSlot && (
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Confirm Your Appointment</h4>
              <div className="bg-blue-50 rounded-lg p-4 space-y-2 text-sm">
                <div><strong>Date:</strong> {formatDate(selectedSlot.date)}</div>
                <div><strong>Time:</strong> {formatTimeRange(selectedSlot.startTime, selectedSlot.endTime)}</div>
                <div><strong>Type:</strong> {leadData.sellMethod === 'pickup' ? 'Pickup' : 'Drop-off at Penrith'}</div>
                <div><strong>Device:</strong> {quoteData.device}</div>
                <div><strong>Quote:</strong> ${quoteData.finalQuote}</div>
                {leadData.address && leadData.sellMethod === 'pickup' && (
                  <div><strong>Address:</strong> {leadData.address}</div>
                )}
                {selectedSlot.isSameDay && (
                  <div className="text-blue-600 font-medium">⚡ Same-day service</div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                rows={3}
                placeholder="Any special instructions or information about your device..."
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
              />
            </div>

            {bookingMessage && (
              <div className={`p-3 rounded-lg text-sm ${
                bookingMessage.includes('✅') 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {bookingMessage}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleBookSlot}
                disabled={isBooking}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isBooking ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin mr-2">⏳</span>
                    Scheduling...
                  </span>
                ) : (
                  'Confirm Appointment'
                )}
              </button>
              
              <button
                onClick={() => setSelectedSlot(null)}
                className="px-4 py-3 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Footer */}
      <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div>
            All appointments subject to availability and confirmation
          </div>
          <div>
            Need help? <a href="https://wa.me/61415957027" className="text-blue-600 hover:underline">WhatsApp us</a>
          </div>
        </div>
      </div>
    </div>
  );
}