import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { accessManagementService } from '@/services/api/access-management';

interface Props {
  onClose: () => void;
}

export function AddCustomServiceDialog({ onClose }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => accessManagementService.createService(name.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-services'] });
      onClose();
    },
    onError: (err: Error) => setError(err.message),
  });

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Custom Service</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Track a tool that isn't integrated. You can upload a CSV of accounts after creating it.
          </p>
          <Input
            placeholder="e.g. Jira, AWS, Okta"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && name.trim()) mutation.mutate();
            }}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending}>
            {mutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
