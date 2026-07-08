'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { EntityTable, type Column } from '@/components/dashboard/master/entity-table';
import { ProductForm, type ProductDraft } from '@/components/dashboard/master/product-form';

type Option = { value: string; label: string };

type Product = {
  id: string;
  sr_no: number;
  sku: string;
  name: string;
  description: string | null;
  category_id: string;
  base_unit_id: string;
  category_name: string;
  base_unit_name: string;
  purchase_price: string | null;
  retail_price: string | null;
  wholesale_price: string | null;
};

const EMPTY: ProductDraft = {
  sku: '',
  name: '',
  description: '',
  category_id: '',
  base_unit_id: '',
  purchase_price: '',
  retail_price: '',
  wholesale_price: '',
};

function toOptions(items: { id: string; name: string }[]): Option[] {
  return items.map((it) => ({ value: it.id, label: `${it.id} — ${it.name}` }));
}

export default function ProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [baseUnits, setBaseUnits] = useState<Option[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const loadProducts = useCallback(async () => {
    const res = await fetch('/api/master/products');
    const data = await res.json();
    setItems(data.items ?? []);
  }, []);

  const loadCategories = useCallback(async () => {
    const res = await fetch('/api/master/categories');
    const data = await res.json();
    setCategories(toOptions(data.items ?? []));
  }, []);

  const loadBaseUnits = useCallback(async () => {
    const res = await fetch('/api/master/base-units');
    const data = await res.json();
    setBaseUnits(toOptions(data.items ?? []));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProducts();
    void loadCategories();
    void loadBaseUnits();
  }, [loadProducts, loadCategories, loadBaseUnits]);

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setShowForm(true);
  }

  function draftFrom(product: Product): ProductDraft {
    return {
      sku: product.sku,
      name: product.name,
      description: product.description ?? '',
      category_id: product.category_id,
      base_unit_id: product.base_unit_id,
      purchase_price: product.purchase_price ?? '',
      retail_price: product.retail_price ?? '',
      wholesale_price: product.wholesale_price ?? '',
    };
  }

  async function submit(draft: ProductDraft): Promise<string | null> {
    const res = editing
      ? await fetch(`/api/master/products/${encodeURIComponent(editing.id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draft),
        })
      : await fetch('/api/master/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draft),
        });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return data.message ?? 'Something went wrong';
    }
    setShowForm(false);
    await loadProducts();
    return null;
  }

  async function remove(product: Product) {
    if (!window.confirm(`Delete product "${product.sku}"?`)) return;
    const res = await fetch(`/api/master/products/${encodeURIComponent(product.id)}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      window.alert(data.message ?? 'Delete failed');
      return;
    }
    await loadProducts();
  }

  async function resetSrNo() {
    if (!window.confirm('Reset the product Sr No counter back to 1?')) return;
    await fetch('/api/master/products/reset-sr', { method: 'POST' });
    window.alert('Sr No counter reset to 1.');
  }

  const columns: Column<Product>[] = [
    { header: 'sr no', cell: (row) => row.sr_no },
    { header: 'sku', cell: (row) => row.sku },
    { header: 'name', cell: (row) => row.name },
    { header: 'category', cell: (row) => row.category_name },
    { header: 'unit', cell: (row) => row.base_unit_name },
    { header: 'retail', cell: (row) => row.retail_price ?? '—' },
  ];

  return (
    <main className="mx-auto max-w-[960px] px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#d5dcff]">products</h1>
        <div className="flex gap-3">
          <button onClick={resetSrNo} className="text-sm text-[#737aa2] hover:text-[#c0caf5]">
            reset sr no
          </button>
          <Button onClick={openCreate}>+ new</Button>
        </div>
      </div>

      {showForm && (
        <ProductForm
          initial={editing ? draftFrom(editing) : EMPTY}
          isEdit={Boolean(editing)}
          categories={categories}
          baseUnits={baseUnits}
          onSubmit={submit}
          onCancel={() => setShowForm(false)}
          onCategoryCreated={async () => {
            await loadCategories();
          }}
          onBaseUnitCreated={async () => {
            await loadBaseUnits();
          }}
        />
      )}

      <EntityTable
        columns={columns}
        rows={items}
        rowKey={(row) => row.id}
        onEdit={openEdit}
        onDelete={remove}
        empty="no products yet."
      />
    </main>
  );
}
