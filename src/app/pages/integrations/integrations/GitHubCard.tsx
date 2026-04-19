import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import {
  integrationsService,
  Integration,
  GitHubRepo,
} from '@/services/api/integrations';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CompliancePill({ compliant }: { compliant: boolean | null }) {
  const { t } = useTranslation('integrations');
  if (compliant === null || compliant === undefined) {
    return (
      <span className="text-xs text-gray-400">{t('cards.github.none')}</span>
    );
  }

  return compliant ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
      <CheckIcon /> {t('cards.github.pass')}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
      <XIcon /> {t('cards.github.fail')}
    </span>
  );
}

function RepoScanRow({ repo }: { repo: GitHubRepo }) {
  const { t } = useTranslation('integrations');
  const scan = repo.rawData;
  const checks = scan
    ? [
        {
          label: t('cards.github.checks.branchProtection'),
          compliant: scan.branchProtection?.result?.compliant ?? null,
        },
        {
          label: t('cards.github.checks.commitSigning'),
          compliant: scan.commitSigning?.result?.compliant ?? null,
        },
        {
          label: t('cards.github.checks.cicd'),
          compliant: scan.cicd?.result?.compliant ?? null,
        },
        {
          label: t('cards.github.checks.accessControl'),
          compliant: scan.accessControl?.result?.compliant ?? null,
        },
        {
          label: t('cards.github.checks.visibility'),
          compliant: scan.repoMeta?.result?.compliant ?? null,
        },
      ]
    : [];

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">{repo.fullName}</p>
          <p className="text-xs text-gray-500">
            {t('cards.github.branch')}:{' '}
            <span className="font-mono">{repo.defaultBranch}</span> ·{' '}
            {repo.visibility}
          </p>
        </div>
        {repo.lastScannedAt && (
          <span className="ml-2 whitespace-nowrap text-xs text-gray-400">
            {new Date(repo.lastScannedAt).toLocaleString()}
          </span>
        )}
      </div>
      {checks.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {checks.map((check) => (
            <div
              key={check.label}
              className="flex items-center justify-between gap-2 rounded border border-gray-100 bg-white px-2 py-1.5"
            >
              <span className="truncate text-xs text-gray-600">
                {check.label}
              </span>
              <CompliancePill compliant={check.compliant} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function GitHubCard({
  githubIntegration,
  repos,
  loading,
  onDisconnect,
  onToast,
}: {
  githubIntegration: Integration | null;
  repos: GitHubRepo[];
  loading: boolean;
  onDisconnect: () => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const { t } = useTranslation('integrations');
  const confirm = useConfirmDialog();
  const [disconnecting, setDisconnecting] = useState(false);
  const [showRepos, setShowRepos] = useState(false);
  const [scanning, setScanning] = useState(false);
  const isConnected = !!githubIntegration;

  const handleDisconnect = async () => {
    const confirmed = await confirm({
      title: t('cards.github.disconnectTitle'),
      description: t('cards.github.disconnectDescription'),
      confirmLabel: t('cards.shared.disconnect'),
      variant: 'destructive',
    });
    if (!confirmed) return;
    setDisconnecting(true);
    try {
      await integrationsService.disconnect();
      onDisconnect();
      onToast('success', t('cards.github.disconnected'));
    } catch {
      onToast('error', t('cards.github.disconnectFailed'));
    } finally {
      setDisconnecting(false);
    }
  };

  const handleConnect = () => {
    window.location.href = integrationsService.getConnectUrl();
  };

  const handleScan = async () => {
    if (!githubIntegration) return;
    setScanning(true);
    try {
      const result = await integrationsService.triggerScan({
        integrationId: githubIntegration.id,
        repos,
      });
      onToast('success', result.message || t('cards.github.scanCompleted'));
    } catch {
      onToast('error', t('cards.github.scanFailed'));
    } finally {
      setScanning(false);
    }
  };

  return (
    <Card className="p-6 md:col-span-2">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-900">
            <GitHubIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">GitHub</h3>
            <p className="text-sm text-gray-500">
              {t('cards.github.subtitle')}
            </p>
          </div>
        </div>
        <Badge variant={isConnected ? 'default' : 'outline'}>
          {loading
            ? t('cards.shared.checking')
            : isConnected
              ? t('cards.shared.connected')
              : t('cards.shared.available')}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        {!loading && !isConnected && (
          <Button onClick={handleConnect} className="gap-2">
            <GitHubIcon className="h-4 w-4" />
            {t('cards.github.connect')}
          </Button>
        )}
        {isConnected && (
          <>
            <Button onClick={handleScan} disabled={scanning}>
              {scanning
                ? t('cards.shared.scanning')
                : t('cards.shared.runScan')}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowRepos((value) => !value)}
            >
              {showRepos
                ? t('cards.github.hideRepos')
                : t('cards.github.viewRepos', { count: repos.length })}
            </Button>
            <Button
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
              onClick={handleDisconnect}
              disabled={disconnecting}
            >
              {disconnecting
                ? t('cards.shared.disconnecting')
                : t('cards.shared.disconnect')}
            </Button>
          </>
        )}
      </div>

      {isConnected && githubIntegration && (
        <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {t('cards.github.connectedSummary', {
            date: new Date(githubIntegration.createdAt).toLocaleDateString(),
            count: repos.length,
          })}
        </p>
      )}

      {showRepos && (
        <div className="mt-5 space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">
            {t('cards.github.repositoriesHeading')}
          </h4>
          {repos.length === 0 ? (
            <p className="text-sm text-gray-400">
              {t('cards.github.noRepositories')}
            </p>
          ) : (
            repos.map((repo) => <RepoScanRow key={repo.id} repo={repo} />)
          )}
        </div>
      )}
    </Card>
  );
}
