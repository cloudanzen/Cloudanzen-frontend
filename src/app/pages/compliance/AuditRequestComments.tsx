import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { auditsService, type AuditComment } from '@/services/api/audits';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface Props {
  auditId: string;
  requestId: string;
}

function fmtRelative(when: string) {
  const date = new Date(when);
  return date.toLocaleString();
}

export function AuditRequestComments({ auditId, requestId }: Props) {
  const { t } = useTranslation('compliance');
  const qc = useQueryClient();
  const currentUser = useCurrentUser();
  const [text, setText] = useState('');

  const commentsQuery = useQuery<{ success: boolean; data: AuditComment[] }>({
    queryKey: ['audit-request-comments', auditId, requestId],
    queryFn: () =>
      auditsService.listComments(auditId, { auditRequestId: requestId }),
  });

  const postMut = useMutation({
    mutationFn: (body: string) =>
      auditsService.postComment(auditId, {
        text: body,
        auditRequestId: requestId,
      }),
    onSuccess: () => {
      setText('');
      void qc.invalidateQueries({
        queryKey: ['audit-request-comments', auditId, requestId],
      });
    },
    onError: (err) => {
      toast.error(
        (err as Error)?.message ?? t('auditRequestComments.toasts.postFailed'),
      );
    },
  });

  const deleteMut = useMutation({
    mutationFn: (commentId: string) =>
      auditsService.deleteComment(auditId, commentId),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ['audit-request-comments', auditId, requestId],
      });
    },
    onError: (err) => {
      toast.error(
        (err as Error)?.message ??
          t('auditRequestComments.toasts.deleteFailed'),
      );
    },
  });

  const comments = commentsQuery.data?.data ?? [];

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border p-4">
        <h2 className="text-sm font-semibold text-foreground">
          {t('auditRequestComments.title')}
        </h2>
      </div>
      <div className="divide-y divide-border">
        {comments.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            {t('auditRequestComments.empty')}
          </p>
        ) : (
          comments.map((comment) => {
            const isOwn = currentUser?.id === comment.authorId;
            const withinWindow =
              Date.now() - new Date(comment.createdAt).getTime() <=
              15 * 60 * 1000;
            return (
              <div key={comment.id} className="space-y-1 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">
                    {comment.author.name ?? comment.author.email}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {fmtRelative(comment.createdAt)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-foreground">
                  {comment.text}
                </p>
                {isOwn && withinWindow && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMut.mutate(comment.id)}
                    disabled={deleteMut.isPending}
                  >
                    {t('auditRequestComments.delete')}
                  </Button>
                )}
              </div>
            );
          })
        )}
      </div>
      <div className="space-y-2 border-t border-border p-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('auditRequestComments.placeholder')}
          rows={3}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          maxLength={4000}
        />
        <div className="flex justify-end">
          <Button
            onClick={() => text.trim() && postMut.mutate(text.trim())}
            disabled={!text.trim() || postMut.isPending}
          >
            {postMut.isPending
              ? t('auditRequestComments.posting')
              : t('auditRequestComments.post')}
          </Button>
        </div>
      </div>
    </Card>
  );
}
