import { NextRequest, NextResponse } from 'next/server';
import { analytics } from '@/lib/analytics';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const metrics = await request.json();
    
    // Validate metrics data
    if (!metrics || !Array.isArray(metrics)) {
      return NextResponse.json({ error: 'Invalid metrics data' }, { status: 400 });
    }

    // Store metrics in analytics
    for (const metric of metrics) {
      if (metric.name && typeof metric.value === 'number') {
        await analytics.track({
          event: 'performance_metric',
          category: 'performance',
          action: metric.name,
          value: metric.value,
          properties: {
            metricName: metric.name,
            metricValue: metric.value,
            context: metric.context,
            timestamp: metric.timestamp || new Date().toISOString()
          }
        });
      }
    }

    return NextResponse.json({ success: true, processed: metrics.length });
  } catch (error) {
    console.error('Performance monitoring error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '24h';
    
    let startDate: Date;
    switch (timeframe) {
      case '1h':
        startDate = new Date(Date.now() - 60 * 60 * 1000);
        break;
      case '6h':
        startDate = new Date(Date.now() - 6 * 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    }

    // Get performance metrics from the last timeframe
    const performanceData = await prisma.analyticsEvent.findMany({
      where: {
        category: 'performance',
        timestamp: {
          gte: startDate
        }
      },
      select: {
        action: true,
        value: true,
        properties: true,
        timestamp: true
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 1000
    });

    // Aggregate metrics
    const aggregatedMetrics = performanceData.reduce((acc: any, event) => {
      const metricName = event.action;
      if (!acc[metricName!]) {
        acc[metricName!] = {
          count: 0,
          sum: 0,
          min: Infinity,
          max: -Infinity,
          values: []
        };
      }
      
      const value = event.value || 0;
      acc[metricName!].count++;
      acc[metricName!].sum += value;
      acc[metricName!].min = Math.min(acc[metricName!].min, value);
      acc[metricName!].max = Math.max(acc[metricName!].max, value);
      acc[metricName!].values.push({ value, timestamp: event.timestamp });
      
      return acc;
    }, {});

    // Calculate averages and percentiles
    const processedMetrics = Object.entries(aggregatedMetrics).map(([name, data]: [string, any]) => {
      const sortedValues = data.values.map((v: any) => v.value).sort((a: number, b: number) => a - b);
      const p50 = sortedValues[Math.floor(sortedValues.length * 0.5)] || 0;
      const p75 = sortedValues[Math.floor(sortedValues.length * 0.75)] || 0;
      const p95 = sortedValues[Math.floor(sortedValues.length * 0.95)] || 0;
      
      return {
        name,
        count: data.count,
        average: data.sum / data.count,
        min: data.min === Infinity ? 0 : data.min,
        max: data.max === -Infinity ? 0 : data.max,
        p50,
        p75,
        p95,
        trend: data.values.slice(-10) // Last 10 values for trending
      };
    });

    return NextResponse.json({
      timeframe,
      metrics: processedMetrics,
      totalEvents: performanceData.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to get performance metrics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}