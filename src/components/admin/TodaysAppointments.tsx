'use client';

import { useState, useEffect } from 'react';

interface Appointment {
  id: string;
  status: string;
  isSameDay: boolean;
  notes?: string;
  createdAt: string;
  lead: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phoneNumber?: string;
    sellMethod: string;
    distance?: number;
  };
  quote?: {
    device: string;
    finalQuote: number;
    damages: string[];
    pickupFee?: number;
  };
  slot: {
    date: string;
    startTime: string;
    endTime: string;
  };
  address?: {
    formattedAddress: string;
    suburb: string;
    postcode: string;
  };
}

export default function TodaysAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodaysAppointments();
  }, []);

  const loadTodaysAppointments = async () => {
    try {
      const response = await fetch('/api/admin/appointments');
      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments);
      }
    } catch (error) {
      console.error('Failed to load appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, status: string, reason?: string) => {
    try {
      const response = await fetch('/api/admin/appointments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId,
          status,
          reason
        }),
      });

      if (response.ok) {
        loadTodaysAppointments(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to update appointment:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'scheduled': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-green-100 text-green-800',
      'completed': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type: string) => {
    return type === 'pickup' ? '🚗' : '📍';
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-AU', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Today's Appointments</h3>
        </div>
        <div className="p-6 text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Today's Appointments</h3>
        </div>
        <div className="p-6 text-center text-gray-500">
          <p className="text-lg">📅</p>
          <p className="mt-2">No appointments scheduled for today</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Today's Appointments</h3>
          <span className="text-sm text-gray-600">{appointments.length} appointments</span>
        </div>
      </div>
      
      <div className="divide-y divide-gray-200">
        {appointments.map((appointment) => (
          <div key={appointment.id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-2xl">{getTypeIcon(appointment.lead.sellMethod)}</div>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      {appointment.lead.firstName} {appointment.lead.lastName}
                    </h4>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}
                    >
                      {appointment.status}
                    </span>
                    {appointment.isSameDay && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Same Day
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">
                    {formatTime(appointment.slot.startTime)} - {formatTime(appointment.slot.endTime)}
                    {appointment.quote && ` • ${appointment.quote.device}`}
                  </p>
                  
                  {appointment.lead.sellMethod === 'pickup' && appointment.address && (
                    <p className="text-sm text-gray-500 mt-1">
                      📍 {appointment.address.formattedAddress}
                      {appointment.lead.distance && ` • ${appointment.lead.distance}km`}
                    </p>
                  )}
                  
                  {appointment.lead.sellMethod === 'dropoff' && (
                    <p className="text-sm text-gray-500 mt-1">
                      📍 Drop-off at Penrith location
                    </p>
                  )}

                  <p className="text-xs text-gray-500 mt-1">
                    {appointment.lead.phoneNumber} • {appointment.lead.email}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  ${appointment.quote?.finalQuote || 0}
                </div>
                {appointment.quote?.pickupFee && (
                  <div className="text-sm text-gray-500">
                    +${appointment.quote.pickupFee} pickup
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4 flex items-center space-x-4">
              <a
                href={`tel:${appointment.lead.phoneNumber}`}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                📞 Call
              </a>
              <a
                href={`https://wa.me/${appointment.lead.phoneNumber?.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:text-green-800 text-sm font-medium"
              >
                💬 WhatsApp
              </a>
              <select
                value={appointment.status}
                onChange={(e) => updateAppointmentStatus(appointment.id, e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              {appointment.lead.sellMethod === 'pickup' && appointment.address && (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(appointment.address.formattedAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                >
                  🗺️ Directions
                </a>
              )}
            </div>
            
            {appointment.notes && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Notes:</strong> {appointment.notes}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}