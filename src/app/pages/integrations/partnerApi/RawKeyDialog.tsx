import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { ShieldIcon, CopyIcon } from './icons';
import { COPY_FEEDBACK_MS } from '@/lib/constants';

/** Raw key reveal dialog — shown once after issuing */
export function RawKeyDialog({
  rawKey,
  keyName,
  toolName,
  onClose,
}: {
  rawKey: string;
  keyName: string;
  toolName: string;
  onClose: () => void;
}) {
  const { t } = useTranslation('integrations');
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(rawKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
    });
  }

  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-700">
            <ShieldIcon className="w-5 h-5" /> {t('partnerApi.rawKey.title')}
          </DialogTitle>
          <DialogDescription>
            {t('partnerApi.rawKey.descriptionPrefix')} <strong>not</strong>{' '}
            {t('partnerApi.rawKey.descriptionMiddle')}{' '}
            <strong>{toolName}</strong> team.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-emerald-600">
            {keyName}
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all rounded bg-white px-3 py-2 text-xs font-mono text-slate-800 shadow-sm border border-slate-200">
              {rawKey}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={copy}
              className="shrink-0"
            >
              {copied ? (
                t('partnerApi.rawKey.copied')
              ) : (
                <>
                  <CopyIcon className="mr-1 w-3.5 h-3.5" />{' '}
                  {t('partnerApi.rawKey.copy')}
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3">
          <p className="text-xs text-amber-800">
            <strong>{t('partnerApi.rawKey.securityReminder')}</strong>{' '}
            {t('partnerApi.rawKey.securityReminderText')}
          </p>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>{t('partnerApi.rawKey.done')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
