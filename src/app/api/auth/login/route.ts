import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, getClientIP } from '@/lib/auth';
import { analytics } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const ipAddress = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const clientInfo = { ipAddress, userAgent };

    const result = await authenticateUser(email, password, ipAddress, userAgent);

    if (result.success && result.user && result.token) {
      // Track successful login
      await analytics.track({
        event: 'admin_login',
        category: 'authentication',
        action: 'success',
        userId: result.user.id,
        properties: {
          role: result.user.role,
          email: result.user.email
        }
      }, clientInfo);

      const response = NextResponse.json({
        success: true,
        user: result.user,
        token: result.token
      });

      // Set HTTP-only cookie
      response.cookies.set('auth-token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 // 24 hours
      });

      return response;
    } else {
      // Track failed login
      await analytics.track({
        event: 'admin_login',
        category: 'authentication',
        action: 'failed',
        properties: {
          email,
          error: result.error
        }
      }, clientInfo);

      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}