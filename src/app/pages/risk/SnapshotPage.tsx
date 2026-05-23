import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/app/components/ui/dialog';
import { Switch } from '@/app/components/ui/switch';
import {
  Loader2,
  Download,
  ChevronLeft,
  Camera,
  Share2,
  AlertCircle,
} from 'lucide-react';
import { RiskSnapshotItemsView } from './RiskSnapshotItemsView';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';
import { risksService, RiskSnapshotRecord } from '@/services/api/risks';
import { RiskStatus } from '@/services/api/types';
import { RequirePermission } from '@/app/components/rbac/RequirePermission';
import { PERMISSIONS } from '@/lib/rbac/permissions';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ── Create Snapshot Dialog ─────────────────────────────────────────────────────

// Status set that maps to Vanta's "Include only approved scenarios" toggle.
// Our `RiskStatus` enum is `OPEN | MITIGATED | ACCEPTED | TRANSFERRED`, so
// "decided" = everything except `OPEN`. The UI label is "Decided only"
// because we have no `APPROVED` value in the enum.
const DECIDED_STATUSES: RiskStatus[] = [
  RiskStatus.MITIGATED,
  RiskStatus.ACCEPTED,
  RiskStatus.TRANSFERRED,
];

type CreateScope = 'all' | 'decided';

function CreateSnapshotDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const { t } = useTranslation('risk');
  const [name, setName] = useState('');
  const [scope, setScope] = useState<CreateScope>('all');

  const mutation = useMutation({
    mutationFn: () =>
      risksService.createSnapshot(
        name.trim(),
        scope === 'decided' ? DECIDED_STATUSES : undefined,
      ),
    onSuccess: (res) => {
      if (res.data) {
        toast.success(t('snapshot.createDialog.success'));
        onCreated(res.data.id);
        setName('');
        setScope('all');
      }
    },
    onError: () => toast.error(t('snapshot.createDialog.error')),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setName('');
          setScope('all');
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('snapshot.createDialog.title')}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {t('snapshot.createDialog.description')}
        </p>
        <Input
          placeholder={t('snapshot.createDialog.placeholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && name.trim()) mutation.mutate();
          }}
        />

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground">
            {t('snapshot.createDialog.scopeLabel')}
          </legend>
          <label className="flex cursor-pointer items-start gap-2 rounded-md border border-slate-200 p-3 hover:bg-slate-50">
            <input
              type="radio"
              name="scope"
              value="all"
              checked={scope === 'all'}
              onChange={() => setScope('all')}
              className="mt-1"
            />
            <div className="text-sm">
              <div className="font-medium">
                {t('snapshot.createDialog.scopeAllLabel')}
              </div>
              <div className="text-xs text-muted-foreground">
                {t('snapshot.createDialog.scopeAllDesc')}
              </div>
            </div>
          </label>
          <label className="flex cursor-pointer items-start gap-2 rounded-md border border-slate-200 p-3 hover:bg-slate-50">
            <input
              type="radio"
              name="scope"
              value="decided"
              checked={scope === 'decided'}
              onChange={() => setScope('decided')}
              className="mt-1"
            />
            <div className="text-sm">
              <div className="font-medium">
                {t('snapshot.createDialog.scopeDecidedLabel')}
              </div>
              <div className="text-xs text-muted-foreground">
                {t('snapshot.createDialog.scopeDecidedDesc')}
              </div>
            </div>
          </label>
        </fieldset>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('snapshot.createDialog.cancel')}
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!name.trim() || mutation.isPending}
          >
            {mutation.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            {t('snapshot.createDialog.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Snapshot Detail ────────────────────────────────────────────────────────────

function SnapshotDetail({
  snapshotId,
  onBack,
}: {
  snapshotId: string;
  onBack: () => void;
}) {
  const { t } = useTranslation('risk');
  const qc = useQueryClient();

  const {
    data: snap,
    isLoading,
    isError,
    refetch,
  } = useQuery<RiskSnapshotRecord>({
    queryKey: QK.riskSnapshotDetail(snapshotId),
    queryFn: () =>
      risksService.getSnapshotDetail(snapshotId).then((r) => r.data!),
    staleTime: STALE.RISKS,
  });

  const toggleMutation = useMutation({
    mutationFn: () => risksService.toggleSnapshotShare(snapshotId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.riskSnapshots() });
      qc.invalidateQueries({ queryKey: QK.riskSnapshotDetail(snapshotId) });
    },
    onError: () => toast.error(t('snapshot.detail.sharingError')),
  });

  const exportCsv = useCallback(() => {
    if (!snap?.items) return;
    const headers = [
      'Title',
      'Asset',
      'Impact',
      'Likelihood',
      'Score',
      'Status',
      'Treatments',
    ];
    const rows = snap.items.map((r) =>
      [
        `"${r.title.replace(/"/g, '""')}"`,
        `"${r.assetTitle}"`,
        r.impact,
        r.likelihood,
        r.riskScore,
        r.status,
        `"${r.treatments.map((t) => t.isoReference).join('; ')}"`,
      ].join(','),
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${snap.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [snap]);

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }
  if (isError) {
    return (
      <Card className="flex flex-col items-center gap-4 p-12 text-center">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <div>
          <p className="font-medium">{t('snapshot.detail.errorTitle')}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('snapshot.detail.errorBody')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            <ChevronLeft className="w-4 h-4 mr-1.5" />
            {t('snapshot.detail.backToSnapshots')}
          </Button>
          <Button onClick={() => refetch()}>
            {t('snapshot.detail.retry')}
          </Button>
        </div>
      </Card>
    );
  }
  if (!snap) {
    return (
      <Card className="flex flex-col items-center gap-4 p-12 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground/40" />
        <div>
          <p className="font-medium">{t('snapshot.detail.notFound')}</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-1.5" />
          {t('snapshot.detail.backToSnapshots')}
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Admin chrome: back + share toggle + CSV export */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          {t('snapshot.detail.backToSnapshots')}
        </button>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Share2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {t('snapshot.detail.sharedWithAuditor')}
            </span>
            <RequirePermission
              permission={PERMISSIONS.SNAPSHOTS_SHARE_WITH_AUDITOR}
              fallback={
                <span className="text-sm font-medium">
                  {snap.sharedWithAuditor
                    ? t('snapshot.detail.sharedYes')
                    : t('snapshot.detail.sharedNo')}
                </span>
              }
            >
              <Switch
                checked={snap.sharedWithAuditor}
                onCheckedChange={() => toggleMutation.mutate()}
                disabled={toggleMutation.isPending}
              />
            </RequirePermission>
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="w-4 h-4 mr-1.5" />
            {t('snapshot.detail.exportCsv')}
          </Button>
        </div>
      </div>

      <RiskSnapshotItemsView snap={snap} />
    </div>
  );
}

// ── Snapshot List ──────────────────────────────────────────────────────────────

function SnapshotList({ onSelect }: { onSelect: (id: string) => void }) {
  const { t } = useTranslation('risk');
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: snapshots = [], isLoading } = useQuery<RiskSnapshotRecord[]>({
    queryKey: QK.riskSnapshots(),
    queryFn: () => risksService.listSnapshots().then((r) => r.data ?? []),
    staleTime: STALE.RISKS,
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => risksService.toggleSnapshotShare(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.riskSnapshots() }),
    onError: () => toast.error(t('snapshot.detail.sharingError')),
  });

  return (
    <>
      <CreateSnapshotDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={(id) => {
          qc.invalidateQueries({ queryKey: QK.riskSnapshots() });
          onSelect(id);
        }}
      />

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : snapshots.length === 0 ? (
        <Card className="flex flex-col items-center gap-4 p-12 text-center">
          <Camera className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <p className="font-medium">{t('snapshot.list.noSnapshots')}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('snapshot.list.noSnapshotsDesc')}
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Camera className="w-4 h-4 mr-2" />
            {t('snapshot.list.createFirst')}
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                <th className="px-4 py-2 text-left font-medium">
                  {t('snapshot.list.columns.name')}
                </th>
                <th className="px-4 py-2 text-left font-medium">
                  {t('snapshot.list.columns.created')}
                </th>
                <th className="px-4 py-2 text-right font-medium">
                  {t('snapshot.list.columns.risks')}
                </th>
                <th className="px-4 py-2 text-center font-medium">
                  {t('snapshot.list.columns.shared')}
                </th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {snapshots.map((s) => (
                <tr
                  key={s.id}
                  className="border-b last:border-0 hover:bg-muted/20"
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onSelect(s.id)}
                      className="font-medium hover:underline text-left"
                    >
                      {s.name}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {fmt(s.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {s.riskCount}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <RequirePermission
                      permission={PERMISSIONS.SNAPSHOTS_SHARE_WITH_AUDITOR}
                      fallback={
                        <span className="text-xs text-muted-foreground">
                          {s.sharedWithAuditor
                            ? t('snapshot.detail.sharedYes')
                            : t('snapshot.detail.sharedNo')}
                        </span>
                      }
                    >
                      <Switch
                        checked={s.sharedWithAuditor}
                        onCheckedChange={() => toggleMutation.mutate(s.id)}
                        disabled={toggleMutation.isPending}
                      />
                    </RequirePermission>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelect(s.id)}
                    >
                      {t('snapshot.list.view')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function SnapshotPage() {
  const { t } = useTranslation('risk');
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <PageTemplate
      title={t('snapshot.title')}
      description={t('snapshot.description')}
      actions={
        selectedId ? undefined : (
          <Button onClick={() => setDialogOpen(true)}>
            <Camera className="w-4 h-4 mr-2" />
            {t('snapshot.createSnapshot')}
          </Button>
        )
      }
    >
      <CreateSnapshotDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={(id) => {
          qc.invalidateQueries({ queryKey: QK.riskSnapshots() });
          setSelectedId(id);
        }}
      />

      {selectedId ? (
        <SnapshotDetail
          snapshotId={selectedId}
          onBack={() => setSelectedId(null)}
        />
      ) : (
        <SnapshotList onSelect={setSelectedId} />
      )}
    </PageTemplate>
  );
}
