/**
 * FindingsPage.tsx — findings list shell.
 *
 * The 1,487-line original was split in Phase 4; the detail panel, remediation
 * panel and evidence-synthesis panel now live in `./findings/`, with shared
 * types and badges in `./findings/shared.tsx`.
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { risksService } from '@/services/api/risks';
import { Risk, RiskStatus } from '@/services/api/types';
import {
  Clock,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
} from 'lucide-react';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  FindingRecord,
  FindingSeverity,
  FindingStatus,
} from '@/services/api/findings';
import {
  fmt,
  isOverdue,
  STATUS_META,
  useFindingsData,
} from '@/app/pages/compliance/useFindingsData';
import { FindingDetailPanel } from './findings/FindingDetailPanel';
import {
  ASSET_SLA_META,
  AssetGroup,
  AssetSlaStatus,
  ImpactBadge,
  KNOWN_SOURCE_TYPES,
  KnownSourceType,
  SeverityBadge,
  SeverityBreakdown,
  StatusBadge,
  isKnownSourceType,
} from './findings/shared';

export function FindingsPage() {
  const { t } = useTranslation('assets');
  const qc = useQueryClient();
  const [filterSeverity, setFilterSeverity] = useState<FindingSeverity | ''>(
    '',
  );
  const [filterStatus, setFilterStatus] = useState<FindingStatus | ''>('');
  const [filterSourceType, setFilterSourceType] = useState<
    KnownSourceType | ''
  >('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<FindingRecord | null>(null);

  const navigate = useNavigate();
  const [view, setView] = useState<'byFinding' | 'byAsset' | 'byVulnerability'>(
    'byFinding',
  );

  const { visible, stats, isLoading, error } = useFindingsData({
    filterSeverity,
    filterStatus,
    filterSourceType,
    search,
  });

  const assetGroups = useMemo<AssetGroup[]>(() => {
    const groups = new Map<string, AssetGroup>();

    for (const f of visible) {
      const key = f.assetId ?? '__unlinked__';
      if (!groups.has(key)) {
        groups.set(key, {
          assetId: f.assetId,
          assetName: f.asset?.name ?? t('findings.unlinked'),
          assetType: f.asset?.type ?? null,
          openFindings: [],
          severityCounts: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
          sourceTypes: [],
          slaStatus: 'OK',
          earliestDue: null,
        });
      }
      const g = groups.get(key)!;
      if (f.status !== 'CLOSED') {
        g.openFindings.push(f);
        g.severityCounts[f.severity]++;
        if (f.dueAt && (!g.earliestDue || f.dueAt < g.earliestDue)) {
          g.earliestDue = f.dueAt;
        }
      }
      if (f.sourceType && !g.sourceTypes.includes(f.sourceType)) {
        g.sourceTypes.push(f.sourceType);
      }
    }

    const now = new Date();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const slaOrder: Record<AssetSlaStatus, number> = {
      OVERDUE: 0,
      DUE_SOON: 1,
      DUE_LATER: 2,
      OK: 3,
    };

    return [...groups.values()]
      .map((g) => {
        let slaStatus: AssetSlaStatus = 'OK';
        if (g.openFindings.some(isOverdue)) {
          slaStatus = 'OVERDUE';
        } else if (g.earliestDue) {
          slaStatus =
            new Date(g.earliestDue).getTime() - now.getTime() <= sevenDaysMs
              ? 'DUE_SOON'
              : 'DUE_LATER';
        }
        return { ...g, slaStatus };
      })
      .sort((a, b) => {
        const d = slaOrder[a.slaStatus] - slaOrder[b.slaStatus];
        if (d !== 0) return d;
        if (a.severityCounts.CRITICAL !== b.severityCounts.CRITICAL)
          return b.severityCounts.CRITICAL - a.severityCounts.CRITICAL;
        if (a.severityCounts.HIGH !== b.severityCounts.HIGH)
          return b.severityCounts.HIGH - a.severityCounts.HIGH;
        return a.assetName.localeCompare(b.assetName);
      });
  }, [visible, t]);

  const assetSlaStats = useMemo(
    () => ({
      overdue: assetGroups.filter((g) => g.slaStatus === 'OVERDUE').length,
      dueSoon: assetGroups.filter((g) => g.slaStatus === 'DUE_SOON').length,
      dueLater: assetGroups.filter((g) => g.slaStatus === 'DUE_LATER').length,
      ok: assetGroups.filter((g) => g.slaStatus === 'OK').length,
    }),
    [assetGroups],
  );

  // ── By Vulnerability data ─────────────────────────────────────────────────
  const { data: risksResponse, isLoading: vulnsLoading } = useQuery({
    queryKey: ['risks', { status: RiskStatus.OPEN }],
    queryFn: () => risksService.getRisks({ status: RiskStatus.OPEN }),
    staleTime: 60_000,
    enabled: view === 'byVulnerability',
  });

  const allVulns = useMemo<Risk[]>(
    () => (risksResponse?.data ?? []) as Risk[],
    [risksResponse],
  );

  const filteredVulns = useMemo(
    () =>
      allVulns.filter((r) => {
        if (filterSeverity && r.impact !== filterSeverity) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            r.title.toLowerCase().includes(q) ||
            (r.asset?.name ?? '').toLowerCase().includes(q)
          );
        }
        return true;
      }),
    [allVulns, filterSeverity, search],
  );

  const vulnStats = useMemo(
    () => ({
      total: allVulns.length,
      critical: allVulns.filter((r) => r.impact === 'CRITICAL').length,
      high: allVulns.filter((r) => r.impact === 'HIGH').length,
      mediumLow: allVulns.filter(
        (r) => r.impact === 'MEDIUM' || r.impact === 'LOW',
      ).length,
    }),
    [allVulns],
  );

  return (
    <PageTemplate
      title={t('findings.title')}
      description={t('findings.description')}
    >
      {/* Tab toggle */}
      <div className="mb-6 flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 w-fit">
        {(
          [
            ['byFinding', t('findings.byFinding')],
            ['byAsset', t('findings.byAsset')],
            ['byVulnerability', t('findings.byVulnerability')],
          ] as ['byFinding' | 'byAsset' | 'byVulnerability', string][]
        ).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              view === v
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Stat cards — differ by view */}
      {view === 'byFinding' && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            {
              key: 'total',
              label: t('findings.total'),
              value: stats.total,
              color: 'text-gray-700',
            },
            {
              key: 'open',
              label: t('findings.open'),
              value: stats.open,
              color: 'text-red-600',
            },
            {
              key: 'inRemediation',
              label: t('findings.inRemediation'),
              value: stats.inRemediation,
              color: 'text-amber-600',
            },
            {
              key: 'closed',
              label: t('findings.closed'),
              value: stats.closed,
              color: 'text-green-600',
            },
            {
              key: 'overdue',
              label: t('findings.overdue'),
              value: stats.overdue,
              color: 'text-red-700',
            },
          ].map((stat) => (
            <Card key={stat.key} className="p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="mt-0.5 text-xs text-gray-500">{stat.label}</p>
            </Card>
          ))}
        </div>
      )}
      {view === 'byAsset' && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            {
              key: 'overdue',
              label: t('findings.assetSla.overdue'),
              value: assetSlaStats.overdue,
              color: 'text-red-600',
            },
            {
              key: 'dueSoon',
              label: t('findings.assetSla.dueSoon'),
              value: assetSlaStats.dueSoon,
              color: 'text-amber-600',
            },
            {
              key: 'dueLater',
              label: t('findings.assetSla.dueLater'),
              value: assetSlaStats.dueLater,
              color: 'text-blue-600',
            },
            {
              key: 'ok',
              label: t('findings.assetSla.ok'),
              value: assetSlaStats.ok,
              color: 'text-green-600',
            },
          ].map((stat) => (
            <Card key={stat.key} className="p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="mt-0.5 text-xs text-gray-500">{stat.label}</p>
            </Card>
          ))}
        </div>
      )}
      {view === 'byVulnerability' && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            {
              key: 'total',
              label: t('findings.vuln.totalOpen'),
              value: vulnStats.total,
              color: 'text-gray-700',
            },
            {
              key: 'critical',
              label: t('findings.vuln.critical'),
              value: vulnStats.critical,
              color: 'text-red-600',
            },
            {
              key: 'high',
              label: t('findings.vuln.high'),
              value: vulnStats.high,
              color: 'text-orange-600',
            },
            {
              key: 'mediumLow',
              label: t('findings.vuln.mediumLow'),
              value: vulnStats.mediumLow,
              color: 'text-amber-600',
            },
          ].map((stat) => (
            <Card key={stat.key} className="p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="mt-0.5 text-xs text-gray-500">{stat.label}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-1.5 text-sm"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('findings.searchPlaceholder')}
          />
        </div>
        <Select
          value={filterSeverity || '__all_severity__'}
          onValueChange={(v) =>
            setFilterSeverity(
              v === '__all_severity__' ? '' : (v as FindingSeverity),
            )
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all_severity__">
              {t('findings.allSeverities')}
            </SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
        {view !== 'byVulnerability' && (
          <Select
            value={filterStatus || '__all_status__'}
            onValueChange={(v) =>
              setFilterStatus(
                v === '__all_status__' ? '' : (v as FindingStatus),
              )
            }
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all_status__">
                {t('findings.allStatuses')}
              </SelectItem>
              {(
                [
                  'OPEN',
                  'IN_REMEDIATION',
                  'READY_FOR_REVIEW',
                  'CLOSED',
                ] as const
              ).map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_META[status].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {view !== 'byVulnerability' && (
          <Select
            value={filterSourceType || '__all_source__'}
            onValueChange={(v) =>
              setFilterSourceType(
                v === '__all_source__' ? '' : (v as KnownSourceType),
              )
            }
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder={t('findings.allSources')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all_source__">
                {t('findings.allSources')}
              </SelectItem>
              {KNOWN_SOURCE_TYPES.map((sourceType) => (
                <SelectItem key={sourceType} value={sourceType}>
                  {t(`findings.sourceType.${sourceType}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <button
          onClick={() => {
            qc.invalidateQueries({ queryKey: ['findings'] });
            if (view === 'byVulnerability')
              qc.invalidateQueries({ queryKey: ['risks'] });
          }}
          className="ml-auto rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {isLoading && (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-400">
          Loading findings...
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-10 text-center text-sm text-red-600">
          {(error as Error).message || 'Failed to load findings.'}
        </div>
      )}

      {!isLoading && !error && view === 'byFinding' && (
        <Card className="overflow-hidden border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="px-4 py-3">Finding</th>
                  <th className="px-4 py-3">Control</th>
                  <th className="px-4 py-3">Related policy</th>
                  <th className="px-4 py-3">Asset</th>
                  <th className="px-4 py-3">{t('findings.columns.source')}</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3">Age</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {visible.map((finding) => (
                  <tr
                    key={finding.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelected(finding)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <Shield className="mt-0.5 h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {finding.title}
                          </div>
                          <div className="line-clamp-2 text-xs text-gray-500">
                            {finding.description ?? 'No description provided.'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {finding.control?.isoReference ?? '—'}
                      <div className="text-gray-400">
                        {finding.control?.title ?? 'Unmapped'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {finding.policy ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(
                              `/compliance/policies/${finding.policy!.id}`,
                            );
                          }}
                          className="text-left font-medium text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          {finding.policy.name}
                          <span className="block text-gray-400">
                            v{finding.policy.versionNumber} ·{' '}
                            {finding.policy.status}
                          </span>
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {finding.asset?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {isKnownSourceType(finding.sourceType)
                        ? t(`findings.sourceType.${finding.sourceType}`)
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="mb-1">
                        <SeverityBadge severity={finding.severity} />
                      </div>
                      <StatusBadge status={finding.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {finding.remediationOwner ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {finding.dueAt ? (
                        <span
                          className={
                            isOverdue(finding)
                              ? 'font-semibold text-red-600'
                              : ''
                          }
                        >
                          {fmt(finding.dueAt)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {finding.ageInDays ?? 0}d
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-10 text-center text-sm text-gray-400"
                    >
                      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-50">
                        <Clock className="h-5 w-5" />
                      </div>
                      {t('findings.noFindings')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!isLoading && !error && view === 'byAsset' && (
        <Card className="overflow-hidden border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="px-4 py-3">{t('findings.columns.asset')}</th>
                  <th className="px-4 py-3">{t('findings.columns.source')}</th>
                  <th className="px-4 py-3">
                    {t('findings.columns.openFindings')}
                  </th>
                  <th className="px-4 py-3">
                    {t('findings.columns.slaStatus')}
                  </th>
                  <th className="px-4 py-3">{t('findings.columns.dueDate')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {assetGroups.map((group) => (
                  <tr
                    key={group.assetId ?? '__unlinked__'}
                    className={
                      group.assetId ? 'cursor-pointer hover:bg-gray-50' : ''
                    }
                    onClick={() => {
                      if (group.assetId)
                        navigate(`/assets/inventory/${group.assetId}`);
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <Shield className="mt-0.5 h-4 w-4 text-gray-400 shrink-0" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {group.assetName}
                          </div>
                          {group.assetType && (
                            <div className="text-xs text-gray-400 capitalize">
                              {group.assetType.toLowerCase()}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {group.sourceTypes.map((st) => (
                          <span
                            key={st}
                            className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                          >
                            {isKnownSourceType(st)
                              ? t(`findings.sourceType.${st}`)
                              : st}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {group.openFindings.length === 0 ? (
                        <span className="text-xs text-gray-400">
                          All closed
                        </span>
                      ) : (
                        <SeverityBreakdown counts={group.severityCounts} />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ASSET_SLA_META[group.slaStatus].color}`}
                      >
                        {ASSET_SLA_META[group.slaStatus].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {group.earliestDue ? (
                        <span
                          className={
                            group.slaStatus === 'OVERDUE'
                              ? 'font-semibold text-red-600'
                              : ''
                          }
                        >
                          {fmt(group.earliestDue)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
                {assetGroups.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-sm text-gray-400"
                    >
                      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-50">
                        <Clock className="h-5 w-5" />
                      </div>
                      {t('findings.noAssetFindings')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {view === 'byVulnerability' && (
        <Card className="overflow-hidden">
          {vulnsLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}
          {!vulnsLoading && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-medium text-gray-500">
                    <th className="px-4 py-3">
                      {t('findings.vuln.columns.title')}
                    </th>
                    <th className="px-4 py-3">
                      {t('findings.vuln.columns.asset')}
                    </th>
                    <th className="px-4 py-3">
                      {t('findings.vuln.columns.impact')}
                    </th>
                    <th className="px-4 py-3">
                      {t('findings.vuln.columns.riskScore')}
                    </th>
                    <th className="px-4 py-3">
                      {t('findings.vuln.columns.detectedAt')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredVulns.map((risk) => (
                    <tr key={risk.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">
                          {risk.title}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {risk.asset?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <ImpactBadge impact={risk.impact} />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {risk.riskScore}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {fmt(risk.createdAt)}
                      </td>
                    </tr>
                  ))}
                  {filteredVulns.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-sm text-gray-400"
                      >
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-50">
                          <ShieldAlert className="h-5 w-5" />
                        </div>
                        {t('findings.vuln.noResults')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {selected && (
        <FindingDetailPanel
          finding={selected}
          onClose={() => setSelected(null)}
          onUpdated={setSelected}
        />
      )}
    </PageTemplate>
  );
}
