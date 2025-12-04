// API response caching and performance optimization utilities
import { NextRequest, NextResponse } from 'next/server';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  key?: string; // Custom cache key
  tags?: string[]; // Cache tags for invalidation
  vary?: string[]; // Headers to vary cache by
  skipCache?: boolean;
}

interface CachedResponse {
  data: any;
  headers: Record<string, string>;
  status: number;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  private static instance: CacheManager;
  private cache = new Map<string, CachedResponse>();
  private readonly DEFAULT_TTL = 300; // 5 minutes
  private readonly MAX_CACHE_SIZE = 1000;
  private cleanupInterval?: NodeJS.Timeout;

  private constructor() {
    this.startCleanupTimer();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  private startCleanupTimer() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + (entry.ttl * 1000)) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => {
      this.cache.delete(key);
    });

    console.log(`🧹 Cache cleanup: removed ${expiredKeys.length} expired entries`);
  }

  private generateKey(request: NextRequest, customKey?: string): string {
    if (customKey) return customKey;
    
    const url = new URL(request.url);
    const method = request.method;
    const searchParams = url.searchParams.toString();
    
    return `${method}:${url.pathname}${searchParams ? `?${searchParams}` : ''}`;
  }

  private shouldVaryBy(request: NextRequest, varyHeaders: string[] = []): string {
    const varyValues = varyHeaders
      .map(header => `${header}:${request.headers.get(header) || ''}`)
      .join('|');
    
    return varyValues ? `|vary:${varyValues}` : '';
  }

  get(request: NextRequest, options: CacheOptions = {}): CachedResponse | null {
    if (options.skipCache) return null;

    const baseKey = this.generateKey(request, options.key);
    const varyKey = this.shouldVaryBy(request, options.vary);
    const key = baseKey + varyKey;
    
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // Check if expired
    const now = Date.now();
    if (now > cached.timestamp + (cached.ttl * 1000)) {
      this.cache.delete(key);
      return null;
    }

    console.log(`💾 Cache hit: ${key}`);
    return cached;
  }

  set(
    request: NextRequest,
    response: NextResponse,
    data: any,
    options: CacheOptions = {}
  ): void {
    if (options.skipCache) return;

    // Don't cache error responses
    if (response.status >= 400) return;

    const baseKey = this.generateKey(request, options.key);
    const varyKey = this.shouldVaryBy(request, options.vary);
    const key = baseKey + varyKey;
    const ttl = options.ttl || this.DEFAULT_TTL;

    // Enforce max cache size
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      // Remove oldest entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const cached: CachedResponse = {
      data,
      headers,
      status: response.status,
      timestamp: Date.now(),
      ttl
    };

    this.cache.set(key, cached);
    console.log(`💾 Cache set: ${key} (TTL: ${ttl}s)`);
  }

  invalidate(pattern: string | RegExp): number {
    let invalidated = 0;
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (pattern instanceof RegExp) {
        if (pattern.test(key)) {
          keysToDelete.push(key);
        }
      } else if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      invalidated++;
    });

    if (invalidated > 0) {
      console.log(`🗑️ Cache invalidated: ${invalidated} entries matching "${pattern}"`);
    }

    return invalidated;
  }

  invalidateByTags(tags: string[]): number {
    // For simple implementation, we'll use pattern matching
    // In production, you'd want a more sophisticated tag system
    let invalidated = 0;
    
    tags.forEach(tag => {
      invalidated += this.invalidate(tag);
    });

    return invalidated;
  }

  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`🗑️ Cache cleared: ${size} entries removed`);
  }

  getStats(): {
    size: number;
    maxSize: number;
    defaultTTL: number;
    keys: string[];
  } {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      defaultTTL: this.DEFAULT_TTL,
      keys: Array.from(this.cache.keys())
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

export const cache = CacheManager.getInstance();

// HOF for caching API responses
export function withCache(options: CacheOptions = {}) {
  return function <T extends (...args: any[]) => Promise<NextResponse>>(
    handler: T
  ): T {
    return (async (...args: any[]) => {
      const request = args[0] as NextRequest;
      
      // Try to get cached response
      const cached = cache.get(request, options);
      if (cached) {
        const response = NextResponse.json(cached.data, { status: cached.status });
        
        // Restore cached headers
        Object.entries(cached.headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        
        // Add cache headers
        response.headers.set('X-Cache', 'HIT');
        response.headers.set('X-Cache-TTL', options.ttl?.toString() || cache['DEFAULT_TTL'].toString());
        
        return response;
      }

      // Execute original handler
      const response = await handler(...args);
      const data = await response.clone().json().catch(() => null);
      
      if (data) {
        // Cache the response
        cache.set(request, response, data, options);
        
        // Add cache headers
        response.headers.set('X-Cache', 'MISS');
        response.headers.set('X-Cache-TTL', options.ttl?.toString() || cache['DEFAULT_TTL'].toString());
      }

      return response;
    }) as T;
  };
}

// Response compression utility
export function compressResponse(data: any): {
  compressed: any;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
} {
  const originalJson = JSON.stringify(data);
  const originalSize = Buffer.byteLength(originalJson, 'utf8');
  
  // Simple compression - remove unnecessary whitespace and optimize arrays
  let compressed = data;
  
  if (Array.isArray(data)) {
    // For arrays, we can optimize by removing null/undefined values
    compressed = data.filter(item => item != null);
  } else if (typeof data === 'object' && data !== null) {
    // For objects, remove null/undefined properties
    compressed = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value != null)
    );
  }
  
  const compressedJson = JSON.stringify(compressed);
  const compressedSize = Buffer.byteLength(compressedJson, 'utf8');
  const compressionRatio = originalSize > 0 ? (originalSize - compressedSize) / originalSize : 0;
  
  return {
    compressed,
    originalSize,
    compressedSize,
    compressionRatio: Math.round(compressionRatio * 100) / 100
  };
}

// Middleware for automatic response compression
export function withCompression(handler: Function) {
  return async (...args: any[]) => {
    const response = await handler(...args);
    
    if (!response || typeof response.json !== 'function') {
      return response;
    }
    
    try {
      const data = await response.clone().json();
      const { compressed, originalSize, compressedSize, compressionRatio } = compressResponse(data);
      
      // Only use compressed version if it's significantly smaller
      if (compressionRatio > 0.1) {
        const newResponse = NextResponse.json(compressed, { status: response.status });
        
        // Copy headers from original response
        response.headers.forEach((value: string, key: string) => {
          newResponse.headers.set(key, value);
        });
        
        // Add compression headers
        newResponse.headers.set('X-Original-Size', originalSize.toString());
        newResponse.headers.set('X-Compressed-Size', compressedSize.toString());
        newResponse.headers.set('X-Compression-Ratio', (compressionRatio * 100).toFixed(1) + '%');
        
        console.log(`📦 Response compressed: ${originalSize} → ${compressedSize} bytes (${(compressionRatio * 100).toFixed(1)}% reduction)`);
        
        return newResponse;
      }
    } catch (error) {
      console.warn('Compression failed:', error);
    }
    
    return response;
  };
}