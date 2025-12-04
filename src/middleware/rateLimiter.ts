import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
}

// In-memory store for rate limiting (in production, use Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Allow higher limits for localhost testing
function isLocalhost(ip: string): boolean {
  return ip === 'unknown' || ip === '127.0.0.1' || ip === 'localhost' || ip === '::1';
}

export function rateLimit(config: RateLimitConfig) {
  return (handler: (request: NextRequest) => Promise<NextResponse>) => {
    return async (request: NextRequest) => {
      const ip = getClientIP(request);
      const key = `${ip}:${request.nextUrl.pathname}`;
      const now = Date.now();
      
      // Allow higher limits for localhost/testing
      const adjustedMaxRequests = isLocalhost(ip) ? config.maxRequests * 10 : config.maxRequests;
      
      // Clean up expired entries
      for (const [k, v] of requestCounts.entries()) {
        if (v.resetTime < now) {
          requestCounts.delete(k);
        }
      }
      
      const current = requestCounts.get(key);
      
      if (!current) {
        // First request from this IP for this endpoint
        requestCounts.set(key, {
          count: 1,
          resetTime: now + config.windowMs
        });
        return handler(request);
      }
      
      if (current.resetTime < now) {
        // Window has expired, reset
        requestCounts.set(key, {
          count: 1,
          resetTime: now + config.windowMs
        });
        return handler(request);
      }
      
      if (current.count >= adjustedMaxRequests) {
        // Rate limit exceeded
        return NextResponse.json(
          { 
            error: config.message || 'Too many requests. Please try again later.',
            retryAfter: Math.ceil((current.resetTime - now) / 1000)
          },
          { 
            status: 429,
            headers: {
              'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString(),
              'X-RateLimit-Limit': config.maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': Math.ceil(current.resetTime / 1000).toString()
            }
          }
        );
      }
      
      // Increment counter
      current.count++;
      requestCounts.set(key, current);
      
      const response = await handler(request);
      
      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', adjustedMaxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', (adjustedMaxRequests - current.count).toString());
      response.headers.set('X-RateLimit-Reset', Math.ceil(current.resetTime / 1000).toString());
      
      return response;
    };
  };
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('remote-addr');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (remoteAddr) {
    return remoteAddr;
  }
  
  return 'unknown';
}