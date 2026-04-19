import { useTranslation } from 'react-i18next';
import { PageTemplate } from "@/app/components/PageTemplate";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Plus } from "lucide-react";

export function ControlsPage() {
  const { t } = useTranslation('compliance');
  const controls = [
    { id: "AC-001", name: "Access Control Policy", category: "Access Control", status: "Active", owner: "John Doe" },
    { id: "AU-002", name: "Audit and Accountability", category: "Auditing", status: "Active", owner: "Jane Smith" },
    { id: "CM-003", name: "Configuration Management", category: "Change Mgmt", status: "Review", owner: "Bob Wilson" },
    { id: "IA-004", name: "Identification and Authentication", category: "Identity", status: "Active", owner: "Alice Brown" },
  ];

  return (
    <PageTemplate
      title={t('controls.title')}
      description={t('controls.description')}
      actions={<Button><Plus className="w-4 h-4 mr-2" />{t('controls.addControl')}</Button>}
    >
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('controls.columns.controlId')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('controls.columns.name')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('controls.columns.category')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('controls.columns.status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('controls.columns.owner')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('controls.columns.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {controls.map((control) => (
                <tr key={control.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{control.id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{control.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{control.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={control.status === 'Active' ? 'default' : 'secondary'}>
                      {control.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{control.owner}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 space-x-3">
                    <button className="hover:underline">{t('controls.view')}</button>
                    <button className="hover:underline">{t('controls.edit')}</button>
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
