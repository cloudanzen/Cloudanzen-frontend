/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Loader2, ShieldAlert } from 'lucide-react';
import { risksService } from '@/services/api/risks';

// We surface risks from GitHub scan as "vulnerabilities"
interface Vuln {
  id: string;
  title: string;
  impact: string;
  status: string;
  assetName: string;
  createdAt: string;
}

function impactVariant(impact: string): 'destructive' | 'secondary' | 'outline' {
  if (impact === 'CRITICAL' || impact === 'HIGH') return 'destructive';
  if (impact === 'MEDIUM') return 'secondary';
  return 'outline';
}

export function VulnerabilitiesPage() {
  const { t } = useTranslation('assets');
  const [vulns, setVulns] = useState<Vuln[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    risksService.getRisks()
      .then((res) => {
        const risks = res?.data ?? [];
        setVulns(
          risks
            .filter((r: any) => r.status === 'OPEN')
            .map((r: any) => ({
              id: r.id,
              title: r.title,
              impact: r.impact,
              status: r.status,
              assetName: r.asset?.name ?? '—',
              createdAt: r.createdAt,
            }))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const criticalCount = vulns.filter((v) => v.impact === 'CRITICAL').length;
  const highCount = vulns.filter((v) => v.impact === 'HIGH').length;

  return (
    <PageTemplate
      title={t('vulnerabilities.title')}
      description={t('vulnerabilities.description')}
    >
      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : (
        <div className="space-y-6">
          {vulns.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Open', value: vulns.length, cls: 'text-gray-900' },
                { label: 'Critical', value: criticalCount, cls: 'text-red-600' },
                { label: 'High', value: highCount, cls: 'text-orange-600' },
                { label: 'Medium / Low', value: vulns.length - criticalCount - highCount, cls: 'text-yellow-600' },
              ].map((s) => (
                <Card key={s.label} className="p-5">
                  <div className={`text-3xl font-bold mb-1 ${s.cls}`}>{s.value}</div>
                  <div className="text-sm text-gray-500">{s.label}</div>
                </Card>
              ))}
            </div>
          )}

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Finding', 'Affected Asset', 'Impact', 'Status', 'Detected'].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vulns.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center">
                        <ShieldAlert className="w-10 h-10 text-green-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">No open vulnerabilities detected. Great work!</p>
                      </td>
                    </tr>
                  ) : vulns.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-sm">
                        <span className="truncate block">{v.title}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{v.assetName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={impactVariant(v.impact)}>{v.impact}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="destructive">{v.status}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                        {new Date(v.createdAt).toLocaleDateString()}
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
