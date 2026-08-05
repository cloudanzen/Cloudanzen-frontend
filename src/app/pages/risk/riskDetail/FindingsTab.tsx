/**
 * riskDetail/FindingsTab.tsx — scan findings linked to this risk.
 *
 * Split out of RiskDetailPage.tsx in Phase 4. Markup is unchanged; the values
 * this tab read from the page's closure are now explicit props.
 */

import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/app/components/ui/badge';
import { Card } from '@/app/components/ui/card';
import type { FindingsListResponse } from '@/services/api/scan-findings';

interface FindingsTabProps {
  findingsData: FindingsListResponse | undefined;
}

export function FindingsTab({ findingsData }: FindingsTabProps) {
  const { t } = useTranslation('risk');

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center gap-2 text-foreground">
          <AlertTriangle className="h-4 w-4" />
          <h3 className="text-base font-semibold">
            {t('detail.findings.title')}
          </h3>
          {findingsData?.meta && (
            <Badge variant="outline">
              {t('detail.findings.openTotal', {
                open: findingsData.meta.open,
                total: findingsData.meta.total,
              })}
            </Badge>
          )}
        </div>
        <div className="mt-5 space-y-3">
          {(!findingsData?.data || findingsData.data.length === 0) && (
            <p className="text-sm text-muted-foreground">
              {t('detail.findings.noFindings')}
            </p>
          )}
          {findingsData?.data?.map((finding) => (
            <div
              key={finding.id}
              className="rounded-xl border border-border p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">
                    {finding.resourceName ?? finding.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {finding.title}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge
                    variant={
                      finding.status === 'OPEN' ? 'destructive' : 'secondary'
                    }
                  >
                    {finding.status}
                  </Badge>
                  <Badge variant="outline">{finding.severity}</Badge>
                </div>
              </div>
              <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                <span>
                  {t('detail.findings.firstSeen', {
                    date: new Date(finding.firstSeenAt).toLocaleDateString(),
                  })}
                </span>
                <span>
                  {t('detail.findings.lastSeen', {
                    date: new Date(finding.lastSeenAt).toLocaleDateString(),
                  })}
                </span>
                <span>
                  {t('detail.findings.source', {
                    source: finding.sourceType?.replace(/_/g, ' '),
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
