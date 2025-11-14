'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api/client';
import { 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Globe,
  Activity,
  Eye,
  X,
  Monitor,
  Tablet,
  Smartphone,
} from 'lucide-react';

interface PageVisit {
  id: string;
  page_path: string;
  ip_address: string | null;
  user_agent: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  user_id: string | null;
  user_email?: string | null;
  session_id: string | null;
  device_type: string | null;
  country: string | null;
  created_at: string;
}

export default function PageVisitsPage() {
  const [visits, setVisits] = useState<PageVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedVisit, setSelectedVisit] = useState<PageVisit | null>(null);
  const limit = 20;

  // Filters
  const [search, setSearch] = useState('');
  const [pagePath, setPagePath] = useState('');
  const [utmSource, setUtmSource] = useState('');
  const [deviceType, setDeviceType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchVisits();
  }, [page, pagePath, utmSource, deviceType, startDate, endDate, search]);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        skip: String((page - 1) * limit),
        limit: String(limit),
      });

      if (search) params.append('search', search);
      if (pagePath) params.append('page_path', pagePath);
      if (utmSource) params.append('utm_source', utmSource);
      if (deviceType) params.append('device_type', deviceType);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await apiRequest<{
        visits: PageVisit[];
        total: number;
        page: number;
        limit: number;
      }>(`/api/v1/admin/page-visits?${params.toString()}`);

      setVisits(response.visits || []);
      setTotal(response.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load page visits');
      console.error('Error fetching page visits:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setPagePath('');
    setUtmSource('');
    setDeviceType('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      case 'desktop':
        return <Monitor className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const getDeviceColor = (deviceType: string | null) => {
    switch (deviceType) {
      case 'mobile':
        return 'text-blue-600';
      case 'tablet':
        return 'text-purple-600';
      case 'desktop':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const truncateText = (text: string | null, maxLength: number = 50) => {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Page Visits</h1>
          <p className="text-gray-600">Track and analyze page visits and traffic sources</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search in referrer or user agent..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="border-t pt-4 mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Page Path Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Page Path
                </label>
                <input
                  type="text"
                  placeholder="e.g., /, /pricing"
                  value={pagePath}
                  onChange={(e) => {
                    setPagePath(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* UTM Source Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  UTM Source
                </label>
                <input
                  type="text"
                  placeholder="e.g., google, facebook"
                  value={utmSource}
                  onChange={(e) => {
                    setUtmSource(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Device Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Device Type
                </label>
                <select
                  value={deviceType}
                  onChange={(e) => {
                    setDeviceType(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Devices</option>
                  <option value="mobile">Mobile</option>
                  <option value="tablet">Tablet</option>
                  <option value="desktop">Desktop</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Clear Filters */}
          {(search || pagePath || utmSource || deviceType || startDate || endDate) && (
            <div className="mt-4">
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading page visits...</p>
          </div>
        )}

        {/* Visits Table */}
        {!loading && !error && (
          <>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Page
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IP Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Device
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Referrer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        UTM Source
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {visits.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                          No page visits found
                        </td>
                      </tr>
                    ) : (
                      visits.map((visit) => (
                        <tr key={visit.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {visit.page_path || '/'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {visit.ip_address || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className={getDeviceColor(visit.device_type)}>
                                {getDeviceIcon(visit.device_type)}
                              </span>
                              <span className="text-sm text-gray-900 capitalize">
                                {visit.device_type || 'Unknown'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {truncateText(visit.referrer, 40)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {visit.utm_source ? (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {visit.utm_source}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(visit.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => setSelectedVisit(visit)}
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} visits
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Visit Detail Modal */}
      {selectedVisit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Visit Details</h2>
                <button
                  onClick={() => setSelectedVisit(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Page Path</label>
                  <p className="text-gray-900">{selectedVisit.page_path || '/'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
                  <p className="text-gray-900">{selectedVisit.ip_address || '-'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Device Type</label>
                  <div className="flex items-center gap-2">
                    <span className={getDeviceColor(selectedVisit.device_type)}>
                      {getDeviceIcon(selectedVisit.device_type)}
                    </span>
                    <span className="text-gray-900 capitalize">
                      {selectedVisit.device_type || 'Unknown'}
                    </span>
                  </div>
                </div>

                {selectedVisit.user_email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                    <p className="text-gray-900">{selectedVisit.user_email}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <p className="text-gray-900">{formatDate(selectedVisit.created_at)}</p>
                </div>

                {selectedVisit.referrer && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Referrer</label>
                    <p className="text-gray-900 text-sm break-words">{selectedVisit.referrer}</p>
                  </div>
                )}

                {selectedVisit.user_agent && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User Agent</label>
                    <p className="text-gray-900 text-sm break-words">{selectedVisit.user_agent}</p>
                  </div>
                )}

                {(selectedVisit.utm_source || selectedVisit.utm_medium || selectedVisit.utm_campaign) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">UTM Parameters</label>
                    <div className="space-y-1">
                      {selectedVisit.utm_source && (
                        <p className="text-gray-900 text-sm">
                          <span className="font-medium">Source:</span> {selectedVisit.utm_source}
                        </p>
                      )}
                      {selectedVisit.utm_medium && (
                        <p className="text-gray-900 text-sm">
                          <span className="font-medium">Medium:</span> {selectedVisit.utm_medium}
                        </p>
                      )}
                      {selectedVisit.utm_campaign && (
                        <p className="text-gray-900 text-sm">
                          <span className="font-medium">Campaign:</span> {selectedVisit.utm_campaign}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {selectedVisit.session_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Session ID</label>
                    <p className="text-gray-900 text-sm font-mono">{selectedVisit.session_id}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Visit ID</label>
                  <p className="text-gray-900 text-sm font-mono">{selectedVisit.id}</p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedVisit(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

