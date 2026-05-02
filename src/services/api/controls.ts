import { apiClient, ApiResponse, API_BASE_URL } from './client';
import { getAuthToken } from '@/services/authStorage';
import {
  Control,
  CreateControlRequest,
  UpdateControlRequest,
  ControlStatus,
  Evidence,
} from './types';

export interface ControlEffectivenessSnapshot {
  controlId: string;
  effectivenessScore: number;
  passRate: number | null;
  coverageRatio: number | null;
  daysSinceLastPass: number | null;
  slaBreached: boolean;
}

export class ControlsService {
  // Get all controls (authenticated)
  async getControls(params?: {
    page?: number;
    limit?: number;
    status?: ControlStatus;
    search?: string;
    isoReference?: string;
    frameworkSlugs?: string[];
  }): Promise<ApiResponse<Control[]> & { pagination?: { page: number; limit: number; total: number; totalPages: number } }> {
    // Build clean params - omit undefined/empty values
    const cleanParams: Record<string, string> = {};
    if (params) {
      if (params.search) cleanParams.search = params.search;
      if (params.status) cleanParams.status = params.status;
      if (params.isoReference) cleanParams.isoReference = params.isoReference;
      if (params.frameworkSlugs?.length)
        cleanParams.frameworkSlugs = params.frameworkSlugs.join(',');
      if (params.page !== undefined) cleanParams.page = String(params.page);
      if (params.limit !== undefined) cleanParams.limit = String(params.limit);
    }
    return apiClient.get(
      '/api/controls',
      Object.keys(cleanParams).length ? cleanParams : undefined,
    );
  }

  // Get control by ID
  async getControl(id: string): Promise<ApiResponse<Control>> {
    return apiClient.get(`/api/controls/${id}`);
  }

  // Create new control
  async createControl(
    controlData: CreateControlRequest,
  ): Promise<ApiResponse<Control>> {
    return apiClient.post('/api/controls', controlData);
  }

  // Update control
  async updateControl(
    id: string,
    controlData: UpdateControlRequest,
  ): Promise<ApiResponse<Control>> {
    return apiClient.put(`/api/controls/${id}`, controlData);
  }

  // Delete control
  async deleteControl(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/controls/${id}`);
  }

  // Get control compliance status
  async getControlCompliance(): Promise<
    ApiResponse<{
      total: number;
      implemented: number;
      partiallyImplemented: number;
      notImplemented: number;
      compliancePercentage: number;
    }>
  > {
    return apiClient.get('/api/controls/compliance');
  }

  // Add evidence to control
  async addEvidence(
    controlId: string,
    evidenceData: {
      type: string;
      fileName?: string;
      fileUrl?: string;
      automated?: boolean;
    },
  ): Promise<ApiResponse<Evidence>> {
    return apiClient.post(`/api/controls/${controlId}/evidence`, evidenceData);
  }

  // Remove evidence from control
  async removeEvidence(
    controlId: string,
    evidenceId: string,
  ): Promise<ApiResponse<void>> {
    return apiClient.delete(
      `/api/controls/${controlId}/evidence/${evidenceId}`,
    );
  }

  // ── Phase 7.1 — Control effectiveness scoring ──────────────────────────────

  /** Returns the latest effectiveness snapshot for every control in the org. */
  async getEffectivenessScores(): Promise<
    ApiResponse<ControlEffectivenessSnapshot[]>
  > {
    return apiClient.get('/api/controls/effectiveness');
  }

  /** Trigger a recompute of effectiveness scores for the entire org. */
  async computeEffectivenessScores(opts?: {
    windowDays?: number;
    slaDays?: number;
  }): Promise<ApiResponse<ControlEffectivenessSnapshot[]>> {
    const qs = new URLSearchParams();
    if (opts?.windowDays) qs.set('windowDays', String(opts.windowDays));
    if (opts?.slaDays) qs.set('slaDays', String(opts.slaDays));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return apiClient.post(`/api/controls/effectiveness/compute${suffix}`, {});
  }

  /** Returns the effectiveness snapshot history for a single control. */
  async getEffectivenessHistory(
    controlId: string,
    days = 90,
  ): Promise<ApiResponse<ControlEffectivenessSnapshot[]>> {
    return apiClient.get(`/api/controls/${controlId}/effectiveness/history`, {
      days: String(days),
    });
  }

  // Export controls
  async exportControls(format: 'csv' | 'xlsx' | 'pdf' = 'csv'): Promise<Blob> {
    const token = getAuthToken();
    const baseURL = API_BASE_URL;
    const response = await fetch(
      `${baseURL}/api/controls/export?format=${format}`,
      {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );

    if (!response.ok) {
      throw new Error('Failed to export controls');
    }

    return response.blob();
  }
}

export const controlsService = new ControlsService();
