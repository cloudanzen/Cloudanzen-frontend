import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ColumnConfig } from './types';

interface ColumnSelectorProps {
  columns: ColumnConfig[];
  onColumnToggle: (columnId: string) => void;
}

export function ColumnSelector({
  columns,
  onColumnToggle,
}: ColumnSelectorProps) {
  const { t } = useTranslation('compliance');
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (columnId: string) => {
    onColumnToggle(columnId);
    setIsOpen(false);
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
    return undefined;
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        aria-label={t('controls.columnSelector.selectColumns')}
        aria-expanded={isOpen}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
        <span className="font-medium">
          {t('controls.columnSelector.columns')}
        </span>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">
                {t('controls.columnSelector.selectColumns')}
              </h3>
              <div className="space-y-3">
                {columns.map((column) => (
                  <label
                    key={column.id}
                    className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-3 rounded-md transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={column.visible}
                      onChange={() => handleToggle(column.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {column.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
