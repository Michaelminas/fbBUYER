'use client';

import { useState, useEffect } from 'react';

interface CacheStats {
  size: number;
  maxSize: number;
  defaultTTL: number;
  utilizationPercent: number;
  keys: string[];
}

export default function CacheManagement() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [invalidatePattern, setInvalidatePattern] = useState('');

  useEffect(() => {
    loadCacheStats();
  }, []);

  const loadCacheStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/cache');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCacheAction = async (action: string, payload: any = {}) => {
    try {
      setActionLoading(action);
      const response = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload })
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        await loadCacheStats(); // Reload stats
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Cache action failed:', error);
      alert('Failed to perform cache action');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearCache = () => {
    if (confirm('Are you sure you want to clear the entire cache?')) {
      handleCacheAction('clear');
    }
  };

  const handleInvalidatePattern = () => {
    if (!invalidatePattern.trim()) {
      alert('Please enter a pattern to invalidate');
      return;
    }
    handleCacheAction('invalidate', { pattern: invalidatePattern.trim() });
  };

  const handleInvalidateByTags = (tags: string[]) => {
    if (confirm(`Invalidate all cache entries with tags: ${tags.join(', ')}?`)) {
      handleCacheAction('invalidate-by-tags', { tags });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Failed to load cache statistics</p>
        <button
          onClick={loadCacheStats}
          className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cache Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-900">{stats.size}</div>
          <div className="text-sm text-blue-700">Cached Entries</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-900">{stats.maxSize}</div>
          <div className="text-sm text-green-700">Max Capacity</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-900">{stats.utilizationPercent}%</div>
          <div className="text-sm text-orange-700">Utilization</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-900">{stats.defaultTTL}s</div>
          <div className="text-sm text-purple-700">Default TTL</div>
        </div>
      </div>

      {/* Utilization Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Cache Utilization</h3>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full ${
              stats.utilizationPercent > 80
                ? 'bg-red-500'
                : stats.utilizationPercent > 60
                ? 'bg-orange-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(stats.utilizationPercent, 100)}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {stats.size} of {stats.maxSize} entries ({stats.utilizationPercent}% full)
        </p>
      </div>

      {/* Cache Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Cache Management</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Clear All */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Clear Cache</h4>
            <p className="text-sm text-gray-600">Remove all cached entries</p>
            <button
              onClick={handleClearCache}
              disabled={actionLoading === 'clear'}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === 'clear' ? 'Clearing...' : 'Clear All Cache'}
            </button>
          </div>

          {/* Invalidate by Pattern */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Invalidate by Pattern</h4>
            <p className="text-sm text-gray-600">Remove cache entries matching a pattern</p>
            <div className="flex space-x-2">
              <input
                type="text"
                value={invalidatePattern}
                onChange={(e) => setInvalidatePattern(e.target.value)}
                placeholder="e.g., admin:leads"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleInvalidatePattern}
                disabled={actionLoading === 'invalidate' || !invalidatePattern.trim()}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === 'invalidate' ? 'Invalidating...' : 'Invalidate'}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Tag Actions */}
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-3">Quick Tag Invalidation</h4>
          <div className="flex flex-wrap gap-2">
            {[
              { name: 'Admin Data', tags: ['admin', 'stats', 'leads'] },
              { name: 'Lead Stats', tags: ['stats', 'leads'] },
              { name: 'Analytics', tags: ['analytics'] },
              { name: 'Health Checks', tags: ['health'] }
            ].map(({ name, tags }) => (
              <button
                key={name}
                onClick={() => handleInvalidateByTags(tags)}
                disabled={actionLoading === 'invalidate-by-tags'}
                className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 disabled:opacity-50 text-sm"
              >
                Clear {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cache Keys */}
      {stats.keys.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Active Cache Keys ({stats.keys.length})
          </h3>
          <div className="max-h-64 overflow-y-auto">
            <div className="space-y-1">
              {stats.keys.map((key, index) => (
                <div
                  key={index}
                  className="text-sm font-mono bg-gray-50 px-3 py-2 rounded border"
                >
                  {key}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cache Performance Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-3">💡 Performance Tips</h3>
        <ul className="text-sm text-blue-700 space-y-2">
          <li>• Cache utilization above 80% may indicate need for increased capacity</li>
          <li>• Clear admin caches after making significant data changes</li>
          <li>• Pattern invalidation is useful for clearing related cache entries</li>
          <li>• Monitor cache hit rates in application logs</li>
        </ul>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={loadCacheStats}
          disabled={isLoading}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Refresh Stats'}
        </button>
      </div>
    </div>
  );
}