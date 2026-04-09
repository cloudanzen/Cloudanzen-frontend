/**
 * AiDocumentsPage.tsx — AI document management.
 *
 * Allows admins to:
 * - View all documents indexed for AI (policies, audits, questionnaires, notes)
 * - Register new documents for indexing
 * - See indexing status (indexed / pending / not indexed)
 * - Delete document indexes (GDPR / data control)
 *
 * Documents are the raw material for the RAG pipeline. Indexing them improves
 * the quality of evidence synthesis, questionnaire answers, and auditor notes.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Loader2, Plus, RefreshCw, Search } from 'lucide-react';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { aiService, AiDocument, AiDocumentSourceType } from '@/services/api/ai';

const SOURCE_TYPE_LABELS: Record<AiDocumentSourceType, string> = {
  POLICY: 'Policy',
  HANDBOOK: 'Handbook',
  AUDIT_REPORT: 'Audit Report',
  QUESTIONNAIRE: 'Questionnaire',
  NOTE: 'Note',
  EVIDENCE: 'Evidence',
  UPLOAD: 'Upload',
};

const SOURCE_TYPE_COLORS: Record<AiDocumentSourceType, string> = {
  POLICY: 'bg-blue-50 text-blue-700',
  HANDBOOK: 'bg-purple-50 text-purple-700',
  AUDIT_REPORT: 'bg-amber-50 text-amber-700',
  QUESTIONNAIRE: 'bg-teal-50 text-teal-700',
  NOTE: 'bg-gray-50 text-gray-700',
  EVIDENCE: 'bg-green-50 text-green-700',
  UPLOAD: 'bg-rose-50 text-rose-700',
};

// ── Register document dialog ──────────────────────────────────────────────────

interface RegisterFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

function RegisterDocumentForm({ onSuccess, onCancel }: RegisterFormProps) {
  const [sourceType, setSourceType] = useState<AiDocumentSourceType>('POLICY');
  const [title, setTitle] = useState('');
  const [storageUrl, setStorageUrl] = useState('');

  const registerMutation = useMutation({
    mutationFn: () =>
      aiService.registerDocument({
        sourceType,
        title,
        mimeType: 'text/plain',
        storageUrl,
      }),
    onSuccess,
  });

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 space-y-3">
      <p className="text-sm font-semibold text-blue-800">
        Register document for AI indexing
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Source type
          </label>
          <select
            value={sourceType}
            onChange={(e) =>
              setSourceType(e.target.value as AiDocumentSourceType)
            }
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(SOURCE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Document title…"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Storage URL (optional — for cloud documents)
          </label>
          <input
            type="text"
            value={storageUrl}
            onChange={(e) => setStorageUrl(e.target.value)}
            placeholder="s3://bucket/path or https://…"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => registerMutation.mutate()}
          disabled={!title.trim() || registerMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          size="sm"
        >
          {registerMutation.isPending ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="mr-2 h-3.5 w-3.5" />
          )}
          Register & index
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        {registerMutation.isError && (
          <p className="text-xs text-red-600 self-center">
            {(registerMutation.error as Error)?.message ??
              'Registration failed'}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Document row ──────────────────────────────────────────────────────────────

function DocumentRow({ doc }: { doc: AiDocument }) {
  const colorClass =
    SOURCE_TYPE_COLORS[doc.sourceType] ?? 'bg-gray-50 text-gray-700';

  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-100 p-3 bg-white">
      <div className="flex items-start gap-3 min-w-0">
        <FileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">
            {doc.title}
          </p>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}
            >
              {SOURCE_TYPE_LABELS[doc.sourceType]}
            </span>
            {doc.indexedAt ? (
              <span className="text-xs text-green-600">
                ✓ Indexed {new Date(doc.indexedAt).toLocaleDateString()}
              </span>
            ) : (
              <span className="text-xs text-amber-600">
                ⏳ Pending indexing
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function AiDocumentsPage() {
  const { t } = useTranslation('ai');
  const [search, setSearch] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['ai-documents'],
    queryFn: () => aiService.listDocuments(),
  });

  const docs: AiDocument[] = data?.data ?? [];

  const filtered = docs.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <PageTemplate
      title={t('documents.title')}
      description={t('documents.description')}
    >
      <div className="space-y-4">
        {/* Header actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('documents.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 mr-1.5 ${isRefetching ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setShowRegister((v) => !v)}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Register document
          </Button>
        </div>

        {/* Register form */}
        {showRegister && (
          <RegisterDocumentForm
            onSuccess={() => {
              setShowRegister(false);
              queryClient.invalidateQueries({ queryKey: ['ai-documents'] });
            }}
            onCancel={() => setShowRegister(false)}
          />
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(SOURCE_TYPE_LABELS).map(([type, label]) => {
            const count = docs.filter((d) => d.sourceType === type).length;
            if (count === 0) return null;
            return (
              <Card key={type} className="p-3 text-center">
                <p className="text-xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </Card>
            );
          })}
        </div>

        {/* Document list */}
        <Card className="p-4">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-10 w-10 text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-500">
                {search ? 'No matching documents' : 'No documents indexed yet'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Register documents to enable AI-powered synthesis and
                questionnaire assistance.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((doc) => (
                <DocumentRow key={doc.id} doc={doc} />
              ))}
            </div>
          )}
        </Card>
      </div>
    </PageTemplate>
  );
}
