import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'health':
        return getSystemHealth();
      
      case 'cleanup':
        return cleanupExpiredData();
      
      case 'backup-info':
        return getBackupInfo();
      
      default:
        return getSystemOverview();
    }

  } catch (error) {
    console.error('System management error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, params } = await request.json();

    switch (action) {
      case 'cleanup-expired':
        return await cleanupExpiredData();
      
      case 'update-appointment-status':
        return await updateAppointmentStatus(params.appointmentId, params.status);
      
      case 'bulk-update-quotes':
        return await bulkUpdateExpiredQuotes();
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('System management error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getSystemHealth() {
  const now = new Date();
  
  // Check database connectivity
  const dbCheck = await prisma.lead.count().catch(() => -1);
  
  // Check for expired quotes
  const expiredQuotes = await prisma.quote.count({
    where: {
      expiresAt: { lt: now },
      isExpired: false
    }
  });

  // Check for stale verifications
  const expiredVerifications = await prisma.verification.count({
    where: {
      expiresAt: { lt: now },
      isUsed: false
    }
  });

  // Check for old analytics events (older than 30 days)
  const oldEvents = await prisma.analyticsEvent.count({
    where: {
      timestamp: { lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
    }
  });

  // Check for overdue appointments
  const overdueAppointments = await prisma.appointment.count({
    where: {
      slot: {
        startTime: { lt: now }
      },
      status: { in: ['scheduled', 'confirmed'] }
    }
  });

  const health = {
    database: dbCheck >= 0 ? 'healthy' : 'error',
    timestamp: now.toISOString(),
    issues: {
      expiredQuotes,
      expiredVerifications,
      oldEvents,
      overdueAppointments
    },
    recommendations: [] as string[]
  };

  // Add recommendations based on issues
  if (expiredQuotes > 0) {
    health.recommendations.push(`${expiredQuotes} quotes need to be marked as expired`);
  }
  if (expiredVerifications > 10) {
    health.recommendations.push(`${expiredVerifications} expired verification tokens can be cleaned up`);
  }
  if (oldEvents > 1000) {
    health.recommendations.push(`${oldEvents} old analytics events can be archived`);
  }
  if (overdueAppointments > 0) {
    health.recommendations.push(`${overdueAppointments} appointments are overdue and need status updates`);
  }

  return NextResponse.json({ health });
}

async function cleanupExpiredData() {
  const now = new Date();
  const results = {
    quotesUpdated: 0,
    verificationsRemoved: 0,
    oldEventsArchived: 0
  };

  // Mark expired quotes
  const expiredQuotesUpdate = await prisma.quote.updateMany({
    where: {
      expiresAt: { lt: now },
      isExpired: false
    },
    data: { isExpired: true }
  });
  results.quotesUpdated = expiredQuotesUpdate.count;

  // Remove very old verification tokens (older than 7 days)
  const oldVerifications = await prisma.verification.deleteMany({
    where: {
      expiresAt: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      isUsed: false
    }
  });
  results.verificationsRemoved = oldVerifications.count;

  // Archive old analytics events (could be moved to a separate archive table in production)
  const archiveDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const oldEvents = await prisma.analyticsEvent.deleteMany({
    where: {
      timestamp: { lt: archiveDate }
    }
  });
  results.oldEventsArchived = oldEvents.count;

  return NextResponse.json({
    message: 'Cleanup completed successfully',
    results
  });
}

async function updateAppointmentStatus(appointmentId: string, status: string) {
  const validStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'];
  
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const appointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { 
      status,
      updatedAt: new Date()
    },
    include: {
      lead: true
    }
  });

  // Log the status change
  await prisma.stateLog.create({
    data: {
      appointmentId: appointmentId,
      fromState: 'unknown', // Would need to track this better in production
      toState: status,
      reason: 'Admin update',
      adminUserId: null // Would be actual admin user ID
    }
  });

  // Lead status is derived from appointment status, no need to update separately

  return NextResponse.json({
    message: 'Appointment status updated successfully',
    appointment
  });
}

async function bulkUpdateExpiredQuotes() {
  const now = new Date();
  
  const expiredQuotes = await prisma.quote.updateMany({
    where: {
      expiresAt: { lt: now },
      isExpired: false
    },
    data: { isExpired: true }
  });

  return NextResponse.json({
    message: `${expiredQuotes.count} quotes marked as expired`,
    count: expiredQuotes.count
  });
}

async function getSystemOverview() {
  const stats = await Promise.all([
    prisma.lead.count(),
    prisma.quote.count(),
    prisma.appointment.count(),
    prisma.verification.count(),
    prisma.analyticsEvent.count(),
    prisma.device.count(),
    prisma.adminUser.count()
  ]);

  return NextResponse.json({
    overview: {
      leads: stats[0],
      quotes: stats[1], 
      appointments: stats[2],
      verifications: stats[3],
      analyticsEvents: stats[4],
      devices: stats[5],
      adminUsers: stats[6]
    }
  });
}

async function getBackupInfo() {
  // In production, this would interface with backup systems
  const tableStats = await Promise.all([
    prisma.lead.count(),
    prisma.quote.count(),
    prisma.appointment.count(),
    prisma.scheduleSlot.count(),
    prisma.verification.count(),
    prisma.device.count(),
    prisma.address.count(),
    prisma.stateLog.count(),
    prisma.media.count(),
    prisma.adminUser.count(),
    prisma.blacklist.count(),
    prisma.analyticsEvent.count()
  ]);

  const tables = [
    'leads', 'quotes', 'appointments', 'scheduleSlots', 'verifications',
    'devices', 'addresses', 'stateLogs', 'media', 'adminUsers', 'blacklist', 'analyticsEvents'
  ];

  const backupInfo = {
    lastBackup: 'Not configured', // Would be actual backup timestamp
    totalRecords: tableStats.reduce((sum, count) => sum + count, 0),
    tableBreakdown: tables.reduce((acc, table, index) => {
      acc[table] = tableStats[index];
      return acc;
    }, {} as Record<string, number>),
    estimatedSize: '< 1MB', // Would be actual database size
    recommendations: [
      'Configure automated daily backups',
      'Set up database replication for production',
      'Implement point-in-time recovery'
    ]
  };

  return NextResponse.json({ backup: backupInfo });
}