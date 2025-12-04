import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: AuthUser): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch (error) {
    return null;
  }
}

export async function authenticateUser(
  email: string, 
  password: string, 
  ipAddress: string, 
  userAgent: string
): Promise<{ success: boolean; user?: AuthUser; token?: string; error?: string }> {
  try {
    const user = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      // Log failed attempt for non-existent user
      await logLoginActivity('unknown-user', ipAddress, userAgent, 'failed', 'User not found');
      return { success: false, error: 'Invalid email or password' };
    }

    if (!user.isActive) {
      await logLoginActivity(user.id, ipAddress, userAgent, 'failed', 'Account inactive');
      return { success: false, error: 'Account is inactive' };
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await logLoginActivity(user.id, ipAddress, userAgent, 'failed', 'Account locked');
      return { success: false, error: 'Account is temporarily locked. Please try again later.' };
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      // Increment failed attempts
      const failedAttempts = user.failedLoginAttempts + 1;
      const shouldLock = failedAttempts >= MAX_LOGIN_ATTEMPTS;

      await prisma.adminUser.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failedAttempts,
          lockedUntil: shouldLock ? new Date(Date.now() + LOCK_TIME) : null
        }
      });

      await logLoginActivity(user.id, ipAddress, userAgent, 'failed', 'Invalid password');
      return { 
        success: false, 
        error: shouldLock 
          ? 'Account locked due to multiple failed attempts. Please try again in 15 minutes.'
          : 'Invalid email or password' 
      };
    }

    // Successful login - reset failed attempts and update last login
    await prisma.adminUser.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date()
      }
    });

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };

    const token = generateToken(authUser);
    const sessionId = generateSessionId();

    await logLoginActivity(user.id, ipAddress, userAgent, 'success', null, sessionId);

    return { success: true, user: authUser, token };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

export async function logLoginActivity(
  adminUserId: string,
  ipAddress: string,
  userAgent: string,
  loginType: 'success' | 'failed' | 'logout' | 'password_reset',
  failureReason?: string | null,
  sessionId?: string | null
) {
  try {
    await prisma.loginActivity.create({
      data: {
        adminUserId,
        ipAddress,
        userAgent,
        loginType,
        failureReason,
        sessionId
      }
    });
  } catch (error) {
    console.error('Error logging login activity:', error);
  }
}

export function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

export async function verifyAdminAuth(request: Request): Promise<boolean> {
  try {
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');
    
    let token: string | null = null;
    
    // Try to get token from Authorization header
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // Try to get token from cookies if not in header
    if (!token && cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      token = cookies['admin_token'] || cookies['auth_token'];
    }
    
    if (!token) {
      return false;
    }
    
    const user = verifyToken(token);
    if (!user || user.role !== 'admin') {
      return false;
    }
    
    // Verify user still exists and is active
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: user.id }
    });
    
    return adminUser?.isActive === true;
  } catch (error) {
    console.error('Admin auth verification error:', error);
    return false;
  }
}

export async function createDefaultAdmin(email: string, password: string, firstName: string, lastName: string) {
  const hashedPassword = await hashPassword(password);
  
  return prisma.adminUser.create({
    data: {
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
      firstName,
      lastName,
      role: 'admin'
    }
  });
}