import { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Search,
  X,
  Upload,
  CheckCircle2,
  Loader2,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';
import { testsService } from '@/services/api/tests';
import { controlsService } from '@/services/api/controls';
import { evidenceService } from '@/services/api/evidence';
import { auditsService } from '@/services/api/audits';
import { policiesService } from '@/services/api/policies';
import type { Control } from '@/services/api/types';
import type { AuditRecord } from '@/services/api/audits';
import { fmtDate } from '@/lib/format-date';

// ─── Upload Evidence ──────────────────────────────────────────────────────────

export function UploadEvidenceSection({
  testId,
  controlId,
  onUploaded,
}: {
  testId: string;
  controlId: string | null;
  onUploaded?: () => void;
}) {
  const { t } = useTranslation('tests');
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !controlId) return;
    setUploading(true);
    setError('');
    try {
      const res = await evidenceService.uploadEvidenceFile(file, controlId);
      const evidenceId = res.data?.id;
      if (evidenceId) {
        await testsService.attachEvidence(testId, evidenceId);
      }
      qc.invalidateQueries({ queryKey: QK.testDetail(testId) });
      qc.invalidateQueries({ queryKey: ['evidence'] });
      onUploaded?.();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : t('testDetail.evidenceTab.uploadFailed'),
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  if (!controlId) {
    return (
      <p className="mt-2 text-xs text-gray-400">
        {t('testDetail.evidenceTab.linkControlFirst')}
      </p>
    );
  }

  return (
    <div className="mt-2">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
      >
        {uploading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />{' '}
            {t('testDetail.evidenceTab.uploading')}
          </>
        ) : (
          <>
            <Upload className="w-3.5 h-3.5" />{' '}
            {t('testDetail.evidenceTab.uploadFile')}
          </>
        )}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ─── Mark as Passed prompt ────────────────────────────────────────────────────

export function MarkAsPassedPrompt({
  testId,
  show,
  onDismiss,
}: {
  testId: string;
  show: boolean;
  onDismiss: () => void;
}) {
  const { t } = useTranslation('tests');
  const qc = useQueryClient();
  const completeMutation = useMutation({
    mutationFn: () => testsService.completeTest(testId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.testDetail(testId) });
      qc.invalidateQueries({ queryKey: ['tests'] });
      onDismiss();
    },
  });

  if (!show) return null;

  return (
    <div className="mt-3 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
      <p className="flex-1 text-sm text-green-800">
        {t('attachSections.markAsPassed.prompt')}
      </p>
      <button
        onClick={() => completeMutation.mutate()}
        disabled={completeMutation.isPending}
        className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        {completeMutation.isPending
          ? t('attachSections.markAsPassed.updating')
          : t('attachSections.markAsPassed.confirm')}
      </button>
      <button
        onClick={onDismiss}
        className="text-green-600 hover:text-green-800"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Attach Evidence ──────────────────────────────────────────────────────────

export function AttachEvidenceSection({
  testId,
  existingIds,
  controlIds,
  onAttached,
}: {
  testId: string;
  existingIds: Set<string>;
  /** controlIds from the test's linked controls — used to prioritise relevant evidence */
  controlIds?: string[];
  onAttached?: () => void;
}) {
  const { t } = useTranslation('tests');
  const qc = useQueryClient();
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  const { data: allEvidence, isLoading } = useQuery({
    queryKey: ['evidence', 'all'],
    queryFn: async () => {
      const res = await evidenceService.getEvidence();
      return res.data ?? [];
    },
    staleTime: STALE.CONTROLS,
    enabled: showPicker,
  });

  const controlIdSet = useMemo(() => new Set(controlIds ?? []), [controlIds]);

  // Split into relevant (same controls) vs rest, then apply search
  const { relevant, rest } = useMemo(() => {
    if (!allEvidence) return { relevant: [], rest: [] };
    const available = allEvidence.filter((e) => !existingIds.has(e.id));
    const q = search.toLowerCase();
    const matchesSearch = (e: (typeof available)[0]) =>
      !q ||
      (e.fileName ?? e.type ?? '').toLowerCase().includes(q) ||
      (e.control?.isoReference ?? '').toLowerCase().includes(q) ||
      (e.control?.title ?? '').toLowerCase().includes(q);

    const rel: typeof available = [];
    const other: typeof available = [];
    for (const e of available) {
      if (!matchesSearch(e)) continue;
      if (
        controlIdSet.size > 0 &&
        e.controlId &&
        controlIdSet.has(e.controlId)
      ) {
        rel.push(e);
      } else {
        other.push(e);
      }
    }
    return { relevant: rel, rest: other };
  }, [allEvidence, existingIds, search, controlIdSet]);

  const attachMutation = useMutation({
    mutationFn: (evidenceId: string) =>
      testsService.attachEvidence(testId, evidenceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.testDetail(testId) });
      onAttached?.();
    },
  });

  if (!showPicker) {
    return (
      <button
        onClick={() => setShowPicker(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 mt-2"
      >
        <Plus className="w-3.5 h-3.5" /> {t('attachSections.attachEvidence')}
      </button>
    );
  }

  const renderItem = (e: NonNullable<typeof allEvidence>[number]) => (
    <li
      key={e.id}
      className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-blue-100 text-sm"
    >
      <div className="min-w-0">
        <p className="text-gray-800 truncate">{e.fileName ?? e.type}</p>
        <p className="text-xs text-gray-400">
          {e.control?.isoReference ? `${e.control.isoReference} · ` : ''}
          {fmtDate(e.createdAt)}
        </p>
      </div>
      <button
        onClick={() => attachMutation.mutate(e.id)}
        disabled={attachMutation.isPending}
        className="ml-2 text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 whitespace-nowrap"
      >
        {t('attachSections.attach')}
      </button>
    </li>
  );

  return (
    <div className="mt-3 border border-blue-200 rounded-lg p-3 bg-blue-50/50">
      <div className="flex items-center gap-2 mb-2">
        <Search className="w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('attachSections.searchEvidence')}
          className="flex-1 text-sm border-0 bg-transparent focus:outline-none placeholder:text-gray-400"
          autoFocus
        />
        <button
          onClick={() => setShowPicker(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {isLoading ? (
        <p className="text-xs text-gray-400 animate-pulse">
          {t('attachSections.loadingEvidence')}
        </p>
      ) : relevant.length === 0 && rest.length === 0 ? (
        <p className="text-xs text-gray-500">
          {t('attachSections.noAvailableEvidence')}
        </p>
      ) : (
        <div className="max-h-52 overflow-y-auto">
          {/* Relevant evidence from linked controls */}
          {relevant.length > 0 && (
            <>
              <p className="px-2 pb-1 text-xs font-medium text-green-700">
                {t('attachSections.fromLinkedControls', {
                  count: relevant.length,
                })}
              </p>
              <ul className="space-y-0.5 mb-2">
                {relevant.slice(0, 20).map(renderItem)}
              </ul>
            </>
          )}

          {/* Other evidence — collapsed by default if there are relevant results */}
          {rest.length > 0 && (
            <>
              {relevant.length > 0 && !showAll ? (
                <button
                  onClick={() => setShowAll(true)}
                  className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  {t('attachSections.showAllOtherEvidence', {
                    count: rest.length,
                  })}
                </button>
              ) : (
                <>
                  {relevant.length > 0 && (
                    <p className="px-2 pb-1 pt-1 text-xs font-medium text-gray-500 border-t border-blue-200 mt-1">
                      {t('attachSections.otherEvidence', {
                        count: rest.length,
                      })}
                    </p>
                  )}
                  <ul className="space-y-0.5">
                    {rest.slice(0, 30).map(renderItem)}
                  </ul>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Attach Control ───────────────────────────────────────────────────────────

export function AttachControlSection({
  testId,
  existingIds,
}: {
  testId: string;
  existingIds: Set<string>;
}) {
  const { t } = useTranslation('tests');
  const qc = useQueryClient();
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');

  const { data: allControls, isLoading } = useQuery({
    queryKey: ['controls', 'all-for-picker'],
    queryFn: async () => {
      const res = await controlsService.getControls({ limit: 500 });
      return (res.data ?? []) as Control[];
    },
    staleTime: STALE.CONTROLS,
    enabled: showPicker,
  });

  const filtered = useMemo(() => {
    if (!allControls) return [];
    const q = search.toLowerCase();
    return allControls.filter(
      (c) =>
        !existingIds.has(c.id) &&
        `${c.isoReference} ${c.title}`.toLowerCase().includes(q),
    );
  }, [allControls, existingIds, search]);

  const attachMutation = useMutation({
    mutationFn: (controlId: string) =>
      testsService.attachControl(testId, controlId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.testDetail(testId) });
    },
  });

  if (!showPicker) {
    return (
      <button
        onClick={() => setShowPicker(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 mt-2"
      >
        <Plus className="w-3.5 h-3.5" />{' '}
        {t('attachSections.attachControl.title')}
      </button>
    );
  }

  return (
    <div className="mt-3 border border-blue-200 rounded-lg p-3 bg-blue-50/50">
      <div className="flex items-center gap-2 mb-2">
        <Search className="w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('attachSections.attachControl.search')}
          className="flex-1 text-sm border-0 bg-transparent focus:outline-none placeholder:text-gray-400"
          autoFocus
        />
        <button
          onClick={() => setShowPicker(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {isLoading ? (
        <p className="text-xs text-gray-400 animate-pulse">
          {t('attachSections.attachControl.loading')}
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-gray-500">
          {t('attachSections.attachControl.noResults')}
        </p>
      ) : (
        <ul className="space-y-1 max-h-40 overflow-y-auto">
          {filtered.slice(0, 20).map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-blue-100 text-sm"
            >
              <div className="min-w-0">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-semibold bg-blue-50 text-blue-800 border border-blue-200 mr-2">
                  {c.isoReference}
                </span>
                <span className="text-gray-700 truncate">{c.title}</span>
              </div>
              <button
                onClick={() => attachMutation.mutate(c.id)}
                disabled={attachMutation.isPending}
                className="ml-2 text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 whitespace-nowrap"
              >
                {t('attachSections.attachAudit.link')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Attach Audit ─────────────────────────────────────────────────────────────

export function AttachAuditSection({
  testId,
  existingIds,
}: {
  testId: string;
  existingIds: Set<string>;
}) {
  const { t } = useTranslation('tests');
  const qc = useQueryClient();
  const [showPicker, setShowPicker] = useState(false);

  const { data: allAudits, isLoading } = useQuery({
    queryKey: ['audits', 'all-for-picker'],
    queryFn: async () => {
      const res = await auditsService.list();
      return (res.data ?? []) as AuditRecord[];
    },
    staleTime: STALE.CONTROLS,
    enabled: showPicker,
  });

  const filtered = useMemo(() => {
    if (!allAudits) return [];
    return allAudits.filter((a) => !existingIds.has(a.id));
  }, [allAudits, existingIds]);

  const attachMutation = useMutation({
    mutationFn: (auditId: string) => testsService.attachAudit(testId, auditId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.testDetail(testId) });
    },
  });

  if (!showPicker) {
    return (
      <button
        onClick={() => setShowPicker(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 mt-2"
      >
        <Plus className="w-3.5 h-3.5" /> {t('attachSections.attachAudit.title')}
      </button>
    );
  }

  return (
    <div className="mt-3 border border-blue-200 rounded-lg p-3 bg-blue-50/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          {t('attachSections.attachAudit.select')}
        </span>
        <button
          onClick={() => setShowPicker(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {isLoading ? (
        <p className="text-xs text-gray-400 animate-pulse">
          {t('attachSections.attachAudit.loading')}
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-gray-500">
          {t('attachSections.attachAudit.noResults')}
        </p>
      ) : (
        <ul className="space-y-1 max-h-40 overflow-y-auto">
          {filtered.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-blue-100 text-sm"
            >
              <div className="min-w-0">
                <p className="text-gray-800 font-medium truncate">{a.name}</p>
                <p className="text-xs text-gray-400">
                  {a.type} &middot; {a.status}
                </p>
              </div>
              <button
                onClick={() => attachMutation.mutate(a.id)}
                disabled={attachMutation.isPending}
                className="ml-2 text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 whitespace-nowrap"
              >
                {t('attachSections.attachAudit.link')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Add Framework ────────────────────────────────────────────────────────────

export function AddFrameworkSection({ testId }: { testId: string }) {
  const { t } = useTranslation('tests');
  const qc = useQueryClient();
  const [showInput, setShowInput] = useState(false);
  const [name, setName] = useState('');

  const attachMutation = useMutation({
    mutationFn: (frameworkName: string) =>
      testsService.attachFramework(testId, frameworkName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.testDetail(testId) });
      setName('');
      setShowInput(false);
    },
  });

  if (!showInput) {
    return (
      <button
        onClick={() => setShowInput(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 mt-2"
      >
        <Plus className="w-3.5 h-3.5" />{' '}
        {t('attachSections.addFramework.title')}
      </button>
    );
  }

  return (
    <div className="mt-3 flex items-center gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('attachSections.addFramework.placeholder')}
        className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter' && name.trim())
            attachMutation.mutate(name.trim());
        }}
      />
      <button
        onClick={() => name.trim() && attachMutation.mutate(name.trim())}
        disabled={!name.trim() || attachMutation.isPending}
        className="text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
      >
        {t('attachSections.addFramework.add')}
      </button>
      <button
        onClick={() => setShowInput(false)}
        className="text-gray-400 hover:text-gray-600"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Policy Documents (auto-linked) ─────────────────────────────────────────

export function PolicyDocumentsSection({
  controlIds,
}: {
  controlIds: string[];
}) {
  const { t } = useTranslation('tests');
  const { data: policies, isLoading } = useQuery({
    queryKey: ['policies', 'by-controls', ...controlIds],
    queryFn: async () => {
      const res = await policiesService.getPoliciesByControls(controlIds);
      return res.data ?? [];
    },
    staleTime: STALE.CONTROLS,
    enabled: controlIds.length > 0,
  });

  if (controlIds.length === 0) return null;
  if (isLoading)
    return (
      <p className="text-xs text-gray-400 animate-pulse mt-2">
        {t('attachSections.policyDocuments.loading')}
      </p>
    );
  if (!policies || policies.length === 0) return null;

  const withDocs = policies.filter((p) => p.documentUrl);
  if (withDocs.length === 0) return null;

  return (
    <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/40 p-3">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-3.5 h-3.5 text-indigo-600" />
        <span className="text-xs font-semibold text-indigo-800">
          {t('attachSections.policyDocuments.count', {
            count: withDocs.length,
          })}
        </span>
        <span className="ml-auto text-xs text-indigo-400">
          {t('attachSections.policyDocuments.autoLinked')}
        </span>
      </div>
      <ul className="space-y-1.5">
        {withDocs.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between gap-2 rounded-lg bg-white border border-indigo-100 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {p.name}{' '}
                <span className="text-gray-400 font-normal">v{p.version}</span>
              </p>
              <p className="text-xs text-gray-400">
                {p.status} &middot;{' '}
                {t('attachSections.policyDocuments.linkedControls', {
                  count: p.controlIds.length,
                })}
              </p>
            </div>
            {p.documentUrl && (
              <a
                href={p.documentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 whitespace-nowrap"
              >
                <ExternalLink className="w-3 h-3" />{' '}
                {t('attachSections.policyDocuments.viewPolicy')}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
