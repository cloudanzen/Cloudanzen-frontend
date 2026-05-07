import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { policiesService, PolicyComment } from '@/services/api/policies';
import { ApiResponse } from '@/services/api/client';

interface PolicyVersionLite {
  id: string;
  versionNumber: number;
}

export function PolicyCommentsTab({
  policyId,
  versions,
}: {
  policyId: string;
  versions: PolicyVersionLite[];
}) {
  const { t } = useTranslation('compliance');
  const me = useCurrentUser();
  const confirm = useConfirmDialog();
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  const { data, refetch } = useQuery<ApiResponse<PolicyComment[]>>({
    queryKey: ['policy-comments', policyId, selectedVersionId || null],
    queryFn: () => policiesService.listComments(policyId, selectedVersionId || undefined),
  });

  const comments = data?.data ?? [];

  async function handlePost() {
    if (!text.trim()) return;
    setPosting(true);
    try {
      await policiesService.createComment(policyId, {
        body: text.trim(),
        ...(selectedVersionId ? { policyVersionId: selectedVersionId } : {}),
      });
      setText('');
      void refetch();
    } catch {
      toast.error(t('policyDetail.comments.postFailed', { defaultValue: 'Failed to post comment' }));
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(commentId: string) {
    const ok = await confirm({
      title: t('policyDetail.comments.deleteTitle', { defaultValue: 'Delete comment?' }),
      description: t('policyDetail.comments.deleteConfirm', { defaultValue: 'This action cannot be undone.' }),
      confirmLabel: t('policyDetail.comments.delete', { defaultValue: 'Delete' }),
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      await policiesService.deleteComment(policyId, commentId);
      void refetch();
    } catch {
      toast.error(t('policyDetail.comments.deleteFailed', { defaultValue: 'Failed to delete comment' }));
    }
  }

  function initials(name: string | null | undefined, email: string): string {
    if (name) return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
    return email.slice(0, 2).toUpperCase();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-muted-foreground">
          {t('policyDetail.comments.filterByVersion', { defaultValue: 'Filter by version' })}
        </label>
        <select
          value={selectedVersionId}
          onChange={(e) => setSelectedVersionId(e.target.value)}
          className="text-xs border border-border rounded px-2 py-1 bg-background text-foreground"
        >
          <option value="">
            {t('policyDetail.comments.allComments', { defaultValue: 'All comments' })}
          </option>
          {versions.map((v) => (
            <option key={v.id} value={v.id}>
              v{v.versionNumber}
            </option>
          ))}
        </select>
      </div>

      <Card className="p-4 space-y-4 min-h-[200px]">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t('policyDetail.comments.noComments', { defaultValue: 'No comments yet.' })}
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
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
                <p className="text-sm text-foreground whitespace-pre-wrap">{c.body ?? c.text}</p>
                {c.policyVersionId && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Re: v{versions.find((v) => v.id === c.policyVersionId)?.versionNumber ?? '?'}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </Card>

      <div className="flex gap-2">
        <textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('policyDetail.comments.placeholder', { defaultValue: 'Write a comment…' })}
          className="flex-1 text-sm border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        <Button size="sm" disabled={!text.trim() || posting} onClick={handlePost} className="self-end">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
