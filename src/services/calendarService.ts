// Database-backed calendar service with Google Calendar integration
import { prisma } from '@/lib/prisma';
import { google, calendar_v3 } from 'googleapis';

export interface TimeSlot {
  id: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  isAvailable: boolean;
  isBooked: boolean;
  leadId?: string;
  appointmentType?: 'pickup' | 'dropoff';
  maxCapacity: number;
  currentBookings: number;
  googleEventId?: string;
}

export interface CalendarDay {
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

export interface BookingRequest {
  leadId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  preferredDate: string;
  preferredTime: string;
  appointmentType: 'pickup' | 'dropoff';
  address?: string;
  deviceModel: string;
  quote: number;
  notes?: string;
}

export class CalendarService {
  // Operating hours: 12:00 PM to 8:00 PM (20:00)
  private static readonly OPERATING_START = 12; // 12 PM
  private static readonly OPERATING_END = 20;   // 8 PM
  private static readonly SLOT_DURATION = 60;   // 60 minutes per slot
  private static readonly MAX_CAPACITY_PER_SLOT = 3; // Increased capacity
  private static readonly ADVANCE_BOOKING_DAYS = 14; // 2 weeks ahead

  private static googleCalendar: calendar_v3.Calendar | null = null;
  
  static async initializeGoogleCalendar(adminUserId: string): Promise<boolean> {
    // Calendar integration disabled for MVP
    return false;
    try {
      // Get admin's calendar integration
      // const integration = await prisma.calendarIntegration.findFirst({
      //   where: { 
      //     adminUserId,
      //     provider: 'google',
      //     isActive: true
      //   }
      // });

      // if (!integration) {
      //   console.log('No Google Calendar integration found for admin');
      //   return false;
      // }

      // Initialize Google Calendar API
      // const oauth2Client = new google.auth.OAuth2(
      //   process.env.GOOGLE_CLIENT_ID,
      //   process.env.GOOGLE_CLIENT_SECRET,
      //   process.env.GOOGLE_REDIRECT_URI
      // );

      // oauth2Client.setCredentials({
      //   access_token: integration.accessToken,
      //   refresh_token: integration.refreshToken,
      // });

      // Handle token refresh if needed
      // oauth2Client.on('tokens', async (tokens) => {
      //   if (tokens.refresh_token) {
      //     // await prisma.calendarIntegration.update({
      //       where: { id: integration.id },
      //       data: {
      //         accessToken: tokens.access_token || integration.accessToken,
      //         refreshToken: tokens.refresh_token || integration.refreshToken,
      //         expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : integration.expiresAt,
      //       }
      //     });
      //   }
      // });

      // this.googleCalendar = google.calendar({ version: 'v3', auth: oauth2Client });
      return true;
    } catch (error) {
      console.error('Failed to initialize Google Calendar:', error);
      return false;
    }
  }

  static async generateCalendar(startDate?: Date): Promise<CalendarDay[]> {
    const start = startDate || new Date();
    const calendar: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Initialize slots if they don't exist
    await this.initializeScheduleSlots();

    for (let i = 0; i < this.ADVANCE_BOOKING_DAYS; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      
      const dateStr = this.formatDate(date);
      const timeSlots = await this.generateTimeSlotsForDate(dateStr);
      
      const day: CalendarDay = {
        date: dateStr,
        dayName: date.toLocaleDateString('en-AU', { weekday: 'long' }),
        isToday: date.getTime() === today.getTime(),
        isPast: date < today,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        totalSlots: timeSlots.length,
        availableSlots: timeSlots.filter(slot => slot.isAvailable).length,
        bookedSlots: timeSlots.filter(slot => slot.isBooked).length,
        timeSlots,
      };

      calendar.push(day);
    }

    return calendar;
  }

  private static async initializeScheduleSlots(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < this.ADVANCE_BOOKING_DAYS; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      const dateStr = this.formatDate(date);
      
      // Create slots for each operating hour
      for (let hour = this.OPERATING_START; hour < this.OPERATING_END; hour++) {
        const startTime = new Date(date);
        startTime.setHours(hour, 0, 0, 0);
        
        const endTime = new Date(date);
        endTime.setHours(hour + 1, 0, 0, 0);

        // Check if slot already exists
        const existingSlot = await prisma.scheduleSlot.findUnique({
          where: {
            date_startTime: {
              date: startTime,
              startTime: startTime
            }
          }
        });

        if (!existingSlot) {
          await prisma.scheduleSlot.create({
            data: {
              date: startTime,
              startTime: startTime,
              endTime: endTime,
              isAvailable: true,
              isBlocked: false
            }
          });
        }
      }
    }
  }

  private static async generateTimeSlotsForDate(date: string): Promise<TimeSlot[]> {
    const slots: TimeSlot[] = [];
    const today = new Date();
    const currentHour = today.getHours();
    const isToday = date === this.formatDate(today);
    
    const dateObj = new Date(date + 'T00:00:00');

    // Get schedule slots from database
    const scheduleSlots = await prisma.scheduleSlot.findMany({
      where: {
        date: {
          gte: dateObj,
          lt: new Date(dateObj.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      include: {
        appointments: {
          where: {
            status: { in: ['scheduled', 'confirmed'] }
          }
        }
      }
    });

    for (const scheduleSlot of scheduleSlots) {
      const hour = scheduleSlot.startTime.getHours();
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      const slotId = `${date}_${startTime}`;

      // Count current bookings
      const currentBookings = scheduleSlot.appointments.length;
      
      // Slot is unavailable if:
      // 1. It's in the past (same day, past hour)
      // 2. It's blocked by admin
      // 3. It's booked to capacity
      const isPastSlot = isToday && hour <= currentHour;
      const isBlocked = scheduleSlot.isBlocked;
      const isFullyBooked = currentBookings >= this.MAX_CAPACITY_PER_SLOT;
      const isAvailable = !isPastSlot && !isBlocked && !isFullyBooked && scheduleSlot.isAvailable;

      slots.push({
        id: slotId,
        date,
        startTime,
        endTime,
        isAvailable,
        isBooked: currentBookings > 0,
        maxCapacity: this.MAX_CAPACITY_PER_SLOT,
        currentBookings,
      });
    }

    return slots;
  }

  static async bookTimeSlot(slotId: string, booking: BookingRequest): Promise<{ success: boolean; message: string; appointment?: any }> {
    try {
      const [date, time] = slotId.split('_');
      const hour = parseInt(time.split(':')[0]);
      
      const dateObj = new Date(date + 'T00:00:00');
      const startTime = new Date(dateObj);
      startTime.setHours(hour, 0, 0, 0);
      
      const endTime = new Date(dateObj);
      endTime.setHours(hour + 1, 0, 0, 0);

      // Get the schedule slot
      const scheduleSlot = await prisma.scheduleSlot.findUnique({
        where: {
          date_startTime: {
            date: startTime,
            startTime: startTime
          }
        },
        include: {
          appointments: {
            where: {
              status: { in: ['scheduled', 'confirmed'] }
            }
          }
        }
      });

      if (!scheduleSlot) {
        return { success: false, message: 'Time slot not found' };
      }

      // Check availability
      const currentBookings = scheduleSlot.appointments.length;
      if (currentBookings >= this.MAX_CAPACITY_PER_SLOT || scheduleSlot.isBlocked || !scheduleSlot.isAvailable) {
        return { success: false, message: 'Time slot is no longer available' };
      }

      // Same-day booking rules
      const today = new Date();
      const isToday = dateObj.toDateString() === today.toDateString();
      const currentHour = today.getHours();
      const cutoffTime = 15; // 3 PM cutoff

      if (isToday && currentHour >= cutoffTime && hour > currentHour) {
        return { success: false, message: 'Same-day bookings must be made before 3:00 PM' };
      }

      // Get lead details for address
      const lead = await prisma.lead.findUnique({
        where: { id: booking.leadId }
      });

      if (!lead) {
        return { success: false, message: 'Lead not found' };
      }

      // Create appointment
      const appointment = await prisma.appointment.create({
        data: {
          leadId: booking.leadId,
          slotId: scheduleSlot.id,
          status: 'scheduled',
          notes: booking.notes,
          isSameDay: isToday,
        },
        include: {
          lead: true,
          slot: true
        }
      });

      // Create address if provided and it's a pickup
      let addressId = null;
      if (booking.appointmentType === 'pickup' && booking.address) {
        const address = await prisma.address.create({
          data: {
            street: booking.address,
            suburb: '',
            postcode: '',
            state: 'NSW',
            formattedAddress: booking.address
          }
        });
        
        addressId = address.id;
        
        // Update appointment with address
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { addressId }
        });
      }

      // Create Google Calendar event if integrated
      let googleEventId = null;
      if (this.googleCalendar) {
        try {
          const googleEvent = await this.createGoogleCalendarEvent({
            summary: `${booking.appointmentType === 'pickup' ? 'Pickup' : 'Drop-off'}: ${booking.deviceModel}`,
            description: `Customer: ${booking.customerName}\nPhone: ${booking.customerPhone}\nEmail: ${booking.customerEmail}\nDevice: ${booking.deviceModel}\nQuote: $${booking.quote}\nNotes: ${booking.notes || 'None'}`,
            start: startTime,
            end: endTime,
            attendees: [{ email: booking.customerEmail }],
            location: booking.appointmentType === 'pickup' ? booking.address : 'Penrith Store'
          });
          googleEventId = googleEvent.id;
        } catch (error) {
          console.error('Failed to create Google Calendar event:', error);
          // Continue without calendar event
        }
      }

      // Log state change
      await prisma.stateLog.create({
        data: {
          appointmentId: appointment.id,
          fromState: null,
          toState: 'scheduled',
          reason: 'Appointment booked by customer'
        }
      });

      console.log('📅 APPOINTMENT BOOKED:', {
        id: appointment.id,
        date: date,
        time: time,
        customer: booking.customerName,
        type: booking.appointmentType,
        googleEventId
      });

      return {
        success: true,
        message: 'Appointment booked successfully',
        appointment: {
          id: appointment.id,
          slotId: appointment.slotId,
          leadId: appointment.leadId,
          customerName: booking.customerName,
          customerPhone: booking.customerPhone,
          customerEmail: booking.customerEmail,
          date,
          startTime: time,
          endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
          appointmentType: booking.appointmentType,
          address: booking.address,
          deviceModel: booking.deviceModel,
          quote: booking.quote,
          status: 'scheduled',
          createdAt: appointment.createdAt,
          notes: booking.notes,
          googleEventId
        }
      };
    } catch (error) {
      console.error('Failed to book appointment:', error);
      return { success: false, message: 'Failed to book appointment' };
    }
  }

  private static async createGoogleCalendarEvent(event: {
    summary: string;
    description: string;
    start: Date;
    end: Date;
    attendees: Array<{ email: string }>;
    location?: string;
  }): Promise<any> {
    if (!this.googleCalendar) {
      throw new Error('Google Calendar not initialized');
    }

    const calendarEvent = {
      summary: event.summary,
      description: event.description,
      start: {
        dateTime: event.start.toISOString(),
        timeZone: 'Australia/Sydney',
      },
      end: {
        dateTime: event.end.toISOString(),
        timeZone: 'Australia/Sydney',
      },
      attendees: event.attendees,
      location: event.location,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 24 hour reminder
          { method: 'popup', minutes: 30 }, // 30 minute reminder
        ],
      },
    };

    const response = await this.googleCalendar.events.insert({
      calendarId: 'primary',
      requestBody: calendarEvent,
    });

    return response.data;
  }

  static async cancelBooking(appointmentId: string): Promise<{ success: boolean; message: string }> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { slot: true }
      });

      if (!appointment) {
        return { success: false, message: 'Appointment not found' };
      }

      // Check if cancellation is allowed (2+ hours before appointment)
      const slotDateTime = appointment.slot.startTime;
      const now = new Date();
      const hoursUntilAppointment = (slotDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilAppointment < 2) {
        return { success: false, message: 'Cannot cancel within 2 hours of appointment time' };
      }

      // Update appointment status
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'cancelled' }
      });

      // Log state change
      await prisma.stateLog.create({
        data: {
          appointmentId: appointmentId,
          fromState: appointment.status,
          toState: 'cancelled',
          reason: 'Cancelled by customer'
        }
      });

      console.log('❌ APPOINTMENT CANCELLED:', appointmentId);

      return { success: true, message: 'Appointment cancelled successfully' };
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
      return { success: false, message: 'Failed to cancel appointment' };
    }
  }

  static async getBookingStats() {
    const today = new Date();
    const endDate = new Date(today.getTime() + this.ADVANCE_BOOKING_DAYS * 24 * 60 * 60 * 1000);

    const slots = await prisma.scheduleSlot.count({
      where: {
        date: {
          gte: today,
          lte: endDate
        }
      }
    });

    const bookedSlots = await prisma.appointment.count({
      where: {
        status: { in: ['scheduled', 'confirmed'] },
        slot: {
          date: {
            gte: today,
            lte: endDate
          }
        }
      }
    });

    const nextSlot = await prisma.scheduleSlot.findFirst({
      where: {
        date: { gte: today },
        isAvailable: true,
        isBlocked: false,
        appointments: {
          none: {
            status: { in: ['scheduled', 'confirmed'] }
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    });

    return {
      totalSlots: slots,
      bookedSlots,
      availableSlots: slots - bookedSlots,
      utilizationRate: slots > 0 ? Math.round((bookedSlots / slots) * 100) : 0,
      nextAvailableSlot: nextSlot ? {
        date: this.formatDate(nextSlot.date),
        time: nextSlot.startTime.toTimeString().slice(0, 5)
      } : null,
    };
  }

  static async blockTimeSlot(date: string, startTime: string, reason?: string): Promise<boolean> {
    try {
      const dateObj = new Date(date + 'T00:00:00');
      const hour = parseInt(startTime.split(':')[0]);
      const startTimeObj = new Date(dateObj);
      startTimeObj.setHours(hour, 0, 0, 0);

      await prisma.scheduleSlot.updateMany({
        where: {
          date: startTimeObj,
          startTime: startTimeObj
        },
        data: {
          isBlocked: true,
          isAvailable: false
        }
      });

      console.log(`🚫 Time slot blocked: ${date} ${startTime} - ${reason || 'No reason provided'}`);
      return true;
    } catch (error) {
      console.error('Failed to block time slot:', error);
      return false;
    }
  }

  static async unblockTimeSlot(date: string, startTime: string): Promise<boolean> {
    try {
      const dateObj = new Date(date + 'T00:00:00');
      const hour = parseInt(startTime.split(':')[0]);
      const startTimeObj = new Date(dateObj);
      startTimeObj.setHours(hour, 0, 0, 0);

      await prisma.scheduleSlot.updateMany({
        where: {
          date: startTimeObj,
          startTime: startTimeObj
        },
        data: {
          isBlocked: false,
          isAvailable: true
        }
      });

      console.log(`✅ Time slot unblocked: ${date} ${startTime}`);
      return true;
    } catch (error) {
      console.error('Failed to unblock time slot:', error);
      return false;
    }
  }

  private static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  static formatDisplayDate(dateString: string): string {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  static formatDisplayTime(timeString: string): string {
    const [hour, minute] = timeString.split(':');
    const hourNum = parseInt(hour);
    const isPM = hourNum >= 12;
    const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    
    return `${displayHour}:${minute} ${isPM ? 'PM' : 'AM'}`;
  }
}

// Google Calendar integration helper functions
export async function setupGoogleCalendarIntegration(adminUserId: string, authCode: string): Promise<boolean> {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(authCode);
    oauth2Client.setCredentials(tokens);

    // Save to database
    // await prisma.calendarIntegration.upsert({
    //   where: {
    //     adminUserId_provider: {
    //       adminUserId,
    //       provider: 'google'
    //     }
    //   },
    //   create: {
    //     adminUserId,
    //     provider: 'google',
    //     accessToken: tokens.access_token!,
    //     refreshToken: tokens.refresh_token!,
    //     expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    //     isActive: true
    //   },
    //   update: {
    //     accessToken: tokens.access_token!,
    //     refreshToken: tokens.refresh_token || undefined,
    //     expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    //     isActive: true
    //   }
    // });

    return true;
  } catch (error) {
    console.error('Failed to setup Google Calendar integration:', error);
    return false;
  }
}

export function getGoogleCalendarAuthUrl(): string {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
    prompt: 'consent'
  });
}