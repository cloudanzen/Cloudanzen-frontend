import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageTemplate } from '@/app/components/PageTemplate';
import { PageFilterBar } from '@/app/components/filters/PageFilterBar';
import { ListPaginationBar } from '@/app/components/pagination/ListPaginationBar';
import { useUrlFilterState } from '@/app/hooks/useUrlFilterState';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
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
  ClipboardCheck,
  Plus,
  SearchCode,
  UserPlus,
} from 'lucide-react';
import {
  CreateVendorInput,
  RiskTier,
  VendorStatus,
  vendorsService,
} from '@/services/api/vendors';
import { usersService } from '@/services/api/users';
import { QK } from '@/lib/queryKeys';
import { useCurrentUser, useIsAdmin } from '@/hooks/useCurrentUser';
import { PERMISSIONS, roleHasPermission } from '@/lib/rbac/permissions';
import { RequestVendorDialog } from './RequestVendorDialog';

type TabKey = 'ALL' | 'DUE' | 'HIGH_RISK';

const PAGE_SIZE = 25;

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

const tierMeta: Record<RiskTier, { label: string; className: string }> = {
  LOW: { label: 'Low', className: getSeverityColors('LOW').className },
  MEDIUM: { label: 'Medium', className: getSeverityColors('MEDIUM').className },
  HIGH: { label: 'High', className: getSeverityColors('HIGH').className },
  CRITICAL: {
    label: 'Critical',
    className: getSeverityColors('CRITICAL').className,
  },
};

// Initial form state for the Add Vendor dialog. ownerUserId is empty until
// the User picker fires its onChange.
const emptyVendorInput: CreateVendorInput = {
  name: '',
  category: '',
  ownerUserId: '',
  website: '',
  businessCriticality: 'Business-important',
  dataClass: 'Sensitive',
  subprocessors: 0,
  dpaSigned: false,
};

function scoreColor(score: number | null): string {
  if (score === null) return 'text-muted-foreground';
  if (score < 25) return 'text-emerald-600 font-semibold';
  if (score < 50) return 'text-amber-500 font-semibold';
  return 'text-red-500 font-semibold';
}

export function VendorsPage() {
  const { t } = useTranslation('vendors');
  const navigate = useNavigate();
  const qc = useQueryClient();
  const currentUser = useCurrentUser();
  const isAdmin = useIsAdmin();
  const canCreateIntake = currentUser
    ? roleHasPermission(currentUser.role, PERMISSIONS.ACCESS_REQUESTS_CREATE)
    : false;
  const { filters, update, reset } = useUrlFilterState({
    defaults: { search: '', status: 'ALL', tier: 'ALL', tab: 'ALL' },
  });
  const search = filters.search;
  const statusFilter = filters.status as 'ALL' | VendorStatus;
  const tierFilter = filters.tier as 'ALL' | RiskTier;
  const tab = filters.tab as TabKey;

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [form, setForm] = useState<CreateVendorInput>(emptyVendorInput);
  const [creating, setCreating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const vendorListParams = {
    search: search.trim() || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    effectiveTier: tierFilter === 'ALL' ? undefined : tierFilter,
    highRisk: tab === 'HIGH_RISK' ? true : undefined,
    dueWithinDays: tab === 'DUE' ? 30 : undefined,
    page: currentPage,
    limit: pageSize,
  };

  const {
    data: vendorPage,
    isLoading,
    error,
  } = useQuery({
    queryKey: QK.vendors(vendorListParams),
    queryFn: () => vendorsService.listPage(vendorListParams),
    staleTime: 30_000,
  });
  const vendors = useMemo(() => vendorPage?.data ?? [], [vendorPage?.data]);
  const pagination = vendorPage?.pagination;

  const { data: vendorStats } = useQuery({
    queryKey: ['vendors', 'stats'],
    queryFn: async () => {
      const [all, dueSoon, highRisk, monitored] = await Promise.all([
        vendorsService.listPage({ page: 1, limit: 1 }),
        vendorsService.listPage({ page: 1, limit: 1, dueWithinDays: 30 }),
        vendorsService.listPage({ page: 1, limit: 1, highRisk: true }),
        vendorsService.listPage({ page: 1, limit: 1, status: 'MONITORED' }),
      ]);
      return {
        total: all.pagination.total,
        dueSoon: dueSoon.pagination.total,
        highRisk: highRisk.pagination.total,
        monitored: monitored.pagination.total,
      };
    },
    staleTime: 30_000,
  });

  // Org users feed the owner picker. listUsers() pattern matches ValidationsPage and
  // TestDetailPanel; not enough repeated use yet to justify a shared component.
  const { data: orgUsers = [] } = useQuery({
    queryKey: QK.users(),
    queryFn: () => usersService.listUsers(),
    staleTime: 5 * 60_000,
  });

  const { data: discoveryCandidates = [] } = useQuery({
    queryKey: QK.vendorDiscoveryCandidates({ status: 'PENDING' }),
    queryFn: () => vendorsService.discovery.list({ status: 'PENDING' }),
    enabled: isAdmin,
    staleTime: 30_000,
  });

  const { data: intakeRequests = [] } = useQuery({
    queryKey: QK.vendorIntakeRequests({ status: 'PENDING' }),
    queryFn: () => vendorsService.intake.list({ status: 'PENDING' }),
    enabled: isAdmin,
    staleTime: 30_000,
  });

  const filteredVendors = useMemo(() => {
    return vendors
      .sort((a, b) => {
        const aTime = a.nextAssessmentAt
          ? new Date(a.nextAssessmentAt).getTime()
          : Number.POSITIVE_INFINITY;
        const bTime = b.nextAssessmentAt
          ? new Date(b.nextAssessmentAt).getTime()
          : Number.POSITIVE_INFINITY;
        return aTime - bTime;
      });
  }, [vendors]);

  const updateFilters = (patch: Record<string, string>) => {
    update(patch);
    setCurrentPage(1);
  };

  const activeFilters = [
    ...(search.trim()
      ? [
          {
            key: 'search',
            label: t('filters.searchLabel', { value: search.trim() }),
            onRemove: () => updateFilters({ search: '' }),
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
            onRemove: () => updateFilters({ status: 'ALL' }),
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
            onRemove: () => updateFilters({ tier: 'ALL' }),
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
            onRemove: () => updateFilters({ tab: 'ALL' }),
          },
        ]
      : []),
  ];

  async function onCreateVendor() {
    if (!form.name.trim() || !form.category.trim() || !form.ownerUserId) {
      return;
    }
    setCreating(true);
    try {
      await vendorsService.create({
        ...form,
        name: form.name.trim(),
        category: form.category.trim(),
        website: form.website?.trim() || undefined,
      });
      setForm(emptyVendorInput);
      setIsAddOpen(false);
      await qc.invalidateQueries({ queryKey: ['vendors'] });
    } finally {
      setCreating(false);
    }
  }

  return (
    <PageTemplate
      title={t('title')}
      description={t('description')}
      actions={
        <div className="flex flex-wrap gap-2">
          {canCreateIntake && (
            <Button variant="outline" onClick={() => setIsRequestOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              {t('intake.requestCta')}
            </Button>
          )}
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('addVendor')}
          </Button>
        </div>
      }
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {t('failedToLoad')}
        </div>
      )}
      <div className="space-y-6">
        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('stats.vendors')}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-foreground">
                  {vendorStats?.total ?? pagination?.total ?? vendors.length}
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
                  {vendorStats?.highRisk ?? 0}
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
                  {vendorStats?.dueSoon ?? 0}
                </p>
                <CalendarClock className="h-5 w-5 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('stats.monitored')}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-foreground">
                  {vendorStats?.monitored ?? 0}
                </p>
                <ClipboardCheck className="h-5 w-5 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          {isAdmin && (
            <Card className="cursor-pointer" onClick={() => navigate('/vendors/discovery')}>
              <CardContent className="pt-6">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t('stats.discovered')}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-2xl font-bold text-foreground">
                    {discoveryCandidates.length}
                  </p>
                  <SearchCode className="h-5 w-5 text-sky-500" />
                </div>
              </CardContent>
            </Card>
          )}
          {isAdmin && (
            <Card className="cursor-pointer" onClick={() => navigate('/vendors/intake-requests')}>
              <CardContent className="pt-6">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t('stats.intakeRequests')}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-2xl font-bold text-foreground">
                    {intakeRequests.length}
                  </p>
                  <UserPlus className="h-5 w-5 text-violet-500" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Filter + table */}
        <Card>
          <CardContent className="pt-6">
            <PageFilterBar
              searchValue={search}
              onSearchChange={(value) => updateFilters({ search: value })}
              searchPlaceholder={t('searchPlaceholder')}
              selects={[
                {
                  key: 'status',
                  value: statusFilter,
                  placeholder: t('filters.status'),
                  onChange: (value) =>
                    updateFilters({ status: value as 'ALL' | VendorStatus }),
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
                    updateFilters({ tier: value as 'ALL' | RiskTier }),
                  options: [
                    { value: 'ALL', label: t('filters.allRiskTiers') },
                    { value: 'LOW', label: t('riskLevel.LOW') },
                    { value: 'MEDIUM', label: t('riskLevel.MEDIUM') },
                    { value: 'HIGH', label: t('riskLevel.HIGH') },
                    { value: 'CRITICAL', label: t('riskLevel.CRITICAL') },
                  ],
                },
              ]}
              resultCount={pagination?.total ?? filteredVendors.length}
              resultLabel={t('stats.vendors').toLowerCase()}
              activeFilters={activeFilters}
              onClearAll={() => {
                reset();
                setCurrentPage(1);
              }}
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
                  onClick={() => updateFilters({ tab: item.key as TabKey })}
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
                    <th className="py-3 pr-4">{t('table.inherentTier')}</th>
                    <th className="py-3 pr-4">{t('table.residualTier')}</th>
                    <th className="py-3 pr-4">{t('table.inherentScore')}</th>
                    <th className="py-3 pr-4">{t('table.nextReview')}</th>
                    <th className="py-3 pr-0">{t('columns.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-10 text-center text-muted-foreground"
                      >
                        {t('detail.loadingDescription')}
                      </td>
                    </tr>
                  )}
                  {!isLoading && filteredVendors.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-10 text-center text-muted-foreground"
                      >
                        {t('noResults')}
                      </td>
                    </tr>
                  )}
                  {filteredVendors.map((vendor) => {
                    const inherent = vendor.inherentTier;
                    const residual = vendor.residualTier;
                    return (
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
                              {t('detail.ownerLabel', {
                                owner:
                                  vendor.ownerUser?.name ??
                                  vendor.ownerUser?.email ??
                                  t('emptyValue'),
                              })}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-foreground">
                          {vendor.category}
                        </td>
                        <td className="py-3 pr-4">
                          {inherent ? (
                            <Badge
                              variant="outline"
                              className={tierMeta[inherent].className}
                            >
                              {t(`riskLevel.${inherent}`)}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {t('emptyValue')}
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {residual ? (
                            <Badge
                              variant="outline"
                              className={tierMeta[residual].className}
                            >
                              {t(`riskLevel.${residual}`)}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {t('table.pendingReview')}
                            </span>
                          )}
                        </td>
                        <td
                          className={`py-3 pr-4 ${scoreColor(vendor.inherentRiskScore)}`}
                        >
                          {vendor.inherentRiskScore ?? t('emptyValue')}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
            {pagination && (
              <ListPaginationBar
                className="mt-4"
                page={pagination.page}
                pageSize={pageSize}
                total={pagination.total}
                itemLabel="vendor"
                onPageChange={setCurrentPage}
                onPageSizeChange={(nextPageSize) => {
                  setPageSize(nextPageSize);
                  setCurrentPage(1);
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <RequestVendorDialog
        open={isRequestOpen}
        onOpenChange={setIsRequestOpen}
      />

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
              placeholder={t('dialog.nameField')}
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
            <Input
              placeholder={t('dialog.categoryField')}
              value={form.category}
              onChange={(e) =>
                setForm((p) => ({ ...p, category: e.target.value }))
              }
            />
            <select
              value={form.ownerUserId}
              onChange={(e) =>
                setForm((p) => ({ ...p, ownerUserId: e.target.value }))
              }
              className="rounded-md border border-border px-3 py-2 text-sm"
            >
              <option value="">{t('dialog.ownerPlaceholder')}</option>
              {orgUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ? `${u.name} (${u.email})` : u.email}
                </option>
              ))}
            </select>
            <Input
              placeholder={t('dialog.websiteField')}
              value={form.website ?? ''}
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
                    businessCriticality:
                      e.target.value as CreateVendorInput['businessCriticality'],
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
                  setForm((p) => ({
                    ...p,
                    dataClass: e.target.value as CreateVendorInput['dataClass'],
                  }))
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
              {t('dialog.cancel')}
            </Button>
            <Button
              onClick={onCreateVendor}
              disabled={
                creating ||
                !form.name.trim() ||
                !form.category.trim() ||
                !form.ownerUserId
              }
            >
              {creating ? t('dialog.creating') : t('dialog.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTemplate>
  );
}
