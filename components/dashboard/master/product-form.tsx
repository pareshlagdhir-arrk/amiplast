'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TextField, SelectField } from './form-field';

export type ProductDraft = {
  sku: string;
  name: string;
  description: string;
  category_id: string;
  base_unit_id: string;
  purchase_price: string;
  retail_price: string;
  wholesale_price: string;
};

type Option = { value: string; label: string };

// Inline "+ new" sub-form for creating a category or base unit without leaving
// the product form. On success it returns the new id to the caller.
function QuickCreate({
  label,
  apiPath,
  onCreated,
  onCancel,
}: {
  label: string;
  apiPath: string;
  onCreated: (id: string) => void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  async function create() {
    setError('');
    const res = await fetch(apiPath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: code, name }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? 'Create failed');
      return;
    }
    const data = await res.json();
    onCreated(data.item.id);
  }

  return (
    <div className="mb-4 rounded border border-[#2f3549] bg-[#1a1b26] p-3">
      <p className="mb-2 text-xs lowercase tracking-wide text-[#7aa2f7]">new {label}</p>
      <TextField id={`qc-${label}-code`} label="code" value={code} onChange={setCode} />
      <TextField id={`qc-${label}-name`} label="name" value={name} onChange={setName} />
      {error && <p className="mb-2 text-sm text-[#f7768e]">{error}</p>}
      <div className="flex gap-3">
        <Button onClick={create}>add</Button>
        <button onClick={onCancel} className="text-sm text-[#737aa2] hover:text-[#c0caf5]">
          cancel
        </button>
      </div>
    </div>
  );
}

export function ProductForm({
  initial,
  isEdit,
  categories,
  baseUnits,
  onSubmit,
  onCancel,
  onCategoryCreated,
  onBaseUnitCreated,
}: {
  initial: ProductDraft;
  isEdit: boolean;
  categories: Option[];
  baseUnits: Option[];
  onSubmit: (draft: ProductDraft) => Promise<string | null>;
  onCancel: () => void;
  onCategoryCreated: (id: string) => Promise<void>;
  onBaseUnitCreated: (id: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState<ProductDraft>(initial);
  const [error, setError] = useState('');
  const [quick, setQuick] = useState<'category' | 'base_unit' | null>(null);

  function set<K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function handleSave() {
    setError('');
    const message = await onSubmit(draft);
    if (message) setError(message);
  }

  return (
    <section className="mb-8 rounded border border-[#2f3549] bg-[#202331] p-6">
      <h2 className="mb-4 text-base font-bold text-[#d5dcff]">{isEdit ? 'edit product' : 'create product'}</h2>

      <TextField id="sku" label="sku" value={draft.sku} onChange={(v) => set('sku', v)} />
      <TextField id="name" label="name" value={draft.name} onChange={(v) => set('name', v)} />
      <TextField id="description" label="description" value={draft.description} onChange={(v) => set('description', v)} textarea />

      <SelectField
        id="category_id"
        label="category"
        value={draft.category_id}
        options={categories}
        onChange={(v) => set('category_id', v)}
      >
        <button
          type="button"
          onClick={() => setQuick(quick === 'category' ? null : 'category')}
          className="mt-1 text-xs text-[#7aa2f7] hover:underline"
        >
          + new category
        </button>
      </SelectField>
      {quick === 'category' && (
        <QuickCreate
          label="category"
          apiPath="/api/master/categories"
          onCreated={async (id) => {
            await onCategoryCreated(id);
            set('category_id', id);
            setQuick(null);
          }}
          onCancel={() => setQuick(null)}
        />
      )}

      <SelectField
        id="base_unit_id"
        label="base unit"
        value={draft.base_unit_id}
        options={baseUnits}
        onChange={(v) => set('base_unit_id', v)}
      >
        <button
          type="button"
          onClick={() => setQuick(quick === 'base_unit' ? null : 'base_unit')}
          className="mt-1 text-xs text-[#7aa2f7] hover:underline"
        >
          + new base unit
        </button>
      </SelectField>
      {quick === 'base_unit' && (
        <QuickCreate
          label="base unit"
          apiPath="/api/master/base-units"
          onCreated={async (id) => {
            await onBaseUnitCreated(id);
            set('base_unit_id', id);
            setQuick(null);
          }}
          onCancel={() => setQuick(null)}
        />
      )}

      <TextField id="purchase_price" label="purchase price" value={draft.purchase_price} onChange={(v) => set('purchase_price', v)} />
      <TextField id="retail_price" label="retail price" value={draft.retail_price} onChange={(v) => set('retail_price', v)} />
      <TextField id="wholesale_price" label="wholesale price" value={draft.wholesale_price} onChange={(v) => set('wholesale_price', v)} />

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
