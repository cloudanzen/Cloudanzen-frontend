import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/app/components/ui/tabs';
import {
  FileText,
  Loader2,
  ShieldCheck,
  Cpu,
  Download,
  Plus,
  ClipboardCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { evidenceService } from '@/services/api/evidence';
import { controlsService } from '@/services/api/controls';
import {
  complianceDocumentService,
  ComplianceDocumentDto,
} from '@/services/api/compliance-documents';
import { FrameworkFilter } from '@/app/components/compliance/FrameworkFilter';
import { PageFilterBar } from '@/app/components/filters/PageFilterBar';
import { useUrlFilterState } from '@/app/hooks/useUrlFilterState';

import {
  EvidenceDetailPanel,
  EvidenceItem,
  ControlOption,
  typeVariant,
  controlStatusColor,
} from './documents/EvidenceDetailPanel';
import { UploadEvidenceModal } from './documents/UploadEvidenceModal';

/**
 * Maps an ISO control reference prefix to a canonical framework slug.
 */
function isoReferenceToFrameworkSlug(
  isoRef: string | undefined | null,
): string | null {
  if (!isoRef) return null;
  const ref = isoRef.trim().toUpperCase();
  if (ref.startsWith('A.') || ref.startsWith('ISO')) return 'iso-27001';
  if (
    ref.startsWith('CC') ||
    ref.startsWith('A1') ||
    ref.startsWith('C1') ||
    ref.startsWith('P') ||
    ref.startsWith('PI')
  )
    return 'soc-2';
  if (ref.startsWith('164.')) return 'hipaa';
  if (
    ref.startsWith('GV.') ||
    ref.startsWith('ID.') ||
    ref.startsWith('PR.') ||
    ref.startsWith('DE.') ||
    ref.startsWith('RS.') ||
    ref.startsWith('RC.')
  )
    return 'nist-csf';
  return null;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: typeof CheckCircle2 }
> = {
  CURRENT: {
    label: 'Current',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle2,
  },
  PENDING: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
  },
  NEEDS_REVIEW: {
    label: 'Needs Review',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: AlertTriangle,
  },
  EXPIRED: {
    label: 'Expired',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertTriangle,
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  IT: 'bg-blue-100 text-blue-800',
  Engineering: 'bg-purple-100 text-purple-800',
  HR: 'bg-pink-100 text-pink-800',
  Policy: 'bg-green-100 text-green-800',
  Risks: 'bg-orange-100 text-orange-800',
  Custom: 'bg-gray-100 text-gray-800',
};

// ── Required Documents Tab ──────────────────────────────────────────────────

function RequiredDocumentsTab() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [frameworkFilter, setFrameworkFilter] = useState<string>('ALL');
  const hasActiveFilters = Boolean(
    search.trim() || statusFilter !== 'ALL' || frameworkFilter !== 'ALL',
  );

  const { data, isLoading } = useQuery({
    queryKey: ['compliance-documents', search.trim(), statusFilter, frameworkFilter],
    queryFn: () =>
      complianceDocumentService.list({
        search: search.trim() || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        framework: frameworkFilter === 'ALL' ? undefined : frameworkFilter,
      }),
  });

  const { data: filterOptions } = useQuery({
    queryKey: ['compliance-documents', 'filter-options'],
    queryFn: async () => {
      const res = await complianceDocumentService.getFilterOptions();
      return res.data ?? { frameworks: [] };
    },
    staleTime: 5 * 60_000,
  });

  const documents = data?.data ?? [];
  const stats = data?.stats ?? {
    total: 0,
    pending: 0,
    current: 0,
    needsReview: 0,
    expired: 0,
  };

  const frameworkOptions = filterOptions?.frameworks ?? [];

  const activeFilters = [
    ...(search.trim()
      ? [
          {
            key: 'search',
            label: `Search: ${search.trim()}`,
            onRemove: () => setSearch(''),
          },
        ]
      : []),
    ...(statusFilter !== 'ALL'
      ? [
          {
            key: 'status',
            label: `Status: ${STATUS_CONFIG[statusFilter]?.label ?? statusFilter}`,
            onRemove: () => setStatusFilter('ALL'),
          },
        ]
      : []),
    ...(frameworkFilter !== 'ALL'
      ? [
          {
            key: 'framework',
            label: `Framework: ${frameworkOptions.find((framework) => framework.slug === frameworkFilter)?.name ?? frameworkFilter}`,
            onRemove: () => setFrameworkFilter('ALL'),
          },
        ]
      : []),
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (stats.total === 0 && !hasActiveFilters) {
    return (
      <div className="text-center py-16">
        <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          No required documents yet
        </h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Required compliance documents are created automatically when you
          activate a framework. Go to Frameworks and activate one to get
          started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500">Total</span>
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-500">Current</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.current}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-gray-500">Pending</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span className="text-xs text-gray-500">Needs Review</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">
            {stats.needsReview}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-gray-500">Expired</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
        </Card>
      </div>

      <PageFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search documents..."
        selects={[
          {
            key: 'status',
            value: statusFilter,
            placeholder: 'Status',
            onChange: setStatusFilter,
            options: [
              { value: 'ALL', label: `All statuses (${stats.total})` },
              { value: 'PENDING', label: `Pending (${stats.pending})` },
              { value: 'CURRENT', label: `Current (${stats.current})` },
              {
                value: 'NEEDS_REVIEW',
                label: `Needs Review (${stats.needsReview})`,
              },
              { value: 'EXPIRED', label: `Expired (${stats.expired})` },
            ],
          },
          {
            key: 'framework',
            value: frameworkFilter,
            placeholder: 'Framework',
            onChange: setFrameworkFilter,
            options: [
              { value: 'ALL', label: 'All frameworks' },
              ...frameworkOptions.map((framework) => ({
                value: framework.slug,
                label: framework.name,
              })),
            ],
          },
        ]}
        resultCount={documents.length}
        resultLabel={documents.length === 1 ? 'document' : 'documents'}
        activeFilters={activeFilters}
        onClearAll={() => {
          setSearch('');
          setStatusFilter('ALL');
          setFrameworkFilter('ALL');
        }}
      />

      {/* Document List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {[
                  'Document',
                  'Category',
                  'Framework',
                  'Status',
                  'Owner',
                  'Review Due',
                  'Last Reviewed',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-sm text-gray-400"
                  >
                    No documents match your filters.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <DocumentRow
                    key={doc.id}
                    doc={doc}
                    onClick={() => {
                      if (doc.testId) {
                        navigate(`/validations/${doc.testId}`);
                      } else {
                        navigate(`/compliance/documents/${doc.id}`);
                      }
                    }}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function DocumentRow({ doc, onClick }: { doc: ComplianceDocumentDto; onClick?: () => void }) {
  const statusConf = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG.PENDING!;
  const StatusIcon = statusConf!.icon;

  return (
    <tr className="hover:bg-blue-50/40 transition-colors cursor-pointer" onClick={onClick}>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {doc.name}
            </p>
            <p className="text-xs text-gray-400 font-mono truncate">
              {doc.slug}
            </p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge
          variant="outline"
          className={`text-xs ${CATEGORY_COLORS[doc.category] ?? 'bg-gray-100 text-gray-800'}`}
        >
          {doc.category}
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {doc.frameworkName ?? '—'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${statusConf.color}`}
        >
          <StatusIcon className="w-3 h-3" />
          {statusConf.label}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {doc.ownerName ?? <span className="text-gray-400">Unassigned</span>}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
        {doc.reviewDueAt ? new Date(doc.reviewDueAt).toLocaleDateString() : '—'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
        {doc.lastReviewedAt
          ? new Date(doc.lastReviewedAt).toLocaleDateString()
          : 'Never'}
      </td>
    </tr>
  );
}

// ── Evidence Locker Tab ─────────────────────────────────────────────────────

function EvidenceLockerTab() {
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    automated: number;
    manual: number;
  } | null>(null);
  const [controls, setControls] = useState<ControlOption[]>([]);
  const [loading, setLoading] = useState(true);
  const { filters, update, reset } = useUrlFilterState({
    defaults: { type: 'ALL', search: '', frameworks: [] as string[] },
    arrayKeys: ['frameworks'],
  });
  const filter = filters.type as 'ALL' | 'AUTOMATED' | 'FILE';
  const search = filters.search;
  const frameworkFilter = filters.frameworks;
  const [showUpload, setShowUpload] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      evidenceService.getEvidence(),
      evidenceService.getEvidenceStats(),
      controlsService.getControls({ limit: 200 }),
    ])
      .then(([evidRes, statsRes, ctrlRes]) => {
        if (cancelled) return;
        setEvidence((evidRes?.data ?? []) as EvidenceItem[]);
        setStats(statsRes?.data ?? null);
        const ctrlData = (ctrlRes as { data?: ControlOption[] })?.data ?? [];
        setControls(
          ctrlData.map((c) => ({
            id: c.id,
            isoReference: c.isoReference,
            title: c.title,
          })),
        );
      })
      .catch(() => {
        if (!cancelled) toast.error('Failed to load evidence data');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return evidence.filter((e) => {
      const matchesType = filter === 'ALL' || e.type === filter;
      const haystack =
        `${e.fileName ?? ''} ${e.control?.isoReference ?? ''} ${e.control?.title ?? ''} ${e.collectedBy ?? ''}`.toLowerCase();
      const matchesSearch =
        search.trim() === '' || haystack.includes(search.trim().toLowerCase());
      const matchesFramework =
        frameworkFilter.length === 0 ||
        (() => {
          const slug = isoReferenceToFrameworkSlug(
            e.control?.isoReference ?? null,
          );
          return slug !== null && frameworkFilter.includes(slug);
        })();
      return matchesType && matchesFramework && matchesSearch;
    });
  }, [evidence, filter, frameworkFilter, search]);

  const activeFilters = [
    ...(search.trim()
      ? [
          {
            key: 'search',
            label: `Search: ${search.trim()}`,
            onRemove: () => update({ search: '' }),
          },
        ]
      : []),
    ...(filter !== 'ALL'
      ? [
          {
            key: 'type',
            label: `Type: ${filter}`,
            onRemove: () => update({ type: 'ALL' }),
          },
        ]
      : []),
    ...frameworkFilter.map((slug) => ({
      key: `framework-${slug}`,
      label: `Framework: ${slug.replace(/-/g, ' ')}`,
      onRemove: () =>
        update({ frameworks: frameworkFilter.filter((item) => item !== slug) }),
    })),
  ];

  const handleDownload = async (ev: EvidenceItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ev.fileUrl) return;
    setDownloading(ev.id);
    try {
      await evidenceService.downloadEvidence(
        ev.id,
        ev.fileName ?? `evidence-${ev.id.slice(0, 8)}`,
      );
    } catch {
      toast.error('Failed to download evidence');
    } finally {
      setDownloading(null);
    }
  };

  const handleUploaded = (newEv: EvidenceItem) => {
    setEvidence((prev) => [newEv, ...prev]);
    setStats((prev) =>
      prev ? { ...prev, total: prev.total + 1, manual: prev.manual + 1 } : prev,
    );
    setShowUpload(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Modal */}
      {showUpload && (
        <UploadEvidenceModal
          controls={controls}
          onClose={() => setShowUpload(false)}
          onUploaded={handleUploaded}
        />
      )}

      {/* Evidence detail slide-over */}
      {selectedEvidence && (
        <EvidenceDetailPanel
          evidence={selectedEvidence}
          onClose={() => setSelectedEvidence(null)}
        />
      )}

      {/* Stats + Upload button row */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {stats && (
          <div className="grid grid-cols-3 gap-4 flex-1">
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-1">
                <FileText className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">Total</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.total}
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-1">
                <Cpu className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-gray-600">Automated</span>
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {stats.automated}
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-1">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-600">Manual</span>
              </div>
              <div className="text-3xl font-bold text-green-600">
                {stats.manual}
              </div>
            </Card>
          </div>
        )}

        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition-colors flex-shrink-0 self-start"
        >
          <Plus className="w-4 h-4" />
          Upload Evidence
        </button>
      </div>

      <PageFilterBar
        searchValue={search}
        onSearchChange={(value) => update({ search: value })}
        searchPlaceholder="Search files, controls, or collected by"
        selects={[
          {
            key: 'type',
            value: filter,
            placeholder: 'Type',
            onChange: (value) =>
              update({ type: value as 'ALL' | 'AUTOMATED' | 'FILE' }),
            options: [
              { value: 'ALL', label: `All (${evidence.length})` },
              {
                value: 'AUTOMATED',
                label: `Automated (${evidence.filter((item) => item.type === 'AUTOMATED').length})`,
              },
              {
                value: 'FILE',
                label: `File (${evidence.filter((item) => item.type === 'FILE').length})`,
              },
            ],
          },
        ]}
        inlineExtras={
          <FrameworkFilter
            selected={frameworkFilter}
            onChange={(value) => update({ frameworks: value })}
            className="w-full"
          />
        }
        resultCount={filtered.length}
        resultLabel="evidence items"
        activeFilters={activeFilters}
        onClearAll={reset}
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {[
                  'Evidence / File',
                  'Type',
                  'ISO Control',
                  'Control Status',
                  'Collected By',
                  'Date',
                  'Actions',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-sm text-gray-400"
                  >
                    No evidence records found.{' '}
                    {filter === 'ALL'
                      ? 'Connect GitHub and run a scan, or upload a file manually.'
                      : 'Try switching to "All".'}
                  </td>
                </tr>
              ) : (
                filtered.map((ev) => {
                  const isFile = !!ev.fileUrl;
                  const isDownloading = downloading === ev.id;

                  return (
                    <tr
                      key={ev.id}
                      className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedEvidence(ev)}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          {ev.automated ? (
                            <Cpu className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          )}
                          <span className="truncate max-w-[200px]">
                            {ev.fileName ?? `evidence-${ev.id.slice(0, 8)}`}
                          </span>
                          <span className="opacity-0 group-hover:opacity-100 text-xs text-blue-500 transition-opacity flex-shrink-0">
                            View &rarr;
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={typeVariant(ev.type)}>{ev.type}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {ev.control ? (
                          <div>
                            <span className="font-mono text-blue-600 font-medium">
                              {ev.control.isoReference}
                            </span>
                            <p className="text-xs text-gray-400 truncate max-w-[150px]">
                              {ev.control.title}
                            </p>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {ev.control ? (
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full border ${controlStatusColor(ev.control.status)}`}
                          >
                            {ev.control.status.replace(/_/g, ' ')}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {ev.collectedBy ?? 'system'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                        {new Date(ev.createdAt).toLocaleDateString()}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isFile ? (
                          <button
                            onClick={(e) => handleDownload(ev, e)}
                            disabled={isDownloading}
                            title="Download file"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white hover:bg-green-50 hover:border-green-300 hover:text-green-700 text-gray-600 transition-colors disabled:opacity-50"
                          >
                            {isDownloading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            {isDownloading ? '…' : 'Download'}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export function DocumentsPage() {
  const { t } = useTranslation('compliance');
  return (
    <PageTemplate
      title={t('documents.title')}
      description={t('documents.description')}
    >
      <Tabs defaultValue="required-documents">
        <TabsList>
          <TabsTrigger value="required-documents">
            <ClipboardCheck className="w-4 h-4" />
            {t('documents.requiredDocuments')}
          </TabsTrigger>
          <TabsTrigger value="evidence-locker">
            <FileText className="w-4 h-4" />
            {t('documents.evidenceLocker')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="required-documents">
          <RequiredDocumentsTab />
        </TabsContent>

        <TabsContent value="evidence-locker">
          <EvidenceLockerTab />
        </TabsContent>
      </Tabs>
    </PageTemplate>
  );
}
