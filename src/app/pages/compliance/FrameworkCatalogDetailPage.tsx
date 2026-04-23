/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, CheckCircle2, Loader2, Lock } from 'lucide-react';

import { PageTemplate } from '@/app/components/PageTemplate';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/app/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { FRAMEWORK_CATALOG } from '@/app/pages/compliance/frameworkCatalog/catalogConfig';
import { frameworksService } from '@/services/api/frameworks';
import { authService } from '@/services/api/auth';
import { QK } from '@/lib/queryKeys';

function DetailRing({ pct }: { pct: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, pct));
  const strokeDasharray = `${(progress / 100) * circumference} ${circumference}`;

  return (
    <div className="relative mx-auto h-40 w-40">
      <svg viewBox="0 0 128 128" className="h-40 w-40 -rotate-90">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/40" />
        <circle cx="64" cy="64" r={radius} fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeDasharray={strokeDasharray} className="text-primary" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-3xl font-bold text-foreground">{progress}%</p>
      </div>
    </div>
  );
}

function EntitlementDialog({ open, onClose, name }: { open: boolean; onClose: () => void; name: string }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-amber-500" />Upgrade required</DialogTitle>
          <DialogDescription>{name} is not included in your current entitlement.</DialogDescription>
        </DialogHeader>
        <DialogFooter><Button variant="outline" onClick={onClose}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FrameworkCatalogDetailPage() {
  const { t } = useTranslation('compliance');
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { slug = '' } = useParams<{ slug: string }>();
  const catalogEntry = FRAMEWORK_CATALOG[slug];
  const cachedUser = authService.getCachedUser();
  const canManageScope = cachedUser?.role === 'ORG_ADMIN' || cachedUser?.role === 'SUPER_ADMIN';
  const [showEntitlementDialog, setShowEntitlementDialog] = useState(false);

  const { data: overlapRes, isLoading: overlapLoading } = useQuery({
    queryKey: QK.frameworkOverlap(slug),
    queryFn: () => frameworksService.getOverlap(slug),
    enabled: Boolean(slug),
  });
  const { data: orgFwRes } = useQuery({
    queryKey: QK.orgFrameworks(),
    queryFn: () => frameworksService.listOrgFrameworks('card'),
  });

  const activeFramework = useMemo(
    () => (orgFwRes?.data ?? []).find((fw) => fw.frameworkSlug === slug && fw.status === 'active'),
    [orgFwRes?.data, slug],
  );

  const activateMutation = useMutation({
    mutationFn: () => frameworksService.activateFramework({ frameworkSlug: slug }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: QK.orgFrameworks() });
      navigate(`/compliance/frameworks/${slug}/activated`, { state: { summary: res.summary, orgFramework: res.data } });
    },
    onError: (err: any) => {
      if (err?.error === 'FRAMEWORK_NOT_ENTITLED' || err?.statusCode === 403) setShowEntitlementDialog(true);
    },
  });

  useEffect(() => {
    if (!catalogEntry) return;
    document.title = `${catalogEntry.slug} · ${t('frameworkCatalog.pageTitle')}`;
  }, [catalogEntry, t]);

  if (!catalogEntry) {
    return (
      <PageTemplate title={t('frameworkCatalog.pageTitle')} description={t('frameworkCatalog.notFound')}>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">{t('frameworkCatalog.notFound')}</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/compliance/frameworks')}>
            <ArrowLeft className="mr-1 h-4 w-4" /> {t('frameworkCatalog.backToFrameworks')}
          </Button>
        </Card>
      </PageTemplate>
    );
  }

  const overlap = overlapRes?.data;
  const frameworkName = catalogEntry.slug.toUpperCase().replace('-', ' ');

  return (
    <PageTemplate
      title={frameworkName}
      description={catalogEntry.tagline}
      actions={<Button variant="outline" onClick={() => navigate('/compliance/frameworks')}><ArrowLeft className="mr-1 h-4 w-4" />{t('frameworkCatalog.backToFrameworks')}</Button>}
    >
      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <Card className="bg-gradient-to-br from-white to-slate-50/80 p-6 text-center">
            {overlapLoading ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" /> : <DetailRing pct={overlap?.overlapPct ?? 0} />}
            <p className="mt-4 text-sm font-medium text-foreground">{t('frameworkCatalog.headStart')}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t('frameworkCatalog.coverageDesc')}</p>
            <p className="mt-3 text-sm text-foreground">{t('frameworkCatalog.overlapStat', { overlap: overlap?.overlapCount ?? 0, total: overlap?.totalRequirements ?? 0 })}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {overlap?.contributingFrameworks?.map((framework) => (
                <Badge key={framework.activeFrameworkSlug} variant="outline">{framework.activeFrameworkName}</Badge>
              ))}
            </div>
            {activeFramework ? (
              <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-left">
                <p className="text-sm font-semibold text-emerald-800">{t('frameworkCatalog.alreadyActiveTitle')}</p>
                <p className="mt-1 text-sm text-emerald-700">{t('frameworkCatalog.alreadyActiveDesc')}</p>
                <Button className="mt-4 w-full" variant="outline" onClick={() => navigate(`/compliance/frameworks/${slug}`)}>{t('frameworkCatalog.viewActive')}</Button>
              </div>
            ) : (
              <Button className="mt-6 w-full" disabled={!canManageScope || activateMutation.isPending} onClick={() => activateMutation.mutate()}>
                {activateMutation.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                {t('frameworkCatalog.activateCta', { name: catalogEntry.slug })}
              </Button>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-slate-50 to-white p-6">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold text-foreground">{frameworkName}</h1>
              <Badge>{slug}</Badge>
              <Badge variant="outline">{catalogEntry.certifyingBody}</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {catalogEntry.domains.map((domain) => (
                <Badge key={domain} variant="secondary">{domain}</Badge>
              ))}
            </div>
            <p className="mt-4 text-base text-muted-foreground">{catalogEntry.tagline}</p>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-foreground">{catalogEntry.overview}</p>
          </Card>

          <Card className="p-6">
            <h2 className="text-sm font-semibold text-foreground">{t('frameworkCatalog.controlDomainsHeading')}</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {catalogEntry.controlDomains.map((domain) => (
                <div key={domain.label} className="rounded-lg border border-gray-200 bg-slate-50/60 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-foreground">{domain.label}</p>
                    <Badge variant="outline">{domain.count}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <Accordion type="multiple">
              <AccordionItem value="industries">
                <AccordionTrigger>{t('frameworkCatalog.accordionIndustries')}</AccordionTrigger>
                <AccordionContent><div className="flex flex-wrap gap-2">{catalogEntry.industries.map((item) => <Badge key={item} variant="outline">{item}</Badge>)}</div></AccordionContent>
              </AccordionItem>
              <AccordionItem value="scope">
                <AccordionTrigger>{t('frameworkCatalog.accordionScope')}</AccordionTrigger>
                <AccordionContent><ul className="space-y-2">{catalogEntry.scope.map((item) => <li key={item} className="text-sm text-foreground">• {item}</li>)}</ul></AccordionContent>
              </AccordionItem>
              <AccordionItem value="benefits">
                <AccordionTrigger>{t('frameworkCatalog.accordionBenefits')}</AccordionTrigger>
                <AccordionContent><ul className="space-y-2">{catalogEntry.benefits.map((item) => <li key={item} className="flex gap-2 text-sm text-foreground"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />{item}</li>)}</ul></AccordionContent>
              </AccordionItem>
              <AccordionItem value="certification">
                <AccordionTrigger>{t('frameworkCatalog.accordionCertification')}</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-foreground">{catalogEntry.certifyingBody}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{catalogEntry.auditFrequency}</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>

          <Card className="p-6">
            <h2 className="text-sm font-semibold text-foreground">{t('frameworkCatalog.contributingLabel')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">These active frameworks are currently driving the overlap shown on this page.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {overlap?.contributingFrameworks?.length ? overlap.contributingFrameworks.map((framework) => (
                <Badge key={framework.activeFrameworkSlug} variant="outline">
                  {framework.activeFrameworkName} ({framework.contributingRequirements})
                </Badge>
              )) : <p className="text-sm text-muted-foreground">No active frameworks are contributing yet.</p>}
            </div>
          </Card>
        </div>
      </div>

      <EntitlementDialog open={showEntitlementDialog} onClose={() => setShowEntitlementDialog(false)} name={catalogEntry.slug} />
    </PageTemplate>
  );
}
