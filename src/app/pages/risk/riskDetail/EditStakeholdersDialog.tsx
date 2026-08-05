/**
 * riskDetail/EditStakeholdersDialog.tsx — owner / stakeholder editor.
 */

import type { StakeholderDialogProps } from './shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Users } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  riskCenterService,
  type RiskStakeholder,
} from '@/services/api/riskCenter';
import { usersService } from '@/services/api/users';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';

export function EditStakeholdersDialog({
  open,
  onClose,
  stakeholders,
  riskId,
}: StakeholderDialogProps) {
  const { t } = useTranslation('risk');
  const qc = useQueryClient();
  const currentUser = useCurrentUser();
  const [draft, setDraft] = useState<RiskStakeholder[]>(() => [
    ...stakeholders,
  ]);
  const [error, setError] = useState('');

  const { data: usersData } = useQuery({
    queryKey: QK.users(),
    queryFn: async () => {
      return usersService.listUsers();
    },
    staleTime: STALE.USERS,
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: () =>
      riskCenterService.updateStakeholders(
        riskId,
        { stakeholders: draft },
        currentUser?.name ?? currentUser?.email ?? 'Admin',
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.riskDetail(riskId) });
      qc.invalidateQueries({ queryKey: ['risk-register'] });
      qc.invalidateQueries({ queryKey: QK.activityLog() });
      onClose();
    },
    onError: () => setError(t('detail.stakeholders.editDialog.saveFailed')),
  });

  function updateRole(
    index: number,
    field: keyof RiskStakeholder,
    value: string,
  ) {
    setDraft((prev) => {
      const next = [...prev];
      next[index] = { ...next[index]!, [field]: value } as RiskStakeholder;
      return next;
    });
  }

  function selectUser(index: number, userId: string) {
    const user = usersData?.find((u) => u.id === userId);
    if (!user) return;
    setDraft((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index]!,
        name: user.name ?? user.email,
        userId: user.id,
      } as RiskStakeholder;
      return next;
    });
  }

  function addBackupOwner() {
    if (draft.some((s) => s.role === 'Backup owner')) return;
    setDraft((prev) => [...prev, { role: 'Backup owner', name: '', team: '' }]);
  }

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      onClose();
    } else {
      setDraft([...stakeholders]);
      setError('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('detail.stakeholders.editDialog.title')}
          </DialogTitle>
          <DialogDescription>
            {t('detail.stakeholders.editDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {draft.map((person, index) => (
            <div
              key={person.role}
              className="space-y-2 rounded-xl border border-border p-4"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {person.role}
              </p>

              {usersData && usersData.length > 0 ? (
                <select
                  value={person.userId ?? ''}
                  onChange={(e) => selectUser(index, e.target.value)}
                  className="w-full rounded-md border border-border bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">
                    {t('detail.stakeholders.editDialog.selectUser')}
                  </option>
                  {usersData.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name ?? u.email}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={person.name}
                  onChange={(e) => updateRole(index, 'name', e.target.value)}
                  placeholder={t('detail.stakeholders.editDialog.name')}
                  className="w-full rounded-md border border-border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}

              <input
                type="text"
                value={person.team}
                onChange={(e) => updateRole(index, 'team', e.target.value)}
                placeholder={t('detail.stakeholders.editDialog.team')}
                className="w-full rounded-md border border-border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}

          {!draft.some((s) => s.role === 'Backup owner') && (
            <button
              type="button"
              onClick={addBackupOwner}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              {t('detail.stakeholders.editDialog.addBackupOwner')}
            </button>
          )}

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            {t('detail.stakeholders.editDialog.cancel')}
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={
              mutation.isPending || draft.some((s) => !s.name || !s.team)
            }
          >
            {mutation.isPending
              ? t('detail.stakeholders.editDialog.saving')
              : t('detail.stakeholders.editDialog.saveChanges')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Activity dot colour ──────────────────────────────────────────────────────
