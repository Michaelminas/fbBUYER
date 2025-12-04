'use client';

import { useState } from 'react';

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

interface LeadsTableProps {
  leads: Lead[];
  onLeadUpdate: (leadId: string, updates: any) => void;
  showPagination?: boolean;
}

export default function LeadsTable({ leads, onLeadUpdate, showPagination = true }: LeadsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const itemsPerPage = 10;

  const filteredLeads = leads.filter(lead => {
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesSearch = !searchQuery || 
      (lead.firstName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.lastName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.phoneNumber?.includes(searchQuery)) ||
      (lead.quote?.device?.model?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      lead.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedLeads = showPagination 
    ? filteredLeads.slice(startIndex, startIndex + itemsPerPage)
    : filteredLeads;

  const getStatusColor = (status: string) => {
    const colors = {
      'new': 'bg-yellow-100 text-yellow-800',
      'verified': 'bg-blue-100 text-blue-800',
      'scheduled': 'bg-purple-100 text-purple-800',
      'confirmed': 'bg-indigo-100 text-indigo-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleStatusUpdate = (lead: Lead, newStatus: string) => {
    if (newStatus === lead.status) return;
    
    if (lead.appointment?.id) {
      onLeadUpdate(lead.id, { 
        appointmentStatus: newStatus
      });
    } else {
      onLeadUpdate(lead.id, { 
        status: newStatus
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statuses = ['all', 'new', 'verified', 'scheduled', 'confirmed', 'completed', 'cancelled'];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search leads..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <select
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {statuses.map(status => (
            <option key={status} value={status}>
              {status === 'all' ? 'All Statuses' : status}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Device
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quote
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayedLeads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {lead.firstName} {lead.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{lead.email}</div>
                    <div className="text-sm text-gray-500">{lead.phoneNumber}</div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {lead.quote?.device?.model || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {lead.quote?.device?.storage ? `${lead.quote.device.storage}GB` : ''}
                  </div>
                  {lead.quote?.damages?.length > 0 && (
                    <div className="text-xs text-gray-500">{lead.quote.damages.length} issues</div>
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    ${lead.quote?.finalQuote || 0}
                  </div>
                  {lead.pickupFee && lead.pickupFee > 0 && (
                    <div className="text-xs text-gray-500">+${lead.pickupFee} pickup</div>
                  )}
                  <div className="text-xs text-gray-500">{lead.sellMethod}</div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={lead.status}
                    onChange={(e) => handleStatusUpdate(lead, e.target.value)}
                    className={`text-xs font-medium px-2 py-1 rounded-full border-0 ${getStatusColor(lead.status)} focus:ring-2 focus:ring-blue-500`}
                  >
                    {['new', 'verified', 'scheduled', 'confirmed', 'completed', 'cancelled'].map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(lead.createdAt)}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => setSelectedLead(lead)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    View
                  </button>
                  <a
                    href={`tel:${lead.phoneNumber || ''}`}
                    className="text-green-600 hover:text-green-900 mr-3"
                  >
                    Call
                  </a>
                  <a
                    href={`https://wa.me/61${(lead.phoneNumber || '').replace(/^0/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-900"
                  >
                    WhatsApp
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredLeads.length)} of{' '}
            {filteredLeads.length} results
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <span className="px-3 py-2 text-sm font-medium text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Lead Details</h3>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedLead.firstName} {selectedLead.lastName}</p>
                  <p className="text-sm text-gray-500">{selectedLead.email}</p>
                  <p className="text-sm text-gray-500">{selectedLead.phoneNumber}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Device</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedLead.quote?.device?.model || 'N/A'}</p>
                  <p className="text-sm text-gray-500">{selectedLead.quote?.device?.storage ? `${selectedLead.quote.device.storage}GB` : ''}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Damages</label>
                {selectedLead.quote?.damages?.length > 0 ? (
                  <ul className="mt-1 text-sm text-gray-900 list-disc list-inside">
                    {selectedLead.quote.damages.map((damage: string, index: number) => (
                      <li key={index}>{damage}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-gray-500">No damage reported</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quote</label>
                  <p className="mt-1 text-lg font-bold text-gray-900">${selectedLead.quote?.finalQuote || 0}</p>
                  {selectedLead.pickupFee && (
                    <p className="text-sm text-gray-500">+${selectedLead.pickupFee} pickup fee</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Method</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{selectedLead.sellMethod}</p>
                  {selectedLead.address && (
                    <p className="text-sm text-gray-500">{selectedLead.address}</p>
                  )}
                </div>
              </div>
              
              {selectedLead.quote?.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer Notes</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedLead.quote.notes}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Admin Notes</label>
                <textarea
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Add admin notes..."
                  value={(selectedLead as any).adminNotes || ''}
                  onChange={(e) => setSelectedLead({...selectedLead, adminNotes: e.target.value} as any)}
                />
              </div>
              
              <div className="flex justify-between items-center pt-4">
                <div className="text-sm text-gray-500">
                  Created: {formatDate(selectedLead.createdAt)}
                </div>
                
                <div className="space-x-3">
                  <button
                    onClick={() => {
                      onLeadUpdate(selectedLead.id, { adminNotes: (selectedLead as any).adminNotes });
                      setSelectedLead(null);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    Save Notes
                  </button>
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-400"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}