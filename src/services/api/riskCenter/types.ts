import { RiskLevel, RiskStatus } from '../types';

export type TrendDirection = 'up' | 'flat' | 'down';
export type RiskCategory =
  | 'Cloud'
  | 'Identity'
  | 'Application'
  | 'Endpoint'
  | 'Network'
  | 'Compliance'
  | 'Third-party'
  | 'Data Protection';

export interface RiskOwnerSummary {
  name: string;
  team: string;
}

export interface EnterpriseRiskRecord {
  id: string;
  title: string;
  description: string;
  impact: RiskLevel;
  likelihood: RiskLevel;
  status: RiskStatus | 'IN_PROGRESS' | 'VERIFIED' | 'CLOSED' | 'DEFERRED';
  riskScore: number;
  category: RiskCategory;
  source: string;
  assetName: string;
  assetType: string;
  assetCriticality: RiskLevel;
  owner: RiskOwnerSummary;
  dueDate: string;
  createdAt: string;
  lastSeenAt: string;
  exposureDays: number;
  frameworks: string[];
  controls: string[];
  evidenceCount: number;
  treatment: string;
  trend: TrendDirection;
}

export interface RiskOverviewModel {
  total: number;
  open: number;
  mitigated: number;
  accepted: number;
  transferred: number;
  overdue: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  highRiskAssets: number;
  automatedCoverage: number;
  evidenceCoverage: number;
  frameworkCoverage: number;
  mttrDays: number;
  categoryBreakdown: Array<{ label: RiskCategory; count: number }>;
  severityBreakdown: Array<{ label: RiskLevel; count: number }>;
  ownerBreakdown: Array<{ team: string; count: number }>;
  frameworkBreakdown: Array<{ framework: string; count: number }>;
  recentRisks: EnterpriseRiskRecord[];
}

export interface RiskActionItem {
  id: string;
  riskId: string;
  title: string;
  owner: RiskOwnerSummary;
  priority: 'P1' | 'P2' | 'P3';
  dueDate: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'BLOCKED' | 'READY_FOR_VERIFICATION';
  automation: 'Slack + Jira' | 'Jira' | 'Manual';
  playbook: string;
  frameworkImpact: string[];
}

export interface RiskSnapshotModel {
  generatedAt: string;
  totalRisks: number;
  openRisks: number;
  overdueRisks: number;
  acceptedRisks: number;
  residualRiskScore: number;
  controlsAutomated: number;
  evidenceFreshness: number;
  exceptionCount: number;
  riskBySeverity: Array<{ label: RiskLevel; count: number }>;
  riskByCategory: Array<{ label: RiskCategory; count: number }>;
  riskAging: Array<{ label: string; count: number }>;
  topAssets: Array<{
    assetName: string;
    count: number;
    criticality: RiskLevel;
  }>;
  auditReadiness: Array<{ label: string; value: number }>;
}

export interface RiskLibraryItem {
  id: string;
  title: string;
  category: RiskCategory;
  defaultImpact: RiskLevel;
  frameworks: string[];
  controls: string[];
  automationLevel: 'Automated' | 'Hybrid' | 'Manual';
  count: number;
}

export interface RiskSettingsModel {
  notifications: Array<{
    id: string;
    label: string;
    enabled: boolean;
    description: string;
  }>;
  automations: Array<{
    id: string;
    label: string;
    status: string;
    description: string;
  }>;
  scoringFactors: Array<{ label: string; weight: number }>;
  lifecycle: string[];
}

export interface RiskDetailEvidenceItem {
  id: string;
  title: string;
  provider: string;
  capturedAt: string;
  summary: string;
  hash: string;
}

export interface RiskDetailActivityItem {
  id: string;
  type:
    | 'DETECTED'
    | 'ASSIGNED'
    | 'EVIDENCE'
    | 'REMEDIATION'
    | 'ACCEPTED'
    | 'UPDATED'
    | 'STAKEHOLDER_CHANGED';
  title: string;
  timestamp: string;
  actor: string;
  /** For STAKEHOLDER_CHANGED events, tracks old/new values for audit */
  meta?: {
    field?: string;
    oldValue?: string;
    newValue?: string;
  };
}

export interface RiskStakeholder {
  role: 'Technical owner' | 'Business owner' | 'Control owner' | 'Backup owner';
  name: string;
  team: string;
  userId?: string;
}

export interface RiskSourceOrigin {
  testId: string;
  testName: string;
  controlId: string;
  controlName: string;
  provider: string;
  signalId: string;
  lastFailedAt: string;
  failureReason: string;
}

export interface RiskRemediationStep {
  label: string;
  linkedTestId?: string;
  linkedControlName?: string;
  failureReason?: string;
  affectedResource?: string;
  recommendedFix?: string;
  evidenceSnapshotId?: string;
  evidenceSummary?: string;
}

export interface UpdateStakeholdersRequest {
  stakeholders: Array<{
    role: RiskStakeholder['role'];
    name: string;
    team: string;
    userId?: string;
  }>;
}

export interface UpdateStakeholdersResponse {
  success: boolean;
  stakeholders: RiskStakeholder[];
  activityEntry: RiskDetailActivityItem;
}

export interface RiskDetailModel {
  risk: EnterpriseRiskRecord;
  /** Raw register entry from the DB — used by the edit form */
  registerEntry: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    inherentImpact: string;
    inherentLikelihood: string;
    inherentScore: number;
    residualImpact: string | null;
    residualLikelihood: string | null;
    residualScore: number | null;
    status: string;
    treatment: string | null;
    treatmentNotes: string | null;
    ownerId: string | null;
    ownerName: string | null;
    reviewDueAt: string | null;
    isAiRisk?: boolean;
  };
  summary: {
    inherentRisk: number;
    residualRisk: number;
    blastRadius: string;
    exceptionStatus: string;
  };
  evidence: RiskDetailEvidenceItem[];
  activities: RiskDetailActivityItem[];
  remediationSteps: string[];
  enrichedRemediationSteps: RiskRemediationStep[];
  stakeholders: RiskStakeholder[];
  origin: RiskSourceOrigin;
}
