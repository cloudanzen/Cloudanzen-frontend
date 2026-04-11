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
import { Badge } from '@/app/components/ui/badge';
import { PartnerScanResultDetail } from '@/services/api/partner';
import { RESULT_META, SEVERITY_META } from './helpers';
import { fmtDateTime } from '@/lib/format-date';

/** Result detail slide-over */
export function ResultDetailDialog({
  result,
  onClose,
}: {
  result: PartnerScanResultDetail;
  onClose: () => void;
}) {
  const { t } = useTranslation('integrations');
  const pass = result.findings.filter((f) => f.result === 'pass').length;
  const warn = result.findings.filter((f) =>
    ['warn', 'warning'].includes(f.result),
  ).length;
  const fail = result.findings.filter((f) => f.result === 'fail').length;

  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {result.toolName} — {t('partnerApi.resultDetail.scanReport')}
          </DialogTitle>
          <DialogDescription>{fmtDateTime(result.scannedAt)}</DialogDescription>
        </DialogHeader>

        {/* Summary bar */}
        <div className="grid grid-cols-3 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{pass}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wide">
              {t('partnerApi.resultDetail.pass')}
            </p>
          </div>
          <div className="text-center border-x border-slate-200">
            <p className="text-2xl font-bold text-yellow-600">{warn}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wide">
              {t('partnerApi.resultDetail.warning')}
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{fail}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wide">
              {t('partnerApi.resultDetail.fail')}
            </p>
          </div>
        </div>

        {/* Findings list */}
        <div className="space-y-2 mt-2">
          {result.findings.map((f, i) => {
            const rm = (RESULT_META[f.result?.toLowerCase() ?? ''] ??
              RESULT_META['fail'])!;
            const sm = (SEVERITY_META[f.severity?.toLowerCase() ?? ''] ??
              SEVERITY_META['medium'])!;
            return (
              <div
                key={i}
                className="rounded-lg border border-slate-200 bg-white px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span
                      className={`mt-0.5 shrink-0 w-2 h-2 rounded-full ${rm.dot}`}
                    />
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {f.testName}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-xs ${rm.className}`}
                    >
                      {rm.label}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs ${sm.className}`}
                    >
                      {sm.label}
                    </Badge>
                    {f.isoControl && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-slate-50 text-slate-600 border-slate-200 font-mono"
                      >
                        {f.isoControl}
                      </Badge>
                    )}
                  </div>
                </div>
                {f.detail && (
                  <p className="mt-1.5 pl-4 text-xs text-slate-500">
                    {f.detail}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('partnerApi.resultDetail.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
