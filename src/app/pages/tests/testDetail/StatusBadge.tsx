import { useTranslation } from 'react-i18next';
import type { TestStatus } from '@/services/api/tests';
import { STATUS_CONFIG, LAST_RESULT_CONFIG } from './constants';

export function StatusBadge({ status }: { status: TestStatus }) {
  const { t } = useTranslation('tests');
  const cfg = STATUS_CONFIG[status] ?? {
    key: status,
    label: status,
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {t(`statusBadge.${cfg.key}`, cfg.label)}
    </span>
  );
}

export function LastResultBadge({ result }: { result: string }) {
  const { t } = useTranslation('tests');
  const cfg = LAST_RESULT_CONFIG[result] ?? {
    key: result,
    label: result,
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {t(`lastResultBadge.${cfg.key}`, cfg.label)}
    </span>
  );
}
