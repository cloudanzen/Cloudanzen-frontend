import { apiClient, ApiResponse } from './client';
import {
  clearAuthSession,
  getAuthToken,
  getCachedUser as getStoredUser,
  hasAuthToken,
  setAuthToken,
  setCachedUser as storeCachedUser,
  clearCachedUser as clearStoredUser,
} from '@/services/authStorage';
import { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  CurrentUser,
  User 
} from './types';

export class AuthService {
  // Login user
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post('/api/auth/login', credentials);
  }

  // Register new user
  async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post('/api/auth/register', userData);
  }

  // Get current user
  async getCurrentUser(): Promise<ApiResponse<CurrentUser>> {
    return apiClient.get('/api/auth/me');
  }

  // Logout — clears HttpOnly cookie on backend + local session storage
  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout', {});
    } catch {
      // Best-effort — clear local state even if backend call fails
    }
    apiClient.removeToken();
    clearAuthSession();
  }

  // Store auth token
  setToken(token: string): void {
    setAuthToken(token);
    apiClient.setToken(token);
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return hasAuthToken();
  }

  // Get stored token
  getToken(): string | null {
    return getAuthToken();
  }

  // Get current user from localStorage (cached)
  getCachedUser(): User | null {
    return getStoredUser<User>();
  }

  // Update the current user's display name
  async updateProfile(name: string): Promise<{ user?: User }> {
    return apiClient.put('/api/auth/profile', { name });
  }

  // Change the current user's password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return apiClient.post('/api/auth/change-password', { currentPassword, newPassword });
  }

  // Cache current user data
  cacheUser(user: User): void {
    storeCachedUser(user);
  }

  // Clear cached user data
  clearCachedUser(): void {
    clearStoredUser();
  }

  // Update preferred language on the backend and refresh cached user
  async updateLocale(locale: 'en' | 'ja'): Promise<void> {
    await apiClient.patch('/api/auth/locale', { locale });
    // Update the cached user so the preference persists across page reloads
    const cached = this.getCachedUser();
    if (cached) {
      this.cacheUser({ ...cached, preferredLocale: locale });
    }
  }
}

export const authService = new AuthService();
