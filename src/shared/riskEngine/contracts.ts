import { z } from 'zod';

export const riskEngineSnapshotSchema = z.object({
  signals: z.number().int().nonnegative(),
  tests: z.number().int().nonnegative(),
  failingTests: z.number().int().nonnegative(),
  evidenceSnapshots: z.number().int().nonnegative(),
  openRisks: z.number().int().nonnegative(),
});

export const normalizedSignalResponseSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  integrationId: z.string(),
  provider: z.string(),
  signalType: z.string(),
  resourceType: z.string(),
  resourceId: z.string(),
  resourceName: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  metadata: z.record(z.string(), z.unknown()),
  observedAt: z.string(),
  collectedAt: z.string(),
});

export const testResultResponseSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  testId: z.string(),
  signalId: z.string(),
  status: z.enum(['PASS', 'FAIL', 'WARNING', 'NOT_APPLICABLE', 'ERROR']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  reason: z.string(),
  executedAt: z.string(),
  evidenceSnapshotIds: z.array(z.string()),
});

export const evidenceSnapshotResponseSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  kind: z.enum(['signal', 'test_result', 'remediation', 'attestation']),
  provider: z.string(),
  integrationId: z.string(),
  resourceId: z.string(),
  controlId: z.string().optional(),
  testId: z.string().optional(),
  hash: z.string(),
  capturedAt: z.string(),
  payload: z.record(z.string(), z.unknown()),
});

export const generatedRiskResponseSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  dedupeKey: z.string(),
  testResultId: z.string(),
  ruleId: z.string(),
  title: z.string(),
  category: z.string(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  likelihood: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  score: z.number().int().nonnegative(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'ACCEPTED', 'MITIGATED']),
  resourceId: z.string(),
  resourceName: z.string(),
  controlIds: z.array(z.string()),
  frameworkIds: z.array(z.string()),
  evidenceSnapshotIds: z.array(z.string()),
  ownerTeam: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const providerSyncStatusResponseSchema = z.object({
  id: z.string(),
  provider: z.string(),
  integrationId: z.string(),
  status: z.enum(['HEALTHY', 'DEGRADED', 'ERROR']),
  lastSyncAt: z.string(),
  lastSuccessAt: z.string(),
  signalsCollected: z.number().int().nonnegative(),
  testsEvaluated: z.number().int().nonnegative(),
  openRisks: z.number().int().nonnegative(),
});

export const scanRunResponseSchema = z.object({
  id: z.string(),
  provider: z.string(),
  integrationId: z.string(),
  startedAt: z.string(),
  completedAt: z.string(),
  status: z.enum(['SUCCEEDED', 'FAILED', 'RUNNING']),
  signalsIngested: z.number().int().nonnegative(),
  testsExecuted: z.number().int().nonnegative(),
  risksGenerated: z.number().int().nonnegative(),
  trigger: z.enum(['scheduled', 'manual', 'webhook']),
});

export const riskEngineEventResponseSchema = z.object({
  id: z.string(),
  eventType: z.enum([
    'integration.sync.completed',
    'signal.ingested',
    'signal.normalized',
    'test.executed',
    'test.failed',
    'risk.created',
    'risk.updated',
    'evidence.created',
  ]),
  provider: z.string(),
  integrationId: z.string(),
  organizationId: z.string(),
  resourceId: z.string(),
  severity: z.enum(['info', 'warning', 'critical']),
  message: z.string(),
  createdAt: z.string(),
  metadata: z.record(z.string(), z.unknown()),
});

export const runEvaluationRequestSchema = z.object({
  organizationId: z.string().optional(),
  dryRun: z.boolean().default(false),
});

export const runEvaluationResponseSchema = z.object({
  testResultsCreated: z.number().int().nonnegative(),
  generatedRisks: z.number().int().nonnegative(),
  dryRun: z.boolean(),
});

// ─── Stakeholder update schemas ───────────────────────────────────────────────

export const stakeholderRoleSchema = z.enum([
  'Technical owner',
  'Business owner',
  'Control owner',
  'Backup owner',
]);

export const updateStakeholdersRequestSchema = z.object({
  stakeholders: z.array(z.object({
    role: stakeholderRoleSchema,
    name: z.string().min(1),
    team: z.string().min(1),
    userId: z.string().optional(),
  })).min(1),
});

export const riskStakeholderResponseSchema = z.object({
  role: stakeholderRoleSchema,
  name: z.string(),
  team: z.string(),
  userId: z.string().optional(),
});

export const stakeholderActivityEntrySchema = z.object({
  id: z.string(),
  type: z.literal('STAKEHOLDER_CHANGED'),
  title: z.string(),
  timestamp: z.string(),
  actor: z.string(),
  meta: z.object({
    field: z.string().optional(),
    oldValue: z.string().optional(),
    newValue: z.string().optional(),
  }).optional(),
});

export const updateStakeholdersResponseSchema = z.object({
  success: z.literal(true),
  stakeholders: z.array(riskStakeholderResponseSchema),
  activityEntry: stakeholderActivityEntrySchema,
});

export const okEnvelope = <T extends z.ZodTypeAny>(schema: T) => z.object({
  success: z.literal(true),
  data: schema,
});

export const riskEngineContracts = {
  getSnapshot: {
    method: 'GET',
    path: '/api/risk-engine/snapshot',
    response: okEnvelope(riskEngineSnapshotSchema),
  },
  listSignals: {
    method: 'GET',
    path: '/api/risk-engine/signals',
    response: okEnvelope(z.array(normalizedSignalResponseSchema)),
  },
  listTestResults: {
    method: 'GET',
    path: '/api/risk-engine/test-results',
    response: okEnvelope(z.array(testResultResponseSchema)),
  },
  listEvidence: {
    method: 'GET',
    path: '/api/risk-engine/evidence-snapshots',
    response: okEnvelope(z.array(evidenceSnapshotResponseSchema)),
  },
  listGeneratedRisks: {
    method: 'GET',
    path: '/api/risk-engine/generated-risks',
    response: okEnvelope(z.array(generatedRiskResponseSchema)),
  },
  listProviderStatuses: {
    method: 'GET',
    path: '/api/risk-engine/provider-statuses',
    response: okEnvelope(z.array(providerSyncStatusResponseSchema)),
  },
  listScanRuns: {
    method: 'GET',
    path: '/api/risk-engine/scan-runs',
    response: okEnvelope(z.array(scanRunResponseSchema)),
  },
  listEvents: {
    method: 'GET',
    path: '/api/risk-engine/events',
    response: okEnvelope(z.array(riskEngineEventResponseSchema)),
  },
  runEvaluation: {
    method: 'POST',
    path: '/api/risk-engine/run',
    body: runEvaluationRequestSchema,
    response: okEnvelope(runEvaluationResponseSchema),
  },
  updateStakeholders: {
    method: 'PATCH',
    path: '/api/risks/:id/stakeholders',
    body: updateStakeholdersRequestSchema,
    response: updateStakeholdersResponseSchema,
  },
} as const;

export type RiskEngineSnapshotDto = z.infer<typeof riskEngineSnapshotSchema>;
export type NormalizedSignalDto = z.infer<typeof normalizedSignalResponseSchema>;
export type TestResultDto = z.infer<typeof testResultResponseSchema>;
export type EvidenceSnapshotDto = z.infer<typeof evidenceSnapshotResponseSchema>;
export type GeneratedRiskDto = z.infer<typeof generatedRiskResponseSchema>;
export type ProviderSyncStatusDto = z.infer<typeof providerSyncStatusResponseSchema>;
export type ScanRunDto = z.infer<typeof scanRunResponseSchema>;
export type RiskEngineEventDto = z.infer<typeof riskEngineEventResponseSchema>;
export type RunEvaluationRequestDto = z.infer<typeof runEvaluationRequestSchema>;
export type RunEvaluationResponseDto = z.infer<typeof runEvaluationResponseSchema>;
export type UpdateStakeholdersRequestDto = z.infer<typeof updateStakeholdersRequestSchema>;
export type UpdateStakeholdersResponseDto = z.infer<typeof updateStakeholdersResponseSchema>;
