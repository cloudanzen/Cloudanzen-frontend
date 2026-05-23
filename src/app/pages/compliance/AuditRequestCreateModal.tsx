import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import {
  AUDIT_REQUEST_EVIDENCE_TYPES,
  auditsService,
  type AuditRequestEvidenceType,
} from '@/services/api/audits';
import type { AuditorIdentity } from '@/lib/audits';

interface Props {
  auditId: string;
  controls: Array<{
    control: { id: string; isoReference: string; title: string };
  }>;
  users: AuditorIdentity[];
  onClose: () => void;
  onCreated: (createdId: string) => void;
}

export function AuditRequestCreateModal({
  auditId,
  controls,
  users,
  onClose,
  onCreated,
}: Props) {
  const { t } = useTranslation('compliance');
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    description: '',
    evidenceTypeRequested: '' as AuditRequestEvidenceType | '',
    controlId: '',
    assignedTo: '',
    dueDate: '',
  });

  const createMut = useMutation({
    mutationFn: () =>
      auditsService.createRequest(auditId, {
        title: form.title.trim(),
        description: form.description || null,
        evidenceTypeRequested: form.evidenceTypeRequested || null,
        controlId: form.controlId || null,
        assignedTo: form.assignedTo || null,
        dueDate: form.dueDate || null,
      }),
    onSuccess: (res) => {
      const id = res?.data?.id ?? '';
      toast.success(
        form.assignedTo
          ? t('auditDetail.requests.createdAssigned')
          : t('auditDetail.requests.created'),
      );
      void qc.invalidateQueries({ queryKey: ['audit-requests', auditId] });
      void qc.invalidateQueries({
        queryKey: ['audit-evidence-summary', auditId],
      });
      onCreated(id);
    },
    onError: () => {
      toast.error(t('auditDetail.requests.createFailed'));
    },
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('auditRequestCreate.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">
              {t('auditRequestCreate.fields.title')}
            </label>
            <input
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
              placeholder={t('auditDetail.requests.titlePlaceholder')}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">
              {t('auditRequestCreate.fields.description')}
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              rows={3}
              maxLength={4000}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">
                {t('auditRequestCreate.fields.evidenceType')}
              </label>
              <select
                value={form.evidenceTypeRequested}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    evidenceTypeRequested: e.target.value as
                      | AuditRequestEvidenceType
                      | '',
                  }))
                }
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">
                  {t('auditRequestCreate.fields.evidenceTypeNone')}
                </option>
                {AUDIT_REQUEST_EVIDENCE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">
                {t('auditDetail.requests.dueDate')}
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, dueDate: e.target.value }))
                }
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">
                {t('auditRequestCreate.fields.control')}
              </label>
              <select
                value={form.controlId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, controlId: e.target.value }))
                }
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">{t('auditDetail.requests.auditLevel')}</option>
                {controls.map((c) => (
                  <option key={c.control.id} value={c.control.id}>
                    {c.control.isoReference} · {c.control.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">
                {t('auditRequestCreate.fields.assignedTo')}
              </label>
              <select
                value={form.assignedTo}
                onChange={(e) =>
                  setForm((p) => ({ ...p, assignedTo: e.target.value }))
                }
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">{t('auditDetail.requests.unassigned')}</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name ?? user.email}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={createMut.isPending}
            >
              {t('auditRequestCreate.cancel')}
            </Button>
            <Button
              onClick={() => createMut.mutate()}
              disabled={!form.title.trim() || createMut.isPending}
            >
              {createMut.isPending
                ? t('auditDetail.requests.creating')
                : t('auditRequestCreate.submit')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
