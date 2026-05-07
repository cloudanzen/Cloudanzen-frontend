import { apiClient } from './client';

export type FindingSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type FindingStatus =
  | 'OPEN'
  | 'IN_REMEDIATION'
  | 'READY_FOR_REVIEW'
  | 'CLOSED';

export interface FindingRemediationRecord {
  id: string;
  findingId: string;
  organizationId: string;
  note: string;
  status: string;
  createdBy: string | null;
  createdAt: string;
}

export interface FindingRecord {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  severity: FindingSeverity;
  status: FindingStatus;
  controlId: string | null;
  testRunId: string | null;
  policyId: string | null;
  assetId: string | null;
  riskId: string | null;
  remediationOwner: string | null;
  dueAt: string | null;
  sourceType: 'TEST_RUN' | 'AUDIT' | 'MANUAL' | 'VENDOR_REVIEW' | 'VENDOR_AUTOMATED';
  // Vendor lifecycle linkage. Both nullable; only set when the finding came
  // from a vendor review or was manually tagged to a vendor.
  vendorId: string | null;
  vendorReviewId: string | null;
  createdAt: string;
  updatedAt: string;
  ageInDays?: number;
  slaBreached?: boolean;
  control?: { id: string; isoReference: string; title: string } | null;
  policy?: { id: string; name: string; versionNumber: number; status: string } | null;
  asset?: { id: string; name: string; type: string } | null;
  risk?: { id: string; title: string; status: string } | null;
  testRun?: {
    id: string;
    status: 'Pass' | 'Fail' | 'Warning' | 'Not_Run';
    executedAt: string;
    summary: string;
    executionSource?: string | null;
    executedBy?: string | null;
    assetId?: string | null;
    correlationId?: string | null;
    startedAt?: string | null;
    durationMs?: number | null;
  } | null;
  vendor?: { id: string; name: string } | null;
  vendorReview?: { id: string; cycleNumber: number; status: string } | null;
  remediations?: FindingRemediationRecord[];
}

export interface ListFindingsParams {
  severity?: FindingSeverity;
  status?: FindingStatus;
  controlId?: string;
  assetId?: string;
  remediationOwner?: string;
  sourceType?: 'TEST_RUN' | 'AUDIT' | 'MANUAL' | 'VENDOR_REVIEW' | 'VENDOR_AUTOMATED';
  vendorId?: string;
  vendorReviewId?: string;
}

export interface UpdateFindingRequest {
  status?: FindingStatus;
  dueAt?: string | null;
  remediationOwner?: string | null;
}

// Manual finding creation (Vanta parity, Phase 1). Used by the vendor review
// UI to log a gap discovered during diligence.
export interface CreateFindingRequest {
  title: string;
  description?: string | null;
  severity: FindingSeverity;
  sourceType?: 'VENDOR_REVIEW' | 'VENDOR_AUTOMATED' | 'MANUAL';
  vendorId?: string | null;
  vendorReviewId?: string | null;
  controlId?: string | null;
  riskId?: string | null;
  assetId?: string | null;
  remediationOwner?: string | null;
  dueAt?: string | null;
}

export const findingsService = {
  /**
   * Fetch active (non-CLOSED) automated findings linked to a specific test.
   * Used by RemediationGuide when autoRemediationSupported=true to show
   * real remediation engine status instead of static guidance.
   */
  listByTestId(testId: string): Promise<FindingRecord[]> {
    return apiClient
      .get<{
        success: boolean;
        data: FindingRecord[];
      }>(`/api/tests/${testId}/findings`)
      .then((res) => res.data);
  },

  list(params?: ListFindingsParams): Promise<FindingRecord[]> {
    const qs = new URLSearchParams();
    if (params?.severity) qs.set('severity', params.severity);
    if (params?.status) qs.set('status', params.status);
    if (params?.controlId) qs.set('controlId', params.controlId);
    if (params?.assetId) qs.set('assetId', params.assetId);
    if (params?.remediationOwner)
      qs.set('remediationOwner', params.remediationOwner);
    if (params?.sourceType) qs.set('sourceType', params.sourceType);
    if (params?.vendorId) qs.set('vendorId', params.vendorId);
    if (params?.vendorReviewId) qs.set('vendorReviewId', params.vendorReviewId);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return apiClient.get(`/api/findings${query}`);
  },

  create(data: CreateFindingRequest): Promise<FindingRecord> {
    return apiClient.post('/api/findings', data);
  },

  myTasks(): Promise<FindingRecord[]> {
    return apiClient.get('/api/findings/my-tasks');
  },

  get(id: string): Promise<FindingRecord> {
    return apiClient.get(`/api/findings/${id}`);
  },

  update(id: string, data: UpdateFindingRequest): Promise<FindingRecord> {
    return apiClient.patch(`/api/findings/${id}/status`, data);
  },

  addRemediation(id: string, note: string): Promise<FindingRecord> {
    return apiClient.post(`/api/findings/${id}/remediation`, { note });
  },

  startRemediation(id: string): Promise<FindingRecord> {
    return apiClient.patch(`/api/findings/${id}/status`, {
      status: 'IN_REMEDIATION',
    });
  },

  submitForReview(id: string): Promise<FindingRecord> {
    return apiClient.patch(`/api/findings/${id}/status`, {
      status: 'READY_FOR_REVIEW',
    });
  },

  accept(id: string): Promise<FindingRecord> {
    return apiClient.patch(`/api/findings/${id}/status`, { status: 'CLOSED' });
  },

  reject(id: string): Promise<FindingRecord> {
    return apiClient.patch(`/api/findings/${id}/status`, { status: 'OPEN' });
  },
};
