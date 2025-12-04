'use client';

import { useState, useEffect } from 'react';
// import { CalendarService, CalendarDay, TimeSlot } from '@/services/calendarService';

// Temporary interfaces until CalendarService import issue is resolved
interface CalendarDay {
  date: string;
  dayName: string;
  isToday: boolean;
  isPast: boolean;
  isWeekend: boolean;
  totalSlots: number;
  availableSlots: number;
  bookedSlots: number;
  timeSlots: TimeSlot[];
}

interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isBooked: boolean;
  leadId?: string;
  appointmentType?: 'pickup' | 'dropoff';
  maxCapacity: number;
  currentBookings: number;
}

export default function AdminCalendarView() {
  const [calendar, setCalendar] = useState<CalendarDay[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date());
  const [bookingStats, setBookingStats] = useState<any>({});

  useEffect(() => {
    loadData();
  }, [currentWeekStart]);

  const loadData = async () => {
    // const calendarData = await CalendarService.generateCalendar(currentWeekStart);
    // setCalendar(calendarData);
    setCalendar([]); // Temporary empty array
    // Load leads from real API instead of mock data
    // setLeads([]);
    // setBookingStats(CalendarService.getBookingStats());
    setBookingStats({}); // Temporary empty object
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newDate);
  };

  const getSlotInfo = (slot: TimeSlot) => {
    if (!slot.isBooked || !slot.leadId) return null;
    // TODO: Fetch lead data from API based on slot.leadId
    return {
      id: slot.leadId,
      name: 'Lead ' + slot.leadId.slice(-4),
      phone: '0412345678',
      email: 'customer@example.com',
      deviceModel: 'iPhone 15 Pro',
      storage: '128',
      quote: 500,
      pickupFee: 0,
      address: '123 Example Street',
      status: 'Scheduled'
    };
  };

  const getSlotStatusColor = (slot: TimeSlot) => {
    if (!slot.isAvailable && slot.isBooked) {
      return 'bg-blue-100 border-blue-300 text-blue-800';
    }
    if (!slot.isAvailable) {
      return 'bg-gray-100 border-gray-200 text-gray-400';
    }
    return 'bg-green-50 border-green-200 text-green-700';
  };

  const formatTimeRange = (startTime: string, endTime: string) => {
    const formatTime = (time: string) => {
      const [hour, minute] = time.split(':');
      const hourNum = parseInt(hour);
      const isPM = hourNum >= 12;
      const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
      return `${displayHour}:${minute} ${isPM ? 'PM' : 'AM'}`;
    };
    return `${formatTime(startTime)}`;
  };

  // Get current week for display
  const weekStart = new Date(currentWeekStart);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-900">{bookingStats.bookedSlots || 0}</div>
          <div className="text-sm text-blue-700">Booked Slots</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-900">{bookingStats.availableSlots || 0}</div>
          <div className="text-sm text-green-700">Available Slots</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-900">{bookingStats.utilizationRate || 0}%</div>
          <div className="text-sm text-orange-700">Utilization Rate</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-900">{bookingStats.totalSlots || 0}</div>
          <div className="text-sm text-purple-700">Total Slots</div>
        </div>
      </div>

      {/* Calendar Header */}
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-lg font-medium text-gray-900">
            Weekly Schedule
          </h4>
          <p className="text-sm text-gray-600">
            {weekStart.toLocaleDateString('en-AU', { month: 'long', day: 'numeric' })} - {' '}
            {weekEnd.toLocaleDateString('en-AU', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            ← Previous
          </button>
          <button
            onClick={() => setCurrentWeekStart(new Date())}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
          >
            Today
          </button>
          <button
            onClick={() => navigateWeek('next')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {calendar.slice(0, 7).map((day, index) => (
            <div key={index} className="p-4 text-center border-r border-gray-200 last:border-r-0">
              <div className="text-sm font-medium text-gray-900">{day.dayName}</div>
              <div className={`text-lg font-bold ${day.isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                {new Date(day.date).getDate()}
              </div>
              <div className="text-xs text-gray-500">
                {day.bookedSlots}/{day.totalSlots} booked
              </div>
            </div>
          ))}
        </div>

        {/* Time Slots */}
        <div className="grid grid-cols-7">
          {calendar.slice(0, 7).map((day, dayIndex) => (
            <div key={dayIndex} className="border-r border-gray-200 last:border-r-0 min-h-96">
              {day.isPast ? (
                <div className="p-4 text-center text-gray-400 h-32 flex items-center justify-center">
                  <span className="text-sm">Past Date</span>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {day.timeSlots.map((slot) => {
                    const leadInfo = getSlotInfo(slot);
                    return (
                      <div
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-2 text-xs rounded border cursor-pointer hover:shadow-sm transition-all ${getSlotStatusColor(slot)}`}
                        title={slot.isBooked && leadInfo ? `${leadInfo.name} - ${leadInfo.deviceModel}` : formatTimeRange(slot.startTime, slot.endTime)}
                      >
                        <div className="font-medium">{formatTimeRange(slot.startTime, slot.endTime)}</div>
                        {slot.isBooked && leadInfo ? (
                          <div className="space-y-1">
                            <div className="truncate">{leadInfo.name}</div>
                            <div className="truncate text-xs opacity-75">{leadInfo.deviceModel}</div>
                            <div className="flex items-center text-xs">
                              <span className={`px-1 py-0.5 rounded text-xs ${
                                slot.appointmentType === 'pickup' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {slot.appointmentType === 'pickup' ? '🚗 Pickup' : '📍 Drop-off'}
                              </span>
                            </div>
                          </div>
                        ) : slot.isAvailable ? (
                          <div className="text-center text-gray-500">Available</div>
                        ) : (
                          <div className="text-center text-gray-400">Unavailable</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Slot Details Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedSlot.isBooked ? 'Appointment Details' : 'Time Slot Details'}
              </h3>
              <button
                onClick={() => setSelectedSlot(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date & Time</label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedSlot.date} at {formatTimeRange(selectedSlot.startTime, selectedSlot.endTime)}
                </p>
              </div>

              {selectedSlot.isBooked && selectedSlot.leadId && (() => {
                const leadInfo = getSlotInfo(selectedSlot);
                return leadInfo && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Customer</label>
                      <p className="mt-1 text-sm text-gray-900">{leadInfo.name}</p>
                      <p className="text-sm text-gray-500">{leadInfo.phone}</p>
                      <p className="text-sm text-gray-500">{leadInfo.email}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Device & Quote</label>
                      <p className="mt-1 text-sm text-gray-900">{leadInfo.deviceModel} • {leadInfo.storage}GB</p>
                      <p className="text-sm text-gray-900 font-medium">${leadInfo.quote}</p>
                      {leadInfo.pickupFee && leadInfo.pickupFee > 0 && (
                        <p className="text-sm text-gray-500">+${leadInfo.pickupFee} pickup fee</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Service Type</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedSlot.appointmentType === 'pickup' ? '🚗 Pickup' : '📍 Drop-off'}
                      </p>
                      {leadInfo.address && selectedSlot.appointmentType === 'pickup' && (
                        <p className="text-sm text-gray-500">{leadInfo.address}</p>
                      )}
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <a
                        href={`tel:${leadInfo.phone}`}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-center font-medium hover:bg-blue-700"
                      >
                        📞 Call
                      </a>
                      <a
                        href={`https://wa.me/61${leadInfo.phone.replace(/^0/, '')}`}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg text-center font-medium hover:bg-green-700"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        📱 WhatsApp
                      </a>
                      {selectedSlot.appointmentType === 'pickup' && leadInfo.address && (
                        <a
                          href={`https://maps.google.com/maps?q=${encodeURIComponent(leadInfo.address)}`}
                          className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg text-center font-medium hover:bg-orange-700"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          🗺️ Directions
                        </a>
                      )}
                    </div>
                  </>
                );
              })()}

              {!selectedSlot.isBooked && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">
                    This time slot is {selectedSlot.isAvailable ? 'available for booking' : 'not available'}.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-between text-xs bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded mr-2"></div>
            <span className="text-gray-600">Available</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded mr-2"></div>
            <span className="text-gray-600">Booked</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded mr-2"></div>
            <span className="text-gray-600">Unavailable</span>
          </div>
        </div>
        
        <div className="text-gray-500">
          Operating Hours: 12:00 PM - 8:00 PM • 1 hour slots
        </div>
      </div>
    </div>
  );
}