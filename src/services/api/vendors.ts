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
};
