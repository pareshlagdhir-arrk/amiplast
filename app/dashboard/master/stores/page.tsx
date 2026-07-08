'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { EntityTable, type Column } from '@/components/dashboard/master/entity-table';
import { StoreForm, type StoreDraft } from '@/components/dashboard/master/store-form';

type Store = StoreDraft & { created_at: string; updated_at: string };

const EMPTY: StoreDraft = { id: '', name: '', address: '', phone: '', email: '', type: '', is_default: false };

export default function StoresPage() {
  const [items, setItems] = useState<Store[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Store | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/master/stores');
    const data = await res.json();
    setItems(data.items ?? []);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(store: Store) {
    setEditing(store);
    setShowForm(true);
  }

  async function submit(draft: StoreDraft): Promise<string | null> {
    const res = editing
      ? await fetch(`/api/master/stores/${encodeURIComponent(editing.id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draft),
        })
      : await fetch('/api/master/stores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draft),
        });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return data.message ?? 'Something went wrong';
    }
    setShowForm(false);
    await load();
    return null;
  }

  async function remove(store: Store) {
    if (!window.confirm(`Delete store "${store.id}"?`)) return;
    const res = await fetch(`/api/master/stores/${encodeURIComponent(store.id)}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      window.alert(data.message ?? 'Delete failed');
      return;
    }
    await load();
  }

  const columns: Column<Store>[] = [
    { header: 'store id', cell: (row) => row.id },
    { header: 'name', cell: (row) => row.name },
    { header: 'type', cell: (row) => row.type },
    { header: 'phone', cell: (row) => row.phone || '—' },
    { header: 'email', cell: (row) => row.email || '—' },
    { header: 'default', cell: (row) => (row.is_default ? 'yes' : '') },
  ];

  return (
    <main className="mx-auto max-w-[820px] px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#d5dcff]">stores</h1>
        <Button onClick={openCreate}>+ new</Button>
      </div>

      {showForm && (
        <StoreForm
          initial={editing ?? EMPTY}
          isEdit={Boolean(editing)}
          onSubmit={submit}
          onCancel={() => setShowForm(false)}
        />
      )}

      <EntityTable
        columns={columns}
        rows={items}
        rowKey={(row) => row.id}
        onEdit={openEdit}
        onDelete={remove}
        empty="no stores yet."
      />
    </main>
  );
}
