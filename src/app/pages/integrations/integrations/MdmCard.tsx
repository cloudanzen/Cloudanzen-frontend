import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import {
  mdmService,
  EnrollmentToken,
  CreatedToken,
  MdmOverview,
} from '@/services/api/mdm';

export function MdmCard({
  onToast,
}: {
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const { t: tr } = useTranslation('integrations');
  const [tokens, setTokens] = useState<EnrollmentToken[]>([]);
  const [overview, setOverview] = useState<MdmOverview | null>(null);
  const [newToken, setNewToken] = useState<CreatedToken | null>(null);
  const [tokenLabel, setTokenLabel] = useState('');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tokRes, ovRes] = await Promise.all([
        mdmService.listTokens(),
        mdmService.getOverview(),
      ]);
      setTokens(tokRes.tokens);
      setOverview(ovRes);
    } catch {
      /* not admin or no devices yet — ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []); // loadData is stable — defined outside component state

  const handleCreate = async () => {
    setCreating(true);
    try {
      const createdToken = await mdmService.createToken(
        tokenLabel || undefined,
      );
      setNewToken(createdToken);
      setTokenLabel('');
      await loadData();
      onToast('success', tr('cards.mdm.enrollmentTokenCreated'));
    } catch (e: unknown) {
      onToast(
        'error',
        (e as { message?: string })?.message ??
          tr('cards.mdm.failedToCreateToken'),
      );
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await mdmService.deleteToken(id);
      setTokens((prev) => prev.filter((t) => t.id !== id));
      if (newToken?.id === id) setNewToken(null);
      onToast('success', tr('cards.mdm.tokenRevoked'));
    } catch {
      onToast('error', tr('cards.mdm.failedToRevokeToken'));
    }
  };

  return (
    <Card className="p-6 md:col-span-2">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {tr('cards.mdm.title')}
            </h3>
            <p className="text-sm text-gray-500">{tr('cards.mdm.subtitle')}</p>
          </div>
        </div>
        <Badge variant={overview && overview.total > 0 ? 'default' : 'outline'}>
          {loading
            ? tr('cards.shared.loading')
            : overview && overview.total > 0
              ? tr('cards.mdm.devices', { count: overview.total })
              : tr('cards.mdm.noDevices')}
        </Badge>
      </div>

      {/* Overview stats */}
      {overview && overview.total > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            {
              label: tr('cards.mdm.stats.compliant'),
              value: overview.compliant,
              color: 'text-green-700 bg-green-50',
            },
            {
              label: tr('cards.mdm.stats.nonCompliant'),
              value: overview.nonCompliant,
              color: 'text-red-600 bg-red-50',
            },
            {
              label: tr('cards.mdm.stats.unknown'),
              value: overview.unknown,
              color: 'text-gray-600 bg-gray-50',
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`rounded-lg px-3 py-2 text-center ${s.color}`}
            >
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* New token result */}
      {newToken && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-semibold text-green-800 mb-2">
            {tr('cards.mdm.tokenCreated')}
          </p>
          <pre className="text-xs bg-gray-900 text-green-400 rounded p-3 overflow-x-auto whitespace-pre-wrap break-all">
            {newToken.installCommand}
          </pre>
          <p className="text-xs text-green-700 mt-2">
            {tr('cards.mdm.tokenExpiresAt', {
              date: new Date(newToken.expiresAt).toLocaleString(),
            })}
          </p>
        </div>
      )}

      {/* Create token form */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder={tr('cards.mdm.labelPlaceholder')}
          value={tokenLabel}
          onChange={(e) => setTokenLabel(e.target.value)}
          className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <Button size="sm" onClick={handleCreate} disabled={creating}>
          {creating
            ? tr('cards.mdm.creating')
            : tr('cards.mdm.createEnrollmentToken')}
        </Button>
      </div>

      {/* Token list */}
      {tokens.length > 0 && (
        <div className="border border-gray-100 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  {tr('cards.shared.label')}
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  {tr('cards.mdm.used')}
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  {tr('cards.mdm.expires')}
                </th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tokens.map((token) => (
                <tr key={token.id} className="bg-white hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-800">
                    {token.label ?? (
                      <span className="italic text-gray-400">
                        {tr('cards.mdm.unlabelled')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {token.usedAt ? (
                      <Badge variant="secondary" className="text-xs">
                        {tr('cards.mdm.usedDate', {
                          date: new Date(token.usedAt).toLocaleDateString(),
                        })}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        {tr('cards.mdm.pending')}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500">
                    {new Date(token.expiresAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => handleRevoke(token.id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      {tr('cards.shared.revoke')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-gray-400">
        Agent source:{' '}
        <a
          href="https://github.com/vinmnit159/manzen-mdm-agent"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-600"
        >
          github.com/vinmnit159/manzen-mdm-agent
        </a>
      </p>
    </Card>
  );
}
