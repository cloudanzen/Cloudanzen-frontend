import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Loader2, Bell } from 'lucide-react';
import { risksService } from '@/services/api/risks';

// Security alerts = HIGH/CRITICAL open risks + any access control failures from GitHub
interface Alert {
  id: string;
  title: string;
  impact: string;
  assetName: string;
  createdAt: string;
  source: string;
}

export function SecurityAlertsPage() {
  const { t } = useTranslation('assets');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    risksService.getRisks()
      .then((res) => {
        const risks = res?.data ?? [];
        const highSeverity = risks
          .filter((r) => (r.impact === 'CRITICAL' || r.impact === 'HIGH') && r.status === 'OPEN')
          .map((r) => ({
            id: r.id,
            title: r.title,
            impact: r.impact,
            assetName: r.asset?.name ?? '—',
            createdAt: r.createdAt,
            source: 'GitHub Scan',
          }));
        setAlerts(highSeverity);
      })
      .catch(() => {
        toast.error('Failed to load security alerts');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageTemplate
      title={t('securityAlerts.title')}
      description={t('securityAlerts.description')}
    >
      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : alerts.length === 0 ? (
        <Card className="p-10 text-center">
          <Bell className="w-12 h-12 text-green-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No active security alerts</p>
          <p className="text-sm text-gray-400 mt-1">All critical and high risks are mitigated or accepted.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
            <Bell className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm font-medium text-red-800">
              {alerts.length} active {alerts.length === 1 ? 'alert requires' : 'alerts require'} immediate attention
            </p>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Alert', 'Severity', 'Affected Asset', 'Source', 'Detected', 'Action'].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {alerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs">
                        <span className="truncate block">{alert.title}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="destructive">{alert.impact}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{alert.assetName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alert.source}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                        <a href="/risk/risks" className="hover:underline">View Risk</a>
                      </td>
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
