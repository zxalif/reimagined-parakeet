'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Search, 
  ChevronLeft,
  ChevronRight,
  Hash,
  Briefcase,
  TrendingUp,
} from 'lucide-react';

interface UserStats {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  keyword_count: number;
  opportunity_count: number;
  has_active_subscription: boolean;
  subscription_plan: string | null;
}

export default function UserStatsPage() {
  const [users, setUsers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<'keywords' | 'opportunities' | 'created'>('opportunities');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const limit = 20;

  useEffect(() => {
    fetchUsers();
  }, [page, search, sortBy, sortOrder]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams({
        skip: String((page - 1) * limit),
        limit: String(limit),
      });

      if (search) params.append('search', search);

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7300'}/api/v1/admin/users?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      let usersData = response.data.users || response.data || [];
      
      // Sort users by keyword_count or opportunity_count
      usersData = [...usersData].sort((a: UserStats, b: UserStats) => {
        let aValue: number;
        let bValue: number;
        
        if (sortBy === 'keywords') {
          aValue = a.keyword_count || 0;
          bValue = b.keyword_count || 0;
        } else if (sortBy === 'opportunities') {
          aValue = a.opportunity_count || 0;
          bValue = b.opportunity_count || 0;
        } else {
          // Sort by created_at
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
        }
        
        if (sortOrder === 'asc') {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      });
      
      setUsers(usersData);
      setTotal(response.data.total || response.data.length || 0);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load user stats');
      console.error('Error fetching user stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: 'keywords' | 'opportunities' | 'created') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const totalPages = Math.ceil(total / limit);

  // Calculate totals
  const totalKeywords = users.reduce((sum, user) => sum + (user.keyword_count || 0), 0);
  const totalOpportunities = users.reduce((sum, user) => sum + (user.opportunity_count || 0), 0);
  const activeUsers = users.filter(u => u.is_active).length;

  if (loading && users.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">User Statistics</h1>
          <p className="text-gray-600 mt-1">View user activity: keywords and opportunities</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Keywords</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalKeywords}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Hash className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Opportunities</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalOpportunities}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Briefcase className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{activeUsers}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by email or name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    fetchUsers();
                  }
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th 
                  className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('keywords')}
                >
                  <div className="flex items-center gap-1">
                    Keywords
                    {sortBy === 'keywords' && (
                      <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('opportunities')}
                >
                  <div className="flex items-center gap-1">
                    Opportunities
                    {sortBy === 'opportunities' && (
                      <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Status</th>
                <th 
                  className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('created')}
                >
                  <div className="flex items-center gap-1">
                    Created
                    {sortBy === 'created' && (
                      <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 md:px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      {user.has_active_subscription && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-1">
                          {user.subscription_plan || 'Subscribed'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{user.keyword_count || 0}</span>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{user.opportunity_count || 0}</span>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <div className="flex flex-col gap-1">
                      {user.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                      {user.is_verified ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Unverified
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                    {new Date(user.created_at).toLocaleDateString()}
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
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} users
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
                  Page {page} of {totalPages}
                </div>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages}
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

