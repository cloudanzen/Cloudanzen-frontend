import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/app/components/ui/button';

export function VendorNotesEditor(props: {
  initial: string;
  onSave: (notes: string) => Promise<unknown>;
  saving: boolean;
}) {
  const { t } = useTranslation('vendors');
  const [notes, setNotes] = useState(props.initial);

  return (
    <div className="space-y-3">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="min-h-[160px] w-full rounded-md border border-border px-3 py-2 text-sm"
      />
      <div className="flex justify-end">
        <Button disabled={props.saving || notes === props.initial} onClick={() => props.onSave(notes)}>
          {props.saving ? t('dialog.saving') : t('detail.save')}
        </Button>
      </div>
    </div>
  );
}
