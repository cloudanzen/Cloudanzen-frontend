/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageTemplate } from '@/app/components/PageTemplate';
import { PageFilterBar } from '@/app/components/filters/PageFilterBar';
import { useUrlFilterState } from '@/app/hooks/useUrlFilterState';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
import { Input } from '@/app/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  FileWarning,
  Plus,
} from 'lucide-react';
import {
  CreateVendorInput,
  VendorStatus,
  VendorTier,
  vendorsService,
} from '@/services/api/vendors';
import { QK } from '@/lib/queryKeys';

type TabKey = 'ALL' | 'DUE' | 'HIGH_RISK';

import {
  getStatusColors,
  getSeverityColors,
} from '@/app/theme/semantic-colors';

const statusMeta: Record<VendorStatus, { label: string; className: string }> = {
  MONITORED: {
    label: 'Monitored',
    className: getStatusColors('MONITORED').className,
  },
  ASSESSMENT_DUE: {
    label: 'Assessment due',
    className: getStatusColors('ASSESSMENT_DUE').className,
  },
  IN_REVIEW: {
    label: 'In review',
    className: getStatusColors('IN_REVIEW').className,
  },
  BLOCKED: {
    label: 'Blocked',
    className: getStatusColors('BLOCKED').className,
  },
};

const tierMeta: Record<VendorTier, { label: string; className: string }> = {
  LOW: { label: 'Low', className: getSeverityColors('LOW').className },
  MEDIUM: { label: 'Medium', className: getSeverityColors('MEDIUM').className },
  HIGH: { label: 'High', className: getSeverityColors('HIGH').className },
  CRITICAL: {
    label: 'Critical',
    className: getSeverityColors('CRITICAL').className,
  },
};

const emptyVendorInput: CreateVendorInput = {
  name: '',
  category: '',
  owner: '',
  website: '',
  businessCriticality: 'Business-important',
  dataClass: 'Sensitive',
};

function isDueWithinDays(
  isoDate: string | null | undefined,
  days: number,
): boolean {
  if (!isoDate) return false;
  const now = new Date();
  const due = new Date(isoDate);
  const diffMs = due.getTime() - now.getTime();
  return diffMs <= days * 24 * 60 * 60 * 1000;
}

function scoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-600 font-semibold';
  if (score >= 50) return 'text-amber-500 font-semibold';
  return 'text-red-500 font-semibold';
}

export function VendorsPage() {
  const { t } = useTranslation('vendors');
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { filters, update, reset } = useUrlFilterState({
    defaults: { search: '', status: 'ALL', tier: 'ALL', tab: 'ALL' },
  });
  const search = filters.search;
  const statusFilter = filters.status as 'ALL' | VendorStatus;
  const tierFilter = filters.tier as 'ALL' | VendorTier;
  const tab = filters.tab as TabKey;

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState<CreateVendorInput>(emptyVendorInput);
  const [creating, setCreating] = useState(false);

  const {
    data: vendors = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: QK.vendors(),
    queryFn: () => vendorsService.list(),
    staleTime: 30_000,
  });

  const stats = useMemo(() => {
    const dueSoon = vendors.filter((v) =>
      isDueWithinDays(v.nextAssessmentAt, 30),
    ).length;
    const highRisk = vendors.filter(
      (v) => v.tier === 'HIGH' || v.tier === 'CRITICAL',
    ).length;
    const openFindings = vendors.reduce((sum, v) => sum + v.openFindings, 0);
    return { dueSoon, highRisk, openFindings };
  }, [vendors]);

  const filteredVendors = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return vendors
      .filter((v) => {
        if (!normalized) return true;
        return (
          v.name.toLowerCase().includes(normalized) ||
          v.category.toLowerCase().includes(normalized) ||
          v.owner.toLowerCase().includes(normalized)
        );
      })
      .filter((v) =>
        statusFilter === 'ALL' ? true : v.status === statusFilter,
      )
      .filter((v) => (tierFilter === 'ALL' ? true : v.tier === tierFilter))
      .filter((v) => {
        if (tab === 'ALL') return true;
        if (tab === 'DUE') return isDueWithinDays(v.nextAssessmentAt, 30);
        return v.tier === 'HIGH' || v.tier === 'CRITICAL';
      })
      .sort(
        (a, b) =>
          new Date(a.nextAssessmentAt).getTime() -
          new Date(b.nextAssessmentAt).getTime(),
      );
  }, [vendors, search, statusFilter, tierFilter, tab]);

  const activeFilters = [
    ...(search.trim()
      ? [
          {
            key: 'search',
            label: t('filters.searchLabel', { value: search.trim() }),
            onRemove: () => update({ search: '' }),
          },
        ]
      : []),
    ...(statusFilter !== 'ALL'
      ? [
          {
            key: 'status',
            label: t('filters.statusLabel', {
              value: t(`status.${statusFilter}`),
            }),
            onRemove: () => update({ status: 'ALL' }),
          },
        ]
      : []),
    ...(tierFilter !== 'ALL'
      ? [
          {
            key: 'tier',
            label: t('filters.tierLabel', {
              value: t(`riskLevel.${tierFilter}`),
            }),
            onRemove: () => update({ tier: 'ALL' }),
          },
        ]
      : []),
    ...(tab !== 'ALL'
      ? [
          {
            key: 'tab',
            label: t('filters.viewLabel', {
              value: tab === 'DUE' ? t('tabs.dueSoon') : t('tabs.highRisk'),
            }),
            onRemove: () => update({ tab: 'ALL' }),
          },
        ]
      : []),
  ];

  async function onCreateVendor() {
    if (!form.name.trim() || !form.category.trim() || !form.owner.trim())
      return;
    setCreating(true);
    try {
      await vendorsService.create({
        ...form,
        name: form.name.trim(),
        category: form.category.trim(),
        owner: form.owner.trim(),
        website: form.website?.trim() || undefined,
      });
      setForm(emptyVendorInput);
      setIsAddOpen(false);
      await qc.invalidateQueries({ queryKey: QK.vendors() });
    } finally {
      setCreating(false);
    }
  }

  return (
    <PageTemplate
      title={t('title')}
      description={t('description')}
      actions={
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('addVendor')}
        </Button>
      }
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {t('failedToLoad')}
        </div>
      )}
      <div className="space-y-6">
        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('stats.vendors')}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-foreground">
                  {vendors.length}
                </p>
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('stats.highRisk')}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-foreground">
                  {stats.highRisk}
                </p>
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('stats.assessmentsDue')}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-foreground">
                  {stats.dueSoon}
                </p>
                <CalendarClock className="h-5 w-5 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('stats.openFindings')}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-foreground">
                  {stats.openFindings}
                </p>
                <FileWarning className="h-5 w-5 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter + table */}
        <Card>
          <CardContent className="pt-6">
            <PageFilterBar
              searchValue={search}
              onSearchChange={(value) => update({ search: value })}
              searchPlaceholder={t('searchPlaceholder')}
              selects={[
                {
                  key: 'status',
                  value: statusFilter,
                  placeholder: t('filters.status'),
                  onChange: (value) =>
                    update({ status: value as 'ALL' | VendorStatus }),
                  options: [
                    { value: 'ALL', label: t('filters.allStatuses') },
                    { value: 'MONITORED', label: t('status.MONITORED') },
                    {
                      value: 'ASSESSMENT_DUE',
                      label: t('status.ASSESSMENT_DUE'),
                    },
                    { value: 'IN_REVIEW', label: t('status.IN_REVIEW') },
                    { value: 'BLOCKED', label: t('status.BLOCKED') },
                  ],
                },
                {
                  key: 'tier',
                  value: tierFilter,
                  placeholder: t('filters.riskTier'),
                  onChange: (value) =>
                    update({ tier: value as 'ALL' | VendorTier }),
                  options: [
                    { value: 'ALL', label: t('filters.allRiskTiers') },
                    { value: 'LOW', label: t('riskLevel.LOW') },
                    { value: 'MEDIUM', label: t('riskLevel.MEDIUM') },
                    { value: 'HIGH', label: t('riskLevel.HIGH') },
                    { value: 'CRITICAL', label: t('riskLevel.CRITICAL') },
                  ],
                },
              ]}
              resultCount={filteredVendors.length}
              resultLabel={t('stats.vendors').toLowerCase()}
              activeFilters={activeFilters}
              onClearAll={reset}
            />

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { key: 'ALL', label: t('tabs.allVendors') },
                { key: 'DUE', label: t('tabs.dueSoon') },
                { key: 'HIGH_RISK', label: t('tabs.highRisk') },
              ].map((item) => (
                <Button
                  key={item.key}
                  variant={tab === item.key ? 'default' : 'outline'}
                  onClick={() => update({ tab: item.key as TabKey })}
                  className="h-8"
                >
                  {item.label}
                </Button>
              ))}
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-3 pr-4">{t('columns.name')}</th>
                    <th className="py-3 pr-4">{t('columns.category')}</th>
                    <th className="py-3 pr-4">{t('table.tier')}</th>
                    <th className="py-3 pr-4">{t('detail.score')}</th>
                    <th className="py-3 pr-4">{t('detail.questionnaire')}</th>
                    <th className="py-3 pr-4">{t('detail.openFindings')}</th>
                    <th className="py-3 pr-4">{t('table.nextReview')}</th>
                    <th className="py-3 pr-0">{t('columns.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-10 text-center text-muted-foreground"
                      >
                        {t('detail.loadingDescription')}
                      </td>
                    </tr>
                  )}
                  {!isLoading && filteredVendors.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-10 text-center text-muted-foreground"
                      >
                        {t('noResults')}
                      </td>
                    </tr>
                  )}
                  {filteredVendors.map((vendor) => (
                    <tr
                      key={vendor.id}
                      className="cursor-pointer border-b last:border-b-0 hover:bg-muted"
                      onClick={() => navigate(`/vendors/${vendor.id}`)}
                    >
                      <td className="py-3 pr-4">
                        <div>
                          <p className="font-medium text-foreground">
                            {vendor.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t('detail.ownerLabel', { owner: vendor.owner })}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-foreground">
                        {vendor.category}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge
                          variant="outline"
                          className={tierMeta[vendor.tier].className}
                        >
                          {t(`riskLevel.${vendor.tier}`)}
                        </Badge>
                      </td>
                      <td
                        className={`py-3 pr-4 ${scoreColor(vendor.securityScore)}`}
                      >
                        {vendor.securityScore}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="w-28">
                          <Progress value={vendor.questionnaireCompletion} />
                          <p className="mt-1 text-xs text-muted-foreground">
                            {vendor.questionnaireCompletion}%
                          </p>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-foreground">
                        {vendor.openFindings}
                      </td>
                      <td className="py-3 pr-4 text-foreground">
                        {vendor.nextAssessmentAt
                          ? new Date(
                              vendor.nextAssessmentAt,
                            ).toLocaleDateString()
                          : t('emptyValue')}
                      </td>
                      <td className="py-3 pr-0">
                        <Badge
                          variant="outline"
                          className={statusMeta[vendor.status].className}
                        >
                          {t(`status.${vendor.status}`)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Vendor Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dialog.addVendorTitle')}</DialogTitle>
            <DialogDescription>
              {t('dialog.addVendorDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Input
              placeholder="Vendor name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
            <Input
              placeholder="Category (e.g. Identity, Payroll)"
              value={form.category}
              onChange={(e) =>
                setForm((p) => ({ ...p, category: e.target.value }))
              }
            />
            <Input
              placeholder="Business owner"
              value={form.owner}
              onChange={(e) =>
                setForm((p) => ({ ...p, owner: e.target.value }))
              }
            />
            <Input
              placeholder="Website (optional)"
              value={form.website}
              onChange={(e) =>
                setForm((p) => ({ ...p, website: e.target.value }))
              }
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <select
                value={form.businessCriticality}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    businessCriticality: e.target.value as any,
                  }))
                }
                className="rounded-md border border-border px-3 py-2 text-sm"
              >
                <option value="Mission-critical">Mission-critical</option>
                <option value="Business-important">Business-important</option>
                <option value="Operational">Operational</option>
              </select>
              <select
                value={form.dataClass}
                onChange={(e) =>
                  setForm((p) => ({ ...p, dataClass: e.target.value as any }))
                }
                className="rounded-md border border-border px-3 py-2 text-sm"
              >
                <option value="PII">PII</option>
                <option value="Sensitive">Sensitive</option>
                <option value="Internal">Internal</option>
                <option value="Public">Public</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onCreateVendor} disabled={creating}>
              {creating ? 'Creating...' : 'Create vendor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTemplate>
  );
}
