import { PageTemplate } from '@/app/components/PageTemplate';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Switch } from '@/app/components/ui/switch';
import { Label } from '@/app/components/ui/label';
import { useTranslation } from 'react-i18next';

export function PersonnelSettingsPage() {
  const { t } = useTranslation('personnel');

  return (
    <PageTemplate
      title={t('settings.title')}
      description={t('settings.description')}
      actions={<Button>{t('settings.saveChanges')}</Button>}
    >
      <div className="space-y-6 max-w-4xl">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('settings.accessControl.title')}
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="mfa-required">
                  {t('settings.accessControl.requireMfa')}
                </Label>
                <p className="text-sm text-gray-500">
                  {t('settings.accessControl.requireMfaDescription')}
                </p>
              </div>
              <Switch id="mfa-required" defaultChecked />
            </div>
          </div>
        </Card>
      </div>
    </PageTemplate>
  );
}
