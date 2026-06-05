import { useState } from 'react';
import { TOAST_DURATION_MS } from '@/lib/constants';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Plus,
  ExternalLink,
  Eye,
  EyeOff,
  Lock,
  Trash2,
  Link as LinkIcon,
  Check,
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import {
  trustCenterService,
  TrustDocument,
  type TrustResourceVisibility,
} from '@/services/api/trustCenter';
import { getDocCategoryLabels, fmt } from './helpers';
import { AddDocumentModal } from './AddDocumentModal';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';

// ── Documents Tab ─────────────────────────────────────────────────────────────

export function DocumentsTab() {
  const { t } = useTranslation('common');
  const confirm = useConfirmDialog();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['trust-documents'],
    queryFn: () => trustCenterService.listDocuments(),
  });
  const docs = data?.data ?? [];
  const DOC_CATEGORY_LABELS = getDocCategoryLabels(t);

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }

  async function handleToggleVisibility(doc: TrustDocument) {
    try {
      await trustCenterService.updateDocument(doc.id, {
        publicVisible: !doc.publicVisible,
      });
      qc.invalidateQueries({ queryKey: ['trust-documents'] });
    } catch {
      showToast('error', t('customerTrust.documents.failedToUpdate'));
    }
  }

  async function handleDelete(id: string) {
    const confirmed = await confirm({
      title: t('customerTrust.documents.deleteTitle'),
      description: t('customerTrust.documents.deleteDescription'),
      confirmLabel: t('actions.delete'),
      variant: 'destructive',
    });
    if (!confirmed) return;
    try {
      await trustCenterService.deleteDocument(id);
      qc.invalidateQueries({ queryKey: ['trust-documents'] });
      showToast('success', t('customerTrust.documents.documentDeleted'));
    } catch {
      showToast('error', t('customerTrust.documents.failedToDelete'));
    }
  }

  return (
    <div>
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
        >
          {toast.msg}
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {t('customerTrust.documents.subtitle')}
        </p>
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-1" />
          {t('customerTrust.documents.addDocument')}
        </Button>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">
            {t('customerTrust.documents.loading')}
          </div>
        ) : docs.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-600">
              {t('customerTrust.documents.noDocuments')}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {t('customerTrust.documents.noDocumentsHint')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {[
                    t('customerTrust.documents.columns.name'),
                    t('customerTrust.documents.columns.category'),
                    t('customerTrust.documents.columns.version'),
                    t('customerTrust.documents.columns.visibility'),
                    t('customerTrust.documents.columns.nda'),
                    'State',
                    t('customerTrust.documents.columns.added'),
                    '',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {docs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 flex items-center gap-1"
                      >
                        {doc.name}
                        <ExternalLink className="w-3 h-3 opacity-50" />
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {DOC_CATEGORY_LABELS[doc.category]}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {doc.version ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleVisibility(doc)}
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${doc.publicVisible ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                      >
                        {doc.publicVisible ? (
                          <>
                            <Eye className="w-3 h-3" />
                            {t('customerTrust.documents.public')}
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" />
                            {t('customerTrust.documents.hidden')}
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {doc.requiresNda ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                          <Lock className="w-3 h-3" />
                          {t('customerTrust.documents.ndaRequired')}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <VisibilityChip
                        visibility={doc.visibility ?? null}
                        docId={doc.id}
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {fmt(doc.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {doc.visibility === 'SHAREABLE' && (
                          <ShareLinkButton docId={doc.id} />
                        )}
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showModal && (
        <AddDocumentModal
          onClose={() => setShowModal(false)}
          onSaved={() =>
            qc.invalidateQueries({ queryKey: ['trust-documents'] })
          }
        />
      )}
    </div>
  );
}

// ── Phase B helpers ────────────────────────────────────────────────────────

const VISIBILITY_STYLE: Record<TrustResourceVisibility, string> = {
  PUBLIC: 'bg-emerald-50 text-emerald-700',
  SHAREABLE: 'bg-sky-50 text-sky-700',
  REQUESTABLE: 'bg-amber-50 text-amber-800',
  PRIVATE: 'bg-slate-100 text-slate-600',
};

function VisibilityChip({
  visibility,
  docId,
}: {
  visibility: TrustResourceVisibility | null;
  docId: string;
}) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (v: TrustResourceVisibility) =>
      trustCenterService.setDocumentVisibility(docId, v),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trust-documents'] }),
  });

  const current = visibility ?? 'PRIVATE';
  return (
    <select
      value={current}
      disabled={mutation.isPending}
      onChange={(e) =>
        mutation.mutate(e.target.value as TrustResourceVisibility)
      }
      className={`text-xs font-medium rounded-full px-2 py-0.5 border-0 focus:outline-none focus:ring-2 focus:ring-blue-200 ${VISIBILITY_STYLE[current]}`}
    >
      <option value="PUBLIC">PUBLIC</option>
      <option value="SHAREABLE">SHAREABLE</option>
      <option value="REQUESTABLE">REQUESTABLE</option>
      <option value="PRIVATE">PRIVATE</option>
    </select>
  );
}

function ShareLinkButton({ docId }: { docId: string }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [copied, setCopied] = useState(false);

  const mutation = useMutation({
    mutationFn: () => trustCenterService.mintShareLink(docId, 365),
    onSuccess: (res) => {
      setUrl(res.data.url);
      setExpiresAt(res.data.expiresAt);
      setOpen(true);
    },
  });

  return (
    <>
      <button
        type="button"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="p-1 rounded hover:bg-blue-50 text-blue-600 disabled:opacity-50"
        title="Generate share link"
      >
        <LinkIcon className="w-4 h-4" />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-lg">Share link</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Anyone with this link can download the document. Treat it like a
              password.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <input
                readOnly
                value={url}
                className="flex-1 rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-mono"
              />
              <Button
                size="sm"
                onClick={async () => {
                  await navigator.clipboard.writeText(url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1" /> Copied
                  </>
                ) : (
                  'Copy'
                )}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Expires {new Date(expiresAt).toLocaleDateString()}
            </p>
            <div className="mt-4 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
