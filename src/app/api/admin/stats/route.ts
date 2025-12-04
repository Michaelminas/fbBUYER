import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth, AuthenticatedRequest } from '@/middleware/auth';
import { withCache, withCompression } from '@/lib/cache';

async function getStats(request: AuthenticatedRequest) {
  try {
    // Get date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);
    
    const monthStart = new Date(today);
    monthStart.setDate(monthStart.getDate() - 30);

    // Get current stats
    const [
      totalLeads,
      totalVerified,
      totalScheduled,
      totalCompleted,
      todayLeads,
      todayScheduled,
      weekLeads,
      monthLeads,
      avgQuoteValue,
      totalRevenue
    ] = await Promise.all([
      // Total counts
      prisma.lead.count(),
      prisma.lead.count({ where: { isVerified: true } }),
      prisma.appointment.count({ where: { status: 'scheduled' } }),
      prisma.appointment.count({ where: { status: 'completed' } }),
      
      // Today's counts
      prisma.lead.count({ where: { createdAt: { gte: today } } }),
      prisma.appointment.count({ 
        where: { 
          status: 'scheduled',
          createdAt: { gte: today }
        }
      }),
      
      // Weekly and monthly
      prisma.lead.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.lead.count({ where: { createdAt: { gte: monthStart } } }),
      
      // Quote analytics
      prisma.quote.aggregate({
        _avg: { finalQuote: true }
      }),
      
      // Revenue (completed appointments)
      prisma.quote.aggregate({
        where: {
          lead: {
            appointment: {
              status: 'completed'
            }
          }
        },
        _sum: { finalQuote: true }
      })
    ]);

    // Calculate conversion rates
    const verificationRate = totalLeads > 0 ? (totalVerified / totalLeads) * 100 : 0;
    const schedulingRate = totalVerified > 0 ? (totalScheduled / totalVerified) * 100 : 0;
    const completionRate = totalScheduled > 0 ? (totalCompleted / totalScheduled) * 100 : 0;

    // Get top device models
    const topDevices = await prisma.device.findMany({
      select: {
        model: true,
        _count: {
          select: {
            quotes: true
          }
        }
      },
      orderBy: {
        quotes: {
          _count: 'desc'
        }
      },
      take: 5
    });

    // Get recent activity
    const recentLeads = await prisma.lead.findMany({
      include: {
        quote: {
          include: {
            device: true
          }
        },
        appointment: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return NextResponse.json({
      overview: {
        totalLeads,
        totalVerified,
        totalScheduled,
        totalCompleted,
        verificationRate: Math.round(verificationRate * 10) / 10,
        schedulingRate: Math.round(schedulingRate * 10) / 10,
        completionRate: Math.round(completionRate * 10) / 10
      },
      today: {
        leads: todayLeads,
        scheduled: todayScheduled
      },
      trends: {
        weekLeads,
        monthLeads,
        avgQuoteValue: Math.round((avgQuoteValue._avg.finalQuote || 0) * 100) / 100,
        totalRevenue: totalRevenue._sum.finalQuote || 0
      },
      topDevices: topDevices.map(device => ({
        model: device.model,
        count: device._count.quotes
      })),
      recentActivity: recentLeads.map(lead => ({
        id: lead.id,
        email: lead.email,
        firstName: lead.firstName,
        lastName: lead.lastName,
        device: lead.quote?.device.model || 'Unknown',
        quote: lead.quote?.finalQuote || 0,
        status: lead.appointment?.status || (lead.isVerified ? 'verified' : 'new'),
        createdAt: lead.createdAt.toISOString(),
        sellMethod: lead.sellMethod
      }))
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Export protected handler with caching and compression
export const GET = requireAdminAuth(
  withCompression(
    withCache({
      ttl: 120, // 2 minutes cache
      key: 'admin:stats',
      tags: ['admin', 'stats', 'leads']
    })(getStats)
  )
);