/**
 * aiSystems.ts — API client for the AI Systems Registry (Phase 4 slice 1).
 *
 * Backs `/api/ai/systems` CRUD. Gated server-side on the AI_GOVERNANCE
 * bundle + assets RBAC. The registry is the first real AI TrustOps system
 * of record and feeds the AI Trust Dashboard `aiSystems` card.
 */

import { apiClient } from './client';

export const AI_LIFECYCLE_STAGES = [
  'PROPOSED',
  'DEVELOPMENT',
  'PILOT',
  'PRODUCTION',
  'RETIRED',
] as const;
export type AiLifecycleStage = (typeof AI_LIFECYCLE_STAGES)[number];

export const AI_RISK_TIERS = [
  'MINIMAL',
  'LIMITED',
  'HIGH',
  'UNACCEPTABLE',
] as const;
export type AiRiskTier = (typeof AI_RISK_TIERS)[number];

export const AI_HUMAN_OVERSIGHTS = [
  'NONE',
  'HUMAN_IN_LOOP',
  'HUMAN_ON_LOOP',
  'HUMAN_OVER_LOOP',
] as const;
export type AiHumanOversight = (typeof AI_HUMAN_OVERSIGHTS)[number];

export const AI_DATA_EXPOSURES = [
  'NONE',
  'INTERNAL',
  'CUSTOMER_PII',
  'SENSITIVE',
] as const;
export type AiDataExposure = (typeof AI_DATA_EXPOSURES)[number];

export const AI_USE_CASE_STATUSES = [
  'PROPOSED',
  'APPROVED',
  'REJECTED',
  'RETIRED',
] as const;
export type AiUseCaseStatus = (typeof AI_USE_CASE_STATUSES)[number];

export interface AiUseCase {
  id: string;
  aiSystemId: string;
  name: string;
  description: string | null;
  purpose: string | null;
  riskTier: AiRiskTier;
  status: AiUseCaseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AiSystem {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  productArea: string | null;
  ownerUserId: string | null;
  lifecycleStage: AiLifecycleStage;
  customerFacing: boolean;
  customerDataExposure: AiDataExposure;
  dataClasses: string[];
  modelProvider: string | null;
  fineTuned: boolean;
  ragUsage: boolean;
  humanOversight: AiHumanOversight;
  riskTier: AiRiskTier;
  source: string | null;
  externalId: string | null;
  schemaVersion: string | null;
  createdAt: string;
  updatedAt: string;
  useCases?: AiUseCase[];
}

export interface CreateAiSystemInput {
  name: string;
  description?: string;
  productArea?: string;
  lifecycleStage?: AiLifecycleStage;
  customerFacing?: boolean;
  customerDataExposure?: AiDataExposure;
  dataClasses?: string[];
  modelProvider?: string;
  fineTuned?: boolean;
  ragUsage?: boolean;
  humanOversight?: AiHumanOversight;
  riskTier?: AiRiskTier;
}

export type UpdateAiSystemInput = Partial<CreateAiSystemInput>;

interface ListResponse {
  success: boolean;
  data: AiSystem[];
}
interface SingleResponse {
  success: boolean;
  data: AiSystem;
}

export const aiSystemsService = {
  async list(): Promise<AiSystem[]> {
    const res = await apiClient.get<ListResponse>('/api/ai/systems');
    return res.data;
  },
  async get(id: string): Promise<AiSystem> {
    const res = await apiClient.get<SingleResponse>(`/api/ai/systems/${id}`);
    return res.data;
  },
  async create(input: CreateAiSystemInput): Promise<AiSystem> {
    const res = await apiClient.post<SingleResponse>('/api/ai/systems', input);
    return res.data;
  },
  async update(id: string, input: UpdateAiSystemInput): Promise<AiSystem> {
    const res = await apiClient.patch<SingleResponse>(
      `/api/ai/systems/${id}`,
      input,
    );
    return res.data;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/api/ai/systems/${id}`);
  },
};
