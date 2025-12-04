import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';
    
    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (range) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '7d':
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get conversion metrics from analytics events
    const [
      totalVisits,
      totalQuotes,
      totalLeads,
      totalVerified,
      totalScheduled,
      totalCompleted
    ] = await Promise.all([
      // Page visits (site_visit events or estimated from quotes * average traffic ratio)
      prisma.analyticsEvent.count({
        where: {
          event: 'site_visit',
          timestamp: { gte: startDate }
        }
      }).then(count => count || 0).catch(() => {
        // Fallback: estimate visits based on quotes (assume 10x traffic)
        return prisma.analyticsEvent.count({
          where: {
            event: 'quote_completed',
            timestamp: { gte: startDate }
          }
        }).then(quotes => Math.max(quotes * 10, 100));
      }),

      // Quotes completed
      prisma.analyticsEvent.count({
        where: {
          event: 'quote_completed',
          timestamp: { gte: startDate }
        }
      }),

      // Leads created
      prisma.analyticsEvent.count({
        where: {
          event: 'lead_created',
          timestamp: { gte: startDate }
        }
      }),

      // Email verifications completed
      prisma.analyticsEvent.count({
        where: {
          event: 'verification_completed',
          timestamp: { gte: startDate }
        }
      }),

      // Appointments scheduled
      prisma.analyticsEvent.count({
        where: {
          event: 'appointment_scheduled',
          timestamp: { gte: startDate }
        }
      }),

      // Transactions completed (appointments marked as completed)
      prisma.analyticsEvent.count({
        where: {
          event: 'appointment_completed',
          timestamp: { gte: startDate }
        }
      })
    ]);

    // Calculate conversion rates
    const rates = {
      visitToQuote: totalVisits > 0 ? (totalQuotes / totalVisits) * 100 : 0,
      quoteToLead: totalQuotes > 0 ? (totalLeads / totalQuotes) * 100 : 0,
      leadToVerified: totalLeads > 0 ? (totalVerified / totalLeads) * 100 : 0,
      verifiedToScheduled: totalVerified > 0 ? (totalScheduled / totalVerified) * 100 : 0,
      scheduledToCompleted: totalScheduled > 0 ? (totalCompleted / totalScheduled) * 100 : 0,
      overallConversion: totalVisits > 0 ? (totalCompleted / totalVisits) * 100 : 0
    };

    const metrics = {
      totalVisits,
      totalQuotes,
      totalLeads,
      totalVerified,
      totalScheduled,
      totalCompleted,
      rates
    };

    // Convert BigInt values to numbers for JSON serialization
    const serializedMetrics = JSON.parse(JSON.stringify(metrics, (key, value) =>
      typeof value === 'bigint' ? Number(value) : value
    ));

    return NextResponse.json(serializedMetrics);
  } catch (error) {
    console.error('Conversion analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversion metrics' },
      { status: 500 }
    );
  }
}