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

    // Get drop-off events
    const dropOffEvents = await prisma.analyticsEvent.findMany({
      where: {
        event: 'progress_drop_off',
        timestamp: { gte: startDate }
      },
      select: {
        properties: true,
        timestamp: true
      }
    });

    // Get step completion events for comparison
    const stepEvents = await prisma.analyticsEvent.findMany({
      where: {
        event: { in: ['progress_step_viewed', 'progress_step_completed'] },
        timestamp: { gte: startDate }
      },
      select: {
        event: true,
        properties: true,
        timestamp: true
      }
    });

    // Analyze drop-offs by step
    const stepAnalysis: { [key: string]: any } = {};

    // Count step entries and completions
    stepEvents.forEach(event => {
      try {
        const properties = typeof event.properties === 'string' 
          ? JSON.parse(event.properties) 
          : event.properties || {};
        
        const step = properties.step || properties.completedStep;
        if (!step) return;

        if (!stepAnalysis[step]) {
          stepAnalysis[step] = {
            step,
            totalEntered: 0,
            totalCompleted: 0,
            dropOffCount: 0,
            dropOffReasons: {}
          };
        }

        if (event.event === 'progress_step_viewed') {
          stepAnalysis[step].totalEntered++;
        } else if (event.event === 'progress_step_completed') {
          stepAnalysis[step].totalCompleted++;
        }
      } catch (e) {
        console.warn('Failed to parse event properties:', e);
      }
    });

    // Count drop-offs and reasons
    dropOffEvents.forEach(event => {
      try {
        const properties = typeof event.properties === 'string' 
          ? JSON.parse(event.properties) 
          : event.properties || {};
        
        const step = properties.dropOffStep;
        const reason = properties.reason || 'unknown';
        
        if (!step) return;

        if (!stepAnalysis[step]) {
          stepAnalysis[step] = {
            step,
            totalEntered: 0,
            totalCompleted: 0,
            dropOffCount: 0,
            dropOffReasons: {}
          };
        }

        stepAnalysis[step].dropOffCount++;
        
        if (!stepAnalysis[step].dropOffReasons[reason]) {
          stepAnalysis[step].dropOffReasons[reason] = 0;
        }
        stepAnalysis[step].dropOffReasons[reason]++;
      } catch (e) {
        console.warn('Failed to parse drop-off properties:', e);
      }
    });

    // Format analysis results
    const analysis = Object.values(stepAnalysis).map((step: any) => {
      const dropOffRate = step.totalEntered > 0 
        ? (step.dropOffCount / step.totalEntered) * 100 
        : 0;

      const commonReasons = Object.entries(step.dropOffReasons)
        .map(([reason, count]: [string, any]) => ({
          reason,
          count,
          percentage: step.dropOffCount > 0 ? (count / step.dropOffCount) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5 reasons

      return {
        step: step.step,
        totalEntered: step.totalEntered,
        totalCompleted: step.totalCompleted,
        dropOffCount: step.dropOffCount,
        dropOffRate,
        commonReasons
      };
    }).sort((a, b) => b.dropOffRate - a.dropOffRate); // Sort by highest drop-off rate first

    // Calculate overall statistics
    const totalDropOffs = dropOffEvents.length;
    const totalStepViews = stepEvents.filter(e => e.event === 'progress_step_viewed').length;
    const overallDropOffRate = totalStepViews > 0 ? (totalDropOffs / totalStepViews) * 100 : 0;

    const result = {
      analysis,
      summary: {
        totalDropOffs,
        totalStepViews,
        overallDropOffRate,
        dateRange: range,
        startDate: startDate.toISOString(),
        endDate: now.toISOString()
      }
    };

    // Convert BigInt values to numbers for JSON serialization
    const serializedResult = JSON.parse(JSON.stringify(result, (key, value) =>
      typeof value === 'bigint' ? Number(value) : value
    ));

    return NextResponse.json(serializedResult);
  } catch (error) {
    console.error('Drop-off analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drop-off analysis' },
      { status: 500 }
    );
  }
}