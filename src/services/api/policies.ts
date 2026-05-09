import { apiClient, ApiResponse, API_BASE_URL } from './client';
import { getAuthToken } from '@/services/authStorage';
import {
  Policy,
  PolicyVersion,
  PolicyApprovalRecord,
  PolicyAcceptanceRecord,
} from './types';

function messageFromPayload(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object') {
    const shaped = payload as { message?: unknown; error?: unknown };
    if (typeof shaped.message === 'string' && shaped.message.trim()) return shaped.message;
    if (typeof shaped.error === 'string' && shaped.error.trim()) return shaped.error;
  }
  if (typeof payload === 'string' && payload.trim()) return payload;
  return fallback;
}

async function readFetchErrorMessage(response: Response, fallback: string): Promise<string> {
  const contentType = response.headers.get('content-type') ?? '';
  try {
    if (contentType.includes('application/json')) {
      return messageFromPayload(await response.json(), fallback);
    }
    return messageFromPayload(await response.text(), fallback);
  } catch {
    return fallback;
  }
}

function isMissingLocaleVersion(message: string): boolean {
  return /^No\s+[A-Z]{2}\s+version exists for this policy version$/i.test(message.trim());
}

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

// R2: re-acceptance is mandatory and org-wide. The dialog only sends a changelog;
// `sendForAcceptance` and `acceptanceUserIds` were removed when the "publish only"
// and "specific users" modes were dropped.
export interface PublishPolicyRequest extends UpdatePolicyRequest {
  changelog?: string;
}

/**
 * Users excluded from a policy publish because their role has POLICY_ACCEPTANCE
 * disabled in the role-onboarding matrix (e.g. Auditors). [T-91]
 */
export interface SkippedAcceptanceUser {
  id: string;
  name: string | null;
  role: string;
}

export interface PolicyUpdateResponse extends ApiResponse<Policy> {
  skippedUsers?: SkippedAcceptanceUser[];
}

export interface PolicyComment {
  id: string;
  organizationId: string;
  policyId: string;
  policyVersionId: string | null;
  authorId: string;
  body: string;
  text?: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
}

export interface PolicyAuditRow {
  id: string;
  name: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string | null;
  assignedAuditorId: string | null;
  externalAuditorEmail: string | null;
  viaControlIds: string[];
}

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

  // Update policy — on publish, response may include `skippedUsers` for role-exempt targets [T-91]
  async updatePolicy(
    id: string,
    data: PublishPolicyRequest,
  ): Promise<PolicyUpdateResponse> {
    return apiClient.put(`/api/policies/${id}`, data);
  }

  async getVersions(policyId: string): Promise<ApiResponse<PolicyVersion[]>> {
    return apiClient.get(`/api/policies/${policyId}/versions`);
  }

  async getApprovals(policyId: string): Promise<ApiResponse<PolicyApprovalRecord[]>> {
    return apiClient.get(`/api/policies/${policyId}/approvals`);
  }

  async requestApproval(
    policyId: string,
    approverIds: string[],
  ): Promise<ApiResponse<PolicyApprovalRecord[]>> {
    return apiClient.post(`/api/policies/${policyId}/approvals`, { approverIds });
  }

  async respondToApproval(
    policyId: string,
    approvalId: string,
    data: { status: string; comment?: string },
  ): Promise<ApiResponse<PolicyApprovalRecord>> {
    return apiClient.put(`/api/policies/${policyId}/approvals/${approvalId}`, data);
  }

  async getAcceptances(policyId: string): Promise<ApiResponse<PolicyAcceptanceRecord[]>> {
    return apiClient.get(`/api/policies/${policyId}/acceptances`);
  }

  async getMyAcceptances(): Promise<ApiResponse<PolicyAcceptanceRecord[]>> {
    return apiClient.get('/api/policies/my-acceptances');
  }

  async acceptPolicy(
    policyId: string,
    acceptanceId: string,
  ): Promise<ApiResponse<PolicyAcceptanceRecord>> {
    return apiClient.post(`/api/policies/${policyId}/acceptances/${acceptanceId}/accept`, {});
  }

  async renewPolicy(
    policyId: string,
    mode: 'with_updates' | 'without_updates',
  ): Promise<ApiResponse<Policy>> {
    return apiClient.post(`/api/policies/${policyId}/renew`, { mode });
  }

  async setRecurrence(
    policyId: string,
    data: { recurrenceMonths: number; renewalDate?: string },
  ): Promise<ApiResponse<Policy>> {
    return apiClient.put(`/api/policies/${policyId}/recurrence`, data);
  }

  async savePolicyContent(
    id: string,
    content: object,
    opts?: { locale?: 'en' | 'ja' },
  ): Promise<ApiResponse<Policy>> {
    const suffix = opts?.locale ? `?locale=${encodeURIComponent(opts.locale)}` : '';
    return apiClient.put(`/api/policies/${id}/content${suffix}`, { content });
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
    opts?: { locale?: 'en' | 'ja' },
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
    const suffix = opts?.locale ? `?locale=${encodeURIComponent(opts.locale)}` : '';
    const response = await fetch(
      `${API_BASE_URL}/api/policies/${policyId}/upload${suffix}`,
      {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      },
    );
    const data = await response.json().catch(() => undefined);
    if (!response.ok) throw new Error(messageFromPayload(data, 'Upload failed'));
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
    templateId?: string;
    templateSlug?: string;
    templateName?: string;
    version?: string;
    status?: string;
    approvedBy?: string;
  }): Promise<ApiResponse<Policy>> {
    return apiClient.post('/api/policies/from-template', data);
  }

  async downloadPolicyDocument(
    policyId: string,
    fileName: string,
    opts?: {
      versionId?: string;
      locale?: 'en' | 'ja';
      onLocaleFallback?: () => void;
    },
  ): Promise<void> {
    const token = getAuthToken();

    const fetchDocument = async (requestOpts?: { versionId?: string; locale?: 'en' | 'ja' }) => {
      const params = new URLSearchParams();
      if (requestOpts?.versionId) params.set('versionId', requestOpts.versionId);
      if (requestOpts?.locale) params.set('locale', requestOpts.locale);
      const suffix = params.toString() ? `?${params.toString()}` : '';
      const response = await fetch(
        `${API_BASE_URL}/api/policies/${policyId}/download${suffix}`,
        {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      if (!response.ok) {
        throw new Error(await readFetchErrorMessage(response, 'Download failed'));
      }
      return response;
    };

    let response: Response;
    try {
      response = await fetchDocument(opts);
    } catch (error) {
      if (
        opts?.locale &&
        opts.locale !== 'en' &&
        error instanceof Error &&
        isMissingLocaleVersion(error.message)
      ) {
        opts.onLocaleFallback?.();
        response = await fetchDocument({ versionId: opts.versionId, locale: 'en' });
      } else {
        throw error;
      }
    }

    const blob = await response.blob();
    // Backend serves text/html when it falls through to the content-render
    // path (no stored documentUrl/pdfUrl). Callers supply a .pdf name by
    // default; rewrite the extension to match the actual response type so
    // the OS opens the file in the right application instead of showing
    // "no application is able to open the file".
    const contentType = (response.headers.get('Content-Type') ?? blob.type ?? '').toLowerCase();
    const targetExt = contentType.includes('text/html')
      ? 'html'
      : contentType.includes('application/pdf')
        ? 'pdf'
        : null;
    const resolvedFileName = targetExt
      ? fileName.replace(/\.[a-z0-9]+$/i, '') + '.' + targetExt
      : fileName;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = resolvedFileName;
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
    opts?: { versionId?: string; locale?: 'en' | 'ja' },
  ): Promise<
    | { blobUrl: string; contentType: string }
    | { external: true; url: string }
    | { embedded: true; url: string }
  > {
    const token = getAuthToken();
    const params = new URLSearchParams();
    if (opts?.versionId) params.set('versionId', opts.versionId);
    if (opts?.locale) params.set('locale', opts.locale);
    const suffix = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(
      `${API_BASE_URL}/api/policies/${policyId}/preview${suffix}`,
      {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );
    if (!response.ok) {
      throw new Error(await readFetchErrorMessage(response, 'Preview failed'));
    }

    const ct = response.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
      const json = (await response.json()) as { external?: boolean; embeddable?: boolean; url: string };
      if (json.embeddable) return { embedded: true, url: json.url };
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

  // R1: comments + audits
  async listComments(policyId: string, policyVersionId?: string): Promise<ApiResponse<PolicyComment[]>> {
    const params: Record<string, string> = {};
    if (policyVersionId) params.policyVersionId = policyVersionId;
    return apiClient.get(`/api/policies/${policyId}/comments`, params);
  }

  async createComment(policyId: string, body: { body: string; policyVersionId?: string }): Promise<ApiResponse<PolicyComment>> {
    return apiClient.post(`/api/policies/${policyId}/comments`, body);
  }

  async updateComment(policyId: string, commentId: string, body: string): Promise<ApiResponse<PolicyComment>> {
    return apiClient.put(`/api/policies/${policyId}/comments/${commentId}`, { body });
  }

  async deleteComment(policyId: string, commentId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/policies/${policyId}/comments/${commentId}`);
  }

  async listAudits(policyId: string): Promise<ApiResponse<PolicyAuditRow[]>> {
    return apiClient.get(`/api/policies/${policyId}/audits`);
  }

  // R3a — risks treated by this policy (reverse view of RiskTreatmentPolicy)
  async listTreatmentRisks(policyId: string): Promise<ApiResponse<PolicyTreatmentRiskLink[]>> {
    return apiClient.get(`/api/policies/${policyId}/risks`);
  }

  async linkControl(policyId: string, controlId: string): Promise<ApiResponse<PolicyControlLink>> {
    return apiClient.post(`/api/policies/${policyId}/controls`, { controlId });
  }

  async unlinkControl(policyId: string, controlId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/policies/${policyId}/controls/${controlId}`);
  }
}

export interface PolicyControlLink {
  id: string;
  controlId: string;
  policyId: string;
  control?: {
    id: string;
    isoReference?: string;
    title: string;
    status: string;
  };
}

export interface PolicyTreatmentRiskLink {
  id: string;
  notes: string | null;
  createdAt: string;
  risk: {
    id: string;
    title: string;
    status: string;
    impact: string;
    likelihood: string;
    riskScore: number;
  };
}

export const policiesService = new PoliciesService();
