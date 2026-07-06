/**
 * aiTrust.ts — API client for the AI TrustOps dashboard (Phase 3).
 *
 * Backs `GET /api/ai/trust/dashboard`. The endpoint is gated on the
 * AI_GOVERNANCE bundle server-side; a 403 here means the org is not
 * AI-native / did not opt in during onboarding.
 */

import { apiClient } from './client';

export type CardStatus = 'ok' | 'empty' | 'coming_soon';

export type CardTone = 'positive' | 'warning' | 'critical' | 'neutral';

export interface DashboardCard {
  value: number | null;
  status: CardStatus;
  proxy?: boolean;
  // Status-style cards (e.g. latest eval PASS/FAIL) carry a label + tone
  // instead of a numeric value.
  label?: string;
  tone?: CardTone;
}

export interface ChecklistItem {
  key: string;
  label: string;
  done: boolean;
  weight: number;
  comingSoon: boolean;
  href: string;
}

export interface TrustDashboard {
  readinessScore: number;
  cards: Record<string, DashboardCard>;
  checklist: ChecklistItem[];
}

interface DashboardResponse {
  success: boolean;
  data: TrustDashboard;
}

export const aiTrustService = {
  async getDashboard(): Promise<TrustDashboard> {
    const res = await apiClient.get<DashboardResponse>(
      '/api/ai/trust/dashboard',
    );
    return res.data;
  },
};
