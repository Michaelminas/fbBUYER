import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, AuthenticatedRequest } from '@/middleware/auth';
import { cache } from '@/lib/cache';

async function getCacheStats(request: AuthenticatedRequest) {
  try {
    const stats = cache.getStats();
    
    return NextResponse.json({
      success: true,
      stats: {
        size: stats.size,
        maxSize: stats.maxSize,
        defaultTTL: stats.defaultTTL,
        utilizationPercent: Math.round((stats.size / stats.maxSize) * 100),
        keys: stats.keys
      }
    });
  } catch (error) {
    console.error('Cache stats error:', error);
    return NextResponse.json({ error: 'Failed to get cache stats' }, { status: 500 });
  }
}

async function manageCacheActions(request: AuthenticatedRequest) {
  try {
    const { action, pattern, tags } = await request.json();
    
    switch (action) {
      case 'clear':
        cache.clear();
        return NextResponse.json({ 
          success: true, 
          message: 'Cache cleared successfully' 
        });

      case 'invalidate':
        if (!pattern) {
          return NextResponse.json({ error: 'Pattern is required for invalidation' }, { status: 400 });
        }
        
        const invalidated = cache.invalidate(pattern);
        return NextResponse.json({ 
          success: true, 
          message: `Invalidated ${invalidated} cache entries`,
          invalidated
        });

      case 'invalidate-by-tags':
        if (!tags || !Array.isArray(tags)) {
          return NextResponse.json({ error: 'Tags array is required' }, { status: 400 });
        }
        
        const tagInvalidated = cache.invalidateByTags(tags);
        return NextResponse.json({ 
          success: true, 
          message: `Invalidated ${tagInvalidated} cache entries by tags`,
          invalidated: tagInvalidated
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Cache management error:', error);
    return NextResponse.json({ error: 'Failed to manage cache' }, { status: 500 });
  }
}

// Export protected handlers
export const GET = requireAdminAuth(getCacheStats);
export const POST = requireAdminAuth(manageCacheActions);