import React from 'react';
import { useTranslation } from 'react-i18next';
import { Control, ColumnConfig, ControlStatus } from './types';

interface ControlsTableProps {
  controls: Control[];
  columns: ColumnConfig[];
  onSort?: (column: string) => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSelect?: (control: Control) => void;
}

const STATUS_CONFIG: Record<
  ControlStatus,
  { key: string; bg: string; text: string; dot: string }
> = {
  [ControlStatus.IMPLEMENTED]: {
    key: 'controls.status.IMPLEMENTED',
    bg: 'bg-green-50',
    text: 'text-green-700',
    dot: 'bg-green-500',
  },
  [ControlStatus.PARTIALLY_IMPLEMENTED]: {
    key: 'controls.status.PARTIALLY_IMPLEMENTED',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  [ControlStatus.NOT_IMPLEMENTED]: {
    key: 'controls.status.NOT_IMPLEMENTED',
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
};

export function ControlsTable({
  controls,
  columns,
  onSort,
  sortColumn,
  sortDirection,
  onSelect,
}: ControlsTableProps) {
  const { t } = useTranslation('compliance');
  const visibleColumns = columns.filter((c) => c.visible);

  const handleSort = (columnId: string) => {
    const col = columns.find((c) => c.id === columnId);
    if (onSort && col?.sortable) onSort(columnId);
  };

  const renderCell = (control: Control, column: ColumnConfig) => {
    switch (column.id) {
      case 'isoReference':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            {control.isoReference}
          </span>
        );

      case 'title':
        return (
          <span className="font-medium text-gray-900 text-sm leading-snug">
            {control.title}
          </span>
        );

      case 'description':
        return (
          <span
            className="text-gray-500 text-sm leading-relaxed line-clamp-2"
            title={control.description}
          >
            {control.description}
          </span>
        );

      case 'status': {
        const cfg = STATUS_CONFIG[control.status as ControlStatus] ?? {
          key: '',
          bg: 'bg-gray-50',
          text: 'text-gray-600',
          dot: 'bg-gray-400',
        };
        const label = cfg.key ? t(cfg.key) : control.status;
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {label}
          </span>
        );
      }

      case 'justification':
        return (
          <span className="text-gray-500 text-sm">
            {control.justification || <span className="text-gray-300">—</span>}
          </span>
        );

      case 'createdAt':
        return (
          <span className="text-sm text-gray-500 whitespace-nowrap">
            {new Date(control.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          {/* Table head */}
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {visibleColumns.map((col) => (
                <th
                  key={col.id}
                  className={[
                    'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider select-none',
                    col.sortable
                      ? 'cursor-pointer hover:bg-gray-100 transition-colors'
                      : '',
                  ].join(' ')}
                  style={{ minWidth: col.minWidth }}
                  onClick={() => handleSort(col.id)}
                  aria-sort={
                    sortColumn === col.id
                      ? sortDirection === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                >
                  <span className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && (
                      <SortIcon active={sortColumn === col.id} direction={sortDirection} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          {/* Table body */}
          <tbody className="divide-y divide-gray-100">
            {controls.map((control) => (
              <tr
                key={control.id}
                onClick={() => onSelect?.(control)}
                className={`hover:bg-blue-50/40 transition-colors group ${onSelect ? 'cursor-pointer' : ''}`}
              >
                {visibleColumns.map((col) => (
                  <td
                    key={col.id}
                    className="px-4 py-3 align-top"
                    style={{ minWidth: col.minWidth }}
                  >
                    {renderCell(control, col)}
                  </td>
                ))}
                {onSelect && (
                  <td className="px-3 py-3 text-right align-middle">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-blue-600 font-medium">View →</span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SortIcon({
  active,
  direction,
}: {
  active: boolean;
  direction?: 'asc' | 'desc';
}) {
  return (
    <span className={`flex flex-col -space-y-1 ${active ? 'opacity-100' : 'opacity-30'}`}>
      <svg
        className={`w-3 h-3 ${active && direction === 'asc' ? 'text-blue-600' : 'text-gray-400'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M10 3l6 6H4l6-6z" />
      </svg>
      <svg
        className={`w-3 h-3 ${active && direction === 'desc' ? 'text-blue-600' : 'text-gray-400'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M10 17l6-6H4l6 6z" />
      </svg>
    </span>
  );
}
