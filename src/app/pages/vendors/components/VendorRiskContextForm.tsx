import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { UpdateVendorInput, VendorRecord } from '@/services/api/vendors';
import { type UserWithGit } from '@/services/api/users';

function Labeled(props: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{props.label}</p>
      {props.children}
    </div>
  );
}

export function VendorRiskContextForm(props: {
  vendor: VendorRecord;
  orgUsers: UserWithGit[];
  onSave: (patch: UpdateVendorInput) => Promise<unknown>;
  saving: boolean;
}) {
  const { t } = useTranslation('vendors');
  const [businessCriticality, setBusinessCriticality] = useState<UpdateVendorInput['businessCriticality']>(props.vendor.businessCriticality);
  const [dataClass, setDataClass] = useState<UpdateVendorInput['dataClass']>(props.vendor.dataClass);
  const [subprocessors, setSubprocessors] = useState(props.vendor.subprocessors);
  const [dpaSigned, setDpaSigned] = useState(props.vendor.dpaSigned);
  const [ownerUserId, setOwnerUserId] = useState(props.vendor.ownerUserId ?? '');

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Labeled label={t('detail.owner')}>
        <select value={ownerUserId} onChange={(e) => setOwnerUserId(e.target.value)} className="rounded-md border border-border px-3 py-2 text-sm">
          <option value="">{t('dialog.ownerPlaceholder')}</option>
          {props.orgUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name ? `${u.name} (${u.email})` : u.email}
            </option>
          ))}
        </select>
      </Labeled>
      <Labeled label={t('detail.businessCriticality')}>
        <select
          value={businessCriticality}
          onChange={(e) => setBusinessCriticality(e.target.value as UpdateVendorInput['businessCriticality'])}
          className="rounded-md border border-border px-3 py-2 text-sm"
        >
          <option value="Mission-critical">Mission-critical</option>
          <option value="Business-important">Business-important</option>
          <option value="Operational">Operational</option>
        </select>
      </Labeled>
      <Labeled label={t('detail.dataClass')}>
        <select value={dataClass} onChange={(e) => setDataClass(e.target.value as UpdateVendorInput['dataClass'])} className="rounded-md border border-border px-3 py-2 text-sm">
          <option value="PII">PII</option>
          <option value="Sensitive">Sensitive</option>
          <option value="Internal">Internal</option>
          <option value="Public">Public</option>
        </select>
      </Labeled>
      <Labeled label={t('detail.subprocessors')}>
        <Input type="number" min={0} value={subprocessors} onChange={(e) => setSubprocessors(Number(e.target.value) || 0)} />
      </Labeled>
      <Labeled label={t('detail.dpa')}>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={dpaSigned} onChange={(e) => setDpaSigned(e.target.checked)} />
          {t('detail.dpaCheckboxLabel')}
        </label>
      </Labeled>
      <div className="sm:col-span-2 flex justify-end">
        <Button
          disabled={props.saving}
          onClick={() =>
            props.onSave({
              businessCriticality,
              dataClass,
              subprocessors,
              dpaSigned,
              ownerUserId: ownerUserId || null,
            })
          }
        >
          {props.saving ? t('dialog.saving') : t('detail.save')}
        </Button>
      </div>
    </div>
  );
}
