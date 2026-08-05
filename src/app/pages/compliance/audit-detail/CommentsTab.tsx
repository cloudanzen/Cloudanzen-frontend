/**
 * audit-detail/CommentsTab.tsx — split out of the original 2,267-line
 * AuditDetailPage.tsx in Phase 4. Component body is unchanged.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Send, Trash2 } from 'lucide-react';
import {
  auditsService,
  AuditControlRecord,
  AuditComment,
} from '@/services/api/audits';
import { useCanAudit, useCurrentUser } from '@/hooks/useCurrentUser';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';

export function CommentsTab({
  auditId,
  controls,
}: {
  auditId: string;
  controls: AuditControlRecord[];
}) {
  const { t } = useTranslation('compliance');
  const me = useCurrentUser();
  const canAudit = useCanAudit();
  const confirm = useConfirmDialog();
  const [selectedControlId, setSelectedControlId] = useState<string>('');
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  const { data, refetch } = useQuery<{
    success: boolean;
    data: AuditComment[];
  }>({
    queryKey: ['audit-comments', auditId, selectedControlId || null],
    queryFn: () =>
      auditsService.listComments(
        auditId,
        selectedControlId ? { controlId: selectedControlId } : undefined,
      ),
  });

  const comments = data?.data ?? [];

  async function handlePost() {
    if (!text.trim()) return;
    setPosting(true);
    try {
      await auditsService.postComment(auditId, {
        text: text.trim(),
        controlId: selectedControlId || null,
      });
      setText('');
      refetch();
    } catch {
      toast.error(t('auditDetail.comments.postFailed'));
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(commentId: string) {
    const ok = await confirm({
      title: t('auditDetail.comments.deleteComment'),
      description: t('auditDetail.comments.deleteConfirm'),
      confirmLabel: t('auditDetail.comments.delete'),
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      await auditsService.deleteComment(auditId, commentId);
      refetch();
    } catch {
      toast.error(t('auditDetail.comments.deleteFailed'));
    }
  }

  function initials(name: string | null | undefined, email: string): string {
    if (name)
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    return email.slice(0, 2).toUpperCase();
  }

  return (
    <div className="space-y-4">
      {/* Control filter */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-muted-foreground">
          {t('auditDetail.comments.filterByControl')}
        </label>
        <select
          value={selectedControlId}
          onChange={(e) => setSelectedControlId(e.target.value)}
          className="text-xs border border-border rounded px-2 py-1 bg-background text-foreground"
        >
          <option value="">{t('auditDetail.comments.allComments')}</option>
          {controls.map((c) => (
            <option key={c.control.id} value={c.control.id}>
              {c.control.isoReference} — {c.control.title.slice(0, 40)}
            </option>
          ))}
        </select>
      </div>

      {/* Comment list */}
      <Card className="p-4 space-y-4 min-h-[200px]">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t('auditDetail.comments.noComments')}
          </p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                {initials(c.author?.name, c.author?.email ?? '')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-foreground">
                    {c.author?.name ?? c.author?.email}
                  </span>
                  {c.author?.role === 'AUDITOR' && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 font-medium">
                      {t('auditDetail.comments.auditor')}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  {me?.id === c.authorId && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="ml-auto text-muted-foreground/40 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-foreground">{c.text}</p>
                {c.controlId && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Re:{' '}
                    {controls.find((ctrl) => ctrl.control.id === c.controlId)
                      ?.control.isoReference ?? c.controlId}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </Card>

      {/* Post box */}
      {canAudit && (
        <div className="flex gap-2">
          <textarea
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('auditDetail.comments.placeholder')}
            className="flex-1 text-sm border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <Button
            size="sm"
            disabled={!text.trim() || posting}
            onClick={handlePost}
            className="self-end"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Report Tab ────────────────────────────────────────────────────────────────
