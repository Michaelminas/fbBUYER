import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, AuthUser } from '@/lib/auth';

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthUser;
}

export async function verifyAdminToken(request: NextRequest): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth-token')?.value;

    if (!token) {
      return { success: false, error: 'No authentication token provided' };
    }

    const user = verifyToken(token);
    
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Invalid or expired token' };
    }

    return { success: true, user };
  } catch (error) {
    console.error('Token verification error:', error);
    return { success: false, error: 'Invalid token' };
  }
}

export function requireAdminAuth(handler: (request: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const auth = await verifyAdminToken(request);
    
    if (!auth.success) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Add user to request object
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = auth.user;

    return handler(authenticatedRequest);
  };
}