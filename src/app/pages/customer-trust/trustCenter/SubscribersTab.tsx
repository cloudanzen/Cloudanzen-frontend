import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, MailCheck, MailX, Mail } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { trustCenterService } from '@/services/api/trustCenter';

export function SubscribersTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['trust-subscribers'],
    queryFn: () => trustCenterService.listSubscribers(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => trustCenterService.deleteSubscriber(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trust-subscribers'] }),
  });

  const subs = data?.data ?? [];
  const confirmed = subs.filter((s) => s.confirmedAt && !s.unsubscribedAt);
  const pending = subs.filter((s) => !s.confirmedAt && !s.unsubscribedAt);
  const unsubscribed = subs.filter((s) => s.unsubscribedAt);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-foreground">Subscribers</h3>
        <p className="text-sm text-muted-foreground">
          Visitors who opted in to announcement emails from your Trust Center.
          Confirmed subscribers receive every published announcement.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <KpiCard label="Confirmed" value={confirmed.length} tone="emerald" />
        <KpiCard label="Pending confirm" value={pending.length} tone="amber" />
        <KpiCard
          label="Unsubscribed"
          value={unsubscribed.length}
          tone="slate"
        />
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading subscribers…</p>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <Th>Email</Th>
              <Th>Name</Th>
              <Th>Status</Th>
              <Th>Added</Th>
              <Th>&nbsp;</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {subs.map((s) => {
              const isConfirmed = !!s.confirmedAt && !s.unsubscribedAt;
              const isUnsub = !!s.unsubscribedAt;
              return (
                <tr key={s.id} className="hover:bg-slate-50">
                  <Td>{s.email}</Td>
                  <Td>{s.name ?? '—'}</Td>
                  <Td>
                    {isUnsub ? (
                      <Pill icon={<MailX className="w-3 h-3" />} tone="slate">
                        Unsubscribed
                      </Pill>
                    ) : isConfirmed ? (
                      <Pill
                        icon={<MailCheck className="w-3 h-3" />}
                        tone="emerald"
                      >
                        Confirmed
                      </Pill>
                    ) : (
                      <Pill icon={<Mail className="w-3 h-3" />} tone="amber">
                        Pending confirm
                      </Pill>
                    )}
                  </Td>
                  <Td>{new Date(s.createdAt).toLocaleDateString()}</Td>
                  <Td>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Remove subscriber ${s.email}?`))
                          deleteMutation.mutate(s.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </Td>
                </tr>
              );
            })}
            {!isLoading && subs.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No subscribers yet. Add a subscribe form to your public Trust
                  Center to capture interest.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'emerald' | 'amber' | 'slate';
}) {
  const cls =
    tone === 'emerald'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : tone === 'amber'
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : 'border-slate-200 bg-slate-50 text-slate-700';
  return (
    <div className={`rounded-lg border p-4 ${cls}`}>
      <p className="text-xs font-medium uppercase tracking-wider opacity-70">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-sm text-foreground">{children}</td>;
}

function Pill({
  icon,
  children,
  tone,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  tone: 'emerald' | 'amber' | 'slate';
}) {
  const cls =
    tone === 'emerald'
      ? 'bg-emerald-50 text-emerald-700'
      : tone === 'amber'
        ? 'bg-amber-50 text-amber-800'
        : 'bg-slate-100 text-slate-600';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {icon}
      {children}
    </span>
  );
}
