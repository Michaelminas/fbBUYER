import { NextRequest, NextResponse } from 'next/server';
import { QuoteService } from '@/services/quoteService';
import { verifyAdminAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const isAuth = await verifyAdminAuth(request);
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'expiration-stats': {
        const days = parseInt(searchParams.get('days') || '30');
        const stats = await QuoteService.getExpirationStats(days);
        return NextResponse.json(stats);
      }

      case 'prioritized-leads': {
        const limit = parseInt(searchParams.get('limit') || '50');
        const leads = await QuoteService.getPrioritizedLeads(limit);
        return NextResponse.json(leads);
      }

      case 'lead-score': {
        const leadId = searchParams.get('leadId');
        if (!leadId) {
          return NextResponse.json({ error: 'Lead ID required' }, { status: 400 });
        }
        const score = await QuoteService.calculateLeadScore(leadId);
        return NextResponse.json(score);
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Quote management error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAuth = await verifyAdminAuth(request);
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'handle-expirations': {
        const result = await QuoteService.handleQuoteExpirations();
        return NextResponse.json(result);
      }

      case 'renew-quote': {
        const { quoteId } = data;
        if (!quoteId) {
          return NextResponse.json({ error: 'Quote ID required' }, { status: 400 });
        }
        const result = await QuoteService.renewQuote(quoteId);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Quote management error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}