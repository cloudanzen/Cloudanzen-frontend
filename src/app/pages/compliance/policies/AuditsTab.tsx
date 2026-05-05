import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { ClipboardCheck, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Card } from '@/app/components/ui/card';
import { policiesService, PolicyAuditRow } from '@/services/api/policies';
import { ApiResponse } from '@/services/api/client';

export function PolicyAuditsTab({ policyId }: { policyId: string }) {
  const { t } = useTranslation('compliance');

  const { data, isLoading } = useQuery<ApiResponse<PolicyAuditRow[]>>({
    queryKey: ['policy-audits', policyId],
    queryFn: () => policiesService.listAudits(policyId),
  });

  const audits = data?.data ?? [];

  if (isLoading) {
    return (
      <Card className="p-6 text-center text-sm text-muted-foreground">
        {t('policyDetail.audits.loading', { defaultValue: 'Loading audits…' })}
      </Card>
    );
  }

  if (audits.length === 0) {
    return (
      <Card className="p-6 text-center text-sm text-muted-foreground">
        <ClipboardCheck className="mx-auto mb-2 h-6 w-6 opacity-40" />
        {t('policyDetail.audits.empty', {
          defaultValue: 'No audits yet reference this policy through its controls.',
        })}
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {audits.map((a) => (
        <Card key={a.id} className="flex items-center justify-between p-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{a.name}</span>
              <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {a.type}
              </span>
              <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {a.status}
              </span>
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {new Date(a.startDate).toLocaleDateString()}{' '}
              {a.endDate ? `– ${new Date(a.endDate).toLocaleDateString()}` : ''}
              {' · '}
              {t('policyDetail.audits.viaControls', {
                defaultValue: '{{count}} control(s) overlap',
                count: a.viaControlIds.length,
              })}
            </div>
          </div>
          <Link
            to={`/compliance/audits/${a.id}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {t('policyDetail.audits.open', { defaultValue: 'Open' })}
            <ExternalLink className="h-3 w-3" />
          </Link>
        </Card>
      ))}
    </div>
  );
}
