'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { AppSettingsData } from '@/lib/settings';
import styles from './app-settings.module.css';

export type { AppSettingsData };

const CURRENCIES = [
  { value: 'MGA', label: 'MGA — Malagasy Ariary' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'GBP', label: 'GBP — British Pound' },
];

const NUMBER_FORMATS = [
  { value: 'fr', label: 'French (1 234,56)' },
  { value: 'en', label: 'English (1,234.56)' },
  { value: 'de', label: 'German (1.234,56)' },
];

interface AppSettingsProps {
  data: AppSettingsData;
  onChange: (data: AppSettingsData) => void;
}

function Select({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className={styles.field}>
      <Label htmlFor={id}>{label}:</Label>
      <div className={styles.selectWrapper}>
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${styles.select} text-sm`}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  type = 'text',
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className={styles.field}>
      <Label htmlFor={id}>{label}:</Label>
      <div className={styles.inputWrapper}>
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

export function AppSettings({ data, onChange }: AppSettingsProps) {
  function update<K extends keyof AppSettingsData>(key: K, value: AppSettingsData[K]) {
    onChange({ ...data, [key]: value });
  }

  return (
    <section className={styles.section}>
      <h2 className={`${styles.heading} text-base font-bold`}>app settings</h2>

      <TextField id="appTitle" label="app title" value={data.appTitle} onChange={(v) => update('appTitle', v)} />

      <Select id="currency" label="currency" value={data.currency} options={CURRENCIES} onChange={(v) => update('currency', v)} />

      <div className={styles.field}>
        <Label>currency position:</Label>
        <div className={styles.radioGroup}>
          <label className={`${styles.radioLabel} text-sm`}>
            <span className={styles.bracket}>[</span>
            <input
              type="radio"
              name="position"
              value="prefix"
              checked={data.position === 'prefix'}
              onChange={() => update('position', 'prefix')}
              className={styles.radio}
            />
            <span className={styles.bracket}>]</span>
            prefix
          </label>
          <label className={`${styles.radioLabel} text-sm`}>
            <span className={styles.bracket}>[</span>
            <input
              type="radio"
              name="position"
              value="suffix"
              checked={data.position === 'suffix'}
              onChange={() => update('position', 'suffix')}
              className={styles.radio}
            />
            <span className={styles.bracket}>]</span>
            suffix
          </label>
        </div>
      </div>

      <Select id="numberFormat" label="number format" value={data.numberFormat} options={NUMBER_FORMATS} onChange={(v) => update('numberFormat', v)} />

      <TextField id="salesInvoiceStart" label="sales invoice starting #" value={data.salesInvoiceStart} type="number" onChange={(v) => update('salesInvoiceStart', v)} />

      <TextField id="purchaseInvoiceStart" label="purchase invoice starting #" value={data.purchaseInvoiceStart} type="number" onChange={(v) => update('purchaseInvoiceStart', v)} />

      <TextField id="defaultMargin" label="default margin %" value={data.defaultMargin} type="number" onChange={(v) => update('defaultMargin', v)} />
    </section>
  );
}