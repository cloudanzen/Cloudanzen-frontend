/**
 * FrameworkDetailPage.tsx
 *
 * Single scrollable page replacing the previous 8-tab layout.
 * Structure:
 *   - Coverage tiles strip
 *   - Readiness over time chart (when ≥2 snapshots)
 *   - Filter bar (All / Gaps / Excluded) + search
 *   - Collapsible domain sections → expandable requirement rows
 *     → nested Controls, Tests, Policies, Risks
 */

import { useState, useMemo, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useParams, useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/app/components/ui/dialog';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Shield,
  FlaskConical,
  FileText,
  AlertTriangle,
  Loader2,
  Search,
  Download,
  FileDown,
  User,
  Calendar,
  ListChecks,
} from 'lucide-react';
import {
  frameworksService,
  type CoverageSnapshotDto,
  type RequirementDetailRow,
} from '@/services/api/frameworks';
import { usersService } from '@/services/api/users';
import { toast } from 'sonner';
import { QK } from '@/lib/queryKeys';

const CoverageChart = lazy(() =>
  import('./frameworkDetail/CoverageChart').then((m) => ({
    default: m.CoverageChart,
  })),
);

// ── Helpers ──────────────────────────────────────────────────────────────────

type FilterMode = 'all' | 'gaps' | 'excluded';

function controlStatusBadge(status: string, t: TFunction) {
  if (status === 'IMPLEMENTED')
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 text-[11px]">
        {t('frameworkDetail.badge.implemented')}
      </Badge>
    );
  if (status === 'PARTIALLY_IMPLEMENTED')
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[11px]">
        {t('frameworkDetail.badge.partial')}
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-gray-400 text-[11px]">
      {t('frameworkDetail.badge.notImplemented')}
    </Badge>
  );
}

function testStatusBadge(status: string, t: TFunction) {
  if (status === 'OK')
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 text-[11px]">
        {t('frameworkDetail.badge.ok')}
      </Badge>
    );
  if (status === 'Overdue')
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200 text-[11px]">
        {t('frameworkDetail.badge.overdue')}
      </Badge>
    );
  if (status === 'Due_soon')
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[11px]">
        {t('frameworkDetail.badge.dueSoon')}
      </Badge>
    );
  if (status === 'Needs_remediation')
    return (
      <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-[11px]">
        {t('frameworkDetail.badge.needsRemediation')}
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-gray-400 text-[11px]">
      {status.replace(/_/g, ' ')}
    </Badge>
  );
}

function policyStatusBadge(status: string, t: TFunction) {
  if (status === 'PUBLISHED')
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 text-[11px]">
        {t('frameworkDetail.badge.published')}
      </Badge>
    );
  if (status === 'DRAFT')
    return (
      <Badge variant="outline" className="text-gray-400 text-[11px]">
        {t('frameworkDetail.badge.draft')}
      </Badge>
    );
  return (
    <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[11px]">
      {status}
    </Badge>
  );
}

function riskLevelBadge(level: string | null, t: TFunction) {
  if (level === 'CRITICAL')
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200 text-[11px]">
        {t('frameworkDetail.badge.critical')}
      </Badge>
    );
  if (level === 'HIGH')
    return (
      <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-[11px]">
        {t('frameworkDetail.badge.high')}
      </Badge>
    );
  if (level === 'MEDIUM')
    return (
      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-[11px]">
        {t('frameworkDetail.badge.medium')}
      </Badge>
    );
  if (level === 'LOW')
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 text-[11px]">
        {t('frameworkDetail.badge.low')}
      </Badge>
    );
  return null;
}

function getRequirementProgress(req: RequirementDetailRow) {
  const completedControls = req.controls.filter(
    (control) => control.controlStatus === 'IMPLEMENTED',
  ).length;
  const completedTests = req.tests.filter(
    (test) => test.testStatus === 'OK',
  ).length;
  const completedPolicies = req.policies.filter(
    (policy) => policy.policyStatus === 'PUBLISHED',
  ).length;
  const total = req.controls.length + req.tests.length + req.policies.length;

  return {
    completed: completedControls + completedTests + completedPolicies,
    total,
  };
}

function requirementProgressLabel(req: RequirementDetailRow, t: TFunction) {
  const progress = getRequirementProgress(req);
  if (progress.total === 0) {
    return t('frameworkDetail.requirement.noMappedItems');
  }
  return t('frameworkDetail.requirement.progress', progress);
}

function mappingTypeBadge(type: string, t: TFunction) {
  if (type === 'direct')
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] px-1.5">
        {t('frameworkDetail.badge.confirmed')}
      </Badge>
    );
  if (type === 'inherited')
    return (
      <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] px-1.5">
        {t('frameworkDetail.badge.inherited')}
      </Badge>
    );
  return (
    <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] px-1.5">
      {t('frameworkDetail.badge.suggested')}
    </Badge>
  );
}

// ── Coverage Tiles ───────────────────────────────────────────────────────────

function CoverageTiles({ snap }: { snap: CoverageSnapshotDto | null }) {
  const { t } = useTranslation('compliance');
  const tiles = [
    {
      label: t('frameworkDetail.tiles.totalRequirements'),
      value: snap?.totalRequirements ?? '—',
      color: 'text-gray-700',
    },
    {
      label: t('frameworkDetail.tiles.applicable'),
      value: snap?.applicable ?? '—',
      color: 'text-blue-700',
    },
    {
      label: t('frameworkDetail.tiles.covered'),
      value: snap?.covered ?? '—',
      color: 'text-green-700',
    },
    {
      label: t('frameworkDetail.tiles.openGaps'),
      value: snap?.openGaps ?? '—',
      color: 'text-red-700',
    },
    {
      label: t('frameworkDetail.tiles.controlCoverage'),
      value: snap ? `${snap.controlCoveragePct}%` : '—',
      color: 'text-blue-700',
    },
    {
      label: t('frameworkDetail.tiles.testPassRate'),
      value: snap ? `${snap.testPassRatePct}%` : '—',
      color: 'text-green-700',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {tiles.map((tile) => (
        <Card key={tile.label} className="border-gray-100">
          <CardContent className="py-3 px-4">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide">
              {tile.label}
            </p>
            <p className={`text-2xl font-bold mt-0.5 ${tile.color}`}>{tile.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Filter Bar ───────────────────────────────────────────────────────────────

function FilterBar({
  filter,
  onFilterChange,
  search,
  onSearchChange,
  counts,
}: {
  filter: FilterMode;
  onFilterChange: (f: FilterMode) => void;
  search: string;
  onSearchChange: (s: string) => void;
  counts: { all: number; gaps: number; excluded: number };
}) {
  const { t } = useTranslation('compliance');
  const modes: { key: FilterMode; label: string; count: number }[] = [
    { key: 'all', label: t('frameworkDetail.filter.all'), count: counts.all },
    { key: 'gaps', label: t('frameworkDetail.filter.gapsOnly'), count: counts.gaps },
    { key: 'excluded', label: t('frameworkDetail.filter.excluded'), count: counts.excluded },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <div className="flex rounded-lg border border-gray-200 overflow-hidden">
        {modes.map((m) => (
          <button
            key={m.key}
            onClick={() => onFilterChange(m.key)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === m.key
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {m.label}{' '}
            <span
              className={`ml-1 ${filter === m.key ? 'text-gray-300' : 'text-gray-400'}`}
            >
              {m.count}
            </span>
          </button>
        ))}
      </div>
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          placeholder={t('frameworkDetail.filter.searchPlaceholder')}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>
    </div>
  );
}

// ── Requirement Row ──────────────────────────────────────────────────────────

function RequirementRow({
  req,
  isExpanded,
  onToggle,
  onOwnerClick,
  onNAClick,
  onMarkApplicable,
  navigate,
}: {
  req: RequirementDetailRow;
  isExpanded: boolean;
  onToggle: () => void;
  onOwnerClick: () => void;
  onNAClick: () => void;
  onMarkApplicable: () => void;
  navigate: (path: string) => void;
}) {
  const { t } = useTranslation('compliance');
  const hasControls = req.controls.length > 0;
  const hasTests = req.tests.length > 0;
  const hasPolicies = req.policies.length > 0;
  const hasRisks = req.risks.length > 0;
  const hasChildren = hasControls || hasTests || hasPolicies || hasRisks;

  const entityCount =
    req.controls.length + req.tests.length + req.policies.length + req.risks.length;

  return (
    <div className="border-b border-gray-50 last:border-0">
      {/* Summary row */}
      <div
        className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50/50 cursor-pointer group"
        onClick={hasChildren ? onToggle : undefined}
      >
        <div className="mt-0.5 w-4 shrink-0">
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )
          ) : (
            <span className="block w-4" />
          )}
        </div>
        <span className="font-mono text-xs text-gray-400 w-16 shrink-0 mt-0.5">
          {req.code}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 leading-snug">{req.title}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {(req.ownerName || req.ownerId) && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <User className="w-3 h-3" /> {req.ownerName ?? req.ownerId}
              </span>
            )}
            {req.dueDate && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />{' '}
                {new Date(req.dueDate).toLocaleDateString()}
              </span>
            )}
            {entityCount > 0 && (
              <span className="text-xs text-gray-300">
                {t('frameworkDetail.requirement.linkedItems', { count: entityCount })}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
          <span className="text-xs font-medium text-gray-500 sm:text-right whitespace-nowrap">
            {requirementProgressLabel(req, t)}
          </span>
          <div className="flex items-center gap-1.5 justify-end">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              title={t('frameworkDetail.requirement.assignOwner')}
              onClick={(e) => {
                e.stopPropagation();
                onOwnerClick();
              }}
            >
              {req.ownerId
                ? t('frameworkDetail.requirement.reassign')
                : t('frameworkDetail.requirement.assign')}
            </Button>
            {!req.isMandatory &&
              (req.applicabilityStatus === 'applicable' ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  title={t('frameworkDetail.requirement.markNA')}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNAClick();
                  }}
                >
                  {t('frameworkDetail.requirement.notApplicable')}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs border-blue-200 text-blue-600 hover:text-blue-700"
                  title={t('frameworkDetail.requirement.markApplicable')}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkApplicable();
                  }}
                >
                  {t('frameworkDetail.requirement.applicable')}
                </Button>
              ))}
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && hasChildren && (
        <div className="pl-12 pr-4 pb-4 space-y-3">
          {/* N/A justification */}
          {req.applicabilityStatus === 'not_applicable' && req.justification && (
            <div className="text-xs text-gray-400 italic bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
              {t('frameworkDetail.badge.notApplicable')} — {req.justification}
            </div>
          )}

          {/* Controls */}
          {hasControls && (
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <Shield className="w-3 h-3" /> {t('frameworkDetail.requirement.controlsCount', { count: req.controls.length })}
              </p>
              <div className="space-y-1">
                {req.controls.map((c) => (
                  <div
                    key={c.controlId}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-50/70 hover:bg-gray-100 cursor-pointer text-sm"
                    onClick={() => navigate(`/compliance/controls?highlight=${c.controlId}`)}
                  >
                    <span className="font-mono text-[11px] text-blue-600 shrink-0">
                      {c.isoReference}
                    </span>
                    <span className="text-gray-700 flex-1 truncate text-xs">
                      {c.controlTitle}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {mappingTypeBadge(c.mappingType, t)}
                      {controlStatusBadge(c.controlStatus, t)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tests */}
          {hasTests && (
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <FlaskConical className="w-3 h-3" /> {t('frameworkDetail.requirement.testsCount', { count: req.tests.length })}
              </p>
              <div className="space-y-1">
                {req.tests.map((test) => (
                  <div
                    key={test.testId}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-50/70 hover:bg-gray-100 cursor-pointer text-sm"
                    onClick={() => navigate(`/validations/${test.testId}`)}
                  >
                    <span className="text-gray-700 flex-1 truncate text-xs">
                      {test.testName}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {test.dueDate && !test.completedAt && (
                        <span className="text-[10px] text-gray-400">
                          {t('frameworkDetail.requirement.due', { date: new Date(test.dueDate).toLocaleDateString() })}
                        </span>
                      )}
                      {testStatusBadge(test.testStatus, t)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Policies */}
          {hasPolicies && (
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3 h-3" /> {t('frameworkDetail.requirement.policiesCount', { count: req.policies.length })}
              </p>
              <div className="space-y-1">
                {req.policies.map((p) => (
                  <div
                    key={p.policyId}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-50/70 hover:bg-gray-100 cursor-pointer text-sm"
                    onClick={() => navigate(`/compliance/policies?highlight=${p.policyId}`)}
                  >
                    <span className="text-gray-700 flex-1 truncate text-xs">
                      {p.policyName}
                    </span>
                    {policyStatusBadge(p.policyStatus, t)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risks */}
          {hasRisks && (
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" /> {t('frameworkDetail.requirement.risksCount', { count: req.risks.length })}
              </p>
              <div className="space-y-1">
                {req.risks.map((r) => (
                  <div
                    key={r.riskId}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-50/70 hover:bg-gray-100 cursor-pointer text-sm"
                    onClick={() => navigate(`/risk/risks/${r.riskId}`)}
                  >
                    <span className="text-gray-700 flex-1 truncate text-xs">
                      {r.riskTitle}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {riskLevelBadge(r.riskLevel, t)}
                      <Badge
                        variant="outline"
                        className="text-[11px] text-gray-500"
                      >
                        {r.riskStatus}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Domain Section ───────────────────────────────────────────────────────────

function DomainSection({
  domain,
  requirements,
  isExpanded,
  onToggle,
  expandedReqs,
  onToggleReq,
  onOwnerClick,
  onNAClick,
  onMarkApplicable,
  navigate,
}: {
  domain: string;
  requirements: RequirementDetailRow[];
  isExpanded: boolean;
  onToggle: () => void;
  expandedReqs: Set<string>;
  onToggleReq: (id: string) => void;
  onOwnerClick: (req: RequirementDetailRow) => void;
  onNAClick: (req: RequirementDetailRow) => void;
  onMarkApplicable: (req: RequirementDetailRow) => void;
  navigate: (path: string) => void;
}) {
  const { t } = useTranslation('compliance');
  const implemented = requirements.filter((r) =>
    r.controls.some((c) => c.controlStatus === 'IMPLEMENTED'),
  ).length;
  const applicable = requirements.filter(
    (r) => r.applicabilityStatus === 'applicable',
  ).length;
  const pct = applicable > 0 ? Math.round((implemented / applicable) * 100) : 0;

  return (
    <Card className="border-gray-100 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50/80 hover:bg-gray-100/80 transition-colors text-left"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
        )}
        <span className="text-sm font-semibold text-gray-700 flex-1">
          {domain}
        </span>
        <span className="text-xs text-gray-400 mr-3">
          {t('frameworkDetail.requirement.requirementsCount', { count: requirements.length })}
        </span>
        <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden shrink-0">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs font-medium text-gray-500 w-10 text-right shrink-0">
          {pct}%
        </span>
      </button>
      {isExpanded && (
        <div>
          {requirements.map((req) => (
            <RequirementRow
              key={req.id}
              req={req}
              isExpanded={expandedReqs.has(req.id)}
              onToggle={() => onToggleReq(req.id)}
              onOwnerClick={() => onOwnerClick(req)}
              onNAClick={() => onNAClick(req)}
              onMarkApplicable={() => onMarkApplicable(req)}
              navigate={navigate}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Export Button ─────────────────────────────────────────────────────────────

function ExportButton({
  slug,
  framework,
  coverage,
  requirements,
}: {
  slug: string;
  framework: { name: string; version: string } | null;
  coverage: CoverageSnapshotDto | null;
  requirements: RequirementDetailRow[];
}) {
  const { t } = useTranslation('compliance');
  const [open, setOpen] = useState(false);

  const downloadCsv = () => {
    const header = [
      ['Framework', framework?.name ?? slug],
      ['Version', framework?.version ?? ''],
      ['Generated At', new Date().toISOString()],
      ['Control Coverage %', String(coverage?.controlCoveragePct ?? 0)],
      ['Test Pass Rate %', String(coverage?.testPassRatePct ?? 0)],
      ['Open Gaps', String(coverage?.openGaps ?? 0)],
      [],
      [
        'Code',
        'Title',
        'Domain',
        'Applicability',
        'Justification',
        'Review Status',
        'Owner',
        'Due Date',
        'Controls',
        'Validations',
        'Policies',
        'Risks',
      ],
    ];
    const rows = requirements.map((req) => [
      req.code,
      req.title,
      req.domain ?? '',
      req.applicabilityStatus,
      req.justification ?? '',
      req.reviewStatus,
      req.ownerName ?? '',
      req.dueDate ?? '',
      String(req.controls.length),
      String(req.tests.length),
      String(req.policies.length),
      String(req.risks.length),
    ]);
    const csv = [...header, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`)
          .join(','),
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${slug}-audit-pack.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  const printPdf = () => {
    const reqRows = requirements
      .map(
        (req) => `<tr>
        <td>${req.code}</td>
        <td>${req.title}</td>
        <td>${req.applicabilityStatus}</td>
        <td>${req.justification ?? ''}</td>
        <td>${req.reviewStatus}</td>
        <td>${req.ownerName ?? ''}</td>
        <td>${req.dueDate ? new Date(req.dueDate).toLocaleDateString() : ''}</td>
      </tr>`,
      )
      .join('');
    const win = window.open(
      '',
      '_blank',
      'noopener,noreferrer,width=1100,height=800',
    );
    if (!win) return;
    win.document.write(`<!doctype html><html><head><title>${slug} audit pack</title><style>
      body{font-family:Arial,sans-serif;padding:24px;color:#111827}
      h1,h2{margin:0 0 12px}
      .meta{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:16px 0 24px}
      .card{border:1px solid #e5e7eb;border-radius:8px;padding:12px}
      table{width:100%;border-collapse:collapse;margin-top:12px}
      td,th{border:1px solid #e5e7eb;padding:8px;text-align:left;font-size:12px;vertical-align:top}
      th{background:#f9fafb}
    </style></head><body>
      <h1>${framework?.name ?? slug} Audit Pack</h1>
      <p>Generated ${new Date().toLocaleString()}</p>
      <div class="meta">
        <div class="card"><strong>Control coverage</strong><br/>${coverage?.controlCoveragePct ?? 0}%</div>
        <div class="card"><strong>Test pass rate</strong><br/>${coverage?.testPassRatePct ?? 0}%</div>
        <div class="card"><strong>Open gaps</strong><br/>${coverage?.openGaps ?? 0}</div>
      </div>
      <h2>Requirements</h2>
      <table>
        <thead><tr><th>Code</th><th>Title</th><th>Applicability</th><th>Justification</th><th>Review</th><th>Owner</th><th>Due</th></tr></thead>
        <tbody>${reqRows}</tbody>
      </table>
    </body></html>`);
    win.document.close();
    win.focus();
    win.print();
    setOpen(false);
  };

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen(!open)}>
        <Download className="w-4 h-4 mr-1.5" /> {t('frameworkDetail.export.export')}
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-44">
            <button
              onClick={downloadCsv}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" /> {t('frameworkDetail.export.downloadCsv')}
            </button>
            <button
              onClick={printPdf}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <FileDown className="w-3.5 h-3.5" /> {t('frameworkDetail.export.printPdf')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export function FrameworkDetailPage() {
  const { t } = useTranslation('compliance');
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  // State
  const [filter, setFilter] = useState<FilterMode>('all');
  const [search, setSearch] = useState('');
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(
    () => new Set(),
  );
  const [expandedReqs, setExpandedReqs] = useState<Set<string>>(
    () => new Set(),
  );

  // Dialog state
  const [ownerDialog, setOwnerDialog] = useState<RequirementDetailRow | null>(
    null,
  );
  const [applicabilityDialog, setApplicabilityDialog] =
    useState<RequirementDetailRow | null>(null);
  const [applicabilityJustification, setApplicabilityJustification] =
    useState('');
  const [ownerInput, setOwnerInput] = useState('');
  const [dueDateInput, setDueDateInput] = useState('');

  // Queries
  const { data: fwRes, isLoading: fwLoading } = useQuery({
    queryKey: QK.frameworkDetail(slug!),
    queryFn: () => frameworksService.getFramework(slug!),
    enabled: !!slug,
  });

  const { data: covRes } = useQuery({
    queryKey: QK.frameworkCoverage(slug!),
    queryFn: () => frameworksService.getCoverage(slug!),
    enabled: !!slug,
  });

  const { data: detailRes, isLoading: detailLoading } = useQuery({
    queryKey: QK.frameworkRequirementView(slug!),
    queryFn: () => frameworksService.getRequirementDetailView(slug!),
    enabled: !!slug,
  });

  const { data: historyRes } = useQuery({
    queryKey: ['frameworks', 'coverage-history', slug],
    queryFn: () => frameworksService.getCoverageHistory(slug!, 90),
    enabled: !!slug,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.listUsers(),
    enabled: !!ownerDialog,
  });

  const fw = fwRes?.data ?? null;
  const snap = covRes?.data ?? null;
  const allRequirements: RequirementDetailRow[] = useMemo(() => detailRes?.data ?? [], [detailRes]);
  const history: CoverageSnapshotDto[] = historyRes?.data ?? [];

  // Mutations
  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: QK.frameworkRequirementView(slug!) });
    qc.invalidateQueries({ queryKey: QK.frameworkCoverage(slug!) });
    qc.invalidateQueries({
      queryKey: ['frameworks', 'org-requirements', slug],
    });
  };

  const ownerMutation = useMutation({
    mutationFn: (req: RequirementDetailRow) =>
      frameworksService.updateRequirementOwner(req.id, {
        ownerId: ownerInput || null,
        dueDate: dueDateInput || null,
      }),
    onSuccess: () => {
      setOwnerDialog(null);
      invalidateAll();
      toast.success(t('frameworkDetail.ownerDialog.success'));
    },
    onError: () => toast.error(t('frameworkDetail.ownerDialog.error')),
  });

  const applicabilityMutation = useMutation({
    mutationFn: ({
      req,
      status,
      justification,
    }: {
      req: RequirementDetailRow;
      status: 'applicable' | 'not_applicable';
      justification?: string;
    }) =>
      frameworksService.updateApplicability(req.id, {
        applicabilityStatus: status,
        justification,
      }),
    onSuccess: () => {
      setApplicabilityDialog(null);
      setApplicabilityJustification('');
      invalidateAll();
    },
  });

  // Filtering
  const filteredRequirements = useMemo(() => {
    let reqs = allRequirements;
    if (filter === 'gaps') {
      reqs = reqs.filter(
        (r) =>
          r.applicabilityStatus === 'applicable' &&
          !r.controls.some((c) => c.controlStatus === 'IMPLEMENTED'),
      );
    } else if (filter === 'excluded') {
      reqs = reqs.filter((r) => r.applicabilityStatus === 'not_applicable');
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      reqs = reqs.filter(
        (r) =>
          r.code.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q),
      );
    }
    return reqs;
  }, [allRequirements, filter, search]);

  // Group by domain
  const domainGroups = useMemo(() => {
    const map: Record<string, RequirementDetailRow[]> = {};
    for (const r of filteredRequirements) {
      const d = r.domain ?? 'General';
      if (!map[d]) map[d] = [];
      map[d].push(r);
    }
    return Object.entries(map).sort(([a], [b]) => {
      const aClause = a.startsWith('Clause');
      const bClause = b.startsWith('Clause');
      if (aClause && bClause) {
        const aNum = parseInt(a.match(/\d+/)?.[0] ?? '0', 10);
        const bNum = parseInt(b.match(/\d+/)?.[0] ?? '0', 10);
        return aNum - bNum;
      }
      if (aClause) return -1;
      if (bClause) return 1;
      return a.localeCompare(b);
    });
  }, [filteredRequirements]);

  // Auto-expand all domains on first load
  const domainsInitialized = expandedDomains.size > 0 || domainGroups.length === 0;
  if (!domainsInitialized && domainGroups.length > 0) {
    setExpandedDomains(new Set(domainGroups.map(([d]) => d)));
  }

  // Counts for filter bar
  const counts = useMemo(
    () => ({
      all: allRequirements.length,
      gaps: allRequirements.filter(
        (r) =>
          r.applicabilityStatus === 'applicable' &&
          !r.controls.some((c) => c.controlStatus === 'IMPLEMENTED'),
      ).length,
      excluded: allRequirements.filter(
        (r) => r.applicabilityStatus === 'not_applicable',
      ).length,
    }),
    [allRequirements],
  );

  // Toggle helpers
  const toggleDomain = (domain: string) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(domain)) next.delete(domain);
      else next.add(domain);
      return next;
    });
  };

  const toggleReq = (id: string) => {
    setExpandedReqs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Loading state
  if (fwLoading) {
    return (
      <PageTemplate title={t('frameworkDetail.loading')}>
        <div className="animate-pulse space-y-5">
          <div className="h-8 w-32 rounded-md bg-muted" />
          <div className="grid grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-muted" />
            ))}
          </div>
          <div className="h-10 w-80 rounded-lg bg-muted" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (!fw) {
    return (
      <PageTemplate title={t('frameworkDetail.notFoundTitle')}>
        <Card className="border-border">
          <CardContent className="py-16 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">
              {t('frameworkDetail.notFoundMessage', { slug })}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate('/compliance/frameworks')}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> {t('frameworkDetail.backToFrameworks')}
            </Button>
          </CardContent>
        </Card>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title={fw.name}
      description={`v${fw.version} · ${fw.description ?? ''}`}
      actions={
        <ExportButton
          slug={slug!}
          framework={fw}
          coverage={snap}
          requirements={allRequirements}
        />
      }
    >
      <div className="space-y-5">
        {/* Back link */}
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 text-muted-foreground"
          onClick={() => navigate('/compliance/frameworks')}
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> {t('frameworkDetail.allFrameworks')}
        </Button>

        {/* Coverage tiles */}
        <CoverageTiles snap={snap} />

        {/* Coverage trend chart — placed near tiles for visibility */}
        {history.length > 1 && snap && (
          <Card className="border-gray-100">
            <CardContent className="py-5 px-5">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">
                {t('frameworkDetail.readinessOverTime')}
              </p>
              <Suspense
                fallback={
                  <div className="h-64 flex items-center justify-center text-xs text-gray-400">
                    {t('frameworkDetail.loadingChart')}
                  </div>
                }
              >
                <CoverageChart history={history} openGaps={snap.openGaps} />
              </Suspense>
            </CardContent>
          </Card>
        )}

        {/* Filter bar */}
        <FilterBar
          filter={filter}
          onFilterChange={setFilter}
          search={search}
          onSearchChange={setSearch}
          counts={counts}
        />

        {/* Domain sections */}
        {detailLoading ? (
          <div className="flex items-center gap-3 py-8 justify-center text-sm text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" /> {t('frameworkDetail.loadingRequirements')}
          </div>
        ) : filteredRequirements.length === 0 ? (
          <Card className="border-dashed border-gray-200 bg-gray-50">
            <CardContent className="py-16 text-center">
              <ListChecks className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">
                {allRequirements.length === 0
                  ? t('frameworkDetail.noRequirements')
                  : t('frameworkDetail.noMatchingRequirements')}
              </p>
              {allRequirements.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  {t('frameworkDetail.activateToLoad')}
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          domainGroups.map(([domain, reqs]) => (
            <DomainSection
              key={domain}
              domain={domain}
              requirements={reqs}
              isExpanded={expandedDomains.has(domain)}
              onToggle={() => toggleDomain(domain)}
              expandedReqs={expandedReqs}
              onToggleReq={toggleReq}
              onOwnerClick={(req) => {
                setOwnerDialog(req);
                setOwnerInput(req.ownerId ?? '');
                setDueDateInput(
                  req.dueDate ? req.dueDate.substring(0, 10) : '',
                );
              }}
              onNAClick={(req) => {
                setApplicabilityDialog(req);
                setApplicabilityJustification(req.justification ?? '');
              }}
              onMarkApplicable={(req) =>
                applicabilityMutation.mutate({
                  req,
                  status: 'applicable',
                })
              }
              navigate={navigate}
            />
          ))
        )}

      </div>

      {/* Owner assignment dialog */}
      <Dialog open={!!ownerDialog} onOpenChange={() => setOwnerDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('frameworkDetail.ownerDialog.title')}</DialogTitle>
            <DialogDescription className="text-sm">
              <span className="font-mono text-xs text-gray-500">
                {ownerDialog?.code}
              </span>{' '}
              {ownerDialog?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div>
              <Label htmlFor="owner" className="text-sm font-medium">
                {t('frameworkDetail.ownerDialog.ownerLabel')}
              </Label>
              <select
                id="owner"
                value={ownerInput}
                onChange={(e) => setOwnerInput(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">{t('frameworkDetail.ownerDialog.selectUser')}</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name ?? u.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="dueDate" className="text-sm font-medium">
                {t('frameworkDetail.ownerDialog.dueDateLabel')}
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDateInput}
                onChange={(e) => setDueDateInput(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setOwnerDialog(null)}>
              {t('frameworkDetail.ownerDialog.cancel')}
            </Button>
            <Button
              onClick={() => ownerDialog && ownerMutation.mutate(ownerDialog)}
              disabled={ownerMutation.isPending}
            >
              {ownerMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : null}
              {t('frameworkDetail.ownerDialog.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark N/A dialog */}
      <Dialog
        open={!!applicabilityDialog}
        onOpenChange={() => setApplicabilityDialog(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('frameworkDetail.naDialog.title')}</DialogTitle>
            <DialogDescription className="text-sm">
              <span className="font-mono text-xs text-gray-500">
                {applicabilityDialog?.code}
              </span>{' '}
              {applicabilityDialog?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="na-justification" className="text-sm font-medium">
              {t('frameworkDetail.naDialog.justificationLabel')}
            </Label>
            <Textarea
              id="na-justification"
              rows={4}
              value={applicabilityJustification}
              onChange={(e) =>
                setApplicabilityJustification(e.target.value)
              }
              placeholder={t('frameworkDetail.naDialog.justificationPlaceholder')}
            />
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setApplicabilityDialog(null)}
            >
              {t('frameworkDetail.naDialog.cancel')}
            </Button>
            <Button
              onClick={() =>
                applicabilityDialog &&
                applicabilityMutation.mutate({
                  req: applicabilityDialog,
                  status: 'not_applicable',
                  justification: applicabilityJustification.trim(),
                })
              }
              disabled={
                applicabilityMutation.isPending ||
                !applicabilityJustification.trim()
              }
            >
              {applicabilityMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : null}
              {t('frameworkDetail.naDialog.saveExclusion')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTemplate>
  );
}
