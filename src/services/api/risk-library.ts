import { apiClient, ApiResponse } from './client';

export interface RiskLibraryItemDto {
  id: string;
  title: string;
  category: string;
  defaultImpact: string;
  defaultLikelihood: string;
}

export interface RiskRegisterEntryDto {
  id: string;
  libraryItemId: string | null;
  title: string;
  description: string | null;
  category: string;
  inherentImpact: string;
  inherentLikelihood: string;
  inherentScore: number;
  residualImpact: string | null;
  residualLikelihood: string | null;
  residualScore: number | null;
  status: 'IDENTIFIED' | 'ASSESSING' | 'TREATING' | 'MONITORING' | 'CLOSED';
  treatment: 'MITIGATE' | 'ACCEPT' | 'TRANSFER' | 'AVOID' | null;
  treatmentNotes: string | null;
  ownerId: string | null;
  ownerName: string | null;
  reviewDueAt: string | null;
  sourceType: string | null;
  sourceRef: string | null;
  findingCount: number | null;
  // AI TrustOps: flags an AI-related risk for the AI Trust dashboard.
  isAiRisk?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RiskRegisterStats {
  total: number;
  identified: number;
  assessing: number;
  treating: number;
  monitoring: number;
  closed: number;
}

export interface RiskLibraryListResponse extends ApiResponse<
  RiskLibraryItemDto[]
> {
  categories: string[];
}

export interface RiskRegisterListResponse extends ApiResponse<
  RiskRegisterEntryDto[]
> {
  stats: RiskRegisterStats;
}

export interface BreakdownItem {
  label: string;
  count: number;
}

export interface OverviewRecentEntry {
  id: string;
  title: string;
  category: string;
  inherentImpact: string;
  inherentScore: number;
  status: string;
  sourceType: string | null;
  ownerName: string | null;
  createdAt: string;
}

export interface RiskRegisterOverview {
  total: number;
  open: number;
  monitoring: number;
  closed: number;
  statusBreakdown: BreakdownItem[];
  categoryBreakdown: BreakdownItem[];
  severityBreakdown: BreakdownItem[];
  sourceBreakdown: BreakdownItem[];
  recentEntries: OverviewRecentEntry[];
}

export interface AddToRegisterRequest {
  libraryItemId?: string;
  title?: string;
  description?: string;
  category?: string;
  inherentImpact?: string;
  inherentLikelihood?: string;
}

export interface UpdateRegisterEntryRequest {
  inherentImpact?: string;
  inherentLikelihood?: string;
  residualImpact?: string;
  residualLikelihood?: string;
  status?: string;
  treatment?: string;
  treatmentNotes?: string;
  ownerId?: string | null;
  reviewDueAt?: string | null;
  description?: string;
  isAiRisk?: boolean;
}

export interface RiskMappedControl {
  mappingId: string;
  controlId: string;
  isoReference: string;
  controlTitle: string;
  controlStatus: string;
  notes: string | null;
}

export interface RiskMappedFramework {
  mappingId: string;
  frameworkId: string;
  frameworkSlug: string;
  frameworkName: string;
  frameworkVersion: string;
}

export interface RiskMappingsResponse {
  controls: RiskMappedControl[];
  frameworks: RiskMappedFramework[];
}

export const riskLibraryService = {
  listLibrary() {
    return apiClient.get<RiskLibraryListResponse>('/api/risk-library');
  },

  listRegister(params?: {
    status?: string;
    category?: string;
    search?: string;
    source_type?: string;
  }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.category) qs.set('category', params.category);
    if (params?.search) qs.set('search', params.search);
    if (params?.source_type) qs.set('source_type', params.source_type);
    const query = qs.toString();
    return apiClient.get<RiskRegisterListResponse>(
      `/api/risk-library/register${query ? `?${query}` : ''}`,
    );
  },

  getRegisterOverview() {
    return apiClient.get<ApiResponse<RiskRegisterOverview>>(
      '/api/risk-library/register/overview',
    );
  },

  getRegisterEntry(id: string) {
    return apiClient.get<ApiResponse<RiskRegisterEntryDto>>(
      `/api/risk-library/register/${id}`,
    );
  },

  addToRegister(data: AddToRegisterRequest) {
    return apiClient.post<ApiResponse<RiskRegisterEntryDto>>(
      '/api/risk-library/register',
      data,
    );
  },

  updateRegisterEntry(id: string, data: UpdateRegisterEntryRequest) {
    return apiClient.patch<ApiResponse<RiskRegisterEntryDto>>(
      `/api/risk-library/register/${id}`,
      data,
    );
  },

  removeFromRegister(id: string) {
    return apiClient.delete<ApiResponse>(`/api/risk-library/register/${id}`);
  },

  // ── Risk Register Mappings ──────────────────────────────────────────────────

  getRiskMappings(riskId: string) {
    return apiClient.get<ApiResponse<RiskMappingsResponse>>(
      `/api/risk-library/register/${riskId}/mappings`,
    );
  },

  linkControl(riskId: string, controlId: string, notes?: string) {
    return apiClient.post<ApiResponse<{ id: string }>>(
      `/api/risk-library/register/${riskId}/controls`,
      { controlId, notes },
    );
  },

  unlinkControl(riskId: string, controlId: string) {
    return apiClient.delete<ApiResponse>(
      `/api/risk-library/register/${riskId}/controls/${controlId}`,
    );
  },

  linkFramework(riskId: string, frameworkId: string) {
    return apiClient.post<ApiResponse<{ id: string }>>(
      `/api/risk-library/register/${riskId}/frameworks`,
      { frameworkId },
    );
  },

  unlinkFramework(riskId: string, frameworkId: string) {
    return apiClient.delete<ApiResponse>(
      `/api/risk-library/register/${riskId}/frameworks/${frameworkId}`,
    );
  },

  // R3a — Risk ↔ Policy treatment linkage (RiskTreatmentPolicy table).
  // These hit the new /api/risks/:id/policies endpoints (risks module), separate
  // from the /api/risk-library/* endpoints used for control/framework linking.
  listTreatmentPolicies(riskId: string) {
    return apiClient.get<ApiResponse<RiskTreatmentPolicyLink[]>>(
      `/api/risks/${riskId}/policies`,
    );
  },

  linkTreatmentPolicy(riskId: string, policyId: string, notes?: string) {
    return apiClient.post<ApiResponse<RiskTreatmentPolicyLink>>(
      `/api/risks/${riskId}/policies`,
      { policyId, notes },
    );
  },

  unlinkTreatmentPolicy(riskId: string, policyId: string) {
    return apiClient.delete<ApiResponse>(
      `/api/risks/${riskId}/policies/${policyId}`,
    );
  },
};

export interface RiskTreatmentPolicyLink {
  id: string;
  organizationId: string;
  riskId: string;
  policyId: string;
  notes: string | null;
  createdAt: string;
  policy: {
    id: string;
    name: string;
    version: string;
    versionNumber: number;
    status: string;
    renewalDate: string | null;
    owner: { id: string; name: string | null; email: string } | null;
  };
}
