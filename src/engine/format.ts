const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

/** Desetinný oddělovač podle jazyka rozhraní; výchozí je čeština. */
let decimalSeparator: '.' | ',' = ',';

export function setNumberLocale(separator: '.' | ','): void {
  decimalSeparator = separator;
}

/**
 * Formátuje velká čísla: 999 → "999", 12 345 → "12,3K", 1,5e9 → "1,50B".
 * Nad rozsah přípon spadne do vědeckého zápisu.
 */
export function formatNumber(value: number, options: { decimals?: number } = {}): string {
  if (!Number.isFinite(value)) return '∞';
  if (value < 0) return `-${formatNumber(-value, options)}`;
  if (value < 1000) {
    const decimals = options.decimals ?? 0;
    return trimZeros(value.toFixed(decimals));
  }
  const exponent = Math.floor(Math.log10(value) / 3);
  if (exponent >= SUFFIXES.length) {
    return value.toExponential(2).replace('.', decimalSeparator).replace('e+', 'e');
  }
  const scaled = value / Math.pow(1000, exponent);
  const decimals = scaled >= 100 ? 1 : 2;
  return `${trimZeros(scaled.toFixed(decimals))}${SUFFIXES[exponent]}`;
}

/** Celočíselné zobrazení (zůstatek krystalů). */
export function formatWhole(value: number): string {
  return formatNumber(Math.floor(value));
}

/** Rychlost (za sekundu) – u malých hodnot ukazuje desetiny. */
export function formatRate(value: number): string {
  if (value < 10) return formatNumber(value, { decimals: 1 });
  if (value < 1000) return formatNumber(value, { decimals: 0 });
  return formatNumber(value);
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const parts: string[] = [];
  if (days) parts.push(`${days} d`);
  if (hours) parts.push(`${hours} h`);
  if (minutes) parts.push(`${minutes} min`);
  if (!days && !hours && (seconds || parts.length === 0)) parts.push(`${seconds} s`);
  return parts.join(' ');
}

function trimZeros(text: string): string {
  if (!text.includes('.')) return text;
  const trimmed = text.replace(/\.?0+$/, '');
  return trimmed.replace('.', decimalSeparator);
}
