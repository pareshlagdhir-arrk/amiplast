'use client';

import { useState } from 'react';

export type EntityOption = { value: string; label: string };

export type EntitySelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: EntityOption[];
  placeholder: string;
  apiPath: string;
  onCreated?: (item: { id: string; name: string }) => void;
  className?: string;
  disabled?: boolean;
};

const NEW_SENTINEL = '__add_new__';

const inputCls =
  'rounded border border-[#2f3549] bg-[#1a1b26] px-2 py-1.5 text-sm text-[#c0caf5] outline-none focus:border-[#7aa2f7] placeholder:text-[#565f89]';

// A select-like control that lists existing entities and always exposes an
// "Add new…" entry at the bottom. Selecting it swaps the control for an inline
// name-only form which creates the entity via POST and then selects it. The ID
// is generated server-side, so the user only ever supplies a name.
export function EntitySelect({
  value,
  onChange,
  options,
  placeholder,
  apiPath,
  onCreated,
  className,
  disabled,
}: EntitySelectProps) {
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function handleSelect(v: string) {
    if (v === NEW_SENTINEL) {
      setName('');
      setError('');
      setMode('create');
      return;
    }
    onChange(v);
  }

  async function save() {
    if (saving) return;
    setError('');
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    const res = await fetch(apiPath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? 'Could not create');
      return;
    }
    const data = (await res.json()) as { item: { id: string; name: string } };
    onCreated?.(data.item);
    onChange(data.item.id);
    setMode('select');
  }

  if (mode === 'create') {
    return (
      <div className={`flex items-center gap-1 ${className ?? ''}`}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="NAME"
          className={`${inputCls} flex-1 min-w-[120px]`}
          aria-label="name"
          disabled={saving}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void save();
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              setMode('select');
            }
          }}
        />
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="rounded bg-[#7aa2f7] px-2 py-1 text-xs font-semibold text-[#1a1b26] hover:bg-[#d5dcff] disabled:opacity-60"
        >
          save
        </button>
        <button
          type="button"
          onClick={() => setMode('select')}
          disabled={saving}
          className="text-xs text-[#737aa2] hover:text-[#c0caf5]"
        >
          cancel
        </button>
        {error && <span className="text-xs text-[#f7768e]">{error}</span>}
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => handleSelect(e.target.value)}
      className={`${inputCls} ${className ?? ''}`}
      disabled={disabled}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
      <option value={NEW_SENTINEL}>+ add new…</option>
    </select>
  );
}
