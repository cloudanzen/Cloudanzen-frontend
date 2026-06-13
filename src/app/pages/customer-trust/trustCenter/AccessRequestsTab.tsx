import React, { useState } from 'react';
import { TOAST_DURATION_MS } from '@/lib/constants';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Mail,
  CheckCircle2,
  FileSignature,
  XCircle,
  Clock,
} from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { trustCenterService } from '@/services/api/trustCenter';
import { fmt } from './helpers';

// ── Access Requests Tab ───────────────────────────────────────────────────────

export function AccessRequestsTab() {
  const { t } = useTranslation('common');
  const qc = useQueryClient();
  const [acting, setActing] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['trust-access-requests'],
    queryFn: () => trustCenterService.listAccessRequests(),
  });
  const { data: settingsData } = useQuery({
    queryKey: ['trust-settings'],
    queryFn: () => trustCenterService.getSettings(),
  });
  const requests = data?.data ?? [];
  const ndaMode = settingsData?.data?.settings?.ndaMode ?? 'CLICKWRAP';

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }

  async function handleSendEnvelope(id: string) {
    setActing(id);
    try {
      const res = await trustCenterService.sendDocusignEnvelope(id);
      showToast(
        'success',
        `DocuSign envelope sent (${res.data.envelopeId.slice(0, 8)}…)`,
      );
    } catch (e: unknown) {
      showToast(
        'error',
        e instanceof Error ? e.message : 'Failed to send envelope',
      );
    } finally {
      setActing(null);
    }
  }

  async function handleDecision(id: string, status: 'APPROVED' | 'REJECTED') {
    setActing(id);
    try {
      await trustCenterService.decideAccessRequest(id, status);
      qc.invalidateQueries({ queryKey: ['trust-access-requests'] });
      showToast(
        'success',
        status === 'APPROVED'
          ? t('customerTrust.accessRequests.accessApproved')
          : t('customerTrust.accessRequests.requestRejected'),
      );
    } catch (e: unknown) {
      showToast(
        'error',
        e instanceof Error ? e.message : t('errors.loadFailed'),
      );
    } finally {
      setActing(null);
    }
  }

  const statusMeta: Record<
    string,
    { label: string; color: string; icon: React.ReactNode }
  > = {
    PENDING: {
      label: t('customerTrust.accessRequests.statusPending'),
      color: 'bg-amber-50 text-amber-700',
      icon: <Clock className="w-3 h-3" />,
    },
    APPROVED: {
      label: t('customerTrust.accessRequests.statusApproved'),
      color: 'bg-green-50 text-green-700',
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    REJECTED: {
      label: t('customerTrust.accessRequests.statusRejected'),
      color: 'bg-red-50 text-red-700',
      icon: <XCircle className="w-3 h-3" />,
    },
  };

  return (
    <div>
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
        >
          {toast.msg}
        </div>
      )}
      <p className="text-sm text-gray-500 mb-4">
        {t('customerTrust.accessRequests.subtitle')}
      </p>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">
            {t('customerTrust.accessRequests.loading')}
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-600">
              {t('customerTrust.accessRequests.noRequests')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {[
                    t('customerTrust.accessRequests.columns.requester'),
                    t('customerTrust.accessRequests.columns.company'),
                    t('customerTrust.accessRequests.columns.document'),
                    t('customerTrust.accessRequests.columns.nda'),
                    t('customerTrust.accessRequests.columns.status'),
                    t('customerTrust.accessRequests.columns.requested'),
                    '',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {requests.map((req) => {
                  const sm = (statusMeta[req.status] ?? statusMeta['PENDING'])!;
                  return (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {req.requesterName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {req.requesterEmail}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {req.company ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs max-w-[120px] truncate">
                        {req.document?.name ??
                          t('customerTrust.accessRequests.general')}
                      </td>
                      <td className="px-4 py-3">
                        {req.ndaSigned ? (
                          <span className="text-xs text-green-600 font-medium">
                            {t('customerTrust.accessRequests.signed')}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${sm.color}`}
                        >
                          {sm.icon}
                          {sm.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {fmt(req.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {req.status === 'PENDING' && (
                          <div className="flex gap-1 flex-wrap">
                            {ndaMode === 'DOCUSIGN' && !req.ndaSigned && (
                              <button
                                onClick={() => handleSendEnvelope(req.id)}
                                disabled={acting === req.id}
                                title="Send DocuSign NDA envelope to requester"
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                              >
                                <FileSignature className="w-3 h-3" />
                                Send NDA
                              </button>
                            )}
                            <button
                              onClick={() => handleDecision(req.id, 'APPROVED')}
                              disabled={acting === req.id}
                              className="px-2.5 py-1 text-xs rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              {t('customerTrust.accessRequests.approve')}
                            </button>
                            <button
                              onClick={() => handleDecision(req.id, 'REJECTED')}
                              disabled={acting === req.id}
                              className="px-2.5 py-1 text-xs rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                            >
                              {t('customerTrust.accessRequests.reject')}
                            </button>
                          </div>
                        )}
                        {req.status === 'APPROVED' && req.approvalToken && (
                          <span className="text-xs text-gray-400">
                            {t('customerTrust.accessRequests.expires', {
                              date: fmt(req.expiresAt),
                            })}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
