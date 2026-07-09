/**
 * aiRag.ts — API client for AI TrustOps RAG + Data Pipeline Audit.
 *
 * Backs `/api/ai/rag/*` (sources + data-hygiene findings). Gated server-side
 * on AI_GOVERNANCE + assets RBAC.
 */

import { apiClient } from './client';

export const AI_RAG_SOURCE_TYPES = [
  'DOCUMENT',
  'DATABASE',
  'WEBSITE',
  'API',
  'OBJECT_STORE',
  'OTHER',
] as const;
export type AiRagSourceType = (typeof AI_RAG_SOURCE_TYPES)[number];

export const AI_DATA_EXPOSURES = [
  'NONE',
  'INTERNAL',
  'CUSTOMER_PII',
  'SENSITIVE',
] as const;
export type AiDataExposure = (typeof AI_DATA_EXPOSURES)[number];

export const AI_LICENSE_STATUSES = [
  'UNKNOWN',
  'LICENSED',
  'PROPRIETARY',
  'OPEN_SOURCE',
  'RESTRICTED',
] as const;
export type AiLicenseStatus = (typeof AI_LICENSE_STATUSES)[number];

export const AI_PII_SCAN_STATUSES = [
  'NOT_SCANNED',
  'CLEAN',
  'PII_FOUND',
  'SECRETS_FOUND',
] as const;
export type AiPiiScanStatus = (typeof AI_PII_SCAN_STATUSES)[number];

export const AI_RETENTION_STATUSES = [
  'UNKNOWN',
  'RETAINED',
  'SCHEDULED_DELETE',
  'DELETED',
] as const;
export type AiRetentionStatus = (typeof AI_RETENTION_STATUSES)[number];

export const AI_HYGIENE_FINDING_TYPES = [
  'PII_EXPOSURE',
  'SECRETS',
  'LICENSE_VIOLATION',
  'DATA_POISONING',
  'IP_LEAKAGE',
  'RETENTION',
  'OTHER',
] as const;
export type AiHygieneFindingType = (typeof AI_HYGIENE_FINDING_TYPES)[number];

export const AI_FINDING_SEVERITIES = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
] as const;
export type AiFindingSeverity = (typeof AI_FINDING_SEVERITIES)[number];

export type AiFindingStatus = 'OPEN' | 'RESOLVED';

export interface AiRagSource {
  id: string;
  aiSystemId: string | null;
  name: string;
  sourceType: AiRagSourceType;
  uri: string | null;
  pipelineName: string | null;
  owner: string | null;
  dataClass: AiDataExposure;
  licenseStatus: AiLicenseStatus;
  piiScanStatus: AiPiiScanStatus;
  retentionStatus: AiRetentionStatus;
  lastScannedAt: string | null;
  createdAt: string;
  _count?: { findings: number };
}

export interface AiDataHygieneFinding {
  id: string;
  ragSourceId: string | null;
  aiSystemId: string | null;
  findingType: AiHygieneFindingType;
  severity: AiFindingSeverity;
  status: AiFindingStatus;
  title: string;
  description: string | null;
  detectedAt: string;
  resolvedAt: string | null;
}

export interface CreateSourceInput {
  name: string;
  sourceType?: AiRagSourceType;
  uri?: string;
  pipelineName?: string;
  owner?: string;
  dataClass?: AiDataExposure;
  licenseStatus?: AiLicenseStatus;
  piiScanStatus?: AiPiiScanStatus;
  retentionStatus?: AiRetentionStatus;
}

export interface CreateHygieneFindingInput {
  title: string;
  ragSourceId?: string;
  findingType?: AiHygieneFindingType;
  severity?: AiFindingSeverity;
  description?: string;
}

export const aiRagService = {
  async listSources(): Promise<AiRagSource[]> {
    const res = await apiClient.get<{ success: boolean; data: AiRagSource[] }>(
      '/api/ai/rag/sources',
    );
    return res.data;
  },
  async createSource(input: CreateSourceInput): Promise<AiRagSource> {
    const res = await apiClient.post<{ success: boolean; data: AiRagSource }>(
      '/api/ai/rag/sources',
      input,
    );
    return res.data;
  },
  async updateSource(
    id: string,
    input: Partial<CreateSourceInput>,
  ): Promise<AiRagSource> {
    const res = await apiClient.patch<{ success: boolean; data: AiRagSource }>(
      `/api/ai/rag/sources/${id}`,
      input,
    );
    return res.data;
  },
  async removeSource(id: string): Promise<void> {
    await apiClient.delete(`/api/ai/rag/sources/${id}`);
  },
  async listFindings(): Promise<AiDataHygieneFinding[]> {
    const res = await apiClient.get<{
      success: boolean;
      data: AiDataHygieneFinding[];
    }>('/api/ai/rag/findings');
    return res.data;
  },
  async createFinding(
    input: CreateHygieneFindingInput,
  ): Promise<AiDataHygieneFinding> {
    const res = await apiClient.post<{
      success: boolean;
      data: AiDataHygieneFinding;
    }>('/api/ai/rag/findings', input);
    return res.data;
  },
  async resolveFinding(id: string): Promise<void> {
    await apiClient.post(`/api/ai/rag/findings/${id}/resolve`, {});
  },
  async removeFinding(id: string): Promise<void> {
    await apiClient.delete(`/api/ai/rag/findings/${id}`);
  },
};
