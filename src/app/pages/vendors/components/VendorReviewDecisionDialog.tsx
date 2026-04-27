import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { RiskTier, VendorReviewDecision } from '@/services/api/vendors';

export function VendorReviewDecisionDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    decision: VendorReviewDecision;
    decisionNotes: string;
    residualTier?: RiskTier;
  }) => Promise<void>;
  saving: boolean;
}) {
  const { t } = useTranslation('vendors');
  const [decision, setDecision] = useState<VendorReviewDecision>('APPROVED');
  const [residualTier, setResidualTier] = useState<RiskTier>('MEDIUM');
  const [notes, setNotes] = useState('');

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('review.decisionTitle')}</DialogTitle>
          <DialogDescription>{t('review.decisionDescription')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <select
            value={decision}
            onChange={(e) => setDecision(e.target.value as VendorReviewDecision)}
            className="rounded-md border border-border px-3 py-2 text-sm"
          >
            <option value="APPROVED">{t('review.decision.APPROVED')}</option>
            <option value="APPROVED_WITH_CONDITIONS">{t('review.decision.APPROVED_WITH_CONDITIONS')}</option>
            <option value="REJECTED">{t('review.decision.REJECTED')}</option>
          </select>
          {decision !== 'REJECTED' && (
            <select
              value={residualTier}
              onChange={(e) => setResidualTier(e.target.value as RiskTier)}
              className="rounded-md border border-border px-3 py-2 text-sm"
            >
              <option value="LOW">{t('riskLevel.LOW')}</option>
              <option value="MEDIUM">{t('riskLevel.MEDIUM')}</option>
              <option value="HIGH">{t('riskLevel.HIGH')}</option>
              <option value="CRITICAL">{t('riskLevel.CRITICAL')}</option>
            </select>
          )}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('review.decisionNotesPlaceholder')}
            className="min-h-[100px] rounded-md border border-border px-3 py-2 text-sm"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('dialog.cancel')}
          </Button>
          <Button
            disabled={props.saving || !notes.trim()}
            onClick={async () => {
              await props.onSubmit({
                decision,
                decisionNotes: notes.trim(),
                residualTier: decision === 'REJECTED' ? undefined : residualTier,
              });
              setNotes('');
            }}
          >
            {props.saving ? t('dialog.saving') : t('review.submitDecision')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
