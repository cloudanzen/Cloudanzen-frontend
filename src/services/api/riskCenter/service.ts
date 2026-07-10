import { riskLibraryService } from '../risk-library';
import type {
  RiskRegisterEntryDto,
  RiskRegisterOverview,
} from '../risk-library';
import { RiskLevel, RiskStatus } from '../types';
import type {
  TrendDirection,
  RiskCategory,
  RiskOwnerSummary,
  EnterpriseRiskRecord,
  RiskOverviewModel,
  RiskActionItem,
  RiskSnapshotModel,
  RiskLibraryItem,
  RiskSettingsModel,
  RiskDetailModel,
  UpdateStakeholdersRequest,
  UpdateStakeholdersResponse,
} from './types';

// ─── Mapping helpers ──────────────────────────────────────────────────────────

function mapImpactLevel(value: string): RiskLevel {
  const upper = (value ?? '').toUpperCase();
  if (upper === 'CRITICAL') return RiskLevel.CRITICAL;
  if (upper === 'HIGH') return RiskLevel.HIGH;
  if (upper === 'MEDIUM') return RiskLevel.MEDIUM;
  return RiskLevel.LOW;
}

function mapStatus(
  entry: RiskRegisterEntryDto,
): EnterpriseRiskRecord['status'] {
  if (entry.treatment === 'ACCEPT') return RiskStatus.ACCEPTED;
  if (entry.treatment === 'TRANSFER') return RiskStatus.TRANSFERRED;
  switch (entry.status) {
    case 'IDENTIFIED':
      return RiskStatus.OPEN;
    case 'ASSESSING':
    case 'TREATING':
      return 'IN_PROGRESS';
    case 'MONITORING':
      return 'VERIFIED';
    case 'CLOSED':
      return 'CLOSED';
    default:
      return RiskStatus.OPEN;
  }
}

function daysBetween(start: string, end: string) {
  return Math.max(
    0,
    Math.round(
      (new Date(end).getTime() - new Date(start).getTime()) / 86400000,
    ),
  );
}

function toEnterpriseRisk(entry: RiskRegisterEntryDto): EnterpriseRiskRecord {
  const impact = mapImpactLevel(entry.inherentImpact);
  const likelihood = mapImpactLevel(entry.inherentLikelihood);
  const now = new Date().toISOString();
  const exposureDays = daysBetween(entry.createdAt, now);
  const owner: RiskOwnerSummary = {
    name: entry.ownerName ?? 'Unassigned',
    team: '',
  };

  return {
    id: entry.id,
    title: entry.title,
    description: entry.description ?? '',
    impact,
    likelihood,
    status: mapStatus(entry),
    riskScore: entry.inherentScore ?? 0,
    category: (entry.category || 'Compliance') as RiskCategory,
    source: entry.sourceType?.replace(/_/g, ' ') ?? 'Manual',
    assetName: entry.sourceRef ?? '—',
    assetType: '',
    assetCriticality: impact,
    owner,
    dueDate: entry.reviewDueAt ?? '',
    createdAt: entry.createdAt,
    lastSeenAt: entry.updatedAt,
    exposureDays,
    frameworks: [],
    controls: [],
    evidenceCount: entry.findingCount ?? 0,
    treatment: entry.treatmentNotes ?? entry.treatment ?? '—',
    trend: 'flat' as TrendDirection,
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const riskCenterService = {
  async getOverview(): Promise<RiskOverviewModel> {
    const [overviewResult, regResult] = await Promise.all([
      riskLibraryService.getRegisterOverview(),
      riskLibraryService.listRegister(),
    ]);

    const ov = (overviewResult?.data ?? {}) as RiskRegisterOverview;
    const entries: RiskRegisterEntryDto[] = regResult?.data ?? [];
    const risks = entries.map(toEnterpriseRisk);

    const getSevCount = (level: string) =>
      ov.severityBreakdown?.find((s) => s.label.toUpperCase() === level)
        ?.count ?? 0;

    const recentRisks = [...risks]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 5);

    return {
      total: ov.total ?? 0,
      open: ov.open ?? 0,
      mitigated: entries.filter((e) => e.status === 'MONITORING').length,
      accepted: entries.filter((e) => e.treatment === 'ACCEPT').length,
      transferred: entries.filter((e) => e.treatment === 'TRANSFER').length,
      overdue: 0,
      critical: getSevCount('CRITICAL'),
      high: getSevCount('HIGH'),
      medium: getSevCount('MEDIUM'),
      low: getSevCount('LOW'),
      highRiskAssets: 0,
      automatedCoverage: 0,
      evidenceCoverage: 0,
      frameworkCoverage: 0,
      mttrDays: 0,
      categoryBreakdown: (ov.categoryBreakdown ?? []).map((item) => ({
        label: item.label as RiskCategory,
        count: item.count,
      })),
      severityBreakdown: (ov.severityBreakdown ?? []).map((item) => ({
        label: mapImpactLevel(item.label),
        count: item.count,
      })),
      ownerBreakdown: [],
      frameworkBreakdown: [],
      recentRisks,
    };
  },

  async getRiskRegister(): Promise<EnterpriseRiskRecord[]> {
    const result = await riskLibraryService.listRegister();
    const entries: RiskRegisterEntryDto[] = result?.data ?? [];
    return entries
      .map(toEnterpriseRisk)
      .sort((a, b) => b.riskScore - a.riskScore);
  },

  async getRiskDetail(riskId: string): Promise<RiskDetailModel | null> {
    try {
      const result = await riskLibraryService.getRegisterEntry(riskId);
      const entry = result?.data;
      if (!entry) return null;

      const risk = toEnterpriseRisk(entry);

      return {
        risk,
        registerEntry: {
          id: entry.id,
          title: entry.title,
          description: entry.description,
          category: entry.category,
          inherentImpact: entry.inherentImpact,
          inherentLikelihood: entry.inherentLikelihood,
          inherentScore: entry.inherentScore,
          residualImpact: entry.residualImpact,
          residualLikelihood: entry.residualLikelihood,
          residualScore: entry.residualScore,
          status: entry.status,
          treatment: entry.treatment,
          treatmentNotes: entry.treatmentNotes,
          ownerId: entry.ownerId,
          ownerName: entry.ownerName,
          reviewDueAt: entry.reviewDueAt,
          isAiRisk: entry.isAiRisk ?? false,
        },
        summary: {
          inherentRisk: entry.inherentScore ?? 0,
          residualRisk: entry.residualScore ?? 0,
          blastRadius: '—',
          exceptionStatus:
            entry.treatment === 'ACCEPT' ? 'Accepted' : 'No active exception',
        },
        evidence: [],
        activities: [
          {
            id: `${entry.id}-created`,
            type: 'DETECTED',
            title: entry.sourceType
              ? `Risk auto-created from ${entry.sourceType.replace(/_/g, ' ')}`
              : 'Risk manually created',
            timestamp: entry.createdAt,
            actor: entry.sourceType ? 'Risk engine' : 'User',
          },
        ],
        remediationSteps: [],
        enrichedRemediationSteps: [],
        stakeholders: entry.ownerName
          ? [
              {
                role: 'Technical owner',
                name: entry.ownerName,
                team: '',
                userId: entry.ownerId ?? undefined,
              },
            ]
          : [],
        origin: {
          testId: '',
          testName: '',
          controlId: '',
          controlName: '',
          provider: entry.sourceType ?? '',
          signalId: entry.sourceRef ?? '',
          lastFailedAt: entry.updatedAt,
          failureReason: entry.description ?? '',
        },
      };
    } catch {
      return null;
    }
  },

  async updateStakeholders(
    riskId: string,
    request: UpdateStakeholdersRequest,
    actor: string,
  ): Promise<UpdateStakeholdersResponse> {
    // Stakeholder management is not yet supported on the backend.
    // If owner is being changed, update the register entry.
    const techOwner = request.stakeholders.find(
      (s) => s.role === 'Technical owner',
    );
    if (techOwner?.userId) {
      try {
        await riskLibraryService.updateRegisterEntry(riskId, {
          ownerId: techOwner.userId,
        });
      } catch {
        // best-effort
      }
    }

    return {
      success: true,
      stakeholders: request.stakeholders.map((s) => ({
        role: s.role,
        name: s.name,
        team: s.team,
        userId: s.userId,
      })),
      activityEntry: {
        id: `${riskId}-stakeholder-${Date.now()}`,
        type: 'STAKEHOLDER_CHANGED',
        title: techOwner
          ? `Technical owner set to ${techOwner.name}`
          : 'Stakeholders updated',
        timestamp: new Date().toISOString(),
        actor,
      },
    };
  },

  async getActionTracker(): Promise<RiskActionItem[]> {
    const result = await riskLibraryService.listRegister();
    const entries: RiskRegisterEntryDto[] = result?.data ?? [];

    return entries
      .filter((e) => e.status !== 'CLOSED' && e.treatment !== 'ACCEPT')
      .map((entry) => {
        const impact = mapImpactLevel(entry.inherentImpact);
        return {
          id: `action-${entry.id}`,
          riskId: entry.id,
          title: entry.title,
          owner: {
            name: entry.ownerName ?? 'Unassigned',
            team: '',
          } as RiskOwnerSummary,
          priority: (impact === RiskLevel.CRITICAL
            ? 'P1'
            : impact === RiskLevel.HIGH
              ? 'P2'
              : 'P3') as RiskActionItem['priority'],
          dueDate: entry.reviewDueAt ?? '',
          status: (entry.status === 'TREATING' || entry.status === 'ASSESSING'
            ? 'IN_PROGRESS'
            : 'OPEN') as RiskActionItem['status'],
          automation: 'Manual' as const,
          playbook: '—',
          frameworkImpact: [] as string[],
        };
      })
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return +new Date(a.dueDate) - +new Date(b.dueDate);
      });
  },

  async getSnapshot(): Promise<RiskSnapshotModel> {
    const [overviewResult, regResult] = await Promise.all([
      riskLibraryService.getRegisterOverview(),
      riskLibraryService.listRegister(),
    ]);

    const ov = (overviewResult?.data ?? {}) as RiskRegisterOverview;
    const entries: RiskRegisterEntryDto[] = regResult?.data ?? [];
    const now = new Date().toISOString();

    const agingBuckets = [
      { label: '0-7 days', match: (d: number) => d <= 7 },
      { label: '8-30 days', match: (d: number) => d > 7 && d <= 30 },
      { label: '31+ days', match: (d: number) => d > 30 },
    ];

    return {
      generatedAt: now,
      totalRisks: ov.total ?? 0,
      openRisks: ov.open ?? 0,
      overdueRisks: 0,
      acceptedRisks: entries.filter((e) => e.treatment === 'ACCEPT').length,
      residualRiskScore: entries.reduce(
        (sum, e) => sum + (e.residualScore ?? e.inherentScore ?? 0),
        0,
      ),
      controlsAutomated: 0,
      evidenceFreshness: 0,
      exceptionCount: entries.filter((e) => e.treatment === 'ACCEPT').length,
      riskBySeverity: (ov.severityBreakdown ?? []).map((item) => ({
        label: mapImpactLevel(item.label),
        count: item.count,
      })),
      riskByCategory: (ov.categoryBreakdown ?? []).map((item) => ({
        label: item.label as RiskCategory,
        count: item.count,
      })),
      riskAging: agingBuckets.map((bucket) => ({
        label: bucket.label,
        count: entries.filter((e) =>
          bucket.match(daysBetween(e.createdAt, now)),
        ).length,
      })),
      topAssets: [],
      auditReadiness: [
        {
          label: 'Owner assigned',
          value: Math.round(
            (entries.filter((e) => e.ownerId).length /
              Math.max(1, entries.length)) *
              100,
          ),
        },
        {
          label: 'Treatment set',
          value: Math.round(
            (entries.filter((e) => e.treatment).length /
              Math.max(1, entries.length)) *
              100,
          ),
        },
      ],
    };
  },

  async getRiskLibrary(): Promise<RiskLibraryItem[]> {
    const result = await riskLibraryService.listLibrary();
    const items = result?.data ?? [];
    return items.map((item) => ({
      id: item.id,
      title: item.title,
      category: (item.category || 'Compliance') as RiskCategory,
      defaultImpact: mapImpactLevel(item.defaultImpact ?? 'MEDIUM'),
      frameworks: [],
      controls: [],
      automationLevel: 'Manual' as const,
      count: 0,
    }));
  },

  async getSettings(): Promise<RiskSettingsModel> {
    return {
      notifications: [
        {
          id: 'critical-risk',
          label: 'Critical risk alerting',
          enabled: true,
          description: 'Send notifications when critical risks are created.',
        },
        {
          id: 'sla-breach',
          label: 'Overdue remediation alerts',
          enabled: true,
          description: 'Escalate overdue risks to owners.',
        },
      ],
      automations: [
        {
          id: 'risk-create',
          label: 'Automatic risk creation',
          status: 'Active',
          description:
            'Failed scans generate risk register entries automatically.',
        },
      ],
      scoringFactors: [
        { label: 'Severity weight', weight: 40 },
        { label: 'Likelihood weight', weight: 30 },
        { label: 'Exposure duration', weight: 20 },
        { label: 'Asset criticality', weight: 10 },
      ],
      lifecycle: [
        'IDENTIFIED',
        'ASSESSING',
        'TREATING',
        'MONITORING',
        'CLOSED',
      ],
    };
  },
};
