import { apiClient, ApiResponse, API_BASE_URL } from './client';
import { getAuthToken } from '@/services/authStorage';
import { Policy } from './types';

export interface PolicyTemplate {
  id: string;
  name: string;
  slug: string;
  version: string;
  status: string;
  category: string;
  requirementCodes: string[];
  description: string;
}

export interface CreatePolicyRequest {
  name: string;
  version: string;
  status: string;
  documentUrl?: string;
  ownerId?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export type UpdatePolicyRequest = Partial<CreatePolicyRequest>;

export class PoliciesService {
  // Get all policies
  async getPolicies(params?: {
    search?: string;
    status?: string;
    frameworkSlugs?: string[];
  }): Promise<ApiResponse<Policy[]>> {
    const cleanParams: Record<string, string> = {};
    if (params?.search) cleanParams.search = params.search;
    if (params?.status) cleanParams.status = params.status;
    if (params?.frameworkSlugs?.length)
      cleanParams.frameworkSlugs = params.frameworkSlugs.join(',');
    return apiClient.get(
      '/api/policies',
      Object.keys(cleanParams).length ? cleanParams : undefined,
    );
  }

  // Get single policy
  async getPolicy(id: string): Promise<ApiResponse<Policy>> {
    return apiClient.get(`/api/policies/${id}`);
  }

  // Create policy
  async createPolicy(data: CreatePolicyRequest): Promise<ApiResponse<Policy>> {
    return apiClient.post('/api/policies', data);
  }

  // Update policy
  async updatePolicy(
    id: string,
    data: UpdatePolicyRequest,
  ): Promise<ApiResponse<Policy>> {
    return apiClient.put(`/api/policies/${id}`, data);
  }

  // Delete policy
  async deletePolicy(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/policies/${id}`);
  }

  /**
   * Upload a document file for a policy.
   * Sends multipart/form-data with a single "file" field.
   */
  async uploadPolicyDocument(
    policyId: string,
    file: File,
  ): Promise<
    ApiResponse<{
      policy: Policy;
      file: {
        fileName: string;
        fileUrl: string;
        size: number;
        mimeType: string;
      };
    }>
  > {
    const formData = new FormData();
    formData.append('file', file);

    const token = getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}/api/policies/${policyId}/upload`,
      {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      },
    );
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  }

  /**
   * Download a policy document. Returns a Blob for the browser to save.
   * Uses the authenticated /api/policies/:id/download endpoint.
   */
  /** Get the built-in policy template catalogue */
  async getTemplates(): Promise<ApiResponse<PolicyTemplate[]>> {
    return apiClient.get('/api/policies/templates');
  }

  /**
   * Create a policy from a template and auto-attach a generated .docx document.
   * The backend generates the editable Word document and stores it immediately.
   */
  async createPolicyFromTemplate(data: {
    templateName: string;
    version?: string;
    status?: string;
    approvedBy?: string;
  }): Promise<ApiResponse<Policy>> {
    return apiClient.post('/api/policies/from-template', data);
  }

  async downloadPolicyDocument(
    policyId: string,
    fileName: string,
  ): Promise<void> {
    const token = getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}/api/policies/${policyId}/download`,
      {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );
    if (!response.ok) throw new Error('Download failed');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Fetch a preview URL for a policy document.
   *
   * - Google Drive / external URLs: backend returns `{ external: true, url }`.
   *   The caller should open `url` in a new tab.
   * - S3 / local files: backend redirects to the file stream.
   *   We read it as a Blob and create an object URL so it can be displayed in
   *   an <iframe> without triggering a download.
   */
  async previewPolicyDocument(
    policyId: string,
  ): Promise<{ blobUrl: string; contentType: string } | { external: true; url: string }> {
    const token = getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}/api/policies/${policyId}/preview`,
      {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );
    if (!response.ok) throw new Error('Preview failed');

    const ct = response.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
      const json = (await response.json()) as { external: boolean; url: string };
      return { external: true, url: json.url };
    }

    const blob = await response.blob();
    return { blobUrl: URL.createObjectURL(blob), contentType: blob.type || ct };
  }

  /** Get policies linked to given control IDs (for test evidence tab) */
  async getPoliciesByControls(controlIds: string[]): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    version: string;
    status: string;
    documentUrl: string | null;
    controlIds: string[];
  }>>> {
    if (controlIds.length === 0) return { success: true, data: [] } as ApiResponse<[]>;
    return apiClient.get('/api/policies/by-controls', { controlIds: controlIds.join(',') });
  }
}

export const policiesService = new PoliciesService();
