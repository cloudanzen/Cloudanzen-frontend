import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import {
  FileText,
  Loader2,
  Upload,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowLeft,
  UserPlus,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { complianceDocumentService } from '@/services/api/compliance-documents';
import { usersService } from '@/services/api/users';

const STATUS_CONFIG: Record<string, { key: string; color: string; icon: typeof CheckCircle2 }> = {
  CURRENT: { key: 'CURRENT', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
  PENDING: { key: 'PENDING', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  NEEDS_REVIEW: { key: 'NEEDS_REVIEW', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertTriangle },
  EXPIRED: { key: 'EXPIRED', color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle },
};

const CATEGORY_COLORS: Record<string, string> = {
  IT: 'bg-blue-100 text-blue-800',
  Engineering: 'bg-purple-100 text-purple-800',
  HR: 'bg-pink-100 text-pink-800',
  Policy: 'bg-green-100 text-green-800',
  Risks: 'bg-orange-100 text-orange-800',
  Custom: 'bg-gray-100 text-gray-800',
};

export function DocumentDetailPage() {
  const { t } = useTranslation('compliance');
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [assignUserId, setAssignUserId] = useState('');
  const [showDueDateEdit, setShowDueDateEdit] = useState(false);
  const [dueDateInput, setDueDateInput] = useState('');

  const { data: docRes, isLoading } = useQuery({
    queryKey: ['compliance-document', documentId],
    queryFn: () => complianceDocumentService.getById(documentId!),
    enabled: !!documentId,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.listUsers(),
    enabled: showAssign,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof complianceDocumentService.update>[1]) =>
      complianceDocumentService.update(documentId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compliance-document', documentId] });
      qc.invalidateQueries({ queryKey: ['compliance-documents'] });
      setShowAssign(false);
      setShowDueDateEdit(false);
    },
    onError: () => toast.error(t('documentDetail.updateFailed')),
  });

  const doc = docRes?.data;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !documentId) return;
    setUploading(true);
    try {
      await complianceDocumentService.uploadDocument(documentId, file);
      qc.invalidateQueries({ queryKey: ['compliance-document', documentId] });
      qc.invalidateQueries({ queryKey: ['compliance-documents'] });
      toast.success(t('documentDetail.uploadSuccess'));
    } catch {
      toast.error(t('documentDetail.uploadFailed'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!documentId) {
    return <div className="p-8 text-center text-muted-foreground">{t('documentDetail.noDocId')}</div>;
  }

  if (isLoading) {
    return (
      <PageTemplate title={t('documentDetail.loading')} description="">
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </PageTemplate>
    );
  }

  if (!doc) {
    return (
      <PageTemplate title={t('documentDetail.notFoundTitle')} description="">
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{t('documentDetail.notFoundMessage')}</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/compliance/documents')}>
            {t('documentDetail.backToDocuments')}
          </Button>
        </div>
      </PageTemplate>
    );
  }

  const statusConf = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG.PENDING!;
  const StatusIcon = statusConf.icon;

  return (
    <PageTemplate
      title={doc.name}
      description={doc.slug}
      actions={
        <Button variant="outline" size="sm" onClick={() => navigate('/compliance/documents')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t('documentDetail.back')}
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Description */}
        <p className="text-sm text-gray-500 leading-relaxed -mt-2">
          {t(`documentDetail.categoryDesc.${doc.category}`, { defaultValue: t('documentDetail.categoryDesc.default') })}
        </p>

        {/* Status + metadata row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-xs text-gray-500 mb-1">{t('documentDetail.status')}</p>
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${statusConf.color}`}>
              <StatusIcon className="w-3 h-3" />
              {t(`documentDetail.statusLabels.${statusConf.key}`)}
            </span>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-500 mb-1">{t('documentDetail.category')}</p>
            <Badge variant="outline" className={`text-xs ${CATEGORY_COLORS[doc.category] ?? 'bg-gray-100 text-gray-800'}`}>
              {doc.category}
            </Badge>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-500 mb-1">{t('documentDetail.framework')}</p>
            <p className="text-sm font-medium text-gray-800">{doc.frameworkName ?? '—'}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-500 mb-1">{t('documentDetail.lastReviewed')}</p>
            <p className="text-sm font-medium text-gray-800">
              {doc.lastReviewedAt ? new Date(doc.lastReviewedAt).toLocaleDateString() : t('documentDetail.never')}
            </p>
          </Card>
        </div>

        {/* Document file */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              {t('documentDetail.documentFile')}
            </h3>
            {doc.documentUrl ? (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800 font-medium">{t('documentDetail.documentUploaded')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={doc.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {t('documentDetail.view')}
                  </a>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="h-7 text-xs"
                  >
                    {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    {t('documentDetail.replace')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-lg">
                <FileText className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500 mb-4">{t('documentDetail.noDocumentYet')}</p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="gap-2"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {uploading ? t('documentDetail.uploading') : t('documentDetail.uploadDocument')}
                </Button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt,.xlsx,.csv,.png,.jpg,.jpeg"
            />
          </CardContent>
        </Card>

        {/* Owner & dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Owner */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-gray-500" />
                {t('documentDetail.owner')}
              </h3>
              {showAssign ? (
                <div className="space-y-3">
                  <select
                    value={assignUserId}
                    onChange={(e) => setAssignUserId(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('documentDetail.unassignedOption')}</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name ?? u.email}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateMutation.mutate({ ownerId: assignUserId || null })}
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? t('documentDetail.saving') : t('documentDetail.save')}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowAssign(false)}>{t('documentDetail.cancel')}</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700">{doc.ownerName ?? <span className="text-gray-400">{t('documentDetail.unassigned')}</span>}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => {
                      setAssignUserId(doc.ownerId ?? '');
                      setShowAssign(true);
                    }}
                  >
                    {doc.ownerId ? t('documentDetail.change') : t('documentDetail.assign')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Review due */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                {t('documentDetail.reviewDueDate')}
              </h3>
              {showDueDateEdit ? (
                <div className="space-y-3">
                  <input
                    type="date"
                    value={dueDateInput}
                    onChange={(e) => setDueDateInput(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateMutation.mutate({ reviewDueAt: dueDateInput || null })}
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? t('documentDetail.saving') : t('documentDetail.save')}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowDueDateEdit(false)}>{t('documentDetail.cancel')}</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700">
                    {doc.reviewDueAt ? new Date(doc.reviewDueAt).toLocaleDateString() : <span className="text-gray-400">{t('documentDetail.notSet')}</span>}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => {
                      setDueDateInput(doc.reviewDueAt ? doc.reviewDueAt.substring(0, 10) : '');
                      setShowDueDateEdit(true);
                    }}
                  >
                    {doc.reviewDueAt ? t('documentDetail.change') : t('documentDetail.set')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Status update */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('documentDetail.updateStatus')}</h3>
            <div className="flex flex-wrap gap-2">
              {(['PENDING', 'CURRENT', 'NEEDS_REVIEW', 'EXPIRED'] as const).map((s) => {
                const conf = STATUS_CONFIG[s]!;
                const isActive = doc.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => !isActive && updateMutation.mutate({ status: s })}
                    disabled={isActive || updateMutation.isPending}
                    className={`inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border transition-opacity ${conf.color} ${isActive ? 'ring-2 ring-offset-1 ring-current opacity-100' : 'opacity-60 hover:opacity-100'}`}
                  >
                    <conf.icon className="w-3 h-3" />
                    {t(`documentDetail.statusLabels.${conf.key}`)}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Linked test */}
        {doc.testId && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('documentDetail.linkedTest')}</h3>
              <p className="text-sm text-gray-600 mb-3">
                {t('documentDetail.linkedTestDesc')}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/validations/${doc.testId}`)}
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                {t('documentDetail.goToTest')}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PageTemplate>
  );
}
