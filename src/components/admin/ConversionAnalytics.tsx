'use client';

import { useState, useEffect } from 'react';

interface ConversionMetrics {
  totalVisits: number;
  totalQuotes: number;
  totalLeads: number;
  totalVerified: number;
  totalScheduled: number;
  totalCompleted: number;
  rates: {
    visitToQuote: number;
    quoteToLead: number;
    leadToVerified: number;
    verifiedToScheduled: number;
    scheduledToCompleted: number;
    overallConversion: number;
  };
}

interface DropOffAnalysis {
  step: string;
  totalEntered: number;
  totalCompleted: number;
  dropOffCount: number;
  dropOffRate: number;
  commonReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
}

interface ConversionAnalyticsProps {
  dateRange?: string;
  className?: string;
}

export default function ConversionAnalytics({ 
  dateRange = '7d',
  className = '' 
}: ConversionAnalyticsProps) {
  const [metrics, setMetrics] = useState<ConversionMetrics | null>(null);
  const [dropOffAnalysis, setDropOffAnalysis] = useState<DropOffAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConversionData();
  }, [dateRange]);

  const fetchConversionData = async () => {
    try {
      setLoading(true);
      
      // Fetch conversion metrics
      const metricsResponse = await fetch(`/api/analytics/conversion?range=${dateRange}`);
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
      }

      // Fetch drop-off analysis
      const dropOffResponse = await fetch(`/api/analytics/dropoff?range=${dateRange}`);
      if (dropOffResponse.ok) {
        const dropOffData = await dropOffResponse.json();
        setDropOffAnalysis(dropOffData.analysis || []);
      }
    } catch (err) {
      console.error('Failed to fetch conversion analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center text-red-600">
          <p>⚠️ {error}</p>
          <button 
            onClick={fetchConversionData}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const getStepColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Conversion Funnel */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Conversion Funnel</h3>
          <div className="text-sm text-gray-500">Last {dateRange === '7d' ? '7 days' : dateRange === '30d' ? '30 days' : 'day'}</div>
        </div>

        {metrics && (
          <div className="space-y-4">
            {/* Funnel Steps */}
            <div className="space-y-3">
              {/* Page Visits */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
                  <div>
                    <div className="font-medium text-gray-900">Page Visits</div>
                    <div className="text-sm text-gray-600">Total site visitors</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{metrics.totalVisits.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">100%</div>
                </div>
              </div>

              {/* Quote Started */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
                  <div>
                    <div className="font-medium text-gray-900">Quotes Started</div>
                    <div className="text-sm text-gray-600">Completed quote calculator</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{metrics.totalQuotes.toLocaleString()}</div>
                  <div className={`text-sm font-medium ${getStepColor(metrics.rates.visitToQuote)}`}>
                    {formatPercentage(metrics.rates.visitToQuote)}
                  </div>
                </div>
              </div>

              {/* Lead Created */}
              <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-medium">3</div>
                  <div>
                    <div className="font-medium text-gray-900">Leads Created</div>
                    <div className="text-sm text-gray-600">Submitted contact details</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{metrics.totalLeads.toLocaleString()}</div>
                  <div className={`text-sm font-medium ${getStepColor(metrics.rates.quoteToLead)}`}>
                    {formatPercentage(metrics.rates.quoteToLead)}
                  </div>
                </div>
              </div>

              {/* Email Verified */}
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-medium">4</div>
                  <div>
                    <div className="font-medium text-gray-900">Email Verified</div>
                    <div className="text-sm text-gray-600">Clicked verification link</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{metrics.totalVerified.toLocaleString()}</div>
                  <div className={`text-sm font-medium ${getStepColor(metrics.rates.leadToVerified)}`}>
                    {formatPercentage(metrics.rates.leadToVerified)}
                  </div>
                </div>
              </div>

              {/* Appointment Scheduled */}
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-medium">5</div>
                  <div>
                    <div className="font-medium text-gray-900">Appointments Scheduled</div>
                    <div className="text-sm text-gray-600">Booked time slot</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{metrics.totalScheduled.toLocaleString()}</div>
                  <div className={`text-sm font-medium ${getStepColor(metrics.rates.verifiedToScheduled)}`}>
                    {formatPercentage(metrics.rates.verifiedToScheduled)}
                  </div>
                </div>
              </div>

              {/* Completed */}
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">6</div>
                  <div>
                    <div className="font-medium text-gray-900">Transactions Completed</div>
                    <div className="text-sm text-gray-600">Paid devices</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{metrics.totalCompleted.toLocaleString()}</div>
                  <div className={`text-sm font-medium ${getStepColor(metrics.rates.scheduledToCompleted)}`}>
                    {formatPercentage(metrics.rates.scheduledToCompleted)}
                  </div>
                </div>
              </div>
            </div>

            {/* Overall Conversion Rate */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg">
                <div>
                  <div className="font-semibold text-lg">Overall Conversion Rate</div>
                  <div className="text-sm opacity-90">Visitors to paid transactions</div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{formatPercentage(metrics.rates.overallConversion)}</div>
                  <div className="text-sm opacity-90">End-to-end</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Drop-off Analysis */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Drop-off Analysis</h3>
        
        {dropOffAnalysis.length > 0 ? (
          <div className="space-y-4">
            {dropOffAnalysis.map((step, index) => (
              <div key={step.step} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 capitalize">{step.step} Step</h4>
                  <div className="text-sm text-gray-500">
                    {step.dropOffCount} drop-offs ({formatPercentage(step.dropOffRate)})
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                  <div>
                    <div className="text-gray-600">Entered</div>
                    <div className="font-semibold text-gray-900">{step.totalEntered.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Completed</div>
                    <div className="font-semibold text-green-600">{step.totalCompleted.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Drop-offs</div>
                    <div className="font-semibold text-red-600">{step.dropOffCount.toLocaleString()}</div>
                  </div>
                </div>

                {/* Common Reasons */}
                {step.commonReasons.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Common reasons:</div>
                    <div className="space-y-1">
                      {step.commonReasons.map((reason, reasonIndex) => (
                        <div key={reasonIndex} className="flex items-center justify-between text-xs">
                          <span className="text-gray-700 capitalize">{reason.reason.replace(/_/g, ' ')}</span>
                          <span className="font-medium text-gray-900">
                            {reason.count} ({formatPercentage(reason.percentage)})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p>No drop-off data available for this period.</p>
          </div>
        )}
      </div>

      {/* Key Insights */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
        
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Biggest Drop-off */}
            {(() => {
              const rates = [
                { step: 'Visit → Quote', rate: metrics.rates.visitToQuote, key: 'visitToQuote' },
                { step: 'Quote → Lead', rate: metrics.rates.quoteToLead, key: 'quoteToLead' },
                { step: 'Lead → Verified', rate: metrics.rates.leadToVerified, key: 'leadToVerified' },
                { step: 'Verified → Scheduled', rate: metrics.rates.verifiedToScheduled, key: 'verifiedToScheduled' },
                { step: 'Scheduled → Completed', rate: metrics.rates.scheduledToCompleted, key: 'scheduledToCompleted' }
              ];
              
              const lowestRate = rates.reduce((min, current) => current.rate < min.rate ? current : min);
              const highestRate = rates.reduce((max, current) => current.rate > max.rate ? current : max);

              return (
                <>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-sm font-medium text-red-800 mb-1">🚨 Biggest Drop-off</div>
                    <div className="text-lg font-bold text-red-900">{lowestRate.step}</div>
                    <div className="text-sm text-red-700">{formatPercentage(lowestRate.rate)} conversion rate</div>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-sm font-medium text-green-800 mb-1">✅ Best Performing</div>
                    <div className="text-lg font-bold text-green-900">{highestRate.step}</div>
                    <div className="text-sm text-green-700">{formatPercentage(highestRate.rate)} conversion rate</div>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}