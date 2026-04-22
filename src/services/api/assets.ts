/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { apiClient, ApiResponse } from './client';
import { Asset, AssetChangeLogEntry, AssetCoverage, AssetDetail, CreateAssetRequest, AssetType } from './types';

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
  async exportAssets(format: 'csv' | 'xlsx' | 'pdf' = 'csv'): Promise<Blob> {
    const response = await fetch(
      `${apiClient.baseURL}/api/assets/export?format=${format}`,
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
