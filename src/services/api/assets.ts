/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { apiClient, ApiResponse } from './client';
import { Asset, AssetChangeLogEntry, AssetCoverage, AssetDetail, AssetMergeGroup, AssetReview, AssetReviewQueue, AssetSavedView, AssetSettings, CreateAssetRequest, AssetType } from './types';

type UpdateAssetRequest = Partial<CreateAssetRequest>;

export class AssetsService {
  // Get all assets
  async getAssets(params?: {
    page?: number;
    limit?: number;
    type?: string;
    criticality?: string;
    search?: string;
    category?: string;
    subtype?: string;
    provider?: string;
    isStale?: boolean;
    status?: string;
      managedBy?: string;
      recentDays?: number;
      unclassified?: boolean;
      withoutControls?: boolean;
      ownerless?: boolean;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<Asset[]> & { pagination?: { total: number; page: number; limit: number; totalPages: number } }> {
    return apiClient.get('/api/assets', params);
  }

  // Get asset by ID
  async getAsset(id: string): Promise<ApiResponse<Asset>> {
    return apiClient.get(`/api/assets/${id}`);
  }

  async getAssetDetail(id: string): Promise<ApiResponse<AssetDetail>> {
    return apiClient.get(`/api/assets/${id}/detail`);
  }

  async getAssetChangelog(
    id: string,
    params?: { page?: number; limit?: number },
  ): Promise<ApiResponse<AssetChangeLogEntry[]> & { pagination?: { total: number; page: number; limit: number; totalPages: number } }> {
    return apiClient.get(`/api/assets/${id}/changelog`, params);
  }

  async getCoverage(): Promise<ApiResponse<AssetCoverage>> {
    return apiClient.get('/api/assets/coverage');
  }

  async getMergeGroups(reviewStatus?: string): Promise<ApiResponse<AssetMergeGroup[]>> {
    return apiClient.get('/api/assets/merge-groups', reviewStatus ? { reviewStatus } : undefined);
  }

  async getReviewQueues(): Promise<ApiResponse<AssetReviewQueue[]>> {
    return apiClient.get('/api/assets/review-queues');
  }

  async getSavedViews(): Promise<ApiResponse<AssetSavedView[]>> {
    return apiClient.get('/api/assets/saved-views');
  }

  async getSettings(): Promise<ApiResponse<AssetSettings>> {
    return apiClient.get('/api/assets/settings');
  }

  async updateSettings(data: AssetSettings): Promise<ApiResponse<AssetSettings>> {
    return apiClient.put('/api/assets/settings', data);
  }

  async createSavedView(data: {
    name: string;
    description?: string;
    filters: Record<string, string | number | boolean | null>;
    sharedWithTeam?: boolean;
  }): Promise<ApiResponse<AssetSavedView>> {
    return apiClient.post('/api/assets/saved-views', data);
  }

  async updateSavedView(viewId: string, data: {
    name: string;
    description?: string;
    filters: Record<string, string | number | boolean | null>;
    sharedWithTeam?: boolean;
  }): Promise<ApiResponse<AssetSavedView>> {
    return apiClient.put(`/api/assets/saved-views/${viewId}`, data);
  }

  async deleteSavedView(viewId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/assets/saved-views/${viewId}`);
  }

  async getAssetReviews(
    id: string,
    params?: { page?: number; limit?: number },
  ): Promise<ApiResponse<AssetReview[]> & { pagination?: { total: number; page: number; limit: number; totalPages: number } }> {
    return apiClient.get(`/api/assets/${id}/reviews`, params);
  }

  async createAssetReview(
    id: string,
    data: { reviewType: AssetReview['reviewType']; disposition: AssetReview['disposition']; notes?: string },
  ): Promise<ApiResponse<AssetReview>> {
    return apiClient.post(`/api/assets/${id}/review`, data);
  }

  async bulkUpdateAssets(data: {
    assetIds: string[];
    ownerId?: string | null;
    classification?: {
      dataSensitivity?: string | null;
      environment?: string | null;
      internetExposed?: boolean | null;
    };
  }): Promise<ApiResponse<{ updated: number }>> {
    return apiClient.post('/api/assets/bulk-update', data);
  }

  async reviewMergeGroup(
    groupId: string,
    data: { reviewStatus: 'PENDING' | 'APPROVED' | 'DISMISSED'; notes?: string },
  ): Promise<ApiResponse<AssetMergeGroup>> {
    return apiClient.put(`/api/assets/merge-groups/${groupId}/review`, data);
  }

  async mergeWithAsset(assetId: string, targetAssetId: string): Promise<ApiResponse<AssetDetail>> {
    return apiClient.post(`/api/assets/${assetId}/merge-with`, { targetAssetId });
  }

  async unmergeAsset(groupId: string, assetId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/assets/merge-groups/${groupId}/assets/${assetId}`);
  }

  async resolveMergeConflict(
    groupId: string,
    data: {
      field: 'name' | 'provider' | 'externalId' | 'hostname' | 'serialNumber' | 'osType' | 'osVersion' | 'region' | 'externalResourceName' | 'criticality' | 'category' | 'subtype';
      value: string | null;
    },
  ): Promise<ApiResponse<{ updated: number }>> {
    return apiClient.post(`/api/assets/merge-groups/${groupId}/resolve-conflict`, data);
  }

  async resolveMergeFromProvider(
    groupId: string,
    data: {
      provider: string;
      fields?: Array<'name' | 'provider' | 'externalId' | 'hostname' | 'serialNumber' | 'osType' | 'osVersion' | 'region' | 'externalResourceName' | 'criticality' | 'category' | 'subtype'>;
    },
  ): Promise<ApiResponse<{ updated: number; provider: string; fields: string[] }>> {
    return apiClient.post(`/api/assets/merge-groups/${groupId}/resolve-from-provider`, data);
  }

  // Create new asset
  async createAsset(
    assetData: CreateAssetRequest,
  ): Promise<ApiResponse<Asset>> {
    return apiClient.post('/api/assets', assetData);
  }

  // Update asset
  async updateAsset(
    id: string,
    assetData: UpdateAssetRequest,
  ): Promise<ApiResponse<Asset>> {
    return apiClient.put(`/api/assets/${id}`, assetData);
  }

  // Delete asset
  async deleteAsset(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/assets/${id}`);
  }

  // Get assets with risks
  async getAssetsWithRisks(): Promise<ApiResponse<Asset[]>> {
    return apiClient.get('/api/assets/with-risks');
  }

  // Get critical assets
  async getCriticalAssets(): Promise<ApiResponse<Asset[]>> {
    return apiClient.get('/api/assets/critical');
  }

  // Get assets by type distribution
  async getAssetTypeDistribution(): Promise<
    ApiResponse<
      {
        type: AssetType;
        count: number;
        percentage: number;
      }[]
    >
  > {
    return apiClient.get('/api/assets/distribution');
  }

  // Export assets data
  async exportAssets(
    format: 'csv' | 'xlsx' | 'pdf' = 'csv',
    params?: {
      search?: string;
      type?: string;
      criticality?: string;
      category?: string;
      subtype?: string;
      provider?: string;
      isStale?: boolean;
      status?: string;
      managedBy?: string;
      recentDays?: number;
      unclassified?: boolean;
      withoutControls?: boolean;
      ownerless?: boolean;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<Blob> {
    const searchParams = new URLSearchParams({ format });
    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, String(value));
      }
    });
    const response = await fetch(
      `${apiClient.baseURL}/api/assets/export?${searchParams.toString()}`,
      {
        credentials: 'include',
        headers: apiClient.token
          ? {
              Authorization: `Bearer ${apiClient.token}`,
            }
          : {},
      },
    );

    if (!response.ok) {
      throw new Error('Failed to export assets');
    }

    return response.blob();
  }

  // Upload asset file (for bulk import)
  async uploadAssetFile(file: File): Promise<
    ApiResponse<{
      imported: number;
      failed: number;
      errors?: any[];
    }>
  > {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${apiClient.baseURL}/api/assets/import`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: apiClient.token
        ? {
            Authorization: `Bearer ${apiClient.token}`,
          }
        : {},
    });

    if (!response.ok) {
      throw new Error('Failed to upload asset file');
    }

    return response.json();
  }
}

export const assetsService = new AssetsService();
