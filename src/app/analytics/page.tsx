'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B'];

export default function AdminAnalyticsPage() {
  const [revenueData, setRevenueData] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7300';

      const [revenue, users, subscriptions] = await Promise.all([
        axios.get(`${baseUrl}/api/v1/admin/analytics/revenue`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${baseUrl}/api/v1/admin/analytics/users`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${baseUrl}/api/v1/admin/analytics/subscriptions`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
      ]);

      setRevenueData(revenue.data);
      setUserData(users.data);
      setSubscriptionData(subscriptions.data);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const planDistribution = subscriptionData?.by_plan
    ? Object.entries(subscriptionData.by_plan).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      }))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">Detailed analytics and insights</p>
      </div>

      {revenueData && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Analytics</h2>
          
          {revenueData.revenue_over_time && revenueData.revenue_over_time.length > 0 && (
            <div className="h-64 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData.revenue_over_time}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#3B82F6" name="Revenue ($)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {revenueData.revenue_by_plan && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Revenue by Plan</h3>
                {Object.entries(revenueData.revenue_by_plan).map(([plan, revenue]) => (
                  <div key={plan} className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">{plan}</span>
                    <span className="font-medium">${(revenue as number).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
            {revenueData.payment_metrics && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Payment Metrics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Success Rate</span>
                    <span className="font-medium">{revenueData.payment_metrics.success_rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Refund Rate</span>
                    <span className="font-medium">{revenueData.payment_metrics.refund_rate}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {userData && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">User Analytics</h2>
          
          {userData.user_growth && userData.user_growth.length > 0 && (
            <div className="h-64 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userData.user_growth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#3B82F6" name="New Users" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {userData.distribution_by_plan && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">User Distribution by Plan</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(userData.distribution_by_plan).map(([plan, count]) => (
                  <div key={plan} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{count as number}</div>
                    <div className="text-sm text-gray-600">{plan}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {subscriptionData && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription Analytics</h2>
          
          {planDistribution.length > 0 && (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {planDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

