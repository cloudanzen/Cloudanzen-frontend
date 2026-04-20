// Export main types from backend schema
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ORG_ADMIN = 'ORG_ADMIN',
  SECURITY_OWNER = 'SECURITY_OWNER',
  AUDITOR = 'AUDITOR',
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
  ownerId: string;
  criticality: RiskLevel;
  description?: string;
  organizationId: string;
  createdAt: string;
  risks?: Risk[];
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
  controlId: string;
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
  status: string;
  documentUrl: string;
  pdfUrl?: string | null;
  content?: object | null;
  organizationId: string;
  ownerId?: string;
  owner?: { id: string; name: string; email: string };
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt?: string;
  organization?: Organization;
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

export interface CurrentUser {
  user: User;
}

// Form types for create/update operations
export interface CreateAssetRequest {
  name: string;
  type: AssetType;
  ownerId: string;
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
