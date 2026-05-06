import { useEffect, useState, useCallback } from 'react';
import { X, Download, ExternalLink, FileText, Loader2, AlertTriangle } from 'lucide-react';
import { policiesService } from '@/services/api/policies';

type PreviewState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'blob'; blobUrl: string; contentType: string }
  | { status: 'embedded'; url: string }
  | { status: 'external'; url: string }
  | { status: 'error'; message: string };

interface Props {
  policyId: string;
  policyName: string;
  documentUrl: string;
  versionId?: string;
  locale?: 'en' | 'ja';
  onClose: () => void;
  /** Called when the user clicks the Download fallback */
  onDownload: () => void;
}

function isPdf(contentType: string) {
  return contentType.includes('application/pdf');
}

export function PolicyPreviewSheet({
  policyId,
  policyName,
  documentUrl,
  versionId,
  locale = 'en',
  onClose,
  onDownload,
}: Props) {
  const [preview, setPreview] = useState<PreviewState>({ status: 'idle' });

  const load = useCallback(async () => {
    setPreview({ status: 'loading' });
    try {
      const result = await policiesService.previewPolicyDocument(policyId, { versionId, locale });
      if ('embedded' in result) {
        setPreview({ status: 'embedded', url: result.url });
      } else if ('external' in result) {
        setPreview({ status: 'external', url: result.url });
      } else {
        setPreview({
          status: 'blob',
          blobUrl: result.blobUrl,
          contentType: result.contentType,
        });
      }
    } catch {
      setPreview({ status: 'error', message: 'Failed to load preview.' });
    }
  }, [policyId, versionId, locale]);

  useEffect(() => {
    load();
    // Revoke object URL when sheet unmounts to avoid memory leaks
    return () => {
      setPreview((prev) => {
        if (prev.status === 'blob') URL.revokeObjectURL(prev.blobUrl);
        return { status: 'idle' };
      });
    };
  }, [load]);

  // Derive a display filename from the documentUrl
  const filename = documentUrl.split('/').pop() ?? policyName;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — right-side sheet */}
      <div className="relative ml-auto flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">{policyName}</p>
            <p className="truncate text-xs text-gray-400">{filename}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onDownload}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden">
          {preview.status === 'idle' || preview.status === 'loading' ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-gray-400">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-sm">Loading preview…</p>
              </div>
            </div>
          ) : preview.status === 'error' ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-center">
                <AlertTriangle className="h-10 w-10 text-amber-400" />
                <p className="text-sm font-medium text-gray-700">{preview.message}</p>
                <button
                  onClick={onDownload}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Download instead
                </button>
              </div>
            </div>
          ) : preview.status === 'external' ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-4 text-center px-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
                  <ExternalLink className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    This document is hosted externally
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Open it in a new tab to view the content.
                  </p>
                </div>
                <a
                  href={preview.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in new tab
                </a>
              </div>
            </div>
          ) : preview.status === 'embedded' ? (
            <iframe
              src={preview.url}
              title={`Preview: ${policyName}`}
              className="h-full w-full border-0"
              allow="autoplay"
            />
          ) : isPdf(preview.contentType) ? (
            <iframe
              src={preview.blobUrl}
              title={`Preview: ${policyName}`}
              className="h-full w-full border-0"
            />
          ) : (
            /* Non-PDF blob (Word, Excel, etc.) — can't embed, offer download */
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-4 text-center px-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 border border-gray-200">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Inline preview not available for this file type
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Download the file to open it in the appropriate application.
                  </p>
                </div>
                <button
                  onClick={onDownload}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Download file
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
