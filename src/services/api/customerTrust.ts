/**
 * /api/customer-trust admin endpoints (Trust Center Phase A).
 *
 * Backed by Cloudanzen-backend `src/modules/customer-trust/routes.ts`.
 */
import { apiClient } from './client';

// ── Types ────────────────────────────────────────────────────────────────────

export interface TrustAccountRow {
  id: string;
  domain: string;
  companyName: string | null;
  logoUrl: string | null;
  bypassNda: boolean;
  autoApproveAll: boolean;
  firstSeenAt: string;
  lastActiveAt: string;
  salesforceAccountId: string | null;
  _count: { viewers: number; events: number };
}

export interface TrustViewerRow {
  id: string;
  accountId: string | null;
  email: string | null;
  name: string | null;
  identifiedVia:
    | 'ACCESS_REQUEST'
    | 'SUBSCRIBE'
    | 'MAGIC_LINK'
    | 'NDA_ACCEPT'
    | 'CRM_MATCH'
    | 'QUESTIONNAIRE';
  erasedAt: string | null;
  firstSeenAt: string;
  lastActiveAt: string;
}

export interface TrustEventRow {
  id: string;
  action:
    | 'PAGE_VIEW'
    | 'DOC_DOWNLOAD'
    | 'ACCESS_REQUEST'
    | 'QUESTIONNAIRE_REQUEST'
    | 'SUBSCRIBE'
    | 'NDA_ACCEPTED';
  resourceType: 'DOCUMENT' | 'PAGE' | 'ANNOUNCEMENT' | null;
  resourceId: string | null;
  createdAt: string;
  metadataJson: Record<string, unknown> | null;
  viewerId: string | null;
  accountId: string | null;
  session: {
    ipAddress: string | null;
    country: string | null;
    city: string | null;
    userAgent: string | null;
  } | null;
  viewer: { email: string | null; name: string | null } | null;
  account: { id: string; domain: string; companyName: string | null } | null;
}

export interface TrustOverviewKpis {
  windowDays: number;
  sessions: number;
  pageViews: number;
  downloads: number;
  accessRequests: number;
  activeAccounts: number;
  newAccounts: number;
  identifiedViewers: number;
  conversionRate: number;
}

export interface TrustAccountDetail {
  account: TrustAccountRow & { notes: string | null };
  viewers: TrustViewerRow[];
  recentEvents: Array<{
    id: string;
    action: TrustEventRow['action'];
    resourceType: TrustEventRow['resourceType'];
    resourceId: string | null;
    createdAt: string;
    viewerId: string | null;
  }>;
}

// ── Calls ────────────────────────────────────────────────────────────────────

interface ApiOk<T> {
  success: true;
  data: T;
}

interface ActivityResponse extends ApiOk<TrustEventRow[]> {
  nextCursor: string | null;
}

export const customerTrustApi = {
  accounts(): Promise<ApiOk<TrustAccountRow[]>> {
    return apiClient.get('/api/customer-trust/accounts');
  },
  accountDetail(id: string): Promise<ApiOk<TrustAccountDetail>> {
    return apiClient.get(
      `/api/customer-trust/accounts/${encodeURIComponent(id)}`,
    );
  },
  patchAccount(
    id: string,
    payload: {
      bypassNda?: boolean;
      autoApproveAll?: boolean;
      companyName?: string | null;
      notes?: string | null;
    },
  ): Promise<ApiOk<TrustAccountRow>> {
    return apiClient.patch(
      `/api/customer-trust/accounts/${encodeURIComponent(id)}`,
      payload,
    );
  },
  viewers(accountId?: string): Promise<ApiOk<TrustViewerRow[]>> {
    const q = accountId ? `?accountId=${encodeURIComponent(accountId)}` : '';
    return apiClient.get(`/api/customer-trust/viewers${q}`);
  },
  activity(
    params: {
      accountId?: string;
      action?: string;
      cursor?: string;
      limit?: number;
    } = {},
  ): Promise<ActivityResponse> {
    const usp = new URLSearchParams();
    if (params.accountId) usp.set('accountId', params.accountId);
    if (params.action) usp.set('action', params.action);
    if (params.cursor) usp.set('cursor', params.cursor);
    if (params.limit) usp.set('limit', String(params.limit));
    const qs = usp.toString();
    return apiClient.get(`/api/customer-trust/activity${qs ? `?${qs}` : ''}`);
  },
  overviewKpis(windowDays?: number): Promise<ApiOk<TrustOverviewKpis>> {
    const q = windowDays ? `?windowDays=${windowDays}` : '';
    return apiClient.get(`/api/customer-trust/overview/kpis${q}`);
  },

  // ── Phase C — Customer Commitments ──────────────────────────────────────
  listCommitments(
    params: { status?: string; accountId?: string; category?: string } = {},
  ): Promise<ApiOk<TrustCommitmentRow[]>> {
    const usp = new URLSearchParams();
    if (params.status) usp.set('status', params.status);
    if (params.accountId) usp.set('accountId', params.accountId);
    if (params.category) usp.set('category', params.category);
    const qs = usp.toString();
    return apiClient.get(
      `/api/customer-trust/commitments${qs ? `?${qs}` : ''}`,
    );
  },
  getCommitment(id: string): Promise<ApiOk<TrustCommitmentDetail>> {
    return apiClient.get(
      `/api/customer-trust/commitments/${encodeURIComponent(id)}`,
    );
  },
  createCommitment(payload: {
    accountId?: string | null;
    title: string;
    description?: string | null;
    category: TrustCommitmentCategory;
    status?: TrustCommitmentStatus;
    source: TrustCommitmentSource;
    sourceDocumentUrl?: string | null;
    effectiveFrom: string;
    effectiveUntil?: string | null;
    ownerUserId?: string | null;
    controlIds?: string[];
    policyIds?: string[];
  }): Promise<ApiOk<TrustCommitmentRow>> {
    return apiClient.post('/api/customer-trust/commitments', payload);
  },
  updateCommitment(
    id: string,
    payload: Partial<{
      accountId: string | null;
      title: string;
      description: string | null;
      category: TrustCommitmentCategory;
      status: TrustCommitmentStatus;
      source: TrustCommitmentSource;
      sourceDocumentUrl: string | null;
      effectiveFrom: string;
      effectiveUntil: string | null;
      ownerUserId: string | null;
      controlIds: string[];
      policyIds: string[];
    }>,
  ): Promise<ApiOk<TrustCommitmentRow>> {
    return apiClient.patch(
      `/api/customer-trust/commitments/${encodeURIComponent(id)}`,
      payload,
    );
  },
  deleteCommitment(id: string): Promise<{ success: boolean }> {
    return apiClient.delete(
      `/api/customer-trust/commitments/${encodeURIComponent(id)}`,
    );
  },
  logCommitmentEvent(
    id: string,
    payload: {
      eventType: TrustCommitmentEventType;
      notes?: string | null;
      evidenceUrl?: string | null;
    },
  ): Promise<ApiOk<TrustCommitmentEvent>> {
    return apiClient.post(
      `/api/customer-trust/commitments/${encodeURIComponent(id)}/events`,
      payload,
    );
  },
};

// ── Phase C types ──────────────────────────────────────────────────────────

export type TrustCommitmentCategory =
  | 'SLA'
  | 'SECURITY'
  | 'PRIVACY'
  | 'OPERATIONAL';
export type TrustCommitmentStatus =
  | 'ACTIVE'
  | 'AT_RISK'
  | 'BREACHED'
  | 'EXPIRED';
export type TrustCommitmentSource = 'CONTRACT' | 'POLICY' | 'MANUAL';
export type TrustCommitmentEventType =
  | 'ATTESTED'
  | 'BREACHED'
  | 'REMEDIATED'
  | 'RENEWED';

export interface TrustCommitmentRow {
  id: string;
  accountId: string | null;
  title: string;
  category: TrustCommitmentCategory;
  status: TrustCommitmentStatus;
  source: TrustCommitmentSource;
  effectiveFrom: string;
  effectiveUntil: string | null;
  ownerUserId: string | null;
  createdAt: string;
  updatedAt: string;
  account?: { id: string; domain: string; companyName: string | null } | null;
}

export interface TrustCommitmentEvent {
  id: string;
  commitmentId: string;
  eventType: TrustCommitmentEventType;
  notes: string | null;
  evidenceUrl: string | null;
  loggedByUserId: string | null;
  createdAt: string;
}

export interface TrustCommitmentDetail extends TrustCommitmentRow {
  description: string | null;
  sourceDocumentUrl: string | null;
  controlIds: string[];
  policyIds: string[];
  events: TrustCommitmentEvent[];
}
