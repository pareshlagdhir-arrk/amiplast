'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { formatMoney, sanitizeAmountInput } from '@/lib/format';
import { DEFAULT_SETTINGS, type AppSettingsData } from '@/lib/settings';

type Option = { value: string; label: string };

type Product = {
  id: string;
  sr_no: number;
  name: string;
  category_id: string | null;
  category_name: string | null;
  purchase_price: string | null;
  retail_price: string | null;
  wholesale_price: string | null;
};

type Draft = {
  name: string;
  category_id: string;
  purchase_price: string;
  retail_price: string;
  wholesale_price: string;
};

const EMPTY_DRAFT: Draft = {
  name: '',
  category_id: '',
  purchase_price: '',
  retail_price: '',
  wholesale_price: '',
};

const PAGE_SIZE = 20;

type SortKey =
  | 'sr_no'
  | 'name'
  | 'category_name'
  | 'purchase_price'
  | 'retail_price'
  | 'wholesale_price';

const control =
  'rounded border border-[#2f3549] bg-[#1a1b26] px-2 py-1.5 text-sm text-[#c0caf5] outline-none focus:border-[#7aa2f7] placeholder:text-[#565f89]';

export default function ProductsPage() {
  const [format, setFormat] = useState<AppSettingsData>(DEFAULT_SETTINGS.app);
  const [categories, setCategories] = useState<Option[]>([]);

  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortKey>('sr_no');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');

  const [filterInput, setFilterInput] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadProducts = useCallback(async () => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
      sort,
      dir,
    });
    if (nameFilter) params.set('name', nameFilter);
    const res = await fetch(`/api/master/products?${params.toString()}`);
    if (!res.ok) return;
    const data = await res.json();
    setItems(data.items ?? []);
    setTotal(data.total ?? 0);
  }, [page, sort, dir, nameFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    (async () => {
      const [settingsRes, catRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/master/categories'),
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
            label: `${c.id} — ${c.name}`,
          }))
        );
      }
    })();
  }, []);

  function onFilterChange(value: string) {
    setFilterInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setPage(1);
      setNameFilter(value.trim());
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

  async function addProduct(e: React.FormEvent) {
    e.preventDefault();
    if (adding) return;
    setError('');
    if (!draft.name.trim()) {
      setError('Name is required');
      return;
    }
    setAdding(true);
    const res = await fetch('/api/master/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    setAdding(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? 'Could not add product');
      return;
    }
    setDraft(EMPTY_DRAFT);
    // Show the freshly persisted product at the top.
    setSort('sr_no');
    setDir('desc');
    setPage(1);
    await loadProducts();
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

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const headers: { key: SortKey; label: string; align?: 'right' }[] = [
    { key: 'sr_no', label: 'sr no' },
    { key: 'name', label: 'name' },
    { key: 'category_name', label: 'category' },
    { key: 'purchase_price', label: 'purchase', align: 'right' },
    { key: 'retail_price', label: 'retail', align: 'right' },
    { key: 'wholesale_price', label: 'wholesale', align: 'right' },
  ];

  return (
    <main className="mx-auto max-w-[1040px] px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#d5dcff]">products</h1>
        <div className="flex items-center gap-2">
          <input
            list="product-name-suggestions"
            value={filterInput}
            onChange={(e) => onFilterChange(e.target.value)}
            placeholder="filter by name…"
            className={`${control} w-56`}
          />
          <datalist id="product-name-suggestions">
            {suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
      </div>

      {/* Horizontal add row — press Enter to add the product instantly. */}
      <form
        onSubmit={addProduct}
        className="mb-6 rounded border border-[#2f3549] bg-[#202331] p-3"
      >
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={draft.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="name"
            className={`${control} flex-1 min-w-[160px]`}
            aria-label="name"
          />
          <select
            value={draft.category_id}
            onChange={(e) => setField('category_id', e.target.value)}
            className={`${control} min-w-[150px]`}
            aria-label="category"
          >
            <option value="">— category —</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            value={draft.purchase_price}
            onChange={(e) => setField('purchase_price', sanitizeAmountInput(e.target.value))}
            placeholder="purchase"
            inputMode="decimal"
            className={`${control} w-28 text-right`}
            aria-label="purchase price"
          />
          <input
            value={draft.retail_price}
            onChange={(e) => setField('retail_price', sanitizeAmountInput(e.target.value))}
            placeholder="retail"
            inputMode="decimal"
            className={`${control} w-28 text-right`}
            aria-label="retail price"
          />
          <input
            value={draft.wholesale_price}
            onChange={(e) => setField('wholesale_price', sanitizeAmountInput(e.target.value))}
            placeholder="wholesale"
            inputMode="decimal"
            className={`${control} w-28 text-right`}
            aria-label="wholesale price"
          />
          <button
            type="submit"
            disabled={adding}
            className="rounded bg-[#d5dcff] px-4 py-1.5 text-sm font-semibold text-[#1a1b26] transition-colors hover:bg-[#7aa2f7] hover:text-white disabled:opacity-60"
          >
            add
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-[#f7768e]">{error}</p>}
        <p className="mt-2 text-xs text-[#565f89]">press enter to add</p>
      </form>

      <div className="overflow-x-auto rounded border border-[#2f3549]">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#2f3549] text-left text-[#7aa2f7]">
              {headers.map((h) => (
                <th
                  key={h.key}
                  onClick={() => toggleSort(h.key)}
                  className={`cursor-pointer select-none px-4 py-2 font-medium lowercase tracking-wide hover:text-[#c0caf5] ${
                    h.align === 'right' ? 'text-right' : ''
                  }`}
                >
                  {h.label}
                  {sort === h.key ? (dir === 'asc' ? ' ↑' : ' ↓') : ''}
                </th>
              ))}
              <th className="px-4 py-2 text-right font-medium lowercase tracking-wide">actions</th>
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
                <tr key={p.id} className="border-b border-[#2f3549] last:border-0 text-[#c0caf5]">
                  <td className="px-4 py-2">{p.sr_no}</td>
                  <td className="px-4 py-2">{p.name}</td>
                  <td className="px-4 py-2">{p.category_name ?? '—'}</td>
                  <td className="px-4 py-2 text-right">{formatMoney(p.purchase_price, format) || '—'}</td>
                  <td className="px-4 py-2 text-right">{formatMoney(p.retail_price, format) || '—'}</td>
                  <td className="px-4 py-2 text-right">{formatMoney(p.wholesale_price, format) || '—'}</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => remove(p)} className="text-[#f7768e] hover:underline">
                      delete
                    </button>
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
