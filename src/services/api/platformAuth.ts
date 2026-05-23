import { apiClient } from './client';

// Platform admin identity. Org-less SUPER_ADMIN whose JWT carries aud='platform'
// and never has organizationId — keep it minimal here.
export interface PlatformAdmin {
  id: string;
  email: string;
  name: string | null;
  role: 'SUPER_ADMIN';
  mfaEnabled: boolean;
}

export interface PlatformLoginRequest {
  email: string;
  password: string;
  mfaToken?: string;
}

export interface PlatformLoginResponse {
  user: PlatformAdmin;
  // Token is set as __Host-platform-token cookie by the backend; included
  // in the body too for legacy Authorization-header callers.
  token?: string;
  // When the account has MFA enrolled but no token was sent, the backend
  // returns mfaRequired:true and DOES NOT set the cookie. UI then prompts
  // for the TOTP code and re-submits.
  mfaRequired?: boolean;
}

export interface PlatformMeResponse {
  user: PlatformAdmin;
}

class PlatformAuthService {
  async login(req: PlatformLoginRequest): Promise<PlatformLoginResponse> {
    return apiClient.post('/api/platform/auth/login', req);
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/platform/auth/logout', {});
    } catch {
      // Best-effort — cookie clears on next page load anyway
    }
  }

  async getMe(): Promise<PlatformMeResponse> {
    return apiClient.get('/api/platform/auth/me');
  }
}

export const platformAuthService = new PlatformAuthService();
