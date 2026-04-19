import { PageTemplate } from '@/app/components/PageTemplate';
import { useTranslation } from 'react-i18next';
import { FrameworkSuiteLibrary } from '@/app/components/compliance/FrameworkSuiteLibrary';

export function TestLibraryPage() {
  const { t } = useTranslation('tests');

  return (
    <PageTemplate
      title={t('testLibrary.title')}
      description={t('testLibrary.description')}
    >
      <FrameworkSuiteLibrary />
    </PageTemplate>
  );
}
