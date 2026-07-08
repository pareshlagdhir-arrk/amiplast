'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { TextField } from './form-field';
import { EntityTable, type Column } from './entity-table';

type Item = { id: string; name: string };

export function SimpleEntityPage({
  title,
  apiPath,
  codeLabel,
}: {
  title: string;
  apiPath: string;
  codeLabel: string;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [editing, setEditing] = useState<Item | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const res = await fetch(apiPath);
    const data = await res.json();
    setItems(data.items ?? []);
  }, [apiPath]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setCode('');
    setName('');
    setError('');
    setShowForm(true);
  }

  function openEdit(item: Item) {
    setEditing(item);
    setCode(item.id);
    setName(item.name);
    setError('');
    setShowForm(true);
  }

  async function submit() {
    setError('');
    const res = editing
      ? await fetch(`${apiPath}/${encodeURIComponent(editing.id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        })
      : await fetch(apiPath, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: code, name }),
        });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? 'Something went wrong');
      return;
    }
    setShowForm(false);
    await load();
  }

  async function remove(item: Item) {
    if (!window.confirm(`Delete "${item.id}"?`)) return;
    const res = await fetch(`${apiPath}/${encodeURIComponent(item.id)}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      window.alert(data.message ?? 'Delete failed');
      return;
    }
    await load();
  }

  const columns: Column<Item>[] = [
    { header: codeLabel, cell: (row) => row.id },
    { header: 'name', cell: (row) => row.name },
  ];

  return (
    <main className="mx-auto max-w-[720px] px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#d5dcff]">{title}</h1>
        <Button onClick={openCreate}>+ new</Button>
      </div>

      {showForm && (
        <section className="mb-8 rounded border border-[#2f3549] bg-[#202331] p-6">
          <h2 className="mb-4 text-base font-bold text-[#d5dcff]">
            {editing ? 'edit' : 'create'}
          </h2>
          {!editing && (
            <TextField id="code" label={codeLabel} value={code} onChange={setCode} />
          )}
          <TextField id="name" label="name" value={name} onChange={setName} />
          {error && <p className="mb-4 text-sm text-[#f7768e]">{error}</p>}
          <div className="flex gap-3">
            <Button onClick={submit}>save</Button>
            <button
              onClick={() => setShowForm(false)}
              className="text-sm text-[#737aa2] hover:text-[#c0caf5]"
            >
              cancel
            </button>
          </div>
        </section>
      )}

      <EntityTable
        columns={columns}
        rows={items}
        rowKey={(row) => row.id}
        onEdit={openEdit}
        onDelete={remove}
        empty="no records yet."
      />
    </main>
  );
}
