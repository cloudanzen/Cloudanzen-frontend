/**
 * audit-detail/AuditorInvitationsDialog.tsx — split out of the original 2,267-line
 * AuditDetailPage.tsx in Phase 4. Component body is unchanged.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Send, Trash2 } from 'lucide-react';
import { auditsService, AuditorInvitationRecord } from '@/services/api/audits';
import { fmt } from '../AuditDetailPanel';

export function AuditorInvitationsDialog({
  auditId,
  open,
  onOpenChange,
}: {
  auditId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation('compliance');
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'LEAD' | 'REVIEWER'>('REVIEWER');
  const [saving, setSaving] = useState(false);

  const { data } = useQuery<{
    success: boolean;
    data: AuditorInvitationRecord[];
  }>({
    queryKey: ['audit-invitations', auditId],
    queryFn: () => auditsService.listInvitations(auditId),
    enabled: open,
  });

  const invitations = data?.data ?? [];

  async function inviteAuditor() {
    if (!email.trim()) return;
    setSaving(true);
    try {
      await auditsService.createInvitation(auditId, {
        email: email.trim(),
        role,
      });
      toast.success(t('auditDetail.invitations.sent'));
      setEmail('');
      setRole('REVIEWER');
      queryClient.invalidateQueries({
        queryKey: ['audit-invitations', auditId],
      });
    } catch {
      toast.error(t('auditDetail.invitations.sendFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function revokeInvitation(invitationId: string) {
    try {
      await auditsService.revokeInvitation(auditId, invitationId);
      toast.success(t('auditDetail.invitations.revoked'));
      queryClient.invalidateQueries({
        queryKey: ['audit-invitations', auditId],
      });
    } catch {
      toast.error(t('auditDetail.invitations.revokeFailed'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('auditDetail.invitations.title')}</DialogTitle>
          <DialogDescription>
            {t('auditDetail.invitations.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-[1fr_140px_auto]">
          <div className="space-y-1.5">
            <Label htmlFor="auditor-email">
              {t('auditDetail.invitations.email')}
            </Label>
            <Input
              id="auditor-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="auditor@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="auditor-role">
              {t('auditDetail.invitations.role')}
            </Label>
            <select
              id="auditor-role"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={role}
              onChange={(event) =>
                setRole(event.target.value as 'LEAD' | 'REVIEWER')
              }
            >
              <option value="REVIEWER">
                {t('auditDetail.invitations.reviewer')}
              </option>
              <option value="LEAD">{t('auditDetail.invitations.lead')}</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={inviteAuditor} disabled={saving || !email.trim()}>
              <Send className="mr-1 h-4 w-4" />
              {saving
                ? t('auditDetail.invitations.sending')
                : t('auditDetail.invitations.send')}
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          {invitations.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              {t('auditDetail.invitations.empty')}
            </p>
          ) : (
            invitations.map((invitation) => {
              const status = invitation.revokedAt
                ? t('auditDetail.invitations.revokedStatus')
                : invitation.acceptedAt
                  ? t('auditDetail.invitations.acceptedStatus')
                  : t('auditDetail.invitations.pendingStatus');
              return (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between gap-3 border-b p-3 last:border-b-0"
                >
                  <div>
                    <p className="text-sm font-medium">{invitation.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {invitation.role} · {status} ·{' '}
                      {t('auditDetail.invitations.expires', {
                        date: fmt(invitation.expiresAt),
                      })}
                    </p>
                  </div>
                  {!invitation.revokedAt && !invitation.acceptedAt && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => revokeInvitation(invitation.id)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      {t('auditDetail.invitations.revoke')}
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('auditDetail.invitations.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
