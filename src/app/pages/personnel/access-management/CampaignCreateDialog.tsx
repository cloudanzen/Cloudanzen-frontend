import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('personnel');
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
          <DialogTitle>
            {t('accessManagement.campaignCreate.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-1">
            <label className="text-sm font-medium">
              {t('accessManagement.campaignCreate.name')}
            </label>
            <Input
              placeholder={t('accessManagement.campaignCreate.namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-sm font-medium">
              {t('accessManagement.campaignCreate.description')}
            </label>
            <Input
              placeholder={t(
                'accessManagement.campaignCreate.descriptionPlaceholder',
              )}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Scope — services */}
          <div className="space-y-1">
            <label className="text-sm font-medium">
              {t('accessManagement.campaignCreate.scope')}
            </label>
            <p className="text-xs text-muted-foreground">
              {t('accessManagement.campaignCreate.scopeHint')}
            </p>
            <div className="max-h-[120px] overflow-y-auto border rounded p-2 space-y-1">
              {safeServices.map((s) => (
                <label
                  key={s.id}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
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
                <span className="text-xs text-muted-foreground">
                  {t('accessManagement.campaignCreate.noServices')}
                </span>
              )}
            </div>
          </div>

          {/* Reviewers */}
          <div className="space-y-1">
            <label className="text-sm font-medium">
              {t('accessManagement.campaignCreate.reviewers')}
            </label>
            <p className="text-xs text-muted-foreground">
              {t('accessManagement.campaignCreate.reviewersHint')}
            </p>
            <div className="max-h-[120px] overflow-y-auto border rounded p-2 space-y-1">
              {safeUsers.map((u) => (
                <label
                  key={u.id}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
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
            <label className="text-sm font-medium">
              {t('accessManagement.campaignCreate.deadline')}
            </label>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          {/* Cadence */}
          <div className="space-y-1">
            <label className="text-sm font-medium">
              {t('accessManagement.campaignCreate.cadence')}
            </label>
            <Select value={cadence} onValueChange={setCadence}>
              <SelectTrigger>
                <SelectValue
                  placeholder={t(
                    'accessManagement.campaignCreate.noRecurrence',
                  )}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  {t('accessManagement.campaignCreate.noRecurrence')}
                </SelectItem>
                <SelectItem value="monthly">
                  {t('accessManagement.campaignCreate.cadenceOptions.monthly')}
                </SelectItem>
                <SelectItem value="quarterly">
                  {t(
                    'accessManagement.campaignCreate.cadenceOptions.quarterly',
                  )}
                </SelectItem>
                <SelectItem value="semi_annual">
                  {t(
                    'accessManagement.campaignCreate.cadenceOptions.semiAnnual',
                  )}
                </SelectItem>
                <SelectItem value="annual">
                  {t('accessManagement.campaignCreate.cadenceOptions.annual')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={
              !name.trim() ||
              selectedReviewerIds.length === 0 ||
              mutation.isPending
            }
          >
            {mutation.isPending
              ? t('common.creating')
              : t('accessManagement.campaignCreate.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
