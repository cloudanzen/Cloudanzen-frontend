import { useState } from 'react';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { UnifiedAccessTable } from './access-management/UnifiedAccessTable';
import { ServicesPage } from './access-management/ServicesPage';
import { CampaignListPage } from './access-management/CampaignListPage';

export function AccessManagementPage() {
  const [tab, setTab] = useState('accounts');

  return (
    <PageTemplate
      title="Access Management"
      description="Unified view of all user accounts across integrated and manually-tracked services."
    >
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="accounts">Access Table</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="reviews">Access Reviews</TabsTrigger>
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
