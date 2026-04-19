/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { useTranslation } from 'react-i18next';
import { Card } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { notificationEventDefinitions } from '@/app/features/notifications/notificationHelpers';
import { useNotificationPreferences, useUpdateNotificationPreference } from '@/app/features/notifications/useNotifications';
import { Loader2 } from 'lucide-react';

export function NotificationSettingsPage() {
  const { t } = useTranslation('common');
  const preferencesQuery = useNotificationPreferences();
  const updatePreference = useUpdateNotificationPreference();

  if (preferencesQuery.isLoading || !preferencesQuery.data) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;
  }

  const grouped = notificationEventDefinitions.reduce<Record<string, typeof preferencesQuery.data>>((groups, definition) => {
    const preference = preferencesQuery.data.find((item) => item.eventType === definition.eventType);
    if (!preference) return groups;
    groups[definition.category] = [...(groups[definition.category] ?? []), preference];
    return groups;
  }, {});

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="space-y-6">
        {Object.entries(grouped).map(([category, preferences]) => (
          <Card key={category} className="p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900">{category}</h2>
              <p className="text-sm text-gray-500">{t('notifications.settingsPage.channelHint', { category: category.toLowerCase() })}</p>
            </div>
            <div className="space-y-4">
              {preferences.map((preference) => {
                const definition = notificationEventDefinitions.find((item) => item.eventType === preference.eventType)!;
                return (
                  <div key={preference.eventType} className="rounded-2xl border border-gray-100 p-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="max-w-xl">
                        <Label className="text-sm font-semibold text-gray-900">{definition.label}</Label>
                        <p className="mt-1 text-sm text-gray-500">{definition.description}</p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-4 xl:min-w-[34rem]">
                        <label className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2 text-sm">
                          <span>{t('notifications.settingsPage.inApp')}</span>
                          <Switch checked={preference.inAppEnabled} onCheckedChange={(checked) => updatePreference.mutate({ eventType: preference.eventType, body: { inAppEnabled: checked } })} />
                        </label>
                        <label className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2 text-sm">
                          <span>{t('notifications.settingsPage.email')}</span>
                          <Switch checked={preference.emailEnabled} onCheckedChange={(checked) => updatePreference.mutate({ eventType: preference.eventType, body: { emailEnabled: checked } })} />
                        </label>
                        <label className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2 text-sm">
                          <span>{t('notifications.settingsPage.slack')}</span>
                          <Switch checked={preference.slackEnabled} onCheckedChange={(checked) => updatePreference.mutate({ eventType: preference.eventType, body: { slackEnabled: checked } })} />
                        </label>
                        <Select value={preference.digestMode} onValueChange={(value) => updatePreference.mutate({ eventType: preference.eventType, body: { digestMode: value as any } })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="immediate">{t('notifications.settingsPage.immediate')}</SelectItem>
                            <SelectItem value="hourly">{t('notifications.settingsPage.hourly')}</SelectItem>
                            <SelectItem value="daily">{t('notifications.settingsPage.daily')}</SelectItem>
                            <SelectItem value="weekly">{t('notifications.settingsPage.weekly')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
