import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analytics, Analytics } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      event, 
      category, 
      action, 
      label, 
      value, 
      properties, 
      userId, 
      sessionId, 
      leadId, 
      pageUrl, 
      referrer, 
      clientInfo 
    } = body;

    if (!event) {
      return NextResponse.json(
        { error: 'Event name is required' },
        { status: 400 }
      );
    }

    // OPTIMIZED: Fire and forget analytics for better performance
    analytics.track({
      event,
      category,
      action,
      label,
      value,
      properties,
      userId,
      sessionId,
      leadId,
      pageUrl,
      referrer
    }, Analytics.extractClientInfo(request)).catch((error) => {
      console.error('Analytics track error (background):', error);
    });

    // Return immediately without waiting for database write
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics track API error:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const type = searchParams.get('type') || 'overview';

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    switch (type) {
      case 'conversion-funnel':
        return getConversionFunnel(startDate);
      
      case 'revenue-projections':
        return getRevenueProjections(startDate);
      
      case 'device-analytics':
        return getDeviceAnalytics(startDate);
      
      case 'geographic-data':
        return getGeographicData(startDate);
      
      default:
        return getOverviewAnalytics(startDate);
    }

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getConversionFunnel(startDate: Date) {
  const totalLeads = await prisma.lead.count({
    where: { createdAt: { gte: startDate } }
  });

  const verifiedLeads = await prisma.lead.count({
    where: { 
      createdAt: { gte: startDate },
      isVerified: true 
    }
  });

  const scheduledLeads = await prisma.appointment.count({
    where: { 
      createdAt: { gte: startDate },
      status: { in: ['scheduled', 'confirmed'] }
    }
  });

  const completedLeads = await prisma.appointment.count({
    where: { 
      createdAt: { gte: startDate },
      status: 'completed'
    }
  });

  const funnel = {
    leads: totalLeads,
    verified: verifiedLeads,
    scheduled: scheduledLeads,
    completed: completedLeads,
    conversionRates: {
      verificationRate: totalLeads > 0 ? (verifiedLeads / totalLeads * 100) : 0,
      schedulingRate: verifiedLeads > 0 ? (scheduledLeads / verifiedLeads * 100) : 0,
      completionRate: scheduledLeads > 0 ? (completedLeads / scheduledLeads * 100) : 0,
      overallConversion: totalLeads > 0 ? (completedLeads / totalLeads * 100) : 0
    }
  };

  return NextResponse.json({ funnel });
}

async function getRevenueProjections(startDate: Date) {
  const quotes = await prisma.quote.findMany({
    where: { createdAt: { gte: startDate } },
    include: {
      lead: {
        include: {
          appointment: true
        }
      }
    }
  });

  const totalQuoteValue = quotes.reduce((sum, quote) => sum + quote.finalQuote, 0);
  const scheduledValue = quotes
    .filter(quote => quote.lead.appointment?.status === 'scheduled' || quote.lead.appointment?.status === 'confirmed')
    .reduce((sum, quote) => sum + quote.finalQuote, 0);
  
  const completedValue = quotes
    .filter(quote => quote.lead.appointment?.status === 'completed')
    .reduce((sum, quote) => sum + quote.finalQuote, 0);

  // Project potential revenue based on current conversion rates
  const conversionRate = quotes.length > 0 ? 
    quotes.filter(q => q.lead.appointment?.status === 'completed').length / quotes.length : 0.25;
  
  const projectedRevenue = totalQuoteValue * conversionRate;

  return NextResponse.json({
    revenue: {
      totalQuoted: totalQuoteValue,
      scheduledPipeline: scheduledValue,
      completed: completedValue,
      projected: projectedRevenue,
      conversionRate: conversionRate * 100
    }
  });
}

async function getDeviceAnalytics(startDate: Date) {
  const quotes = await prisma.quote.findMany({
    where: { createdAt: { gte: startDate } },
    include: {
      device: true,
      lead: {
        include: {
          appointment: true
        }
      }
    }
  });

  // Group by device family and calculate metrics
  const deviceStats: Record<string, any> = {};
  
  quotes.forEach(quote => {
    const family = quote.device.family;
    if (!deviceStats[family]) {
      deviceStats[family] = {
        family,
        count: 0,
        totalValue: 0,
        avgValue: 0,
        conversionRate: 0,
        conversions: 0,
        popularStorage: {},
        damageFrequency: {}
      };
    }

    deviceStats[family].count++;
    deviceStats[family].totalValue += quote.finalQuote;
    
    // Track conversions
    if (quote.lead.appointment?.status === 'completed') {
      deviceStats[family].conversions++;
    }

    // Track popular storage sizes
    const storage = quote.device.storage;
    deviceStats[family].popularStorage[storage] = 
      (deviceStats[family].popularStorage[storage] || 0) + 1;

    // Track damage frequency
    const damages = JSON.parse(quote.damages);
    damages.forEach((damage: string) => {
      deviceStats[family].damageFrequency[damage] = 
        (deviceStats[family].damageFrequency[damage] || 0) + 1;
    });
  });

  // Calculate averages and rates
  Object.values(deviceStats).forEach((stats: any) => {
    stats.avgValue = stats.totalValue / stats.count;
    stats.conversionRate = (stats.conversions / stats.count) * 100;
  });

  return NextResponse.json({
    deviceAnalytics: Object.values(deviceStats)
  });
}

async function getGeographicData(startDate: Date) {
  const leads = await prisma.lead.findMany({
    where: { 
      createdAt: { gte: startDate },
      address: { not: null }
    },
    include: {
      quote: true,
      appointment: true
    }
  });

  // Simple geographic analysis based on address patterns
  const geographic = leads.reduce((acc: any, lead) => {
    const address = lead.address || '';
    let region = 'Other';
    
    if (address.toLowerCase().includes('sydney') || address.toLowerCase().includes('cbd')) {
      region = 'Sydney CBD';
    } else if (address.toLowerCase().includes('penrith') || address.toLowerCase().includes('claremont')) {
      region = 'Western Sydney';
    } else if (address.toLowerCase().includes('parramatta') || address.toLowerCase().includes('blacktown')) {
      region = 'Greater Western Sydney';
    } else if (address.toLowerCase().includes('north')) {
      region = 'Northern Sydney';
    }

    if (!acc[region]) {
      acc[region] = {
        region,
        leads: 0,
        avgDistance: 0,
        totalDistance: 0,
        avgQuote: 0,
        totalQuote: 0,
        conversions: 0
      };
    }

    acc[region].leads++;
    if (lead.distance) {
      acc[region].totalDistance += lead.distance;
    }
    if (lead.quote) {
      acc[region].totalQuote += lead.quote.finalQuote;
    }
    if (lead.appointment?.status === 'completed') {
      acc[region].conversions++;
    }

    return acc;
  }, {});

  // Calculate averages
  Object.values(geographic).forEach((region: any) => {
    region.avgDistance = region.totalDistance / region.leads;
    region.avgQuote = region.totalQuote / region.leads;
    region.conversionRate = (region.conversions / region.leads) * 100;
  });

  return NextResponse.json({
    geographic: Object.values(geographic)
  });
}

async function getOverviewAnalytics(startDate: Date) {
  const totalEvents = await prisma.analyticsEvent.count({
    where: { timestamp: { gte: startDate } }
  });

  const eventTypes = await prisma.analyticsEvent.groupBy({
    by: ['event'],
    where: { timestamp: { gte: startDate } },
    _count: { event: true }
  });

  return NextResponse.json({
    overview: {
      totalEvents,
      eventBreakdown: eventTypes.map(e => ({
        event: e.event,
        count: e._count.event
      }))
    }
  });
}