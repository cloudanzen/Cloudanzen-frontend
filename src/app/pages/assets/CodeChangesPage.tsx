/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Loader2, GitCommit } from 'lucide-react';
import { integrationsService } from '@/services/api/integrations';

interface Repo {
  id: string;
  fullName: string;
  rawData: any;
  lastScannedAt: string | null;
}

export function CodeChangesPage() {
  const { t } = useTranslation('assets');
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    integrationsService.getStatus()
      .then((res) => {
        const gh = (res?.integrations ?? []).find((i: any) => i.provider === 'GITHUB' && i.status === 'ACTIVE');
        if (gh) {
          setConnected(true);
          setRepos(gh.repos ?? []);
        }
      })
      .catch(() => {
        toast.error('Failed to load integration status');
      })
      .finally(() => setLoading(false));
  }, []);

  // Flatten commits from all repos' scan data
  const allCommits: any[] = repos.flatMap((repo) => {
    const scan = repo.rawData;
    if (!scan?.commitSigning?.result) return [];
    return [{
      repo: repo.fullName,
      signedPct: scan.commitSigning.result.signedPercent ?? 0,
      totalChecked: scan.commitSigning.result.totalChecked ?? 0,
      signedCount: scan.commitSigning.result.signedCount ?? 0,
      compliant: scan.commitSigning.result.compliant,
      scannedAt: repo.lastScannedAt,
    }];
  });

  return (
    <PageTemplate title={t('codeChanges.title')} description={t('codeChanges.description')}>
      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : !connected ? (
        <Card className="p-10 text-center">
          <GitCommit className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">GitHub not connected</p>
          <p className="text-sm text-gray-400 mt-1">
            Go to <a href="/integrations" className="text-blue-600 hover:underline">Integrations</a> to connect GitHub and see real commit data.
          </p>
        </Card>
      ) : allCommits.length === 0 ? (
        <Card className="p-10 text-center">
          <GitCommit className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No commit data yet. Run a scan from the Integrations page.</p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Repository', 'Commits Checked', 'Signed', 'Signing %', 'ISO A.8.24 Status', 'Last Scanned'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allCommits.map((row) => (
                  <tr key={row.repo} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 font-mono">{row.repo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{row.totalChecked}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{row.signedCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${row.signedPct >= 80 ? 'bg-green-500' : 'bg-red-400'}`}
                            style={{ width: `${row.signedPct}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-700">{row.signedPct}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={row.compliant ? 'default' : 'destructive'}>
                        {row.compliant ? 'Pass' : 'Fail'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                      {row.scannedAt ? new Date(row.scannedAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </PageTemplate>
  );
}
