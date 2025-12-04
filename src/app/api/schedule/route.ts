import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface ScheduleRequest {
  leadId: string;
  date: string; // ISO date string
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ScheduleRequest = await request.json();
    const { leadId, date, startTime, endTime, notes } = body;

    // Validate input
    if (!leadId || !date || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find the verified lead
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        quote: true,
        appointment: true
      }
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (!lead.isVerified) {
      return NextResponse.json({ error: 'Lead not verified' }, { status: 400 });
    }

    if (lead.appointment) {
      return NextResponse.json({ error: 'Appointment already exists' }, { status: 400 });
    }

    // Parse date and times
    const appointmentDate = new Date(date);
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startDateTime = new Date(appointmentDate);
    startDateTime.setHours(startHour, startMinute, 0, 0);

    const endDateTime = new Date(appointmentDate);
    endDateTime.setHours(endHour, endMinute, 0, 0);

    // Check if slot is within operating hours (12:00-20:00)
    if (startHour < 12 || startHour >= 20) {
      return NextResponse.json({ error: 'Selected time is outside operating hours (12:00-20:00)' }, { status: 400 });
    }

    // Check if it's same-day eligibility
    const now = new Date();
    const isToday = appointmentDate.toDateString() === now.toDateString();
    const isSameDay = isToday && 
                     now.getHours() <= 15 && 
                     lead.distance !== null && 
                     lead.distance <= 20;

    // Create or find schedule slot
    let scheduleSlot = await prisma.scheduleSlot.findFirst({
      where: {
        date: appointmentDate,
        startTime: startDateTime
      }
    });

    if (!scheduleSlot) {
      scheduleSlot = await prisma.scheduleSlot.create({
        data: {
          date: appointmentDate,
          startTime: startDateTime,
          endTime: endDateTime,
          isAvailable: true
        }
      });
    }

    if (!scheduleSlot.isAvailable || scheduleSlot.isBlocked) {
      return NextResponse.json({ error: 'Selected time slot is not available' }, { status: 400 });
    }

    // Create address record if pickup
    let addressId = null;
    if (lead.sellMethod === 'pickup' && lead.address) {
      // Parse address (simplified - in production would use proper address parsing)
      const addressRecord = await prisma.address.create({
        data: {
          street: lead.address,
          suburb: 'Unknown', // Would be parsed from address
          postcode: '0000',  // Would be parsed from address
          state: 'NSW',
          formattedAddress: lead.address
        }
      });
      addressId = addressRecord.id;
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        leadId,
        slotId: scheduleSlot.id,
        addressId,
        status: 'scheduled',
        notes,
        isSameDay
      }
    });

    // Mark slot as unavailable
    await prisma.scheduleSlot.update({
      where: { id: scheduleSlot.id },
      data: { isAvailable: false }
    });

    // Log state change
    await prisma.stateLog.create({
      data: {
        appointmentId: appointment.id,
        toState: 'scheduled',
        reason: 'Initial appointment creation'
      }
    });

    // Log analytics
    await prisma.analyticsEvent.create({
      data: {
        event: 'appointment_scheduled',
        userId: leadId,
        properties: JSON.stringify({
          appointmentId: appointment.id,
          date: appointmentDate.toISOString(),
          time: startTime,
          sellMethod: lead.sellMethod,
          isSameDay,
          quote: lead.quote?.finalQuote || 0
        })
      }
    });

    return NextResponse.json({
      message: 'Appointment scheduled successfully',
      appointment: {
        id: appointment.id,
        date: appointmentDate.toISOString(),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        status: appointment.status,
        isSameDay: appointment.isSameDay
      }
    });

  } catch (error) {
    console.error('Schedule appointment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const days = parseInt(searchParams.get('days') || '7');

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }

    // Get available slots for next N days
    const now = new Date();
    const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    // Generate available time slots
    const availableSlots = [];
    
    for (let d = 0; d < days; d++) {
      const date = new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
      
      // Skip Sundays
      if (date.getDay() === 0) continue;

      // Generate hourly slots from 12:00 to 19:00 (last slot starts at 19:00)
      for (let hour = 12; hour < 20; hour++) {
        const slotStart = new Date(date);
        slotStart.setHours(hour, 0, 0, 0);
        
        const slotEnd = new Date(slotStart);
        slotEnd.setHours(hour + 1, 0, 0, 0);

        // Check if slot is not in the past
        if (slotStart <= now) continue;

        // Check if slot exists and is available
        const existingSlot = await prisma.scheduleSlot.findFirst({
          where: {
            date: date,
            startTime: slotStart
          }
        });

        const isAvailable = !existingSlot || (existingSlot.isAvailable && !existingSlot.isBlocked);

        // Check same-day eligibility
        const isToday = d === 0;
        const isSameDayEligible = isToday && now.getHours() <= 15;

        availableSlots.push({
          date: date.toISOString().split('T')[0], // YYYY-MM-DD format
          startTime: `${hour.toString().padStart(2, '0')}:00`,
          endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
          isAvailable,
          isSameDay: isToday && isSameDayEligible,
          dateTime: slotStart.toISOString()
        });
      }
    }

    return NextResponse.json({
      availableSlots: availableSlots.filter(slot => slot.isAvailable)
    });

  } catch (error) {
    console.error('Get available slots error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}