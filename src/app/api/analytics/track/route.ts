import { NextRequest, NextResponse } from 'next/server';
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

    // Extract client information from request headers and body
    const analyticsClientInfo = {
      ...Analytics.extractClientInfo(request),
      ...clientInfo
    };

    await analytics.track({
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
    }, analyticsClientInfo);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}