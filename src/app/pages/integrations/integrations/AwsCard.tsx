import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { awsService, AwsAccountRecord } from '@/services/api/aws';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';
import { COPY_FEEDBACK_MS } from '@/lib/constants';

function AwsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 304 182"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M86.4 66.4c0 3.7.4 6.7 1.1 8.9.8 2.2 1.8 4.6 3.2 7.2.5.8.7 1.6.7 2.3 0 1-.6 2-1.9 3l-6.3 4.2c-.9.6-1.8.9-2.6.9-1 0-2-.5-3-1.4-1.4-1.5-2.6-3.1-3.6-4.7-1-1.7-2-3.6-3.1-5.9-7.8 9.2-17.6 13.8-29.4 13.8-8.4 0-15.1-2.4-20-7.2-4.9-4.8-7.4-11.2-7.4-19.2 0-8.5 3-15.4 9.1-20.6 6.1-5.2 14.2-7.8 24.5-7.8 3.4 0 6.9.3 10.6.8 3.7.5 7.5 1.3 11.5 2.2v-7.3c0-7.6-1.6-12.9-4.7-16-3.2-3.1-8.6-4.6-16.3-4.6-3.5 0-7.1.4-10.8 1.3-3.7.9-7.3 2-10.8 3.4-.5.2-1.8.7-3.9 1.6-.6.2-1.1.4-1.4.4-1.3 0-1.9-.9-1.9-2.8v-4.4c0-1.5.2-2.6.7-3.3s1.4-1.4 2.8-2.1c3.5-1.8 7.7-3.3 12.6-4.5 4.9-1.3 10.1-1.9 15.6-1.9 11.9 0 20.6 2.7 26.2 8.1 5.5 5.4 8.3 13.6 8.3 24.6v32.4zm-40.6 15.2c3.3 0 6.7-.6 10.3-1.8 3.6-1.2 6.8-3.4 9.5-6.4 1.6-1.9 2.8-4 3.4-6.4.6-2.4 1-5.3 1-8.7v-4.2c-2.9-.7-6-1.3-9.2-1.7-3.2-.4-6.3-.6-9.4-.6-6.7 0-11.6 1.3-14.9 4-3.3 2.7-4.9 6.5-4.9 11.5 0 4.7 1.2 8.2 3.7 10.6 2.4 2.5 5.9 3.7 10.5 3.7zm80.3 10.8c-1.5 0-2.5-.2-3.2-.7-.7-.4-1.3-1.4-1.8-2.8L96.7 10.2c-.5-1.5-.7-2.5-.7-3 0-1.2.6-1.9 1.8-1.9h7.4c1.6 0 2.7.2 3.3.7.7.4 1.2 1.4 1.7 2.8l18.1 71.4 16.8-71.4c.4-1.5 1-2.4 1.7-2.8.7-.4 1.9-.7 3.4-.7h6c1.6 0 2.7.2 3.4.7.7.4 1.4 1.4 1.7 2.8l17 72.4 18.7-72.4c.5-1.5 1.1-2.4 1.7-2.8.7-.4 1.8-.7 3.3-.7h7c1.2 0 1.9.6 1.9 1.9 0 .4-.1.8-.2 1.3-.1.5-.3 1.2-.7 2.2l-25.1 78.7c-.5 1.5-1.1 2.4-1.8 2.8-.7.4-1.8.7-3.2.7h-6.5c-1.6 0-2.7-.2-3.4-.7-.7-.5-1.4-1.4-1.7-2.9l-16.7-69.6-16.6 69.5c-.4 1.5-1 2.4-1.7 2.9-.7.5-1.9.7-3.4.7h-6.5zm133.3 2.8c-3.9 0-7.8-.5-11.6-1.4-3.8-.9-6.7-1.9-8.7-3-.5-.3-.9-.7-1.1-1.2-.2-.5-.3-1-.3-1.5V83c0-1.9.7-2.8 2.1-2.8.5 0 1 .1 1.5.3.5.2 1.2.5 2 .8 2.7 1.2 5.6 2.1 8.7 2.8 3.2.7 6.3 1 9.4 1 5 0 8.8-.9 11.5-2.6 2.7-1.7 4.1-4.2 4.1-7.4 0-2.2-.7-4-2.1-5.5-1.4-1.5-4-2.9-7.8-4.2l-11.2-3.5c-5.7-1.8-9.9-4.4-12.5-7.8-2.6-3.4-3.9-7.2-3.9-11.2 0-3.2.7-6.1 2.1-8.5 1.4-2.4 3.3-4.6 5.7-6.3 2.4-1.8 5.1-3.1 8.3-4 3.2-.9 6.6-1.3 10.2-1.3 1.8 0 3.7.1 5.5.3 1.9.2 3.6.5 5.3.9 1.6.3 3.2.7 4.7 1.2 1.5.5 2.7 1 3.5 1.5.6.3 1 .7 1.3 1.1.3.4.4 1 .4 1.7v4.1c0 1.9-.7 2.9-2 2.9-.7 0-1.9-.4-3.4-1.1-5.1-2.3-10.8-3.4-17.1-3.4-4.5 0-8 .7-10.5 2.2-2.5 1.5-3.7 3.7-3.7 6.8 0 2.1.8 3.9 2.3 5.4 1.5 1.5 4.4 3 8.6 4.3l11 3.5c5.6 1.8 9.7 4.3 12.1 7.5 2.4 3.2 3.6 6.9 3.6 10.9 0 3.3-.7 6.3-2 8.9-1.4 2.6-3.3 4.9-5.8 6.7-2.5 1.9-5.4 3.3-8.8 4.3-3.5 1.1-7.2 1.6-11.2 1.6z"
        fill="#252F3E"
      />
      <path
        d="M273.5 143.7c-32.9 24.3-80.7 37.2-121.8 37.2-57.6 0-109.5-21.3-148.7-56.7-3.1-2.8-.3-6.6 3.4-4.4 42.4 24.6 94.7 39.5 148.8 39.5 36.5 0 76.6-7.6 113.5-23.2 5.5-2.5 10.2 3.6 4.8 7.6z"
        fill="#FF9900"
      />
      <path
        d="M287.2 128.1c-4.2-5.4-27.8-2.6-38.5-1.3-3.2.4-3.7-2.4-.8-4.5 18.8-13.2 49.7-9.4 53.3-5 3.6 4.5-1 35.4-18.6 50.2-2.7 2.3-5.3 1.1-4.1-1.9 3.9-9.9 12.9-32.2 8.7-37.5z"
        fill="#FF9900"
      />
    </svg>
  );
}

function AwsOnboardModal({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: (account: AwsAccountRecord) => void;
}) {
  const { t } = useTranslation('integrations');
  const [step, setStep] = useState<1 | 2>(1);
  const [trustData, setTrustData] = useState<{
    externalId: string;
    ismsAccountId: string;
    trustPolicyJson: string;
    permissionPolicyJson: string;
  } | null>(null);
  const [loadingPolicy, setLoadingPolicy] = useState(false);
  const [policyError, setPolicyError] = useState('');

  const [roleArn, setRoleArn] = useState('');
  const [awsAccountId, setAwsAccountId] = useState('');
  const [region, setRegion] = useState('us-east-1');
  const [label, setLabel] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');

  const [copied, setCopied] = useState<'trust' | 'perm' | null>(null);

  async function loadTrustPolicy() {
    setLoadingPolicy(true);
    setPolicyError('');
    try {
      const res = await awsService.getTrustPolicy();
      setTrustData(res.data);
    } catch (err: unknown) {
      setPolicyError(
        (err as { message?: string })?.message ??
          t('cards.aws.trustPolicyFailed'),
      );
    } finally {
      setLoadingPolicy(false);
    }
  }

  // Load trust policy as soon as modal opens
  useState(() => {
    loadTrustPolicy();
  });

  function copyToClipboard(text: string, which: 'trust' | 'perm') {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(which);
      setTimeout(() => setCopied(null), COPY_FEEDBACK_MS);
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!roleArn.trim() || !awsAccountId.trim()) {
      setConnectError(t('cards.aws.requiredFields'));
      return;
    }
    if (!trustData) {
      setConnectError(t('cards.aws.trustPolicyMissing'));
      return;
    }
    setConnecting(true);
    setConnectError('');
    try {
      const res = await awsService.connect({
        roleArn: roleArn.trim(),
        awsAccountId: awsAccountId.trim(),
        externalId: trustData.externalId,
        region,
        label: label.trim() || undefined,
      });
      if (res.success) {
        onConnected(res.data);
        onClose();
      }
    } catch (err: unknown) {
      setConnectError(
        (err as { message?: string })?.message ?? t('cards.aws.connectFailed'),
      );
    } finally {
      setConnecting(false);
    }
  }

  const AWS_REGIONS = [
    'us-east-1',
    'us-east-2',
    'us-west-1',
    'us-west-2',
    'eu-west-1',
    'eu-west-2',
    'eu-west-3',
    'eu-central-1',
    'eu-north-1',
    'ap-southeast-1',
    'ap-southeast-2',
    'ap-northeast-1',
    'ap-south-1',
    'ca-central-1',
    'sa-east-1',
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {t('cards.aws.connect')}
            </h2>
            <p className="text-sm text-gray-500">
              {t('cards.aws.stepOf', { step })}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={t('cards.shared.close')}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {step === 1 && (
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm text-gray-600">
              {t('cards.aws.step1Description')}
            </p>

            {loadingPolicy && (
              <p className="text-sm text-gray-400 animate-pulse">
                {t('cards.aws.generatingTrustPolicy')}
              </p>
            )}
            {policyError && (
              <p className="text-sm text-red-600">{policyError}</p>
            )}

            {trustData && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-semibold text-gray-700">
                      {t('cards.aws.trustPolicy')}
                    </label>
                    <button
                      onClick={() =>
                        copyToClipboard(trustData.trustPolicyJson, 'trust')
                      }
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {copied === 'trust'
                        ? t('cards.shared.copied')
                        : t('cards.shared.copy')}
                    </button>
                  </div>
                  <pre className="text-xs bg-gray-900 text-green-300 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap break-all font-mono leading-5">
                    {trustData.trustPolicyJson}
                  </pre>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-semibold text-gray-700">
                      {t('cards.aws.permissionPolicy')}
                    </label>
                    <button
                      onClick={() =>
                        copyToClipboard(trustData.permissionPolicyJson, 'perm')
                      }
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {copied === 'perm'
                        ? t('cards.shared.copied')
                        : t('cards.shared.copy')}
                    </button>
                  </div>
                  <pre className="text-xs bg-gray-900 text-green-300 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap break-all font-mono leading-5">
                    {trustData.permissionPolicyJson}
                  </pre>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                  <strong>{t('cards.aws.externalId')}</strong>{' '}
                  <code className="font-mono">{trustData.externalId}</code>
                  <br />
                  {t('cards.aws.externalIdHint')}
                </div>
              </>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setStep(2)}
                disabled={!trustData || loadingPolicy}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#FF9900] hover:bg-[#e68a00] text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
              >
                {t('cards.aws.next')}
              </button>
              <button
                onClick={onClose}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t('cards.shared.cancel')}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={submit} className="px-6 py-5 space-y-4">
            <p className="text-sm text-gray-600">
              {t('cards.aws.step2Description')}
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('cards.aws.roleArn')}{' '}
                <span className="text-gray-400 font-normal">
                  ({t('cards.aws.roleArnHint')})
                </span>
              </label>
              <input
                type="text"
                value={roleArn}
                onChange={(e) => setRoleArn(e.target.value)}
                placeholder="arn:aws:iam::123456789012:role/ISMSReadOnly"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900] font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('cards.aws.accountId')}{' '}
                <span className="text-gray-400 font-normal">
                  ({t('cards.aws.accountIdHint')})
                </span>
              </label>
              <input
                type="text"
                value={awsAccountId}
                onChange={(e) => setAwsAccountId(e.target.value)}
                placeholder="123456789012"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('cards.aws.primaryRegion')}
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900]"
              >
                {AWS_REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
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
                placeholder="Production, Staging, etc."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900]"
              />
            </div>
            {connectError && (
              <p className="text-sm text-red-600">{connectError}</p>
            )}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t('cards.shared.back')}
              </button>
              <button
                type="submit"
                disabled={connecting}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#FF9900] hover:bg-[#e68a00] text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
              >
                {connecting
                  ? t('cards.aws.connectingValidating')
                  : t('cards.aws.connect')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function AwsCard({
  accounts,
  loadingStatus,
  onAccountAdded,
  onAccountRemoved,
  onToast,
}: {
  accounts: AwsAccountRecord[];
  loadingStatus: boolean;
  onAccountAdded: (account: AwsAccountRecord) => void;
  onAccountRemoved: (accountId: string) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const { t } = useTranslation('integrations');
  const confirm = useConfirmDialog();
  const [showModal, setShowModal] = useState(false);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const isConnected = accounts.length > 0;

  async function handleScan(accountId: string) {
    setScanningId(accountId);
    try {
      await awsService.runScan(accountId);
      onToast('success', t('cards.aws.scanStarted'));
    } catch {
      onToast('error', t('cards.aws.scanStartFailed'));
    } finally {
      setScanningId(null);
    }
  }

  async function handleDisconnect(accountId: string, label: string | null) {
    const confirmed = await confirm({
      title: t('cards.aws.disconnectTitle'),
      description: t('cards.aws.disconnectDescription', {
        target: label ?? accountId,
      }),
      confirmLabel: t('cards.shared.disconnect'),
      variant: 'destructive',
    });
    if (!confirmed) return;
    setDisconnectingId(accountId);
    try {
      await awsService.disconnect(accountId);
      onAccountRemoved(accountId);
      onToast('success', t('cards.aws.disconnected'));
    } catch {
      onToast('error', t('cards.aws.disconnectFailed'));
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
              <AwsIcon className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AWS</h3>
              <p className="text-sm text-gray-500">{t('cards.aws.subtitle')}</p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {loadingStatus
              ? t('cards.shared.checking')
              : isConnected
                ? t('cards.aws.accountsConnected', { count: accounts.length })
                : t('cards.shared.available')}
          </Badge>
        </div>

        {/* Connected accounts */}
        {isConnected && accounts.length > 0 && (
          <div className="mb-4 space-y-2">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {account.label ?? account.awsAccountId}
                  </p>
                  <p className="text-xs text-gray-400 font-mono">
                    {account.awsAccountId} · {account.region}
                    {account.lastScanAt &&
                      ` · ${t('cards.aws.lastScan', { date: new Date(account.lastScanAt).toLocaleString() })}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
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
                    onClick={() => handleDisconnect(account.id, account.label)}
                    disabled={disconnectingId === account.id}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    {disconnectingId === account.id
                      ? t('cards.shared.disconnecting')
                      : t('cards.shared.disconnect')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {!loadingStatus && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#FF9900] hover:bg-[#e68a00] text-white text-sm font-medium"
            >
              <AwsIcon className="w-4 h-4" />
              {isConnected ? t('cards.aws.addAccount') : t('cards.aws.connect')}
            </button>
          )}
        </div>
      </Card>

      {showModal && (
        <AwsOnboardModal
          onClose={() => setShowModal(false)}
          onConnected={(account) => {
            onAccountAdded(account);
            onToast(
              'success',
              t('cards.aws.connected', {
                target: account.label ?? account.awsAccountId,
              }),
            );
          }}
        />
      )}
    </>
  );
}
