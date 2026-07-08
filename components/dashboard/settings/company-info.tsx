'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import styles from './company-info.module.css';

export interface CompanyInfoData {
  name: string;
  address: string;
  city: string;
  country: string;
  email: string;
  phone: string;
}

interface CompanyInfoProps {
  data: CompanyInfoData;
  onChange: (data: CompanyInfoData) => void;
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

export function CompanyInfo({ data, onChange }: CompanyInfoProps) {
  function update<K extends keyof CompanyInfoData>(key: K, value: CompanyInfoData[K]) {
    onChange({ ...data, [key]: value });
  }

  return (
    <section className={styles.section}>
      <h2 className={`${styles.heading} text-base font-bold`}>company information</h2>

      <div className={styles.grid}>
        <TextField id="companyName" label="name" value={data.name} onChange={(v) => update('name', v)} />
        <TextField id="companyEmail" label="email" value={data.email} type="email" onChange={(v) => update('email', v)} />
        <TextField id="companyPhone" label="phone" value={data.phone} type="tel" onChange={(v) => update('phone', v)} />
        <TextField id="companyAddress" label="address" value={data.address} onChange={(v) => update('address', v)} />
        <TextField id="companyCity" label="city" value={data.city} onChange={(v) => update('city', v)} />
        <TextField id="companyCountry" label="country" value={data.country} onChange={(v) => update('country', v)} />
      </div>
    </section>
  );
}