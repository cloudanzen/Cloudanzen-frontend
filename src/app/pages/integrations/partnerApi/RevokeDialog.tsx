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
import { partnerService, PartnerApiKey } from '@/services/api/partner';

/** Revoke confirmation dialog */
export function RevokeDialog({
  keyRecord,
  onConfirm,
  onClose,
}: {
  keyRecord: PartnerApiKey;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation('integrations');
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await partnerService.revokeKey(keyRecord.id);
      onConfirm();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-red-700">
            {t('partnerApi.revoke.title')}
          </DialogTitle>
          <DialogDescription>
            {t('partnerApi.revoke.description', { name: keyRecord.name })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            {t('partnerApi.revoke.cancel')}
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={busy}>
            {busy
              ? t('partnerApi.revoke.revoking')
              : t('partnerApi.revoke.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
