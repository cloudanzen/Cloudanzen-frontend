import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Columns } from 'lucide-react';
import { ColumnConfig } from './config';

export function ColumnPicker({ columns, onToggle }: { columns: ColumnConfig[]; onToggle: (id: string) => void }) {
  const { t } = useTranslation('tests');
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors shadow-sm"
      >
        <Columns className="w-4 h-4" />
        <span className="hidden sm:inline">{t('validationsPage.columns')}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-20 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t('validationsPage.toggleColumns')}</p>
            <div className="space-y-2">
              {columns.filter(c => c.id !== 'actions').map(col => (
                <label key={col.id} className="flex items-center gap-2.5 cursor-pointer hover:bg-gray-50 p-1.5 rounded-md">
                  <input
                    type="checkbox"
                    checked={col.visible}
                    onChange={() => { onToggle(col.id); }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{col.label}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
