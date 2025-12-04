// Security hardening utilities and monitoring
import { NextRequest, NextResponse } from 'next/server';
import { analytics } from './analytics';

export interface SecurityEvent {
  type: 'rate_limit' | 'suspicious_request' | 'injection_attempt' | 'xss_attempt' | 'auth_failure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string;
  userAgent: string;
  endpoint: string;
  details: Record<string, any>;
  timestamp: Date;
}

class SecurityMonitor {
  private static instance: SecurityMonitor;
  private securityEvents: SecurityEvent[] = [];
  private blockedIPs = new Set<string>();
  private rateLimitMap = new Map<string, { count: number; lastReset: number }>();
  
  private readonly MAX_EVENTS = 10000;
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  private readonly RATE_LIMIT_MAX = 100; // 100 requests per minute
  private readonly IP_BLOCK_DURATION = 3600000; // 1 hour

  private constructor() {}

  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  // Log security events
  logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>) {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date()
    };

    this.securityEvents.push(securityEvent);
    
    // Keep only recent events
    if (this.securityEvents.length > this.MAX_EVENTS) {
      this.securityEvents = this.securityEvents.slice(-this.MAX_EVENTS);
    }

    // Auto-block IPs for critical events
    if (event.severity === 'critical') {
      this.blockIP(event.ip, 'Automatic block for critical security event');
    }

    // Track in analytics
    analytics.track({
      event: 'security_event',
      category: 'security',
      action: event.type,
      label: event.severity,
      properties: {
        ip: event.ip,
        endpoint: event.endpoint,
        details: event.details
      }
    });

    console.warn(`🚨 Security Event [${event.severity.toUpperCase()}]: ${event.type} from ${event.ip}`);
  }

  // Check rate limiting
  checkRateLimit(ip: string, endpoint: string): boolean {
    const key = `${ip}:${endpoint}`;
    const now = Date.now();
    const limit = this.rateLimitMap.get(key);

    if (!limit || now - limit.lastReset > this.RATE_LIMIT_WINDOW) {
      this.rateLimitMap.set(key, { count: 1, lastReset: now });
      return true;
    }

    limit.count++;
    
    if (limit.count > this.RATE_LIMIT_MAX) {
      this.logSecurityEvent({
        type: 'rate_limit',
        severity: 'medium',
        ip,
        userAgent: 'unknown',
        endpoint,
        details: { requestCount: limit.count, timeWindow: this.RATE_LIMIT_WINDOW }
      });
      return false;
    }

    return true;
  }

  // Block IP address
  blockIP(ip: string, reason: string) {
    this.blockedIPs.add(ip);
    
    // Auto-unblock after duration
    setTimeout(() => {
      this.blockedIPs.delete(ip);
      console.log(`🔓 IP ${ip} automatically unblocked`);
    }, this.IP_BLOCK_DURATION);

    console.log(`🚫 IP ${ip} blocked: ${reason}`);
  }

  // Check if IP is blocked
  isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  // Validate and sanitize input
  sanitizeInput(input: any, type: 'string' | 'email' | 'phone' | 'number' = 'string'): any {
    if (typeof input !== 'string') {
      return input;
    }

    let sanitized = input.trim();

    // Remove potentially dangerous characters
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');

    switch (type) {
      case 'email':
        // Basic email validation and sanitization
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(sanitized)) {
          throw new Error('Invalid email format');
        }
        break;
        
      case 'phone':
        // Remove non-numeric characters except +
        sanitized = sanitized.replace(/[^\d+\s()-]/g, '');
        break;
        
      case 'number':
        if (isNaN(Number(sanitized))) {
          throw new Error('Invalid number format');
        }
        break;
    }

    return sanitized;
  }

  // Detect SQL injection attempts
  detectSQLInjection(input: string, ip: string, endpoint: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /(\'|\")(\s*)(OR|AND)(\s*)(\d+)(\s*)(=)(\s*)(\d+)/i,
      /(\-\-|\#|\/\*|\*\/)/,
      /(\bxp_|\bsp_)/i
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        this.logSecurityEvent({
          type: 'injection_attempt',
          severity: 'high',
          ip,
          userAgent: 'unknown',
          endpoint,
          details: { input: input.substring(0, 100), pattern: pattern.source }
        });
        return true;
      }
    }

    return false;
  }

  // Detect XSS attempts
  detectXSS(input: string, ip: string, endpoint: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(input)) {
        this.logSecurityEvent({
          type: 'xss_attempt',
          severity: 'high',
          ip,
          userAgent: 'unknown',
          endpoint,
          details: { input: input.substring(0, 100), pattern: pattern.source }
        });
        return true;
      }
    }

    return false;
  }

  // Analyze request for suspicious patterns
  analyzeRequest(request: NextRequest): boolean {
    const ip = this.getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    const url = request.url;
    const endpoint = new URL(url).pathname;

    // Check if IP is blocked
    if (this.isIPBlocked(ip)) {
      return false;
    }

    // Check rate limiting
    if (!this.checkRateLimit(ip, endpoint)) {
      return false;
    }

    // Analyze User-Agent for suspicious patterns
    const suspiciousUAPatterns = [
      /sqlmap/i,
      /nikto/i,
      /burp/i,
      /nmap/i,
      /masscan/i,
      /zap/i,
      /w3af/i
    ];

    for (const pattern of suspiciousUAPatterns) {
      if (pattern.test(userAgent)) {
        this.logSecurityEvent({
          type: 'suspicious_request',
          severity: 'medium',
          ip,
          userAgent,
          endpoint,
          details: { reason: 'Suspicious User-Agent', pattern: pattern.source }
        });
        break;
      }
    }

    // Check for suspicious headers
    const referer = request.headers.get('referer');
    if (referer && !referer.includes(new URL(url).hostname)) {
      const suspiciousRefererPatterns = [
        /\.(ru|cn|tk|ml|ga)$/i,
        /porn|adult|casino|gambling/i
      ];

      for (const pattern of suspiciousRefererPatterns) {
        if (pattern.test(referer)) {
          this.logSecurityEvent({
            type: 'suspicious_request',
            severity: 'low',
            ip,
            userAgent,
            endpoint,
            details: { reason: 'Suspicious Referer', referer }
          });
          break;
        }
      }
    }

    return true;
  }

  // Get client IP from request
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    
    if (cfConnectingIP) return cfConnectingIP;
    if (forwarded) return forwarded.split(',')[0].trim();
    if (realIP) return realIP;
    
    return 'unknown';
  }

  // Get security statistics
  getSecurityStats() {
    const now = Date.now();
    const last24h = now - (24 * 60 * 60 * 1000);
    const recentEvents = this.securityEvents.filter(e => e.timestamp.getTime() > last24h);

    const eventsByType = recentEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const eventsBySeverity = recentEvents.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topOffendingIPs = recentEvents.reduce((acc, event) => {
      acc[event.ip] = (acc[event.ip] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEvents: recentEvents.length,
      blockedIPs: Array.from(this.blockedIPs),
      eventsByType,
      eventsBySeverity,
      topOffendingIPs: Object.entries(topOffendingIPs)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([ip, count]) => ({ ip, count })),
      recentEvents: recentEvents.slice(-50)
    };
  }

  // Generate security report
  generateSecurityReport() {
    const stats = this.getSecurityStats();
    const recommendations = [];

    // Analyze patterns and generate recommendations
    if (stats.eventsByType.rate_limit > 10) {
      recommendations.push('High rate limiting events detected. Consider implementing CAPTCHA.');
    }

    if (stats.eventsByType.injection_attempt > 0) {
      recommendations.push('SQL injection attempts detected. Ensure all inputs are properly sanitized.');
    }

    if (stats.eventsByType.xss_attempt > 0) {
      recommendations.push('XSS attempts detected. Implement Content Security Policy (CSP).');
    }

    if (stats.blockedIPs.length > 5) {
      recommendations.push('Multiple IPs blocked. Consider implementing geographic restrictions.');
    }

    return {
      ...stats,
      recommendations,
      threatLevel: this.calculateThreatLevel(stats),
      reportGeneratedAt: new Date().toISOString()
    };
  }

  private calculateThreatLevel(stats: any): 'low' | 'medium' | 'high' | 'critical' {
    let score = 0;
    
    score += (stats.eventsBySeverity.critical || 0) * 10;
    score += (stats.eventsBySeverity.high || 0) * 5;
    score += (stats.eventsBySeverity.medium || 0) * 2;
    score += (stats.eventsBySeverity.low || 0) * 1;

    if (score > 50) return 'critical';
    if (score > 20) return 'high';
    if (score > 5) return 'medium';
    return 'low';
  }
}

export const securityMonitor = SecurityMonitor.getInstance();

// Middleware function for security checks
export function withSecurity(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    // Analyze request for security threats
    if (!securityMonitor.analyzeRequest(request)) {
      return NextResponse.json(
        { error: 'Request blocked for security reasons' },
        { status: 429 }
      );
    }

    // Parse and validate request body if present
    if (request.method !== 'GET' && request.headers.get('content-type')?.includes('application/json')) {
      try {
        const body = await request.clone().json();
        const ip = securityMonitor['getClientIP'](request);
        const endpoint = new URL(request.url).pathname;

        // Check all string values for security threats
        const checkValue = (value: any, key: string) => {
          if (typeof value === 'string') {
            if (securityMonitor.detectSQLInjection(value, ip, endpoint) ||
                securityMonitor.detectXSS(value, ip, endpoint)) {
              throw new Error(`Security threat detected in field: ${key}`);
            }
          }
        };

        // Recursively check all values
        const checkObject = (obj: any, path = '') => {
          for (const [key, value] of Object.entries(obj)) {
            const fullPath = path ? `${path}.${key}` : key;
            if (typeof value === 'object' && value !== null) {
              checkObject(value, fullPath);
            } else {
              checkValue(value, fullPath);
            }
          }
        };

        checkObject(body);
      } catch (error) {
        if (error instanceof Error && error.message.includes('Security threat')) {
          return NextResponse.json(
            { error: 'Request contains potentially malicious content' },
            { status: 400 }
          );
        }
      }
    }

    return handler(request, ...args);
  };
}

// CSP header generator
export function generateCSP(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://maps.googleapis.com https://www.google-analytics.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');
}