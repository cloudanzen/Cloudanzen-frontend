import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { accessManagementService } from '@/services/api/access-management';
import { usersService } from '@/services/api/users';

interface Props {
  onClose: () => void;
}

export function CampaignCreateDialog({ onClose }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cadence, setCadence] = useState<string>('none');
  const [deadline, setDeadline] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedReviewerIds, setSelectedReviewerIds] = useState<string[]>([]);

  const { data: services } = useQuery({
    queryKey: ['access-services'],
    queryFn: () => accessManagementService.listServices(),
  });

  const { data: users } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const res = await usersService.listUsers();
      return Array.isArray(res) ? res : [];
    },
  });

  const mutation = useMutation({
    mutationFn: () =>
      accessManagementService.createCampaign({
        name: name.trim(),
        description: description.trim() || undefined,
        scopeServiceIds: selectedServiceIds,
        reviewerUserIds: selectedReviewerIds,
        deadline: deadline || undefined,
        cadence: cadence !== 'none' ? cadence : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-campaigns'] });
      onClose();
    },
  });

  const safeServices = Array.isArray(services) ? services : [];
  const safeUsers = Array.isArray(users) ? users : [];

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const toggleReviewer = (id: string) => {
    setSelectedReviewerIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Access Review Campaign</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Campaign Name</label>
            <Input
              placeholder="e.g. Q1 2026 Access Review"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Description (optional)</label>
            <Input
              placeholder="Purpose of this review..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Scope — services */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Scope (services to review)</label>
            <p className="text-xs text-muted-foreground">Leave empty to include all services.</p>
            <div className="max-h-[120px] overflow-y-auto border rounded p-2 space-y-1">
              {safeServices.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedServiceIds.includes(s.id)}
                    onChange={() => toggleService(s.id)}
                    className="rounded"
                  />
                  {s.serviceName}
                </label>
              ))}
              {safeServices.length === 0 && (
                <span className="text-xs text-muted-foreground">No services found. Sync first.</span>
              )}
            </div>
          </div>

          {/* Reviewers */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Reviewers</label>
            <p className="text-xs text-muted-foreground">Select who will review the accounts.</p>
            <div className="max-h-[120px] overflow-y-auto border rounded p-2 space-y-1">
              {safeUsers.map((u) => (
                <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedReviewerIds.includes(u.id)}
                    onChange={() => toggleReviewer(u.id)}
                    className="rounded"
                  />
                  {u.name ?? u.email}
                </label>
              ))}
            </div>
          </div>

          {/* Deadline */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Deadline (optional)</label>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          {/* Cadence */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Recurring Cadence</label>
            <Select value={cadence} onValueChange={setCadence}>
              <SelectTrigger>
                <SelectValue placeholder="No recurrence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No recurrence</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="semi_annual">Semi-annual</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!name.trim() || selectedReviewerIds.length === 0 || mutation.isPending}
          >
            {mutation.isPending ? 'Creating...' : 'Create Campaign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
