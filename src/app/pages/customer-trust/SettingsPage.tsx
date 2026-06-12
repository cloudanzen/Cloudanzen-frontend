import { useState, useEffect } from 'react';
import { TOAST_DURATION_MS } from '@/lib/constants';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Switch } from '@/app/components/ui/switch';
import { Label } from '@/app/components/ui/label';
import {
  Cloud,
  ExternalLink,
  Hash,
  RefreshCw,
  Shield,
  Globe,
  Mail,
} from 'lucide-react';
import {
  trustCenterService,
  UpdateSettingsPayload,
} from '@/services/api/trustCenter';
import { salesforceTrustService } from '@/services/api/salesforceTrust';
import { slackService } from '@/services/api/slack';

const BASE_URL = import.meta.env.VITE_APP_URL || 'https://app.cloudanzen.com';

function fmt(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function CustomerTrustSettingsPage() {
  const { t } = useTranslation('common');
  const qc = useQueryClient();
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [enabled, setEnabled] = useState(false);
  const [orgSlug, setOrgSlug] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [description, setDescription] = useState('');
  const [securityEmail, setSecurityEmail] = useState('');
  const [slackApprovalChannelId, setSlackApprovalChannelId] = useState<
    string | null
  >(null);
  const [slugError, setSlugError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['trust-settings'],
    queryFn: () => trustCenterService.getSettings(),
  });

  const settings = data?.data?.settings;
  const snapshot = data?.data?.snapshot;

  // Populate form when data loads
  useEffect(() => {
    if (!settings) return;
    setEnabled(settings.enabled);
    setOrgSlug(settings.orgSlug ?? '');
    setLogoUrl(settings.logoUrl ?? '');
    setPrimaryColor(settings.primaryColor ?? '#2563eb');
    setDescription(settings.description ?? '');
    setSecurityEmail(settings.securityEmail ?? '');
    setSlackApprovalChannelId(settings.slackApprovalChannelId ?? null);
  }, [settings]);

  // Salesforce + Slack channels (Phase D2)
  const { data: sfStatus, refetch: refetchSf } = useQuery({
    queryKey: ['salesforce-trust-status'],
    queryFn: () => salesforceTrustService.status(),
  });
  const { data: slackChannels } = useQuery({
    queryKey: ['slack-channels'],
    queryFn: () => slackService.getChannels(),
  });

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }

  function validateSlug(v: string) {
    if (!v) return t('customerTrust.settings.slugRequired');
    if (!/^[a-z0-9-]+$/.test(v)) return t('customerTrust.settings.slugFormat');
    if (v.length < 2) return t('customerTrust.settings.slugMinLength');
    return '';
  }

  async function handleSave() {
    const err = validateSlug(orgSlug);
    if (err) {
      setSlugError(err);
      return;
    }
    setSlugError('');
    setSaving(true);
    try {
      const payload: UpdateSettingsPayload = {
        enabled,
        orgSlug,
        logoUrl: logoUrl || null,
        primaryColor,
        description: description || null,
        securityEmail: securityEmail || null,
        slackApprovalChannelId: slackApprovalChannelId || null,
      };
      await trustCenterService.updateSettings(payload);
      qc.invalidateQueries({ queryKey: ['trust-settings'] });
      showToast('success', t('customerTrust.settings.settingsSaved'));
    } catch (e: unknown) {
      showToast(
        'error',
        e instanceof Error ? e.message : t('errors.saveFailed'),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSnapshot() {
    try {
      await trustCenterService.triggerSnapshot();
      qc.invalidateQueries({ queryKey: ['trust-settings'] });
      showToast('success', t('customerTrust.settings.snapshotRefreshed'));
    } catch (e: unknown) {
      showToast(
        'error',
        e instanceof Error
          ? e.message
          : t('customerTrust.settings.failedToSnapshot'),
      );
    }
  }

  const portalUrl = `${BASE_URL}/trust/${orgSlug}`;

  const inputCls =
    'w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <PageTemplate
      title={t('customerTrust.settings.title')}
      description={t('customerTrust.settings.description')}
      actions={
        <div className="flex gap-2">
          {settings?.enabled && orgSlug && (
            <a href={portalUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-1.5" />{' '}
                {t('customerTrust.settings.viewPortal')}
              </Button>
            </a>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving
              ? t('customerTrust.settings.saving')
              : t('customerTrust.settings.saveSettings')}
          </Button>
        </div>
      }
    >
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
        >
          {toast.msg}
        </div>
      )}

      <div className="space-y-6 max-w-4xl">
        {/* ── A) General Settings ─────────────────────────────────────── */}
        <Card className="p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" />{' '}
            {t('customerTrust.settings.generalSettings')}
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-8 bg-gray-100 rounded animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              {/* Enable toggle */}
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <Label htmlFor="tc-enabled" className="font-medium">
                    {t('customerTrust.settings.enableTrustCenter')}
                  </Label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t('customerTrust.settings.enableDescription')}
                  </p>
                </div>
                <Switch
                  id="tc-enabled"
                  checked={enabled}
                  onCheckedChange={setEnabled}
                />
              </div>

              {/* Slug */}
              <div>
                <Label className="block text-xs font-medium text-gray-700 mb-1">
                  {t('customerTrust.settings.publicUrlSlug')}{' '}
                  <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {BASE_URL}/trust/
                  </span>
                  <input
                    className={`${inputCls} flex-1 ${slugError ? 'border-red-400 focus:ring-red-400' : ''}`}
                    placeholder="your-company"
                    value={orgSlug}
                    onChange={(e) => {
                      setOrgSlug(e.target.value.toLowerCase());
                      setSlugError('');
                    }}
                  />
                </div>
                {slugError && (
                  <p className="text-xs text-red-500 mt-1">{slugError}</p>
                )}
              </div>

              {/* Logo URL */}
              <div>
                <Label className="block text-xs font-medium text-gray-700 mb-1">
                  {t('customerTrust.settings.logoUrl')}
                </Label>
                <input
                  className={inputCls}
                  placeholder={t('customerTrust.settings.logoPlaceholder')}
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                />
              </div>

              {/* Brand color */}
              <div>
                <Label className="block text-xs font-medium text-gray-700 mb-1">
                  {t('customerTrust.settings.primaryBrandColor')}
                </Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    className="w-10 h-9 rounded border border-gray-300 cursor-pointer"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                  />
                  <input
                    className={`${inputCls} flex-1`}
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#2563eb"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="block text-xs font-medium text-gray-700 mb-1">
                  {t('customerTrust.settings.publicDescription')}
                </Label>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={4}
                  placeholder={t(
                    'customerTrust.settings.descriptionPlaceholder',
                  )}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Security email */}
              <div>
                <Label className="block text-xs font-medium text-gray-700 mb-1">
                  {t('customerTrust.settings.securityContactEmail')}
                </Label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="email"
                    className={`${inputCls} flex-1`}
                    placeholder="security@yourcompany.com"
                    value={securityEmail}
                    onChange={(e) => setSecurityEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* ── A.1) Salesforce CRM connector (Phase D2) ───────────────── */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Cloud className="w-4 h-4 text-[#00A1E0]" /> Salesforce CRM
            </h2>
            <div className="flex gap-2">
              {sfStatus?.data?.connected && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await salesforceTrustService.sync();
                      await refetchSf();
                      showToast('success', 'Salesforce sync triggered');
                    } catch (e: unknown) {
                      showToast(
                        'error',
                        e instanceof Error ? e.message : 'Sync failed',
                      );
                    }
                  }}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Resync
                </Button>
              )}
              <Button
                variant={sfStatus?.data?.connected ? 'outline' : 'default'}
                size="sm"
                onClick={async () => {
                  try {
                    if (sfStatus?.data?.connected) {
                      await salesforceTrustService.disconnect();
                      await refetchSf();
                      showToast('success', 'Salesforce disconnected');
                    } else {
                      const r = await salesforceTrustService.connect();
                      const w = window.open(
                        r.authUrl,
                        'salesforce-oauth',
                        'width=600,height=700',
                      );
                      const onMessage = (ev: MessageEvent) => {
                        if (
                          ev.data &&
                          typeof ev.data === 'object' &&
                          (ev.data as { type?: string }).type ===
                            'salesforce.connected'
                        ) {
                          refetchSf();
                          showToast('success', 'Salesforce connected');
                          window.removeEventListener('message', onMessage);
                          try {
                            w?.close();
                          } catch {
                            /* ignore */
                          }
                        }
                      };
                      window.addEventListener('message', onMessage);
                    }
                  } catch (e: unknown) {
                    showToast(
                      'error',
                      e instanceof Error ? e.message : 'Operation failed',
                    );
                  }
                }}
              >
                {sfStatus?.data?.connected
                  ? 'Disconnect'
                  : 'Connect Salesforce'}
              </Button>
            </div>
          </div>
          {sfStatus?.data?.connected ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Stat
                label="Linked accounts"
                value={String(sfStatus.data.linkedAccountCount)}
              />
              <Stat
                label="Cached opportunities"
                value={String(sfStatus.data.opportunityCount)}
              />
              <Stat
                label="Revenue influenced"
                value={formatUsd(sfStatus.data.revenueInfluencedUsd)}
              />
              <Stat
                label="Last synced"
                value={fmt(sfStatus.data.lastSyncedAt)}
              />
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Connect Salesforce to enable CRM-based auto-approval rules and
              revenue-influenced KPIs on Overview.
            </p>
          )}
        </Card>

        {/* ── A.2) Slack approval channel (Phase D2) ─────────────────── */}
        <Card className="p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Hash className="w-4 h-4 text-purple-600" /> Slack approvals
          </h2>
          {!slackChannels?.data || slackChannels.data.length === 0 ? (
            <p className="text-sm text-gray-500">
              No Slack channels mapped. Install the Slack app under Integrations
              → Slack and map at least one channel before configuring approval
              routing here.
            </p>
          ) : (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700">
                Channel for access-request approvals
              </Label>
              <select
                className={inputCls}
                value={slackApprovalChannelId ?? ''}
                onChange={(e) =>
                  setSlackApprovalChannelId(e.target.value || null)
                }
              >
                <option value="">— Disabled (in-app only) —</option>
                {slackChannels.data.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.channelName}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                When set, every manual access request is posted to this channel
                with Approve / Reject buttons.
              </p>
            </div>
          )}
        </Card>

        {/* ── B) Compliance Overview ──────────────────────────────────── */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-600" /> Compliance Overview
            </h2>
            <Button variant="outline" size="sm" onClick={handleSnapshot}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh Snapshot
            </Button>
          </div>

          {!snapshot ? (
            <p className="text-sm text-gray-400">
              No snapshot yet. Click "Refresh Snapshot" to capture live metrics.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  label: 'Compliance %',
                  value: `${snapshot.pct}%`,
                  color: 'text-blue-700',
                },
                {
                  label: 'Implemented',
                  value: snapshot.implemented,
                  color: 'text-green-700',
                },
                {
                  label: 'Total Controls',
                  value: snapshot.total,
                  color: 'text-gray-900',
                },
                {
                  label: 'Open Risks',
                  value: snapshot.openRisks,
                  color: 'text-red-600',
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-gray-50 rounded-xl p-4 text-center"
                >
                  <div className={`text-2xl font-bold ${s.color}`}>
                    {s.value}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          )}
          {snapshot?.lastAudit && (
            <p className="text-xs text-gray-400 mt-3">
              Last completed audit:{' '}
              <strong className="text-gray-700">
                {snapshot.lastAudit.name}
              </strong>{' '}
              — {fmt(snapshot.lastAudit.closedAt)}
            </p>
          )}
        </Card>
      </div>
    </PageTemplate>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 text-center">
      <div className="text-lg font-semibold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function formatUsd(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${Math.round(n)}`;
}
