import { NextRequest, NextResponse } from 'next/server';
import { QuoteService } from '@/services/quoteService';
import { analytics } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret-change-in-production';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🕒 Running quote expiration cron job...');

    // Handle quote expirations
    const result = await QuoteService.handleQuoteExpirations();

    // Log the results
    console.log(`✅ Quote expiration cron completed:`, {
      expired: result.expired,
      nearExpiry: result.nearExpiry,
      total: result.total,
      timestamp: new Date().toISOString()
    });

    // Track cron job execution
    await analytics.track({
      event: 'cron_job_executed',
      category: 'system',
      action: 'quote_expiration',
      properties: {
        quotesExpired: result.expired,
        quotesNearExpiry: result.nearExpiry,
        totalActiveQuotes: result.total,
        executionTime: new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
      message: `Processed ${result.expired} expired quotes, ${result.nearExpiry} quotes expiring soon`
    });
  } catch (error) {
    console.error('❌ Quote expiration cron job failed:', error);
    
    // Track cron job failure
    await analytics.track({
      event: 'cron_job_failed',
      category: 'system',
      action: 'quote_expiration_error',
      properties: {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: false,
      error: 'Cron job failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Health check for cron endpoint
    return NextResponse.json({
      status: 'healthy',
      endpoint: 'quote-expiration-cron',
      timestamp: new Date().toISOString(),
      description: 'Handles automatic quote expiration and notifications'
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}