import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, Building2 } from 'lucide-react';
import {
  customerTrustApi,
  type TrustAccountDetail,
  type TrustAccountRow,
} from '@/services/api/customerTrust';

export default function CustomerTrustAccountDetailPage() {
  const { t } = useTranslation('customerTrust');
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<TrustAccountDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    customerTrustApi
      .accountDetail(id)
      .then((res) => {
        if (!cancelled) setDetail(res.data);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : t('common.failedToLoad'),
          );
      });
    return () => {
      cancelled = true;
    };
  }, [id, t]);

  async function togglePatch(
    key: 'bypassNda' | 'autoApproveAll',
    value: boolean,
  ) {
    if (!id) return;
    setSaving(true);
    try {
      await customerTrustApi.patchAccount(id, { [key]: value });
      // optimistic merge
      setDetail((prev) =>
        prev
          ? ({
              ...prev,
              account: { ...prev.account, [key]: value },
            } as TrustAccountDetail & { account: TrustAccountRow })
          : prev,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      </div>
    );
  }
  if (!detail) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        {t('common.loading')}
      </div>
    );
  }

  const { account, viewers, recentEvents } = detail;

  return (
    <div className="space-y-6 p-6">
      <Link
        to="/customer-trust/accounts"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All accounts
      </Link>

      <div className="flex items-start gap-4">
        {account.logoUrl ? (
          <img src={account.logoUrl} alt="" className="h-12 w-12 rounded" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded bg-slate-100">
            <Building2 className="h-6 w-6 text-slate-500" />
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">
            {account.companyName ?? account.domain}
          </h1>
          <p className="text-sm text-muted-foreground">{account.domain}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-card p-5">
        <h2 className="text-base font-semibold text-foreground">
          {t('accountDetail.accessOverrides')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('accountDetail.overridesNote')}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <ToggleButton
            label={t('accountDetail.autoApproveAll')}
            on={account.autoApproveAll}
            disabled={saving}
            onClick={() =>
              togglePatch('autoApproveAll', !account.autoApproveAll)
            }
          />
          <ToggleButton
            label={t('accountDetail.bypassNda')}
            on={account.bypassNda}
            disabled={saving}
            onClick={() => togglePatch('bypassNda', !account.bypassNda)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-card">
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="text-base font-semibold text-foreground">
            Viewers ({viewers.length})
          </h2>
        </div>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <Th>{t('accountDetail.columns.email')}</Th>
              <Th>{t('accountDetail.columns.name')}</Th>
              <Th>{t('accountDetail.columns.identifiedVia')}</Th>
              <Th>{t('accountDetail.columns.lastActive')}</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {viewers.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50">
                <Td>{v.email ?? '(erased)'}</Td>
                <Td>{v.name ?? '—'}</Td>
                <Td>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">
                    {v.identifiedVia.toLowerCase()}
                  </span>
                </Td>
                <Td>{new Date(v.lastActiveAt).toLocaleString()}</Td>
              </tr>
            ))}
            {viewers.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="py-6 text-center text-sm text-muted-foreground"
                >
                  No identified viewers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-slate-200 bg-card">
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="text-base font-semibold text-foreground">
            Recent activity
          </h2>
        </div>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <Th>{t('accountDetail.columns.action')}</Th>
              <Th>{t('accountDetail.columns.resource')}</Th>
              <Th>{t('accountDetail.columns.when')}</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {recentEvents.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50">
                <Td>{e.action.replace(/_/g, ' ').toLowerCase()}</Td>
                <Td>
                  {e.resourceType
                    ? `${e.resourceType.toLowerCase()} · ${e.resourceId ?? ''}`
                    : '—'}
                </Td>
                <Td>{new Date(e.createdAt).toLocaleString()}</Td>
              </tr>
            ))}
            {recentEvents.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="py-6 text-center text-sm text-muted-foreground"
                >
                  No events yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ToggleButton({
  label,
  on,
  disabled,
  onClick,
}: {
  label: string;
  on: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-40 ${
        on
          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
      }`}
    >
      {label} · {on ? 'on' : 'off'}
    </button>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-2 text-sm text-foreground">{children}</td>;
}
