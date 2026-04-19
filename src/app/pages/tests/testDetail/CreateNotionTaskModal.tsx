import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { notionService, NotionAvailableDatabase } from '@/services/api/notion';

function NotionPanelIcon() {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        width="100"
        height="100"
        rx="15"
        fill="white"
        stroke="#e5e7eb"
        strokeWidth="2"
      />
      <path
        d="M12 12l53 3.5c6.3.4 7.8 1 10.2 3.8l8.3 11.3c1.4 1.9 1.9 3.2 1.9 8.5v43.7c0 5.9-2.2 9.4-9.7 9.9L17.4 95.5c-5.5.3-8.1-1.1-10.8-4.4L1.9 83.5C.3 81.3 0 79.8 0 77.6V21.8C0 16.3 2.8 12.4 12 12z"
        fill="white"
      />
      <path
        d="M65 19.5L18 16.2c-5.2-.3-7.6 2.5-7.6 6.9v52.8c0 4.6 1.4 7 5.7 7.4l56.4 3.3c4.5.3 6.9-1.8 6.9-6.7V27.2c0-4.5-2-7-14.4-7.7zM56 29.7L28 28v-.1c-1.2-.1-2.2-1.1-2.2-2.2 0-1.3 1.1-2.2 2.5-2.2l29.1 1.9c1.2.1 2 1 2 2.2 0 1.2-1.5 2.3-3.4 2.1zM22 72V38.3c0-1.8 1.6-2.8 3-1.9L59 56c1.2.7 1.2 2.3 0 3L25 72.7c-1.4.9-3-.1-3-1.7z"
        fill="#1a1a1a"
      />
    </svg>
  );
}

export { NotionPanelIcon };

export function CreateNotionTaskModal({
  testId,
  testName,
  controlId,
  onClose,
  onCreated,
}: {
  testId: string;
  testName: string;
  controlId?: string;
  onClose: () => void;
  onCreated: (url: string) => void;
}) {
  const { t } = useTranslation('tests');
  const [dbs, setDbs] = useState<NotionAvailableDatabase[]>([]);
  const [loadingDbs, setLoadingDbs] = useState(true);
  const [selectedDb, setSelectedDb] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const taskTitle = `Remediate: ${testName}`;

  React.useEffect(() => {
    notionService
      .getDatabases()
      .then((res) => {
        const linked = (res.data ?? []).filter((d) => d.linked);
        setDbs(linked);
        if (linked.length === 1) setSelectedDb(linked[0]!.id);
      })
      .catch(() => setError(t('notionTask.loadFailed')))
      .finally(() => setLoadingDbs(false));
  }, [t]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDb) {
      setError(t('notionTask.selectDbError'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await notionService.createTask({
        testId,
        databaseId: selectedDb,
        title: taskTitle,
        dueDate: dueDate || undefined,
        controlId,
      });
      onCreated(res.data.notionPageUrl);
      onClose();
    } catch (err: unknown) {
      setError(
        (err as { message?: string })?.message ?? t('notionTask.createFailed'),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-1">{t('notionTask.title')}</h2>
        <p className="text-sm text-gray-500 mb-4">
          {t('notionTask.description')}
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('notionTask.taskTitle')}
            </label>
            <input
              type="text"
              value={taskTitle}
              readOnly
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('notionTask.notionDatabase')}
            </label>
            {loadingDbs ? (
              <p className="text-sm text-gray-400 animate-pulse">
                {t('notionTask.loadingDatabases')}
              </p>
            ) : dbs.length === 0 ? (
              <p className="text-sm text-red-600">
                {t('notionTask.noDatabases')}
              </p>
            ) : (
              <select
                value={selectedDb}
                onChange={(e) => setSelectedDb(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="">{t('notionTask.selectDatabase')}</option>
                {dbs.map((db) => (
                  <option key={db.id} value={db.id}>
                    {db.title}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('notionTask.dueDateLabel')}{' '}
              <span className="text-gray-400 font-normal">
                {t('notionTask.optional')}
              </span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          {controlId && (
            <div className="text-xs text-gray-500 bg-gray-50 rounded px-3 py-2">
              {t('notionTask.controlLinked', { controlId: controlId })}
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={submitting || dbs.length === 0}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting
                ? t('notionTask.creating')
                : t('notionTask.createTask')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('notionTask.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
