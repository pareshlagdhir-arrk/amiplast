import type { AppSettingsData } from '@/lib/settings';

const LOCALES: Record<string, string> = {
  fr: 'fr-FR',
  en: 'en-US',
  de: 'de-DE',
};

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

// Locale metadata for the number-format settings. groupSep / decimalSep are
// derived from Intl so the input always matches the chosen display format.
function getSeparators(numberFormat: string): { group: string; decimal: string; locale: string } {
  const locale = LOCALES[numberFormat] ?? LOCALES.fr;
  const parts = new Intl.NumberFormat(locale).formatToParts(1234.5);
  const group = parts.find((p) => p.type === 'group')?.value ?? '';
  const decimal = parts.find((p) => p.type === 'decimal')?.value ?? '.';
  return { group, decimal, locale };
}

// Formats a raw numeric string ("1234.5") into the locale display form, e.g.
// "1 234,5" (fr) / "1,234.5" (en) / "1.234,5" (de). Returns '' for empty.
export function formatAmountForInput(
  raw: string,
  settings: Pick<AppSettingsData, 'numberFormat'>
): string {
  if (!raw) return '';
  const { group, decimal, locale } = getSeparators(settings.numberFormat);
  let [intPart, decPart] = raw.split('.');
  intPart = intPart.replace(/^0+(?=\d)/, '');
  if (intPart === '') intPart = '0';
  const n = parseInt(intPart, 10);
  const intFmt = Number.isNaN(n)
    ? intPart
    : new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n);
  let result = intFmt;
  if (raw.includes('.')) {
    result += decimal + (decPart ?? '');
  }
  void group;
  return result;
}

// Parses a locale-formatted input string back into the raw "1234.5" form
// used by the draft state. Accepts both locale separators and bare digits.
export function parseAmountFromInput(
  display: string,
  settings: Pick<AppSettingsData, 'numberFormat'>
): string {
  const { group, decimal } = getSeparators(settings.numberFormat);
  let cleaned = display;
  if (group) cleaned = cleaned.split(group).join('');
  if (decimal && decimal !== '.') cleaned = cleaned.replace(decimal, '.');
  return sanitizeAmountInput(cleaned);
}
