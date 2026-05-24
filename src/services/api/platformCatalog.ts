import { apiClient } from './client';

export type DraftKind = 'control' | 'test' | 'policy' | 'mapping';
export type ChangeKind = 'CREATE' | 'UPDATE' | 'RETIRE';
export type BatchStatus = 'OPEN' | 'PUBLISHED' | 'DISCARDED';

export interface DraftBatch {
  id: string;
  platformAdminId: string;
  name: string;
  description: string | null;
  scopeTypes: DraftKind[];
  status: BatchStatus;
  publishedInVersion: number | null;
  conflictReport: unknown | null;
  createdAt: string;
  updatedAt: string;
}

export interface Draft {
  id: string;
  batchId: string;
  proposalJson: Record<string, unknown>;
  changeKind: ChangeKind;
  createdAt: string;
  updatedAt: string;
  // per-kind FK columns; one of these is populated
  controlTemplateId?: string | null;
  testTemplateId?: string | null;
  policyTemplateId?: string | null;
}

export interface DraftBatchDetail extends DraftBatch {
  controlDrafts: Draft[];
  testDrafts: Draft[];
  policyDrafts: Draft[];
  mappingDrafts: Draft[];
}

export interface CatalogVersion {
  id: string;
  version: number;
  batchId: string;
  publishedBy: string;
  publishedAt: string;
  summary: string;
  manifestJson: {
    control: { created: number; updated: number; retired: number };
    test: { created: number; updated: number; retired: number };
    policy: { created: number; updated: number; retired: number };
    mapping: { created: number; updated: number; retired: number };
  };
}

export interface ApplyStatus {
  pending: number;
  applied: number;
  failed: number;
  recentErrors: Array<{ draftId: string; lastError: string }>;
}

export interface ConflictSummary {
  conflictingBatchId: string;
  conflictingBatchName: string;
  conflictingTemplateIds: Array<{ kind: DraftKind; id: string }>;
}

class PlatformCatalogService {
  // Batches
  async createBatch(input: {
    name: string;
    description?: string;
    scopeTypes: DraftKind[];
  }): Promise<DraftBatch> {
    return apiClient.post('/api/platform/catalog/batches', input);
  }

  async listBatches(status?: BatchStatus): Promise<{ batches: DraftBatch[] }> {
    const path = status
      ? `/api/platform/catalog/batches?status=${status}`
      : '/api/platform/catalog/batches';
    return apiClient.get(path);
  }

  async getBatch(id: string): Promise<DraftBatchDetail> {
    return apiClient.get(`/api/platform/catalog/batches/${id}`);
  }

  async patchBatch(
    id: string,
    input: { name?: string; description?: string | null; status?: 'DISCARDED' },
  ): Promise<DraftBatch> {
    return apiClient.patch(`/api/platform/catalog/batches/${id}`, input);
  }

  // Drafts (per-kind)
  async createDraft(
    batchId: string,
    kind: DraftKind,
    input: {
      proposalJson: Record<string, unknown>;
      changeKind: ChangeKind;
      templateId?: string;
    },
  ): Promise<Draft> {
    return apiClient.post(
      `/api/platform/catalog/batches/${batchId}/${kind}-drafts`,
      input,
    );
  }

  async patchDraft(
    batchId: string,
    kind: DraftKind,
    draftId: string,
    input: {
      proposalJson?: Record<string, unknown>;
      changeKind?: ChangeKind;
    },
  ): Promise<Draft> {
    return apiClient.patch(
      `/api/platform/catalog/batches/${batchId}/${kind}-drafts/${draftId}`,
      input,
    );
  }

  async deleteDraft(
    batchId: string,
    kind: DraftKind,
    draftId: string,
  ): Promise<{ success: true }> {
    return apiClient.delete(
      `/api/platform/catalog/batches/${batchId}/${kind}-drafts/${draftId}`,
    );
  }

  // Publish + status
  async publishBatch(id: string): Promise<{
    batch: DraftBatch;
    version: CatalogVersion;
    outboxRows: number;
  }> {
    return apiClient.post(
      `/api/platform/catalog/batches/${id}/publish`,
      undefined,
    );
  }

  async listVersions(): Promise<{ versions: CatalogVersion[] }> {
    return apiClient.get('/api/platform/catalog/versions');
  }

  async getApplyStatus(versionId: string): Promise<ApplyStatus> {
    return apiClient.get(
      `/api/platform/catalog/versions/${versionId}/apply-status`,
    );
  }
}

export const platformCatalogService = new PlatformCatalogService();
