import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, CheckCircle } from 'lucide-react';

import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/app/components/ui/select';
import { QK } from '@/lib/queryKeys';
import {
  VendorMonitoringEventType,
  VendorMonitoringSeverity,
  CreateVendorMonitoringEventInput,
  vendorsService,
} from '@/services/api/vendors';

const EVENT_TYPES: VendorMonitoringEventType[] = [
  'BREACH', 'VULN_DISCLOSED', 'CERT_EXPIRED', 'CERT_REISSUED',
  'SOC2_REISSUED', 'SUBPROCESSOR_CHANGE', 'POLICY_UPDATE', 'ADVERSE_NEWS', 'OTHER',
];
const SEVERITIES: VendorMonitoringSeverity[] = ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const severityClass: Record<VendorMonitoringSeverity, string> = {
  INFO:     'bg-gray-100 text-gray-700',
  LOW:      'bg-blue-100 text-blue-700',
  MEDIUM:   'bg-amber-100 text-amber-700',
  HIGH:     'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString();
}

function emptyForm(): CreateVendorMonitoringEventInput {
  return {
    type: 'OTHER',
    severity: 'INFO',
    title: '',
    detectedAt: new Date().toISOString().slice(0, 10),
  };
}

export function VendorMonitoringTab({ vendorId }: { vendorId: string }) {
  const { t } = useTranslation('vendors');
  const qc = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: QK.vendorMonitoring(vendorId),
    queryFn: () => vendorsService.monitoring.list(vendorId),
  });

  const { data: status } = useQuery({
    queryKey: QK.vendorMonitoringStatus(vendorId),
    queryFn: () => vendorsService.monitoring.getStatus(vendorId),
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateVendorMonitoringEventInput>(emptyForm());

  const createMutation = useMutation({
    mutationFn: () => vendorsService.monitoring.create(vendorId, {
      ...form,
      detectedAt: new Date(form.detectedAt).toISOString(),
    }),
    onSuccess: () => {
      toast.success(t('monitoring.created'));
      qc.invalidateQueries({ queryKey: QK.vendorMonitoring(vendorId) });
      setOpen(false);
      setForm(emptyForm());
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : t('monitoring.createFailed')),
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (eventId: string) => vendorsService.monitoring.acknowledge(vendorId, eventId),
    onSuccess: () => {
      toast.success(t('monitoring.acknowledged'));
      qc.invalidateQueries({ queryKey: QK.vendorMonitoring(vendorId) });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : t('monitoring.acknowledgeFailed')),
  });

  if (isLoading) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{t('monitoring.loading')}</p>;
  }

  return (
    <div className="space-y-4">
      {status && (
        <Card>
          <CardContent className="grid gap-3 pt-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t('detail.nextReview')}
              </p>
              <p className="font-medium">{status.nextAssessmentAt ? fmtDate(status.nextAssessmentAt) : '—'}</p>
              <p className="text-xs text-muted-foreground">{t(`monitoring.state.${status.reviewState}`)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t('monitoring.unacknowledged')}
              </p>
              <p className="font-medium">{status.unacknowledgedEvents}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t('detail.lastAssessment')}
              </p>
              <p className="font-medium">{status.lastAssessmentAt ? fmtDate(status.lastAssessmentAt) : '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t('monitoring.lastIncident')}
              </p>
              <p className="font-medium">{status.lastIncidentAt ? fmtDate(status.lastIncidentAt) : '—'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('monitoring.log')}
        </Button>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            {t('monitoring.empty')}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {events.map((ev) => (
            <Card key={ev.id} className={ev.acknowledgedAt ? 'opacity-60' : ''}>
              <CardContent className="flex items-start justify-between gap-3 pt-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{ev.title}</p>
                    <Badge variant="outline" className={severityClass[ev.severity]}>
                      {ev.severity}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {ev.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{fmtDate(ev.detectedAt)}</p>
                  {ev.sourceUrl && (
                    <a href={ev.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">
                      {t('monitoring.source')}
                    </a>
                  )}
                  {ev.acknowledgedAt && ev.acknowledgedBy && (
                    <p className="text-xs text-muted-foreground">
                      {t('monitoring.acknowledgedBy', {
                        name: ev.acknowledgedBy.name ?? ev.acknowledgedBy.email,
                        date: fmtDate(ev.acknowledgedAt),
                      })}
                    </p>
                  )}
                </div>
                {!ev.acknowledgedAt && (
                  <Button
                    size="sm" variant="outline"
                    onClick={() => acknowledgeMutation.mutate(ev.id)}
                    disabled={acknowledgeMutation.isPending}
                  >
                    <CheckCircle className="mr-2 h-3.5 w-3.5" />
                    {t('monitoring.acknowledge')}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('monitoring.logTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('monitoring.title')}</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <Label>{t('monitoring.type')}</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as VendorMonitoringEventType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('monitoring.severity')}</Label>
              <Select value={form.severity} onValueChange={(v) => setForm((f) => ({ ...f, severity: v as VendorMonitoringSeverity }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('monitoring.detectedAt')}</Label>
              <Input type="date" value={form.detectedAt as string} onChange={(e) => setForm((f) => ({ ...f, detectedAt: e.target.value }))} />
            </div>
            <div>
              <Label>{t('monitoring.sourceUrl')}</Label>
              <Input value={form.sourceUrl ?? ''} onChange={(e) => setForm((f) => ({ ...f, sourceUrl: e.target.value || null }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t('monitoring.cancel')}</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!form.title || createMutation.isPending}>
              {createMutation.isPending ? t('monitoring.saving') : t('monitoring.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
