// Database optimization utilities and query performance monitoring
import { prisma } from '@/lib/prisma';

interface QueryPerformanceMetric {
  operation: string;
  table: string;
  duration: number;
  recordCount: number;
  timestamp: Date;
}

class DatabaseOptimizer {
  private static instance: DatabaseOptimizer;
  private performanceMetrics: QueryPerformanceMetric[] = [];
  private readonly MAX_METRICS = 1000;

  private constructor() {}

  static getInstance(): DatabaseOptimizer {
    if (!DatabaseOptimizer.instance) {
      DatabaseOptimizer.instance = new DatabaseOptimizer();
    }
    return DatabaseOptimizer.instance;
  }

  // Monitor query performance
  async measureQuery<T>(
    operation: string,
    table: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      
      let recordCount = 0;
      if (Array.isArray(result)) {
        recordCount = result.length;
      } else if (typeof result === 'number') {
        recordCount = result;
      } else if (result && typeof result === 'object') {
        recordCount = 1;
      }

      this.recordMetric({
        operation,
        table,
        duration,
        recordCount,
        timestamp: new Date()
      });

      // Log slow queries (>500ms)
      if (duration > 500) {
        console.warn(`🐌 Slow query detected: ${operation} on ${table} took ${duration}ms`);
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Query failed: ${operation} on ${table} after ${duration}ms`, error);
      throw error;
    }
  }

  private recordMetric(metric: QueryPerformanceMetric) {
    this.performanceMetrics.push(metric);
    
    // Keep only the last MAX_METRICS entries
    if (this.performanceMetrics.length > this.MAX_METRICS) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.MAX_METRICS);
    }
  }

  // Get performance statistics
  getPerformanceStats() {
    if (this.performanceMetrics.length === 0) {
      return {
        totalQueries: 0,
        averageDuration: 0,
        slowQueries: 0,
        fastQueries: 0,
        byTable: {},
        byOperation: {}
      };
    }

    const totalQueries = this.performanceMetrics.length;
    const averageDuration = this.performanceMetrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries;
    const slowQueries = this.performanceMetrics.filter(m => m.duration > 500).length;
    const fastQueries = this.performanceMetrics.filter(m => m.duration < 100).length;

    // Group by table
    const byTable: Record<string, { count: number; avgDuration: number; slowCount: number }> = {};
    this.performanceMetrics.forEach(metric => {
      if (!byTable[metric.table]) {
        byTable[metric.table] = { count: 0, avgDuration: 0, slowCount: 0 };
      }
      byTable[metric.table].count++;
      byTable[metric.table].avgDuration += metric.duration;
      if (metric.duration > 500) byTable[metric.table].slowCount++;
    });

    Object.keys(byTable).forEach(table => {
      byTable[table].avgDuration = byTable[table].avgDuration / byTable[table].count;
    });

    // Group by operation
    const byOperation: Record<string, { count: number; avgDuration: number }> = {};
    this.performanceMetrics.forEach(metric => {
      if (!byOperation[metric.operation]) {
        byOperation[metric.operation] = { count: 0, avgDuration: 0 };
      }
      byOperation[metric.operation].count++;
      byOperation[metric.operation].avgDuration += metric.duration;
    });

    Object.keys(byOperation).forEach(operation => {
      byOperation[operation].avgDuration = byOperation[operation].avgDuration / byOperation[operation].count;
    });

    return {
      totalQueries,
      averageDuration: Math.round(averageDuration * 100) / 100,
      slowQueries,
      fastQueries,
      byTable,
      byOperation,
      recentMetrics: this.performanceMetrics.slice(-20)
    };
  }

  // Database health check with detailed diagnostics
  async performHealthCheck() {
    const checks = {
      connectivity: false,
      indexHealth: {} as Record<string, any>,
      tableSizes: {} as Record<string, number>,
      slowQueries: [] as string[],
      recommendations: [] as string[]
    };

    try {
      // Test basic connectivity
      await prisma.$queryRaw`SELECT 1`;
      checks.connectivity = true;

      // Get table row counts
      const tables = ['lead', 'quote', 'appointment', 'verification', 'analyticsEvent', 'device'];
      for (const table of tables) {
        try {
          const count = await (prisma as any)[table].count();
          checks.tableSizes[table] = count;
        } catch (error) {
          console.warn(`Could not get count for table ${table}:`, error);
        }
      }

      // Analyze performance metrics
      const stats = this.getPerformanceStats();
      
      // Generate recommendations based on performance
      if (stats.slowQueries > 0) {
        checks.recommendations.push(`${stats.slowQueries} slow queries detected. Consider adding database indexes.`);
      }

      if (checks.tableSizes.analyticsEvent && checks.tableSizes.analyticsEvent > 10000) {
        checks.recommendations.push('AnalyticsEvent table is large. Consider archiving old events.');
      }

      // Skip table-specific performance checks in health check to avoid complex type issues
      // This analysis is better done in the detailed performance report

      // Check for missing indexes (simulation - in real DB you'd query INFORMATION_SCHEMA)
      const expectedIndexes = [
        'lead.email',
        'lead.createdAt', 
        'lead.isVerified',
        'quote.leadId',
        'quote.expiresAt',
        'quote.isExpired',
        'appointment.status',
        'appointment.createdAt',
        'verification.token',
        'verification.expiresAt',
        'analyticsEvent.createdAt',
        'analyticsEvent.event'
      ];

      checks.indexHealth = {
        expected: expectedIndexes,
        status: 'Cannot check indexes in SQLite runtime, but schema should have these indexed'
      };

    } catch (error) {
      console.error('Database health check failed:', error);
      checks.recommendations.push('Database connectivity issues detected.');
    }

    return checks;
  }

  // Suggest optimizations based on usage patterns
  generateOptimizationReport() {
    const stats = this.getPerformanceStats();
    const report = {
      summary: {
        totalQueries: stats.totalQueries,
        averageResponseTime: stats.averageDuration,
        performanceScore: this.calculatePerformanceScore(stats)
      },
      recommendations: [] as string[],
      criticalIssues: [] as string[],
      optimizations: [] as string[]
    };

    // Critical issues
    if (stats.slowQueries / stats.totalQueries > 0.1) {
      report.criticalIssues.push('More than 10% of queries are slow (>500ms)');
    }

    if (stats.averageDuration > 300) {
      report.criticalIssues.push('Average query time is too high (>300ms)');
    }

    // Specific table recommendations
    Object.entries(stats.byTable).forEach(([table, tableStats]) => {
      if (tableStats.avgDuration > 200) {
        report.recommendations.push(`Optimize ${table} table queries (avg: ${Math.round(tableStats.avgDuration)}ms)`);
      }
      
      if (tableStats.slowCount > 0) {
        report.optimizations.push(`Add indexes to ${table} table for better performance`);
      }
    });

    // General optimizations
    const byOp = stats.byOperation as Record<string, { count: number; avgDuration: number }>;
    if (byOp.findMany?.count > byOp.count?.count) {
      report.optimizations.push('Consider using count() instead of findMany().length where appropriate');
    }

    if (stats.totalQueries > 100) {
      report.optimizations.push('Implement query result caching for frequently accessed data');
      report.optimizations.push('Consider using database connection pooling');
    }

    return report;
  }

  private calculatePerformanceScore(stats: any): number {
    if (stats.totalQueries === 0) return 100;
    
    let score = 100;
    
    // Deduct points for slow queries
    const slowRatio = stats.slowQueries / stats.totalQueries;
    score -= slowRatio * 40;
    
    // Deduct points for high average duration
    if (stats.averageDuration > 100) {
      score -= Math.min((stats.averageDuration - 100) / 10, 30);
    }
    
    // Bonus for fast queries
    const fastRatio = stats.fastQueries / stats.totalQueries;
    score += fastRatio * 10;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // Clear metrics (useful for testing)
  clearMetrics() {
    this.performanceMetrics = [];
  }
}

export const dbOptimizer = DatabaseOptimizer.getInstance();

// HOF to wrap database queries with performance monitoring
export function withPerformanceMonitoring(table: string) {
  return function <T extends (...args: any[]) => Promise<any>>(
    operation: string,
    queryFn: T
  ): T {
    return (async (...args: any[]) => {
      return dbOptimizer.measureQuery(operation, table, () => queryFn(...args));
    }) as T;
  };
}