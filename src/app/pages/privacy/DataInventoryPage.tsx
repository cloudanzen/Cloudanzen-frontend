import { useTranslation } from 'react-i18next';
import { PageTemplate } from "@/app/components/PageTemplate";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Plus } from "lucide-react";

export function DataInventoryPage() {
  const { t } = useTranslation('settings');
  const data = [
    { type: "Customer PII", location: "Production DB", classification: "Sensitive", retention: "7 years" },
    { type: "Employee Records", location: "HR System", classification: "Confidential", retention: "5 years" },
    { type: "Financial Data", location: "Accounting System", classification: "Confidential", retention: "10 years" },
  ];

  return (
    <PageTemplate
      title={t('privacy.dataInventory.title')}
      description={t('privacy.dataInventory.description')}
      actions={<Button><Plus className="w-4 h-4 mr-2" />{t('privacy.dataInventory.addAsset')}</Button>}
    >
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('privacy.dataInventory.dataType')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('privacy.dataInventory.location')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('privacy.dataInventory.classification')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('privacy.dataInventory.retentionPeriod')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('privacy.dataInventory.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item) => (
                <tr key={item.type} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="destructive">{item.classification}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.retention}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                    <button className="hover:underline">{t('privacy.dataInventory.edit')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageTemplate>
  );
}
