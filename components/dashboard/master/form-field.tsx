'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const controlClass =
  'w-full rounded border border-[#2f3549] bg-[#1a1b26] px-3 py-2 text-sm text-[#c0caf5] outline-none focus:border-[#7aa2f7]';

export function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  textarea = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
}) {
  return (
    <div className="mb-4">
      <Label htmlFor={id} className="mb-1 block">
        {label}
      </Label>
      {textarea ? (
        <textarea
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={`${controlClass} placeholder:text-[#565f89]`}
        />
      ) : (
        <Input
          id={id}
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`h-auto ${controlClass} placeholder:text-[#565f89]`}
        />
      )}
    </div>
  );
}

export function SelectField({
  id,
  label,
  value,
  options,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <Label htmlFor={id} className="mb-1 block">
        {label}
      </Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={controlClass}
      >
        <option value="">— select —</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {children}
    </div>
  );
}
