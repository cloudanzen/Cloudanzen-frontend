/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Progress } from '@/app/components/ui/progress';
import { Input } from '@/app/components/ui/input';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import {
  VendorRecord,
  VendorStatus,
  VendorTier,
  vendorsService,
} from '@/services/api/vendors';
import { QK } from '@/lib/queryKeys';
import { getStatusColors, getSeverityColors } from '@/app/theme/semantic-colors';

// ── Helpers ────────────────────────────────────────────────────────────────────

const statusMeta: Record<VendorStatus, { label: string; className: string }> = {
  MONITORED:      { label: 'Monitored',     className: getStatusColors('MONITORED').className },
  ASSESSMENT_DUE: { label: 'Assessment due', className: getStatusColors('ASSESSMENT_DUE').className },
  IN_REVIEW:      { label: 'In review',      className: getStatusColors('IN_REVIEW').className },
  BLOCKED:        { label: 'Blocked',        className: getStatusColors('BLOCKED').className },
};

const tierMeta: Record<VendorTier, { label: string; className: string }> = {
  LOW:      { label: 'Low',      className: getSeverityColors('LOW').className },
  MEDIUM:   { label: 'Medium',   className: getSeverityColors('MEDIUM').className },
  HIGH:     { label: 'High',     className: getSeverityColors('HIGH').className },
  CRITICAL: { label: 'Critical', className: getSeverityColors('CRITICAL').className },
};

function scoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-600';
  if (score >= 50) return 'text-amber-500';
  return 'text-red-500';
}

function scoreBarIndicator(score: number): string {
  if (score >= 70) return '[&>div]:bg-emerald-500';
  if (score >= 50) return '[&>div]:bg-amber-500';
  return '[&>div]:bg-red-500';
}

function getRiskSummary(criticality: string, dataClass: string): string {
  const isPII = dataClass === 'PII';
  const isCritical = criticality === 'Mission-critical';
  if (isCritical && isPII)
    return 'High inherent risk — mission-critical vendor with access to PII data. Requires annual assessment and signed DPA. Escalate any open findings immediately.';
  if (isCritical)
    return 'Elevated inherent risk — mission-critical vendor. Validate access scope and schedule assessment within 6 months.';
  if (isPII)
    return 'Elevated inherent risk — processes PII data. Ensure DPA is signed and questionnaire is complete before approving.';
  return 'Standard inherent risk profile. Maintain regular annual assessment cycle.';
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString();
}

// ── Sub-components ─────────────────────────────────────────────────────────────

interface VendorActions {
  onUpdate: (patch: Partial<VendorRecord>) => Promise<void>;
  onCompleteAssessment: () => Promise<void>;
}

function StatusWorkflow({ vendor, onUpdate, onCompleteAssessment }: { vendor: VendorRecord } & VendorActions) {
  const [saving, setSaving] = useState(false);

  const transitions: Record<VendorStatus, Array<{ label: string; variant: 'default' | 'outline' | 'destructive'; action: () => Promise<void> }>> = {
    IN_REVIEW: [
      { label: 'Approve → Monitored', variant: 'default', action: () => onUpdate({ status: 'MONITORED' }) },
      { label: 'Flag for Assessment', variant: 'outline', action: () => onUpdate({ status: 'ASSESSMENT_DUE' }) },
    ],
    ASSESSMENT_DUE: [
      { label: 'Complete Assessment', variant: 'default', action: onCompleteAssessment },
      { label: 'Back to Review', variant: 'outline', action: () => onUpdate({ status: 'IN_REVIEW' }) },
    ],
    MONITORED: [
      { label: 'Request Reassessment', variant: 'outline', action: () => onUpdate({ status: 'ASSESSMENT_DUE' }) },
      { label: 'Block Vendor', variant: 'destructive', action: () => onUpdate({ status: 'BLOCKED' }) },
    ],
    BLOCKED: [
      { label: 'Unblock Vendor', variant: 'outline', action: () => onUpdate({ status: 'IN_REVIEW' }) },
    ],
  };

  const actions = transitions[vendor.status] ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Current status:</span>
        <Badge variant="outline" className={statusMeta[vendor.status].className}>
          {statusMeta[vendor.status].label}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((t) => (
          <Button
            key={t.label}
            variant={t.variant}
            className="h-8"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try { await t.action(); } finally { setSaving(false); }
            }}
          >
            {t.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

function AssessmentTab({ vendor, onUpdate, onCompleteAssessment }: { vendor: VendorRecord } & VendorActions) {
  const [completing, setCompleting] = useState(false);
  const [updatingFindings, setUpdatingFindings] = useState(false);

  async function handleFindingsChange(delta: number) {
    const newVal = Math.max(0, vendor.openFindings + delta);
    setUpdatingFindings(true);
    try { await onUpdate({ openFindings: newVal }); } finally { setUpdatingFindings(false); }
  }

  async function handleDpaToggle() {
    await onUpdate({ dpaSigned: !vendor.dpaSigned });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-sm">Security Score</CardTitle></CardHeader>
        <CardContent>
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>Score</span>
            <span className={`font-semibold ${scoreColor(vendor.securityScore)}`}>{vendor.securityScore}/100</span>
          </div>
          <Progress value={vendor.securityScore} className={scoreBarIndicator(vendor.securityScore)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Questionnaire Completion</CardTitle></CardHeader>
        <CardContent>
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>Completion</span>
            <span>{vendor.questionnaireCompletion}%</span>
          </div>
          <Progress value={vendor.questionnaireCompletion} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Open Findings</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={updatingFindings || vendor.openFindings <= 0}
              onClick={() => handleFindingsChange(-1)}
            >
              −
            </Button>
            <span className="text-2xl font-bold text-foreground">{vendor.openFindings}</span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={updatingFindings}
              onClick={() => handleFindingsChange(1)}
            >
              +
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">DPA Signed</p>
              <p className="text-xs text-muted-foreground">Data Processing Agreement</p>
            </div>
            <button
              onClick={handleDpaToggle}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none ${vendor.dpaSigned ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`}
              role="switch"
              aria-checked={vendor.dpaSigned}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${vendor.dpaSigned ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      <Button
        className="w-full"
        disabled={completing}
        onClick={async () => {
          setCompleting(true);
          try { await onCompleteAssessment(); } finally { setCompleting(false); }
        }}
      >
        {completing ? 'Completing...' : 'Mark Assessment Complete'}
      </Button>
    </div>
  );
}

function RiskContextTab({ vendor, onUpdate }: { vendor: VendorRecord; onUpdate: (patch: Partial<VendorRecord>) => Promise<void> }) {
  const [criticality, setCriticality] = useState(vendor.businessCriticality);
  const [dataClass, setDataClass] = useState(vendor.dataClass);
  const [subprocessors, setSubprocessors] = useState(String(vendor.subprocessors));
  const [contractEnd, setContractEnd] = useState(
    vendor.contractEndDate ? vendor.contractEndDate.slice(0, 10) : '',
  );
  const [saving, setSaving] = useState(false);

  // Sync when vendor reloads after save
  useEffect(() => {
    setCriticality(vendor.businessCriticality);
    setDataClass(vendor.dataClass);
    setSubprocessors(String(vendor.subprocessors));
    setContractEnd(vendor.contractEndDate ? vendor.contractEndDate.slice(0, 10) : '');
  }, [vendor.businessCriticality, vendor.dataClass, vendor.subprocessors, vendor.contractEndDate]);

  async function handleSave() {
    setSaving(true);
    try {
      await onUpdate({
        businessCriticality: criticality,
        dataClass,
        subprocessors: parseInt(subprocessors, 10) || 0,
        contractEndDate: contractEnd ? new Date(contractEnd).toISOString() : null,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-sm">Classification</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Business Criticality</label>
            <select
              value={criticality}
              onChange={(e) => setCriticality(e.target.value as any)}
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
            >
              <option value="Mission-critical">Mission-critical</option>
              <option value="Business-important">Business-important</option>
              <option value="Operational">Operational</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Data Classification</label>
            <select
              value={dataClass}
              onChange={(e) => setDataClass(e.target.value as any)}
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
            >
              <option value="PII">PII</option>
              <option value="Sensitive">Sensitive</option>
              <option value="Internal">Internal</option>
              <option value="Public">Public</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Sub-processors</label>
            <Input
              type="number"
              min="0"
              value={subprocessors}
              onChange={(e) => setSubprocessors(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Contract End Date</label>
            <Input
              type="date"
              value={contractEnd}
              onChange={(e) => setContractEnd(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Inherent Risk
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground">{getRiskSummary(criticality, dataClass)}</p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export function VendorDetailPage() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: vendor, isLoading } = useQuery({
    queryKey: ['vendors', vendorId],
    queryFn: () => vendorsService.get(vendorId!),
    enabled: !!vendorId,
  });

  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (vendor) setNotes(vendor.notes ?? '');
  }, [vendor]);

  async function handleUpdate(patch: Partial<VendorRecord>) {
    if (!vendor) return;
    await vendorsService.update(vendor.id, patch);
    await qc.invalidateQueries({ queryKey: ['vendors', vendorId] });
    await qc.invalidateQueries({ queryKey: QK.vendors() });
  }

  async function handleCompleteAssessment() {
    if (!vendor) return;
    await vendorsService.completeAssessment(vendor.id);
    await qc.invalidateQueries({ queryKey: ['vendors', vendorId] });
    await qc.invalidateQueries({ queryKey: QK.vendors() });
  }

  if (isLoading) {
    return (
      <PageTemplate title="Loading..." description="">
        <div className="py-20 text-center text-muted-foreground">Loading vendor details...</div>
      </PageTemplate>
    );
  }

  if (!vendor) {
    return (
      <PageTemplate title="Not found" description="">
        <div className="py-20 text-center text-muted-foreground">Vendor not found.</div>
        <div className="mt-4 text-center">
          <Button variant="outline" onClick={() => navigate('/vendors')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vendors
          </Button>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title={vendor.name}
      description={[vendor.category, `Owner: ${vendor.owner}`, vendor.website].filter(Boolean).join(' · ')}
      actions={
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={tierMeta[vendor.tier].className}>
            {tierMeta[vendor.tier].label}
          </Badge>
          <Badge variant="outline" className={statusMeta[vendor.status].className}>
            {statusMeta[vendor.status].label}
          </Badge>
        </div>
      }
    >
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/vendors')} className="-ml-2">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Vendors
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assessment">Assessment</TabsTrigger>
          <TabsTrigger value="risk">Risk Context</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview">
          <div className="space-y-4">
            {/* Score + stat row */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Security Score</p>
                  <p className={`mt-2 text-4xl font-extrabold ${scoreColor(vendor.securityScore)}`}>
                    {vendor.securityScore}
                  </p>
                  <p className="text-xs text-muted-foreground">/ 100</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Open Findings</p>
                  <p className="mt-2 text-4xl font-extrabold text-foreground">{vendor.openFindings}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Questionnaire</p>
                  <p className="mt-2 text-4xl font-extrabold text-foreground">{vendor.questionnaireCompletion}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sub-processors</p>
                  <p className="mt-2 text-4xl font-extrabold text-foreground">{vendor.subprocessors}</p>
                </CardContent>
              </Card>
            </div>

            {/* Date row */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Last Assessment</p>
                  <p className="mt-1 font-medium">{fmtDate(vendor.lastAssessmentAt)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Next Assessment</p>
                  <p className="mt-1 font-medium">{fmtDate(vendor.nextAssessmentAt)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Contract End</p>
                  <p className="mt-1 font-medium">{fmtDate(vendor.contractEndDate)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Status workflow */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Lifecycle Actions</CardTitle></CardHeader>
              <CardContent>
                <StatusWorkflow
                  vendor={vendor}
                  onUpdate={handleUpdate}
                  onCompleteAssessment={handleCompleteAssessment}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Assessment ── */}
        <TabsContent value="assessment">
          <AssessmentTab
            vendor={vendor}
            onUpdate={handleUpdate}
            onCompleteAssessment={handleCompleteAssessment}
          />
        </TabsContent>

        {/* ── Risk Context ── */}
        <TabsContent value="risk">
          <RiskContextTab vendor={vendor} onUpdate={handleUpdate} />
        </TabsContent>

        {/* ── Notes ── */}
        <TabsContent value="notes">
          <Card>
            <CardContent className="pt-6">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={10}
                className="w-full resize-none rounded-md border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Add notes about this vendor, assessment findings, or decisions..."
              />
              <div className="mt-3 flex justify-end">
                <Button
                  disabled={savingNotes}
                  onClick={async () => {
                    setSavingNotes(true);
                    try { await handleUpdate({ notes }); } finally { setSavingNotes(false); }
                  }}
                >
                  {savingNotes ? 'Saving...' : 'Save notes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageTemplate>
  );
}
