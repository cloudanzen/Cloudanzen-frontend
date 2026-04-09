import { useTranslation } from 'react-i18next';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';
import { riskCenterService } from '@/services/api/riskCenter';
import { riskStatusVariant } from '@/services/api/riskFormatting';

function priorityVariant(priority: string): 'destructive' | 'secondary' | 'outline' {
  if (priority === 'P1') return 'destructive';
  if (priority === 'P2') return 'secondary';
  return 'outline';
}

export function ActionTrackerPage() {
  const { t } = useTranslation('risk');
  const navigate = useNavigate();
  const { data = [], isLoading } = useQuery({
    queryKey: QK.riskActions(),
    queryFn: () => riskCenterService.getActionTracker(),
    staleTime: STALE.RISKS,
  });

  return (
    <PageTemplate title={t('actionTracker.title')} description={t('actionTracker.description')}>
      {isLoading ? (
        <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-5">
              <p className="text-sm text-gray-500">{t('actionTracker.stats.openActions')}</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{data.length}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-gray-500">{t('actionTracker.stats.automatedRouting')}</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{data.filter((item) => item.automation !== 'Manual').length}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-gray-500">{t('actionTracker.stats.dueThisWeek')}</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{data.filter((item) => new Date(item.dueDate).getTime() < Date.now() + 7 * 86400000).length}</p>
            </Card>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead className="border-b bg-gray-50">
                  <tr>
                    {[t('actionTracker.columns.action'), t('actionTracker.columns.owner'), t('actionTracker.columns.priority'), t('actionTracker.columns.workflow'), t('actionTracker.columns.frameworkImpact'), t('actionTracker.columns.dueDate'), t('actionTracker.columns.status')].map((header) => (
                      <th key={header} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {data.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">
                        <button type="button" onClick={() => navigate(`/risk/risks/${item.riskId}`)} className="text-left font-medium text-gray-900 hover:text-blue-700">{item.title}</button>
                        <p className="mt-1 text-xs text-gray-500">Playbook: {item.playbook}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <p>{item.owner.name}</p>
                        <p className="mt-1 text-xs text-gray-400">{item.owner.team}</p>
                      </td>
                      <td className="px-6 py-4"><Badge variant={priorityVariant(item.priority)}>{item.priority}</Badge></td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.automation}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex max-w-xs flex-wrap gap-2">
                          {item.frameworkImpact.slice(0, 2).map((framework) => <Badge key={framework} variant="outline">{framework}</Badge>)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(item.dueDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4"><Badge variant={riskStatusVariant(item.status)}>{item.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </PageTemplate>
  );
}
