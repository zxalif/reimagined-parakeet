'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Users, 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Activity,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface OverviewStats {
  users: {
    total: number;
    active: number;
    new_this_month: number;
    new_last_month: number;
    growth_rate: number;
  };
  subscriptions: {
    total: number;
    active: number;
    cancelled_this_month: number;
  };
  revenue: {
    mrr: number;
    total: number;
    this_month: number;
    last_month: number;
    growth_rate: number;
    arpu: number;
  };
  metrics: {
    churn_rate: number;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOverviewStats();
  }, []);

  const fetchOverviewStats = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7300'}/api/v1/admin/analytics/overview`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setStats(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load statistics');
      console.error('Error fetching stats:', err);
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

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.users.total.toLocaleString(),
      change: stats.users.growth_rate,
      changeLabel: 'vs last month',
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Active Subscriptions',
      value: stats.subscriptions.active.toLocaleString(),
      change: null,
      icon: CreditCard,
      color: 'purple'
    },
    {
      title: 'Monthly Recurring Revenue',
      value: `$${stats.revenue.mrr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: stats.revenue.growth_rate,
      changeLabel: 'vs last month',
      icon: DollarSign,
      color: 'green'
    },
    {
      title: 'Total Revenue',
      value: `$${stats.revenue.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: null,
      icon: TrendingUp,
      color: 'yellow'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          const colorClasses = {
            blue: 'bg-blue-50 text-blue-600',
            purple: 'bg-purple-50 text-purple-600',
            green: 'bg-green-50 text-green-600',
            yellow: 'bg-yellow-50 text-yellow-600',
          };

          return (
            <div key={card.title} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClasses[card.color as keyof typeof colorClasses]}`}>
                  <Icon className="w-6 h-6" />
                </div>
                {card.change !== null && (
                  <div className={`flex items-center space-x-1 text-sm ${
                    card.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {card.change >= 0 ? (
                      <ArrowUp className="w-4 h-4" />
                    ) : (
                      <ArrowDown className="w-4 h-4" />
                    )}
                    <span>{Math.abs(card.change).toFixed(1)}%</span>
                  </div>
                )}
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">{card.title}</h3>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              {card.changeLabel && (
                <p className="text-xs text-gray-500 mt-1">{card.changeLabel}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">New Users This Month</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.users.new_this_month}</p>
          <p className="text-sm text-gray-500 mt-1">
            {stats.users.new_last_month} last month
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Average Revenue Per User</h3>
          <p className="text-3xl font-bold text-gray-900">${stats.revenue.arpu.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-1">Per month</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Churn Rate</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.metrics.churn_rate.toFixed(2)}%</p>
          <p className="text-sm text-gray-500 mt-1">This month</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/users"
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <Users className="w-6 h-6 text-gray-600 mb-2" />
            <h4 className="font-medium text-gray-900">Manage Users</h4>
            <p className="text-sm text-gray-600 mt-1">View and manage user accounts</p>
          </a>
          <a
            href="/subscriptions"
            className="p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <CreditCard className="w-6 h-6 text-gray-600 mb-2" />
            <h4 className="font-medium text-gray-900">Manage Subscriptions</h4>
            <p className="text-sm text-gray-600 mt-1">View and manage subscriptions</p>
          </a>
          <a
            href="/analytics"
            className="p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <Activity className="w-6 h-6 text-gray-600 mb-2" />
            <h4 className="font-medium text-gray-900">View Analytics</h4>
            <p className="text-sm text-gray-600 mt-1">Detailed analytics and reports</p>
          </a>
        </div>
      </div>
    </div>
  );
}

