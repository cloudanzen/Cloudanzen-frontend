/**
 * audit-detail/FrameworkTab.tsx — split out of the original 2,267-line
 * AuditDetailPage.tsx in Phase 4. Component body is unchanged.
 */

import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/app/components/ui/card';
import { auditsService, AuditFrameworkResponse } from '@/services/api/audits';

export function BreakdownChips({ data }: { data?: Record<string, number> }) {
  if (!data || Object.keys(data).length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(data).map(([key, value]) => (
        <span
          key={key}
          className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
        >
          {key.replaceAll('_', ' ')}: {value}
        </span>
      ))}
    </div>
  );
}

export function FrameworkTab({ auditId }: { auditId: string }) {
  const { t } = useTranslation('compliance');
  const { data, isLoading } = useQuery<{
    success: boolean;
    data: AuditFrameworkResponse;
  }>({
    queryKey: ['audit-framework', auditId],
    queryFn: () => auditsService.getFramework(auditId),
  });

  const framework = data?.data.framework;
  const requirements = data?.data.requirements ?? [];

  if (isLoading)
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        {t('auditDetail.dataTabs.loading')}
      </Card>
    );
  if (!framework)
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        {t('auditDetail.dataTabs.noFramework')}
      </Card>
    );

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t('auditDetail.tabs.framework')}
        </p>
        <h3 className="mt-1 text-lg font-semibold text-foreground">
          {framework.name}
        </h3>
        <p className="text-sm text-muted-foreground">{framework.version}</p>
      </Card>
      <Card className="overflow-hidden">
        <div className="divide-y divide-border">
          {requirements.map((req) => {
            const active =
              req.auditControlCount - req.notApplicableControlCount;
            const pct =
              active > 0
                ? Math.round((req.compliantControlCount / active) * 100)
                : 0;
            return (
              <div key={req.frameworkRequirementId} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {req.code} · {req.title}
                    </p>
                    {req.domain && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {req.domain}
                      </p>
                    )}
                  </div>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {pct}%
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                  <span>
                    {t('auditDetail.overview.compliant')}:{' '}
                    {req.compliantControlCount}
                  </span>
                  <span>
                    {t('auditDetail.overview.nonCompliant')}:{' '}
                    {req.nonCompliantControlCount}
                  </span>
                  <span>
                    {t('auditDetail.overview.pending')}:{' '}
                    {req.pendingControlCount}
                  </span>
                  <span>
                    {t('auditDetail.overview.na')}:{' '}
                    {req.notApplicableControlCount}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
