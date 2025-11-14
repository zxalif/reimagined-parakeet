/**
 * Authentication API
 */

import { apiRequest, setAuthToken, clearAuthTokens } from './client';

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_admin?: boolean;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7300'}/api/v1/auth/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include', // Include cookies (CSRF token)
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw error;
  }

  const data = await response.json();
  
  setAuthToken(data.access_token);
  if (data.refresh_token) {
    localStorage.setItem('refresh_token', data.refresh_token);
  }
  
  // CSRF token is automatically set in cookie by backend and also returned in response
  // Store it in sessionStorage for easy access
  if (data.csrf_token) {
    sessionStorage.setItem('csrf_token', data.csrf_token);
  }
  
  return data;
};

/**
 * Fetch CSRF token from backend.
 * This should be called after login or when token expires.
 */
export const fetchCsrfToken = async (): Promise<string | null> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7300'}/api/v1/csrf-token`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        credentials: 'include',
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.csrf_token;
    }
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
  }
  
  return null;
};

export const getCurrentUser = async (): Promise<User> => {
  return apiRequest<User>('/api/v1/users/me');
};

export const logout = (): void => {
  clearAuthTokens();
};

