/**
 * platformOps.ts — typed clients for platform-admin operational endpoints.
 *
 * Covers support sessions, allowlist CRUD, activity log read. These are
 * separate from platformAuth (login/me/logout) and platformCatalog
 * (catalog publishing) for clarity.
 */

import { apiClient } from './client';

// ── Support sessions ────────────────────────────────────────────────────────

export type SupportSessionStatus =
  | 'ACTIVE'
  | 'EXPIRED'
  | 'ENDED_BY_USER'
  | 'REVOKED';

export type SupportRole =
  | 'ORG_ADMIN'
  | 'SECURITY_OWNER'
  | 'AUDITOR'
  | 'CONTRIBUTOR'
  | 'VIEWER';

export interface SupportSession {
  id: string;
  platformAdminId: string;
  platformAdminEmail: string;
  organizationId: string;
  supportActorUserId: string;
  reason: string;
  effectiveRole: SupportRole;
  startedAt: string;
  expiresAt: string;
  endedAt: string | null;
  status: SupportSessionStatus;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface CreateSupportSessionInput {
  organizationId: string;
  reason: string;
  /** Allowed values: 900 (15m), 3600 (1h), 14400 (4h). */
  durationSeconds: 900 | 3600 | 14400;
  effectiveRole?: SupportRole;
}

export interface CreateSupportSessionResult {
  sessionId: string;
  exchangeUrl: string;
  expiresAt: string;
}

// ── Allowlist ───────────────────────────────────────────────────────────────

export interface AllowlistEntry {
  id: string;
  email: string;
  addedBy: string | null;
  addedAt: string;
  notes: string | null;
}

// ── Activity log ────────────────────────────────────────────────────────────

export interface ActivityRow {
  id: string;
  platformAdminId: string;
  action: string;
  targetType: string;
  targetId: string | null;
  targetOrgId: string | null;
  supportSessionId: string | null;
  metadataJson: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: string;
}

export interface ActivityFilters {
  platformAdminId?: string;
  action?: string;
  targetType?: string;
  targetOrgId?: string;
  supportSessionId?: string;
  limit?: number;
  cursor?: string;
}

class PlatformOpsService {
  // Support sessions
  async createSession(
    input: CreateSupportSessionInput,
  ): Promise<CreateSupportSessionResult> {
    return apiClient.post('/api/platform/support-sessions', input);
  }
  async listSessions(): Promise<{ sessions: SupportSession[] }> {
    return apiClient.get('/api/platform/support-sessions');
  }
  async endSession(id: string): Promise<{ success: true }> {
    return apiClient.post(
      `/api/platform/support-sessions/${id}/end`,
      undefined,
    );
  }

  // Allowlist
  async listAllowlist(): Promise<{ entries: AllowlistEntry[] }> {
    return apiClient.get('/api/platform/allowlist');
  }
  async addAllowlistEntry(input: {
    email: string;
    notes?: string;
  }): Promise<AllowlistEntry> {
    return apiClient.post('/api/platform/allowlist', input);
  }
  async removeAllowlistEntry(id: string): Promise<{ success: true }> {
    return apiClient.delete(`/api/platform/allowlist/${id}`);
  }

  // Activity log
  async listActivity(
    filters: ActivityFilters = {},
  ): Promise<{ rows: ActivityRow[]; nextCursor: string | null }> {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) {
      if (v != null && v !== '') params.set(k, String(v));
    }
    const qs = params.toString();
    return apiClient.get(`/api/platform/activity${qs ? `?${qs}` : ''}`);
  }
}

export const platformOpsService = new PlatformOpsService();
