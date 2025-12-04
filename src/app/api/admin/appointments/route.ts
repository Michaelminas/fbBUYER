import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const status = searchParams.get('status');

    // Build where clause
    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }

    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      where.slot = {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      };
    } else {
      // Default to today's appointments
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      where.slot = {
        date: {
          gte: today,
          lt: tomorrow
        }
      };
    }

    // Get appointments
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        lead: {
          include: {
            quote: {
              include: {
                device: true
              }
            }
          }
        },
        slot: true,
        address: true
      },
      orderBy: {
        slot: {
          startTime: 'asc'
        }
      }
    });

    // Transform data
    const transformedAppointments = appointments.map(appointment => ({
      id: appointment.id,
      status: appointment.status,
      isSameDay: appointment.isSameDay,
      notes: appointment.notes,
      createdAt: appointment.createdAt.toISOString(),
      
      lead: {
        id: appointment.lead.id,
        firstName: appointment.lead.firstName,
        lastName: appointment.lead.lastName,
        email: appointment.lead.email,
        phoneNumber: appointment.lead.phoneNumber,
        sellMethod: appointment.lead.sellMethod,
        distance: appointment.lead.distance
      },
      
      quote: appointment.lead.quote ? {
        device: `${appointment.lead.quote.device.model} ${appointment.lead.quote.device.storage}GB`,
        finalQuote: appointment.lead.quote.finalQuote,
        damages: JSON.parse(appointment.lead.quote.damages),
        pickupFee: appointment.lead.quote.pickupFee
      } : null,
      
      slot: {
        date: appointment.slot.date.toISOString(),
        startTime: appointment.slot.startTime.toISOString(),
        endTime: appointment.slot.endTime.toISOString()
      },
      
      address: appointment.address ? {
        formattedAddress: appointment.address.formattedAddress,
        suburb: appointment.address.suburb,
        postcode: appointment.address.postcode
      } : null
    }));

    return NextResponse.json({ appointments: transformedAppointments });

  } catch (error) {
    console.error('Admin appointments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { appointmentId, status, notes, reason } = await request.json();

    if (!appointmentId) {
      return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Find the appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Update appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status,
        notes: notes || appointment.notes,
        updatedAt: new Date()
      }
    });

    // Log state change
    await prisma.stateLog.create({
      data: {
        appointmentId,
        fromState: appointment.status,
        toState: status,
        reason: reason || 'Admin update'
      }
    });

    // If appointment is completed, mark slot as available again for future bookings
    if (status === 'completed') {
      // Note: In production, you might want different logic here
      // For now, we'll leave the slot as unavailable to prevent double booking
    }

    // Log analytics
    await prisma.analyticsEvent.create({
      data: {
        event: 'appointment_status_updated',
        userId: appointment.leadId,
        properties: JSON.stringify({
          appointmentId,
          fromStatus: appointment.status,
          toStatus: status,
          reason: reason || 'Admin update'
        })
      }
    });

    return NextResponse.json({
      message: 'Appointment updated successfully',
      appointment: updatedAppointment
    });

  } catch (error) {
    console.error('Admin appointment update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}