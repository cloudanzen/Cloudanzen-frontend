import { useTranslation } from 'react-i18next';
import { PageTemplate } from "@/app/components/PageTemplate";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Switch } from "@/app/components/ui/switch";
import { Label } from "@/app/components/ui/label";

export function AssetsSettingsPage() {
  const { t } = useTranslation('assets');
  return (
    <PageTemplate title={t('settings.title')} description={t('settings.description')} actions={<Button>{t('settings.saveChanges')}</Button>}>
      <div className="space-y-6 max-w-4xl">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('settings.scanningSettings')}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-scan">{t('settings.autoScanning')}</Label>
                <p className="text-sm text-gray-500">{t('settings.autoScanningDesc')}</p>
              </div>
              <Switch id="auto-scan" defaultChecked />
            </div>
          </div>
        </Card>
      </div>
    </PageTemplate>
  );
}
