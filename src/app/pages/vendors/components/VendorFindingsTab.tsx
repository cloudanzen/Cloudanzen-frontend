import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { QK } from '@/lib/queryKeys';
import { findingsService } from '@/services/api/findings';
import { getSeverityColors, getStatusColors } from '@/app/theme/semantic-colors';

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString();
}

export function VendorFindingsTab({ vendorId }: { vendorId: string }) {
  const { t } = useTranslation('vendors');
  const navigate = useNavigate();

  const { data: findings = [], isLoading } = useQuery({
    queryKey: QK.vendorFindings(vendorId),
    queryFn: () => findingsService.list({ vendorId }),
  });

  if (isLoading) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{t('findings.loading')}</p>;
  }

  if (findings.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          {t('findings.empty')}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {findings.map((f) => (
        <Card key={f.id}>
          <CardContent className="flex items-start justify-between gap-3 pt-4">
            <div className="space-y-1">
              <p className="font-medium text-sm">{f.title}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getSeverityColors(f.severity).className}>
                  {f.severity}
                </Badge>
                <Badge variant="outline" className={getStatusColors(f.status).className}>
                  {f.status}
                </Badge>
                <span className="text-xs text-muted-foreground">{fmtDate(f.createdAt)}</span>
              </div>
              {f.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{f.description}</p>
              )}
            </div>
            <Button
              size="sm" variant="outline"
              onClick={() => navigate(`/findings/${f.id}`)}
            >
              {t('findings.view')}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
