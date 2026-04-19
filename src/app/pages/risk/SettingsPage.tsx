import { useTranslation } from 'react-i18next';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Switch } from '@/app/components/ui/switch';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';
import { riskCenterService } from '@/services/api/riskCenter';
import { useNotificationPreferences, useUpdateNotificationPreference } from '@/app/features/notifications/useNotifications';
import { notificationEventDefinitions } from '@/app/features/notifications/notificationHelpers';

const RISK_EVENT_TYPES = [
  'risk.critical',
  'risk.created',
  'risk.due',
  'risk.owner_assigned',
];

export function RiskSettingsPage() {
  const { t } = useTranslation('risk');
  const { data, isLoading } = useQuery({
    queryKey: QK.riskSettings(),
    queryFn: () => riskCenterService.getSettings(),
    staleTime: STALE.RISKS,
  });
  const preferencesQuery = useNotificationPreferences();
  const updatePreference = useUpdateNotificationPreference();

  return (
    <PageTemplate title={t('settings.title')} description={t('settings.description')} actions={<Button>{t('settings.saveChanges')}</Button>}>
      {isLoading || !data ? (
        <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : (
        <div className="max-w-5xl space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900">{t('settings.notifications')}</h2>
            <div className="mt-5 space-y-4">
              {preferencesQuery.isLoading || !preferencesQuery.data ? (
                <div className="flex h-24 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
              ) : (
                notificationEventDefinitions
                  .filter((definition) => RISK_EVENT_TYPES.includes(definition.eventType))
                  .map((definition) => {
                    const preference = preferencesQuery.data.find((item) => item.eventType === definition.eventType);
                    if (!preference) return null;
                    return (
                      <div key={definition.eventType} className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 p-4">
                        <div>
                          <Label htmlFor={definition.eventType}>{definition.label}</Label>
                          <p className="mt-1 text-sm text-gray-500">{definition.description}</p>
                        </div>
                        <Switch
                          id={definition.eventType}
                          checked={preference.inAppEnabled}
                          onCheckedChange={(checked) => updatePreference.mutate({ eventType: definition.eventType, body: { inAppEnabled: checked } })}
                        />
                      </div>
                    );
                  })
              )}
            </div>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900">{t('settings.automationPosture')}</h2>
              <div className="mt-5 space-y-3">
                {data.automations.map((item) => (
                  <div key={item.id} className="rounded-xl bg-gray-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <Badge variant="outline">{item.status}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">{item.description}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900">{t('settings.scoringModel')}</h2>
              <div className="mt-5 space-y-3">
                {data.scoringFactors.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3">
                    <span className="text-sm text-gray-700">{item.label}</span>
                    <Badge variant="secondary">{item.weight}%</Badge>
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t pt-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">{t('settings.lifecycleStates')}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {data.lifecycle.map((item) => <Badge key={item} variant="outline">{item}</Badge>)}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </PageTemplate>
  );
}
