'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api/client';
import { formatDateTime } from '@/lib/utils/date';
import { RefreshCw, CheckCircle2, XCircle, AlertCircle, HelpCircle, Clock } from 'lucide-react';

interface ServiceStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  message: string;
  response_time_ms?: number;
  details?: Record<string, any>;
  last_checked: string;
}

interface SystemStatus {
  overall_status: 'healthy' | 'degraded' | 'down';
  services: ServiceStatus[];
  checked_at: string;
}

export default function StatusPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchStatus = async (isManual = false) => {
    try {
      if (isManual) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await apiRequest<SystemStatus>('/api/v1/admin/status', {
        method: 'GET',
      });

      setStatus(response);
    } catch (err: any) {
      setError(err.detail || 'Failed to fetch system status');
      console.error('Error fetching status:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchStatus();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'down':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <HelpCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    switch (status) {
      case 'healthy':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'degraded':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'down':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'degraded':
        return 'text-yellow-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading && !status) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
          <button
            onClick={() => fetchStatus(true)}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Status</h1>
          <p className="text-gray-600 mt-1">Monitor the health of all services</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Auto-refresh (30s)
          </label>
          <button
            onClick={() => fetchStatus(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Checking...' : 'Refresh Status'}
          </button>
        </div>
      </div>

      {/* Overall Status */}
      {status && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {getStatusIcon(status.overall_status)}
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Overall Status</h2>
                <p className={`text-2xl font-bold ${getOverallStatusColor(status.overall_status)}`}>
                  {status.overall_status.charAt(0).toUpperCase() + status.overall_status.slice(1)}
                </p>
              </div>
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>Last checked:</p>
              <p className="font-medium">{formatDateTime(status.checked_at)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Services Status */}
      {status && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Service Status</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {status.services.map((service, index) => (
              <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="mt-0.5">{getStatusIcon(service.status)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-base font-semibold text-gray-900">{service.service}</h3>
                        <span className={getStatusBadge(service.status)}>
                          {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                        </span>
                        {service.response_time_ms !== undefined && (
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {service.response_time_ms.toFixed(0)}ms
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{service.message}</p>
                      
                      {/* Details */}
                      {service.details && Object.keys(service.details).length > 0 && (
                        <div className="mt-3 bg-gray-50 rounded-lg p-3">
                          <details className="group">
                            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 list-none">
                              <span className="flex items-center gap-2">
                                View Details
                                <span className="text-gray-400 group-open:hidden">▼</span>
                                <span className="text-gray-400 hidden group-open:inline">▲</span>
                              </span>
                            </summary>
                            <div className="mt-2 space-y-1">
                              {Object.entries(service.details).map(([key, value]) => (
                                <div key={key} className="text-sm text-gray-600">
                                  <span className="font-medium">{key}:</span>{' '}
                                  <span className="text-gray-800">
                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500 ml-4">
                    <p>{formatDateTime(service.last_checked)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && status && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            Warning: {error} (showing last known status)
          </p>
        </div>
      )}
    </div>
  );
}

