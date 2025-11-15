/**
 * API Client for Admin Panel
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7300';

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

export const setAuthToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_token', token);
};

export const clearAuthTokens = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
};

/**
 * Get CSRF token from sessionStorage or cookie.
 * CSRF token is set in cookie by the backend (not httpOnly so JS can read it).
 */
export const getCsrfToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  // Try sessionStorage first (set during login)
  const stored = sessionStorage.getItem('csrf_token');
  if (stored) {
    return stored;
  }
  
  // Fallback to reading from cookie
  const cookies = document.cookie.split(';');
  const csrfCookie = cookies.find(cookie => cookie.trim().startsWith('csrf_token='));
  
  if (csrfCookie) {
    const token = csrfCookie.split('=')[1];
    // Store in sessionStorage for next time
    sessionStorage.setItem('csrf_token', token);
    return token;
  }
  
  return null;
};

export interface ApiError {
  detail: string;
}

/**
 * Fetch CSRF token from backend if missing.
 */
const ensureCsrfToken = async (): Promise<string | null> => {
  const existingToken = getCsrfToken();
  if (existingToken) {
    return existingToken;
  }

  // Try to fetch from backend
  try {
    const token = getAuthToken();
    if (!token) {
      return null;
    }

    const response = await fetch(`${API_URL}/api/v1/csrf-token`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      if (data.csrf_token) {
        sessionStorage.setItem('csrf_token', data.csrf_token);
        return data.csrf_token;
      }
    }
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
  }

  return null;
};

export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add CSRF token for state-changing requests
  const method = options.method?.toUpperCase() || 'GET';
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    let csrfToken = getCsrfToken();
    
    // If token is missing, try to fetch it
    if (!csrfToken) {
      csrfToken = await ensureCsrfToken();
    }
    
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    } else {
      console.warn('CSRF token not available for request:', endpoint);
    }
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Include cookies in requests
  });

  // If we get a 403 with CSRF error, try to refresh the token and retry once
  if (!response.ok) {
    // Clone the response to read it without consuming the body
    const responseClone = response.clone();
    const errorData = await responseClone.json().catch(() => ({}));
    
    // Check if it's a CSRF error (403 status)
    if (response.status === 403 && errorData.detail && errorData.detail.includes('CSRF')) {
      // Try to fetch a new CSRF token
      const newToken = await ensureCsrfToken();
      if (newToken && method !== 'GET') {
        // Retry the request with new token
        headers['X-CSRF-Token'] = newToken;
        const retryResponse = await fetch(`${API_URL}${endpoint}`, {
          ...options,
          headers,
          credentials: 'include',
        });
        
        if (!retryResponse.ok) {
          const retryError: ApiError = await retryResponse.json().catch(() => ({
            detail: `HTTP ${retryResponse.status}: ${retryResponse.statusText}`,
          }));
          throw retryError;
        }
        
        return retryResponse.json();
      }
    }
    
    // Not a CSRF error or retry failed, throw the original error
    const error: ApiError = errorData.detail 
      ? errorData 
      : { detail: `HTTP ${response.status}: ${response.statusText}` };
    throw error;
  }

  // Handle empty responses (204 No Content, etc.)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  // For non-JSON responses, return empty object or text
  const text = await response.text();
  return (text ? JSON.parse(text) : {}) as T;
};

