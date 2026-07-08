import type { AppSettingsData } from '@/lib/settings';

const LOCALES: Record<string, string> = {
  fr: 'fr-FR',
  en: 'en-US',
  de: 'de-DE',
};

// Formats a money value following the app-settings number format, currency and
// position. Returns an empty string for blank/null values (never a stray 0).
export function formatMoney(
  value: string | number | null | undefined,
  settings: Pick<AppSettingsData, 'numberFormat' | 'currency' | 'position'>
): string {
  if (value === null || value === undefined || value === '') return '';
  const n = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(n)) return String(value);

  const locale = LOCALES[settings.numberFormat] ?? LOCALES.fr;
  const num = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

  if (!settings.currency) return num;
  return settings.position === 'prefix'
    ? `${settings.currency} ${num}`
    : `${num} ${settings.currency}`;
}

// Keeps only digits and a single decimal point (max two decimals). Used to
// constrain price inputs to numbers without using a number spinner.
export function sanitizeAmountInput(raw: string): string {
  let cleaned = raw.replace(/[^\d.]/g, '');
  const firstDot = cleaned.indexOf('.');
  if (firstDot !== -1) {
    cleaned =
      cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
    const [intPart, decPart] = cleaned.split('.');
    cleaned = intPart + '.' + decPart.slice(0, 2);
  }
  return cleaned;
}
