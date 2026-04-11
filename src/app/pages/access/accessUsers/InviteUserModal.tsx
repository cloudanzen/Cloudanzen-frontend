import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  CheckCircle2,
  Loader2,
  UserPlus,
  AlertCircle,
  Mail,
} from 'lucide-react';
import { usersService } from '@/services/api/users';
import { Role } from '@/services/api/types';
import { ROLE_LABELS, ROLE_CONFIG } from '@/lib/rbac/permissions';
import { ALL_ROLES } from './helpers';

// ── Invite User Modal ──────────────────────────────────────────────────────────

export function InviteUserModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation('access');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>(Role.VIEWER);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError(null);
    try {
      await usersService.inviteUser(email, role);
      setSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('invite.failedToSend');
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {t('invite.title')}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {t('invite.subtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {sent ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {t('invite.sentTitle')}
            </p>
            <p className="text-xs text-gray-500 text-center">
              {t('invite.sentMessage', { email })}
            </p>
            <button
              onClick={onClose}
              className="mt-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
            >
              {t('invite.done')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t('invite.emailLabel')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('invite.emailPlaceholder')}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  autoFocus
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                {t('invite.assignRole')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_ROLES.filter((r) => r !== 'SUPER_ADMIN').map((r) => {
                  const rc = ROLE_CONFIG[r];
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r as Role)}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all text-xs ${
                        role === r
                          ? `${rc.bg} ${rc.border} ${rc.text} ring-1 ring-current`
                          : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${rc.dot}`}
                      />
                      <span className="font-medium">
                        {t(`users.roles.${r}`, ROLE_LABELS[r])}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5" /> {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t('invite.cancel')}
              </button>
              <button
                type="submit"
                disabled={!email || sending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                {sending ? t('invite.sending') : t('invite.sendInvite')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
