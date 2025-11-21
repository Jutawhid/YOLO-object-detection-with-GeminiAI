import { apiClient } from './client';
import { LoginInput } from '../../lib/validations/auth';

export interface LoginResponse {
  token: string;
  id: string;
  email: string;
  name: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export class AuthApi {
  async login(credentials: LoginInput): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>('/api/auth/login', credentials);
  }

  async getCurrentUser(token: string): Promise<AuthUser> {
    // This would call your backend to get user profile
    // For now, we'll decode the token to get basic info
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.userId || '1',
        email: payload.email || 'user@example.com',
        name: payload.name || 'John Doe',
      };
    } catch {
      throw {
        message: 'Invalid token',
        status: 401,
      };
    }
  }
}

export const authApi = new AuthApi();