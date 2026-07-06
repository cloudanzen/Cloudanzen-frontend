/**
 * aiAgentTrails.ts — API client for AI TrustOps Agent Trails.
 *
 * Backs `/api/ai/agent-trails/*`. Sanitized execution/decision traces — not
 * raw chain-of-thought. Gated server-side on AI_GOVERNANCE + assets RBAC.
 */

import { apiClient } from './client';

export const AI_TRACE_STATUSES = [
  'OPEN',
  'COMPLETED',
  'BLOCKED',
  'FAILED',
] as const;
export type AiTraceStatus = (typeof AI_TRACE_STATUSES)[number];

export const AI_TRACE_STEP_TYPES = [
  'MESSAGE',
  'RETRIEVAL',
  'TOOL_CALL',
  'POLICY_DECISION',
  'HUMAN_APPROVAL',
  'ACTION',
] as const;
export type AiTraceStepType = (typeof AI_TRACE_STEP_TYPES)[number];

export const AI_STEP_OUTCOMES = [
  'NA',
  'ALLOWED',
  'DENIED',
  'APPROVED',
  'REJECTED',
  'COMPLETED',
  'ERROR',
] as const;
export type AiStepOutcome = (typeof AI_STEP_OUTCOMES)[number];

export interface AiTraceStep {
  id: string;
  traceId: string;
  stepIndex: number;
  stepType: AiTraceStepType;
  outcome: AiStepOutcome;
  title: string;
  summary: string | null;
  toolName: string | null;
  sensitiveDataAccessed: boolean;
  occurredAt: string;
}

export interface AiAgentTrace {
  id: string;
  aiSystemId: string | null;
  sessionRef: string;
  agentName: string;
  agentIdentity: string | null;
  userIdentity: string | null;
  model: string | null;
  provider: string | null;
  status: AiTraceStatus;
  finalAction: string | null;
  startedAt: string;
  endedAt: string | null;
  relatedRiskId: string | null;
  relatedIncidentId: string | null;
  createdAt: string;
  steps?: AiTraceStep[];
  _count?: { steps: number };
}

export interface CreateTraceInput {
  sessionRef: string;
  agentName: string;
  agentIdentity?: string;
  userIdentity?: string;
  model?: string;
  provider?: string;
  status?: AiTraceStatus;
  finalAction?: string;
}

export interface CreateStepInput {
  title: string;
  stepType?: AiTraceStepType;
  outcome?: AiStepOutcome;
  summary?: string;
  toolName?: string;
  sensitiveDataAccessed?: boolean;
}

export const aiAgentTrailsService = {
  async listTraces(): Promise<AiAgentTrace[]> {
    const res = await apiClient.get<{ success: boolean; data: AiAgentTrace[] }>(
      '/api/ai/agent-trails/traces',
    );
    return res.data;
  },
  async getTrace(id: string): Promise<AiAgentTrace> {
    const res = await apiClient.get<{ success: boolean; data: AiAgentTrace }>(
      `/api/ai/agent-trails/traces/${id}`,
    );
    return res.data;
  },
  async createTrace(input: CreateTraceInput): Promise<AiAgentTrace> {
    const res = await apiClient.post<{ success: boolean; data: AiAgentTrace }>(
      '/api/ai/agent-trails/traces',
      input,
    );
    return res.data;
  },
  async removeTrace(id: string): Promise<void> {
    await apiClient.delete(`/api/ai/agent-trails/traces/${id}`);
  },
  async addStep(traceId: string, input: CreateStepInput): Promise<AiTraceStep> {
    const res = await apiClient.post<{ success: boolean; data: AiTraceStep }>(
      `/api/ai/agent-trails/traces/${traceId}/steps`,
      input,
    );
    return res.data;
  },
  async removeStep(stepId: string): Promise<void> {
    await apiClient.delete(`/api/ai/agent-trails/steps/${stepId}`);
  },
};
