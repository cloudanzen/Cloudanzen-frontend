import { useTranslation } from 'react-i18next';
import type { TestStatus } from '@/services/api/tests';
import { STATUS_CONFIG } from './config';

export function StatusBadge({ status }: { status: TestStatus }) {
  const { t } = useTranslation('tests');
  const cfg = STATUS_CONFIG[status] ?? { label: status, bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {t(`statusBadge.${status}`, cfg.label)}
    </span>
  );
}

export function SortIcon({ active, direction }: { active: boolean; direction?: 'asc' | 'desc' }) {
  return (
    <span className={`flex flex-col -space-y-1 ${active ? 'opacity-100' : 'opacity-30'}`}>
      <svg className={`w-3 h-3 ${active && direction === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M10 3l6 6H4l6-6z" /></svg>
      <svg className={`w-3 h-3 ${active && direction === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M10 17l6-6H4l6 6z" /></svg>
    </span>
  );
}
