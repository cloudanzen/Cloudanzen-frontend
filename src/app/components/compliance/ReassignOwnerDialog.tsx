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

export function ReassignOwnerDialog({
  open,
  currentOwnerId,
  onClose,
  onSubmit,
}: {
  open: boolean;
  currentOwnerId: string | null;
  onClose: () => void;
  onSubmit: (ownerId: string | null) => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState<string>(currentOwnerId ?? '');
  const [submitting, setSubmitting] = useState(false);

  const { data: users = [] } = useQuery({
    queryKey: ['users', 'list'],
    queryFn: () => usersService.listUsers(),
    enabled: open,
  });

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(selectedId || null);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reassign owner</DialogTitle>
          <DialogDescription>
            Pick a new owner for this policy. The current owner will retain edit access via their role.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Owner</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">— Unassigned —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name ?? u.email} ({u.email})
              </option>
            ))}
          </select>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
