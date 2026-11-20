// Los datos vienen crudos: números sin formato, fechas ISO y `null` donde
// falta algo. Acá se pasan a como los escribe la guía: 1.840,5 · 14/04 · Hoy.
// Funciones puras: reciben la hora actual en vez de leer el reloj.

/** Lo que se muestra donde falta un valor. */
export const MISSING = '—';

/** 1840.5 → "1.840,5" · 411 → "411" · 83.9 → "83,9". */
export function formatNumber(value: number, maxDecimals = 1): string {
  const [integer, decimals = ''] = value.toFixed(maxDecimals).split('.');
  const withThousands = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const withoutTrailingZeros = decimals.replace(/0+$/, '');
  return withoutTrailingZeros ? `${withThousands},${withoutTrailingZeros}` : withThousands;
}

/** Un número con su unidad: (23, "mm") → "23 mm". Sin unidad, solo el número. */
export function formatQuantity(value: number, unit?: string): string {
  return unit ? `${formatNumber(value)} ${unit}` : formatNumber(value);
}

/**
 * Una fecha como la escribe la guía: "Hoy", "Ayer", "14/04", y con año solo
 * si no es el de `now`. Acepta "2026-04-14" o una fecha ISO con hora.
 */
export function formatDate(iso: string, now: string): string {
  const daysAgo = dayNumber(now) - dayNumber(iso);
  if (daysAgo === 0) return 'Hoy';
  if (daysAgo === 1) return 'Ayer';

  const [year, month, day] = iso.slice(0, 10).split('-');
  return year === now.slice(0, 4) ? `${day}/${month}` : `${day}/${month}/${year}`;
}

/** "2026-11-18T07:08:44-03:00" → "07:08". Se lee del texto: es la hora del campo, no la del teléfono. */
export function formatTime(iso: string): string {
  return iso.slice(11, 16);
}

/** 38000 ms → "0:38". */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "2026-11" → "nov". */
export function formatMonth(month: string): string {
  return MONTHS[Number(month.slice(5, 7)) - 1] ?? month;
}

export type ValueType = 'text' | 'number' | 'date';

/**
 * El valor de un campo de un dato o de una celda de una tabla, según su tipo.
 * Sirve para cualquier campo que mande el servidor, no solo los que conocemos.
 */
export function formatValue(value: string | number | null, type: ValueType, now: string, unit?: string): string {
  if (value === null) return MISSING;
  if (type === 'number' && typeof value === 'number') return formatQuantity(value, unit);
  if (type === 'date' && typeof value === 'string') return formatDate(value, now);
  return String(value);
}

/** Días desde 1970 para la fecha de un texto ISO. Solo mira año, mes y día. */
function dayNumber(iso: string): number {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  return Date.UTC(year, month - 1, day) / 86_400_000;
}
