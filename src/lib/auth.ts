// Authentication utilities for ESP32 API communication
// Session token management for secure API requests

const SESSION_KEY = 'qms_session_token';
const SESSION_EXPIRY_KEY = 'qms_session_expiry';

export interface AuthSession {
  token: string;
  expiresAt: number;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  expiresIn?: number; // seconds
  error?: string;
}

// Get stored session token
export const getSessionToken = (): string | null => {
  const token = sessionStorage.getItem(SESSION_KEY);
  const expiryStr = sessionStorage.getItem(SESSION_EXPIRY_KEY);
  
  if (!token || !expiryStr) {
    return null;
  }
  
  const expiry = parseInt(expiryStr, 10);
  if (Date.now() > expiry) {
    // Session expired, clear it
    clearSession();
    return null;
  }
  
  return token;
};

// Store session token
export const setSession = (token: string, expiresInSeconds: number): void => {
  const expiryTime = Date.now() + (expiresInSeconds * 1000);
  sessionStorage.setItem(SESSION_KEY, token);
  sessionStorage.setItem(SESSION_EXPIRY_KEY, expiryTime.toString());
};

// Clear session
export const clearSession = (): void => {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_EXPIRY_KEY);
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return getSessionToken() !== null;
};

// Get auth headers for API requests
export const getAuthHeaders = (): Record<string, string> => {
  const token = getSessionToken();
  if (token) {
    return {
      'Authorization': `Bearer ${token}`,
    };
  }
  return {};
};
