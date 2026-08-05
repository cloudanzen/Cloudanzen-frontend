/**
 * FrameworkDetailPage.tsx — framework detail shell.
 *
 * The requirement rows, domain sections, coverage tiles, filter bar and export
 * button live in `./frameworkDetail/`, alongside the lazy-loaded CoverageChart
 * that was already there. Shared badge helpers are in
 * `./frameworkDetail/shared.tsx`.
 */

import { useState, useMemo, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card, CardContent } from '@/app/components/ui/card';
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
import { ArrowLeft, AlertTriangle, Loader2, ListChecks } from 'lucide-react';
import {
  frameworksService,
  type CoverageSnapshotDto,
  type RequirementDetailRow,
} from '@/services/api/frameworks';
import { usersService } from '@/services/api/users';
import { toast } from 'sonner';
import { QK } from '@/lib/queryKeys';
import { CoverageTiles } from './frameworkDetail/CoverageTiles';
import { FilterBar } from './frameworkDetail/FilterBar';
import { DomainSection } from './frameworkDetail/DomainSection';
import { ExportButton } from './frameworkDetail/ExportButton';
import { FilterMode } from './frameworkDetail/shared';

const CoverageChart = lazy(() =>
  import('./frameworkDetail/CoverageChart').then((m) => ({
    default: m.CoverageChart,
  })),
);

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
  const allRequirements: RequirementDetailRow[] = useMemo(
    () => detailRes?.data ?? [],
    [detailRes],
  );
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
          r.code.toLowerCase().includes(q) || r.title.toLowerCase().includes(q),
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
  const domainsInitialized =
    expandedDomains.size > 0 || domainGroups.length === 0;
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
              <ArrowLeft className="w-4 h-4 mr-1.5" />{' '}
              {t('frameworkDetail.backToFrameworks')}
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
          <ArrowLeft className="w-4 h-4 mr-1" />{' '}
          {t('frameworkDetail.allFrameworks')}
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
            <Loader2 className="w-5 h-5 animate-spin" />{' '}
            {t('frameworkDetail.loadingRequirements')}
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
                <option value="">
                  {t('frameworkDetail.ownerDialog.selectUser')}
                </option>
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
              onChange={(e) => setApplicabilityJustification(e.target.value)}
              placeholder={t(
                'frameworkDetail.naDialog.justificationPlaceholder',
              )}
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
