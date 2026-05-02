/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { apiClient, ApiResponse, ApiError } from './client';

// ─── Enums ────────────────────────────────────────────────────────────────────
export type TestCategory =
  | 'Custom'
  | 'Engineering'
  | 'HR'
  | 'IT'
  | 'Policy'
  | 'Risks';
export type TestType = 'Document' | 'Automated' | 'Pipeline';
export type TestStatus = 'Due_soon' | 'Needs_remediation' | 'OK' | 'Overdue';
export type TestRecurrenceRule = 'weekly' | 'monthly' | 'quarterly' | 'annual';
export type TestAttestationStatus =
  | 'Not_requested'
  | 'Pending_review'
  | 'Attested';

// ─── Related record shapes ────────────────────────────────────────────────────
export interface TestControlLink {
  id: string;
  controlId: string;
  control: {
    id: string;
    isoReference: string;
    title: string;
    status: string;
    policyMappings?: Array<{
      policy: { id: string; name: string; documentUrl: string };
    }>;
  };
}

export interface TestFrameworkLink {
  id: string;
  testId: string;
  frameworkName: string;
  frameworkId?: string | null;
}

export interface TestAuditLink {
  id: string;
  auditId: string;
  audit: { id: string; type: string; auditor: string; scope: string };
}

export interface TestEvidenceLink {
  id: string;
  evidenceId: string;
  evidence: {
    id: string;
    type: string;
    fileName: string | null;
    fileUrl: string | null;
    createdAt: string;
  };
}

// ─── Integration test run record ─────────────────────────────────────────────
export interface TestRunRecord {
  id: string;
  integrationId: string;
  testId: string;
  assetId?: string | null;
  status: 'Pass' | 'Fail' | 'Warning' | 'Not_Run';
  summary: string;
  rawPayload: any | null;
  executionSource?: string | null;
  executedBy?: string | null;
  correlationId?: string | null;
  startedAt?: string | null;
  executedAt: string;
  durationMs: number | null;
}

// ─── Core test record ─────────────────────────────────────────────────────────
export interface TestRecord {
  id: string;
  name: string;
  description?: string | null;
  category: TestCategory;
  type: TestType;
  status: TestStatus;
  ownerId: string;
  owner?: { id: string; name: string; email: string };
  dueDate: string;
  nextDueDate: string | null;
  recurrenceRule: TestRecurrenceRule | null;
  completedAt: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  riskEngineTestId: string | null;
  templateId?: string | null;
  attestationStatus?: TestAttestationStatus;
  reviewerId?: string | null;
  reviewer?: { id: string; name: string; email: string } | null;
  attestedAt?: string | null;
  automationKind?: 'standard' | 'pipeline';
  pipelineProvider?: string | null;
  lastRemediationAt?: string | null;
  controls: TestControlLink[];
  frameworks: TestFrameworkLink[];
  audits: TestAuditLink[];
  evidences: TestEvidenceLink[];
  // Automated test fields
  integrationId?: string | null;
  lastRunAt?: string | null;
  lastResult?: 'Pass' | 'Fail' | 'Warning' | 'Not_Run';
  lastResultDetails?: Record<string, unknown> | null;
  autoRemediationSupported?: boolean;
  integration?: {
    id: string;
    provider: string;
    status: string;
    metadata?: Record<string, string>;
  } | null;
}

// ─── Summary ──────────────────────────────────────────────────────────────────
export interface TestSummary {
  total: number;
  completed: number;
  passPercentage: number;
  overdue: number;
  dueSoon: number;
}

// ─── History ──────────────────────────────────────────────────────────────────
export interface TestHistoryEntry {
  id: string;
  testId: string;
  changedBy: string;
  changeType: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

// ─── List params ─────────────────────────────────────────────────────────────
export interface ListTestsParams {
  page?: number;
  limit?: number;
  category?: TestCategory | '';
  status?: TestStatus | '';
  type?: TestType | '';
  ownerId?: string;
  integrationId?: string;
  controlId?: string;
  search?: string;
  dueFrom?: string;
  dueTo?: string;
  frameworkSlugs?: string[];
  /** F5: pass 'card' to request a lightweight projection (name, status, dueDate, counts only).
   * Use for list-card views where full relational detail is not needed. */
  view?: 'card';
}

export interface TestFilterOptions {
  integrations: Array<{ id: string; provider: string; status: string }>;
  owners: Array<{ id: string; name: string | null; email: string }>;
  controls: Array<{ id: string; title: string; isoReference: string }>;
}

export interface TestListResponse<T = TestRecord[]> extends ApiResponse<T> {
  total: number;
  page: number;
  limit: number;
  view?: 'full' | 'card';
}

/** F5: lightweight test record returned by GET /api/tests?view=card */
export interface TestCardRecord {
  id: string;
  name: string;
  status: TestStatus;
  category: TestCategory;
  type: TestType;
  dueDate: string;
  completedAt: string | null;
  owner: { id: string; name: string } | null;
  _count: { controls: number; evidences: number; audits: number };
}

// ─── Create / update payloads ─────────────────────────────────────────────────
export interface CreateTestRequest {
  name: string;
  category: TestCategory;
  type: TestType;
  ownerId: string;
  dueDate: string;
  recurrenceRule?: TestRecurrenceRule | null;
  riskEngineTestId?: string | null;
}

export interface UpdateTestRequest {
  name?: string;
  category?: TestCategory;
  type?: TestType;
  ownerId?: string;
  dueDate?: string;
  recurrenceRule?: TestRecurrenceRule | null;
  status?: TestStatus;
  riskEngineTestId?: string | null;
}

export interface BulkCompleteRequest {
  testIds: string[];
}

export interface BulkAssignRequest {
  testIds: string[];
  ownerId: string;
}

export interface BulkLinkControlRequest {
  testIds: string[];
  controlId: string;
}

export interface TestDashboard {
  controlCoverage: number;
  frameworkCoverage: Array<{ framework: string; count: number }>;
  automationCoverage: number;
  evidenceFreshness: number;
  slaCompliance: number;
  statusBreakdown: Array<{ label: string; count: number }>;
}

export interface TestGapAnalysis {
  controlsWithoutTests: string[];
  frameworksWithoutCoverage: string[];
  testsWithoutEvidence: Array<{ id: string; name: string }>;
}

export interface TestTemplate {
  id: string;
  framework: string;
  name: string;
  description: string;
  category: TestCategory;
  type: TestType;
  recurrenceRule: TestRecurrenceRule;
  controls: string[];
}

export interface TestRiskContext {
  linkedTest: { id: string; riskEngineTestId: string | null };
  results: Array<{
    id: string;
    status: string;
    severity: string;
    reason: string;
    executedAt: string;
    resourceName: string;
    resourceId: string;
    signalType: string;
  }>;
  risks: Array<{
    id: string;
    title: string;
    severity: string;
    score: number;
    status: string;
    resourceName: string;
  }>;
}

export interface TestSecurityEvent {
  id: string;
  testId: string;
  eventType: 'SIEM_FORWARD' | 'SOAR_TRIGGER';
  destination: string;
  status: 'QUEUED' | 'SENT';
  createdAt: string;
  summary: string;
}

export interface UnifiedTestEvidence {
  id: string;
  sourceType: 'compliance-evidence' | 'risk-snapshot';
  sourceId: string;
  testId: string;
  title: string;
  capturedAt: string;
  provider: string;
}

export interface TestEscalation {
  id: string;
  testId: string;
  owner: string;
  stage: 'OWNER' | 'MANAGER' | 'CISO';
  dueAt: string;
  integration: string;
  status: 'PENDING' | 'TRIGGERED';
}

export interface TestExportBundle {
  format: 'csv' | 'pdf';
  fileName: string;
  content: string;
}

export interface PipelineRunRequest {
  pipelineName: string;
  provider: string;
  status: 'success' | 'failure';
  summary: string;
  branch?: string;
}

export type WorkflowIntegrationProvider =
  | 'slack'
  | 'jira'
  | 'github-actions'
  | 'siem';

export interface WorkflowIntegrationConfigStatus {
  provider: WorkflowIntegrationProvider;
  organizationId: string;
  configured: boolean;
  updatedAt: string | null;
  configuredKeys: string[];
}

// ─── Service ─────────────────────────────────────────────────────────────────
export class TestsService {
  async listTests(params?: ListTestsParams): Promise<TestListResponse<TestRecord[]>>;
  async listTests(
    params: ListTestsParams & { view: 'card' },
  ): Promise<TestListResponse<TestCardRecord[]> & { view: 'card' }>;
  async listTests(
    params?: ListTestsParams,
  ): Promise<TestListResponse<TestRecord[] | TestCardRecord[]>> {
    const clean: Record<string, string> = {};
    if (params) {
      if (params.search) clean.search = params.search;
      if (params.category) clean.category = params.category;
      if (params.status) clean.status = params.status;
      if (params.type) clean.type = params.type;
      if (params.ownerId) clean.ownerId = params.ownerId;
      if (params.integrationId) clean.integrationId = params.integrationId;
      if (params.controlId) clean.controlId = params.controlId;
      if (params.dueFrom) clean.dueFrom = params.dueFrom;
      if (params.dueTo) clean.dueTo = params.dueTo;
      if (params.frameworkSlugs?.length)
        clean.frameworkSlugs = params.frameworkSlugs.join(',');
      if (params.page !== undefined) clean.page = String(params.page);
      if (params.limit !== undefined) clean.limit = String(params.limit);
      // F5: pass view=card for lightweight projections on list-card pages
      if (params.view) clean.view = params.view;
    }
    return apiClient.get(
      '/api/tests',
      Object.keys(clean).length ? clean : undefined,
    );
  }

  async getFilterOptions(): Promise<ApiResponse<TestFilterOptions>> {
    return apiClient.get('/api/tests/filter-options');
  }

  async getTestSummary(params?: {
    frameworkSlugs?: string[];
  }): Promise<ApiResponse<TestSummary>> {
    const clean: Record<string, string> = {};
    if (params?.frameworkSlugs?.length)
      clean.frameworkSlugs = params.frameworkSlugs.join(',');
    return apiClient.get(
      '/api/tests/summary',
      Object.keys(clean).length ? clean : undefined,
    );
  }

  async getDashboard(): Promise<ApiResponse<TestDashboard>> {
    try {
      return await apiClient.get('/api/tests/dashboard');
    } catch (error: unknown) {
      if (error instanceof ApiError && error.statusCode === 404) {
        return {
          success: true,
          data: {
            controlCoverage: 0,
            frameworkCoverage: [],
            automationCoverage: 0,
            evidenceFreshness: 0,
            slaCompliance: 0,
            statusBreakdown: [],
          },
        };
      }
      throw error;
    }
  }

  async getGapAnalysis(): Promise<ApiResponse<TestGapAnalysis>> {
    try {
      return await apiClient.get('/api/tests/gaps');
    } catch (error: unknown) {
      if (error instanceof ApiError && error.statusCode === 404) {
        return {
          success: true,
          data: {
            controlsWithoutTests: [],
            frameworksWithoutCoverage: [],
            testsWithoutEvidence: [],
          },
        };
      }
      throw error;
    }
  }

  async getLibrary(): Promise<ApiResponse<TestTemplate[]>> {
    return apiClient.get('/api/tests/library');
  }

  async createSuiteFromTemplate(
    templateId: string,
  ): Promise<ApiResponse<TestRecord[]>> {
    return apiClient.post(`/api/tests/library/${templateId}/create-suite`, {});
  }

  async getTest(id: string): Promise<ApiResponse<TestRecord>> {
    return apiClient.get(`/api/tests/${id}`);
  }

  async createTest(data: CreateTestRequest): Promise<ApiResponse<TestRecord>> {
    return apiClient.post('/api/tests', data);
  }

  async updateTest(
    id: string,
    data: UpdateTestRequest,
  ): Promise<ApiResponse<TestRecord>> {
    return apiClient.put(`/api/tests/${id}`, data);
  }

  async deleteTest(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/tests/${id}`);
  }

  async completeTest(id: string): Promise<ApiResponse<TestRecord>> {
    return apiClient.post(`/api/tests/${id}/complete`, {});
  }

  async bulkComplete(
    data: BulkCompleteRequest,
  ): Promise<ApiResponse<TestRecord[]>> {
    return apiClient.post('/api/tests/bulk/complete', data);
  }

  async bulkAssign(
    data: BulkAssignRequest,
  ): Promise<ApiResponse<TestRecord[]>> {
    return apiClient.post('/api/tests/bulk/assign', data);
  }

  async bulkLinkControl(
    data: BulkLinkControlRequest,
  ): Promise<ApiResponse<TestControlLink[]>> {
    return apiClient.post('/api/tests/bulk/link-control', data);
  }

  async getRiskContext(testId: string): Promise<ApiResponse<TestRiskContext>> {
    return apiClient.get(`/api/tests/${testId}/risk-context`);
  }

  async requestAttestation(
    testId: string,
    reviewerId: string,
  ): Promise<ApiResponse<TestRecord>> {
    return apiClient.post(`/api/tests/${testId}/attest/request`, {
      reviewerId,
    });
  }

  async signAttestation(
    testId: string,
    reviewerId: string,
  ): Promise<ApiResponse<TestRecord>> {
    return apiClient.post(`/api/tests/${testId}/attest/sign`, { reviewerId });
  }

  async autoRemediate(testId: string): Promise<ApiResponse<TestRecord>> {
    return apiClient.post(`/api/tests/${testId}/auto-remediate`, {});
  }

  async exportTests(
    format: 'csv' | 'pdf' = 'csv',
    framework?: string,
  ): Promise<ApiResponse<TestExportBundle>> {
    const params: Record<string, string> = { format };
    if (framework) params.framework = framework;
    return apiClient.get('/api/tests/export', params);
  }

  async ingestPipelineRun(
    data: PipelineRunRequest,
  ): Promise<ApiResponse<TestRecord>> {
    return apiClient.post('/api/tests/pipeline/runs', data);
  }

  async listSecurityEvents(): Promise<ApiResponse<TestSecurityEvent[]>> {
    try {
      return await apiClient.get('/api/tests/security-events');
    } catch (error: unknown) {
      if (error instanceof ApiError && error.statusCode === 404) {
        return { success: true, data: [] };
      }
      throw error;
    }
  }

  async listUnifiedEvidence(): Promise<ApiResponse<UnifiedTestEvidence[]>> {
    try {
      return await apiClient.get('/api/tests/unified-evidence');
    } catch (error: unknown) {
      if (error instanceof ApiError && error.statusCode === 404) {
        return { success: true, data: [] };
      }
      throw error;
    }
  }

  async listEscalations(): Promise<ApiResponse<TestEscalation[]>> {
    try {
      return await apiClient.get('/api/tests/escalations');
    } catch (error: unknown) {
      if (error instanceof ApiError && error.statusCode === 404) {
        return { success: true, data: [] };
      }
      throw error;
    }
  }

  async listWorkflowIntegrationConfigStatus(): Promise<
    ApiResponse<WorkflowIntegrationConfigStatus[]>
  > {
    return apiClient.get('/api/tests/workflow-integrations/config');
  }

  async upsertWorkflowIntegrationConfig(
    provider: WorkflowIntegrationProvider,
    values: Record<string, unknown>,
    organizationId?: string,
  ): Promise<ApiResponse<WorkflowIntegrationConfigStatus>> {
    return apiClient.put(
      `/api/tests/workflow-integrations/${provider}/config`,
      { values, organizationId },
    );
  }

  // Evidence
  async attachEvidence(
    testId: string,
    evidenceId: string,
  ): Promise<ApiResponse<TestEvidenceLink>> {
    return apiClient.post(`/api/tests/${testId}/evidence`, { evidenceId });
  }

  async detachEvidence(
    testId: string,
    evidenceId: string,
  ): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/tests/${testId}/evidence/${evidenceId}`);
  }

  // Controls
  async attachControl(
    testId: string,
    controlId: string,
  ): Promise<ApiResponse<TestControlLink>> {
    return apiClient.post(`/api/tests/${testId}/controls`, { controlId });
  }

  async detachControl(
    testId: string,
    controlId: string,
  ): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/tests/${testId}/controls/${controlId}`);
  }

  // Audits
  async attachAudit(
    testId: string,
    auditId: string,
  ): Promise<ApiResponse<TestAuditLink>> {
    return apiClient.post(`/api/tests/${testId}/audits`, { auditId });
  }

  async detachAudit(
    testId: string,
    auditId: string,
  ): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/tests/${testId}/audits/${auditId}`);
  }

  // Frameworks
  async attachFramework(
    testId: string,
    frameworkName: string,
  ): Promise<ApiResponse<TestFrameworkLink>> {
    return apiClient.post(`/api/tests/${testId}/frameworks`, { frameworkName });
  }

  async detachFramework(
    testId: string,
    frameworkId: string,
  ): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/tests/${testId}/frameworks/${frameworkId}`);
  }

  // History
  async getHistory(
    testId: string,
    page = 1,
  ): Promise<ApiResponse<TestHistoryEntry[]>> {
    return apiClient.get(`/api/tests/${testId}/history`, {
      page: String(page),
    });
  }

  // Seed predefined Policy tests
  async seedTests(): Promise<
    ApiResponse<{ created: number; skipped: number }>
  > {
    return apiClient.post('/api/tests/seed', {});
  }

  // Get integration test run history for an automated test
  async getTestRuns(
    testId: string,
    page = 1,
  ): Promise<ApiResponse<TestRunRecord[]>> {
    return apiClient.get(`/api/tests/${testId}/runs`, { page: String(page) });
  }
}

export const testsService = new TestsService();
