import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  platformCatalogService,
  type DraftKind,
  type BatchStatus,
} from '@/services/api/platformCatalog';
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
import { Plus, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { ApiError } from '@/services/api/client';

const SCOPES: DraftKind[] = ['control', 'test', 'policy', 'mapping'];

function StatusBadge({ status }: { status: BatchStatus }) {
  const cls =
    status === 'OPEN'
      ? 'bg-blue-100 text-blue-700'
      : status === 'PUBLISHED'
        ? 'bg-green-100 text-green-700'
        : 'bg-gray-100 text-gray-600';
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded ${cls}`}>
      {status}
    </span>
  );
}

export function BatchesPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<BatchStatus | 'ALL'>('OPEN');
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['platform', 'catalog', 'batches', filter],
    queryFn: () =>
      platformCatalogService.listBatches(filter === 'ALL' ? undefined : filter),
  });

  const refresh = () =>
    qc.invalidateQueries({ queryKey: ['platform', 'catalog', 'batches'] });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">
          Catalog Batches
        </h1>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New batch
        </Button>
      </div>

      <div className="flex gap-2">
        {(['OPEN', 'PUBLISHED', 'DISCARDED', 'ALL'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 text-sm rounded ${
              filter === s
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Card className="p-6 bg-white text-sm text-gray-500">Loading…</Card>
      ) : !data?.batches.length ? (
        <Card className="p-6 bg-white text-sm text-gray-500">
          No batches in this status.
        </Card>
      ) : (
        <Card className="bg-white divide-y divide-gray-100">
          {data.batches.map((b) => (
            <Link
              key={b.id}
              to={`/catalog/batches/${b.id}`}
              className="flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900 truncate">
                    {b.name}
                  </span>
                  <StatusBadge status={b.status} />
                </div>
                <div className="text-xs text-gray-500 flex gap-3">
                  <span>{b.scopeTypes.join(', ')}</span>
                  <span>·</span>
                  <span>
                    created {new Date(b.createdAt).toLocaleDateString()}
                  </span>
                  {b.publishedInVersion != null && (
                    <>
                      <span>·</span>
                      <span>v{b.publishedInVersion}</span>
                    </>
                  )}
                </div>
                {b.description && (
                  <div className="text-xs text-gray-600 mt-1 truncate max-w-2xl">
                    {b.description}
                  </div>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </Link>
          ))}
        </Card>
      )}

      <CreateBatchDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          refresh();
          setShowCreate(false);
        }}
      />
    </div>
  );
}

function CreateBatchDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scopeTypes, setScopeTypes] = useState<DraftKind[]>(['control']);

  const create = useMutation({
    mutationFn: () =>
      platformCatalogService.createBatch({
        name,
        description: description || undefined,
        scopeTypes,
      }),
    onSuccess: () => {
      toast.success('Batch created');
      setName('');
      setDescription('');
      setScopeTypes(['control']);
      onCreated();
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Create failed');
    },
  });

  const toggleScope = (kind: DraftKind) => {
    setScopeTypes((curr) =>
      curr.includes(kind) ? curr.filter((k) => k !== kind) : [...curr, kind],
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New draft batch</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. SOC2 Q2 2026 controls update"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scope (drafts allowed in this batch)
            </label>
            <div className="flex gap-2">
              {SCOPES.map((k) => (
                <label
                  key={k}
                  className={`px-3 py-1 text-sm rounded cursor-pointer border ${
                    scopeTypes.includes(k)
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={scopeTypes.includes(k)}
                    onChange={() => toggleScope(k)}
                  />
                  {k}
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => create.mutate()}
            disabled={!name || scopeTypes.length === 0 || create.isPending}
          >
            {create.isPending ? 'Creating…' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
