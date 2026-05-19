import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import {
  auditsService,
  type AuditRequestRecord,
  type LinkableEvidenceResponse,
} from '@/services/api/audits';
import { Upload } from 'lucide-react';

interface Props {
  auditId: string;
  requestId: string;
  request: AuditRequestRecord;
  /** True when the viewer is EXTERNAL_AUDITOR or assigned contributor — gates
   *  the empty-state copy that nudges them to upload-new or ask an internal
   *  auditor to pre-link. */
  isExternalScope: boolean;
  onClose: () => void;
  onAttached: () => void;
}

export function AuditRequestAttachModal({
  auditId,
  requestId,
  request,
  isExternalScope,
  onClose,
  onAttached,
}: Props) {
  const { t } = useTranslation('compliance');
  const qc = useQueryClient();
  const [tab, setTab] = useState<'pick' | 'upload'>('pick');
  const [search, setSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const linkableQuery = useQuery<LinkableEvidenceResponse>({
    queryKey: ['linkable-evidence', auditId, requestId, search],
    queryFn: () =>
      auditsService.listLinkableRequestEvidence(auditId, requestId, {
        search: search || undefined,
        limit: 50,
      }),
    enabled: tab === 'pick',
  });

  const linkMut = useMutation({
    mutationFn: (evidenceId: string) =>
      auditsService.linkRequestEvidence(auditId, requestId, {
        evidenceId,
        action: 'link',
      }),
    onSuccess: () => {
      toast.success(t('auditRequestAttach.toasts.linked'));
      void qc.invalidateQueries({
        queryKey: ['audit-request', auditId, requestId],
      });
      onAttached();
    },
    onError: (err) => {
      toast.error(
        (err as Error)?.message ?? t('auditRequestAttach.toasts.linkFailed'),
      );
    },
  });

  const uploadMut = useMutation({
    mutationFn: (file: File) =>
      auditsService.uploadRequestEvidence(auditId, requestId, file),
    onSuccess: () => {
      toast.success(t('auditRequestAttach.toasts.uploaded'));
      setSelectedFile(null);
      onAttached();
    },
    onError: (err) => {
      toast.error(
        (err as Error)?.message ?? t('auditRequestAttach.toasts.uploadFailed'),
      );
    },
  });

  const items = linkableQuery.data?.data ?? [];
  const showRestrictedEmpty =
    tab === 'pick' &&
    !linkableQuery.isLoading &&
    items.length === 0 &&
    isExternalScope;
  const showGenericEmpty =
    tab === 'pick' &&
    !linkableQuery.isLoading &&
    items.length === 0 &&
    !isExternalScope;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('auditRequestAttach.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex border-b border-border">
            <button
              type="button"
              onClick={() => setTab('pick')}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
                tab === 'pick'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-muted-foreground'
              }`}
            >
              {t('auditRequestAttach.tabs.pick')}
            </button>
            <button
              type="button"
              onClick={() => setTab('upload')}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
                tab === 'upload'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-muted-foreground'
              }`}
            >
              {t('auditRequestAttach.tabs.upload')}
            </button>
          </div>

          {tab === 'pick' && (
            <>
              <Input
                placeholder={t('auditRequestAttach.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="max-h-96 overflow-y-auto rounded-md border border-border">
                {linkableQuery.isLoading && (
                  <p className="p-4 text-center text-sm text-muted-foreground">
                    {t('auditRequestAttach.loading')}
                  </p>
                )}
                {showRestrictedEmpty && (
                  <p className="p-6 text-center text-sm text-muted-foreground">
                    {request.controlId
                      ? t('auditRequestAttach.empty.restrictedPerControl')
                      : t('auditRequestAttach.empty.restrictedAuditLevel')}
                  </p>
                )}
                {showGenericEmpty && (
                  <p className="p-6 text-center text-sm text-muted-foreground">
                    {t('auditRequestAttach.empty.generic')}
                  </p>
                )}
                {items.length > 0 && (
                  <ul className="divide-y divide-border">
                    {items.map((evidence) => (
                      <li
                        key={evidence.id}
                        className="flex items-start justify-between gap-3 p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {evidence.fileName ?? evidence.type}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {new Date(evidence.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => linkMut.mutate(evidence.id)}
                          disabled={linkMut.isPending}
                        >
                          {t('auditRequestAttach.link')}
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}

          {tab === 'upload' && (
            <div className="space-y-3">
              {request.evidenceTypeRequested && (
                <p className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700">
                  {t('auditRequestAttach.hintAskedFor', {
                    type: request.evidenceTypeRequested.replaceAll('_', ' '),
                  })}
                </p>
              )}
              <label className="block">
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm"
                />
              </label>
              {selectedFile && (
                <p className="text-xs text-muted-foreground">
                  {selectedFile.name}
                </p>
              )}
              <div className="flex justify-end">
                <Button
                  onClick={() => selectedFile && uploadMut.mutate(selectedFile)}
                  disabled={!selectedFile || uploadMut.isPending}
                >
                  <Upload className="mr-1 h-4 w-4" />
                  {uploadMut.isPending
                    ? t('auditRequestAttach.uploading')
                    : t('auditRequestAttach.uploadButton')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
