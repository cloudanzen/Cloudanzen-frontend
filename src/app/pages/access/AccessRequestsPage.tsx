/**
 * Access → Access Requests
 *
 * Enterprise self-service access request management:
 * - Users can request role upgrades or temporary access
 * - Admins can approve / reject with notes
 * - Audit trail for all decisions
 * - Periodic access review reminders
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ClipboardList,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  X,
  Shield,
  Calendar,
  MessageSquare,
  Loader2,
  Bell,
} from 'lucide-react';
import {
  ROLE_LABELS,
  ROLE_CONFIG,
  AppRole,
  ROLE_DESCRIPTIONS,
} from '@/lib/rbac/permissions';
import { RoleBadge } from '@/app/components/rbac/RequirePermission';
import { useCurrentUser, useHasPermission } from '@/hooks/useCurrentUser';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs';
import { fmtDate, fmtDateTime } from '@/lib/format-date';

// ── Types ──────────────────────────────────────────────────────────────────────

type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
type RequestType = 'ROLE_UPGRADE' | 'TEMPORARY_ACCESS' | 'POLICY_EXCEPTION';

interface AccessRequest {
  id: string;
  requesterId: string;
  requesterEmail: string;
  requesterName?: string;
  type: RequestType;
  requestedRole?: AppRole;
  currentRole?: AppRole;
  justification: string;
  status: RequestStatus;
  reviewedBy?: string;
  reviewNote?: string;
  createdAt: string;
  expiresAt?: string;
  reviewedAt?: string;
}

// ── Mock data (will be replaced by real API) ────────────────────────────────────

const MOCK_REQUESTS: AccessRequest[] = [
  {
    id: 'req_1',
    requesterId: 'user_2',
    requesterEmail: 'alice@company.com',
    requesterName: 'Alice Chen',
    type: 'ROLE_UPGRADE',
    requestedRole: 'SECURITY_OWNER',
    currentRole: 'CONTRIBUTOR',
    justification:
      'I am taking over the ISO 27001 compliance program and need access to approve policies and manage the audit cycle.',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'req_2',
    requesterId: 'user_3',
    requesterEmail: 'bob@company.com',
    requesterName: 'Bob Smith',
    type: 'TEMPORARY_ACCESS',
    requestedRole: 'AUDITOR',
    currentRole: 'VIEWER',
    justification:
      'External auditor needs read access to compliance records for the Q2 audit.',
    status: 'APPROVED',
    reviewedBy: 'admin@company.com',
    reviewNote: 'Approved for 30 days. Access expires 2026-04-09.',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    reviewedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'req_3',
    requesterId: 'user_4',
    requesterEmail: 'charlie@company.com',
    requesterName: 'Charlie Park',
    type: 'ROLE_UPGRADE',
    requestedRole: 'ORG_ADMIN',
    currentRole: 'SECURITY_OWNER',
    justification:
      'Need to manage billing and user provisioning while the current admin is on leave.',
    status: 'REJECTED',
    reviewedBy: 'admin@company.com',
    reviewNote:
      'Admin escalation is not appropriate for temporary coverage. Please use temporary delegation instead.',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    reviewedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  RequestStatus,
  {
    key: RequestStatus;
    bg: string;
    text: string;
    border: string;
    Icon: React.ElementType;
  }
> = {
  PENDING: {
    key: 'PENDING',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    Icon: Clock,
  },
  APPROVED: {
    key: 'APPROVED',
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    Icon: CheckCircle2,
  },
  REJECTED: {
    key: 'REJECTED',
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
    Icon: XCircle,
  },
  EXPIRED: {
    key: 'EXPIRED',
    bg: 'bg-gray-50',
    text: 'text-gray-500',
    border: 'border-gray-200',
    Icon: AlertCircle,
  },
};

// ── New Request Modal ──────────────────────────────────────────────────────────

function NewRequestModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (req: AccessRequest) => void;
}) {
  const { t } = useTranslation('access');
  const currentUser = useCurrentUser();
  const [type, setType] = useState<RequestType>('ROLE_UPGRADE');
  const [requestedRole, setRequestedRole] = useState<AppRole>('SECURITY_OWNER');
  const [justification, setJustification] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allRoles: AppRole[] = [
    'SUPER_ADMIN',
    'ORG_ADMIN',
    'SECURITY_OWNER',
    'AUDITOR',
    'CONTRIBUTOR',
    'VIEWER',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim()) {
      setError(t('requests.modal.provideJustification'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      // In production this calls POST /api/access-requests
      // For now, we optimistically create a local record
      const newReq: AccessRequest = {
        id: `req_${Date.now()}`,
        requesterId: currentUser?.id ?? '',
        requesterEmail: currentUser?.email ?? '',
        requesterName: currentUser?.name ?? undefined,
        type,
        requestedRole,
        currentRole: currentUser?.role as AppRole,
        justification,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };
      // Simulate API delay
      await new Promise((r) => setTimeout(r, 600));
      onCreated(newReq);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('requests.modal.failedToSubmit'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {t('requests.modal.title')}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {t('requests.modal.subtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Request type */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              {t('requests.modal.requestType')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['ROLE_UPGRADE', 'TEMPORARY_ACCESS'] as RequestType[]).map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setType(item)}
                    className={`p-3 rounded-xl border text-left text-xs font-medium transition-all ${type === item ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
                  >
                    <p className="font-semibold">{t(`requests.typeLabels.${item}`)}</p>
                    <p className="text-xs text-gray-500 mt-0.5 font-normal">
                      {t(`requests.typeDescriptions.${item}`)}
                    </p>
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Requested role */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              {t('requests.modal.requestedRole')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {allRoles
                .filter((r) => r !== 'SUPER_ADMIN' && r !== currentUser?.role)
                .map((r) => {
                  const rc = ROLE_CONFIG[r];
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRequestedRole(r)}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${requestedRole === r ? `${rc.bg} ${rc.border} ${rc.text} ring-1 ring-current` : 'border-gray-200 text-gray-700 bg-white hover:border-gray-300'}`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${rc.dot}`}
                      />
                      {ROLE_LABELS[r]}
                    </button>
                  );
                })}
            </div>
            {requestedRole && (
              <p className="text-xs text-gray-500 mt-1.5 bg-gray-50 rounded-lg px-3 py-2">
                {ROLE_DESCRIPTIONS[requestedRole]}
              </p>
            )}
          </div>

          {/* Justification */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {t('requests.modal.justification')}
            </label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder={t('requests.modal.justificationPlaceholder')}
              rows={4}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              required
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('requests.cancel')}
            </button>
            <button
              type="submit"
              disabled={!justification.trim() || submitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ClipboardList className="w-4 h-4" />
              )}
              {submitting ? t('requests.modal.submitting') : t('requests.modal.submitRequest')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Request Card ───────────────────────────────────────────────────────────────

function RequestCard({
  request,
  onApprove,
  onReject,
  canReview,
}: {
  request: AccessRequest;
  onApprove: (id: string, note: string) => void;
  onReject: (id: string, note: string) => void;
  canReview: boolean;
}) {
  const { t } = useTranslation('access');
  const [showReview, setShowReview] = useState(false);
  const [note, setNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const st = STATUS_CONFIG[request.status];
  const StatusIcon = st.Icon;

  const handleAction = async (action: 'approve' | 'reject') => {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 500));
    if (action === 'approve') onApprove(request.id, note);
    else onReject(request.id, note);
    setProcessing(false);
    setShowReview(false);
  };

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm overflow-hidden ${request.status === 'PENDING' ? 'border-amber-200' : 'border-gray-200'}`}
    >
      {/* Status bar */}
      <div
        className={`flex items-center justify-between px-4 py-2 ${st.bg} border-b ${st.border}`}
      >
        <div
          className={`flex items-center gap-1.5 text-xs font-semibold ${st.text}`}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          {t(`requests.statusLabels.${st.key}`)}
        </div>
        <span className="text-xs text-gray-400">
          {fmtDateTime(request.createdAt)}
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* Requester */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">
            {(request.requesterName ?? request.requesterEmail)
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {request.requesterName ?? request.requesterEmail}
            </p>
            <p className="text-xs text-gray-500">{request.requesterEmail}</p>
          </div>
          <div className="ml-auto text-xs text-gray-500 flex items-center gap-1 flex-shrink-0">
            <span className="bg-gray-100 px-2 py-0.5 rounded-full font-medium">
              {t(`requests.typeLabels.${request.type}`)}
            </span>
          </div>
        </div>

        {/* Role transition */}
        {request.requestedRole && (
          <div className="flex items-center gap-2">
            {request.currentRole && <RoleBadge role={request.currentRole} />}
            <span className="text-xs text-gray-400">&rarr;</span>
            <RoleBadge role={request.requestedRole} />
            {request.expiresAt && (
              <span className="ml-auto text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {t('requests.card.expires', { date: fmtDate(request.expiresAt) })}
              </span>
            )}
          </div>
        )}

        {/* Justification */}
        <div className="bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
            <MessageSquare className="w-3 h-3" /> {t('requests.card.justification')}
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {request.justification}
          </p>
        </div>

        {/* Review note */}
        {request.reviewNote && (
          <div
            className={`rounded-lg px-3 py-2.5 border ${request.status === 'APPROVED' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}
          >
            <p
              className={`text-xs font-medium mb-1 flex items-center gap-1 ${request.status === 'APPROVED' ? 'text-green-600' : 'text-red-600'}`}
            >
              {request.status === 'APPROVED' ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <XCircle className="w-3 h-3" />
              )}
              {t('requests.card.reviewerNote', { reviewer: request.reviewedBy })}
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {request.reviewNote}
            </p>
          </div>
        )}

        {/* Review actions (admin only, pending only) */}
        {canReview && request.status === 'PENDING' && (
          <div className="pt-1">
            {!showReview ? (
              <button
                onClick={() => setShowReview(true)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Shield className="w-3.5 h-3.5" /> {t('requests.card.reviewRequest')}
              </button>
            ) : (
              <div className="space-y-2.5">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t('requests.card.reviewNotePlaceholder')}
                  rows={2}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction('approve')}
                    disabled={processing}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-xs font-medium transition-colors"
                  >
                    {processing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    {t('requests.approve')}
                  </button>
                  <button
                    onClick={() => handleAction('reject')}
                    disabled={processing}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-xs font-medium transition-colors"
                  >
                    {processing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" />
                    )}
                    {t('requests.reject')}
                  </button>
                  <button
                    onClick={() => setShowReview(false)}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50"
                  >
                    {t('requests.cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function AccessRequestsPage() {
  const { t } = useTranslation('access');
  const currentUser = useCurrentUser();
  const canApprove = useHasPermission(PERMISSIONS.ACCESS_REQUESTS_APPROVE);
  const [requests, setRequests] = useState<AccessRequest[]>(MOCK_REQUESTS);
  const [showNew, setShowNew] = useState(false);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | ''>('');

  const filtered = requests.filter(
    (r) => !statusFilter || r.status === statusFilter,
  );
  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const myRequests = requests.filter(
    (r) =>
      r.requesterId === currentUser?.id ||
      r.requesterEmail === currentUser?.email,
  );
  const pendingReview = requests.filter((r) => r.status === 'PENDING');

  const handleApprove = (id: string, note: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'APPROVED',
              reviewNote: note || undefined,
              reviewedBy: currentUser?.email,
              reviewedAt: new Date().toISOString(),
            }
          : r,
      ),
    );
  };

  const handleReject = (id: string, note: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'REJECTED',
              reviewNote: note || undefined,
              reviewedBy: currentUser?.email,
              reviewedAt: new Date().toISOString(),
            }
          : r,
      ),
    );
  };

  const handleCreated = (req: AccessRequest) => {
    setRequests((prev) => [req, ...prev]);
    setShowNew(false);
  };

  return (
    <div className="flex flex-col bg-gray-50">
      {showNew && (
        <NewRequestModal
          onClose={() => setShowNew(false)}
          onCreated={handleCreated}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
              {t('requests.title')}
            </h1>
            {pendingCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                <Bell className="w-3 h-3" /> {t('requests.pending', { count: pendingCount })}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('requests.description')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {t('requests.newRequest')}
          </button>
        </div>
      </div>

      <div className="px-6 py-5">
        <Tabs defaultValue={canApprove ? 'pending' : 'mine'}>
          <TabsList className="rounded-xl bg-white border border-gray-200 shadow-sm p-1 h-auto mb-5">
            {canApprove && (
              <TabsTrigger value="pending">
                {t('requests.tabs.pendingReview')}
                {pendingReview.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                    {pendingReview.length}
                  </span>
                )}
              </TabsTrigger>
            )}
            <TabsTrigger value="mine">{t('requests.tabs.myRequests')}</TabsTrigger>
            {canApprove && <TabsTrigger value="all">{t('requests.tabs.allRequests')}</TabsTrigger>}
          </TabsList>

          {/* Pending review tab */}
          {canApprove && (
            <TabsContent value="pending" className="mt-0 space-y-4">
              {pendingReview.length === 0 ? (
                <div className="flex flex-col items-center py-20 text-gray-400">
                  <CheckCircle2 className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm font-medium">{t('requests.noPending')}</p>
                  <p className="text-xs mt-1">
                    {t('requests.allReviewed')}
                  </p>
                </div>
              ) : (
                pendingReview.map((req) => (
                  <RequestCard
                    key={req.id}
                    request={req}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    canReview={canApprove}
                  />
                ))
              )}
            </TabsContent>
          )}

          {/* My requests */}
          <TabsContent value="mine" className="mt-0 space-y-4">
            {myRequests.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-gray-400">
                <ClipboardList className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">{t('requests.noRequestsYet')}</p>
                <p className="text-xs mt-1">
                  {t('requests.noRequestsYetSub')}
                </p>
                <button
                  onClick={() => setShowNew(true)}
                  className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
                >
                  <Plus className="w-4 h-4" /> {t('requests.newRequest')}
                </button>
              </div>
            ) : (
              myRequests.map((req) => (
                <RequestCard
                  key={req.id}
                  request={req}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  canReview={false}
                />
              ))
            )}
          </TabsContent>

          {/* All requests */}
          {canApprove && (
            <TabsContent value="all" className="mt-0 space-y-4">
              {/* Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-gray-500">
                  {t('requests.status')}
                </span>
                {(['', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((s) => {
                  const cfg = s ? STATUS_CONFIG[s] : null;
                  return (
                    <button
                      key={s || 'all'}
                      onClick={() => setStatusFilter(s)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                        statusFilter === s
                          ? s
                            ? `${cfg!.bg} ${cfg!.text} ${cfg!.border}`
                            : 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {s ? t(`requests.statusLabels.${s}`) : t('requests.allCount', { count: requests.length })}
                    </button>
                  );
                })}
              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  {t('requests.noMatchFilter')}
                </div>
              ) : (
                filtered.map((req) => (
                  <RequestCard
                    key={req.id}
                    request={req}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    canReview={canApprove && req.status === 'PENDING'}
                  />
                ))
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
