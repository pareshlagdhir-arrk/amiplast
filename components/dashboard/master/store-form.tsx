'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TextField, SelectField } from './form-field';

export type StoreDraft = {
  id: string;
  name: string;
  address: string;
  phone: string;
  type: string;
  is_default: boolean;
};

const TYPE_OPTIONS = [
  { value: 'warehouse', label: 'warehouse' },
  { value: 'showroom', label: 'showroom' },
  { value: 'outlet', label: 'outlet' },
  { value: 'other', label: 'other' },
];

export function StoreForm({
  initial,
  isEdit,
  onSubmit,
  onCancel,
}: {
  initial: StoreDraft;
  isEdit: boolean;
  onSubmit: (draft: StoreDraft) => Promise<string | null>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<StoreDraft>(initial);
  const [error, setError] = useState('');

  function set<K extends keyof StoreDraft>(key: K, value: StoreDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function handleSave() {
    setError('');
    const message = await onSubmit(draft);
    if (message) setError(message);
  }

  const canBeDefault = draft.type === 'warehouse';

  return (
    <section className="mb-8 rounded border border-[#2f3549] bg-[#202331] p-6">
      <h2 className="mb-4 text-base font-bold text-[#d5dcff]">{isEdit ? 'edit store' : 'create store'}</h2>
      {!isEdit && (
        <TextField id="id" label="store id" value={draft.id} onChange={(v) => set('id', v)} />
      )}
      <TextField id="name" label="store name" value={draft.name} onChange={(v) => set('name', v)} />
      <TextField id="address" label="address" value={draft.address} onChange={(v) => set('address', v)} textarea />
      <TextField id="phone" label="phone" value={draft.phone} onChange={(v) => set('phone', v)} />
      <SelectField
        id="type"
        label="type"
        value={draft.type}
        options={TYPE_OPTIONS}
        onChange={(v) => {
          set('type', v);
          if (v !== 'warehouse') set('is_default', false);
        }}
      />
      <label className="mb-4 flex items-center gap-2 text-sm text-[#c0caf5]">
        <input
          type="checkbox"
          checked={draft.is_default}
          disabled={!canBeDefault}
          onChange={(e) => set('is_default', e.target.checked)}
        />
        <span className={canBeDefault ? '' : 'text-[#565f89]'}>
          default (warehouse only)
        </span>
      </label>
      {error && <p className="mb-4 text-sm text-[#f7768e]">{error}</p>}
      <div className="flex gap-3">
        <Button onClick={handleSave}>save</Button>
        <button onClick={onCancel} className="text-sm text-[#737aa2] hover:text-[#c0caf5]">
          cancel
        </button>
      </div>
    </section>
  );
}
