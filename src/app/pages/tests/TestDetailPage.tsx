import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { TestDetailPanel } from './TestDetailPanel';

export function TestDetailPage() {
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
