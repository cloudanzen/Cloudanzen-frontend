import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageTemplate } from "@/app/components/PageTemplate";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Switch } from "@/app/components/ui/switch";
import { Label } from "@/app/components/ui/label";
import { assetsService } from '@/services/api/assets';
import { STALE } from '@/lib/queryClient';
import { toast } from 'sonner';

export function AssetsSettingsPage() {
  const { t } = useTranslation('assets');
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['assets', 'settings'],
    queryFn: () => assetsService.getSettings(),
    staleTime: STALE.DASHBOARD,
  });
  const settings = data?.data;
  const [providerInput, setProviderInput] = useState('');
  const [localSettings, setLocalSettings] = useState({
    autoScanEnabled: settings?.autoScanEnabled ?? true,
    providerPriority: settings?.providerPriority ?? [],
  });

  useEffect(() => {
    if (!settings) return;
    setLocalSettings({
      autoScanEnabled: settings.autoScanEnabled,
      providerPriority: settings.providerPriority ?? [],
    });
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () => assetsService.updateSettings(localSettings),
    onSuccess: async () => {
      toast.success('Asset settings saved');
      await qc.invalidateQueries({ queryKey: ['assets', 'settings'] });
    },
    onError: () => toast.error('Failed to save asset settings'),
  });

  const providerPriority = settings?.providerPriority?.length ? settings.providerPriority : localSettings.providerPriority;

  function addProviderPriority() {
    const next = providerInput.trim().toLowerCase();
    if (!next || providerPriority.includes(next)) return;
    setLocalSettings((current) => ({ ...current, providerPriority: [...providerPriority, next] }));
    setProviderInput('');
  }

  function removeProviderPriority(provider: string) {
    setLocalSettings((current) => ({ ...current, providerPriority: providerPriority.filter((item) => item !== provider) }));
  }

  function moveProvider(provider: string, direction: -1 | 1) {
    const index = providerPriority.indexOf(provider);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= providerPriority.length) return;
    const next = [...providerPriority];
    const currentProvider = next[index];
    const targetProvider = next[nextIndex];
    if (!currentProvider || !targetProvider) return;
    next[index] = targetProvider;
    next[nextIndex] = currentProvider;
    setLocalSettings((current) => ({ ...current, providerPriority: next }));
  }

  return (
    <PageTemplate title={t('settings.title')} description={t('settings.description')} actions={<Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>{t('settings.saveChanges')}</Button>}>
      <div className="space-y-6 max-w-4xl">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('settings.scanningSettings')}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-scan">{t('settings.autoScanning')}</Label>
                <p className="text-sm text-gray-500">{t('settings.autoScanningDesc')}</p>
              </div>
              <Switch id="auto-scan" checked={localSettings.autoScanEnabled} onCheckedChange={(checked) => setLocalSettings((current) => ({ ...current, autoScanEnabled: checked }))} />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Provider Priority</h2>
          <p className="text-sm text-gray-500">Controls the default provider order suggested during merge conflict resolution.</p>
          <div className="mt-4 flex gap-2">
            <input
              value={providerInput}
              onChange={(event) => setProviderInput(event.target.value)}
              placeholder="e.g. aws, jamf, github"
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            />
            <Button type="button" onClick={addProviderPriority}>Add</Button>
          </div>
          <div className="mt-4 space-y-2">
            {providerPriority.length ? providerPriority.map((provider, index) => (
              <div key={provider} className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm">
                <span>{index + 1}. {provider}</span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => moveProvider(provider, -1)} className="text-xs text-muted-foreground">Up</button>
                  <button type="button" onClick={() => moveProvider(provider, 1)} className="text-xs text-muted-foreground">Down</button>
                  <button type="button" onClick={() => removeProviderPriority(provider)} className="text-xs text-red-600">Remove</button>
                </div>
              </div>
            )) : <p className="text-sm text-gray-500">No provider priority configured yet.</p>}
          </div>
        </Card>
      </div>
    </PageTemplate>
  );
}
