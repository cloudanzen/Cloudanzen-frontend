/**
 * Platform onboarding setup wizard (AI TrustOps Phase 1).
 *
 * Five steps capture the org profile before the tenant lands in the app:
 *
 *   1. Company type   — drives default primary use case + bundle + framework set.
 *   2. Primary goal   — what they're trying to prove first.
 *   3. Bundles        — feature visibility (Organization.enabledBundles).
 *                       Pre-filled from step 1 defaults. Floor bundles
 *                       (COMPLIANCE_AUTOMATION + CUSTOMER_TRUST) cannot
 *                       be unchecked — invariant enforced both client
 *                       and server side.
 *   4. Frameworks     — framework allowlist seeds via subscription_entitlements
 *                       (unchanged path). Pre-filled from step 1 defaults
 *                       by slug, mapped to platform framework IDs.
 *   5. Confirm        — review + submit. Calls POST /api/platform/onboarding/setup.
 *
 * The wizard targets an existing Organization (admin first creates it via
 * the AdminOrganizationsPage create flow, then runs the wizard). The
 * platform admin selects the org from a dropdown at the top of step 1
 * so we don't lose track of which tenant is being configured.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Check, AlertCircle } from 'lucide-react';

import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { adminService } from '@/services/api/admin';
import {
  platformOnboardingService,
  type ApplySetupResult,
  type CompanyType,
  type KnownBundle,
  type PrimaryUseCase,
} from '@/services/api/platformOnboarding';

const COMPANY_TYPE_OPTIONS: Array<{
  value: CompanyType;
  label: string;
  description: string;
}> = [
  {
    value: 'AI_NATIVE',
    label: 'AI-native company',
    description:
      'You sell or ship AI features and need to prove safety + governance to enterprise buyers.',
  },
  {
    value: 'SAAS',
    label: 'SaaS / software company',
    description:
      'You ship traditional SaaS and need SOC 2 / ISO 27001 to unlock enterprise deals.',
  },
  {
    value: 'HEALTHCARE',
    label: 'Healthcare / regulated',
    description:
      'HIPAA-bound. You handle PHI and need compliance + customer trust evidence.',
  },
  {
    value: 'ENTERPRISE_GRC',
    label: 'Internal enterprise GRC',
    description:
      'You run an in-house compliance program for a large organization.',
  },
  {
    value: 'OTHER',
    label: 'Other',
    description: 'None of the above quite fits.',
  },
];

const PRIMARY_USE_CASE_OPTIONS: Array<{
  value: PrimaryUseCase;
  label: string;
}> = [
  { value: 'AI_TRUST', label: 'Sell AI product to enterprise customers' },
  { value: 'SOC2', label: 'Prepare for SOC 2' },
  { value: 'ISO27001', label: 'Prepare for ISO 27001' },
  { value: 'ISO42001', label: 'Prepare for ISO 42001' },
  { value: 'TRUST_CENTER', label: 'Launch Trust Center' },
  { value: 'QUESTIONNAIRES', label: 'Answer security questionnaires' },
  { value: 'VENDOR_RISK', label: 'Run vendor risk reviews' },
];

const ALL_BUNDLES: Array<{
  value: KnownBundle;
  label: string;
  description: string;
  locked?: boolean;
}> = [
  {
    value: 'AI_GOVERNANCE',
    label: 'AI Governance',
    description:
      'AI TrustOps surface: systems registry, use-case approvals, runtime monitoring, agent trails.',
  },
  {
    value: 'COMPLIANCE_AUTOMATION',
    label: 'Compliance Automation',
    description:
      'Frameworks, controls, policies, evidence, audits. Required for every tenant.',
    locked: true,
  },
  {
    value: 'CUSTOMER_TRUST',
    label: 'Customer Trust',
    description:
      'Trust Center, customer commitments, NDA flows, viewer activity. Required for every tenant.',
    locked: true,
  },
  {
    value: 'VENDOR_RISK',
    label: 'Vendor Risk',
    description:
      'Vendor discovery, intake requests, dedicated vendor review workflow.',
  },
  {
    value: 'DEDICATED_CLOUD',
    label: 'Dedicated Cloud / BYOC',
    description:
      'Per-customer dedicated deployment. Surfaced on Trust Center BYOC section.',
  },
];

type Step = 1 | 2 | 3 | 4 | 5;

export function PlatformOnboardingSetupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [organizationId, setOrganizationId] = useState('');
  const [companyType, setCompanyType] = useState<CompanyType>('SAAS');
  const [primaryUseCase, setPrimaryUseCase] = useState<PrimaryUseCase | null>(
    null,
  );
  const [enabledBundles, setEnabledBundles] = useState<KnownBundle[]>([]);
  const [frameworkIds, setFrameworkIds] = useState<string[]>([]);
  const [result, setResult] = useState<ApplySetupResult | null>(null);

  // Org + framework catalogue.
  const orgsQuery = useQuery({
    queryKey: ['platform', 'admin', 'organizations'],
    queryFn: () => adminService.listOrganizations(),
  });
  const frameworksQuery = useQuery({
    queryKey: ['platform', 'admin', 'frameworks'],
    queryFn: () => adminService.listFrameworks(),
  });

  // Pre-fill steps 2-4 from server defaults whenever companyType changes.
  const defaultsQuery = useQuery({
    queryKey: ['platform', 'onboarding-defaults', companyType],
    queryFn: () => platformOnboardingService.getDefaults(companyType),
    enabled: !!companyType,
  });

  useEffect(() => {
    const d = defaultsQuery.data?.data;
    if (!d) return;
    setPrimaryUseCase((cur) => cur ?? d.primaryUseCase);
    setEnabledBundles((cur) => (cur.length === 0 ? d.enabledBundles : cur));
    // Map default slugs to ids from the framework catalogue.
    const all = frameworksQuery.data?.data ?? [];
    const idsBySlug = new Map(all.map((f) => [f.slug, f.id]));
    setFrameworkIds((cur) => {
      if (cur.length > 0) return cur;
      return d.frameworkSlugs
        .map((slug) => idsBySlug.get(slug))
        .filter((id): id is string => !!id);
    });
  }, [defaultsQuery.data, frameworksQuery.data]);

  const submit = useMutation({
    mutationFn: () =>
      platformOnboardingService.applySetup({
        organizationId,
        companyType,
        primaryUseCase: primaryUseCase ?? undefined,
        enabledBundles,
        frameworkIds,
      }),
    onSuccess: (res) => {
      setResult(res.data);
      setStep(5);
    },
  });

  const canAdvance = useMemo(() => {
    if (step === 1) return !!organizationId && !!companyType;
    if (step === 2) return !!primaryUseCase;
    if (step === 3) {
      return (
        enabledBundles.includes('COMPLIANCE_AUTOMATION') &&
        enabledBundles.includes('CUSTOMER_TRUST')
      );
    }
    if (step === 4) return true;
    return false;
  }, [step, organizationId, companyType, primaryUseCase, enabledBundles]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">
          Tenant onboarding setup
        </h1>
        <p className="text-sm text-muted-foreground">
          Capture the org profile that drives adaptive UI + framework grants.
        </p>
      </header>

      <StepIndicator step={step} />

      {step === 1 && (
        <Step1
          orgs={orgsQuery.data?.data ?? []}
          orgLoading={orgsQuery.isLoading}
          organizationId={organizationId}
          setOrganizationId={setOrganizationId}
          companyType={companyType}
          setCompanyType={(ct) => {
            // Reset downstream selections so defaults re-derive.
            setCompanyType(ct);
            setPrimaryUseCase(null);
            setEnabledBundles([]);
            setFrameworkIds([]);
          }}
        />
      )}

      {step === 2 && (
        <Step2
          primaryUseCase={primaryUseCase}
          setPrimaryUseCase={setPrimaryUseCase}
        />
      )}

      {step === 3 && (
        <Step3
          enabledBundles={enabledBundles}
          setEnabledBundles={setEnabledBundles}
        />
      )}

      {step === 4 && (
        <Step4
          frameworks={frameworksQuery.data?.data ?? []}
          frameworksLoading={frameworksQuery.isLoading}
          frameworkIds={frameworkIds}
          setFrameworkIds={setFrameworkIds}
        />
      )}

      {step === 5 && result && (
        <Step5Result result={result} onClose={() => navigate('/')} />
      )}

      {submit.isError && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          <div>
            {submit.error instanceof Error
              ? submit.error.message
              : 'Setup failed.'}
          </div>
        </div>
      )}

      {step < 5 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1) as Step)}
          >
            <ChevronLeft className="h-4 w-4 mr-1.5" /> Back
          </Button>
          {step < 4 ? (
            <Button
              disabled={!canAdvance}
              onClick={() => setStep((s) => Math.min(5, s + 1) as Step)}
            >
              Next <ChevronRight className="h-4 w-4 ml-1.5" />
            </Button>
          ) : (
            <Button
              disabled={!canAdvance || submit.isPending}
              onClick={() => submit.mutate()}
            >
              {submit.isPending ? 'Applying…' : 'Apply setup'}
              <Check className="h-4 w-4 ml-1.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const steps = ['Company', 'Goal', 'Bundles', 'Frameworks', 'Done'];
  return (
    <div className="flex items-center gap-2 text-xs">
      {steps.map((label, i) => {
        const n = (i + 1) as Step;
        const active = step === n;
        const done = step > n;
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                active
                  ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700 font-semibold'
                  : done
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-300 bg-white text-slate-500'
              }`}
            >
              {done ? <Check className="h-3 w-3" /> : n}
            </div>
            <span
              className={
                active ? 'font-semibold text-foreground' : 'text-slate-500'
              }
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <span className="mx-1 text-slate-300">→</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Step1({
  orgs,
  orgLoading,
  organizationId,
  setOrganizationId,
  companyType,
  setCompanyType,
}: {
  orgs: Array<{ id: string; name: string }>;
  orgLoading: boolean;
  organizationId: string;
  setOrganizationId: (v: string) => void;
  companyType: CompanyType;
  setCompanyType: (ct: CompanyType) => void;
}) {
  return (
    <div className="space-y-6">
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-foreground mb-2">
          Pick the tenant
        </h2>
        <select
          value={organizationId}
          onChange={(e) => setOrganizationId(e.target.value)}
          className="w-full rounded-md border border-slate-300 bg-card px-3 py-2 text-sm focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-200"
        >
          <option value="">{orgLoading ? 'Loading…' : 'Select an org'}</option>
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-foreground mb-3">
          What type of company are you onboarding?
        </h2>
        <div className="grid gap-2">
          {COMPANY_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setCompanyType(opt.value)}
              className={`rounded-md border p-3 text-left transition-colors ${
                companyType === opt.value
                  ? 'border-fuchsia-400 bg-fuchsia-50'
                  : 'border-slate-300 bg-white hover:bg-slate-50'
              }`}
            >
              <p
                className={`text-sm font-semibold ${companyType === opt.value ? 'text-fuchsia-700' : 'text-foreground'}`}
              >
                {opt.label}
              </p>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                {opt.description}
              </p>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Step2({
  primaryUseCase,
  setPrimaryUseCase,
}: {
  primaryUseCase: PrimaryUseCase | null;
  setPrimaryUseCase: (v: PrimaryUseCase) => void;
}) {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-foreground mb-3">
        What are they trying to prove first?
      </h2>
      <div className="grid gap-2">
        {PRIMARY_USE_CASE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setPrimaryUseCase(opt.value)}
            className={`rounded-md border p-3 text-left text-sm transition-colors ${
              primaryUseCase === opt.value
                ? 'border-fuchsia-400 bg-fuchsia-50 font-semibold text-fuchsia-700'
                : 'border-slate-300 bg-white text-foreground hover:bg-slate-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </Card>
  );
}

function Step3({
  enabledBundles,
  setEnabledBundles,
}: {
  enabledBundles: KnownBundle[];
  setEnabledBundles: (v: KnownBundle[]) => void;
}) {
  function toggle(b: KnownBundle, locked?: boolean) {
    if (locked) return;
    setEnabledBundles(
      enabledBundles.includes(b)
        ? enabledBundles.filter((x) => x !== b)
        : [...enabledBundles, b],
    );
  }
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-foreground mb-3">
        Which feature bundles?
      </h2>
      <div className="grid gap-2">
        {ALL_BUNDLES.map((bun) => {
          const selected =
            enabledBundles.includes(bun.value) || bun.locked === true;
          return (
            <label
              key={bun.value}
              className={`flex items-start gap-3 rounded-md border p-3 ${
                bun.locked
                  ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
                  : selected
                    ? 'border-fuchsia-400 bg-fuchsia-50 cursor-pointer'
                    : 'border-slate-300 bg-white cursor-pointer hover:bg-slate-50'
              }`}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={() => toggle(bun.value, bun.locked)}
                disabled={bun.locked}
                className="mt-0.5"
              />
              <div className="flex-1">
                <p
                  className={`text-sm font-semibold ${selected && !bun.locked ? 'text-fuchsia-700' : 'text-foreground'}`}
                >
                  {bun.label}
                  {bun.locked && (
                    <span className="ml-2 text-xs font-medium text-slate-500">
                      Required floor
                    </span>
                  )}
                </p>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  {bun.description}
                </p>
              </div>
            </label>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Floor bundles (COMPLIANCE_AUTOMATION + CUSTOMER_TRUST) cannot be
        unchecked. The server rejects payloads missing either.
      </p>
    </Card>
  );
}

function Step4({
  frameworks,
  frameworksLoading,
  frameworkIds,
  setFrameworkIds,
}: {
  frameworks: Array<{
    id: string;
    slug: string;
    name: string;
    version: string;
  }>;
  frameworksLoading: boolean;
  frameworkIds: string[];
  setFrameworkIds: (v: string[]) => void;
}) {
  function toggle(id: string) {
    setFrameworkIds(
      frameworkIds.includes(id)
        ? frameworkIds.filter((x) => x !== id)
        : [...frameworkIds, id],
    );
  }
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-foreground mb-3">
        Which frameworks should this tenant see?
      </h2>
      {frameworksLoading ? (
        <p className="text-sm text-slate-500">Loading frameworks…</p>
      ) : (
        <div className="grid gap-2">
          {frameworks.map((fw) => {
            const selected = frameworkIds.includes(fw.id);
            return (
              <label
                key={fw.id}
                className={`flex items-center gap-3 rounded-md border p-3 cursor-pointer ${
                  selected
                    ? 'border-fuchsia-400 bg-fuchsia-50'
                    : 'border-slate-300 bg-white hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggle(fw.id)}
                />
                <div>
                  <p
                    className={`text-sm font-semibold ${selected ? 'text-fuchsia-700' : 'text-foreground'}`}
                  >
                    {fw.name}{' '}
                    <span className="text-xs font-normal text-slate-500">
                      ({fw.slug}, {fw.version})
                    </span>
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      )}
      <p className="mt-3 text-xs text-slate-500">
        Framework grants persist via the existing subscription_entitlements
        path. The tenant can request more frameworks later via the standard
        framework-access flow.
      </p>
    </Card>
  );
}

function Step5Result({
  result,
  onClose,
}: {
  result: ApplySetupResult;
  onClose: () => void;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Check className="h-4 w-4" />
        </div>
        <h2 className="text-base font-semibold text-foreground">
          Tenant configured
        </h2>
      </div>
      <dl className="grid grid-cols-2 gap-y-2 text-sm">
        <dt className="text-slate-500">Organization</dt>
        <dd className="font-mono text-foreground">{result.organizationId}</dd>
        <dt className="text-slate-500">Company type</dt>
        <dd className="font-semibold">{result.companyType}</dd>
        <dt className="text-slate-500">Primary use case</dt>
        <dd className="font-semibold">{result.primaryUseCase}</dd>
        <dt className="text-slate-500">Bundles</dt>
        <dd className="text-foreground">{result.enabledBundles.join(', ')}</dd>
        <dt className="text-slate-500">Granted frameworks</dt>
        <dd className="text-foreground">
          {result.grantedFrameworkSlugs.length > 0
            ? result.grantedFrameworkSlugs.join(', ')
            : '—'}
        </dd>
        <dt className="text-slate-500">Bundles version</dt>
        <dd className="font-mono">{result.bundlesVersion}</dd>
      </dl>
      <div className="mt-5 flex justify-end">
        <Button onClick={onClose}>Done</Button>
      </div>
    </Card>
  );
}
