import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Shield } from 'lucide-react';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Switch } from '@/app/components/ui/switch';
import { Label } from '@/app/components/ui/label';
import { Button } from '@/app/components/ui/button';
import {
  useNotificationPreferences,
  useUpdateNotificationPreference,
} from '@/app/features/notifications/useNotifications';
import { notificationEventDefinitions } from '@/app/features/notifications/notificationHelpers';
import {
  remediationService,
  TenantPolicy,
  UpdateTenantPolicyRequest,
} from '@/services/api/remediation';

const COMPLIANCE_EVENT_TYPES = [
  'control.assigned',
  'audit.created',
  'audit.reminder',
  'framework.activated',
  'framework.coverage_drop',
];

const SEVERITY_OPTIONS: Array<{
  value: TenantPolicy['maxAutoFixSeverity'];
  labelKey: string;
  descKey: string;
}> = [
  { value: 'LOW', labelKey: 'complianceSettings.lowOnly', descKey: 'complianceSettings.lowOnlyDesc' },
  { value: 'MEDIUM', labelKey: 'complianceSettings.mediumBelow', descKey: 'complianceSettings.mediumBelowDesc' },
  { value: 'HIGH', labelKey: 'complianceSettings.highBelow', descKey: 'complianceSettings.highBelowDesc' },
  { value: 'CRITICAL', labelKey: 'complianceSettings.allSeverities', descKey: 'complianceSettings.allSeveritiesDesc' },
];

const APPROVAL_CHANNEL_OPTIONS: Array<{
  value: TenantPolicy['defaultApprovalChannel'];
  labelKey: string;
}> = [
  { value: 'manual', labelKey: 'complianceSettings.manual' },
  { value: 'slack', labelKey: 'complianceSettings.slack' },
  { value: 'jira', labelKey: 'complianceSettings.jira' },
];

// ── Remediation Policy Section ────────────────────────────────────────────────

function RemediationPolicySection() {
  const { t } = useTranslation('compliance');
  const queryClient = useQueryClient();

  const policyQuery = useQuery({
    queryKey: ['remediation-policy'],
    queryFn: () => remediationService.getPolicy(),
  });

  // Local form state — initialized from loaded policy
  const [autoFixEnabled, setAutoFixEnabled] = useState(false);
  const [maxSeverity, setMaxSeverity] =
    useState<TenantPolicy['maxAutoFixSeverity']>('MEDIUM');
  const [allowProdCritical, setAllowProdCritical] = useState(false);
  const [requireApprovalForProd, setRequireApprovalForProd] = useState(true);
  const [approvalChannel, setApprovalChannel] =
    useState<TenantPolicy['defaultApprovalChannel']>('manual');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (policyQuery.data && !initialized) {
      setAutoFixEnabled(policyQuery.data.autoFixEnabled);
      setMaxSeverity(policyQuery.data.maxAutoFixSeverity);
      setAllowProdCritical(policyQuery.data.allowProductionCriticalAutoFix);
      setRequireApprovalForProd(policyQuery.data.requireApprovalForProduction);
      setApprovalChannel(policyQuery.data.defaultApprovalChannel ?? 'manual');
      setInitialized(true);
    }
    // If no policy exists yet, keep defaults
    if (policyQuery.data === null && !initialized) {
      setInitialized(true);
    }
  }, [policyQuery.data, initialized]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateTenantPolicyRequest) =>
      remediationService.updatePolicy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remediation-policy'] });
    },
  });

  function handleSave() {
    updateMutation.mutate({
      autoFixEnabled,
      maxAutoFixSeverity: maxSeverity,
      allowProductionCriticalAutoFix: allowProdCritical,
      requireApprovalForProduction: requireApprovalForProd,
      defaultApprovalChannel: approvalChannel,
    });
  }

  if (policyQuery.isLoading || !initialized) {
    return (
      <div className="flex h-24 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Auto-fix master toggle */}
      <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-100 p-4">
        <div>
          <Label htmlFor="auto-fix-enabled" className="text-sm font-medium">
            {t('complianceSettings.enableAutoRemediation')}
          </Label>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('complianceSettings.enableAutoRemediationDesc')}
          </p>
        </div>
        <Switch
          id="auto-fix-enabled"
          checked={autoFixEnabled}
          onCheckedChange={setAutoFixEnabled}
        />
      </div>

      {/* Severity cap */}
      <div
        className={`space-y-2 transition-opacity ${!autoFixEnabled ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <Label className="text-sm font-medium">
          {t('complianceSettings.maxSeverity')}
        </Label>
        <p className="text-xs text-gray-500 mb-2">
          {t('complianceSettings.maxSeverityDesc')}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {SEVERITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMaxSeverity(opt.value)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                maxSeverity === opt.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-100 hover:border-gray-300'
              }`}
            >
              <p className="text-sm font-medium text-gray-900">{t(opt.labelKey)}</p>
              <p className="text-xs text-gray-500">{t(opt.descKey)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Production guardrails */}
      <div
        className={`space-y-3 transition-opacity ${!autoFixEnabled ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <Label className="text-sm font-medium">{t('complianceSettings.productionGuardrails')}</Label>
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-100 p-4">
            <div>
              <Label htmlFor="require-approval-prod" className="text-sm">
                {t('complianceSettings.requireApprovalProd')}
              </Label>
              <p className="text-sm text-gray-500 mt-0.5">
                {t('complianceSettings.requireApprovalProdDesc')}
              </p>
            </div>
            <Switch
              id="require-approval-prod"
              checked={requireApprovalForProd}
              onCheckedChange={setRequireApprovalForProd}
            />
          </div>

          <div className="flex items-start justify-between gap-4 rounded-xl border border-orange-50 bg-orange-50 p-4">
            <div>
              <Label
                htmlFor="allow-prod-critical"
                className="text-sm text-orange-800"
              >
                {t('complianceSettings.allowCriticalProd')}
              </Label>
              <p className="text-sm text-orange-700 mt-0.5">
                {t('complianceSettings.allowCriticalProdDesc')}
              </p>
            </div>
            <Switch
              id="allow-prod-critical"
              checked={allowProdCritical}
              onCheckedChange={setAllowProdCritical}
            />
          </div>
        </div>
      </div>

      {/* Default approval channel */}
      <div
        className={`space-y-2 transition-opacity ${!autoFixEnabled ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <Label className="text-sm font-medium">{t('complianceSettings.defaultApprovalChannel')}</Label>
        <p className="text-xs text-gray-500 mb-2">
          {t('complianceSettings.defaultApprovalChannelDesc')}
        </p>
        <div className="flex gap-2">
          {APPROVAL_CHANNEL_OPTIONS.map((opt) => (
            <button
              key={opt.value ?? 'none'}
              onClick={() => setApprovalChannel(opt.value)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                approvalChannel === opt.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                  : 'border-gray-100 text-gray-700 hover:border-gray-300'
              }`}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {updateMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {t('complianceSettings.savePolicy')}
        </Button>
        {updateMutation.isSuccess && (
          <p className="text-sm text-green-600">{t('complianceSettings.saved')}</p>
        )}
        {updateMutation.isError && (
          <p className="text-sm text-red-600">{t('complianceSettings.saveFailed')}</p>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function ComplianceSettingsPage() {
  const { t } = useTranslation('compliance');
  const preferencesQuery = useNotificationPreferences();
  const updatePreference = useUpdateNotificationPreference();

  return (
    <PageTemplate
      title={t('complianceSettings.title')}
      description={t('complianceSettings.description')}
    >
      <div className="space-y-6 max-w-4xl">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('complianceSettings.notifications')}
          </h2>
          {preferencesQuery.isLoading || !preferencesQuery.data ? (
            <div className="flex h-24 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-4">
              {notificationEventDefinitions
                .filter((definition) =>
                  COMPLIANCE_EVENT_TYPES.includes(definition.eventType),
                )
                .map((definition) => {
                  const preference = preferencesQuery.data.find(
                    (item) => item.eventType === definition.eventType,
                  );
                  if (!preference) return null;
                  return (
                    <div
                      key={definition.eventType}
                      className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 p-4"
                    >
                      <div>
                        <Label htmlFor={definition.eventType}>
                          {definition.label}
                        </Label>
                        <p className="text-sm text-gray-500">
                          {definition.description}
                        </p>
                      </div>
                      <Switch
                        id={definition.eventType}
                        checked={preference.inAppEnabled}
                        onCheckedChange={(checked) =>
                          updatePreference.mutate({
                            eventType: definition.eventType,
                            body: { inAppEnabled: checked },
                          })
                        }
                      />
                    </div>
                  );
                })}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('complianceSettings.frameworkSettings')}
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-mapping">{t('complianceSettings.autoMapControls')}</Label>
                <p className="text-sm text-gray-500">
                  {t('complianceSettings.autoMapDesc')}
                </p>
              </div>
              <Switch id="auto-mapping" defaultChecked />
            </div>
          </div>
        </Card>

        {/* Remediation Policy — TenantPolicy guardrails */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {t('complianceSettings.remediationPolicy')}
            </h2>
          </div>
          <p className="text-sm text-gray-500 mb-5">
            {t('complianceSettings.remediationDesc')}
          </p>
          <RemediationPolicySection />
        </Card>
      </div>
    </PageTemplate>
  );
}
