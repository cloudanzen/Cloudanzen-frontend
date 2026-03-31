import { apiClient } from './client';

// ── Types ───────────────────────────────────────────────────────────────────

export interface AccessService {
  id: string;
  organizationId: string;
  serviceName: string;
  serviceType: 'integrated' | 'manual';
  providerCode: string | null;
  evidenceFileUrl: string | null;
  evidenceFileName: string | null;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AccessAccount {
  id: string;
  organizationId: string;
  serviceId: string;
  externalAccountId: string;
  accountName: string;
  accountEmail: string | null;
  role: string | null;
  status: 'active' | 'deactivated';
  mfaEnabled: boolean | null;
  accountType: 'user' | 'service_account' | 'external_user';
  mappedUserId: string | null;
  metadataJson: Record<string, unknown>;
  lastObservedAt: string;
  createdAt: string;
  updatedAt: string;
  serviceName?: string;
  serviceType?: string;
  providerCode?: string | null;
}

export interface AccountStats {
  total: number;
  mapped: number;
  unmapped: number;
  serviceAccounts: number;
  byService: Array<{ serviceName: string; serviceType: string; count: number }>;
}

export interface SyncResult {
  service: string;
  accountsSynced: number;
  error?: string;
}

export interface AccessReviewCampaign {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  scopeServiceIds: string[];
  reviewerUserIds: string[];
  deadline: string | null;
  cadence: string | null;
  nextReviewAt: string | null;
  completedAt: string | null;
  evidenceFileUrl: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  progress?: CampaignProgress;
}

export interface CampaignProgress {
  total: number;
  reviewed: number;
  accepted: number;
  revoked: number;
  pending: number;
}

export interface AccessReviewItem {
  id: string;
  campaignId: string;
  accountId: string;
  snapshotServiceName: string;
  snapshotAccountName: string;
  snapshotAccountEmail: string | null;
  snapshotRole: string | null;
  snapshotStatus: string | null;
  snapshotMappedUserId: string | null;
  decision: 'accept' | 'revoke' | null;
  reviewerUserId: string | null;
  reviewedAt: string | null;
  notes: string | null;
}

// ── API service ─────────────────────────────────────────────────────────────

const BASE = '/api/access-management';

export const accessManagementService = {
  // Accounts
  listAccounts(params?: Record<string, string | number | undefined>) {
    return apiClient.get<{ rows: AccessAccount[]; total: number }>(`${BASE}/accounts`, params);
  },
  getStats() {
    return apiClient.get<AccountStats>(`${BASE}/accounts/stats`);
  },
  mapAccount(accountId: string, userId: string | null) {
    return apiClient.put(`${BASE}/accounts/${accountId}/map`, { userId });
  },
  updateAccountType(accountId: string, accountType: string) {
    return apiClient.put(`${BASE}/accounts/${accountId}/type`, { accountType });
  },
  sync() {
    return apiClient.post<{ results: SyncResult[] }>(`${BASE}/sync`);
  },
  getExportUrl() {
    return `${apiClient.baseURL}${BASE}/accounts/export`;
  },

  // Services
  listServices() {
    return apiClient.get<AccessService[]>(`${BASE}/services`);
  },
  createService(serviceName: string) {
    return apiClient.post<AccessService>(`${BASE}/services`, { serviceName });
  },
  deleteService(serviceId: string) {
    return apiClient.delete(`${BASE}/services/${serviceId}`);
  },
  async uploadCsv(serviceId: string, csvFile: File, evidenceFile?: File) {
    const form = new FormData();
    form.append('csv', csvFile);
    if (evidenceFile) form.append('evidence', evidenceFile);

    const url = `${apiClient.baseURL}${BASE}/services/${serviceId}/upload`;
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: apiClient.token
        ? { Authorization: `Bearer ${apiClient.token}` }
        : undefined,
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error ?? 'Upload failed');
    }
    return res.json() as Promise<{
      accountsImported: number;
      parseErrors: string[];
      evidenceUploaded: boolean;
    }>;
  },
  async scanImage(serviceId: string, imageFile: File) {
    const form = new FormData();
    form.append('image', imageFile);

    const url = `${apiClient.baseURL}${BASE}/services/${serviceId}/scan-image`;
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: apiClient.token
        ? { Authorization: `Bearer ${apiClient.token}` }
        : undefined,
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Scan failed' }));
      throw new Error(err.error ?? 'Image scan failed');
    }
    return res.json() as Promise<{
      accountsImported: number;
      accounts: Array<{
        externalAccountId: string;
        accountName: string;
        accountEmail: string | null;
        role: string | null;
        status: string;
      }>;
      provider: string;
      evidenceUploaded: boolean;
    }>;
  },
  async scanImagePreview(imageFile: File) {
    const form = new FormData();
    form.append('image', imageFile);

    const url = `${apiClient.baseURL}${BASE}/scan-image-preview`;
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: apiClient.token
        ? { Authorization: `Bearer ${apiClient.token}` }
        : undefined,
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Scan failed' }));
      throw new Error(err.error ?? 'Image scan failed');
    }
    return res.json() as Promise<{
      accounts: Array<{
        externalAccountId: string;
        accountName: string;
        accountEmail: string | null;
        role: string | null;
        status: string;
      }>;
      provider: string;
      error: string | null;
    }>;
  },

  // Campaigns
  listCampaigns(status?: string) {
    return apiClient.get<AccessReviewCampaign[]>(`${BASE}/campaigns`, { status });
  },
  getCampaign(id: string) {
    return apiClient.get<AccessReviewCampaign>(`${BASE}/campaigns/${id}`);
  },
  createCampaign(data: {
    name: string;
    description?: string;
    scopeServiceIds: string[];
    reviewerUserIds: string[];
    deadline?: string;
    cadence?: string;
  }) {
    return apiClient.post<AccessReviewCampaign>(`${BASE}/campaigns`, data);
  },
  launchCampaign(id: string) {
    return apiClient.post<{ launched: boolean; snapshotCount: number }>(
      `${BASE}/campaigns/${id}/launch`,
    );
  },
  listReviewItems(campaignId: string, params?: Record<string, string | number | undefined>) {
    return apiClient.get<{ rows: AccessReviewItem[]; total: number }>(
      `${BASE}/campaigns/${campaignId}/items`,
      params,
    );
  },
  reviewItem(campaignId: string, itemId: string, decision: 'accept' | 'revoke', notes?: string) {
    return apiClient.put(`${BASE}/campaigns/${campaignId}/items/${itemId}/review`, {
      decision,
      notes,
    });
  },
  completeCampaign(id: string) {
    return apiClient.post<{ completed: boolean; nextReviewAt: string | null }>(
      `${BASE}/campaigns/${id}/complete`,
    );
  },
  getReportUrl(campaignId: string) {
    return `${apiClient.baseURL}${BASE}/campaigns/${campaignId}/report`;
  },
};
