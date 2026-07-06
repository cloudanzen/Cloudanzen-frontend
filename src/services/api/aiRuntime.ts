/**
 * aiRuntime.ts — API client for the AI Runtime Risk Monitor (slice 1).
 *
 * Backs `/api/ai/runtime/*` (eval runs + findings). Gated server-side on the
 * AI_GOVERNANCE bundle + assets RBAC.
 */

import { apiClient } from './client';

export const AI_EVAL_TYPES = [
  'HALLUCINATION',
  'DRIFT',
  'PROMPT_INJECTION',
  'SAFETY',
  'QUALITY',
  'OTHER',
] as const;
export type AiEvalType = (typeof AI_EVAL_TYPES)[number];

export const AI_EVAL_STATUSES = ['PASSED', 'WARN', 'FAILED'] as const;
export type AiEvalStatus = (typeof AI_EVAL_STATUSES)[number];

export const AI_FINDING_TYPES = [
  'THRESHOLD_VIOLATION',
  'DRIFT',
  'HALLUCINATION',
  'PROMPT_INJECTION',
  'FALLBACK',
  'HUMAN_OVERRIDE',
  'OTHER',
] as const;
export type AiRuntimeFindingType = (typeof AI_FINDING_TYPES)[number];

export const AI_FINDING_SEVERITIES = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
] as const;
export type AiFindingSeverity = (typeof AI_FINDING_SEVERITIES)[number];

export type AiFindingStatus = 'OPEN' | 'RESOLVED';

export const AI_THRESHOLD_COMPARATORS = ['GT', 'GTE', 'LT', 'LTE'] as const;
export type AiThresholdComparator = (typeof AI_THRESHOLD_COMPARATORS)[number];

export const AI_MODEL_CHANGE_TYPES = [
  'DEPLOY',
  'ROLLBACK',
  'CONFIG',
  'RETRAIN',
  'OTHER',
] as const;
export type AiModelChangeType = (typeof AI_MODEL_CHANGE_TYPES)[number];

export interface AiEvalRun {
  id: string;
  aiSystemId: string | null;
  name: string;
  evalType: AiEvalType;
  status: AiEvalStatus;
  score: number | null;
  threshold: number | null;
  environment: string | null;
  notes: string | null;
  runAt: string;
  createdAt: string;
}

export interface AiRuntimeFinding {
  id: string;
  aiSystemId: string | null;
  findingType: AiRuntimeFindingType;
  severity: AiFindingSeverity;
  status: AiFindingStatus;
  title: string;
  description: string | null;
  detectedAt: string;
  resolvedAt: string | null;
  createdAt: string;
}

export interface CreateEvalRunInput {
  name: string;
  evalType?: AiEvalType;
  status?: AiEvalStatus;
  score?: number;
  threshold?: number;
  environment?: string;
  notes?: string;
}

export interface CreateFindingInput {
  title: string;
  findingType?: AiRuntimeFindingType;
  severity?: AiFindingSeverity;
  description?: string;
}

export interface AiRuntimeMetric {
  id: string;
  aiSystemId: string | null;
  metricKey: string;
  value: number;
  unit: string | null;
  environment: string | null;
  recordedAt: string;
}

export interface CreateMetricInput {
  metricKey: string;
  value: number;
  unit?: string;
  environment?: string;
}

export interface AiRiskThreshold {
  id: string;
  aiSystemId: string | null;
  metricKey: string;
  comparator: AiThresholdComparator;
  thresholdValue: number;
  severity: AiFindingSeverity;
  enabled: boolean;
  description: string | null;
}

export interface CreateThresholdInput {
  metricKey: string;
  thresholdValue: number;
  comparator?: AiThresholdComparator;
  severity?: AiFindingSeverity;
  enabled?: boolean;
  description?: string;
}

export interface AiModelVersionEvent {
  id: string;
  aiSystemId: string | null;
  modelName: string;
  fromVersion: string | null;
  toVersion: string;
  provider: string | null;
  changeType: AiModelChangeType;
  notes: string | null;
  occurredAt: string;
}

export interface CreateModelEventInput {
  modelName: string;
  toVersion: string;
  fromVersion?: string;
  provider?: string;
  changeType?: AiModelChangeType;
  notes?: string;
}

interface EvalListResponse {
  success: boolean;
  data: AiEvalRun[];
}
interface EvalSingleResponse {
  success: boolean;
  data: AiEvalRun;
}
interface FindingListResponse {
  success: boolean;
  data: AiRuntimeFinding[];
}
interface FindingSingleResponse {
  success: boolean;
  data: AiRuntimeFinding;
}

export const aiRuntimeService = {
  async listEvalRuns(): Promise<AiEvalRun[]> {
    const res = await apiClient.get<EvalListResponse>(
      '/api/ai/runtime/eval-runs',
    );
    return res.data;
  },
  async createEvalRun(input: CreateEvalRunInput): Promise<AiEvalRun> {
    const res = await apiClient.post<EvalSingleResponse>(
      '/api/ai/runtime/eval-runs',
      input,
    );
    return res.data;
  },
  async removeEvalRun(id: string): Promise<void> {
    await apiClient.delete(`/api/ai/runtime/eval-runs/${id}`);
  },
  async listFindings(): Promise<AiRuntimeFinding[]> {
    const res = await apiClient.get<FindingListResponse>(
      '/api/ai/runtime/findings',
    );
    return res.data;
  },
  async createFinding(input: CreateFindingInput): Promise<AiRuntimeFinding> {
    const res = await apiClient.post<FindingSingleResponse>(
      '/api/ai/runtime/findings',
      input,
    );
    return res.data;
  },
  async resolveFinding(id: string): Promise<void> {
    await apiClient.post(`/api/ai/runtime/findings/${id}/resolve`, {});
  },
  async removeFinding(id: string): Promise<void> {
    await apiClient.delete(`/api/ai/runtime/findings/${id}`);
  },
  // Metrics
  async listMetrics(): Promise<AiRuntimeMetric[]> {
    const res = await apiClient.get<{
      success: boolean;
      data: AiRuntimeMetric[];
    }>('/api/ai/runtime/metrics');
    return res.data;
  },
  async createMetric(
    input: CreateMetricInput,
  ): Promise<{ metric: AiRuntimeMetric; findingsCreated: number }> {
    const res = await apiClient.post<{
      success: boolean;
      data: AiRuntimeMetric;
      findingsCreated: number;
    }>('/api/ai/runtime/metrics', input);
    return { metric: res.data, findingsCreated: res.findingsCreated };
  },
  async removeMetric(id: string): Promise<void> {
    await apiClient.delete(`/api/ai/runtime/metrics/${id}`);
  },
  // Thresholds
  async listThresholds(): Promise<AiRiskThreshold[]> {
    const res = await apiClient.get<{
      success: boolean;
      data: AiRiskThreshold[];
    }>('/api/ai/runtime/thresholds');
    return res.data;
  },
  async createThreshold(input: CreateThresholdInput): Promise<AiRiskThreshold> {
    const res = await apiClient.post<{
      success: boolean;
      data: AiRiskThreshold;
    }>('/api/ai/runtime/thresholds', input);
    return res.data;
  },
  async updateThreshold(
    id: string,
    input: Partial<CreateThresholdInput>,
  ): Promise<void> {
    await apiClient.patch(`/api/ai/runtime/thresholds/${id}`, input);
  },
  async removeThreshold(id: string): Promise<void> {
    await apiClient.delete(`/api/ai/runtime/thresholds/${id}`);
  },
  // Model version events
  async listModelEvents(): Promise<AiModelVersionEvent[]> {
    const res = await apiClient.get<{
      success: boolean;
      data: AiModelVersionEvent[];
    }>('/api/ai/runtime/model-events');
    return res.data;
  },
  async createModelEvent(
    input: CreateModelEventInput,
  ): Promise<AiModelVersionEvent> {
    const res = await apiClient.post<{
      success: boolean;
      data: AiModelVersionEvent;
    }>('/api/ai/runtime/model-events', input);
    return res.data;
  },
  async removeModelEvent(id: string): Promise<void> {
    await apiClient.delete(`/api/ai/runtime/model-events/${id}`);
  },
};
