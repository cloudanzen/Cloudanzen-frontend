import { useTranslation } from 'react-i18next';
import { PageTemplate } from "@/app/components/PageTemplate";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Switch } from "@/app/components/ui/switch";
import { Label } from "@/app/components/ui/label";

export function PrivacySettingsPage() {
  const { t } = useTranslation('settings');
  return (
    <PageTemplate title={t('privacy.title')} description={t('privacy.description')} actions={<Button>{t('privacy.saveChanges')}</Button>}>
      <div className="space-y-6 max-w-4xl">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('privacy.dataManagement')}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-classify">{t('privacy.autoClassify')}</Label>
                <p className="text-sm text-gray-500">{t('privacy.autoClassifyDesc')}</p>
              </div>
              <Switch id="auto-classify" defaultChecked />
            </div>
          </div>
        </Card>
      </div>
    </PageTemplate>
  );
}
