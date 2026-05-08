import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { policiesService } from '@/services/api/policies';
import { Policy } from '@/services/api/types';
import { SortKey, getStatusCfg } from './types';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  FileText, CheckCircle2, ChevronUp, ChevronDown, ChevronsUpDown,
  Upload, Download, Eye, Loader2, User,
} from 'lucide-react';

// ── Sort Icon ───────────────────────────────────────────────────────────────

export function SortIcon({ active, direction }: { active: boolean; direction?: 'asc' | 'desc' }) {
  if (!active) return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-300" />;
  return direction === 'asc'
    ? <ChevronUp className="w-3.5 h-3.5 text-blue-600" />
    : <ChevronDown className="w-3.5 h-3.5 text-blue-600" />;
}

// ── Policies Table ──────────────────────────────────────────────────────────

export function PoliciesTable({
  policies, sortKey, sortDir, onSort, onUpload, onSelect,
}: {
  policies: Policy[];
  sortKey: SortKey;
  sortDir: 'asc' | 'desc';
  onSort: (key: SortKey) => void;
  onUpload: (p: Policy) => void;
  onSelect?: (p: Policy) => void;
}) {
  const { t } = useTranslation('compliance');
  const me = useCurrentUser();
  const preferredLocale = me?.preferredLocale === 'ja' ? 'ja' : 'en';
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (policy: Policy) => {
    setDownloading(policy.id);
    try {
      const name = policy.documentUrl
        ? policy.documentUrl.split('/').pop() ?? `${policy.name}.pdf`
        : `${policy.name}.pdf`;
      await policiesService.downloadPolicyDocument(policy.id, name, {
        locale: preferredLocale,
        onLocaleFallback: () => toast.info('Japanese version not available - showing English'),
      });
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : 'Failed to download policy');
    } finally {
      setDownloading(null);
    }
  };

  const columns: { key: SortKey; label: string; sortable?: boolean; minWidth?: number }[] = [
    { key: 'name',      label: t('policiesPage.table.policyName'), sortable: true, minWidth: 240 },
    { key: 'version',   label: t('policiesPage.table.version'),    sortable: true, minWidth: 90  },
    { key: 'status',    label: t('policiesPage.table.status'),     sortable: true, minWidth: 120 },
    { key: 'createdAt', label: t('policiesPage.table.created'),    sortable: true, minWidth: 130 },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={[
                    'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider select-none',
                    col.sortable ? 'cursor-pointer hover:bg-gray-100 transition-colors' : '',
                  ].join(' ')}
                  style={{ minWidth: col.minWidth }}
                  onClick={() => col.sortable && onSort(col.key)}
                >
                  <span className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && <SortIcon active={sortKey === col.key} direction={sortDir} />}
                  </span>
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: 140 }}>
                {t('policiesPage.table.owner')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: 120 }}>
                {t('policiesPage.table.approvedBy')}
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: 140 }}>
                {t('policiesPage.table.document')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {policies.map(policy => {
              const cfg = getStatusCfg(policy.status);
              const hasFile = !!policy.documentUrl;
              const isDownloading = downloading === policy.id;

              return (
                <tr
                  key={policy.id}
                  className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                  onClick={() => onSelect?.(policy)}
                >
                  {/* Name */}
                  <td className="px-4 py-3.5 align-middle" style={{ minWidth: 240 }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-gray-900 leading-snug">{policy.name}</p>
                        <span className="opacity-0 group-hover:opacity-100 text-xs text-blue-500 transition-opacity">View →</span>
                      </div>
                    </div>
                  </td>

                  {/* Version */}
                  <td className="px-4 py-3.5 align-middle" style={{ minWidth: 90 }}>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                      v{policy.version}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5 align-middle" style={{ minWidth: 120 }}>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {t(`policiesPage.statusLabels.${cfg.key}`, { defaultValue: cfg.label })}
                    </span>
                  </td>

                  {/* Created */}
                  <td className="px-4 py-3.5 align-middle text-sm text-gray-500 whitespace-nowrap" style={{ minWidth: 130 }}>
                    {new Date(policy.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>

                  {/* Owner */}
                  <td className="px-4 py-3.5 align-middle text-sm text-gray-500" style={{ minWidth: 140 }}>
                    {policy.owner ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <User className="w-3 h-3 text-blue-600" />
                        </span>
                        <span className="truncate max-w-[100px]" title={policy.owner.email}>
                          {policy.owner.name || policy.owner.email}
                        </span>
                      </span>
                    ) : (
                      <span className="text-gray-300">{t('policiesPage.table.unassigned')}</span>
                    )}
                  </td>

                  {/* Approved By */}
                  <td className="px-4 py-3.5 align-middle text-sm text-gray-500" style={{ minWidth: 120 }}>
                    {policy.approvedBy ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                        </span>
                        {policy.approvedBy}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>

                  {/* Document actions */}
                  <td className="px-4 py-3.5 align-middle" style={{ minWidth: 140 }} onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Upload / Replace */}
                      <button
                        onClick={() => onUpload(policy)}
                        title={hasFile ? t('policiesPage.table.replaceDocument') : t('policiesPage.table.uploadDocument')}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 text-gray-600 transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {hasFile ? t('policiesPage.table.replace') : t('policiesPage.table.upload')}
                      </button>

                      {/* Download */}
                      {hasFile && (
                        <button
                          onClick={() => handleDownload(policy)}
                          disabled={isDownloading}
                          title={t('policiesPage.table.downloadDocument')}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white hover:bg-green-50 hover:border-green-300 hover:text-green-700 text-gray-600 transition-colors disabled:opacity-50"
                        >
                          {isDownloading
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Download className="w-3.5 h-3.5" />}
                          {isDownloading ? '…' : t('policiesPage.table.download')}
                        </button>
                      )}

                      {/* View in new tab — for external URLs (not local disk or S3 keys) */}
                      {hasFile && policy.documentUrl && !policy.documentUrl.startsWith('/files/') && !policy.documentUrl.startsWith('s3://') && (
                        <a
                          href={policy.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={t('policiesPage.table.viewInNewTab')}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 text-gray-600 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {t('policiesPage.table.view')}
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
