import { apiClient } from './client';

// ── Enums / unions ────────────────────────────────────────────────────────────

export type TrustDocumentCategory =
  | 'POLICY'
  | 'REPORT'
  | 'CERTIFICATE'
  | 'WHITEPAPER'
  | 'OTHER';
export type TrustAccessStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type TrustAnnouncementType =
  | 'SECURITY_UPDATE'
  | 'INCIDENT'
  | 'CERTIFICATION'
  | 'GENERAL';

// ── Interface shapes ──────────────────────────────────────────────────────────

export interface TrustCenterSettings {
  id: string;
  organizationId: string;
  enabled: boolean;
  orgSlug: string;
  logoUrl: string | null;
  primaryColor: string;
  description: string | null;
  securityEmail: string | null;
  slackApprovalChannelId: string | null;
  // Phase E.2 — Header designer.
  headerCoverImageUrl: string | null;
  headerLayout: 'COMPACT' | 'HERO' | 'GRADIENT';
  headerTagline: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface TrustComplianceSnapshot {
  total: number;
  implemented: number;
  partial: number;
  pct: number;
  openRisks: number;
  lastAudit: { name: string; closedAt: string } | null;
}

export interface TrustSettingsResponse {
  settings: TrustCenterSettings;
  snapshot: TrustComplianceSnapshot;
}

export interface TrustDocument {
  id: string;
  organizationId: string;
  name: string;
  category: TrustDocumentCategory;
  fileUrl: string;
  // Phase B 4-state visibility. Legacy boolean pair below stays for
  // backwards compat until the FE swap completes.
  visibility?: 'PUBLIC' | 'SHAREABLE' | 'REQUESTABLE' | 'PRIVATE';
  ownerId?: string | null;
  description?: string | null;
  expiresAt?: string | null;
  verifiedAt?: string | null;
  reviewCadence?: string | null;
  versionGroupId?: string | null;
  useForQuestionnaires?: boolean;
  requiresNda: boolean;
  publicVisible: boolean;
  version: string | null;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrustAccessRequest {
  id: string;
  organizationId: string;
  requesterName: string;
  requesterEmail: string;
  company: string | null;
  purpose: string | null;
  documentId: string | null;
  status: TrustAccessStatus;
  ndaSigned: boolean;
  approvalToken: string | null;
  approvedBy: string | null;
  createdAt: string;
  approvedAt: string | null;
  expiresAt: string | null;
  document: {
    id: string;
    name: string;
    category: TrustDocumentCategory;
  } | null;
}

export interface TrustAnnouncement {
  id: string;
  organizationId: string;
  title: string;
  content: string;
  type: TrustAnnouncementType;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TrustMetricsSnapshot {
  id: string;
  organizationId: string;
  frameworkName: string;
  compliancePercentage: number;
  controlCount: number;
  completedControls: number;
  snapshotDate: string;
}

export interface TrustQuestionnaireRequest {
  id: string;
  organizationId: string;
  requesterEmail: string;
  questionnaireType: string;
  status: string;
  responseFileUrl: string | null;
  notes: string | null;
  createdAt: string;
  respondedAt: string | null;
}

// AI response generation for trust center questionnaire requests
export interface TrustQuestionnaireDraftResponse {
  question: string;
  generationId: string;
  draftAnswer: string;
  confidence: string;
  citations: unknown[];
}

export interface TrustQuestionnaireAiResult {
  requestId: string;
  requesterEmail: string;
  questionnaireType: string;
  draftResponses: TrustQuestionnaireDraftResponse[];
  note: string;
}

// Public portal shapes
export interface PublicTrustDocument {
  id: string;
  name: string;
  category: TrustDocumentCategory;
  requiresNda: boolean;
  version: string | null;
  fileUrl: string;
}

export interface PublicTrustData {
  settings: {
    orgSlug: string;
    logoUrl: string | null;
    primaryColor: string;
    description: string | null;
    securityEmail: string | null;
    orgName: string;
    // Phase E.2 — Header designer (all nullable; layout defaults to COMPACT).
    headerCoverImageUrl?: string | null;
    headerLayout?: 'COMPACT' | 'HERO' | 'GRADIENT';
    headerTagline?: string | null;
  };
  documents: PublicTrustDocument[];
  announcements: {
    id: string;
    title: string;
    content: string;
    type: TrustAnnouncementType;
    createdAt: string;
  }[];
  metricsSnapshot: TrustMetricsSnapshot | null;
  lastAudit: { name: string; type: string; closedAt: string } | null;
}

// Create/update payloads
export interface UpdateSettingsPayload {
  enabled?: boolean;
  orgSlug?: string;
  logoUrl?: string | null;
  primaryColor?: string;
  description?: string | null;
  securityEmail?: string | null;
  slackApprovalChannelId?: string | null;
  // Phase E.2 — Header designer.
  headerCoverImageUrl?: string | null;
  headerLayout?: 'COMPACT' | 'HERO' | 'GRADIENT';
  headerTagline?: string | null;
}

export interface CreateDocumentPayload {
  name: string;
  category: TrustDocumentCategory;
  fileUrl: string;
  requiresNda?: boolean;
  publicVisible?: boolean;
  version?: string | null;
}

export interface CreateAnnouncementPayload {
  title: string;
  content: string;
  type?: TrustAnnouncementType;
  published?: boolean;
}

export interface PublicAccessRequestPayload {
  requesterName: string;
  requesterEmail: string;
  company?: string;
  purpose?: string;
  documentId?: string;
  ndaSigned?: boolean;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const trustCenterService = {
  // Settings
  getSettings(): Promise<{ success: boolean; data: TrustSettingsResponse }> {
    return apiClient.get('/api/trust/settings');
  },
  updateSettings(
    payload: UpdateSettingsPayload,
  ): Promise<{ success: boolean; data: TrustCenterSettings }> {
    return apiClient.put('/api/trust/settings', payload);
  },

  // Documents
  listDocuments(): Promise<{ success: boolean; data: TrustDocument[] }> {
    return apiClient.get('/api/trust/documents');
  },
  createDocument(
    payload: CreateDocumentPayload,
  ): Promise<{ success: boolean; data: TrustDocument }> {
    return apiClient.post('/api/trust/documents', payload);
  },
  updateDocument(
    id: string,
    payload: Partial<CreateDocumentPayload>,
  ): Promise<{ success: boolean; data: TrustDocument }> {
    return apiClient.patch(`/api/trust/documents/${id}`, payload);
  },
  deleteDocument(id: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/api/trust/documents/${id}`);
  },

  // Access Requests
  listAccessRequests(): Promise<{
    success: boolean;
    data: TrustAccessRequest[];
  }> {
    return apiClient.get('/api/trust/access-requests');
  },
  decideAccessRequest(
    id: string,
    status: 'APPROVED' | 'REJECTED',
  ): Promise<{ success: boolean; data: TrustAccessRequest }> {
    return apiClient.patch(`/api/trust/access-requests/${id}`, { status });
  },

  // Announcements
  listAnnouncements(): Promise<{
    success: boolean;
    data: TrustAnnouncement[];
  }> {
    return apiClient.get('/api/trust/announcements');
  },
  createAnnouncement(
    payload: CreateAnnouncementPayload,
  ): Promise<{ success: boolean; data: TrustAnnouncement }> {
    return apiClient.post('/api/trust/announcements', payload);
  },
  updateAnnouncement(
    id: string,
    payload: Partial<CreateAnnouncementPayload>,
  ): Promise<{ success: boolean; data: TrustAnnouncement }> {
    return apiClient.patch(`/api/trust/announcements/${id}`, payload);
  },
  deleteAnnouncement(id: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/api/trust/announcements/${id}`);
  },

  // Questionnaire Requests
  listQuestionnaireRequests(): Promise<{
    success: boolean;
    data: TrustQuestionnaireRequest[];
  }> {
    return apiClient.get('/api/trust/questionnaire-requests');
  },
  updateQuestionnaireRequest(
    id: string,
    payload: {
      status?: string;
      responseFileUrl?: string | null;
      notes?: string | null;
    },
  ): Promise<{ success: boolean; data: TrustQuestionnaireRequest }> {
    return apiClient.patch(`/api/trust/questionnaire-requests/${id}`, payload);
  },
  /**
   * AI-4: Generate draft responses for a trust center questionnaire request.
   * Sends the questions through the questionnaire assistant (RAG pipeline).
   * Results are PENDING_REVIEW — must be reviewed and approved before sending.
   */
  generateAiResponse(
    id: string,
    questions: string[],
  ): Promise<{ success: boolean; data?: never } & TrustQuestionnaireAiResult> {
    return apiClient.post(
      `/api/trust/questionnaire-requests/${id}/generate-response`,
      { questions },
    );
  },

  // Metrics Snapshot
  triggerSnapshot(): Promise<{ success: boolean; data: TrustMetricsSnapshot }> {
    return apiClient.post('/api/trust/metrics/snapshot');
  },

  // Public (no auth)
  getPublicPortal(
    orgSlug: string,
  ): Promise<{ success: boolean; data: PublicTrustData }> {
    return apiClient.get(`/api/trust/public/${orgSlug}`);
  },
  submitAccessRequest(
    orgSlug: string,
    payload: PublicAccessRequestPayload,
  ): Promise<{ success: boolean; data: { id: string } }> {
    return apiClient.post(
      `/api/trust/public/${orgSlug}/request-access`,
      payload,
    );
  },
  submitQuestionnaireRequest(
    orgSlug: string,
    payload: { requesterEmail: string; questionnaireType?: string },
  ): Promise<{ success: boolean; data: { id: string } }> {
    return apiClient.post(
      `/api/trust/public/${orgSlug}/request-questionnaire`,
      payload,
    );
  },

  // Phase D2 — viewer GDPR erasure (public, no auth).
  requestErasure(
    orgSlug: string,
    payload: { email: string },
  ): Promise<{ status: 'accepted' }> {
    return apiClient.post(
      `/api/trust/public/${orgSlug}/erasure/request`,
      payload,
    );
  },
  executeErasure(
    orgSlug: string,
    payload: { token: string },
  ): Promise<{ success: boolean }> {
    return apiClient.post(
      `/api/trust/public/${orgSlug}/erasure/execute`,
      payload,
    );
  },

  // ── Phase B ─────────────────────────────────────────────────────────────

  // NDAs
  listNdas(): Promise<{ success: boolean; data: TrustNda[] }> {
    return apiClient.get('/api/customer-trust/ndas');
  },
  createNda(payload: {
    name: string;
    content: string;
    isDefault?: boolean;
  }): Promise<{ success: boolean; data: TrustNda }> {
    return apiClient.post('/api/customer-trust/ndas', payload);
  },
  updateNda(
    id: string,
    payload: Partial<{ name: string; content: string; isDefault: boolean }>,
  ): Promise<{ success: boolean; data: TrustNda }> {
    return apiClient.patch(`/api/customer-trust/ndas/${id}`, payload);
  },
  deleteNda(id: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/api/customer-trust/ndas/${id}`);
  },

  // Auto-approval rules
  listAutoApprovalRules(): Promise<{
    success: boolean;
    data: TrustAutoApprovalRule[];
  }> {
    return apiClient.get('/api/customer-trust/auto-approval-rules');
  },
  createAutoApprovalRule(payload: {
    name: string;
    matchType: AutoApprovalMatchType;
    matchValue: string;
    action: AutoApprovalAction;
    enabled?: boolean;
    priority?: number;
  }): Promise<{
    success: boolean;
    data: TrustAutoApprovalRule;
    warning?: string;
  }> {
    return apiClient.post('/api/customer-trust/auto-approval-rules', payload);
  },
  updateAutoApprovalRule(
    id: string,
    payload: Partial<{
      name: string;
      matchType: AutoApprovalMatchType;
      matchValue: string;
      action: AutoApprovalAction;
      enabled: boolean;
      priority: number;
    }>,
  ): Promise<{ success: boolean; data: TrustAutoApprovalRule }> {
    return apiClient.patch(
      `/api/customer-trust/auto-approval-rules/${id}`,
      payload,
    );
  },
  deleteAutoApprovalRule(id: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/api/customer-trust/auto-approval-rules/${id}`);
  },

  // Subscribers
  listSubscribers(): Promise<{
    success: boolean;
    data: TrustSubscriber[];
  }> {
    return apiClient.get('/api/customer-trust/subscribers');
  },
  deleteSubscriber(id: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/api/customer-trust/subscribers/${id}`);
  },

  // Knowledge Base + share link
  setDocumentVisibility(
    id: string,
    visibility: TrustResourceVisibility,
  ): Promise<{ success: boolean; data: TrustDocument }> {
    return apiClient.patch(`/api/customer-trust/documents/${id}/visibility`, {
      visibility,
    });
  },
  verifyDocument(
    id: string,
  ): Promise<{ success: boolean; data: TrustDocument }> {
    return apiClient.patch(`/api/customer-trust/documents/${id}/verify`, {});
  },
  mintShareLink(
    id: string,
    ttlDays?: number,
  ): Promise<{
    success: boolean;
    data: { url: string; token: string; expiresAt: string };
  }> {
    return apiClient.post(`/api/customer-trust/documents/${id}/share-link`, {
      ttlDays,
    });
  },
};

// ── Phase B types ──────────────────────────────────────────────────────────

export type TrustResourceVisibility =
  | 'PUBLIC'
  | 'SHAREABLE'
  | 'REQUESTABLE'
  | 'PRIVATE';

export type AutoApprovalMatchType =
  | 'DOMAIN_EXACT'
  | 'DOMAIN_SUFFIX'
  | 'CRM_CONTACT_EXISTS'
  | 'CRM_ACCOUNT_OPP_STAGE';

export type AutoApprovalAction = 'APPROVE' | 'APPROVE_BYPASS_NDA' | 'DENY';

export interface TrustNda {
  id: string;
  organizationId: string;
  name: string;
  content: string;
  version: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TrustAutoApprovalRule {
  id: string;
  organizationId: string;
  name: string;
  matchType: AutoApprovalMatchType;
  matchValue: string;
  action: AutoApprovalAction;
  enabled: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface TrustSubscriber {
  id: string;
  email: string;
  name: string | null;
  confirmedAt: string | null;
  unsubscribedAt: string | null;
  createdAt: string;
}
