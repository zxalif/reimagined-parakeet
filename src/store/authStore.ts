/**
 * Authentication Store (Zustand) for Admin Panel
 */

import { create } from 'zustand';
import { login as apiLogin, getCurrentUser, logout as apiLogout, type User } from '@/lib/api/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiLogin(email, password);
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      const errorMessage = error?.detail || 'Login failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  logout: () => {
    apiLogout();
    set({ user: null, isAuthenticated: false, error: null });
  },

  fetchUser: async () => {
    try {
      const user = await getCurrentUser();
      // Only set authenticated if user is admin
      if (user.is_admin) {
        set({ user, isAuthenticated: true });
      } else {
        // Not an admin, clear auth
        apiLogout();
        set({ user: null, isAuthenticated: false });
      }
    } catch (error: any) {
      apiLogout();
      set({ user: null, isAuthenticated: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

