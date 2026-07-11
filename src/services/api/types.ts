// Export main types from backend schema
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ORG_ADMIN = 'ORG_ADMIN',
  SECURITY_OWNER = 'SECURITY_OWNER',
  AUDITOR = 'AUDITOR',
  EXTERNAL_AUDITOR = 'EXTERNAL_AUDITOR',
  CONTRIBUTOR = 'CONTRIBUTOR',
  VIEWER = 'VIEWER',
}

export enum AssetType {
  CLOUD = 'CLOUD',
  APPLICATION = 'APPLICATION',
  DATABASE = 'DATABASE',
  SAAS = 'SAAS',
  ENDPOINT = 'ENDPOINT',
  NETWORK = 'NETWORK',
  REPOSITORY = 'REPOSITORY',
  VENDOR = 'VENDOR',
  OTHER = 'OTHER',
}

export enum AssetCategory {
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  DATA_STORE = 'DATA_STORE',
  APPLICATION = 'APPLICATION',
  ENDPOINT = 'ENDPOINT',
  NETWORK = 'NETWORK',
  IDENTITY = 'IDENTITY',
  SECRETS = 'SECRETS',
  OTHER = 'OTHER',
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum RiskStatus {
  OPEN = 'OPEN',
  MITIGATED = 'MITIGATED',
  ACCEPTED = 'ACCEPTED',
  TRANSFERRED = 'TRANSFERRED',
}

export enum ControlStatus {
  IMPLEMENTED = 'IMPLEMENTED',
  PARTIALLY_IMPLEMENTED = 'PARTIALLY_IMPLEMENTED',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
}

export enum EvidenceType {
  FILE = 'FILE',
  LINK = 'LINK',
  SCREENSHOT = 'SCREENSHOT',
  LOG = 'LOG',
  AUTOMATED = 'AUTOMATED',
}

export enum AuditType {
  INTERNAL = 'INTERNAL',
  EXTERNAL = 'EXTERNAL',
  SURVEILLANCE = 'SURVEILLANCE',
}

export enum FindingSeverity {
  MINOR = 'MINOR',
  MAJOR = 'MAJOR',
  OBSERVATION = 'OBSERVATION',
}

// Main entity types
export interface Organization {
  id: string;
  name: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: Role;
  organizationId: string;
  preferredLocale?: string;
  createdAt: string;
  organization?: Organization;
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  ownerId: string | null;
  criticality: RiskLevel;
  description?: string;
  organizationId: string;
  createdAt: string;
  category?: AssetCategory;
  subtype?: string;
  provider?: string | null;
  externalId?: string | null;
  externalResourceName?: string | null;
  region?: string | null;
  lastDiscoveredAt?: string | null;
  firstDiscoveredAt?: string | null;
  discoveredBy?: string | null;
  managedBy?: string | null;
  isStale?: boolean;
  updatedAt?: string;
  status?: string;
  hostname?: string | null;
  serialNumber?: string | null;
  osType?: string | null;
  osVersion?: string | null;
  mergeGroup?: {
    id: string;
    groupType?: string;
    _count?: { assets: number };
  } | null;
  _count?: { risks: number };
  risks?: Risk[];
}

export interface AssetCoverage {
  total: number;
  byProvider: Array<{ provider: string; count: number; staleCount: number }>;
  byCategory: Array<{ category: string; count: number }>;
  bySubtype: Array<{ subtype: string; count: number }>;
  staleCount: number;
  unmanaged: number;
  ownedCount: number;
  classifiedCount: number;
  ownershipPct: number;
  classificationPct: number;
  lastScanTimes: Array<{ provider: string; lastScanAt: string | null }>;
  providerHealth: Array<{
    provider: string;
    count: number;
    staleCount: number;
    stalePct: number;
    configuredCount: number;
    connected: boolean;
    lastScanAt: string | null;
    lastStatus: string | null;
    health: 'healthy' | 'warning' | 'stale' | 'not_connected';
  }>;
}

export interface AssetRelationshipItem {
  id: string;
  name: string;
  type: AssetType;
  subtype?: string | null;
  relationshipType: string;
}

export interface AssetChangeLogEntry {
  id: string;
  changeType: string;
  changedBy?: string | null;
  previousValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  source?: string | null;
  createdAt: string;
}

export interface AssetReview {
  id: string;
  reviewType: 'OWNERSHIP' | 'CLASSIFICATION' | 'STALE' | 'COMPLIANCE';
  disposition: 'CONFIRMED' | 'UPDATED' | 'ARCHIVED' | 'DEFERRED';
  reviewedBy?: string | null;
  reviewedAt: string;
  notes?: string | null;
  createdAt: string;
}

export interface AssetReviewQueue {
  key: string;
  label: string;
  count: number;
  reviewType: AssetReview['reviewType'];
  filters?: Record<string, unknown>;
}

export interface AssetSourceRecord {
  id: string;
  provider: string;
  externalId: string;
  lastSeenAt: string;
  confidence: string;
  isPrimary: boolean;
  rawMetadata?: Record<string, unknown> | null;
}

export interface AssetSavedView {
  id: string;
  name: string;
  description?: string | null;
  filters: Record<string, string | number | boolean | null>;
  sharedWithTeam: boolean;
  isSystem: boolean;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssetSettings {
  organizationId?: string;
  autoScanEnabled: boolean;
  providerPriority: string[];
}

export interface AssetDetail extends Asset {
  mergeGroup?: {
    id: string;
    dedupeKey?: string;
    groupType?: string;
    reviewStatus?: string;
    reviewedBy?: string | null;
    reviewedAt?: string | null;
    notes?: string | null;
    _count?: { assets: number };
    assets?: Array<{
      id: string;
      name: string;
      type: AssetType;
      subtype?: string | null;
      provider?: string | null;
    }>;
  } | null;
  classification?: {
    dataSensitivity?: string | null;
    environment?: string | null;
    regulatoryScope?: unknown;
    internetExposed?: boolean | null;
  } | null;
  sourceRecords?: AssetSourceRecord[];
  mergeConflicts?: Array<{
    field: string;
    values: Array<{ value: string; assetIds: string[] }>;
  }>;
  parentRelations?: Array<{
    relationshipType: string;
    parentAsset: AssetRelationshipItem;
  }>;
  childRelations?: Array<{
    relationshipType: string;
    childAsset: AssetRelationshipItem;
  }>;
  changeLog?: AssetChangeLogEntry[];
  reviews?: AssetReview[];
  controlMappings?: Array<{
    id: string;
    controlId: string;
    control: { id: string; title: string; status: string };
  }>;
  testMappings?: Array<{
    id: string;
    testId: string;
    test: { id: string; name: string; status: string };
  }>;
  findings?: Array<{
    id: string;
    title: string;
    severity: string;
    status: string;
  }>;
}

export interface AssetMergeGroup {
  id: string;
  dedupeKey: string;
  groupType: string;
  displayName?: string | null;
  reviewStatus: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  notes?: string | null;
  _count?: { assets: number };
  assets?: Array<{
    id: string;
    name: string;
    provider?: string | null;
    type: AssetType;
    subtype?: string | null;
  }>;
}

export interface Risk {
  id: string;
  title: string;
  description: string;
  impact: RiskLevel;
  likelihood: RiskLevel;
  riskScore: number;
  status: RiskStatus;
  assetId: string;
  createdAt: string;
  asset?: Asset;
  treatments?: RiskTreatment[];
}

export interface RiskTreatment {
  id: string;
  riskId: string;
  controlId: string;
  notes?: string;
  risk?: Risk;
  control?: Control;
}

export interface Control {
  id: string;
  isoReference: string;
  title: string;
  description: string;
  status: ControlStatus;
  justification?: string;
  organizationId: string;
  createdAt: string;
  organization?: Organization;
  evidence?: Evidence[];
  riskMappings?: RiskTreatment[];
  findings?: AuditFinding[];
}

export interface Evidence {
  id: string;
  type: EvidenceType;
  fileName?: string;
  fileUrl?: string;
  hash: string;
  // null = audit-level evidence (linked to an audit request that has no
  // specific controlId). Global evidence creation still requires controlId.
  controlId: string | null;
  collectedBy?: string;
  automated: boolean;
  createdAt: string;
  control?: Control;
}

export interface Policy {
  id: string;
  name: string;
  description?: string;
  version: string;
  versionNumber?: number;
  frameworksCount?: number;
  /** Optional map of locale → translated policy name (e.g. ja). Backend
   *  joins policy_template_translations by name match. Empty/undefined
   *  means no translation; consumers should fall back to `name`. */
  localizedName?: Partial<Record<'en' | 'ja', string>>;
  status: string;
  documentUrl: string;
  pdfUrl?: string | null;
  content?: object | null;
  organizationId: string;
  ownerId?: string;
  owner?: { id: string; name: string; email: string };
  approvedBy?: string;
  approvedAt?: string;
  renewalDate?: string;
  recurrenceMonths?: number;
  lastRenewedAt?: string;
  tests?: Array<{
    id: string;
    name: string;
    category: string;
    type: string;
    status: string;
    dueDate?: string;
    completedAt?: string | null;
    createdAt: string;
  }>;
  controlMappings?: Array<{
    id: string;
    controlId: string;
    control?: {
      id: string;
      isoReference?: string;
      title: string;
      status: string;
    };
  }>;
  createdAt: string;
  updatedAt?: string;
  organization?: Organization;
}

export interface PolicyApprovalRecord {
  id: string;
  policyId: string;
  policyVersionId?: string | null;
  approvalRound: number;
  approverId: string;
  approver?: { id: string; name: string | null; email: string };
  policyVersion?: {
    id: string;
    versionNumber: number;
    publishedAt: string;
  } | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comment?: string;
  respondedAt?: string;
  createdAt: string;
}

export interface PolicyVersion {
  id: string;
  policyId: string;
  versionNumber: number;
  name: string;
  description?: string;
  content?: object | null;
  documentUrl?: string | null;
  pdfUrl?: string | null;
  status: string;
  publishedBy: string;
  publishedAt: string;
  changelog?: string;
  approvals?: PolicyApprovalRecord[];
  locales?: PolicyVersionLocale[];
}

export interface PolicyVersionLocale {
  id: string;
  policyVersionId: string;
  locale: 'en' | 'ja' | string;
  content?: object | null;
  documentUrl?: string | null;
  pdfUrl?: string | null;
}

export interface PolicyAcceptanceRecord {
  id: string;
  policyId: string;
  versionNumber: number;
  userId: string;
  user?: { id: string; name: string | null; email: string };
  policy?: {
    id: string;
    name: string;
    status: string;
    version: string;
    versionNumber: number;
  };
  status: 'PENDING' | 'ACCEPTED';
  acceptedAt?: string;
  createdAt: string;
}

export interface Audit {
  id: string;
  type: AuditType;
  auditor: string;
  scope: string;
  startDate: string;
  endDate?: string;
  organizationId: string;
  createdAt: string;
  organization?: Organization;
  findings?: AuditFinding[];
}

export interface AuditFinding {
  id: string;
  auditId: string;
  controlId: string;
  severity: FindingSeverity;
  description: string;
  remediation?: string;
  status: string;
  createdAt: string;
  audit?: Audit;
  control?: Control;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
  user?: User;
}

// Auth related types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  role?: Role;
  organizationId: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Returned by GET /api/auth/me. `impersonation` is non-null only when the
// request arrived with a valid aud='tenant_impersonation' JWT (per the
// backend PR-X4 extension); the tenant shell renders the support-session
// banner whenever this field is set.
export interface ImpersonationContext {
  sessionId: string;
  adminEmail: string;
  reason: string;
  expiresAt: number;
  effectiveRole: string;
}

// AI TrustOps Phase 2 — org profile returned by /api/auth/me so the FE
// shell can drive adaptive routing + sidebar gating from one round-trip.
export type CompanyType =
  | 'AI_NATIVE'
  | 'SAAS'
  | 'HEALTHCARE'
  | 'ENTERPRISE_GRC'
  | 'OTHER';

export type PrimaryUseCase =
  | 'AI_TRUST'
  | 'SOC2'
  | 'ISO27001'
  | 'ISO42001'
  | 'TRUST_CENTER'
  | 'QUESTIONNAIRES'
  | 'VENDOR_RISK';

export type KnownBundle =
  | 'AI_GOVERNANCE'
  | 'COMPLIANCE_AUTOMATION'
  | 'CUSTOMER_TRUST'
  | 'VENDOR_RISK'
  | 'DEDICATED_CLOUD';

export interface OrgProfile {
  id: string;
  name: string;
  companyType: CompanyType;
  primaryUseCase: PrimaryUseCase;
  enabledBundles: KnownBundle[];
  bundlesVersion: number;
}

export interface CurrentUser {
  user: User;
  org?: OrgProfile | null;
  impersonation?: ImpersonationContext | null;
}

// Form types for create/update operations
export interface CreateAssetRequest {
  name: string;
  type: AssetType;
  ownerId?: string | null;
  criticality: RiskLevel;
  description?: string;
}

export interface CreateRiskRequest {
  title: string;
  description: string;
  impact: RiskLevel;
  likelihood: RiskLevel;
  assetId: string;
}

export interface UpdateRiskRequest {
  title?: string;
  description?: string;
  impact?: RiskLevel;
  likelihood?: RiskLevel;
  status?: RiskStatus;
}

export interface CreateControlRequest {
  isoReference: string;
  title: string;
  description: string;
  status: ControlStatus;
  justification?: string;
}

export interface UpdateControlRequest {
  isoReference?: string;
  title?: string;
  description?: string;
  status?: ControlStatus;
  justification?: string;
}

export interface CreateEvidenceRequest {
  type: EvidenceType;
  fileName?: string;
  fileUrl?: string;
  controlId: string;
  collectedBy?: string;
  automated?: boolean;
}

// Dashboard and summary types
export interface DashboardStats {
  totalAssets: number;
  totalRisks: number;
  openRisks: number;
  totalControls: number;
  implementedControls: number;
  complianceScore: number;
  recentActivities: ActivityLog[];
}

export interface RiskDistribution {
  level: RiskLevel;
  count: number;
  percentage: number;
}

export interface ControlCompliance {
  total: number;
  implemented: number;
  partiallyImplemented: number;
  notImplemented: number;
  compliancePercentage: number;
}
