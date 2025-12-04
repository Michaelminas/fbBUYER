import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth, AuthenticatedRequest } from '@/middleware/auth';
import { withCache, withCompression, cache } from '@/lib/cache';

async function getLeads(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (status && status !== 'all') {
      if (status === 'new') {
        where.isVerified = false;
        where.appointment = null;
      } else if (status === 'verified') {
        where.isVerified = true;
        where.appointment = null;
      } else {
        where.appointment = {
          status: status
        };
      }
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get leads with relations
    const [leads, totalCount] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          quote: {
            include: {
              device: true
            }
          },
          appointment: {
            include: {
              slot: true,
              address: true
            }
          },
          verification: true
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.lead.count({ where })
    ]);

    // Transform data for frontend
    const transformedLeads = leads.map(lead => ({
      id: lead.id,
      email: lead.email,
      firstName: lead.firstName,
      lastName: lead.lastName,
      phoneNumber: lead.phoneNumber,
      address: lead.address,
      sellMethod: lead.sellMethod,
      distance: lead.distance,
      pickupFee: lead.pickupFee,
      isVerified: lead.isVerified,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
      
      quote: lead.quote ? {
        id: lead.quote.id,
        device: {
          model: lead.quote.device.model,
          storage: lead.quote.device.storage
        },
        damages: JSON.parse(lead.quote.damages),
        hasBox: lead.quote.hasBox,
        hasCharger: lead.quote.hasCharger,
        isActivationLocked: lead.quote.isActivationLocked,
        basePrice: lead.quote.basePrice,
        finalQuote: lead.quote.finalQuote,
        pickupFee: lead.quote.pickupFee,
        expiresAt: lead.quote.expiresAt.toISOString(),
        isExpired: lead.quote.expiresAt < new Date()
      } : null,
      
      appointment: lead.appointment ? {
        id: lead.appointment.id,
        status: lead.appointment.status,
        isSameDay: lead.appointment.isSameDay,
        notes: lead.appointment.notes,
        createdAt: lead.appointment.createdAt.toISOString(),
        slot: lead.appointment.slot ? {
          date: lead.appointment.slot.date.toISOString(),
          startTime: lead.appointment.slot.startTime.toISOString(),
          endTime: lead.appointment.slot.endTime.toISOString()
        } : null,
        address: lead.appointment.address ? {
          formattedAddress: lead.appointment.address.formattedAddress,
          suburb: lead.appointment.address.suburb,
          postcode: lead.appointment.address.postcode
        } : null
      } : null,

      verification: lead.verification ? {
        isUsed: lead.verification.isUsed,
        expiresAt: lead.verification.expiresAt.toISOString(),
        createdAt: lead.verification.createdAt.toISOString()
      } : null,

      // Computed status
      status: lead.appointment?.status || (lead.isVerified ? 'verified' : 'new')
    }));

    return NextResponse.json({
      leads: transformedLeads,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Admin leads error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function updateLead(request: AuthenticatedRequest) {
  try {
    const { leadId, updates } = await request.json();

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }

    // Find the lead
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { appointment: true }
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Update lead basic info
    const leadUpdates: any = {};
    if (updates.firstName !== undefined) leadUpdates.firstName = updates.firstName;
    if (updates.lastName !== undefined) leadUpdates.lastName = updates.lastName;
    if (updates.phoneNumber !== undefined) leadUpdates.phoneNumber = updates.phoneNumber;
    if (updates.address !== undefined) leadUpdates.address = updates.address;

    if (Object.keys(leadUpdates).length > 0) {
      await prisma.lead.update({
        where: { id: leadId },
        data: leadUpdates
      });
    }

    // Handle appointment status updates
    if (updates.appointmentStatus && lead.appointment) {
      await prisma.appointment.update({
        where: { id: lead.appointment.id },
        data: { status: updates.appointmentStatus }
      });

      // Log state change
      await prisma.stateLog.create({
        data: {
          appointmentId: lead.appointment.id,
          fromState: lead.appointment.status,
          toState: updates.appointmentStatus,
          reason: updates.reason || 'Admin update'
        }
      });

      // Log analytics
      await prisma.analyticsEvent.create({
        data: {
          event: 'appointment_status_updated',
          userId: leadId,
          properties: JSON.stringify({
            appointmentId: lead.appointment.id,
            fromStatus: lead.appointment.status,
            toStatus: updates.appointmentStatus,
            reason: updates.reason || 'Admin update'
          })
        }
      });
    }

    // Invalidate related cache entries when leads are updated
    cache.invalidate('admin:leads');
    cache.invalidate('admin:stats');

    return NextResponse.json({ message: 'Lead updated successfully' });

  } catch (error) {
    console.error('Admin lead update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Export protected handlers with caching and compression
export const GET = requireAdminAuth(
  withCompression(
    withCache({
      ttl: 60, // 1 minute cache for leads (updated frequently)
      vary: ['page', 'limit', 'status', 'search'], // Vary cache by query parameters
      tags: ['admin', 'leads']
    })(getLeads)
  )
);

export const PUT = requireAdminAuth(updateLead);