import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface NotificationRequest {
  type: 'lead_created' | 'verification_completed' | 'appointment_scheduled' | 'appointment_completed' | 'quote_expired';
  entityId: string;
  message?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  targetUsers?: string[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'admin';
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // For this MVP, we'll simulate notifications based on recent activity
    const notifications = await generateNotificationsFromActivity(userId, limit, unreadOnly);

    return NextResponse.json({ notifications });

  } catch (error) {
    console.error('Notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const notificationData: NotificationRequest = await request.json();
    
    const notification = await createNotification(notificationData);
    
    return NextResponse.json({ 
      message: 'Notification created successfully',
      notification 
    });

  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { notificationIds, action } = await request.json();
    
    if (action === 'mark_read') {
      // In a real implementation, we'd have a notifications table
      // For now, we'll just return success
      return NextResponse.json({ 
        message: `${notificationIds.length} notifications marked as read` 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Update notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function generateNotificationsFromActivity(userId: string, limit: number, unreadOnly: boolean) {
  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const notifications: any[] = [];

  // Get recent leads
  const recentLeads = await prisma.lead.findMany({
    where: { createdAt: { gte: last24Hours } },
    include: { quote: { include: { device: true } } },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  recentLeads.forEach(lead => {
    notifications.push({
      id: `lead_${lead.id}`,
      type: 'lead_created',
      title: 'New Lead Created',
      message: `${lead.firstName} ${lead.lastName} submitted a quote for ${lead.quote?.device?.model}`,
      entityId: lead.id,
      priority: 'medium',
      timestamp: lead.createdAt,
      isRead: Math.random() > 0.7, // Simulate some read status
      data: {
        leadId: lead.id,
        deviceModel: lead.quote?.device?.model,
        quoteValue: lead.quote?.finalQuote
      }
    });
  });

  // Get recent verifications
  const recentVerifications = await prisma.verification.findMany({
    where: { 
      createdAt: { gte: last24Hours },
      isUsed: true
    },
    include: { 
      lead: { 
        include: { quote: { include: { device: true } } } 
      } 
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  recentVerifications.forEach(verification => {
    notifications.push({
      id: `verification_${verification.id}`,
      type: 'verification_completed',
      title: 'Email Verified',
      message: `${verification.lead.firstName} ${verification.lead.lastName} verified their email`,
      entityId: verification.leadId,
      priority: 'low',
      timestamp: verification.createdAt,
      isRead: Math.random() > 0.5,
      data: {
        leadId: verification.leadId,
        email: verification.lead.email
      }
    });
  });

  // Get recent appointments
  const recentAppointments = await prisma.appointment.findMany({
    where: { createdAt: { gte: last24Hours } },
    include: { 
      lead: { 
        include: { quote: { include: { device: true } } } 
      },
      slot: true
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  recentAppointments.forEach(appointment => {
    notifications.push({
      id: `appointment_${appointment.id}`,
      type: 'appointment_scheduled',
      title: 'Appointment Scheduled',
      message: `${appointment.lead.firstName} ${appointment.lead.lastName} scheduled pickup for ${appointment.slot.date.toLocaleDateString()}`,
      entityId: appointment.id,
      priority: 'high',
      timestamp: appointment.createdAt,
      isRead: Math.random() > 0.3,
      data: {
        appointmentId: appointment.id,
        leadId: appointment.leadId,
        scheduledDate: appointment.slot.date,
        deviceModel: appointment.lead.quote?.device?.model
      }
    });
  });

  // Check for expired quotes
  const expiredQuotes = await prisma.quote.findMany({
    where: {
      expiresAt: { lt: now },
      isExpired: false
    },
    include: {
      lead: true,
      device: true
    },
    take: 3
  });

  expiredQuotes.forEach(quote => {
    notifications.push({
      id: `expired_quote_${quote.id}`,
      type: 'quote_expired',
      title: 'Quote Expired',
      message: `Quote for ${quote.lead.firstName} ${quote.lead.lastName} (${quote.device.model}) has expired`,
      entityId: quote.id,
      priority: 'medium',
      timestamp: quote.expiresAt,
      isRead: false,
      data: {
        quoteId: quote.id,
        leadId: quote.leadId,
        deviceModel: quote.device.model,
        quoteValue: quote.finalQuote
      }
    });
  });

  // Sort by timestamp (newest first)
  notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Filter unread if requested
  const filtered = unreadOnly ? notifications.filter(n => !n.isRead) : notifications;

  return filtered.slice(0, limit);
}

async function createNotification(data: NotificationRequest) {
  // In a real implementation, this would create a record in a notifications table
  // For this MVP, we'll just log it as an analytics event
  
  await prisma.analyticsEvent.create({
    data: {
      event: 'notification_created',
      properties: JSON.stringify({
        type: data.type,
        entityId: data.entityId,
        message: data.message,
        priority: data.priority
      }),
      userId: data.targetUsers?.[0] || 'system'
    }
  });

  return {
    id: `notification_${Date.now()}`,
    type: data.type,
    message: data.message || `${data.type} notification`,
    priority: data.priority || 'medium',
    timestamp: new Date(),
    isRead: false
  };
}

// Utility function to trigger notifications for common events
async function triggerNotification(type: NotificationRequest['type'], entityId: string, additionalData?: any) {
  try {
    let message = '';
    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';

    switch (type) {
      case 'lead_created':
        message = `New lead created: ${additionalData?.name || 'Customer'}`;
        priority = 'medium';
        break;
      case 'verification_completed':
        message = `Customer verified email: ${additionalData?.email || 'Customer'}`;
        priority = 'low';
        break;
      case 'appointment_scheduled':
        message = `New appointment scheduled for ${additionalData?.date || 'upcoming date'}`;
        priority = 'high';
        break;
      case 'appointment_completed':
        message = `Appointment completed successfully`;
        priority = 'medium';
        break;
      case 'quote_expired':
        message = `Quote expired for ${additionalData?.customer || 'customer'}`;
        priority = 'medium';
        break;
    }

    await createNotification({
      type,
      entityId,
      message,
      priority,
      targetUsers: ['admin']
    });

  } catch (error) {
    console.error('Failed to trigger notification:', error);
  }
}