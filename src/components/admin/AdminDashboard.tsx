'use client';

import { useState, useEffect } from 'react';
import LeadsTable from './LeadsTable';
import DashboardStats from './DashboardStats';
import TodaysAppointments from './TodaysAppointments';
import AnalyticsDashboard from './AnalyticsDashboard';
import LeadScoringDashboard from './LeadScoringDashboard';
import CacheManagement from './CacheManagement';

interface AdminDashboardProps {
  onLogout: () => void;
  currentUser?: any;
}

interface Lead {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
  sellMethod: string;
  distance?: number;
  pickupFee?: number;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  quote?: any;
  appointment?: any;
  verification?: any;
  status: string;
}

interface Stats {
  overview: {
    totalLeads: number;
    totalVerified: number;
    totalScheduled: number;
    totalCompleted: number;
    verificationRate: number;
    schedulingRate: number;
    completionRate: number;
  };
  today: {
    leads: number;
    scheduled: number;
  };
  trends: {
    weekLeads: number;
    monthLeads: number;
    avgQuoteValue: number;
    totalRevenue: number;
  };
  topDevices: Array<{
    model: string;
    count: number;
  }>;
  recentActivity: Array<{
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    device: string;
    quote: number;
    status: string;
    createdAt: string;
    sellMethod: string;
  }>;
}

export default function AdminDashboard({ onLogout, currentUser }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'appointments' | 'analytics' | 'priorities' | 'performance'>('overview');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsResponse, leadsResponse] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/leads?limit=25')
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (leadsResponse.ok) {
        const leadsData = await leadsResponse.json();
        setLeads(leadsData.leads);
      }
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeadUpdate = async (leadId: string, updates: any) => {
    try {
      const response = await fetch('/api/admin/leads', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId,
          updates
        }),
      });

      if (response.ok) {
        loadData(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to update lead:', error);
    }
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'leads', label: 'Leads', icon: '👥' },
    { key: 'appointments', label: 'Appointments', icon: '📅' },
    { key: 'priorities', label: 'Lead Priorities', icon: '🎯' },
    { key: 'analytics', label: 'Analytics', icon: '📈' },
    { key: 'performance', label: 'Performance', icon: '⚡' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                SellPhones.sydney Admin
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {new Date().toLocaleDateString('en-AU', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              <div className="flex items-center space-x-3">
                {currentUser && (
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-800">
                      {currentUser.firstName} {currentUser.lastName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {currentUser.role} • {currentUser.email}
                    </div>
                  </div>
                )}
                <button
                  onClick={async () => {
                    try {
                      await fetch('/api/auth/logout', { method: 'POST' });
                    } catch (error) {
                      console.error('Logout error:', error);
                    }
                    onLogout();
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="ml-4 text-gray-600">Loading admin dashboard...</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <DashboardStats stats={stats} />
                
                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                  </div>
                  <div className="p-6">
                    {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                      <div className="space-y-4">
                        {stats.recentActivity.slice(0, 5).map((activity) => (
                          <div key={activity.id} className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {activity.firstName} {activity.lastName} - {activity.device}
                              </div>
                              <div className="text-xs text-gray-500">
                                {activity.email} • ${activity.quote} • {activity.sellMethod}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                                activity.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                activity.status === 'verified' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {activity.status}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {new Date(activity.createdAt).toLocaleDateString('en-AU')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No recent activity</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'leads' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Lead Management</h2>
                  <div className="text-sm text-gray-600">
                    Total: {leads.length} leads
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow">
                  <LeadsTable leads={leads} onLeadUpdate={handleLeadUpdate} />
                </div>
              </div>
            )}

            {activeTab === 'appointments' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Appointment Management</h2>
                  <div className="text-sm text-gray-600">
                    {new Date().toLocaleDateString('en-AU', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </div>
                </div>

                <TodaysAppointments />
              </div>
            )}

            {activeTab === 'priorities' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Lead Priorities & Quote Management</h2>
                  <div className="text-sm text-gray-600">
                    AI-powered lead scoring and quote expiration tracking
                  </div>
                </div>

                <LeadScoringDashboard />
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Analytics & Insights</h2>
                  <div className="text-sm text-gray-600">
                    Last 30 days
                  </div>
                </div>

                <AnalyticsDashboard />
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Performance & Cache Management</h2>
                  <div className="text-sm text-gray-600">
                    System performance optimization and cache control
                  </div>
                </div>

                <CacheManagement />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}