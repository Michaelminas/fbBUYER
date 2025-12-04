'use client';

import { useState, useEffect } from 'react';
import ConversionAnalytics from './ConversionAnalytics';

interface AnalyticsMetrics {
  overview: {
    totalEvents: number;
    uniqueVisitors: number;
    conversions: number;
  };
  funnel: {
    quotesStarted: number;
    quotesCompleted: number;
    leadsCreated: number;
    verificationsCompleted: number;
    schedulingsCompleted: number;
    conversionRates: {
      quoteToLead: number;
      leadToVerification: number;
      verificationToScheduling: number;
    };
  };
  insights: {
    topPages: Array<{ page: string; views: number }>;
    deviceBreakdown: Array<{ device: string; count: number }>;
    hourlyActivity: Array<{ hour: string; count: number }>;
  };
}

interface Props {
  dateRange?: { start: string; end: string };
}

export default function AnalyticsDashboard({ dateRange }: Props) {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMetrics();
  }, [dateRange]);

  const loadMetrics = async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange?.start) params.set('startDate', dateRange.start);
      if (dateRange?.end) params.set('endDate', dateRange.end);

      const response = await fetch(`/api/analytics/metrics?${params}`);
      if (!response.ok) {
        throw new Error('Failed to load metrics');
      }

      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load analytics metrics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-600">
          <h3 className="text-lg font-medium mb-2">Analytics Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Progress Flow Conversion Analytics */}
      <ConversionAnalytics dateRange="7d" />
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Events</h3>
          <div className="text-2xl font-bold text-gray-900">
            {metrics.overview.totalEvents.toLocaleString()}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Unique Visitors</h3>
          <div className="text-2xl font-bold text-gray-900">
            {metrics.overview.uniqueVisitors.toLocaleString()}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Conversions</h3>
          <div className="text-2xl font-bold text-green-600">
            {metrics.overview.conversions}
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Conversion Funnel</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-700">Quotes Started</div>
              <div className="text-xs text-gray-500">Visitors who began the quote process</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold">{metrics.funnel.quotesStarted}</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-700">Quotes Completed</div>
              <div className="text-xs text-gray-500">Visitors who completed quote form</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold">{metrics.funnel.quotesCompleted}</div>
              <div className="text-xs text-gray-500">
                {metrics.funnel.conversionRates.quoteToLead.toFixed(1)}% → Lead
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-700">Leads Created</div>
              <div className="text-xs text-gray-500">Users who provided contact info</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold">{metrics.funnel.leadsCreated}</div>
              <div className="text-xs text-gray-500">
                {metrics.funnel.conversionRates.leadToVerification.toFixed(1)}% → Verified
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-700">Email Verified</div>
              <div className="text-xs text-gray-500">Users who verified their email</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold">{metrics.funnel.verificationsCompleted}</div>
              <div className="text-xs text-gray-500">
                {metrics.funnel.conversionRates.verificationToScheduling.toFixed(1)}% → Scheduled
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-700">Appointments Scheduled</div>
              <div className="text-xs text-gray-500">Users who booked appointment</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-green-600">{metrics.funnel.schedulingsCompleted}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Pages</h3>
          <div className="space-y-3">
            {metrics.insights.topPages.slice(0, 5).map((page, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="text-sm text-gray-700 font-mono">
                  {page.page || '/'}
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {page.views.toLocaleString()} views
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Device Types</h3>
          <div className="space-y-3">
            {metrics.insights.deviceBreakdown.map((device, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="text-sm text-gray-700 capitalize">
                  {device.device || 'Unknown'}
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {device.count.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hourly Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Hourly Activity</h3>
        <div className="flex items-end space-x-1 h-32">
          {Array.from({ length: 24 }, (_, i) => {
            const hour = i.toString().padStart(2, '0');
            const activity = metrics.insights.hourlyActivity.find(a => a.hour === hour);
            const count = activity?.count || 0;
            const maxCount = Math.max(...metrics.insights.hourlyActivity.map(a => a.count), 1);
            const height = (count / maxCount) * 100;
            
            return (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-blue-500 rounded-t"
                  style={{ height: `${height}%` }}
                  title={`${hour}:00 - ${count} events`}
                ></div>
                <div className="text-xs text-gray-500 mt-1">{i % 4 === 0 ? hour : ''}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}