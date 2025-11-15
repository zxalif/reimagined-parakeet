'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  BarChart3, 
  LogOut,
  Menu,
  X,
  MessageSquare,
  FileText,
  Eye,
  TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

/**
 * Admin Layout Client Component
 * 
 * Protected layout for admin pages.
 * Checks if user is admin before rendering.
 */
export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, fetchUser, logout } = useAuthStore();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      // Skip check for login page
      if (pathname === '/login') {
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        await fetchUser();
        const currentUser = useAuthStore.getState().user;
        
        if (!currentUser || !currentUser.is_admin) {
          router.push('/login');
          return;
        }

        // CSRF token is automatically set during login, no need to fetch separately

        setIsAdmin(true);
      } catch (error: any) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [pathname, router, fetchUser]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Show login page without layout
  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/users', label: 'Users', icon: Users },
    { href: '/user-stats', label: 'User Stats', icon: TrendingUp },
    { href: '/subscriptions', label: 'Subscriptions', icon: CreditCard },
    { href: '/support', label: 'Support', icon: MessageSquare },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/audit-logs', label: 'Audit Logs', icon: FileText },
    { href: '/page-visits', label: 'Page Visits', icon: Eye },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="text-lg font-bold text-gray-900">Admin Panel</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-lg bg-white border border-gray-200 shadow-sm"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:pl-64 pt-16 lg:pt-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-gray-900">
            {navItems.find(item => pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href)))?.label || 'Admin'}
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

