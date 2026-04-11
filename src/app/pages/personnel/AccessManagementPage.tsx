import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageTemplate } from '@/app/components/PageTemplate';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs';
import { UnifiedAccessTable } from './access-management/UnifiedAccessTable';
import { ServicesPage } from './access-management/ServicesPage';
import { CampaignListPage } from './access-management/CampaignListPage';

export function AccessManagementPage() {
  const { t } = useTranslation('personnel');
  const [tab, setTab] = useState('accounts');

  return (
    <PageTemplate
      title={t('accessManagement.title')}
      description={t('accessManagement.description')}
    >
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="accounts">
            {t('accessManagement.tabs.accounts')}
          </TabsTrigger>
          <TabsTrigger value="services">
            {t('accessManagement.tabs.services')}
          </TabsTrigger>
          <TabsTrigger value="reviews">
            {t('accessManagement.tabs.reviews')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="mt-4">
          <UnifiedAccessTable />
        </TabsContent>

        <TabsContent value="services" className="mt-4">
          <ServicesPage />
        </TabsContent>

        <TabsContent value="reviews" className="mt-4">
          <CampaignListPage />
        </TabsContent>
      </Tabs>
    </PageTemplate>
  );
}
