import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { TestDetailPanel } from '@/app/pages/tests/TestDetailPanel';

export function ValidationDetailPage() {
  const { testId } = useParams<{ testId: string }>();
  const { t } = useTranslation('tests');

  if (!testId) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        {t('testDetail.noTestId')}
      </div>
    );
  }

  return <TestDetailPanel testId={testId} pageMode />;
}
