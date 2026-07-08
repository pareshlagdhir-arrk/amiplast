'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { formatAmountForInput, parseAmountFromInput } from '@/lib/format';
import { Money } from '@/lib/money';
import { DEFAULT_SETTINGS, type AppSettingsData } from '@/lib/settings';
import { EntitySelect, type EntityOption } from '@/components/dashboard/master/entity-select';

type Option = EntityOption;

type Product = {
  id: string;
  sr_no: number;
  name: string;
  category_id: string | null;
  category_name: string | null;
  base_unit_id: string | null;
  base_unit_name: string | null;
  purchase_price: string | null;
  retail_price: string | null;
  wholesale_price: string | null;
};

type Draft = {
  name: string;
  category_id: string;
  base_unit_id: string;
  purchase_price: string;
  retail_price: string;
  wholesale_price: string;
};

const EMPTY_DRAFT: Draft = {
  name: '',
  category_id: '',
  base_unit_id: '',
  purchase_price: '',
  retail_price: '',
  wholesale_price: '',
};

const PAGE_SIZE = 20;

type SortKey =
  | 'sr_no'
  | 'name'
  | 'purchase_price'
  | 'retail_price'
  | 'wholesale_price';

const control =
  'rounded border border-[#2f3549] bg-[#1a1b26] px-2 py-1.5 text-sm text-[#c0caf5] outline-none focus:border-[#7aa2f7] placeholder:text-[#565f89]';

// Price input with the configured currency symbol shown as an adornment and the
// number formatted live per the app number-format settings.
function PriceInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  settings,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  ariaLabel: string;
  settings: AppSettingsData;
}) {
  const symbol = settings.currency;
  const isPrefix = settings.position === 'prefix';
  const adornment = symbol ? (
    <span className="px-1.5 flex items-center text-xs text-[#737aa2]">{symbol}</span>
  ) : null;
  return (
    <div
      className={`flex items-stretch overflow-hidden rounded border border-[#2f3549] bg-[#1a1b26] focus-within:border-[#7aa2f7] ${
        isPrefix ? '' : 'flex-row-reverse'
      }`}
    >
      {adornment}
      <input
        value={formatAmountForInput(value, settings)}
        onChange={(e) => onChange(parseAmountFromInput(e.target.value, settings))}
        placeholder={placeholder}
        inputMode="decimal"
        aria-label={ariaLabel}
        className={`w-28 bg-transparent px-2 py-1.5 text-sm text-[#c0caf5] outline-none placeholder:text-[#565f89] ${
          isPrefix ? 'text-left' : 'text-right'
        }`}
      />
    </div>
  );
}

export default function ProductsPage() {
  const [format, setFormat] = useState<AppSettingsData>(DEFAULT_SETTINGS.app);
  const [categories, setCategories] = useState<Option[]>([]);
  const [baseUnits, setBaseUnits] = useState<Option[]>([]);

  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortKey>('sr_no');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');

  const [filterName, setFilterName] = useState('');
  const [filterInput, setFilterInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterUnit, setFilterUnit] = useState('');

  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const loadProducts = useCallback(async () => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
      sort,
      dir,
    });
    if (filterName) params.set('name', filterName);
    if (filterCategory) params.set('categoryId', filterCategory);
    if (filterUnit) params.set('unitId', filterUnit);
    const res = await fetch(`/api/master/products?${params.toString()}`);
    if (!res.ok) return;
    const data = await res.json();
    setItems(data.items ?? []);
    setTotal(data.total ?? 0);
  }, [page, sort, dir, filterName, filterCategory, filterUnit]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    (async () => {
      const [settingsRes, catRes, unitRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/master/categories'),
        fetch('/api/master/base-units'),
      ]);
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        if (data.settings?.app) setFormat({ ...DEFAULT_SETTINGS.app, ...data.settings.app });
      }
      if (catRes.ok) {
        const data = await catRes.json();
        setCategories(
          (data.items ?? []).map((c: { id: string; name: string }) => ({
            value: c.id,
            label: c.name,
          }))
        );
      }
      if (unitRes.ok) {
        const data = await unitRes.json();
        setBaseUnits(
          (data.items ?? []).map((u: { id: string; name: string }) => ({
            value: u.id,
            label: u.name,
          }))
        );
      }
    })();
  }, []);

  function onFilterNameChange(value: string) {
    setFilterInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setPage(1);
      setFilterName(value.trim());
      if (value.trim()) {
        const res = await fetch(`/api/master/products/names?q=${encodeURIComponent(value.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.names ?? []);
        }
      } else {
        setSuggestions([]);
      }
    }, 300);
  }

  function toggleSort(key: SortKey) {
    if (sort === key) {
      setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(key);
      setDir('asc');
    }
    setPage(1);
  }

  function setField<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (adding) return;
    setError('');
    if (!draft.name.trim()) {
      setError('Name is required');
      return;
    }
    setAdding(true);
    const isEditing = Boolean(editingId);
    const url = isEditing
      ? `/api/master/products/${encodeURIComponent(editingId!)}`
      : '/api/master/products';
    const method = isEditing ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    setAdding(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? `Could not ${isEditing ? 'update' : 'add'} product`);
      return;
    }
    cancelEdit();
    if (!isEditing) {
      setSort('sr_no');
      setDir('desc');
      setPage(1);
    }
    await loadProducts();
  }

  function editProduct(p: Product) {
    setEditingId(p.id);
    setDraft({
      name: p.name,
      category_id: p.category_id ?? '',
      base_unit_id: p.base_unit_id ?? '',
      purchase_price: p.purchase_price ?? '',
      retail_price: p.retail_price ?? '',
      wholesale_price: p.wholesale_price ?? '',
    });
    setError('');
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setError('');
  }

  async function remove(product: Product) {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    const res = await fetch(`/api/master/products/${encodeURIComponent(product.id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      window.alert(data.message ?? 'Delete failed');
      return;
    }
    await loadProducts();
  }

  function resetFilters() {
    setFilterInput('');
    setFilterName('');
    setSuggestions([]);
    setFilterCategory('');
    setFilterUnit('');
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const headers: { key: SortKey; label: string; align?: 'right' }[] = [
    { key: 'sr_no', label: 'SR NO' },
    { key: 'name', label: 'NAME' },
    { key: 'purchase_price', label: 'PURCHASE PRICE', align: 'right' },
    { key: 'retail_price', label: 'RETAIL PRICE', align: 'right' },
    { key: 'wholesale_price', label: 'WHOLESALE PRICE', align: 'right' },
  ];

  // Tighter horizontal padding for the three price columns so they cluster
  // together rather than spreading out across the row.
  const colPadding: Partial<Record<SortKey | 'actions', string>> = {
    sr_no: 'px-2',
    purchase_price: 'px-2',
    retail_price: 'px-2',
    wholesale_price: 'px-2',
    actions: 'px-4',
  };

  const colWidths: Partial<Record<SortKey | 'actions', string>> = {
    sr_no: 'w-12 whitespace-nowrap',
    purchase_price: 'w-40 whitespace-nowrap',
    retail_price: 'w-40 whitespace-nowrap',
    wholesale_price: 'w-40 whitespace-nowrap',
    actions: 'w-28',
  };

  return (
    <main className="w-full px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#d5dcff]">PRODUCTS</h1>
      </div>

      {/* Horizontal add/edit row — press Enter to save the product instantly. */}
      <form
        ref={formRef}
        onSubmit={saveProduct}
        className={`mb-6 rounded border p-3 transition-colors ${
          editingId
            ? 'border-[#7aa2f7] bg-[#1f2438] ring-1 ring-[#7aa2f7]/40'
            : 'border-[#2f3549] bg-[#202331]'
        }`}
      >
        {editingId && (
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#7aa2f7]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            editing product
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={draft.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="NAME"
            className={`${control} flex-1 min-w-[160px]`}
            aria-label="name"
          />
          <EntitySelect
            value={draft.category_id}
            onChange={(v) => setField('category_id', v)}
            options={categories}
            placeholder="— CATEGORY —"
            apiPath="/api/master/categories"
            className="min-w-[150px]"
            onCreated={(item) =>
              setCategories((prev) =>
                prev.some((o) => o.value === item.id)
                  ? prev
                  : [...prev, { value: item.id, label: item.name }]
              )
            }
          />
          <EntitySelect
            value={draft.base_unit_id}
            onChange={(v) => setField('base_unit_id', v)}
            options={baseUnits}
            placeholder="— UNIT —"
            apiPath="/api/master/base-units"
            className="min-w-[130px]"
            onCreated={(item) =>
              setBaseUnits((prev) =>
                prev.some((o) => o.value === item.id)
                  ? prev
                  : [...prev, { value: item.id, label: item.name }]
              )
            }
          />
          <PriceInput
            value={draft.purchase_price}
            onChange={(v) => setField('purchase_price', v)}
            placeholder="PURCHASE PRICE"
            ariaLabel="purchase price"
            settings={format}
          />
          <PriceInput
            value={draft.retail_price}
            onChange={(v) => setField('retail_price', v)}
            placeholder="RETAIL PRICE"
            ariaLabel="retail price"
            settings={format}
          />
          <PriceInput
            value={draft.wholesale_price}
            onChange={(v) => setField('wholesale_price', v)}
            placeholder="WHOLESALE PRICE"
            ariaLabel="wholesale price"
            settings={format}
          />
          {/* Hidden submit so Enter in any input submits the form. */}
          <button type="submit" className="hidden" tabIndex={-1} aria-hidden="true" />
        </div>
        {error && <p className="mt-2 text-sm text-[#f7768e]">{error}</p>}
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-[#565f89]">
            {editingId ? 'editing — press enter to save' : 'press enter to add'}
          </p>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="text-xs text-[#737aa2] hover:text-[#c0caf5]"
            >
              cancel edit
            </button>
          )}
        </div>
      </form>

      {/* Filter panel — sits below the add row. */}
      <section className="mb-6 rounded border border-[#2f3549] bg-[#202331] p-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#7aa2f7]">
          Filters
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            list="product-name-suggestions"
            value={filterInput}
            onChange={(e) => onFilterNameChange(e.target.value)}
            placeholder="NAME"
            className={`${control} w-80`}
            aria-label="filter by name"
          />
          <datalist id="product-name-suggestions">
            {suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setPage(1);
            }}
            className={`${control} min-w-[150px]`}
            aria-label="filter by category"
          >
            <option value="">— CATEGORY —</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            value={filterUnit}
            onChange={(e) => {
              setFilterUnit(e.target.value);
              setPage(1);
            }}
            className={`${control} min-w-[130px]`}
            aria-label="filter by unit"
          >
            <option value="">— UNIT —</option>
            {baseUnits.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={resetFilters}
            disabled={!filterName && !filterCategory && !filterUnit}
            className="rounded border border-[#f7768e]/40 px-2 py-0.5 text-xs font-medium text-[#f7768e] hover:border-[#f7768e] hover:bg-[#f7768e]/10 disabled:opacity-30 disabled:hover:border-[#f7768e]/40 disabled:hover:bg-transparent"
          >
            clear all
          </button>
        </div>
      </section>

      <div className="overflow-x-auto rounded border border-[#2f3549]">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#2f3549] text-left text-[#7aa2f7]">
              {headers.map((h) => (
                <th
                  key={h.key}
                  onClick={() => toggleSort(h.key)}
                  className={`cursor-pointer select-none py-2 font-medium uppercase tracking-wide hover:text-[#c0caf5] ${
                    h.align === 'right' ? 'text-right' : ''
                  } ${colWidths[h.key] ?? ''} ${colPadding[h.key] ?? 'px-4'}`}
                >
                  {h.label}
                  {sort === h.key ? (dir === 'asc' ? ' ↑' : ' ↓') : ''}
                </th>
              ))}
              <th className={`py-2 text-right font-medium uppercase tracking-wide ${colWidths.actions ?? ''} ${colPadding.actions ?? 'px-4'}`}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={headers.length + 1} className="px-4 py-8 text-center text-sm text-[#565f89]">
                  no products yet.
                </td>
              </tr>
            ) : (
              items.map((p) => (
                <tr
                  key={p.id}
                  className={`border-b border-[#2f3549] last:border-0 text-[#c0caf5] ${
                    editingId === p.id
                      ? 'bg-[#7aa2f7]/10 ring-1 ring-inset ring-[#7aa2f7]/40'
                      : ''
                  }`}
                >
                  <td className="px-2 py-2 text-[#737aa2] whitespace-nowrap">{p.sr_no}</td>
                  <td className="px-4 py-2">
                    <div className="font-medium text-[#d5dcff]">{p.name}</div>
                    <div className="text-xs text-[#737aa2]">
                      {p.category_name ?? '—'} · {p.base_unit_name ?? '—'}
                    </div>
                  </td>
                  <td className="px-2 py-2 text-right whitespace-nowrap"><Money value={p.purchase_price} settings={format} /></td>
                  <td className="px-2 py-2 text-right whitespace-nowrap"><Money value={p.retail_price} settings={format} /></td>
                  <td className="px-2 py-2 text-right whitespace-nowrap"><Money value={p.wholesale_price} settings={format} /></td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-4">
                      <button
                        onClick={() => editProduct(p)}
                        title="Edit"
                        aria-label="Edit"
                        className={`transition-colors ${
                          editingId === p.id
                            ? 'text-[#7aa2f7]'
                            : 'text-[#737aa2] hover:text-[#7aa2f7]'
                        }`}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => remove(p)}
                        title="Delete"
                        aria-label="Delete"
                        className="text-[#f7768e] hover:text-[#ff9e9e]"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-[#737aa2]">
        <span>
          {total} product{total === 1 ? '' : 's'} · page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded border border-[#2f3549] px-3 py-1 hover:border-[#7aa2f7] hover:text-[#7aa2f7] disabled:opacity-40 disabled:hover:border-[#2f3549] disabled:hover:text-[#737aa2]"
          >
            prev
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded border border-[#2f3549] px-3 py-1 hover:border-[#7aa2f7] hover:text-[#7aa2f7] disabled:opacity-40 disabled:hover:border-[#2f3549] disabled:hover:text-[#737aa2]"
          >
            next
          </button>
        </div>
      </div>
    </main>
  );
}
