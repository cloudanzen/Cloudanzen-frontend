import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';

export function RenewPolicyDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (mode: 'with_updates' | 'without_updates') => Promise<void>;
}) {
  const [mode, setMode] = useState<'with_updates' | 'without_updates'>('with_updates');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(mode);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renew Policy</DialogTitle>
          <DialogDescription>
            Choose whether to renew this policy immediately or send it back to draft for edits.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
            <input
              type="radio"
              checked={mode === 'with_updates'}
              onChange={() => setMode('with_updates')}
            />
            <span>Renew and make updates</span>
          </label>
          <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
            <input
              type="radio"
              checked={mode === 'without_updates'}
              onChange={() => setMode('without_updates')}
            />
            <span>Renew without updates</span>
          </label>
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
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Renew
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
