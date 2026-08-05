/**
 * riskDetail/ActivityTab.tsx — the risk's activity timeline.
 *
 * Split out of RiskDetailPage.tsx in Phase 4. Markup is unchanged; the values
 * this tab read from the page's closure are now explicit props.
 */

import { ArrowRight, Clock3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/app/components/ui/badge';
import { Card } from '@/app/components/ui/card';
import type { RiskDetailModel } from '@/services/api/riskCenter';
import { activityDotColor } from './shared';

interface ActivityTabProps {
  data: RiskDetailModel;
}

export function ActivityTab({ data }: ActivityTabProps) {
  const { t } = useTranslation('risk');

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center gap-2 text-foreground">
          <Clock3 className="h-4 w-4" />
          <h3 className="text-base font-semibold">
            {t('detail.activity.title')}
          </h3>
        </div>
        <div className="mt-5 space-y-4">
          {data.activities.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {t('detail.activity.noActivity')}
            </p>
          )}
          {data.activities.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 rounded-xl border border-border p-4"
            >
              <div
                className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${activityDotColor(item.type)}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">{item.title}</p>
                  {item.type === 'STAKEHOLDER_CHANGED' && (
                    <Badge variant="outline" className="text-xs">
                      {t('detail.activity.ownership')}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.actor} &middot;{' '}
                  {new Date(item.timestamp).toLocaleString()}
                </p>
                {item.meta && (
                  <div className="mt-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                    <span className="font-medium">{item.meta.field}:</span>{' '}
                    <span className="line-through text-red-600">
                      {item.meta.oldValue}
                    </span>{' '}
                    <ArrowRight className="inline h-3 w-3 text-muted-foreground/70" />{' '}
                    <span className="text-green-700">{item.meta.newValue}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
