'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api/client';
import Link from 'next/link';
import { MessageSquare, Search, Filter, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface SupportThread {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  unread_count: number;
}

export default function AdminSupportPage() {
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchThreads();
  }, [statusFilter, page]);

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        skip: String((page - 1) * limit),
        limit: String(limit),
      });
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const data = await apiRequest<{ threads: SupportThread[]; total: number }>(
        `/api/v1/admin/support/threads?${params.toString()}`
      );
      setThreads(data.threads || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.detail || 'Failed to load support threads');
      console.error('Error fetching threads:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Clock className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'closed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const filteredThreads = threads.filter(thread => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        thread.subject.toLowerCase().includes(searchLower) ||
        thread.user_email.toLowerCase().includes(searchLower) ||
        thread.user_name.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (loading && threads.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Support Threads</h1>
          <p className="text-gray-600 mt-1">Manage customer support requests</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by subject, user email, or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Messages</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Updated</th>
                <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredThreads.map((thread) => (
                <tr key={thread.id} className="hover:bg-gray-50">
                  <td className="px-4 md:px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{thread.user_name}</div>
                      <div className="text-sm text-gray-500">{thread.user_email}</div>
                      {thread.unread_count > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1 md:hidden">
                          {thread.unread_count} unread
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{thread.subject}</div>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(thread.status)}`}>
                      {getStatusIcon(thread.status)}
                      <span className="ml-1">{thread.status.charAt(0).toUpperCase() + thread.status.slice(1)}</span>
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                    <div className="flex items-center space-x-2">
                      <span>{thread.message_count} messages</span>
                      {thread.unread_count > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {thread.unread_count} unread
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                    {new Date(thread.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/support/${thread.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </Link>
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
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} threads
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

      {filteredThreads.length === 0 && !loading && (
        <div className="text-center py-12">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No support threads</h3>
          <p className="mt-1 text-sm text-gray-500">No support threads match your filters.</p>
        </div>
      )}
    </div>
  );
}

