import { apiClient } from './client';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AuditType    = 'INTERNAL' | 'EXTERNAL' | 'SURVEILLANCE' | 'RECERTIFICATION';
export type AuditStatus  = 'DRAFT' | 'UPCOMING' | 'PLANNED' | 'IN_PROGRESS' | 'AWAITING_REPORT' | 'COMPLETED';
export type AuditControlStatus = 'PENDING' | 'COMPLIANT' | 'NON_COMPLIANT' | 'NOT_APPLICABLE';
export type FindingSeverity = 'MINOR' | 'MAJOR' | 'OBSERVATION' | 'OFI';
export type AuditEvidenceStatus = 'PENDING' | 'READY' | 'FLAGGED' | 'APPROVED';
export type AuditRequestStatus = 'NOT_READY' | 'IN_REVIEW' | 'READY_FOR_AUDIT' | 'FLAGGED' | 'ACCEPTED' | 'NOT_APPLICABLE';

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
  id: string;          // AuditEvidence.id
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

export interface ControlTestItem {
  id: string;
  name: string;
  status: string;
  completedAt?: string | null;
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
  id:                    string;
  auditId:               string;
  capturedAt:            string;
  totalControls:         number;
  compliantControls:     number;
  nonCompliantControls:  number;
  notApplicableControls: number;
  pendingControls:       number;
  compliancePct:         number;
  totalFindings:         number;
  openFindings:          number;
  closedFindings:        number;
  majorFindings:         number;
  minorFindings:         number;
  observationFindings:   number;
  ofiFindings:           number;
  criticalRisks:         number;
  highRisks:             number;
  mediumRisks:           number;
  lowRisks:              number;
}

export interface AuditFindingRecord {
  id:          string;
  auditId:     string;
  controlId:   string;
  severity:    FindingSeverity;
  description: string;
  remediation: string | null;
  status:      string;
  createdAt:   string;
  control?: { id: string; isoReference: string; title: string };
}

export interface AuditControlRecord {
  id:           string;
  auditId:      string;
  controlId:    string;
  reviewStatus: AuditControlStatus;
  reviewedBy:   string | null;
  reviewedAt:   string | null;
  notes:        string | null;
  control: {
    id:           string;
    isoReference: string;
    title:        string;
    status:       string;
    description?: string;
    evidence?:    ControlEvidenceItem[];
    policyMappings?: ControlPolicyMappingItem[];
    riskMappings?: ControlRiskMappingItem[];
    testMappings?: ControlTestMappingItem[];
    findings?:    ControlFindingItem[];
    auditEvidences?: AuditEvidenceReview[];
  };
}

export interface AuditRecord {
  id:                   string;
  name:                 string;
  type:                 AuditType;
  frameworkId:          string | null;
  frameworkName:        string | null;
  periodStart:          string | null;
  periodEnd:            string | null;
  startDate:            string;
  endDate:              string | null;
  status:               AuditStatus;
  earlyAccessDate:      string | null;
  startedAt:            string | null;
  awaitingReportAt:     string | null;
  assignedAuditorId:    string | null;
  externalAuditorEmail: string | null;
  ownerId:              string;
  organizationId:       string;
  createdAt:            string;
  closedAt:             string | null;
  // Final report fields
  executiveSummary:     string | null;
  auditConclusion:      string | null;
  signedPdfUrl:         string | null;
  signedAt:             string | null;
  signedById:           string | null;
  isLocked:             boolean;
  findings:             AuditFindingRecord[];
  auditControls?:       AuditControlRecord[];
  snapshot?:            AuditSnapshot | null;
  _count?:              { auditControls: number };
}

/** Live metrics returned by GET /:id/report (before snapshot exists) */
export interface AuditReportMetrics {
  totalControls:         number;
  compliantControls:     number;
  nonCompliantControls:  number;
  notApplicableControls: number;
  pendingControls:       number;
  compliancePct:         number;
  totalFindings:         number;
  openFindings:          number;
  closedFindings:        number;
  majorFindings:         number;
  minorFindings:         number;
  observationFindings:   number;
  ofiFindings:           number;
}

export interface AuditReportResponse {
  audit:   AuditRecord;
  metrics: AuditReportMetrics;
}

export interface CreateAuditPayload {
  name:                  string;
  type:                  AuditType;
  frameworkId?:          string;
  frameworkName?:        string;
  periodStart?:          string;
  periodEnd?:            string;
  startDate:             string;
  endDate?:              string;
  earlyAccessDate?:      string;
  assignedAuditorId?:    string;
  auditorIds?:           string[];
  externalAuditorEmail?: string;
  controlIds?:           string[];
  allControls?:          boolean;
}

export interface CreateFindingPayload {
  controlId:    string;
  severity:     FindingSeverity;
  description:  string;
  remediation?: string;
  status?:      string;
}

export interface AuditComment {
  id:         string;
  auditId:    string;
  controlId?: string | null;
  auditEvidenceId?: string | null;
  authorId:   string;
  text:       string;
  createdAt:  string;
  author: {
    id:    string;
    name?: string | null;
    email: string;
    role:  string;
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
  assignee?: { id: string; name?: string | null; email: string; role: string } | null;
  evidenceLinks?: Array<{
    auditRequestId: string;
    evidenceId: string;
    linkedAt: string;
    evidence: ControlEvidenceItem & { controlId: string };
  }>;
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
  requests: Array<Pick<AuditRequestRecord, 'id' | 'title' | 'status' | 'assignedTo' | 'dueDate'>>;
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

// ── Service ───────────────────────────────────────────────────────────────────

export const auditsService = {
  list(params?: { type?: AuditType; status?: AuditStatus; search?: string }) {
    // Strip out undefined/empty values so they aren't sent as the string "undefined"
    const clean: Record<string, string> = {};
    if (params?.type   && (params.type   as unknown) !== 'undefined' && (params.type   as unknown) !== 'all') clean.type   = params.type;
    if (params?.status && (params.status as unknown) !== 'undefined' && (params.status as unknown) !== 'all') clean.status = params.status;
    if (params?.search && params.search !== 'undefined' && params.search !== 'all') clean.search = params.search;
    return apiClient.get<{ success: boolean; data: AuditRecord[] }>('/api/audits', Object.keys(clean).length ? clean : undefined);
  },

  get(id: string) {
    return apiClient.get<{ success: boolean; data: AuditRecord }>(`/api/audits/${id}`);
  },

  create(payload: CreateAuditPayload) {
    return apiClient.post<{ success: boolean; data: AuditRecord }>('/api/audits', payload);
  },

  update(id: string, payload: Partial<CreateAuditPayload>) {
    return apiClient.patch<{ success: boolean; data: AuditRecord }>(`/api/audits/${id}`, payload);
  },

  start(id: string) {
    return apiClient.post<{ success: boolean; data: AuditRecord }>(`/api/audits/${id}/start`);
  },

  close(id: string) {
    return apiClient.post<{ success: boolean; data: AuditRecord }>(`/api/audits/${id}/close`);
  },

  transitionToAwaitingReport(id: string) {
    return apiClient.post<{ success: boolean; data: AuditRecord }>(`/api/audits/${id}/transition-to-awaiting-report`);
  },

  listControls(id: string) {
    return apiClient.get<{ success: boolean; data: AuditControlRecord[] }>(`/api/audits/${id}/controls`);
  },

  getEvidenceSummary(id: string) {
    return apiClient.get<{ success: boolean; data: AuditEvidenceSummaryResponse }>(`/api/audits/${id}/evidence-summary`);
  },

  updateControl(auditId: string, controlId: string, payload: { reviewStatus?: AuditControlStatus; notes?: string }) {
    return apiClient.patch<{ success: boolean; data: AuditControlRecord }>(`/api/audits/${auditId}/controls/${controlId}`, payload);
  },

  createFinding(auditId: string, payload: CreateFindingPayload) {
    return apiClient.post<{ success: boolean; data: AuditFindingRecord }>(`/api/audits/${auditId}/findings`, payload);
  },

  updateFinding(auditId: string, findingId: string, payload: Partial<Omit<CreateFindingPayload, 'controlId'>>) {
    return apiClient.patch<{ success: boolean; data: AuditFindingRecord }>(`/api/audits/${auditId}/findings/${findingId}`, payload);
  },

  deleteFinding(auditId: string, findingId: string) {
    return apiClient.delete<{ success: boolean }>(`/api/audits/${auditId}/findings/${findingId}`);
  },

  // ── Requests ────────────────────────────────────────────────────────────────

  listRequests(auditId: string, params?: { controlId?: string; status?: AuditRequestStatus; assignedTo?: string }) {
    return apiClient.get<{ success: boolean; data: AuditRequestRecord[] }>(`/api/audits/${auditId}/requests`, params);
  },

  createRequest(auditId: string, payload: CreateAuditRequestPayload) {
    return apiClient.post<{ success: boolean; data: AuditRequestRecord }>(`/api/audits/${auditId}/requests`, payload);
  },

  updateRequest(auditId: string, requestId: string, payload: Partial<CreateAuditRequestPayload> & { status?: AuditRequestStatus }) {
    return apiClient.patch<{ success: boolean; data: AuditRequestRecord }>(`/api/audits/${auditId}/requests/${requestId}`, payload);
  },

  deleteRequest(auditId: string, requestId: string) {
    return apiClient.delete<{ success: boolean }>(`/api/audits/${auditId}/requests/${requestId}`);
  },

  linkRequestEvidence(auditId: string, requestId: string, payload: { evidenceId: string; action?: 'link' | 'unlink' }) {
    return apiClient.post<{ success: boolean; data: AuditRequestRecord }>(`/api/audits/${auditId}/requests/${requestId}/evidence`, payload);
  },

  // ── Final Report ────────────────────────────────────────────────────────────

  /** Get final report draft + live metrics */
  getReport(auditId: string) {
    return apiClient.get<{ success: boolean; data: AuditReportResponse }>(`/api/audits/${auditId}/report`);
  },

  /** Update executive summary / conclusion / PDF URL */
  updateReport(auditId: string, payload: {
    executiveSummary?: string | null;
    auditConclusion?:  string | null;
    signedPdfUrl?:     string | null;
  }) {
    return apiClient.patch<{ success: boolean; data: AuditRecord }>(`/api/audits/${auditId}/report`, payload);
  },

  /** Sign & complete — locks audit, captures snapshot, → COMPLETED */
  signAndComplete(auditId: string) {
    return apiClient.post<{ success: boolean; data: AuditRecord }>(`/api/audits/${auditId}/sign-and-complete`);
  },

  // ── Comments ────────────────────────────────────────────────────────────────

  listComments(auditId: string, filters?: { controlId?: string; auditEvidenceId?: string }) {
    const params = filters && Object.keys(filters).length > 0 ? filters : undefined;
    return apiClient.get<{ success: boolean; data: AuditComment[] }>(`/api/audits/${auditId}/comments`, params);
  },

  postComment(auditId: string, payload: { text: string; controlId?: string | null; auditEvidenceId?: string | null }) {
    return apiClient.post<{ success: boolean; data: AuditComment }>(`/api/audits/${auditId}/comments`, payload);
  },

  deleteComment(auditId: string, commentId: string) {
    return apiClient.delete<{ success: boolean }>(`/api/audits/${auditId}/comments/${commentId}`);
  },

  // ── Evidence review (approve / flag / ready) ─────────────────────────────

  approveEvidence(auditId: string, auditControlId: string, auditEvidenceId: string) {
    return apiClient.patch<{ success: boolean; data: AuditEvidenceReview }>(
      `/api/audits/${auditId}/controls/${auditControlId}/evidence/${auditEvidenceId}/approve`,
    );
  },

  flagEvidence(auditId: string, auditControlId: string, auditEvidenceId: string, reason: string) {
    return apiClient.patch<{ success: boolean; data: AuditEvidenceReview }>(
      `/api/audits/${auditId}/controls/${auditControlId}/evidence/${auditEvidenceId}/flag`,
      { reason },
    );
  },

  readyEvidence(auditId: string, auditControlId: string, auditEvidenceId: string) {
    return apiClient.patch<{ success: boolean; data: AuditEvidenceReview }>(
      `/api/audits/${auditId}/controls/${auditControlId}/evidence/${auditEvidenceId}/ready`,
    );
  },
};
