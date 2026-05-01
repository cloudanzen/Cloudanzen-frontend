import { apiClient, ApiResponse } from './client';

export interface ComplianceDocumentDto {
  id: string;
  testId: string | null;
  name: string;
  slug: string;
  category: string;
  frameworkId: string | null;
  frameworkName: string | null;
  status: 'PENDING' | 'CURRENT' | 'NEEDS_REVIEW' | 'EXPIRED';
  currentEvidenceId: string | null;
  documentUrl: string | null;
  ownerId: string | null;
  ownerName: string | null;
  lastReviewedAt: string | null;
  reviewDueAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceDocumentStats {
  total: number;
  pending: number;
  current: number;
  needsReview: number;
  expired: number;
}

export interface ComplianceDocumentListResponse extends ApiResponse<
  ComplianceDocumentDto[]
> {
  stats: ComplianceDocumentStats;
  total?: number;
}

export interface ComplianceDocumentFilterOptions {
  frameworks: Array<{ slug: string; name: string }>;
}

export interface UpdateComplianceDocumentRequest {
  status?: string;
  ownerId?: string | null;
  currentEvidenceId?: string | null;
  documentUrl?: string | null;
  lastReviewedAt?: string | null;
  reviewDueAt?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
}

async function parseUploadError(response: Response, fallback: string) {
  const contentType = response.headers.get('content-type') ?? '';

  try {
    if (contentType.includes('application/json')) {
      const payload = (await response.json()) as {
        message?: string;
        error?: string;
      };
      return payload.message || payload.error || fallback;
    }

    const text = await response.text();
    return text || fallback;
  } catch {
    return fallback;
  }
}

export const complianceDocumentService = {
  list(params?: {
    status?: string;
    category?: string;
    search?: string;
    testId?: string;
    framework?: string;
  }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.category) qs.set('category', params.category);
    if (params?.search) qs.set('search', params.search);
    if (params?.testId) qs.set('testId', params.testId);
    if (params?.framework) qs.set('framework', params.framework);
    const query = qs.toString();
    return apiClient.get<ComplianceDocumentListResponse>(
      `/api/compliance-documents${query ? `?${query}` : ''}`,
    );
  },

  getFilterOptions() {
    return apiClient.get<ApiResponse<ComplianceDocumentFilterOptions>>(
      '/api/compliance-documents/filter-options',
    );
  },

  getById(id: string) {
    return apiClient.get<ApiResponse<ComplianceDocumentDto>>(
      `/api/compliance-documents/${id}`,
    );
  },

  update(id: string, data: UpdateComplianceDocumentRequest) {
    return apiClient.patch<ApiResponse<ComplianceDocumentDto>>(
      `/api/compliance-documents/${id}`,
      data,
    );
  },

  async uploadDocument(
    id: string,
    file: File,
  ): Promise<ApiResponse<ComplianceDocumentDto>> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(
      `${apiClient.baseURL}/api/compliance-documents/${id}/upload`,
      {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: apiClient.token
          ? { Authorization: `Bearer ${apiClient.token}` }
          : {},
      },
    );
    if (!response.ok) {
      throw new Error(
        await parseUploadError(response, 'Failed to upload document'),
      );
    }
    return response.json();
  },
};
