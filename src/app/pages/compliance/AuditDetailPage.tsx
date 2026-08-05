/**
 * AuditDetailPage.tsx — audit detail shell.
 *
 * The 2,267-line original was split in Phase 4; each tab now lives in
 * `./audit-detail/`. This file keeps the page shell, tab wiring and data
 * loading.
 *
 * `RequestStatusBadge` and `REQUEST_STATUS_COLORS` are re-exported below
 * because AuditRequestDetailPage imports them from here.
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageTemplate } from '@/app/components/PageTemplate';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { ArrowLeft, Send, ClipboardList, Building2, Eye } from 'lucide-react';
import { auditsService, AuditRecord, AuditStatus } from '@/services/api/audits';
import { usersService } from '@/services/api/users';
import { useIsAdmin } from '@/hooks/useCurrentUser';
import { AUDIT_TYPE_KEYS, StatusBadge } from './AuditDetailPanel';
import { OverviewTab } from './audit-detail/OverviewTab';
import { EvidenceTab } from './audit-detail/EvidenceTab';
import { FindingsTab } from './audit-detail/FindingsTab';
import { RequestsTab } from './audit-detail/RequestsTab';
import { CommentsTab } from './audit-detail/CommentsTab';
import { ReportTab } from './audit-detail/ReportTab';
import { FrameworkTab } from './audit-detail/FrameworkTab';
import { DataSummaryTab } from './audit-detail/DataSummaryTab';
import { VendorsTab } from './audit-detail/VendorsTab';
import { AuditorInvitationsDialog } from './audit-detail/AuditorInvitationsDialog';
export {
  RequestStatusBadge,
  REQUEST_STATUS_COLORS,
} from './audit-detail/shared';

export function AuditDetailPage() {
  const { t } = useTranslation('compliance');
  const { auditId } = useParams<{ auditId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canInviteAuditors = useIsAdmin();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  // URL-aware tab state. Deep-links like `?tab=requests&requestId=...` open
  // the right tab + highlight the right row (see RequestsTab below).
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') ?? 'overview';
  const [activeTab, setActiveTab] = useState<string>(tabFromUrl);
  useEffect(() => {
    const next = searchParams.get('tab');
    if (!next) return;
    // Functional update so we don't have to depend on activeTab — avoids
    // a re-sync loop when our own onValueChange flushes the param back.
    setActiveTab((prev) => (next !== prev ? next : prev));
  }, [searchParams]);
  function handleTabChange(value: string) {
    setActiveTab(value);
    setSearchParams(
      (prev) => {
        prev.set('tab', value);
        return prev;
      },
      { replace: true },
    );
  }
  const requestIdFromUrl = searchParams.get('requestId') ?? null;

  const { data, isLoading } = useQuery<{ success: boolean; data: AuditRecord }>(
    {
      queryKey: ['audit', auditId],
      queryFn: () => auditsService.get(auditId!),
      enabled: !!auditId,
    },
  );
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.listUsers(),
  });

  const audit = data?.data;
  const usersById = new Map(users.map((user) => [user.id, user] as const));

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['audit', auditId] });
    queryClient.invalidateQueries({ queryKey: ['audits'] });
  }

  if (isLoading) {
    return (
      <PageTemplate title={t('auditDetail.loading')} description="">
        <div className="p-8 text-center text-sm text-muted-foreground">
          {t('auditDetail.loadingAudit')}
        </div>
      </PageTemplate>
    );
  }

  if (!audit) {
    return (
      <PageTemplate title={t('auditDetail.notFound')} description="">
        <div className="p-8 text-center text-sm text-muted-foreground">
          {t('auditDetail.auditNotFound')}
        </div>
      </PageTemplate>
    );
  }

  const controls = audit.auditControls ?? [];

  const descriptionStr = [
    t(`auditPanel.typeLabels.${AUDIT_TYPE_KEYS[audit.type]}`),
    audit.frameworkName,
    audit.isLocked ? t('auditDetail.locked') : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <PageTemplate
      title={audit.name}
      description={descriptionStr}
      actions={
        <div className="flex items-center gap-2">
          {canInviteAuditors && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInviteDialogOpen(true)}
            >
              <Send className="w-4 h-4 mr-1" />
              {t('auditDetail.invitations.invite')}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/auditor/dashboard?auditId=${audit.id}`)}
            title={t('auditDetail.previewAsAuditor.tooltip')}
          >
            <Eye className="w-4 h-4 mr-1" />
            {t('auditDetail.previewAsAuditor.label')}
          </Button>
          <StatusBadge status={audit.status as AuditStatus} />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/compliance/audits')}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t('auditDetail.back')}
          </Button>
        </div>
      }
    >
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="overview">
            {t('auditDetail.tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value="evidence">
            {t('auditDetail.tabs.evidence')}
          </TabsTrigger>
          <TabsTrigger value="requests">
            <ClipboardList className="w-3.5 h-3.5 mr-1" />
            {t('auditDetail.tabs.requests')}
          </TabsTrigger>
          <TabsTrigger value="findings">
            {t('auditDetail.tabs.findings')}
            {(audit.findings ?? []).length > 0 && (
              <Badge
                variant="secondary"
                className="ml-1.5 h-4 min-w-4 px-1 text-xs"
              >
                {(audit.findings ?? []).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="comments">
            {t('auditDetail.tabs.comments')}
          </TabsTrigger>
          <TabsTrigger value="report">
            {t('auditDetail.tabs.report')}
          </TabsTrigger>
          <TabsTrigger value="framework">
            {t('auditDetail.tabs.framework')}
          </TabsTrigger>
          <TabsTrigger value="risk">{t('auditDetail.tabs.risk')}</TabsTrigger>
          <TabsTrigger value="assets">
            {t('auditDetail.tabs.assets')}
          </TabsTrigger>
          <TabsTrigger value="personnel">
            {t('auditDetail.tabs.personnel')}
          </TabsTrigger>
          <TabsTrigger value="integrations">
            {t('auditDetail.tabs.integrations')}
          </TabsTrigger>
          <TabsTrigger value="vendors">
            <Building2 className="w-3.5 h-3.5 mr-1" />
            {t('auditDetail.tabs.vendors')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab audit={audit} usersById={usersById} />
        </TabsContent>

        <TabsContent value="evidence">
          <EvidenceTab auditId={audit.id} isLocked={audit.isLocked} />
        </TabsContent>

        <TabsContent value="requests">
          <RequestsTab
            audit={audit}
            users={users}
            highlightRequestId={requestIdFromUrl}
          />
        </TabsContent>

        <TabsContent value="findings">
          <FindingsTab audit={audit} onRefresh={refresh} />
        </TabsContent>

        <TabsContent value="comments">
          <CommentsTab auditId={audit.id} controls={controls} />
        </TabsContent>

        <TabsContent value="report">
          <ReportTab audit={audit} onRefresh={refresh} />
        </TabsContent>

        <TabsContent value="framework">
          <FrameworkTab auditId={audit.id} />
        </TabsContent>

        <TabsContent value="risk">
          <DataSummaryTab auditId={audit.id} type="risk" />
        </TabsContent>

        <TabsContent value="assets">
          <DataSummaryTab auditId={audit.id} type="assets" />
        </TabsContent>

        <TabsContent value="personnel">
          <DataSummaryTab auditId={audit.id} type="personnel" />
        </TabsContent>

        <TabsContent value="integrations">
          <DataSummaryTab auditId={audit.id} type="integrations" />
        </TabsContent>

        <TabsContent value="vendors">
          <VendorsTab />
        </TabsContent>
      </Tabs>
      <AuditorInvitationsDialog
        auditId={audit.id}
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />
    </PageTemplate>
  );
}
