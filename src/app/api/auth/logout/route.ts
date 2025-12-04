import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, logLoginActivity, getClientIP } from '@/lib/auth';
import { analytics } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (token) {
      const user = verifyToken(token);
      const ipAddress = getClientIP(request);
      const userAgent = request.headers.get('user-agent') || 'unknown';
      const clientInfo = { ipAddress, userAgent };

      if (user) {
        // Log logout activity
        await logLoginActivity(user.id, ipAddress, userAgent, 'logout');
        
        // Track logout
        await analytics.track({
          event: 'admin_logout',
          category: 'authentication',
          action: 'logout',
          userId: user.id
        }, clientInfo);
      }
    }

    const response = NextResponse.json({ success: true });
    
    // Clear the auth cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0
    });

    return response;
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}