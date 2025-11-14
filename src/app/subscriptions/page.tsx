'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Subscription {
  id: string;
  user_id: string;
  user_email: string;
  plan: string;
  status: string;
  billing_period: string;
  created_at: string;
  current_period_start: string | null;
  current_period_end: string | null;
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: 'all' as string,
    plan: 'all' as string,
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchSubscriptions();
  }, [page, filters]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams({
        skip: String((page - 1) * limit),
        limit: String(limit),
      });

      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.plan !== 'all') params.append('plan', filters.plan);

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7300'}/api/v1/admin/subscriptions?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setSubscriptions(response.data.subscriptions || []);
      setTotal(response.data.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load subscriptions');
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'power':
        return 'bg-purple-100 text-purple-800';
      case 'professional':
        return 'bg-blue-100 text-blue-800';
      case 'starter':
        return 'bg-green-100 text-green-800';
      case 'free':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && subscriptions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
          <p className="text-gray-600 mt-1">View and manage all subscriptions</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2">
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              setPage(1);
            }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
            <option value="past_due">Past Due</option>
          </select>
          <select
            value={filters.plan}
            onChange={(e) => {
              setFilters({ ...filters, plan: e.target.value });
              setPage(1);
            }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="professional">Professional</option>
            <option value="power">Power</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Billing Period</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Period</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50">
                  <td className="px-4 md:px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{sub.user_email}</div>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlanColor(sub.plan)}`}>
                      {sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sub.status)}`}>
                      {sub.status.charAt(0).toUpperCase() + sub.status.slice(1).replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                    {sub.billing_period.charAt(0).toUpperCase() + sub.billing_period.slice(1)}
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                    {sub.current_period_start && sub.current_period_end ? (
                      <div>
                        <div>{new Date(sub.current_period_start).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-400">to {new Date(sub.current_period_end).toLocaleDateString()}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                    {new Date(sub.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <div className="bg-gray-50 px-4 md:px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} subscriptions
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Previous</span>
                </button>
                <div className="text-sm text-gray-700 px-2">
                  Page {page} of {Math.ceil(total / limit)}
                </div>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * limit >= total}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 flex items-center gap-1"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}
    </div>
  );
}

