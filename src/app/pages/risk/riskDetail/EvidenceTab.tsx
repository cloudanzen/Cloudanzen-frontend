/**
 * riskDetail/EvidenceTab.tsx — evidence attached to this risk.
 *
 * Split out of RiskDetailPage.tsx in Phase 4. Markup is unchanged; the values
 * this tab read from the page's closure are now explicit props.
 */

import { FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/app/components/ui/badge';
import { Card } from '@/app/components/ui/card';
import type { RiskDetailModel } from '@/services/api/riskCenter';

interface EvidenceTabProps {
  data: RiskDetailModel;
}

export function EvidenceTab({ data }: EvidenceTabProps) {
  const { t } = useTranslation('risk');

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center gap-2 text-foreground">
          <FileText className="h-4 w-4" />
          <h3 className="text-base font-semibold">
            {t('detail.evidence.title')}
          </h3>
        </div>
        <div className="mt-5 space-y-4">
          {data.evidence.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {t('detail.evidence.noEvidence')}
            </p>
          )}
          {data.evidence.map((item) => (
            <div key={item.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.summary}
                  </p>
                </div>
                <Badge variant="outline">{item.provider}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-5 text-xs text-muted-foreground">
                <span>
                  {t('detail.evidence.captured', {
                    date: new Date(item.capturedAt).toLocaleString(),
                  })}
                </span>
                <span>{item.hash}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
