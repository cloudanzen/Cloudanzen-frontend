import { diffWords } from 'diff';
import { X } from 'lucide-react';

import type { PolicyVersion } from '@/services/api/types';

function tipTapText(node: unknown): string {
  if (!node || typeof node !== 'object') return '';
  const record = node as { text?: unknown; content?: unknown };
  const text = typeof record.text === 'string' ? record.text : '';
  const children = Array.isArray(record.content)
    ? record.content.map(tipTapText).join(' ')
    : '';
  return `${text} ${children}`.trim();
}

function versionText(version: PolicyVersion): string {
  const body = tipTapText(version.content);
  const localeText = (version.locales ?? [])
    .map((locale) => [
      `Locale: ${locale.locale}`,
      tipTapText(locale.content),
      locale.documentUrl ?? '',
      locale.pdfUrl ?? '',
    ].filter(Boolean).join('\n'))
    .filter(Boolean)
    .join('\n\n');
  return [
    version.name,
    version.description ?? '',
    body,
    version.documentUrl ?? '',
    version.pdfUrl ?? '',
    localeText,
  ].filter(Boolean).join('\n\n');
}

export function PolicyVersionDiff({
  base,
  compare,
  onClose,
}: {
  base: PolicyVersion;
  compare: PolicyVersion;
  onClose: () => void;
}) {
  const parts = diffWords(versionText(base), versionText(compare));

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative ml-auto flex h-full w-full max-w-4xl flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Compare v{base.versionNumber} to v{compare.versionNumber}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close diff"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm leading-7 text-gray-800">
            {parts.map((part, index) => (
              <span
                key={`${index}-${part.value.slice(0, 12)}`}
                className={
                  part.added
                    ? 'bg-green-100 text-green-800'
                    : part.removed
                      ? 'bg-red-100 text-red-800 line-through'
                      : undefined
                }
              >
                {part.value}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
