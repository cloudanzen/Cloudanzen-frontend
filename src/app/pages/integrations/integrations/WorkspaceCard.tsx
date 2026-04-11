import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import {
  workspaceService,
  WorkspaceIntegrationRecord,
} from '@/services/api/workspace';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';

function GoogleWorkspaceIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#FFC107"
        d="M43.6 20H24v8h11.3C33.9 32.5 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-4z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.5 35.5 26.9 36 24 36c-5.4 0-9.9-3.5-11.3-8.2l-6.6 5.1C9.7 39.7 16.3 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20H24v8h11.3c-.7 2-2 3.8-3.8 5l6.2 5.2C40.9 34.7 44 29.7 44 24c0-1.3-.1-2.7-.4-4z"
      />
    </svg>
  );
}

function WorkspaceConnectModal({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: (account: WorkspaceIntegrationRecord) => void;
}) {
  const { t } = useTranslation('integrations');
  const [serviceAccountJson, setServiceAccountJson] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceAccountJson.trim() || !adminEmail.trim()) {
      setError(t('cards.workspace.requiredFields'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await workspaceService.connect({
        serviceAccountJson: serviceAccountJson.trim(),
        adminEmail: adminEmail.trim(),
        label: label.trim() || undefined,
      });
      if (res.success) {
        const accountsRes = await workspaceService.getAccounts();
        const newAccount = (accountsRes.data ?? []).find(
          (a) => a.domain === res.data.domain,
        );
        if (newAccount) onConnected(newAccount);
        else
          onConnected({
            id: res.data.id,
            domain: res.data.domain,
            adminEmail: res.data.adminEmail,
            label: res.data.label,
            status: res.data.status,
            lastScanAt: null,
            createdAt: res.data.createdAt,
            users: [],
            findings: [],
          });
        onClose();
      }
    } catch (err: unknown) {
      setError(
        (err as { message?: string })?.message ??
          t('cards.workspace.connectFailed'),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl p-6 my-4">
        <h2 className="text-lg font-semibold mb-1">
          {t('cards.workspace.connect')}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {t('cards.workspace.connectDescriptionPrefix')}{' '}
          <a
            href="https://console.cloud.google.com"
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline"
          >
            Google Cloud Console
          </a>{' '}
          {t('cards.workspace.connectDescriptionSuffix')}
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-4 text-xs font-mono text-gray-700 space-y-1">
          <p>https://www.googleapis.com/auth/admin.directory.user.readonly</p>
          <p>
            https://www.googleapis.com/auth/admin.directory.rolemanagement.readonly
          </p>
          <p>https://www.googleapis.com/auth/admin.reports.audit.readonly</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('cards.workspace.serviceAccountJson')}
            </label>
            <textarea
              value={serviceAccountJson}
              onChange={(e) => setServiceAccountJson(e.target.value)}
              placeholder={
                '{\n  "type": "service_account",\n  "project_id": "...",\n  "private_key_id": "...",\n  "private_key": "-----BEGIN RSA PRIVATE KEY-----\\n...",\n  "client_email": "isms@project.iam.gserviceaccount.com",\n  ...\n}'
              }
              rows={6}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-none"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('cards.workspace.superAdminEmail')}{' '}
              <span className="text-gray-400 font-normal">
                {t('cards.workspace.superAdminEmailHint')}
              </span>
            </label>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="admin@company.com"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('cards.shared.label')}{' '}
              <span className="text-gray-400 font-normal">
                {t('cards.shared.optional')}
              </span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Production Workspace"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              {loading
                ? t('cards.shared.connecting')
                : t('cards.workspace.connect')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('cards.shared.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function WorkspaceCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: WorkspaceIntegrationRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: WorkspaceIntegrationRecord) => void;
  onAccountRemoved: (integrationId: string) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const { t } = useTranslation('integrations');
  const confirm = useConfirmDialog();
  const [showModal, setShowModal] = useState(false);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const isConnected = accounts.length > 0;

  async function handleScan(integrationId: string) {
    setScanningId(integrationId);
    try {
      await workspaceService.runScan(integrationId);
      onToast('success', t('cards.workspace.scanStarted'));
    } catch {
      onToast('error', t('cards.workspace.scanStartFailed'));
    } finally {
      setScanningId(null);
    }
  }

  async function handleDisconnect(
    integrationId: string,
    label: string | null,
    domain: string,
  ) {
    const confirmed = await confirm({
      title: t('cards.workspace.disconnectTitle'),
      description: t('cards.workspace.disconnectDescription', {
        target: label ?? domain,
      }),
      confirmLabel: t('cards.shared.disconnect'),
      variant: 'destructive',
    });
    if (!confirmed) return;
    setDisconnectingId(integrationId);
    try {
      await workspaceService.disconnect(integrationId);
      onAccountRemoved(integrationId);
      onToast('success', t('cards.workspace.disconnected'));
    } catch {
      onToast('error', t('cards.workspace.disconnectFailed'));
    } finally {
      setDisconnectingId(null);
    }
  }

  return (
    <>
      <Card className="p-6 md:col-span-2">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 p-1 overflow-hidden">
              <GoogleWorkspaceIcon className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Google Workspace
              </h3>
              <p className="text-sm text-gray-500">
                {t('cards.workspace.subtitle')}
              </p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {loadingStatus
              ? t('cards.shared.checking')
              : isConnected
                ? t('cards.shared.connectedCount', { count: accounts.length })
                : t('cards.shared.available')}
          </Badge>
        </div>

        {/* Connected accounts */}
        {isConnected &&
          accounts.map((account) => {
            const activeUsers = account.users.filter(
              (u) => !u.isSuspended,
            ).length;
            const totalUsers = account.users.length;
            const mfaEnabled = account.users.filter(
              (u) => u.mfaEnabled && !u.isSuspended,
            ).length;
            const openFindings = account.findings.filter(
              (f) => f.severity === 'HIGH',
            ).length;
            return (
              <div
                key={account.id}
                className="mb-3 flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {account.label ?? account.domain}
                  </p>
                  <p className="text-xs text-gray-400 font-mono">
                    {account.domain}
                    {totalUsers > 0 &&
                      ` · ${t('cards.workspace.activeUsers', { active: activeUsers, total: totalUsers })}`}
                    {totalUsers > 0 &&
                      ` · ${t('cards.workspace.mfaCount', { count: mfaEnabled })}`}
                    {openFindings > 0 &&
                      ` · ${t('cards.workspace.highFindings', { count: openFindings })}`}
                    {account.lastScanAt &&
                      ` · ${t('cards.workspace.lastScan', { date: new Date(account.lastScanAt).toLocaleString() })}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleScan(account.id)}
                    disabled={scanningId === account.id}
                  >
                    {scanningId === account.id
                      ? t('cards.shared.scanning')
                      : t('cards.shared.runScan')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleDisconnect(
                        account.id,
                        account.label,
                        account.domain,
                      )
                    }
                    disabled={disconnectingId === account.id}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    {disconnectingId === account.id
                      ? t('cards.shared.disconnecting')
                      : t('cards.shared.disconnect')}
                  </Button>
                </div>
              </div>
            );
          })}

        {/* Action button */}
        <div className="flex flex-wrap gap-2">
          {!loadingStatus && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
            >
              <GoogleWorkspaceIcon className="w-4 h-4" />
              {isConnected
                ? t('cards.workspace.addDomain')
                : t('cards.workspace.connect')}
            </button>
          )}
        </div>
      </Card>

      {showModal && (
        <WorkspaceConnectModal
          onClose={() => setShowModal(false)}
          onConnected={(account) => {
            onAccountAdded(account);
            onToast('success', t('cards.workspace.connected'));
          }}
        />
      )}
    </>
  );
}
