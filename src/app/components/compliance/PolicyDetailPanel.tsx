/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  X,
  FileText,
  FlaskConical,
  Download,
  ExternalLink,
  Upload,
  CheckCircle2,
  Clock,
  Edit3,
  AlertCircle,
  Tag,
  Loader2,
  User,
  Eye,
  PencilLine,
} from 'lucide-react';
import { useState, useRef, useCallback } from 'react';
import { PolicyPreviewSheet } from './PolicyPreviewSheet';
import { PolicyEditor } from './PolicyEditor';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs';
import { Policy } from '@/services/api/types';
import { policiesService } from '@/services/api/policies';
import { testsService } from '@/services/api/tests';
import { controlsService } from '@/services/api/controls';
import { usersService } from '@/services/api/users';
import { fmtDate } from '@/lib/format-date';

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    bg: string;
    text: string;
    dot: string;
    Icon: React.ElementType;
  }
> = {
  PUBLISHED: {
    label: 'Published',
    bg: 'bg-green-50',
    text: 'text-green-700',
    dot: 'bg-green-500',
    Icon: CheckCircle2,
  },
  DRAFT: {
    label: 'Draft',
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
    Icon: Edit3,
  },
  REVIEW: {
    label: 'In Review',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    Icon: Clock,
  },
  ARCHIVED: {
    label: 'Archived',
    bg: 'bg-red-50',
    text: 'text-red-600',
    dot: 'bg-red-400',
    Icon: AlertCircle,
  },
};

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
        {icon}
        <span className="text-sm font-semibold text-gray-800">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function PolicyDetailPanel({
  policy,
  onClose,
  onMutated,
}: {
  policy: Policy;
  onClose: () => void;
  onMutated?: () => void;
}) {
  const [currentPolicy, setCurrentPolicy] = useState(policy);
  const cfg = (STATUS_CONFIG[currentPolicy.status] ?? STATUS_CONFIG['DRAFT'])!;
  const StatusIcon = cfg.Icon;
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const updateMutation = useMutation({
    mutationFn: (data: { status?: string; ownerId?: string }) =>
      policiesService.updatePolicy(currentPolicy.id, data),
    onSuccess: (res) => {
      if (res.data) setCurrentPolicy(res.data);
      onMutated?.();
    },
  });

  // Org users for owner reassignment
  const { data: orgUsers = [] } = useQuery({
    queryKey: ['users', 'list'],
    queryFn: () => usersService.listUsers(),
    staleTime: 60_000,
  });

  // All tests — filter by policy name heuristic (policy name match or category)
  const { data: allTests = [] } = useQuery({
    queryKey: ['tests', 'list', {}],
    queryFn: async () => {
      const r = await testsService.listTests({ limit: 999 });
      return r.data ?? [];
    },
    staleTime: 30_000,
  });

  // Filter tests loosely by policy category keyword
  const policyWord = currentPolicy.name.split(' ')[0]?.toLowerCase();
  const relatedTests = allTests
    .filter(
      (t: any) =>
        t.category === 'Policy' || t.name.toLowerCase().includes(policyWord),
    )
    .slice(0, 6);

  // All controls — show implemented ones
  const { data: allControls = [] } = useQuery({
    queryKey: ['controls', 'list', {}],
    queryFn: async () => {
      const r = await controlsService.getControls({ limit: 999 } as any);
      return r.data ?? [];
    },
    staleTime: 30_000,
  });

  // Heuristic: show controls whose title partially matches the policy topic
  const relatedControls = allControls
    .filter(
      (c: any) =>
        c.title?.toLowerCase().includes(policyWord) ||
        c.description?.toLowerCase().includes(policyWord),
    )
    .slice(0, 5);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const name = currentPolicy.documentUrl?.split('/').pop() ?? `${currentPolicy.name}.pdf`;
      await policiesService.downloadPolicyDocument(currentPolicy.id, name);
    } catch {
      /* silently fail */
    } finally {
      setDownloading(false);
    }
  };

  const handlePreview = useCallback(() => setPreviewOpen(true), []);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadErr(null);
    try {
      const result = await policiesService.uploadPolicyDocument(currentPolicy.id, file);
      if (result.data?.policy) setCurrentPolicy(result.data.policy);
      onMutated?.();
    } catch (e: unknown) {
      setUploadErr(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
    <PolicyEditor
      open={editOpen}
      policy={currentPolicy}
      onClose={() => setEditOpen(false)}
      onSaved={(updatedPolicy) => {
        setCurrentPolicy(updatedPolicy);
        onMutated?.();
      }}
    />
    {previewOpen && currentPolicy.documentUrl && (
      <PolicyPreviewSheet
        policyId={currentPolicy.id}
        policyName={currentPolicy.name}
        documentUrl={currentPolicy.documentUrl}
        onClose={() => setPreviewOpen(false)}
        onDownload={() => { setPreviewOpen(false); void handleDownload(); }}
      />
    )}
    <div className="fixed inset-0 z-40 flex justify-end" aria-modal="true">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-50 w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 bg-white sticky top-0 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-3">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
                >
                  <StatusIcon className="w-3.5 h-3.5" />
                  {cfg.label}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                  v{currentPolicy.version}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 leading-snug">
                {currentPolicy.name}
              </h2>
              {currentPolicy.description && (
                <p className="text-sm text-gray-500 leading-relaxed mt-1">
                  {currentPolicy.description}
                </p>
              )}
              {currentPolicy.owner && (
                <p className="text-xs text-gray-500 mt-1">
                  Owned by{' '}
                  <span className="font-medium text-gray-700">
                    {currentPolicy.owner.name || currentPolicy.owner.email}
                  </span>
                </p>
              )}
              {currentPolicy.approvedBy && (
                <p className="text-xs text-gray-500 mt-1">
                  Approved by{' '}
                  <span className="font-medium text-gray-700">
                    {currentPolicy.approvedBy}
                  </span>
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Status action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {currentPolicy.status !== 'PUBLISHED' && (
              <button
                onClick={() => updateMutation.mutate({ status: 'PUBLISHED' })}
                disabled={updateMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Publish
              </button>
            )}
            {currentPolicy.status === 'DRAFT' && (
              <button
                onClick={() => updateMutation.mutate({ status: 'REVIEW' })}
                disabled={updateMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                <Clock className="w-3.5 h-3.5" />
                Send for Review
              </button>
            )}
            {currentPolicy.status === 'PUBLISHED' && (
              <button
                onClick={() => updateMutation.mutate({ status: 'DRAFT' })}
                disabled={updateMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 text-xs font-medium hover:bg-gray-300 disabled:opacity-50 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Revert to Draft
              </button>
            )}
            {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
          </div>
        </div>

        {/* KPI strip */}
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {relatedTests.length}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Related tests</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {relatedControls.length}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Related controls</p>
            </div>
            <div className="text-center">
              <p
                className={`text-2xl font-bold ${currentPolicy.documentUrl ? 'text-green-600' : 'text-gray-400'}`}
              >
                {currentPolicy.documentUrl ? '✓' : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Document</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="rounded-xl bg-slate-100 p-1 h-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tests">
                Tests ({relatedTests.length})
              </TabsTrigger>
              <TabsTrigger value="controls">
                Controls ({relatedControls.length})
              </TabsTrigger>
              <TabsTrigger value="document">Document</TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="space-y-4 mt-0">
              <Section
                title="Policy Details"
                icon={<FileText className="w-4 h-4 text-gray-500" />}
              >
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Status
                    </dt>
                    <dd className="mt-1">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Version
                    </dt>
                    <dd className="mt-1 font-mono font-semibold text-gray-700">
                      v{currentPolicy.version}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Created
                    </dt>
                    <dd className="mt-1 text-gray-700">
                      {fmtDate(currentPolicy.createdAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Last Updated
                    </dt>
                    <dd className="mt-1 text-gray-700">
                      {fmtDate(currentPolicy.updatedAt)}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Owner
                    </dt>
                    <dd className="mt-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <User className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <select
                          value={currentPolicy.ownerId ?? ''}
                          onChange={(e) => updateMutation.mutate({ ownerId: e.target.value || undefined })}
                          disabled={updateMutation.isPending}
                          className="text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          <option value="">Unassigned</option>
                          {orgUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name || u.email}
                            </option>
                          ))}
                        </select>
                      </div>
                    </dd>
                  </div>
                  {currentPolicy.approvedBy && (
                    <div className="col-span-2">
                      <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                        Approved By
                      </dt>
                      <dd className="mt-1 text-gray-700">
                        {currentPolicy.approvedBy}
                      </dd>
                    </div>
                  )}
                  {currentPolicy.approvedAt && (
                    <div>
                      <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                        Approved At
                      </dt>
                      <dd className="mt-1 text-gray-700">
                        {fmtDate(currentPolicy.approvedAt)}
                      </dd>
                    </div>
                  )}
                </dl>
              </Section>

              {relatedTests.length > 0 && (
                <Section
                  title={`Related Tests (${relatedTests.length})`}
                  icon={<FlaskConical className="w-4 h-4 text-gray-500" />}
                >
                  <ul className="space-y-2">
                    {relatedTests.slice(0, 4).map((t: any) => {
                      const badgeColors: Record<string, string> = {
                        OK: 'bg-green-100 text-green-700',
                        Overdue: 'bg-red-100 text-red-700',
                        Due_soon: 'bg-amber-100 text-amber-700',
                        Needs_remediation: 'bg-orange-100 text-orange-700',
                      };
                      return (
                        <li
                          key={t.id}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-gray-50"
                        >
                          <p className="text-sm font-medium text-gray-800">
                            {t.name}
                          </p>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2 ${badgeColors[t.status] ?? 'bg-gray-100 text-gray-600'}`}
                          >
                            {t.status.replace(/_/g, ' ')}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </Section>
              )}
            </TabsContent>

            {/* Tests tab */}
            <TabsContent value="tests" className="space-y-3 mt-0">
              {relatedTests.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FlaskConical className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No tests linked to this policy yet.</p>
                </div>
              ) : (
                relatedTests.map((t: any) => {
                  const badgeColors: Record<string, string> = {
                    OK: 'border-green-200 bg-green-50/50',
                    Overdue: 'border-red-200 bg-red-50/50',
                    Due_soon: 'border-amber-200 bg-amber-50/50',
                    Needs_remediation: 'border-orange-200 bg-orange-50/50',
                  };
                  const textColors: Record<string, string> = {
                    OK: 'bg-green-100 text-green-700',
                    Overdue: 'bg-red-100 text-red-700',
                    Due_soon: 'bg-amber-100 text-amber-700',
                    Needs_remediation: 'bg-orange-100 text-orange-700',
                  };
                  return (
                    <div
                      key={t.id}
                      className={`rounded-xl border p-4 ${badgeColors[t.status] ?? 'border-gray-200'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {t.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {t.type} · {t.category} · Due {fmtDate(t.dueDate)}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${textColors[t.status] ?? 'bg-gray-100 text-gray-600'}`}
                        >
                          {t.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>

            {/* Controls tab */}
            <TabsContent value="controls" className="space-y-3 mt-0">
              {relatedControls.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Tag className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">
                    No related controls found for this policy.
                  </p>
                </div>
              ) : (
                relatedControls.map((c: any) => {
                  const sColors: Record<string, string> = {
                    IMPLEMENTED: 'bg-green-100 text-green-700',
                    PARTIALLY_IMPLEMENTED: 'bg-amber-100 text-amber-700',
                    NOT_IMPLEMENTED: 'bg-red-100 text-red-700',
                  };
                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50"
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-semibold bg-blue-50 text-blue-800 border border-blue-200 flex-shrink-0">
                          {c.isoReference}
                        </span>
                        <p className="text-sm text-gray-700 truncate">
                          {c.title}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2 ${sColors[c.status] ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  );
                })
              )}
            </TabsContent>

            {/* Document tab */}
            <TabsContent value="document" className="space-y-4 mt-0">
              {currentPolicy.documentUrl ? (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 truncate max-w-xs">
                        {currentPolicy.documentUrl.split('/').pop() ?? currentPolicy.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Attached document
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handlePreview}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>
                    <button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      {downloading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      {downloading ? 'Downloading…' : 'Download'}
                      </button>
                    {currentPolicy.content ? (
                      <button
                        onClick={() => setEditOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <PencilLine className="w-4 h-4" />
                        Edit
                      </button>
                    ) : null}
                    {!currentPolicy.documentUrl.startsWith('/files/') && !currentPolicy.documentUrl.startsWith('s3://') && (
                      <a
                        href={currentPolicy.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View in new tab
                      </a>
                    )}
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Replace
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="rounded-2xl border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/30 p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors"
                >
                  <Upload className="w-10 h-10 text-gray-300" />
                  <p className="text-sm font-medium text-gray-700">
                    Click to upload a policy document
                  </p>
                  <p className="text-xs text-gray-400">
                    PDF, Word, Excel — max 50 MB
                  </p>
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.xlsx,.xls,.csv"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) await handleUpload(file);
                  e.target.value = '';
                }}
              />
              {uploading && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Loader2 className="w-4 h-4 animate-spin" /> Uploading…
                </div>
              )}
              {uploadErr && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {uploadErr}
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
    </>
  );
}
