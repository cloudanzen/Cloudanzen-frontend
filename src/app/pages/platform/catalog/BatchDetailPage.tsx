import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  platformCatalogService,
  type Draft,
  type DraftKind,
  type ChangeKind,
} from '@/services/api/platformCatalog';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/app/components/ui/dialog';
import { ChevronLeft, Plus, Trash2, Rocket } from 'lucide-react';
import { toast } from 'sonner';
import { ApiError } from '@/services/api/client';

const KIND_LABELS: Record<DraftKind, string> = {
  control: 'Control template',
  test: 'Test template',
  policy: 'Policy template',
  mapping: 'Framework mapping',
};

export function BatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showAddDraft, setShowAddDraft] = useState<DraftKind | null>(null);

  const { data: batch, isLoading } = useQuery({
    queryKey: ['platform', 'catalog', 'batches', id],
    queryFn: () => platformCatalogService.getBatch(id!),
    enabled: !!id,
  });

  const publish = useMutation({
    mutationFn: () => platformCatalogService.publishBatch(id!),
    onSuccess: (res) => {
      toast.success(
        `Published as v${res.version.version} · ${res.outboxRows} draft(s) queued for apply`,
      );
      qc.invalidateQueries({ queryKey: ['platform', 'catalog'] });
      navigate('/catalog/versions');
    },
    onError: (err) => {
      if (err instanceof ApiError && err.statusCode === 409) {
        toast.error(
          'Publish conflict — see batch detail for conflicting drafts',
        );
      } else {
        toast.error(err instanceof ApiError ? err.message : 'Publish failed');
      }
      qc.invalidateQueries({
        queryKey: ['platform', 'catalog', 'batches', id],
      });
    },
  });

  const discard = useMutation({
    mutationFn: () =>
      platformCatalogService.patchBatch(id!, { status: 'DISCARDED' }),
    onSuccess: () => {
      toast.success('Batch discarded');
      navigate('/catalog/batches');
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Discard failed');
    },
  });

  if (isLoading || !batch) {
    return <Card className="p-6 bg-white text-sm text-gray-500">Loading…</Card>;
  }

  const allDrafts: Array<{ kind: DraftKind; drafts: Draft[] }> = [
    { kind: 'control', drafts: batch.controlDrafts },
    { kind: 'test', drafts: batch.testDrafts },
    { kind: 'policy', drafts: batch.policyDrafts },
    { kind: 'mapping', drafts: batch.mappingDrafts },
  ];

  const totalDrafts = allDrafts.reduce((n, x) => n + x.drafts.length, 0);

  return (
    <div className="space-y-4">
      <div>
        <Link
          to="/catalog/batches"
          className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1 mb-2"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Back to batches
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {batch.name}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {batch.status} · scope: {batch.scopeTypes.join(', ')} ·{' '}
              {totalDrafts} draft(s)
              {batch.publishedInVersion != null && (
                <> · v{batch.publishedInVersion}</>
              )}
            </p>
          </div>
          {batch.status === 'OPEN' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => discard.mutate()}
                disabled={discard.isPending}
              >
                Discard
              </Button>
              <Button
                onClick={() => publish.mutate()}
                disabled={publish.isPending || totalDrafts === 0}
                className="gap-2"
              >
                <Rocket className="w-4 h-4" />
                {publish.isPending ? 'Publishing…' : 'Publish batch'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {batch.description && (
        <Card className="p-4 bg-white text-sm text-gray-700">
          {batch.description}
        </Card>
      )}

      {batch.conflictReport != null && (
        <Card className="p-4 bg-amber-50 border border-amber-200 text-sm">
          <div className="font-medium text-amber-800 mb-1">
            Last publish attempt had conflicts
          </div>
          <pre className="text-xs text-amber-900 overflow-x-auto">
            {JSON.stringify(batch.conflictReport, null, 2)}
          </pre>
        </Card>
      )}

      {allDrafts.map(({ kind, drafts }) => {
        const inScope = batch.scopeTypes.includes(kind);
        if (!inScope && drafts.length === 0) return null;
        return (
          <Card key={kind} className="bg-white">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="font-medium text-gray-900">
                {KIND_LABELS[kind]} ({drafts.length})
              </h2>
              {batch.status === 'OPEN' && inScope && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => setShowAddDraft(kind)}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add draft
                </Button>
              )}
            </div>
            {drafts.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No drafts yet.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {drafts.map((d) => (
                  <DraftRow
                    key={d.id}
                    batchId={batch.id}
                    kind={kind}
                    draft={d}
                    canMutate={batch.status === 'OPEN'}
                  />
                ))}
              </ul>
            )}
          </Card>
        );
      })}

      {showAddDraft && (
        <AddDraftDialog
          open={true}
          batchId={batch.id}
          kind={showAddDraft}
          onClose={() => setShowAddDraft(null)}
          onCreated={() => {
            qc.invalidateQueries({
              queryKey: ['platform', 'catalog', 'batches', id],
            });
            setShowAddDraft(null);
          }}
        />
      )}
    </div>
  );
}

function DraftRow({
  batchId,
  kind,
  draft,
  canMutate,
}: {
  batchId: string;
  kind: DraftKind;
  draft: Draft;
  canMutate: boolean;
}) {
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: () =>
      platformCatalogService.deleteDraft(batchId, kind, draft.id),
    onSuccess: () => {
      toast.success('Draft removed');
      qc.invalidateQueries({
        queryKey: ['platform', 'catalog', 'batches', batchId],
      });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Delete failed');
    },
  });

  const targetId =
    draft.controlTemplateId ??
    draft.testTemplateId ??
    draft.policyTemplateId ??
    null;
  const proposal = draft.proposalJson ?? {};
  const title =
    (proposal as { title?: string; slug?: string; catalogKey?: string })
      .title ??
    (proposal as { slug?: string }).slug ??
    (proposal as { catalogKey?: string }).catalogKey ??
    '(no title)';

  return (
    <li className="p-3 flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
            {draft.changeKind}
          </span>
          <span className="font-medium text-gray-900 truncate">{title}</span>
          {targetId && (
            <span className="text-xs text-gray-500 font-mono">
              → {targetId.slice(0, 12)}
            </span>
          )}
        </div>
        <details className="text-xs">
          <summary className="text-blue-600 cursor-pointer hover:underline">
            View proposal JSON
          </summary>
          <pre className="mt-1 bg-gray-50 p-2 rounded overflow-x-auto text-gray-700">
            {JSON.stringify(proposal, null, 2)}
          </pre>
        </details>
      </div>
      {canMutate && (
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:bg-red-50"
          onClick={() => del.mutate()}
          disabled={del.isPending}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </li>
  );
}

function AddDraftDialog({
  open,
  batchId,
  kind,
  onClose,
  onCreated,
}: {
  open: boolean;
  batchId: string;
  kind: DraftKind;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [changeKind, setChangeKind] = useState<ChangeKind>('CREATE');
  const [targetId, setTargetId] = useState('');
  const [proposalJson, setProposalJson] = useState('{\n  \n}');
  const [parseError, setParseError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () => {
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(proposalJson);
      } catch (e) {
        throw new Error(`Invalid JSON: ${(e as Error).message}`);
      }
      return platformCatalogService.createDraft(batchId, kind, {
        proposalJson: parsed,
        changeKind,
        templateId: targetId || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Draft added');
      onCreated();
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError ? err.message : (err as Error).message,
      );
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add {KIND_LABELS[kind]} draft</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Change kind
            </label>
            <div className="flex gap-2">
              {(['CREATE', 'UPDATE', 'RETIRE'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setChangeKind(k)}
                  className={`px-3 py-1 text-sm rounded border ${
                    changeKind === k
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-200'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
          {changeKind !== 'CREATE' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target live template id (required for UPDATE/RETIRE)
              </label>
              <Input
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder="UUID of the live row in framework_pool"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proposal JSON
            </label>
            <Textarea
              value={proposalJson}
              onChange={(e) => {
                setProposalJson(e.target.value);
                try {
                  JSON.parse(e.target.value);
                  setParseError(null);
                } catch (err) {
                  setParseError((err as Error).message);
                }
              }}
              rows={12}
              className="font-mono text-xs"
            />
            {parseError && (
              <p className="text-xs text-red-600 mt-1">{parseError}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => create.mutate()}
            disabled={
              create.isPending ||
              !!parseError ||
              (changeKind !== 'CREATE' && !targetId)
            }
          >
            {create.isPending ? 'Adding…' : 'Add draft'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
