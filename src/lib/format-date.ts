import i18n from '../i18n';

function getLocale(): string {
  const lang = i18n.language ?? 'en';
  return lang === 'ja' ? 'ja-JP' : 'en-US';
}

/**
 * Format an ISO date string as a short locale date (e.g. "Mar 21, 2026" / "2026年3月21日").
 * Returns '—' for null/undefined/empty values.
 */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(getLocale(), {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format an ISO date string with time (e.g. "Mar 21, 2026, 2:30 PM" / "2026年3月21日 14:30").
 * Returns '—' for null/undefined/empty values.
 */
export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(getLocale(), {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
