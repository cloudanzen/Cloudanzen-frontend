import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  platformOpsService,
  type AllowlistEntry,
} from '@/services/api/platformOps';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Trash2, Plus, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ApiError } from '@/services/api/client';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';

export function AllowlistPage() {
  const qc = useQueryClient();
  const confirm = useConfirmDialog();
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['platform', 'allowlist'],
    queryFn: () => platformOpsService.listAllowlist(),
  });

  const add = useMutation({
    mutationFn: () =>
      platformOpsService.addAllowlistEntry({
        email: email.trim(),
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Email added to allowlist');
      setEmail('');
      setNotes('');
      qc.invalidateQueries({ queryKey: ['platform', 'allowlist'] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Add failed');
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => platformOpsService.removeAllowlistEntry(id),
    onSuccess: () => {
      toast.success('Entry removed');
      qc.invalidateQueries({ queryKey: ['platform', 'allowlist'] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Remove failed');
    },
  });

  const onRemoveClick = async (entry: AllowlistEntry) => {
    const ok = await confirm({
      title: `Remove ${entry.email} from allowlist?`,
      description:
        'They will no longer be able to sign in to the platform console. Existing sessions stay active until the JWT expires (max 4h).',
      confirmLabel: 'Remove',
      variant: 'destructive',
    });
    if (ok) remove.mutate(entry.id);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Platform admin allowlist
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Only emails on this list can sign in at platform.cloudanzen.com.
          Adding requires no further action on the user — they sign up via
          platform login flow on first attempt.
        </p>
      </div>

      <Card className="p-4 bg-white">
        <h2 className="font-medium text-gray-900 mb-3">Add entry</h2>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="email@cloudanzen.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={() => add.mutate()}
            disabled={!email.includes('@') || add.isPending}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <Card className="p-6 bg-white text-sm text-gray-500">Loading…</Card>
      ) : isError ? (
        <Card className="p-4 bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Failed to load allowlist.
        </Card>
      ) : !data?.entries.length ? (
        <Card className="p-6 bg-white text-sm text-gray-500">
          No entries yet. The first platform admin was seeded via the
          create-platform-admin CLI; subsequent entries are added here.
        </Card>
      ) : (
        <Card className="bg-white divide-y divide-gray-100">
          {data.entries.map((e) => (
            <div
              key={e.id}
              className="p-3 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {e.email}
                </div>
                <div className="text-xs text-gray-500">
                  added {new Date(e.addedAt).toLocaleString()}
                  {e.notes ? <> · {e.notes}</> : null}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-50"
                onClick={() => onRemoveClick(e)}
                disabled={remove.isPending}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
