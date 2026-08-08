import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { auditsService } from '@/services/api/audits';
import { authService } from '@/services/api/auth';
import { Role } from '@/services/api/types';

export function AuditorInvitationPage() {
  const { t } = useTranslation('auth');
  const { secret } = useParams<{ secret: string }>();
  const navigate = useNavigate();
  const [accepting, setAccepting] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['auditor-invitation', secret],
    queryFn: () => auditsService.getPublicInvitation(secret!),
    enabled: !!secret,
    retry: false,
  });

  const invitation = data?.data;

  async function acceptInvitation() {
    if (!secret) return;
    setAccepting(true);
    try {
      const response = await auditsService.acceptPublicInvitation(secret);
      authService.setToken(response.token);
      authService.cacheUser({
        id: response.user.id,
        email: response.user.email,
        name: response.user.name ?? undefined,
        role: response.user.role as Role,
        organizationId: response.user.organizationId,
        preferredLocale: response.user.preferredLocale,
        createdAt: response.user.createdAt ?? new Date().toISOString(),
      });
      toast.success(t('auditorInvitation.accepted'));
      window.location.href = response.redirectTo || '/auditor/dashboard';
    } catch {
      toast.error(t('auditorInvitation.acceptFailed'));
    } finally {
      setAccepting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-8 shadow-2xl border-slate-200/20">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
            <img
              src="/logo.svg"
              className="h-8 w-8"
              style={{ filter: 'brightness(0) invert(1)' }}
              alt="CloudAnzen"
            />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
            {t('auditorInvitation.eyebrow')}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">
            {t('auditorInvitation.title')}
          </h1>
        </div>

        {isLoading && (
          <p className="text-center text-sm text-muted-foreground">
            {t('auditorInvitation.loading')}
          </p>
        )}

        {isError && (
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('auditorInvitation.notFound')}
            </p>
            <Button variant="outline" onClick={() => navigate('/login')}>
              {t('auditorInvitation.goToSignIn')}
            </Button>
          </div>
        )}

        {invitation && (
          <div className="space-y-6">
            <div className="rounded-xl border bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('auditorInvitation.organization')}
                  </p>
                  <p className="font-medium text-slate-950">
                    {invitation.organizationName}
                  </p>
                </div>
                <Badge variant="secondary">{invitation.role}</Badge>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">
                    {t('auditorInvitation.audit')}
                  </span>{' '}
                  {invitation.auditName}
                </p>
                <p>
                  <span className="text-muted-foreground">
                    {t('auditorInvitation.framework')}
                  </span>{' '}
                  {invitation.frameworkName ??
                    t('auditorInvitation.frameworkUnspecified')}
                </p>
                <p>
                  <span className="text-muted-foreground">
                    {t('auditorInvitation.invitedEmail')}
                  </span>{' '}
                  {invitation.email}
                </p>
                <p>
                  <span className="text-muted-foreground">
                    {t('auditorInvitation.expires')}
                  </span>{' '}
                  {new Date(invitation.expiresAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={acceptInvitation}
              disabled={accepting}
            >
              {accepting
                ? t('auditorInvitation.accepting')
                : t('auditorInvitation.accept')}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
