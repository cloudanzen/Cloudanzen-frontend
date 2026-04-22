import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { usersService } from '@/services/api/users';

type PublishMode = 'publish_only' | 'all' | 'specific';

export function PublishPolicyDialog({
  open,
  nextVersion,
  onClose,
  onSubmit,
}: {
  open: boolean;
  nextVersion: number;
  onClose: () => void;
  onSubmit: (data: {
    changelog?: string;
    sendForAcceptance?: boolean;
    acceptanceUserIds?: string[];
  }) => Promise<void>;
}) {
  const [changelog, setChangelog] = useState('');
  const [mode, setMode] = useState<PublishMode>('publish_only');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { data: users = [] } = useQuery({
    queryKey: ['users', 'list'],
    queryFn: () => usersService.listUsers(),
    enabled: open,
  });

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({
        changelog: changelog.trim() || undefined,
        sendForAcceptance: mode !== 'publish_only',
        acceptanceUserIds: mode === 'specific' ? selectedUserIds : undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publish Policy</DialogTitle>
          <DialogDescription>
            Publish this policy version and optionally request personnel acceptance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Changelog</label>
            <textarea
              value={changelog}
              onChange={(event) => setChangelog(event.target.value)}
              placeholder="Describe what changed in this version..."
              className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">After publishing</p>
            <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
              <input
                type="radio"
                checked={mode === 'publish_only'}
                onChange={() => setMode('publish_only')}
              />
              <span>Publish only</span>
            </label>
            <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
              <input type="radio" checked={mode === 'all'} onChange={() => setMode('all')} />
              <span>Send for acceptance to all personnel</span>
            </label>
            <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
              <input
                type="radio"
                checked={mode === 'specific'}
                onChange={() => setMode('specific')}
              />
              <span>Send for acceptance to specific users</span>
            </label>

            {mode === 'specific' ? (
              <select
                multiple
                value={selectedUserIds}
                onChange={(event) => {
                  const next = Array.from(event.target.selectedOptions).map((option) => option.value);
                  setSelectedUserIds(next);
                }}
                className="min-h-36 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting || (mode === 'specific' && selectedUserIds.length === 0)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Publish v{nextVersion}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
