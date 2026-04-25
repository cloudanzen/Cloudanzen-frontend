/**
 * dashboard.ts — single-roundtrip aggregator for the HomePage.
 *
 * Replaces the seven-call fan-out by hitting GET /api/dashboard/summary.
 * The server fans out the seven section loaders in parallel; each section
 * carries either a `data` payload or an `error` string so a single broken
 * downstream cannot blank the page.
 */
import { apiClient } from './client';
import type { FrameworkReadinessDto } from './frameworks';

// Mirrors the backend src/modules/dashboard/loaders.ts payload shapes.

export interface DashboardComplianceSection {
  total: number;
  implemented: number;
  partiallyImplemented: number;
  notImplemented: number;
  compliancePercentage: number;
}

export interface DashboardRiskOverviewSection {
  total: number;
  open: number;
  monitoring: number;
  closed: number;
  statusBreakdown: Array<{ label: string; count: number }>;
  categoryBreakdown: Array<{ label: string; count: number }>;
  severityBreakdown: Array<{ label: string; count: number }>;
  sourceBreakdown: Array<{ label: string; count: number }>;
  recentEntries: unknown[];
}

export interface DashboardTestsSection {
  total: number;
  completed: number;
  passPercentage: number;
  overdue: number;
  dueSoon: number;
}

export interface DashboardPolicyStatsSection {
  total: number;
  published: number;
  draft: number;
  review: number;
}

export interface DashboardDocumentStatsSection {
  total: number;
  pending: number;
  current: number;
  needsReview: number;
  expired: number;
}

export interface DashboardVendorStatsSection {
  total: number;
  needAttention: number;
}

export interface DashboardSection<T> {
  data?: T;
  error?: string;
}

export interface DashboardSummary {
  success: boolean;
  sections: {
    compliance: DashboardSection<DashboardComplianceSection>;
    risks: DashboardSection<DashboardRiskOverviewSection>;
    frameworks: DashboardSection<FrameworkReadinessDto[]>;
    tests: DashboardSection<DashboardTestsSection>;
    policies: DashboardSection<DashboardPolicyStatsSection>;
    documents: DashboardSection<DashboardDocumentStatsSection>;
    vendors: DashboardSection<DashboardVendorStatsSection>;
  };
}

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    return apiClient.get<DashboardSummary>('/api/dashboard/summary');
  },
};
