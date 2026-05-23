import { apiClient } from './client';

export interface PlatformHealthPayload {
  orgs: { total: number };
  frameworks: { activated: number | null; pendingRequests: number | null };
  integrations: {
    healthy: number;
    failing: number;
    failingByProvider: Record<string, number>;
  };
  jobs: {
    queueDepth: { scan: number; compliance: number; riskEvaluation: number };
    dlqDepth: { scan: number; compliance: number; riskEvaluation: number };
  };
  supportSessions: { activeNow: number; openedLast24h: number };
  recentIncidents: Array<{
    ts: string;
    platformAdminId: string;
    action: string;
    targetType: string;
    targetId: string | null;
  }>;
  generatedAt: string;
}

class PlatformHealthService {
  async get(opts?: { force?: boolean }): Promise<PlatformHealthPayload> {
    const path = opts?.force
      ? '/api/platform/health?force=1'
      : '/api/platform/health';
    return apiClient.get<PlatformHealthPayload>(path);
  }
}

export const platformHealthService = new PlatformHealthService();
