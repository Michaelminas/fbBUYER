import { NextRequest, NextResponse } from 'next/server';

export interface ValidationRules {
  email?: boolean;
  phoneNumber?: boolean;
  required?: string[];
  maxLength?: { [field: string]: number };
  allowedValues?: { [field: string]: any[] };
  noSqlInjection?: boolean;
  noXss?: boolean;
}

export function validateInput(rules: ValidationRules) {
  return (handler: (request: NextRequest) => Promise<NextResponse>) => {
    return async (request: NextRequest) => {
      try {
        const body = await request.json();
        const errors: string[] = [];

        // Check required fields
        if (rules.required) {
          for (const field of rules.required) {
            if (!body[field] || (typeof body[field] === 'string' && body[field].trim() === '')) {
              errors.push(`${field} is required`);
            }
          }
        }

        // Validate email format (more strict)
        if (rules.email && body.email) {
          const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
          if (!emailRegex.test(body.email)) {
            errors.push('Invalid email format');
          }
          if (body.email.length > 254) {
            errors.push('Email address too long');
          }
          // Additional email validation checks
          if (body.email.includes('..') || body.email.startsWith('.') || body.email.endsWith('.')) {
            errors.push('Invalid email format');
          }
        }

        // Validate phone number format (Australian)
        if (rules.phoneNumber && body.phoneNumber) {
          const phoneRegex = /^(\+61|0)[2-9]\d{8}$/;
          if (!phoneRegex.test(body.phoneNumber.replace(/\s/g, ''))) {
            errors.push('Invalid Australian phone number format');
          }
        }

        // Check field length limits
        if (rules.maxLength) {
          for (const [field, maxLen] of Object.entries(rules.maxLength)) {
            if (body[field] && typeof body[field] === 'string' && body[field].length > maxLen) {
              errors.push(`${field} must be less than ${maxLen} characters`);
            }
          }
        }

        // Check allowed values
        if (rules.allowedValues) {
          for (const [field, allowedVals] of Object.entries(rules.allowedValues)) {
            if (body[field] && !allowedVals.includes(body[field])) {
              errors.push(`Invalid value for ${field}`);
            }
          }
        }

        // Enhanced security validation and sanitization
        for (const [key, value] of Object.entries(body)) {
          if (typeof value === 'string') {
            // Check for directory traversal attempts
            if (value.includes('../') || value.includes('..\\') || 
                value.includes('%2e%2e%2f') || value.includes('%2e%2e%5c') ||
                value.includes('....//') || value.includes('....\\\\')) {
              errors.push(`Invalid path characters detected in ${key}`);
              continue;
            }
            
            // Check for absolute path attempts
            if (value.match(/^([a-zA-Z]:|\\\\|\/)/)) {
              errors.push(`Absolute paths not allowed in ${key}`);
              continue;
            }
            
            // Enhanced XSS and injection prevention
            const dangerousPatterns = [
              /<script[^>]*>.*?<\/script>/gi,
              /javascript:/gi,
              /on\w+\s*=/gi,
              /\$\{.*\}/g, // Template injection
              /#\{.*\}/g, // Expression language injection
              /\{\{.*\}\}/g, // Template injection
              /'\s*(OR|AND|UNION|SELECT|DROP|INSERT|UPDATE|DELETE)\s+/gi, // SQL injection
              /\$where\s*:/gi, // NoSQL injection
              /\$ne\s*:/gi, // NoSQL injection
              /\\x00/g, // Null byte injection
              /\\0/g, // Null byte injection
              /[\x00]/g // Null bytes
            ];
            
            let hasDangerousContent = false;
            for (const pattern of dangerousPatterns) {
              if (pattern.test(value)) {
                errors.push(`Potentially malicious content detected in ${key}`);
                hasDangerousContent = true;
                break;
              }
            }
            
            if (hasDangerousContent) {
              continue;
            }
            
            // Remove potential script tags and suspicious content
            body[key] = value
              .replace(/<script[^>]*>.*?<\/script>/gi, '')
              .replace(/javascript:/gi, '')
              .replace(/on\w+\s*=/gi, '')
              .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // Remove control characters
              .replace(/\\x00/g, '') // Remove escaped null bytes
              .replace(/\\0/g, '') // Remove escaped null bytes
              .trim();
              
            // Additional Unicode validation for names and addresses
            if ((key === 'firstName' || key === 'lastName' || key === 'address') && body[key]) {
              try {
                // More permissive Unicode validation that handles international names
                // Allow letters, marks, numbers, spaces, and common punctuation
                const unicodePattern = /^[\p{L}\p{M}\p{N}\p{Zs}\-'.,\s]+$/u;
                
                // Check for dangerous Unicode sequences
                const dangerousPatterns = [
                  /[\p{Cc}\p{Cf}]/u, // Control characters
                  /[\u200B-\u200F\u202A-\u202E\u2060-\u2064]/u, // Zero-width and directional characters
                  /[\uFEFF\uFFF9-\uFFFB]/u, // Byte order marks and annotation characters
                  /^\uFEFF/, // Byte order mark at start
                  /\uFEFF$/, // Byte order mark at end
                ];
                
                let hasDangerousChar = false;
                for (const pattern of dangerousPatterns) {
                  if (pattern.test(body[key])) {
                    hasDangerousChar = true;
                    break;
                  }
                }
                
                if (hasDangerousChar) {
                  errors.push(`${key} contains invalid control characters`);
                } else if (!unicodePattern.test(body[key])) {
                  errors.push(`${key} contains invalid characters`);
                }
                
                // Additional check for excessive length after Unicode normalization
                const normalizedValue = body[key].normalize('NFC');
                if (normalizedValue.length > (rules.maxLength?.[key] || 500)) {
                  errors.push(`${key} is too long after normalization`);
                }
                
                // Store normalized value
                body[key] = normalizedValue;
                
              } catch (unicodeError) {
                // If Unicode processing fails, reject the input
                errors.push(`${key} contains invalid Unicode sequences`);
              }
            }
          }
        }

        if (errors.length > 0) {
          return NextResponse.json(
            { error: 'Validation failed', details: errors },
            { status: 400 }
          );
        }

        // Create new request with sanitized body
        const sanitizedRequest = new Request(request.url, {
          method: request.method,
          headers: request.headers,
          body: JSON.stringify(body)
        }) as NextRequest;

        return handler(sanitizedRequest);

      } catch (error) {
        console.error('Validation error:', error);
        return NextResponse.json(
          { error: 'Invalid request format' },
          { status: 400 }
        );
      }
    };
  };
}

export function validateCSRF() {
  return (handler: (request: NextRequest) => Promise<NextResponse>) => {
    return async (request: NextRequest) => {
      const origin = request.headers.get('origin');
      const referer = request.headers.get('referer');
      const host = request.headers.get('host');
      const userAgent = request.headers.get('user-agent');

      // Enhanced origin validation
      if (origin && host) {
        try {
          const originUrl = new URL(origin);
          if (originUrl.host !== host && !['localhost', '127.0.0.1'].includes(originUrl.hostname)) {
            return NextResponse.json(
              { error: 'Cross-origin request blocked' },
              { status: 403 }
            );
          }
        } catch (error) {
          return NextResponse.json(
            { error: 'Invalid origin header' },
            { status: 400 }
          );
        }
      }

      // Enhanced referer validation
      if (referer && host) {
        try {
          const refererUrl = new URL(referer);
          if (refererUrl.host !== host && !['localhost', '127.0.0.1'].includes(refererUrl.hostname)) {
            return NextResponse.json(
              { error: 'Invalid referer' },
              { status: 403 }
            );
          }
        } catch (error) {
          // Invalid referer URL format
          return NextResponse.json(
            { error: 'Invalid referer header' },
            { status: 400 }
          );
        }
      }
      
      // Block requests without user agent (potential bot)
      if (!userAgent) {
        return NextResponse.json(
          { error: 'User agent required' },
          { status: 403 }
        );
      }

      return handler(request);
    };
  };
}