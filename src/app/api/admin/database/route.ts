import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, AuthenticatedRequest } from '@/middleware/auth';
import { dbOptimizer } from '@/lib/database-optimizer';

async function getDatabaseHealth(request: AuthenticatedRequest) {
  try {
    const healthCheck = await dbOptimizer.performHealthCheck();
    const performanceStats = dbOptimizer.getPerformanceStats();
    const optimizationReport = dbOptimizer.generateOptimizationReport();

    return NextResponse.json({
      success: true,
      health: healthCheck,
      performance: performanceStats,
      optimization: optimizationReport,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database health check error:', error);
    return NextResponse.json({ 
      error: 'Failed to check database health',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function manageDatabaseOperations(request: AuthenticatedRequest) {
  try {
    const { action } = await request.json();
    
    switch (action) {
      case 'clear-metrics':
        dbOptimizer.clearMetrics();
        return NextResponse.json({ 
          success: true, 
          message: 'Performance metrics cleared' 
        });

      case 'analyze-performance':
        const report = dbOptimizer.generateOptimizationReport();
        return NextResponse.json({ 
          success: true, 
          report 
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Database management error:', error);
    return NextResponse.json({ error: 'Failed to manage database' }, { status: 500 });
  }
}

// Export protected handlers
export const GET = requireAdminAuth(getDatabaseHealth);
export const POST = requireAdminAuth(manageDatabaseOperations);