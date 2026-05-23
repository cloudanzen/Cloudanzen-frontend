/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { apiClient, ApiResponse } from './client';
import {
  Risk,
  CreateRiskRequest,
  UpdateRiskRequest,
  RiskLevel,
  RiskStatus,
  RiskTreatment,
} from './types';

// ── Risk Snapshot types ───────────────────────────────────────────────────────

export type RiskSnapshotItemSource = 'prisma' | 'register';

export interface RiskSnapshotItem {
  /**
   * Which system-of-record this row came from when the snapshot was
   * captured. Optional because snapshots created before the dual-source
   * capture landed don't carry it — render those as "legacy".
   */
  source?: RiskSnapshotItemSource;
  /** The row's id in the source system. Optional for the same reason. */
  sourceId?: string;
  id: string;
  title: string;
  description: string;
  impact: string;
  likelihood: string;
  riskScore: number;
  status: string;
  assetTitle: string;
  treatments: Array<{
    controlId: string;
    isoReference: string;
    title: string;
    notes: string | null;
  }>;
}

export interface RiskSnapshotRecord {
  id: string;
  name: string;
  createdAt: string;
  createdById: string;
  sharedWithAuditor: boolean;
  riskCount: number;
  items?: RiskSnapshotItem[];
}

export class RisksService {
  // Get all risks
  async getRisks(params?: {
    page?: number;
    limit?: number;
    status?: RiskStatus;
    level?: RiskLevel;
    assetId?: string;
    search?: string;
  }): Promise<ApiResponse<Risk[]>> {
    return apiClient.get('/api/risks', params);
  }

  // Get risk by ID
  async getRisk(id: string): Promise<ApiResponse<Risk>> {
    return apiClient.get(`/api/risks/${id}`);
  }

  // Create new risk
  async createRisk(riskData: CreateRiskRequest): Promise<ApiResponse<Risk>> {
    return apiClient.post('/api/risks', riskData);
  }

  // Update risk
  async updateRisk(
    id: string,
    riskData: UpdateRiskRequest,
  ): Promise<ApiResponse<Risk>> {
    return apiClient.put(`/api/risks/${id}`, riskData);
  }

  // Delete risk
  async deleteRisk(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/risks/${id}`);
  }

  // Get risks with treatments
  async getRisksWithTreatments(): Promise<ApiResponse<Risk[]>> {
    return apiClient.get('/api/risks/with-treatments');
  }

  // Add risk treatment
  async addRiskTreatment(
    riskId: string,
    controlId: string,
    notes?: string,
  ): Promise<ApiResponse<RiskTreatment>> {
    return apiClient.post('/api/risks/treatment', {
      riskId,
      controlId,
      notes,
    });
  }

  // Update risk treatment
  async updateRiskTreatment(
    id: string,
    notes?: string,
  ): Promise<ApiResponse<RiskTreatment>> {
    return apiClient.put(`/api/risks/treatment/${id}`, { notes });
  }

  // Remove risk treatment
  async removeRiskTreatment(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/risks/treatment/${id}`);
  }

  // Get risk overview stats
  async getRisksOverview(): Promise<
    ApiResponse<{
      total: number;
      open: number;
      mitigated: number;
      accepted: number;
      transferred: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
      recentRisks: Risk[];
    }>
  > {
    return apiClient.get('/api/risks/overview');
  }

  // Get risk distribution
  async getRiskDistribution(): Promise<
    ApiResponse<
      {
        level: RiskLevel;
        count: number;
        percentage: number;
      }[]
    >
  > {
    return apiClient.get('/api/risks/distribution');
  }

  // Get risk trends
  async getRiskTrends(
    period: 'week' | 'month' | 'quarter' | 'year' = 'month',
  ): Promise<
    ApiResponse<
      {
        date: string;
        open: number;
        mitigated: number;
        accepted: number;
      }[]
    >
  > {
    return apiClient.get('/api/risks/trends', { period });
  }

  // Get high priority risks
  async getHighPriorityRisks(): Promise<ApiResponse<Risk[]>> {
    return apiClient.get('/api/risks/high-priority');
  }

  // Recalculate risk scores
  async recalculateRiskScores(): Promise<ApiResponse<void>> {
    return apiClient.post('/api/risks/recalculate');
  }

  // Export risks
  async exportRisks(format: 'csv' | 'xlsx' | 'pdf' = 'csv'): Promise<Blob> {
    const response = await fetch(
      `${apiClient.baseURL}/api/risks/export?format=${format}`,
      {
        headers: apiClient.token
          ? {
              Authorization: `Bearer ${apiClient.token}`,
            }
          : {},
      },
    );

    if (!response.ok) {
      throw new Error('Failed to export risks');
    }

    return response.blob();
  }

  // ── Snapshots ──────────────────────────────────────────────────────────────

  listSnapshots(): Promise<ApiResponse<RiskSnapshotRecord[]>> {
    return apiClient.get('/api/risks/snapshots');
  }

  /**
   * Create a snapshot. `statuses` is optional — when omitted, every risk
   * is captured. When provided, only risks whose status is in the array
   * are captured. The "Decided only" UI option sends
   * `['MITIGATED', 'ACCEPTED', 'TRANSFERRED']` (every status except
   * `OPEN`).
   */
  createSnapshot(
    name: string,
    statuses?: RiskStatus[],
  ): Promise<ApiResponse<RiskSnapshotRecord>> {
    return apiClient.post('/api/risks/snapshots', {
      name,
      ...(statuses ? { statuses } : {}),
    });
  }

  getSnapshotDetail(id: string): Promise<ApiResponse<RiskSnapshotRecord>> {
    return apiClient.get(`/api/risks/snapshots/${id}`);
  }

  toggleSnapshotShare(id: string): Promise<ApiResponse<RiskSnapshotRecord>> {
    return apiClient.patch(`/api/risks/snapshots/${id}/share`);
  }

  // Bulk risk assessment
  async bulkAssess(
    assessments: Array<{
      riskId: string;
      impact: RiskLevel;
      likelihood: RiskLevel;
    }>,
  ): Promise<
    ApiResponse<{
      updated: number;
      failed: number;
      errors?: any[];
    }>
  > {
    return apiClient.post('/api/risks/bulk-assess', { assessments });
  }
}

export const risksService = new RisksService();
