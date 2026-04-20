/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { apiClient } from './client';

export interface FrameworkDto {
  id: string;
  slug: string;
  name: string;
  version: string;
  description: string | null;
  status: string;
  createdAt: string;
}

export interface FrameworkRequirementDto {
  id: string;
  frameworkId: string;
  code: string;
  title: string;
  description: string | null;
  domain: string | null;
  createdAt: string;
}

export interface OrgFrameworkDto {
  id: string;
  organizationId: string;
  frameworkId: string;
  frameworkSlug: string;
  frameworkName: string;
  frameworkVersion: string;
  status: 'setup_in_progress' | 'active' | 'archived';
  activatedAt: string | null;
  activatedBy: string | null;
  archivedAt: string | null;
  archivedBy: string | null;
  scopeNote: string | null;
  createdAt: string;
  updatedAt: string;
  // Latest coverage snapshot fields (null if no snapshot yet)
  controlCoveragePct: number | null;
  testPassRatePct: number | null;
  openGaps: number | null;
  covered: number | null;
  applicable: number | null;
  totalRequirements: number | null;
  snapshotCalculatedAt: string | null;
}

export interface RequirementStatusDto {
  id: string;
  organizationId: string;
  frameworkRequirementId: string;
  code: string;
  title: string;
  domain: string | null;
  applicabilityStatus: 'applicable' | 'not_applicable';
  justification: string | null;
  reviewStatus: 'not_started' | 'in_review' | 'accepted';
  ownerId: string | null;
  ownerName: string | null;
  dueDate: string | null;
  updatedAt: string;
}

/** F5: lightweight framework record returned by GET /api/org/frameworks?view=card */
export interface OrgFrameworkCardDto {
  id: string;
  frameworkSlug: string;
  frameworkName: string;
  frameworkVersion: string;
  status: 'setup_in_progress' | 'active' | 'archived';
  activatedAt: string | null;
  controlCoveragePct: number | null;
  openGaps: number | null;
}

export interface CoverageSnapshotDto {
  id: string;
  organizationId: string;
  frameworkId: string;
  totalRequirements: number;
  totalMapped: number;
  notApplicable: number;
  applicable: number;
  covered: number;
  partiallyCovered: number;
  notCovered: number;
  controlCoveragePct: number;
  testPassRatePct: number;
  mappedTestCount: number;
  passingTestCount: number;
  openGaps: number;
  calculatedAt: string;
}

export interface FrameworkEntitlementDto {
  frameworkSlug: string;
  entitled: boolean;
  planName: string | null;
  validUntil: string | null;
}

export interface BillingEntitlementDto {
  frameworkSlug: string;
  planName: string | null;
  isActive: boolean;
  validFrom: string;
  validUntil: string | null;
  createdAt: string;
}

export interface ActivateFrameworkRequest {
  frameworkSlug: string;
  scopeNote?: string;
}

export interface ActivationSummaryDto {
  requirementsLoaded: number;
  /** null when mappings are still processing asynchronously */
  mappingsSuggested: number | null;
  /** null when mappings are still processing asynchronously */
  mappingsSkipped: number | null;
  /** null when test delta reconciliation is still processing asynchronously */
  testsLinkedOrCreated: number | null;
  /** true while the background workers are still running */
  mappingsProcessing: boolean;
  requirementsNeedingReview: number;
  initialCoverageScore: number;
  isReactivation: boolean;
  warnings: string[];
}

export interface RemoveFrameworkRequest {
  reason?: string;
}

export interface UpdateRequirementOwnerRequest {
  ownerId?: string | null;
  dueDate?: string | null;
}

export interface UpdateApplicabilityRequest {
  applicabilityStatus: 'applicable' | 'not_applicable';
  justification?: string;
}

export interface SyncEntitlementRequest {
  organizationId: string;
  frameworkSlug: string;
  planName: string;
  isActive: boolean;
  validFrom: string;
  validUntil?: string | null;
}

export interface ControlMappingDto {
  id: string;
  controlId: string;
  frameworkRequirementId: string;
  frameworkId: string;
  mappingType: 'direct' | 'inherited' | 'suggested';
  createdAt: string;
  requirementCode: string;
  requirementTitle: string;
  requirementDomain: string | null;
}

export interface TestMappingDto {
  id: string;
  testId: string;
  frameworkRequirementId: string;
  frameworkId: string;
  createdAt: string;
  requirementCode: string;
  requirementTitle: string;
  requirementDomain: string | null;
}

export interface PolicyMappingDto {
  id: string;
  policyId: string;
  frameworkRequirementId: string;
  frameworkId: string;
  createdAt: string;
  requirementCode: string;
  requirementTitle: string;
  requirementDomain: string | null;
}

export interface FrameworkMappingsDto {
  controls: ControlMappingDto[];
  tests: TestMappingDto[];
  policies: PolicyMappingDto[];
}

// ── Requirement detail view (unified single-page endpoint) ───────────────────

export interface RequirementControlDto {
  controlId: string;
  controlTitle: string;
  controlStatus: string;
  mappingType: string;
  isoReference: string;
}

export interface RequirementTestDto {
  testId: string;
  testName: string;
  testStatus: string;
  dueDate: string | null;
  completedAt: string | null;
}

export interface RequirementPolicyDto {
  policyId: string;
  policyName: string;
  policyStatus: string;
}

export interface RequirementRiskDto {
  riskId: string;
  riskTitle: string;
  riskScore: number | null;
  riskStatus: string;
  riskLevel: string | null;
}

export interface RequirementDetailRow {
  id: string;
  organizationId: string;
  frameworkRequirementId: string;
  code: string;
  title: string;
  domain: string | null;
  isMandatory: boolean;
  applicabilityStatus: 'applicable' | 'not_applicable';
  justification: string | null;
  reviewStatus: 'not_started' | 'in_review' | 'accepted';
  ownerId: string | null;
  ownerName: string | null;
  dueDate: string | null;
  updatedAt: string;
  controls: RequirementControlDto[];
  tests: RequirementTestDto[];
  policies: RequirementPolicyDto[];
  risks: RequirementRiskDto[];
}

export interface FrameworkReadinessDto {
  slug: string;
  name: string;
  version: string;
  controlCoveragePct: number | null;
  testPassRatePct: number | null;
  openGaps: number | null;
  covered: number | null;
  applicable: number | null;
  totalRequirements: number | null;
  calculatedAt: string | null;
}

class FrameworksService {
  /** GET /api/frameworks — global catalog */
  async listCatalog(): Promise<{ success: boolean; data: FrameworkDto[] }> {
    return apiClient.get('/api/frameworks');
  }

  /** GET /api/frameworks/:slug — single framework */
  async getFramework(
    slug: string,
  ): Promise<{ success: boolean; data: FrameworkDto }> {
    return apiClient.get(`/api/frameworks/${slug}`);
  }

  /** GET /api/frameworks/:slug/requirements */
  async listRequirements(
    slug: string,
  ): Promise<{ success: boolean; data: FrameworkRequirementDto[] }> {
    return apiClient.get(`/api/frameworks/${slug}/requirements`);
  }

  /** GET /api/org/frameworks — org's active frameworks.
   * Pass view='card' for a lightweight projection (F5: name, status, coverage, gaps only). */
  async listOrgFrameworks(): Promise<{
    success: boolean;
    data: OrgFrameworkDto[];
    view: 'full';
  }>;
  async listOrgFrameworks(
    view: 'card',
  ): Promise<{ success: boolean; data: OrgFrameworkCardDto[]; view: 'card' }>;
  async listOrgFrameworks(view?: 'card'): Promise<{
    success: boolean;
    data: OrgFrameworkDto[] | OrgFrameworkCardDto[];
    view?: string;
  }> {
    return apiClient.get('/api/org/frameworks', view ? { view } : undefined);
  }

  /** POST /api/org/frameworks — activate a framework */
  async activateFramework(body: ActivateFrameworkRequest): Promise<{
    success: boolean;
    data: OrgFrameworkDto;
    summary: ActivationSummaryDto;
  }> {
    return apiClient.post('/api/org/frameworks', body);
  }

  /** PATCH /api/org/frameworks/:slug/remove — remove from active scope */
  async removeFramework(
    frameworkSlug: string,
    body: RemoveFrameworkRequest = {},
  ): Promise<{ success: boolean; data: OrgFrameworkDto }> {
    return apiClient.patch(`/api/org/frameworks/${frameworkSlug}/remove`, body);
  }

  /** GET /api/org/frameworks/:slug/entitlement */
  async checkEntitlement(
    frameworkSlug: string,
  ): Promise<{ success: boolean; data: FrameworkEntitlementDto }> {
    return apiClient.get(`/api/org/frameworks/${frameworkSlug}/entitlement`);
  }

  /** GET /api/org/frameworks/:slug/requirements — requirement status per org */
  async listOrgRequirements(
    frameworkSlug: string,
  ): Promise<{ success: boolean; data: RequirementStatusDto[] }> {
    return apiClient.get(`/api/org/frameworks/${frameworkSlug}/requirements`);
  }

  /** GET /api/org/frameworks/:slug/requirement-detail-view — unified requirement data */
  async getRequirementDetailView(
    frameworkSlug: string,
  ): Promise<{ success: boolean; data: RequirementDetailRow[] }> {
    return apiClient.get(
      `/api/org/frameworks/${frameworkSlug}/requirement-detail-view`,
    );
  }

  /** GET /api/org/frameworks/:slug/coverage — latest coverage snapshot */
  async getCoverage(
    frameworkSlug: string,
  ): Promise<{ success: boolean; data: CoverageSnapshotDto | null }> {
    return apiClient.get(`/api/org/frameworks/${frameworkSlug}/coverage`);
  }

  /** GET /api/org/frameworks/:slug/coverage/history — recent coverage snapshots */
  async getCoverageHistory(
    frameworkSlug: string,
    days = 90,
  ): Promise<{ success: boolean; data: CoverageSnapshotDto[] }> {
    return apiClient.get(
      `/api/org/frameworks/${frameworkSlug}/coverage/history`,
      { days: String(days) },
    );
  }

  /** GET /api/org/frameworks/:slug/mappings — all control/test/policy mappings */
  async getFrameworkMappings(
    frameworkSlug: string,
  ): Promise<{ success: boolean; data: FrameworkMappingsDto }> {
    return apiClient.get(`/api/org/frameworks/${frameworkSlug}/mappings`);
  }

  /** POST /api/org/frameworks/:slug/mappings/confirm — confirm a suggested mapping */
  async confirmMapping(
    frameworkSlug: string,
    body: { mappingType: 'control' | 'test' | 'policy'; mappingId: string },
  ): Promise<{ success: boolean; data: any }> {
    return apiClient.post(
      `/api/org/frameworks/${frameworkSlug}/mappings/confirm`,
      body,
    );
  }

  /** PATCH /api/org/requirements/:requirementId/owner */
  async updateRequirementOwner(
    requirementId: string,
    body: UpdateRequirementOwnerRequest,
  ): Promise<{ success: boolean; data: RequirementStatusDto }> {
    return apiClient.patch(
      `/api/org/requirements/${requirementId}/owner`,
      body,
    );
  }

  /** PATCH /api/org/requirements/:requirementId/applicability */
  async updateApplicability(
    requirementId: string,
    body: UpdateApplicabilityRequest,
  ): Promise<{ success: boolean; data: RequirementStatusDto }> {
    return apiClient.patch(
      `/api/org/requirements/${requirementId}/applicability`,
      body,
    );
  }

  /** GET /api/org/frameworks/readiness — readiness summary for all active frameworks */
  async getReadinessSummary(): Promise<{
    success: boolean;
    data: FrameworkReadinessDto[];
  }> {
    return apiClient.get('/api/org/frameworks/readiness');
  }

  /** GET /api/billing/entitlements — current org entitlements */
  async listEntitlements(): Promise<{
    success: boolean;
    data: BillingEntitlementDto[];
  }> {
    return apiClient.get('/api/billing/entitlements');
  }

  /** POST /api/billing/entitlements/sync (SUPER_ADMIN only) */
  async syncEntitlement(
    body: SyncEntitlementRequest,
  ): Promise<{ success: boolean; data: { synced: boolean } }> {
    return apiClient.post('/api/billing/entitlements/sync', body);
  }
}

// ── Phase 7.2 — Evidence freshness types ──────────────────────────────────────

export interface ControlFreshnessResult {
  controlId: string;
  isoReference: string;
  title: string;
  lastRunAt: string | null;
  lastResult: string | null;
  daysSinceLastRun: number | null;
  slaDays: number;
  isStale: boolean;
  slaBreached: boolean;
}

export interface FrameworkFreshnessReport {
  frameworkSlug: string;
  slaDays: number;
  totalControls: number;
  staleControls: number;
  freshnessScore: number;
  controls: ControlFreshnessResult[];
}

// Extend FrameworksService with freshness methods
declare module './frameworks' {
  interface FrameworksService {
    getEvidenceFreshness(
      frameworkSlug: string,
    ): Promise<{ success: boolean; data: FrameworkFreshnessReport }>;
    getOrgEvidenceFreshness(): Promise<{
      success: boolean;
      data: FrameworkFreshnessReport[];
    }>;
    setEvidenceSla(
      frameworkSlug: string,
      slaDays: number,
    ): Promise<{
      success: boolean;
      data: { frameworkSlug: string; slaDays: number };
    }>;
  }
}

// Add methods to prototype at module load time
Object.assign(FrameworksService.prototype, {
  getEvidenceFreshness(this: FrameworksService, frameworkSlug: string) {
    return apiClient.get(
      `/api/org/frameworks/${frameworkSlug}/evidence-freshness`,
    );
  },
  getOrgEvidenceFreshness(this: FrameworksService) {
    return apiClient.get('/api/org/frameworks/evidence-freshness');
  },
  setEvidenceSla(
    this: FrameworksService,
    frameworkSlug: string,
    slaDays: number,
  ) {
    return apiClient.put(
      `/api/org/frameworks/${frameworkSlug}/evidence-freshness/sla`,
      { slaDays },
    );
  },
});

export const frameworksService = new FrameworksService();
