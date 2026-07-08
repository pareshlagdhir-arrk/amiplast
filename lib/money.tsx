import type { AppSettingsData } from '@/lib/settings';
import type { ReactNode } from 'react';

const LOCALES: Record<string, string> = {
  fr: 'fr-FR',
  en: 'en-US',
  de: 'de-DE',
};

// Thin gap (U+2009) between currency symbol and number — tighter than a full
// space but readable.
const THIN = '\u2009';

function formatNum(
  value: string | number | null | undefined,
  settings: Pick<AppSettingsData, 'numberFormat'>
): string {
  if (value === null || value === undefined || value === '') return '';
  const n = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(n)) return String(value);
  const locale = LOCALES[settings.numberFormat] ?? LOCALES.fr;
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

// Formats a money value as a plain string (no styling). Used where JSX isn't
// appropriate. Returns an empty string for blank/null values.
export function formatMoney(
  value: string | number | null | undefined,
  settings: Pick<AppSettingsData, 'numberFormat' | 'currency' | 'position'>
): string {
  const num = formatNum(value, settings);
  if (!num) return '';
  if (!settings.currency) return num;
  return settings.position === 'prefix'
    ? `${settings.currency}${THIN}${num}`
    : `${num}${THIN}${settings.currency}`;
}

// Renders a money value with the currency symbol in a muted-but-distinct color
// and a thin space separating it from the number. Returns '—' for blanks so
// table cells stay aligned.
export function Money({
  value,
  settings,
  fallback = '—',
}: {
  value: string | number | null | undefined;
  settings: Pick<AppSettingsData, 'numberFormat' | 'currency' | 'position'>;
  fallback?: ReactNode;
}) {
  const num = formatNum(value, settings);
  if (!num) return <>{fallback}</>;
  if (!settings.currency) return <>{num}</>;

  const symbol = (
    <span className="text-[#565f89] font-normal">{settings.currency}</span>
  );
  const gap = THIN;
  return (
    <>
      {settings.position === 'prefix' ? (
        <>
          {symbol}
          {gap}
          {num}
        </>
      ) : (
        <>
          {num}
          {gap}
          {symbol}
        </>
      )}
    </>
  );
}
