'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api/client';
import { 
  Search, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX,
  Mail,
  ChevronLeft,
  ChevronRight,
  MailCheck,
  Send,
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_verified: boolean;
  is_admin: boolean;
  is_banned: boolean;
  created_at: string;
  has_active_subscription: boolean;
  subscription_plan: string | null;
  keyword_count?: number;
  opportunity_count?: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    is_active: null as boolean | null,
    is_verified: null as boolean | null,
    has_subscription: null as boolean | null,
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const limit = 20;

  useEffect(() => {
    fetchUsers();
  }, [page, filters, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        skip: String((page - 1) * limit),
        limit: String(limit),
      });

      if (search) params.append('search', search);
      if (filters.is_active !== null) params.append('is_active', String(filters.is_active));
      if (filters.is_verified !== null) params.append('is_verified', String(filters.is_verified));
      if (filters.has_subscription !== null) params.append('has_subscription', String(filters.has_subscription));

      const response = await apiRequest<{users: User[], total: number}>(
        `/api/v1/admin/users?${params.toString()}`,
        { method: 'GET' }
      );
      setUsers(response.users || response as any || []);
      setTotal(response.total || (response as any).length || 0);
    } catch (err: any) {
      setError(err.detail || 'Failed to load users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (userId: string) => {
    try {
      await apiRequest(`/api/v1/admin/users/${userId}/activate`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      fetchUsers();
    } catch (err: any) {
      alert(err.detail || 'Failed to activate user');
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;
    
    try {
      await apiRequest(`/api/v1/admin/users/${userId}/deactivate`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      fetchUsers();
    } catch (err: any) {
      alert(err.detail || 'Failed to deactivate user');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      await apiRequest(`/api/v1/admin/users/${userId}`, {
        method: 'DELETE',
      });
      fetchUsers();
    } catch (err: any) {
      alert(err.detail || 'Failed to delete user');
    }
  };

  const handleBan = async (userId: string) => {
    if (!confirm('Are you sure you want to ban this user? They will not be able to login.')) return;
    
    try {
      await apiRequest(`/api/v1/admin/users/${userId}/ban`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      fetchUsers();
    } catch (err: any) {
      alert(err.detail || 'Failed to ban user');
    }
  };

  const handleUnban = async (userId: string) => {
    try {
      await apiRequest(`/api/v1/admin/users/${userId}/unban`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      fetchUsers();
    } catch (err: any) {
      alert(err.detail || 'Failed to unban user');
    }
  };

  const handleSendEmail = async () => {
    if (!selectedUser || !emailSubject || !emailMessage) return;
    
    try {
      setSendingEmail(true);
      await apiRequest(`/api/v1/admin/users/${selectedUser.id}/send-email`, {
        method: 'POST',
        body: JSON.stringify({
          to_email: selectedUser.email,
          subject: emailSubject,
          message: emailMessage,
          html: true
        }),
      });
      alert('Email sent successfully!');
      setShowEmailModal(false);
      setEmailSubject('');
      setEmailMessage('');
      setSelectedUser(null);
    } catch (err: any) {
      alert(err.detail || 'Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendVerificationEmail = async (userId: string) => {
    if (!confirm('Send verification email to this user?')) return;
    
    try {
      await apiRequest(`/api/v1/admin/users/${userId}/send-verification-email`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      alert('Verification email sent successfully!');
      fetchUsers();
    } catch (err: any) {
      alert(err.detail || 'Failed to send verification email');
    }
  };

  const handleVerifyEmail = async (userId: string) => {
    if (!confirm('Manually verify this user\'s email address?')) return;
    
    try {
      await apiRequest(`/api/v1/admin/users/${userId}/verify-email`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      alert('User email verified successfully!');
      fetchUsers();
    } catch (err: any) {
      alert(err.detail || 'Failed to verify email');
    }
  };

  const totalPages = Math.ceil(total / limit);

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
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage user accounts and permissions</p>
        </div>
      </div>

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
                  setPage(1); // Reset to first page on search
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

          <div className="flex flex-wrap gap-2">
            <select
              value={filters.is_active === null ? 'all' : String(filters.is_active)}
              onChange={(e) => {
                setFilters({ ...filters, is_active: e.target.value === 'all' ? null : e.target.value === 'true' });
                setPage(1);
              }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <select
              value={filters.is_verified === null ? 'all' : String(filters.is_verified)}
              onChange={(e) => {
                setFilters({ ...filters, is_verified: e.target.value === 'all' ? null : e.target.value === 'true' });
                setPage(1);
              }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Verification</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>
            <select
              value={filters.has_subscription === null ? 'all' : String(filters.has_subscription)}
              onChange={(e) => {
                setFilters({ ...filters, has_subscription: e.target.value === 'all' ? null : e.target.value === 'true' });
                setPage(1);
              }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Subscriptions</option>
              <option value="true">With Subscription</option>
              <option value="false">Without Subscription</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Status</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Subscription</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Created</th>
                <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 md:px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      <div className="flex flex-wrap gap-1 mt-1 sm:hidden">
                        {user.is_banned ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Banned
                          </span>
                        ) : user.is_active ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Inactive
                          </span>
                        )}
                        {user.is_verified ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Unverified
                          </span>
                        )}
                        {user.has_active_subscription && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {user.subscription_plan || 'Subscribed'}
                          </span>
                        )}
                      </div>
                      {user.is_admin && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                          Admin
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                    <div className="flex flex-col gap-1">
                      {user.is_banned ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Banned
                        </span>
                      ) : user.is_active ? (
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
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    {user.has_active_subscription ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {user.subscription_plan || 'Active'}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">No subscription</span>
                    )}
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-1 flex-wrap">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowEmailModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Send Email"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      {!user.is_verified && (
                        <>
                          <button
                            onClick={() => handleSendVerificationEmail(user.id)}
                            className="text-purple-600 hover:text-purple-900 p-1"
                            title="Send Verification Email"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleVerifyEmail(user.id)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Verify Email"
                          >
                            <MailCheck className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {user.is_banned ? (
                        <button
                          onClick={() => handleUnban(user.id)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Unban"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      ) : (
                        <>
                          {user.is_active ? (
                            <button
                              onClick={() => handleDeactivate(user.id)}
                              className="text-yellow-600 hover:text-yellow-900 p-1"
                              title="Deactivate"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivate(user.id)}
                              className="text-green-600 hover:text-green-900 p-1"
                              title="Activate"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleBan(user.id)}
                            className="text-orange-600 hover:text-orange-900 p-1"
                            title="Ban"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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

      {/* Email Modal */}
      {showEmailModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Send Email to {selectedUser.full_name}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <input
                    type="email"
                    value={selectedUser.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Email subject"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    placeholder="Email message (supports HTML)"
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmailSubject('');
                    setEmailMessage('');
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={!emailSubject || !emailMessage || sendingEmail}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingEmail ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}
    </div>
  );
}

