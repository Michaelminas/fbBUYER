'use client';

import { useState, useEffect } from 'react';
import type { LeadScore, QuoteExpirationResult } from '@/services/quoteService';

interface ExpirationStats {
  totalQuotes: number;
  expiredQuotes: number;
  convertedQuotes: number;
  expirationRate: number;
  conversionRate: number;
  period: string;
}

export default function LeadScoringDashboard() {
  const [prioritizedLeads, setPrioritizedLeads] = useState<LeadScore[]>([]);
  const [expirationStats, setExpirationStats] = useState<ExpirationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<LeadScore | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load prioritized leads
      const leadsResponse = await fetch('/api/admin/quotes?action=prioritized-leads&limit=25');
      if (leadsResponse.ok) {
        const leads = await leadsResponse.json();
        setPrioritizedLeads(leads);
      }

      // Load expiration stats
      const statsResponse = await fetch('/api/admin/quotes?action=expiration-stats&days=30');
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setExpirationStats(stats);
      }
    } catch (error) {
      console.error('Failed to load lead scoring data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpireQuotes = async () => {
    try {
      const response = await fetch('/api/admin/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'handle-expirations' })
      });
      
      if (response.ok) {
        const result: QuoteExpirationResult = await response.json();
        alert(`Processed ${result.expired} expired quotes. ${result.nearExpiry} quotes are expiring soon.`);
        await loadData(); // Reload data
      }
    } catch (error) {
      console.error('Failed to handle quote expirations:', error);
    }
  };

  const getPriorityColor = (priority: LeadScore['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: LeadScore['priority']) => {
    switch (priority) {
      case 'urgent': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '⚪';
      default: return '⚪';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {expirationStats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-900">{expirationStats.totalQuotes}</div>
            <div className="text-sm text-blue-700">Total Quotes</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-900">{expirationStats.expiredQuotes}</div>
            <div className="text-sm text-red-700">Expired</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-900">{expirationStats.convertedQuotes}</div>
            <div className="text-sm text-green-700">Converted</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-900">{expirationStats.expirationRate}%</div>
            <div className="text-sm text-orange-700">Expiration Rate</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-900">{expirationStats.conversionRate}%</div>
            <div className="text-sm text-purple-700">Conversion Rate</div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Lead Priority Dashboard</h3>
        <div className="flex space-x-2">
          <button
            onClick={handleExpireQuotes}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 font-medium"
          >
            Process Expired Quotes
          </button>
          <button
            onClick={loadData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Prioritized Leads Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-md font-medium text-gray-900">High-Priority Leads</h4>
          <p className="text-sm text-gray-600">Leads ranked by conversion probability and value</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Factors
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recommendations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {prioritizedLeads.map((lead) => (
                <tr key={lead.leadId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      Lead {lead.leadId.slice(-6)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(lead.priority)}`}>
                      {getPriorityIcon(lead.priority)} {lead.priority.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{lead.score}</div>
                    <div className="text-xs text-gray-500">/ 100</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span>Quote Value:</span>
                        <span className="font-medium">{lead.factors.quoteValue}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Response:</span>
                        <span className="font-medium">{lead.factors.responseSpeed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Engagement:</span>
                        <span className="font-medium">{lead.factors.engagement}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Verified:</span>
                        <span className="font-medium">{lead.factors.verificationStatus}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Device:</span>
                        <span className="font-medium">{lead.factors.deviceTier}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs space-y-1">
                      {lead.recommendations.slice(0, 2).map((rec, index) => (
                        <div key={index} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                          {rec}
                        </div>
                      ))}
                      {lead.recommendations.length > 2 && (
                        <div className="text-gray-500 text-xs">
                          +{lead.recommendations.length - 2} more
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedLead(lead)}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lead Details Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Lead {selectedLead.leadId.slice(-6)} - Detailed Analysis
              </h3>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Priority and Score */}
              <div className="flex items-center justify-between">
                <div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(selectedLead.priority)}`}>
                    {getPriorityIcon(selectedLead.priority)} {selectedLead.priority.toUpperCase()} PRIORITY
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">{selectedLead.score}</div>
                  <div className="text-sm text-gray-500">Lead Score / 100</div>
                </div>
              </div>

              {/* Factor Breakdown */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Score Breakdown</h4>
                <div className="space-y-3">
                  {Object.entries(selectedLead.factors).map(([factor, value]) => {
                    const maxValues = {
                      quoteValue: 30,
                      responseSpeed: 25,
                      engagement: 20,
                      verificationStatus: 15,
                      deviceTier: 10
                    };
                    const maxValue = maxValues[factor as keyof typeof maxValues];
                    const percentage = (value / maxValue) * 100;
                    
                    return (
                      <div key={factor}>
                        <div className="flex justify-between text-sm">
                          <span className="capitalize font-medium text-gray-700">
                            {factor.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="font-bold">{value} / {maxValue}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Action Recommendations</h4>
                <div className="space-y-2">
                  {selectedLead.recommendations.map((recommendation, index) => (
                    <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start">
                        <span className="text-blue-600 mr-2">💡</span>
                        <span className="text-sm text-blue-800">{recommendation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedLead(null)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}