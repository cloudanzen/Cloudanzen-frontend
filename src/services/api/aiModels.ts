/**
 * aiModels.ts — API client for the AI Model registry (T-103).
 *
 * Backs the `/api/ai/models` REST endpoints landed in PR 7. The
 * registry is the source of truth for production AI systems and feeds
 * the `ai-model-registry` evaluator (model card present, last
 * reviewed within 12 months).
 */

import { apiClient } from './client';

export const AI_MODEL_CLASSIFICATIONS = [
  'DEVELOPMENT',
  'TESTING',
  'PRODUCTION',
  'RETIRED',
] as const;

export type AiModelClassification = (typeof AI_MODEL_CLASSIFICATIONS)[number];

export interface AiModel {
  id: string;
  organizationId: string;
  name: string;
  vendor: string | null;
  version: string | null;
  classification: AiModelClassification;
  ownerUserId: string | null;
  modelCardDocumentId: string | null;
  lastReviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAiModelInput {
  name: string;
  vendor?: string;
  version?: string;
  classification?: AiModelClassification;
  ownerUserId?: string;
  modelCardDocumentId?: string;
  lastReviewedAt?: string;
}

export type UpdateAiModelInput = Partial<CreateAiModelInput>;

interface ListResponse {
  success: boolean;
  data: AiModel[];
}

interface SingleResponse {
  success: boolean;
  data: AiModel;
}

export const aiModelsService = {
  async list(): Promise<AiModel[]> {
    const res = await apiClient.get<ListResponse>('/api/ai/models');
    return res.data;
  },
  async get(id: string): Promise<AiModel> {
    const res = await apiClient.get<SingleResponse>(`/api/ai/models/${id}`);
    return res.data;
  },
  async create(input: CreateAiModelInput): Promise<AiModel> {
    const res = await apiClient.post<SingleResponse>('/api/ai/models', input);
    return res.data;
  },
  async update(id: string, input: UpdateAiModelInput): Promise<AiModel> {
    const res = await apiClient.patch<SingleResponse>(
      `/api/ai/models/${id}`,
      input,
    );
    return res.data;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/api/ai/models/${id}`);
  },
};
