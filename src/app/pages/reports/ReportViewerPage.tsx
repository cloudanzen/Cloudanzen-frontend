// F2: Recharts is imported lazily so the vendor-charts chunk is only fetched
// when the ReportViewerPage is actually visited. Since this page is already
// a lazy-loaded route, the Recharts chunk is deferred until first navigation.
import React, { useState, useMemo } from 'react';

import { useParams, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  ArrowLeft,
  RefreshCw,
  Calendar,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ClipboardList,
} from 'lucide-react';
import { reportsService } from '@/services/api/reports';
import { Card } from '@/app/components/ui/card';
import { fmtDate } from '@/lib/format-date';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  color = 'text-gray-900',
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <Card className="p-4">
      <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
        {label}
      </dt>
      <dd className={`text-2xl font-bold ${color}`}>{value}</dd>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </Card>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-3">
      <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <SectionHeader title={title} subtitle={subtitle} />
      {children}
    </Card>
  );
}

const RISK_COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#f59e0b',
  LOW: '#22c55e',
};
const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#6b7280'];

// ─── Period picker ────────────────────────────────────────────────────────────

function periodToRange(
  type: 'monthly' | 'quarterly',
  value: string,
): { startDate: string; endDate: string } {
  if (type === 'monthly') {
    const parts = value.split("-").map(Number); const year = parts[0]!; const month = parts[1]!;
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    };
  } else {
    // value like "2026-Q1"
    const [year, q] = value.split('-Q');
    const qNum = Number(q);
    const startMonth = (qNum - 1) * 3;
    const start = new Date(Number(year), startMonth, 1);
    const end = new Date(Number(year), startMonth + 3, 0);
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    };
  }
}

function defaultMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function defaultQuarterValue() {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `${now.getFullYear()}-Q${q}`;
}

// Generate month options (last 12 months)
function monthOptions() {
  const opts: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    opts.push({ value: val, label });
  }
  return opts;
}

function quarterOptions() {
  const opts: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 8; i++) {
    const totalQ = Math.ceil((now.getMonth() + 1) / 3) - i;
    const year = now.getFullYear() + Math.floor((totalQ - 1) / 4);
    const q = ((totalQ - 1 + 40) % 4) + 1;
    if (q < 1 || q > 4) continue;
    const val = `${year}-Q${q}`;
    opts.push({ value: val, label: `Q${q} ${year}` });
  }
  return opts;
}

// ─── Framework Progress view ──────────────────────────────────────────────────

function FrameworkProgressView({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'framework-progress', startDate, endDate],
    queryFn: async () => {
      const res = await reportsService.getFrameworkProgress({
        startDate,
        endDate,
      });
      return res.data;
    },
  });

  if (isLoading) return <Skeleton />;
  if (!data) return <Empty />;

  const pieData = [
    { name: 'Implemented', value: data.summary.implemented },
    { name: 'Partial', value: data.summary.partial },
    { name: 'Not Implemented', value: data.summary.notImpl },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Total Controls" value={data.summary.total} />
        <KpiCard
          label="Implemented"
          value={data.summary.implemented}
          color="text-green-600"
        />
        <KpiCard
          label="Partial"
          value={data.summary.partial}
          color="text-amber-600"
        />
        <KpiCard
          label="Completion"
          value={`${data.summary.pct}%`}
          color="text-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Control Status Distribution">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={(({ name, percent = 0 }: { name: string; percent?: number }) =>
                  `${name} ${Math.round(percent * 100)}%`) as (props: unknown) => string}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i] ?? '#ccc'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Completion % Over Period"
          subtitle="Snapshot per bucket"
        >
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
              <Tooltip formatter={((v: number) => `${v}%`) as (v: unknown) => string} />
              <Area
                type="monotone"
                dataKey="pct"
                stroke="#6366f1"
                fill="#e0e7ff"
                strokeWidth={2}
                name="Completion %"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

// ─── Risk Trend view ──────────────────────────────────────────────────────────

function RiskTrendView({
  startDate,
  endDate,
  granularity,
}: {
  startDate: string;
  endDate: string;
  granularity: 'week' | 'month';
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'risk-trend', startDate, endDate, granularity],
    queryFn: async () => {
      const res = await reportsService.getRiskTrend({
        startDate,
        endDate,
        granularity,
      });
      return res.data;
    },
  });

  if (isLoading) return <Skeleton />;
  if (!data) return <Empty />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Total Risks" value={data.summary.total} />
        <KpiCard
          label="Critical"
          value={data.summary.CRITICAL}
          color="text-red-600"
        />
        <KpiCard
          label="High"
          value={data.summary.HIGH}
          color="text-orange-600"
        />
        <KpiCard
          label="Open"
          value={data.summary.open}
          color="text-amber-600"
        />
      </div>

      <ChartCard
        title="Risk Distribution Over Time"
        subtitle="New risks per period by severity"
      >
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.series}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="CRITICAL"
              stackId="a"
              fill={RISK_COLORS.CRITICAL}
              name="Critical"
            />
            <Bar
              dataKey="HIGH"
              stackId="a"
              fill={RISK_COLORS.HIGH}
              name="High"
            />
            <Bar
              dataKey="MEDIUM"
              stackId="a"
              fill={RISK_COLORS.MEDIUM}
              name="Medium"
            />
            <Bar dataKey="LOW" stackId="a" fill={RISK_COLORS.LOW} name="Low" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

// ─── Test Completion view ─────────────────────────────────────────────────────

function TestCompletionView({
  startDate,
  endDate,
  granularity,
}: {
  startDate: string;
  endDate: string;
  granularity: 'week' | 'month';
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'test-completion', startDate, endDate, granularity],
    queryFn: async () => {
      const res = await reportsService.getTestCompletion({
        startDate,
        endDate,
        granularity,
      });
      return res.data;
    },
  });

  if (isLoading) return <Skeleton />;
  if (!data) return <Empty />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Total Tests" value={data.summary.total} />
        <KpiCard
          label="Completed"
          value={data.summary.completed}
          color="text-green-600"
        />
        <KpiCard
          label="Overdue"
          value={data.summary.overdue}
          color="text-red-600"
        />
        <KpiCard
          label="Pass Rate"
          value={`${data.summary.passRate}%`}
          color="text-blue-600"
        />
      </div>

      <ChartCard
        title="Test Completion Over Time"
        subtitle="Completions per period by timing"
      >
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.series}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="onTime" stackId="a" fill="#22c55e" name="On Time" />
            <Bar
              dataKey="late"
              stackId="a"
              fill="#ef4444"
              name="Past Due Date"
            />
            <Bar
              dataKey="noDue"
              stackId="a"
              fill="#94a3b8"
              name="No Due Date"
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

// ─── Audit Summary view ───────────────────────────────────────────────────────

function AuditSummaryView({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'audit-summary', startDate, endDate],
    queryFn: async () => {
      const res = await reportsService.getAuditSummary({ startDate, endDate });
      return res.data;
    },
  });

  if (isLoading) return <Skeleton />;
  if (!data) return <Empty />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <KpiCard label="Total Audits" value={data.summary.totalAudits} />
        <KpiCard
          label="Completed"
          value={data.summary.completed}
          color="text-green-600"
        />
        <KpiCard
          label="In Progress"
          value={data.summary.inProgress}
          color="text-amber-600"
        />
        <KpiCard
          label="Open Findings"
          value={data.summary.openFindings}
          color="text-red-600"
        />
        <KpiCard
          label="Closed Findings"
          value={data.summary.closedFindings}
          color="text-gray-600"
        />
        <KpiCard
          label="Avg Compliance"
          value={
            data.summary.avgCompliancePct != null
              ? `${data.summary.avgCompliancePct}%`
              : '—'
          }
          color="text-blue-600"
          sub="completed audits"
        />
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-800">Audit List</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {[
                  'Type',
                  'Scope',
                  'Auditor',
                  'Start',
                  'End',
                  'Status',
                  'Compliance %',
                  'Major',
                  'Minor',
                  'Obs.',
                  '',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.audits.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-6 text-center text-sm text-gray-400"
                  >
                    No audits in this period.
                  </td>
                </tr>
              ) : (
                data.audits.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{a.type}</td>
                    <td className="px-4 py-2 text-gray-600 max-w-[160px] truncate">
                      {a.scope}
                    </td>
                    <td className="px-4 py-2 text-gray-600">{a.auditor}</td>
                    <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                      {fmtDate(a.startDate)}
                    </td>
                    <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                      {fmtDate(a.endDate)}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.status === 'Completed' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-blue-700 font-medium">
                      {a.compliancePct != null ? `${a.compliancePct}%` : '—'}
                    </td>
                    <td className="px-4 py-2 text-red-600 font-medium">
                      {a.major}
                    </td>
                    <td className="px-4 py-2 text-amber-600">{a.minor}</td>
                    <td className="px-4 py-2 text-gray-500">{a.observation}</td>
                    <td className="px-4 py-2">
                      {a.status === 'Completed' && (
                        <button
                          onClick={() =>
                            navigate(`/auditor/audits/${a.id}/final-report`)
                          }
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                        >
                          <ClipboardList className="w-3.5 h-3.5" />
                          Report
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Evidence Coverage view ───────────────────────────────────────────────────

function EvidenceCoverageView() {
  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'evidence-coverage'],
    queryFn: async () => {
      const res = await reportsService.getEvidenceCoverage();
      return res.data;
    },
  });

  if (isLoading) return <Skeleton />;
  if (!data) return <Empty />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Total Controls" value={data.summary.total} />
        <KpiCard
          label="With Evidence"
          value={data.summary.withEvidence}
          color="text-green-600"
        />
        <KpiCard
          label="Without Evidence"
          value={data.summary.withoutEvidence}
          color="text-red-600"
        />
        <KpiCard
          label="Coverage"
          value={`${data.summary.coveragePct}%`}
          color="text-blue-600"
        />
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <h2 className="text-sm font-semibold text-gray-800">
            Evidence by Control
          </h2>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b sticky top-0">
              <tr>
                {['Reference', 'Title', 'Status', 'Evidence'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.controls.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-xs font-semibold text-blue-800">
                    {c.isoReference}
                  </td>
                  <td className="px-4 py-2 text-gray-700">{c.title}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        c.status === 'IMPLEMENTED'
                          ? 'bg-green-50 text-green-700'
                          : c.status === 'PARTIALLY_IMPLEMENTED'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {c.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {c.evidenceCount > 0 ? (
                      <span className="flex items-center gap-1 text-green-700">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {c.evidenceCount}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-500">
                        <XCircle className="w-3.5 h-3.5" />
                        None
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Personnel Compliance view ────────────────────────────────────────────────

function PersonnelComplianceView() {
  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'personnel-compliance'],
    queryFn: async () => {
      const res = await reportsService.getPersonnelCompliance();
      return res.data;
    },
  });

  if (isLoading) return <Skeleton />;
  if (!data) return <Empty />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Total Personnel" value={data.summary.total} />
        <KpiCard
          label="Fully Complete"
          value={data.summary.allComplete}
          color="text-green-600"
        />
        <KpiCard
          label="Partial"
          value={data.summary.partial}
          color="text-amber-600"
        />
        <KpiCard
          label="Not Started"
          value={data.summary.notStarted}
          color="text-red-600"
        />
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <h2 className="text-sm font-semibold text-gray-800">
            Personnel Onboarding Status
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {[
                  'Name',
                  'Email',
                  'Role',
                  'Policy',
                  'MDM',
                  'Training',
                  'Overall',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-800">
                    {u.name}
                  </td>
                  <td className="px-4 py-2 text-gray-500 text-xs">{u.email}</td>
                  <td className="px-4 py-2 text-gray-500 text-xs">{u.role}</td>
                  <td className="px-4 py-2">
                    {u.policyAccepted ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-300" />
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {u.mdmEnrolled ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-300" />
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {u.trainingCompleted ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-300" />
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.allComplete
                          ? 'bg-green-50 text-green-700'
                          : u.completedCount > 0
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {u.completedCount}/3
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Combined Overview view (monthly / quarterly) ─────────────────────────────

function OverviewView({
  startDate,
  endDate,
  granularity,
}: {
  startDate: string;
  endDate: string;
  granularity: 'week' | 'month';
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          Section 1 — Framework Progress
        </h2>
        <FrameworkProgressView startDate={startDate} endDate={endDate} />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          Section 2 — Risk Distribution
        </h2>
        <RiskTrendView
          startDate={startDate}
          endDate={endDate}
          granularity={granularity}
        />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          Section 3 — Test Completion
        </h2>
        <TestCompletionView
          startDate={startDate}
          endDate={endDate}
          granularity={granularity}
        />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          Section 4 — Audit Summary
        </h2>
        <AuditSummaryView startDate={startDate} endDate={endDate} />
      </div>
    </div>
  );
}

// ─── Skeleton / Empty ─────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

function Empty() {
  return (
    <div className="py-12 text-center text-sm text-gray-400">
      <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
      No data available for this period.
    </div>
  );
}

// ─── Report config map ────────────────────────────────────────────────────────

type ViewerType =
  | 'monthly-overview'
  | 'quarterly-overview'
  | 'framework-progress'
  | 'risk-register'
  | 'test-effectiveness'
  | 'audit-status'
  | 'evidence-coverage'
  | 'personnel-compliance';

const VIEWER_META: Record<
  ViewerType,
  {
    title: string;
    hasPeriod: boolean;
    periodType?: 'monthly' | 'quarterly';
    hasGranularity?: boolean;
  }
> = {
  'monthly-overview': {
    title: 'Monthly Overview Report',
    hasPeriod: true,
    periodType: 'monthly',
    hasGranularity: false,
  },
  'quarterly-overview': {
    title: 'Quarterly Overview Report',
    hasPeriod: true,
    periodType: 'quarterly',
    hasGranularity: false,
  },
  'framework-progress': {
    title: 'Framework Progress Report',
    hasPeriod: true,
    periodType: 'monthly',
    hasGranularity: false,
  },
  'risk-register': {
    title: 'Risk Register Report',
    hasPeriod: true,
    periodType: 'monthly',
    hasGranularity: true,
  },
  'test-effectiveness': {
    title: 'Test Effectiveness Report',
    hasPeriod: true,
    periodType: 'monthly',
    hasGranularity: true,
  },
  'audit-status': {
    title: 'Audit Status Report',
    hasPeriod: true,
    periodType: 'monthly',
    hasGranularity: false,
  },
  'evidence-coverage': { title: 'Evidence Coverage Report', hasPeriod: false },
  'personnel-compliance': {
    title: 'Personnel Compliance Report',
    hasPeriod: false,
  },
};

// ─── Main page ────────────────────────────────────────────────────────────────

export function ReportViewerPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();

  const meta = VIEWER_META[reportId as ViewerType];

  const isMonthly = meta?.periodType === 'monthly';
  const isQuarterly = meta?.periodType === 'quarterly';
  const isOverview =
    reportId === 'monthly-overview' || reportId === 'quarterly-overview';

  const [monthValue, setMonthValue] = useState(defaultMonthValue);
  const [quarterValue, setQuarterValue] = useState(defaultQuarterValue);
  const [granularity, setGranularity] = useState<'week' | 'month'>('month');
  const [generated, setGenerated] = useState(false);
  const [range, setRange] = useState<{
    startDate: string;
    endDate: string;
  } | null>(null);

  const handleGenerate = () => {
    if (
      isMonthly ||
      reportId === 'framework-progress' ||
      meta?.periodType === 'monthly'
    ) {
      setRange(periodToRange('monthly', monthValue));
    } else if (isQuarterly) {
      setRange(periodToRange('quarterly', quarterValue));
    } else {
      // default: last 90 days
      const end = new Date();
      const start = new Date(Date.now() - 90 * 86400000);
      setRange({
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
      });
    }
    setGenerated(true);
  };

  // Auto-generate for no-period reports
  const autoRange = useMemo(() => {
    const end = new Date();
    const start = new Date(Date.now() - 90 * 86400000);
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    };
  }, []);

  if (!meta) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/reports')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Reports
        </button>
        <p className="text-gray-500">Unknown report type.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/reports')}
          className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{meta.title}</h1>
          {range && (
            <p className="text-xs text-gray-400 mt-0.5">
              Period: {fmtDate(range.startDate)} — {fmtDate(range.endDate)}
            </p>
          )}
        </div>
      </div>

      {/* Period picker + generate */}
      {meta.hasPeriod && (
        <Card className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                Reporting Period
              </span>
            </div>

            {isMonthly || (!isQuarterly && meta.periodType === 'monthly') ? (
              <select
                value={monthValue}
                onChange={(e) => setMonthValue(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {monthOptions().map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={quarterValue}
                onChange={(e) => setQuarterValue(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {quarterOptions().map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            )}

            {meta.hasGranularity && (
              <select
                value={granularity}
                onChange={(e) =>
                  setGranularity(e.target.value as 'week' | 'month')
                }
                className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="month">Monthly buckets</option>
                <option value="week">Weekly buckets</option>
              </select>
            )}

            <button
              onClick={handleGenerate}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Generate
            </button>
          </div>
        </Card>
      )}

      {/* Report content */}
      {reportId === 'evidence-coverage' && <EvidenceCoverageView />}
      {reportId === 'personnel-compliance' && <PersonnelComplianceView />}

      {/* Period-based reports — shown after Generate */}
      {isOverview && generated && range && (
        <OverviewView
          startDate={range.startDate}
          endDate={range.endDate}
          granularity={isMonthly ? 'week' : 'month'}
        />
      )}
      {reportId === 'framework-progress' && generated && range && (
        <FrameworkProgressView
          startDate={range.startDate}
          endDate={range.endDate}
        />
      )}
      {reportId === 'risk-register' && generated && range && (
        <RiskTrendView
          startDate={range.startDate}
          endDate={range.endDate}
          granularity={granularity}
        />
      )}
      {reportId === 'test-effectiveness' && generated && range && (
        <TestCompletionView
          startDate={range.startDate}
          endDate={range.endDate}
          granularity={granularity}
        />
      )}
      {reportId === 'audit-status' && (
        <AuditSummaryView
          startDate={generated && range ? range.startDate : autoRange.startDate}
          endDate={generated && range ? range.endDate : autoRange.endDate}
        />
      )}

      {/* Prompt for period selection */}
      {meta.hasPeriod &&
        !generated &&
        !['audit-status'].includes(reportId!) && (
          <div className="py-16 text-center text-sm text-gray-400">
            <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            Select a reporting period and click <strong>Generate</strong> to
            view this report.
          </div>
        )}
    </div>
  );
}
