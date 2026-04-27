import { apiClient } from './client';

// ── Vendor types ─────────────────────────────────────────────────────────────

export type VendorStatus = 'MONITORED' | 'ASSESSMENT_DUE' | 'IN_REVIEW' | 'BLOCKED';
export type RiskTier = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
// Legacy alias kept for callers that imported `VendorTier` while we rolled
// out the inherent/residual split. Remove once consumers migrate.
export type VendorTier = RiskTier;

export type DataClass = 'PII' | 'Sensitive' | 'Internal' | 'Public';
export type BusinessCriticality = 'Mission-critical' | 'Business-important' | 'Operational';

export interface VendorOwnerSummary {
  id: string;
  name: string | null;
  email: string;
}

export interface VendorRecord {
  id: string;
  name: string;
  category: string;
  ownerUserId: string | null;
  ownerUser?: VendorOwnerSummary | null;
  website?: string | null;
  trustCenterUrl?: string | null;
  subprocessorsListUrl?: string | null;
  status: VendorStatus;
  // Inherent risk: auto-computed from the rubric whenever inputs change.
  inherentRiskScore: number | null;
  inherentTier: RiskTier | null;
  // Residual risk: only populated after a VendorReview is approved.
  residualRiskScore: number | null;
  residualTier: RiskTier | null;
  dpaSigned: boolean;
  subprocessors: number;
  businessCriticality: BusinessCriticality;
  dataClass: DataClass;
  lastAssessmentAt: string | null;
  nextAssessmentAt: string | null;
  contractEndDate?: string | null;
  discoverySource?: 'OKTA' | 'AZUREAD' | 'JUMPCLOUD' | 'WORKSPACE' | 'MANUAL' | 'INTAKE' | null;
  lastIncidentAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVendorInput {
  name: string;
  category: string;
  ownerUserId: string;
  website?: string;
  trustCenterUrl?: string | null;
  subprocessorsListUrl?: string | null;
  businessCriticality: BusinessCriticality;
  dataClass: DataClass;
  subprocessors?: number;
  dpaSigned?: boolean;
}

export interface UpdateVendorInput {
  name?: string;
  category?: string;
  ownerUserId?: string | null;
  website?: string | null;
  trustCenterUrl?: string | null;
  subprocessorsListUrl?: string | null;
  status?: VendorStatus;
  dpaSigned?: boolean;
  subprocessors?: number;
  businessCriticality?: BusinessCriticality;
  dataClass?: DataClass;
  contractEndDate?: string | null;
  notes?: string | null;
}

export interface VendorListParams {
  search?: string;
  status?: VendorStatus;
  inherentTier?: RiskTier;
  residualTier?: RiskTier;
  page?: number;
  limit?: number;
}

// ── Contact types ────────────────────────────────────────────────────────────

export type VendorContactRole =
  | 'SECURITY'
  | 'ACCOUNT_MANAGER'
  | 'PROCUREMENT'
  | 'LEGAL'
  | 'ENGINEERING'
  | 'EXECUTIVE'
  | 'OTHER';

export interface VendorContact {
  id: string;
  vendorId: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: VendorContactRole;
  isPrimary: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVendorContactInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: VendorContactRole;
  isPrimary?: boolean;
  notes?: string | null;
}

export type UpdateVendorContactInput = Partial<CreateVendorContactInput>;

// ── Review types ─────────────────────────────────────────────────────────────

export type VendorReviewStatus =
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'UNDER_APPROVAL'
  | 'COMPLETED'
  | 'CANCELLED';

export type VendorReviewDecision =
  | 'APPROVED'
  | 'APPROVED_WITH_CONDITIONS'
  | 'REJECTED';

export interface VendorReviewActor {
  id: string;
  name: string | null;
  email: string;
}

}

export interface CreateVendorContactInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: VendorContactRole;
  isPrimary?: boolean;
  notes?: string | null;
}

export type UpdateVendorContactInput = Partial<CreateVendorContactInput>;

// ── Review types ─────────────────────────────────────────────────────────────

export type VendorReviewStatus =
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'UNDER_APPROVAL'
  | 'COMPLETED'
  | 'CANCELLED';

export type VendorReviewDecision =
  | 'APPROVED'
  | 'APPROVED_WITH_CONDITIONS'
  | 'REJECTED';

export interface VendorReviewActor {
  id: string;
  name: string | null;
  email: string;
}

export interface VendorReview {
  id: string;
  organizationId: string;
  vendorId: string;
  cycleNumber: number;
  status: VendorReviewStatus;
  startedAt: string | null;
  dueAt: string | null;
  completedAt: string | null;
  inherentRiskScoreSnapshot: number | null;
  inherentTierSnapshot: RiskTier | null;
  residualRiskScore: number | null;
  residualTier: RiskTier | null;
  reviewerUserId: string | null;
  approverUserId: string | null;
  decision: VendorReviewDecision | null;
  decisionNotes: string | null;
  approvedAt: string | null;
  validUntil: string | null;
  rubricVersion: string | null;
  createdAt: string;
  updatedAt: string;
  reviewer?: VendorReviewActor | null;
  approver?: VendorReviewActor | null;
}

export interface UpdateVendorReviewInput {
  reviewerUserId?: string | null;
  approverUserId?: string | null;
  dueAt?: string | null;
  residualRiskScore?: number | null;
  residualTier?: RiskTier | null;
  decisionNotes?: string | null;
  validUntil?: string | null;
}

export interface ReviewDecisionInput {
  decision: VendorReviewDecision;
  residualRiskScore?: number;
  residualTier?: RiskTier;
  decisionNotes: string;
  validUntil?: string | null;
}

export type VendorDiscoveryStatus = 'PENDING' | 'PROMOTED' | 'DISMISSED' | 'MERGED';
export type VendorDiscoverySource = 'OKTA' | 'AZUREAD' | 'JUMPCLOUD' | 'WORKSPACE';

export interface VendorDiscoveryCandidate {
  id: string;
  organizationId: string;
  source: VendorDiscoverySource;
  externalAppId: string;
  appName: string;
  ssoEnabled: boolean;
  status: VendorDiscoveryStatus;
  mergedToVendorId: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  mergedVendor?: { id: string; name: string } | null;
}

export interface PromoteDiscoveryCandidateInput {
  name?: string;
  category: string;
  ownerUserId: string;
  website?: string;
  businessCriticality?: BusinessCriticality;
  dataClass?: DataClass;
  subprocessors?: number;
  dpaSigned?: boolean;
}

export interface VendorIntakeRequest {
  id: string;
  organizationId: string;
  requestedByUserId: string;
  vendorName: string;
  vendorWebsite: string | null;
  businessJustification: string;
  dataAccessRequested: string | null;
  expectedUserCount: number | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  reviewerNotes: string | null;
  createdVendorId: string | null;
  createdAt: string;
  updatedAt: string;
  requester?: VendorOwnerSummary | null;
  reviewer?: VendorOwnerSummary | null;
  createdVendor?: { id: string; name: string } | null;
}

export interface CreateVendorIntakeRequestInput {
  vendorName: string;
  vendorWebsite?: string | null;
  businessJustification: string;
  dataAccessRequested?: string | null;
  expectedUserCount?: number | null;
}

export interface DecideVendorIntakeRequestInput {
  decision: 'APPROVE' | 'REJECT';
  reviewerNotes: string;
  category?: string;
  ownerUserId?: string;
  businessCriticality?: BusinessCriticality;
  dataClass?: DataClass;
  subprocessors?: number;
  dpaSigned?: boolean;
}

// ── Service ──────────────────────────────────────────────────────────────────

type ApiResp<T> = { success: boolean; data: T };

function paramsToRecord(params?: VendorListParams): Record<string, string | number | boolean> | undefined {
  if (!params) return undefined;
  const out: Record<string, string | number | boolean> = {};
  if (params.search) out.search = params.search;
  if (params.status) out.status = params.status;
  if (params.inherentTier) out.inherentTier = params.inherentTier;
  if (params.residualTier) out.residualTier = params.residualTier;
  if (params.page !== undefined) out.page = params.page;
  if (params.limit !== undefined) out.limit = params.limit;
  return Object.keys(out).length > 0 ? out : undefined;
}

export const vendorsService = {
  async get(id: string): Promise<VendorRecord | null> {
    const res = await apiClient.get<ApiResp<VendorRecord>>(`/api/vendors/${id}`);
    return res?.data ?? null;
  },

  async list(params?: VendorListParams): Promise<VendorRecord[]> {
    const res = await apiClient.get<ApiResp<VendorRecord[]>>('/api/vendors', paramsToRecord(params));
    return res?.data ?? [];
  },

  async create(input: CreateVendorInput): Promise<VendorRecord> {
    const res = await apiClient.post<ApiResp<VendorRecord>>('/api/vendors', input);
    return res.data;
  },

  async update(id: string, patch: UpdateVendorInput): Promise<VendorRecord | null> {
    const res = await apiClient.put<ApiResp<VendorRecord>>(`/api/vendors/${id}`, patch);
    return res?.data ?? null;
  },

  // ── Contacts ──
  contacts: {
    async list(vendorId: string): Promise<VendorContact[]> {
      const res = await apiClient.get<ApiResp<VendorContact[]>>(`/api/vendors/${vendorId}/contacts`);
      return res?.data ?? [];
    },
    async create(vendorId: string, input: CreateVendorContactInput): Promise<VendorContact> {
      const res = await apiClient.post<ApiResp<VendorContact>>(
        `/api/vendors/${vendorId}/contacts`,
        input,
      );
      return res.data;
    },
    async update(vendorId: string, contactId: string, patch: UpdateVendorContactInput): Promise<VendorContact> {
      const res = await apiClient.patch<ApiResp<VendorContact>>(
        `/api/vendors/${vendorId}/contacts/${contactId}`,
        patch,
      );
      return res.data;
    },
    async remove(vendorId: string, contactId: string): Promise<void> {
      await apiClient.delete<void>(`/api/vendors/${vendorId}/contacts/${contactId}`);
    },
  },

  // ── Reviews ──
  reviews: {
    async list(vendorId: string): Promise<VendorReview[]> {
      const res = await apiClient.get<ApiResp<VendorReview[]>>(`/api/vendors/${vendorId}/reviews`);
      return res?.data ?? [];
    },
    async get(vendorId: string, reviewId: string): Promise<VendorReview | null> {
      const res = await apiClient.get<ApiResp<VendorReview>>(
        `/api/vendors/${vendorId}/reviews/${reviewId}`,
      );
      return res?.data ?? null;
    },
    async start(vendorId: string): Promise<VendorReview> {
      const res = await apiClient.post<ApiResp<VendorReview>>(
        `/api/vendors/${vendorId}/reviews`,
        {},
      );
      return res.data;
    },
    async update(vendorId: string, reviewId: string, patch: UpdateVendorReviewInput): Promise<VendorReview> {
      const res = await apiClient.patch<ApiResp<VendorReview>>(
        `/api/vendors/${vendorId}/reviews/${reviewId}`,
        patch,
      );
      return res.data;
    },
    async submit(vendorId: string, reviewId: string): Promise<VendorReview> {
      const res = await apiClient.post<ApiResp<VendorReview>>(
        `/api/vendors/${vendorId}/reviews/${reviewId}/submit`,
        {},
      );
      return res.data;
    },
    async decide(vendorId: string, reviewId: string, body: ReviewDecisionInput): Promise<VendorReview> {
      const res = await apiClient.post<ApiResp<VendorReview>>(
        `/api/vendors/${vendorId}/reviews/${reviewId}/decision`,
        body,
      );
      return res.data;
    },
    async cancel(vendorId: string, reviewId: string): Promise<VendorReview> {
      const res = await apiClient.post<ApiResp<VendorReview>>(
        `/api/vendors/${vendorId}/reviews/${reviewId}/cancel`,
        {},
      );
      return res.data;
    },
  },

  discovery: {
    async list(params?: {
      status?: VendorDiscoveryStatus;
      search?: string;
    }): Promise<VendorDiscoveryCandidate[]> {
      const res = await apiClient.get<ApiResp<VendorDiscoveryCandidate[]>>(
        '/api/vendors/discovery/candidates',
        params,
      );
      return res?.data ?? [];
    },
    async promote(candidateId: string, input: PromoteDiscoveryCandidateInput): Promise<{ candidate: VendorDiscoveryCandidate; vendor: VendorRecord }> {
      const res = await apiClient.post<ApiResp<{ candidate: VendorDiscoveryCandidate; vendor: VendorRecord }>>(
        `/api/vendors/discovery/candidates/${candidateId}/promote`,
        input,
      );
      return res.data;
    },
    async dismiss(candidateId: string): Promise<VendorDiscoveryCandidate> {
      const res = await apiClient.post<ApiResp<VendorDiscoveryCandidate>>(
        `/api/vendors/discovery/candidates/${candidateId}/dismiss`,
        {},
      );
      return res.data;
    },
    async merge(candidateId: string, vendorId: string): Promise<VendorDiscoveryCandidate> {
      const res = await apiClient.post<ApiResp<VendorDiscoveryCandidate>>(
        `/api/vendors/discovery/candidates/${candidateId}/merge`,
        { vendorId },
      );
      return res.data;
    },
  },

  intake: {
    async create(input: CreateVendorIntakeRequestInput): Promise<VendorIntakeRequest> {
      const res = await apiClient.post<ApiResp<VendorIntakeRequest>>(
        '/api/vendors/intake-requests',
        input,
      );
      return res.data;
    },
    async list(params?: {
      status?: VendorIntakeRequest['status'];
    }): Promise<VendorIntakeRequest[]> {
      const res = await apiClient.get<ApiResp<VendorIntakeRequest[]>>(
        '/api/vendors/intake-requests',
        params,
      );
      return res?.data ?? [];
    },
    async decide(
      id: string,
      input: DecideVendorIntakeRequestInput,
    ): Promise<VendorIntakeRequest | { intake: VendorIntakeRequest; vendor: VendorRecord }> {
      const res = await apiClient.post<
        ApiResp<VendorIntakeRequest | { intake: VendorIntakeRequest; vendor: VendorRecord }>
      >(`/api/vendors/intake-requests/${id}/decision`, input);
      return res.data;
    },
  },
};
