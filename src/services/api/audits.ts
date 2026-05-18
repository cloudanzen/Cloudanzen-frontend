import { apiClient } from './client';
import type { RiskSnapshotRecord } from './risks';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AuditType =
  | 'INTERNAL'
  | 'EXTERNAL'
  | 'SURVEILLANCE'
  | 'RECERTIFICATION';
export type AuditStatus =
  | 'DRAFT'
  | 'UPCOMING'
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'AWAITING_REPORT'
  | 'COMPLETED';
export type AuditControlStatus =
  | 'PENDING'
  | 'COMPLIANT'
  | 'NON_COMPLIANT'
  | 'NOT_APPLICABLE';
export type FindingSeverity = 'MINOR' | 'MAJOR' | 'OBSERVATION' | 'OFI';
export type AuditEvidenceStatus = 'PENDING' | 'READY' | 'FLAGGED' | 'APPROVED';
export type AuditRequestStatus =
  | 'NOT_READY'
  | 'IN_REVIEW'
  | 'READY_FOR_AUDIT'
  | 'FLAGGED'
  | 'ACCEPTED'
  | 'NOT_APPLICABLE';
export type AuditAuditorRole = 'LEAD' | 'REVIEWER';

// ── Nested item shapes returned by the API inside control sub-objects ─────────

export interface ControlEvidenceItem {
  id: string;
  type: string;
  fileName?: string | null;
  fileUrl?: string | null;
  automated?: boolean;
  createdAt: string;
}

/** Per-audit review record for one evidence item (from AuditEvidence join table). */
export interface AuditEvidenceReview {
  id: string; // AuditEvidence.id
  evidenceId: string;
  status: AuditEvidenceStatus;
  flagReason?: string | null;
  flaggedAt?: string | null;
  approvedAt?: string | null;
}

export interface ControlPolicyItem {
  id: string;
  name: string;
  status: string;
  approvedAt: string | null;
  documentUrl: string;
}

export interface ControlPolicyMappingItem {
  policy: ControlPolicyItem;
}

export interface ControlRiskItem {
  id: string;
  title: string;
  status: string;
  impact?: string | null;
}

export interface ControlRiskMappingItem {
  risk: ControlRiskItem;
}

export interface ControlTestRunItem {
  id: string;
  executedAt: string;
  status: string;
  summary?: string | null;
  executionSource?: string | null;
  durationMs?: number | null;
}

export interface ControlTestItem {
  id: string;
  name: string;
  status: string;
  type?: string;
  completedAt?: string | null;
  lastRunAt?: string | null;
  lastResult?: string | null;
  // Latest run pulled by buildControlDetailInclude (audit-helpers.ts) — take 1
  // ordered desc by executedAt. Derive `latestRun = test.runs?.[0]` at render.
  runs?: ControlTestRunItem[];
}

export interface ControlTestMappingItem {
  test: ControlTestItem;
}

export interface ControlFindingItem {
  id: string;
  severity: string;
  status: string;
  description?: string;
  remediation?: string;
}

export interface AuditSnapshot {
  id: string;
  auditId: string;
  capturedAt: string;
  totalControls: number;
  compliantControls: number;
  nonCompliantControls: number;
  notApplicableControls: number;
  pendingControls: number;
  compliancePct: number;
  totalFindings: number;
  openFindings: number;
  closedFindings: number;
  majorFindings: number;
  minorFindings: number;
  observationFindings: number;
  ofiFindings: number;
  criticalRisks: number;
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
}

export interface AuditFindingRecord {
  id: string;
  auditId: string;
  controlId: string;
  severity: FindingSeverity;
  description: string;
  remediation: string | null;
  status: string;
  createdAt: string;
  control?: { id: string; isoReference: string; title: string };
}

export interface AuditControlRecord {
  id: string;
  auditId: string;
  controlId: string;
  reviewStatus: AuditControlStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  notes: string | null;
  control: {
    id: string;
    isoReference: string;
    title: string;
    status: string;
    description?: string;
    evidence?: ControlEvidenceItem[];
    policyMappings?: ControlPolicyMappingItem[];
    riskMappings?: ControlRiskMappingItem[];
    testMappings?: ControlTestMappingItem[];
    findings?: ControlFindingItem[];
    auditEvidences?: AuditEvidenceReview[];
  };
}

export interface AuditRecord {
  id: string;
  name: string;
  type: AuditType;
  frameworkId: string | null;
  frameworkName: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  startDate: string;
  endDate: string | null;
  status: AuditStatus;
  earlyAccessDate: string | null;
  startedAt: string | null;
  awaitingReportAt: string | null;
  assignedAuditorId: string | null;
  externalAuditorEmail: string | null;
  ownerId: string;
  organizationId: string;
  createdAt: string;
  closedAt: string | null;
  // Final report fields
  executiveSummary: string | null;
  auditConclusion: string | null;
  signedPdfUrl: string | null;
  signedAt: string | null;
  signedById: string | null;
  isLocked: boolean;
  findings: AuditFindingRecord[];
  auditControls?: AuditControlRecord[];
  snapshot?: AuditSnapshot | null;
  _count?: { auditControls: number };
}

/** Live metrics returned by GET /:id/report (before snapshot exists) */
export interface AuditReportMetrics {
  totalControls: number;
  compliantControls: number;
  nonCompliantControls: number;
  notApplicableControls: number;
  pendingControls: number;
  compliancePct: number;
  totalFindings: number;
  openFindings: number;
  closedFindings: number;
  majorFindings: number;
  minorFindings: number;
  observationFindings: number;
  ofiFindings: number;
}

export interface AuditReportResponse {
  audit: AuditRecord;
  metrics: AuditReportMetrics;
}

export interface AuditorInvitationRecord {
  id: string;
  email: string;
  role: AuditAuditorRole;
  expiresAt: string;
  acceptedAt: string | null;
  acceptedBy?: string | null;
  revokedAt: string | null;
  invitedBy?: string;
}

export interface PublicAuditorInvitation {
  auditName: string;
  organizationName: string;
  frameworkName: string | null;
  email: string;
  expiresAt: string;
  role: AuditAuditorRole;
}

export interface CreateAuditPayload {
  name: string;
  type: AuditType;
  frameworkId?: string;
  frameworkName?: string;
  periodStart?: string;
  periodEnd?: string;
  startDate: string;
  endDate?: string;
  earlyAccessDate?: string;
  assignedAuditorId?: string;
  auditorIds?: string[];
  externalAuditorEmail?: string;
  controlIds?: string[];
  allControls?: boolean;
}

export interface CreateFindingPayload {
  controlId: string;
  severity: FindingSeverity;
  description: string;
  remediation?: string;
  status?: string;
}

export interface AuditComment {
  id: string;
  auditId: string;
  controlId?: string | null;
  auditEvidenceId?: string | null;
  authorId: string;
  text: string;
  createdAt: string;
  author: {
    id: string;
    name?: string | null;
    email: string;
    role: string;
  };
}

export interface AuditRequestRecord {
  id: string;
  auditId: string;
  organizationId: string;
  controlId: string | null;
  title: string;
  description: string | null;
  status: AuditRequestStatus;
  dueDate: string | null;
  assignedTo: string | null;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  assignee?: {
    id: string;
    name?: string | null;
    email: string;
    role: string;
  } | null;
  evidenceLinks?: Array<{
    auditRequestId: string;
    evidenceId: string;
    linkedAt: string;
    evidence: ControlEvidenceItem & { controlId: string };
  }>;
}

// Cross-audit aggregation row returned by GET /api/audit-requests/my.
// Flattened (no nested audit/control objects) since the Todo UI only needs
// labels.
export interface MyAuditRequestRow {
  id: string;
  auditId: string;
  auditName: string;
  auditStatus: string;
  auditIsLocked: boolean;
  controlId: string | null;
  controlLabel: string | null;
  title: string;
  description: string | null;
  status: AuditRequestStatus;
  dueDate: string | null;
  linkedEvidenceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEvidenceSummaryItem {
  id: string;
  auditId: string;
  controlId: string;
  evidenceId: string;
  status: AuditEvidenceStatus;
  trackerStatus: AuditRequestStatus;
  flagReason: string | null;
  flaggedAt: string | null;
  approvedAt: string | null;
  createdAt: string;
  control: { id: string; isoReference: string; title: string };
  evidence: ControlEvidenceItem & { controlId: string };
  requests: Array<
    Pick<
      AuditRequestRecord,
      'id' | 'title' | 'status' | 'assignedTo' | 'dueDate'
    >
  >;
  commentCount: number;
}

export interface AuditEvidenceSummaryResponse {
  items: AuditEvidenceSummaryItem[];
  totals: {
    total: number;
    byStatus: Record<AuditRequestStatus, number>;
  };
}

export interface CreateAuditRequestPayload {
  controlId?: string | null;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  assignedTo?: string | null;
}

export type AuditDataSnapshotType = 'START' | 'COMPLETION';

export interface AuditSnapshotListItem {
  id: string;
  snapshotType: AuditDataSnapshotType;
  capturedAt: string;
}

export interface AuditDataSnapshotRecord extends AuditSnapshotListItem {
  auditId: string;
  organizationId: string;
  riskRegister?: unknown;
  assetInventory?: unknown;
  personnel?: unknown;
  integrations?: unknown;
}

export interface AuditFrameworkRequirement {
  frameworkRequirementId: string;
  code: string;
  title: string;
  domain?: string | null;
  isMandatory?: boolean;
  auditControlCount: number;
  compliantControlCount: number;
  nonCompliantControlCount: number;
  pendingControlCount: number;
  notApplicableControlCount: number;
}

export interface AuditFrameworkResponse {
  framework: {
    id: string;
    slug: string;
    name: string;
    version: string;
    description?: string | null;
  } | null;
  requirements: AuditFrameworkRequirement[];
}

export interface AuditSummaryResponse<TItem = Record<string, unknown>> {
  total: number;
  byStatus?: Record<string, number>;
  byImpact?: Record<string, number>;
  byCriticality?: Record<string, number>;
  byType?: Record<string, number>;
  byRole?: Record<string, number>;
  risks?: TItem[];
  assets?: TItem[];
  personnel?: TItem[];
  integrations?: TItem[];
}

export interface AuditListResponse {
  success: boolean;
  data: AuditRecord[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ── Service ───────────────────────────────────────────────────────────────────

export const auditsService = {
  list(params?: {
    type?: AuditType;
    status?: AuditStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    // Strip out undefined/empty values so they aren't sent as the string "undefined"
    const clean: Record<string, string> = {};
    if (
      params?.type &&
      (params.type as unknown) !== 'undefined' &&
      (params.type as unknown) !== 'all'
    )
      clean.type = params.type;
    if (
      params?.status &&
      (params.status as unknown) !== 'undefined' &&
      (params.status as unknown) !== 'all'
    )
      clean.status = params.status;
    if (
      params?.search &&
      params.search !== 'undefined' &&
      params.search !== 'all'
    )
      clean.search = params.search;
    if (params?.page !== undefined) clean.page = String(params.page);
    if (params?.limit !== undefined) clean.limit = String(params.limit);
    return apiClient.get<AuditListResponse>(
      '/api/audits',
      Object.keys(clean).length ? clean : undefined,
    );
  },

  get(id: string) {
    return apiClient.get<{ success: boolean; data: AuditRecord }>(
      `/api/audits/${id}`,
    );
  },

  create(payload: CreateAuditPayload) {
    return apiClient.post<{ success: boolean; data: AuditRecord }>(
      '/api/audits',
      payload,
    );
  },

  update(id: string, payload: Partial<CreateAuditPayload>) {
    return apiClient.patch<{ success: boolean; data: AuditRecord }>(
      `/api/audits/${id}`,
      payload,
    );
  },

  start(id: string) {
    return apiClient.post<{ success: boolean; data: AuditRecord }>(
      `/api/audits/${id}/start`,
    );
  },

  close(id: string) {
    return apiClient.post<{ success: boolean; data: AuditRecord }>(
      `/api/audits/${id}/close`,
    );
  },

  transitionToAwaitingReport(id: string) {
    return apiClient.post<{ success: boolean; data: AuditRecord }>(
      `/api/audits/${id}/transition-to-awaiting-report`,
    );
  },

  listControls(id: string) {
    return apiClient.get<{ success: boolean; data: AuditControlRecord[] }>(
      `/api/audits/${id}/controls`,
    );
  },

  getEvidenceSummary(id: string) {
    return apiClient.get<{
      success: boolean;
      data: AuditEvidenceSummaryResponse;
    }>(`/api/audits/${id}/evidence-summary`);
  },

  getFramework(auditId: string) {
    return apiClient.get<{ success: boolean; data: AuditFrameworkResponse }>(
      `/api/audits/${auditId}/framework`,
    );
  },

  getRiskSummary(auditId: string) {
    return apiClient.get<{ success: boolean; data: AuditSummaryResponse }>(
      `/api/audits/${auditId}/risk-summary`,
    );
  },

  getAssetSummary(auditId: string) {
    return apiClient.get<{ success: boolean; data: AuditSummaryResponse }>(
      `/api/audits/${auditId}/asset-summary`,
    );
  },

  getPersonnelSummary(auditId: string) {
    return apiClient.get<{ success: boolean; data: AuditSummaryResponse }>(
      `/api/audits/${auditId}/personnel-summary`,
    );
  },

  getIntegrationSummary(auditId: string) {
    return apiClient.get<{ success: boolean; data: AuditSummaryResponse }>(
      `/api/audits/${auditId}/integration-summary`,
    );
  },

  listSnapshots(auditId: string) {
    return apiClient.get<{ success: boolean; data: AuditSnapshotListItem[] }>(
      `/api/audits/${auditId}/snapshots`,
    );
  },

  getSnapshot(auditId: string, snapshotType: AuditDataSnapshotType) {
    return apiClient.get<{ success: boolean; data: AuditDataSnapshotRecord }>(
      `/api/audits/${auditId}/snapshots/${snapshotType}`,
    );
  },

  // ── Risk snapshots (auditor portal) ─────────────────────────────────────────
  // Auditor-portal view: only snapshots the org has explicitly shared AND that
  // fall inside this audit's observation window. Distinct from `listSnapshots`
  // (which lists AuditDataSnapshot — start/completion auto-captures).

  listRiskSnapshots(auditId: string) {
    return apiClient.get<{ success: boolean; data: RiskSnapshotRecord[] }>(
      `/api/audits/${auditId}/risk-snapshots`,
    );
  },

  getRiskSnapshotDetail(auditId: string, snapshotId: string) {
    return apiClient.get<{ success: boolean; data: RiskSnapshotRecord }>(
      `/api/audits/${auditId}/risk-snapshots/${snapshotId}`,
    );
  },

  updateControl(
    auditId: string,
    controlId: string,
    payload: { reviewStatus?: AuditControlStatus; notes?: string },
  ) {
    return apiClient.patch<{ success: boolean; data: AuditControlRecord }>(
      `/api/audits/${auditId}/controls/${controlId}`,
      payload,
    );
  },

  createFinding(auditId: string, payload: CreateFindingPayload) {
    return apiClient.post<{ success: boolean; data: AuditFindingRecord }>(
      `/api/audits/${auditId}/findings`,
      payload,
    );
  },

  updateFinding(
    auditId: string,
    findingId: string,
    payload: Partial<Omit<CreateFindingPayload, 'controlId'>>,
  ) {
    return apiClient.patch<{ success: boolean; data: AuditFindingRecord }>(
      `/api/audits/${auditId}/findings/${findingId}`,
      payload,
    );
  },

  deleteFinding(auditId: string, findingId: string) {
    return apiClient.delete<{ success: boolean }>(
      `/api/audits/${auditId}/findings/${findingId}`,
    );
  },

  // ── Requests ────────────────────────────────────────────────────────────────

  listRequests(
    auditId: string,
    params?: {
      controlId?: string;
      status?: AuditRequestStatus;
      assignedTo?: string;
    },
  ) {
    return apiClient.get<{ success: boolean; data: AuditRequestRecord[] }>(
      `/api/audits/${auditId}/requests`,
      params,
    );
  },

  createRequest(auditId: string, payload: CreateAuditRequestPayload) {
    return apiClient.post<{ success: boolean; data: AuditRequestRecord }>(
      `/api/audits/${auditId}/requests`,
      payload,
    );
  },

  updateRequest(
    auditId: string,
    requestId: string,
    payload: Partial<CreateAuditRequestPayload> & {
      status?: AuditRequestStatus;
    },
  ) {
    return apiClient.patch<{ success: boolean; data: AuditRequestRecord }>(
      `/api/audits/${auditId}/requests/${requestId}`,
      payload,
    );
  },

  deleteRequest(auditId: string, requestId: string) {
    return apiClient.delete<{ success: boolean }>(
      `/api/audits/${auditId}/requests/${requestId}`,
    );
  },

  // Cross-audit aggregation for the Todo page. Backend per-audit list at
  // /api/audits/:id/requests already filters by assignee for non-audit
  // roles; this endpoint returns the same caller's requests across audits.
  listMyAuditRequests(params?: { includeClosed?: boolean }) {
    const query = params?.includeClosed ? { includeClosed: 'true' } : undefined;
    return apiClient.get<{ success: boolean; data: MyAuditRequestRow[] }>(
      '/api/audit-requests/my',
      query,
    );
  },

  linkRequestEvidence(
    auditId: string,
    requestId: string,
    payload: { evidenceId: string; action?: 'link' | 'unlink' },
  ) {
    return apiClient.post<{ success: boolean; data: AuditRequestRecord }>(
      `/api/audits/${auditId}/requests/${requestId}/evidence`,
      payload,
    );
  },

  // ── Auditor invitations ────────────────────────────────────────────────────

  listInvitations(auditId: string) {
    return apiClient.get<{ success: boolean; data: AuditorInvitationRecord[] }>(
      `/api/audits/${auditId}/invitations`,
    );
  },

  createInvitation(
    auditId: string,
    payload: { email: string; role?: AuditAuditorRole; expiresAt?: string },
  ) {
    return apiClient.post<{ success: boolean; data: AuditorInvitationRecord }>(
      `/api/audits/${auditId}/invitations`,
      payload,
    );
  },

  revokeInvitation(auditId: string, invitationId: string) {
    return apiClient.delete<{ success: boolean }>(
      `/api/audits/${auditId}/invitations/${invitationId}`,
    );
  },

  getPublicInvitation(secret: string) {
    return apiClient.get<{ success: boolean; data: PublicAuditorInvitation }>(
      `/api/auditor-invitations/${secret}`,
    );
  },

  acceptPublicInvitation(secret: string) {
    return apiClient.post<{
      success: boolean;
      token: string;
      user: {
        id: string;
        email: string;
        name: string | null;
        role: string;
        organizationId: string;
        preferredLocale?: string;
        createdAt?: string;
      };
      redirectTo: string;
    }>(`/api/auditor-invitations/${secret}/accept`);
  },

  // ── Final Report ────────────────────────────────────────────────────────────

  /** Get final report draft + live metrics */
  getReport(auditId: string) {
    return apiClient.get<{ success: boolean; data: AuditReportResponse }>(
      `/api/audits/${auditId}/report`,
    );
  },

  /** Update executive summary / conclusion / PDF URL */
  updateReport(
    auditId: string,
    payload: {
      executiveSummary?: string | null;
      auditConclusion?: string | null;
      signedPdfUrl?: string | null;
    },
  ) {
    return apiClient.patch<{ success: boolean; data: AuditRecord }>(
      `/api/audits/${auditId}/report`,
      payload,
    );
  },

  /** Sign & complete — locks audit, captures snapshot, → COMPLETED */
  signAndComplete(auditId: string) {
    return apiClient.post<{ success: boolean; data: AuditRecord }>(
      `/api/audits/${auditId}/sign-and-complete`,
    );
  },

  generateReportPdf(auditId: string) {
    return apiClient.post<{
      success: boolean;
      message: string;
      auditId: string;
      auditName: string;
      existingPdfUrl: string | null;
    }>(`/api/reports/audits/${auditId}/pdf`);
  },

  // ── Comments ────────────────────────────────────────────────────────────────

  listComments(
    auditId: string,
    filters?: { controlId?: string; auditEvidenceId?: string },
  ) {
    const params =
      filters && Object.keys(filters).length > 0 ? filters : undefined;
    return apiClient.get<{ success: boolean; data: AuditComment[] }>(
      `/api/audits/${auditId}/comments`,
      params,
    );
  },

  postComment(
    auditId: string,
    payload: {
      text: string;
      controlId?: string | null;
      auditEvidenceId?: string | null;
    },
  ) {
    return apiClient.post<{ success: boolean; data: AuditComment }>(
      `/api/audits/${auditId}/comments`,
      payload,
    );
  },

  deleteComment(auditId: string, commentId: string) {
    return apiClient.delete<{ success: boolean }>(
      `/api/audits/${auditId}/comments/${commentId}`,
    );
  },

  // ── Evidence review (approve / flag / ready) ─────────────────────────────

  approveEvidence(
    auditId: string,
    auditControlId: string,
    auditEvidenceId: string,
  ) {
    return apiClient.patch<{ success: boolean; data: AuditEvidenceReview }>(
      `/api/audits/${auditId}/controls/${auditControlId}/evidence/${auditEvidenceId}/approve`,
    );
  },

  flagEvidence(
    auditId: string,
    auditControlId: string,
    auditEvidenceId: string,
    reason: string,
  ) {
    return apiClient.patch<{ success: boolean; data: AuditEvidenceReview }>(
      `/api/audits/${auditId}/controls/${auditControlId}/evidence/${auditEvidenceId}/flag`,
      { reason },
    );
  },

  readyEvidence(
    auditId: string,
    auditControlId: string,
    auditEvidenceId: string,
  ) {
    return apiClient.patch<{ success: boolean; data: AuditEvidenceReview }>(
      `/api/audits/${auditId}/controls/${auditControlId}/evidence/${auditEvidenceId}/ready`,
    );
  },
};
