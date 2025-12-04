import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  try {
    // Test database connectivity
    const dbStartTime = Date.now();
    let dbStatus = { status: 'healthy', responseTime: 0, error: undefined as string | undefined };
    
    try {
      await prisma.$queryRaw`SELECT 1 as test`;
      const dbResponseTime = Date.now() - dbStartTime;
      dbStatus = {
        status: dbResponseTime < 1000 ? 'healthy' : 'degraded',
        responseTime: dbResponseTime,
        error: undefined
      };
      
      if (dbResponseTime >= 1000) {
        overallStatus = 'degraded';
      }
    } catch (dbError: any) {
      dbStatus = {
        status: 'unhealthy',
        responseTime: Date.now() - dbStartTime,
        error: dbError.message
      };
      overallStatus = 'unhealthy';
    }
    
    // Get comprehensive system info
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const environment = process.env.NODE_ENV || 'unknown';
    
    // Memory health assessment
    const memoryHealthy = memoryUsage.heapUsed / memoryUsage.heapTotal < 0.9;
    if (!memoryHealthy && overallStatus === 'healthy') {
      overallStatus = 'degraded';
    }

    // Get recent application metrics
    let appMetrics = {
      totalRequests24h: 0,
      errorRate24h: 0,
      avgResponseTime: 0,
      activeLeads: 0,
      quotesGenerated: 0
    };

    try {
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Get analytics data
      const [analyticsData, leadCount, quoteCount] = await Promise.all([
        prisma.analyticsEvent.findMany({
          where: {
            timestamp: { gte: last24Hours },
            category: { in: ['api', 'error', 'performance'] }
          },
          select: { category: true, action: true, value: true }
        }),
        prisma.lead.count({
          where: { createdAt: { gte: last24Hours } }
        }),
        prisma.quote.count({
          where: { createdAt: { gte: last24Hours } }
        })
      ]);

      const totalRequests = analyticsData.filter(e => e.category === 'api').length;
      const errors = analyticsData.filter(e => e.category === 'error').length;
      const performanceEvents = analyticsData.filter(e => 
        e.category === 'performance' && e.action === 'api_response_time'
      );

      appMetrics = {
        totalRequests24h: totalRequests,
        errorRate24h: totalRequests > 0 ? (errors / totalRequests) * 100 : 0,
        avgResponseTime: performanceEvents.length > 0 
          ? performanceEvents.reduce((sum, e) => sum + (e.value || 0), 0) / performanceEvents.length
          : 0,
        activeLeads: leadCount,
        quotesGenerated: quoteCount
      };

      // Adjust status based on error rate
      if (appMetrics.errorRate24h > 10) {
        overallStatus = 'unhealthy';
      } else if (appMetrics.errorRate24h > 5 && overallStatus === 'healthy') {
        overallStatus = 'degraded';
      }
    } catch (metricsError) {
      console.warn('Failed to get app metrics:', metricsError);
    }
    
    const healthData = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      environment,
      uptime: Math.floor(uptime),
      responseTime: Date.now() - startTime,
      checks: {
        database: dbStatus,
        memory: {
          status: memoryHealthy ? 'healthy' : 'degraded',
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024),
          percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
        }
      },
      metrics: appMetrics,
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        pid: process.pid
      }
    };

    const statusCode = overallStatus === 'unhealthy' ? 503 : 200;
    return NextResponse.json(healthData, { status: statusCode });

  } catch (error: any) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      responseTime: Date.now() - startTime,
      environment: process.env.NODE_ENV || 'unknown'
    }, { status: 503 });
  }
}