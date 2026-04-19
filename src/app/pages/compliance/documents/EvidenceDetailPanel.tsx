/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/app/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs';
import {
  FileText,
  Loader2,
  Cpu,
  Download,
  X,
  Hash,
  Calendar,
  User,
  Link2,
  FlaskConical,
  Shield,
} from 'lucide-react';
import { evidenceService } from '@/services/api/evidence';
import { testsService, type TestRecord } from '@/services/api/tests';
import { fmtDate } from '@/lib/format-date';

export interface EvidenceItem {
  id: string;
  type: string;
  fileName: string | null;
  fileUrl: string | null;
  hash: string;
  automated: boolean;
  collectedBy: string | null;
  createdAt: string;
  control: {
    id: string;
    isoReference: string;
    title: string;
    status: string;
  } | null;
}

export interface ControlOption {
  id: string;
  isoReference: string;
  title: string;
}

export function typeVariant(type: string): 'default' | 'secondary' | 'outline' {
  if (type === 'AUTOMATED') return 'default';
  if (type === 'FILE') return 'secondary';
  return 'outline';
}

export function controlStatusColor(status: string) {
  if (status === 'IMPLEMENTED')
    return 'text-green-600 bg-green-50 border-green-200';
  if (status === 'PARTIALLY_IMPLEMENTED')
    return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

// ── Evidence Detail Panel ─────────────────────────────────────────────────────

export function EvidenceDetailPanel({
  evidence,
  onClose,
}: {
  evidence: EvidenceItem;
  onClose: () => void;
}) {
  const { t } = useTranslation('compliance');
  const [downloading, setDownloading] = useState(false);

  // Related tests — those linked to the same control
  const { data: allTests = [] } = useQuery({
    queryKey: ['tests', 'list', {}],
    queryFn: async () => {
      const r = await testsService.listTests({ limit: 999 });
      return r.data ?? [];
    },
    staleTime: 30_000,
  });

  const relatedTests = evidence.control
    ? (allTests as TestRecord[])
        .filter((t) => t.controls?.some((c) => c.id === evidence.control!.id))
        .slice(0, 8)
    : [];

  const handleDownload = async () => {
    if (!evidence.fileUrl) return;
    setDownloading(true);
    try {
      await evidenceService.downloadEvidence(
        evidence.id,
        evidence.fileName ?? `evidence-${evidence.id.slice(0, 8)}`,
      );
    } catch {
      toast.error(t('evidenceDetail.downloadFailed'));
    } finally {
      setDownloading(false);
    }
  };

  const isFile = !!evidence.fileUrl;

  return (
    <div className="fixed inset-0 z-40 flex justify-end" aria-modal="true">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-50 w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-200 bg-white sticky top-0">
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge variant={typeVariant(evidence.type)}>
                {evidence.type}
              </Badge>
              {evidence.automated && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  <Cpu className="w-3 h-3" /> {t('evidenceDetail.automated')}
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold text-gray-900 leading-snug truncate">
              {evidence.fileName ?? `evidence-${evidence.id.slice(0, 8)}`}
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed mt-1">
              {evidence.automated
                ? t('evidenceDetail.descAutomated')
                : evidence.type === 'FILE'
                  ? t('evidenceDetail.descFile')
                  : evidence.type === 'SCREENSHOT'
                    ? t('evidenceDetail.descScreenshot')
                    : t('evidenceDetail.descGeneric')}
            </p>
            {evidence.control && (
              <p className="text-xs text-gray-500 mt-1">
                {t('evidenceDetail.linkedToControl')}{' '}
                <span className="font-mono font-semibold text-blue-700">
                  {evidence.control.isoReference}
                </span>{' '}
                — {evidence.control.title}
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

        {/* KPI strip */}
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p
                className={`text-2xl font-bold ${isFile ? 'text-green-600' : 'text-gray-400'}`}
              >
                {isFile ? '✓' : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{t('evidenceDetail.fileAttached')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {relatedTests.length}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{t('evidenceDetail.relatedTests')}</p>
            </div>
            <div className="text-center">
              <p
                className={`text-2xl font-bold ${evidence.control ? 'text-blue-600' : 'text-gray-400'}`}
              >
                {evidence.control ? '✓' : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{t('evidenceDetail.controlLinked')}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="rounded-xl bg-slate-100 p-1 h-auto">
              <TabsTrigger value="overview">{t('evidenceDetail.overview')}</TabsTrigger>
              <TabsTrigger value="control">{t('evidenceDetail.control')}</TabsTrigger>
              <TabsTrigger value="tests">
                {t('evidenceDetail.testsTab', { count: relatedTests.length })}
              </TabsTrigger>
              {isFile && <TabsTrigger value="file">{t('evidenceDetail.file')}</TabsTrigger>}
            </TabsList>

            {/* Overview tab */}
            <TabsContent value="overview" className="space-y-4 mt-0">
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <Hash className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-800">
                    {t('evidenceDetail.evidenceMetadata')}
                  </span>
                </div>
                <div className="p-4">
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                        {t('evidenceDetail.type')}
                      </dt>
                      <dd className="mt-1">
                        <Badge variant={typeVariant(evidence.type)}>
                          {evidence.type}
                        </Badge>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                        {t('evidenceDetail.collection')}
                      </dt>
                      <dd className="mt-1 text-gray-700">
                        {evidence.automated ? t('evidenceDetail.automated') : t('evidenceDetail.manual')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {t('evidenceDetail.collected')}
                      </dt>
                      <dd className="mt-1 text-gray-700">
                        {fmtDate(evidence.createdAt)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1">
                        <User className="w-3 h-3" /> {t('evidenceDetail.collectedBy')}
                      </dt>
                      <dd className="mt-1 text-gray-700">
                        {evidence.collectedBy ?? t('evidenceDetail.system')}
                      </dd>
                    </div>
                    {evidence.hash && (
                      <div className="col-span-2">
                        <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1">
                          <Shield className="w-3 h-3" /> {t('evidenceDetail.integrityHash')}
                        </dt>
                        <dd className="mt-1 font-mono text-xs text-gray-600 break-all bg-gray-50 rounded px-2 py-1 border border-gray-100">
                          {evidence.hash}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>

              {evidence.control && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <Link2 className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-800">
                      {t('evidenceDetail.linkedControl')}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-semibold bg-blue-50 text-blue-800 border border-blue-200 flex-shrink-0">
                          {evidence.control.isoReference}
                        </span>
                        <p className="text-sm font-medium text-gray-800">
                          {evidence.control.title}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium border flex-shrink-0 ml-2 ${controlStatusColor(evidence.control.status)}`}
                      >
                        {evidence.control.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Control tab */}
            <TabsContent value="control" className="space-y-3 mt-0">
              {!evidence.control ? (
                <div className="text-center py-12 text-gray-400">
                  <Link2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">{t('evidenceDetail.noControlLinked')}</p>
                </div>
              ) : (
                <div className="rounded-xl border border-gray-200 p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-blue-50 text-blue-800 border border-blue-200 mb-2">
                        {evidence.control.isoReference}
                      </span>
                      <h3 className="text-base font-semibold text-gray-900 mt-1">
                        {evidence.control.title}
                      </h3>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium border flex-shrink-0 ${controlStatusColor(evidence.control.status)}`}
                    >
                      {evidence.control.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {t('evidenceDetail.supportsControl')}{' '}
                    <span className="font-semibold text-gray-600">
                      {evidence.control.isoReference}
                    </span>
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Tests tab */}
            <TabsContent value="tests" className="space-y-3 mt-0">
              {relatedTests.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FlaskConical className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">{t('evidenceDetail.noTestsLinked')}</p>
                </div>
              ) : (
                (relatedTests as any[]).map((test: any) => {
                  const badgeCls: Record<string, string> = {
                    OK: 'bg-green-100 text-green-700 border-green-200',
                    Overdue: 'bg-red-100 text-red-700 border-red-200',
                    Due_soon: 'bg-amber-100 text-amber-700 border-amber-200',
                    Needs_remediation:
                      'bg-orange-100 text-orange-700 border-orange-200',
                  };
                  return (
                    <div
                      key={test.id}
                      className="flex items-start justify-between p-4 rounded-xl border border-gray-100 bg-gray-50 gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {test.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {test.type} · {test.category}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium border flex-shrink-0 ${badgeCls[test.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}
                      >
                        {test.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  );
                })
              )}
            </TabsContent>

            {/* File tab */}
            {isFile && (
              <TabsContent value="file" className="space-y-4 mt-0">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 truncate max-w-xs">
                        {evidence.fileName ??
                          `evidence-${evidence.id.slice(0, 8)}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {t('evidenceDetail.attachedFile')}
                      </p>
                    </div>
                  </div>
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
                    {downloading ? t('evidenceDetail.downloading') : t('evidenceDetail.downloadFile')}
                  </button>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
