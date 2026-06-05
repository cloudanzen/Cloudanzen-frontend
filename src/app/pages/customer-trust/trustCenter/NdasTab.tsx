import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, FileCheck, Star } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { trustCenterService, type TrustNda } from '@/services/api/trustCenter';

export function NdasTab() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['trust-ndas'],
    queryFn: () => trustCenterService.listNdas(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => trustCenterService.deleteNda(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trust-ndas'] }),
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) =>
      trustCenterService.updateNda(id, { isDefault: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trust-ndas'] }),
  });

  const ndas = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-base font-semibold text-foreground">NDA texts</h3>
          <p className="text-sm text-muted-foreground">
            Clickwrap NDA shown when a viewer requests access to a REQUESTABLE
            document. One default per organization.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> New NDA
        </Button>
      </div>

      {creating && (
        <NdaEditor
          onCancel={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            qc.invalidateQueries({ queryKey: ['trust-ndas'] });
          }}
        />
      )}

      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading NDAs…</p>
      )}

      <div className="space-y-2">
        {ndas.map((nda) => (
          <NdaRow
            key={nda.id}
            nda={nda}
            onDelete={() => deleteMutation.mutate(nda.id)}
            onSetDefault={() => setDefaultMutation.mutate(nda.id)}
          />
        ))}
        {!isLoading && ndas.length === 0 && !creating && (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-muted-foreground">
            No NDAs yet. Create one to enable clickwrap signing on access
            requests.
          </div>
        )}
      </div>
    </div>
  );
}

function NdaRow({
  nda,
  onDelete,
  onSetDefault,
}: {
  nda: TrustNda;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <FileCheck className="w-5 h-5 text-slate-400" />
          <div>
            <p className="font-medium text-foreground flex items-center gap-2">
              {nda.name}
              {nda.isDefault && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                  <Star className="w-3 h-3" /> Default
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              v{nda.version} · updated{' '}
              {new Date(nda.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!nda.isDefault && (
            <Button variant="outline" size="sm" onClick={onSetDefault}>
              Set default
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Hide' : 'View'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm(`Delete NDA "${nda.name}"?`)) onDelete();
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {expanded && (
        <pre className="whitespace-pre-wrap border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-700">
          {nda.content}
        </pre>
      )}
    </div>
  );
}

function NdaEditor({
  onCancel,
  onSaved,
}: {
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState('Mutual NDA');
  const [content, setContent] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: () =>
      trustCenterService.createNda({ name, content, isDefault }),
    onSuccess: onSaved,
    onError: (err: unknown) =>
      setError(err instanceof Error ? err.message : 'Save failed'),
  });

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-3">
      <h4 className="font-semibold">New NDA</h4>
      <div className="space-y-1.5">
        <Label htmlFor="nda-name">Name</Label>
        <Input
          id="nda-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="nda-content">Content (markdown)</Label>
        <textarea
          id="nda-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          maxLength={50_000}
          className="w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm font-mono focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
          placeholder="## Mutual NDA\n\nThe parties agree that..."
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
        />
        Set as default
      </label>
      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
          {error}
        </div>
      )}
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !name.trim() || !content.trim()}
        >
          {mutation.isPending ? 'Saving…' : 'Save NDA'}
        </Button>
      </div>
    </div>
  );
}
