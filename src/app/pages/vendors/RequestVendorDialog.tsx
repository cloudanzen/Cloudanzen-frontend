import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { QK } from '@/lib/queryKeys';
import { vendorsService } from '@/services/api/vendors';
import { ApiError } from '@/services/api/client';

export function RequestVendorDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation('vendors');
  const qc = useQueryClient();
  const [form, setForm] = useState({
    vendorName: '',
    vendorWebsite: '',
    businessJustification: '',
    dataAccessRequested: '',
    expectedUserCount: '',
  });

  const mutation = useMutation({
    mutationFn: () =>
      vendorsService.intake.create({
        vendorName: form.vendorName.trim(),
        vendorWebsite: form.vendorWebsite.trim() || null,
        businessJustification: form.businessJustification.trim(),
        dataAccessRequested: form.dataAccessRequested.trim() || null,
        expectedUserCount: form.expectedUserCount
          ? Number(form.expectedUserCount)
          : null,
      }),
    onSuccess: async () => {
      setForm({
        vendorName: '',
        vendorWebsite: '',
        businessJustification: '',
        dataAccessRequested: '',
        expectedUserCount: '',
      });
      props.onOpenChange(false);
      toast.success(t('intake.requestSubmitted'));
      await qc.invalidateQueries({ queryKey: QK.vendorIntakeRequests() });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : t('intake.submitFailed'),
      );
    },
  });

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('intake.requestTitle')}</DialogTitle>
          <DialogDescription>{t('intake.requestDescription')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Input
            placeholder={t('intake.vendorName')}
            value={form.vendorName}
            onChange={(e) =>
              setForm((curr) => ({ ...curr, vendorName: e.target.value }))
            }
          />
          <Input
            placeholder={t('intake.vendorWebsite')}
            value={form.vendorWebsite}
            onChange={(e) =>
              setForm((curr) => ({ ...curr, vendorWebsite: e.target.value }))
            }
          />
          <textarea
            className="min-h-[96px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder={t('intake.businessJustification')}
            value={form.businessJustification}
            onChange={(e) =>
              setForm((curr) => ({
                ...curr,
                businessJustification: e.target.value,
              }))
            }
          />
          <Input
            placeholder={t('intake.dataAccessRequested')}
            value={form.dataAccessRequested}
            onChange={(e) =>
              setForm((curr) => ({
                ...curr,
                dataAccessRequested: e.target.value,
              }))
            }
          />
          <Input
            type="number"
            min={1}
            placeholder={t('intake.expectedUserCount')}
            value={form.expectedUserCount}
            onChange={(e) =>
              setForm((curr) => ({
                ...curr,
                expectedUserCount: e.target.value,
              }))
            }
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('dialog.cancel')}
          </Button>
          <Button
            disabled={
              mutation.isPending ||
              !form.vendorName.trim() ||
              !form.businessJustification.trim()
            }
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? t('intake.submitting') : t('intake.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
