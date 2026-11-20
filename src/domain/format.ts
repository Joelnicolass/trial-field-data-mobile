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

/**
 * La edad a la fecha de `now`, como se dice en el campo: "26 días", "2 meses",
 * "3 años", "1 año y 4 meses". Sin fecha de nacimiento, la raya.
 */
export function formatAge(birthDate: string | null, now: string): string {
  if (!birthDate) return MISSING;

  const days = dayNumber(now) - dayNumber(birthDate);
  // Una fecha futura o mal escrita no da una edad: mejor la raya que un número inventado.
  if (Number.isNaN(days) || days < 0) return MISSING;
  if (days === 0) return 'Menos de un día';

  const [birthYear, birthMonth, birthDay] = dateParts(birthDate);
  const [year, month, day] = dateParts(now);
  // Meses cumplidos: el mes en curso cuenta recién cuando llega el día en que nació.
  const months = (year - birthYear) * 12 + (month - birthMonth) - (day < birthDay ? 1 : 0);
  if (months === 0) return countOf(days, 'día', 'días');

  const years = Math.floor(months / 12);
  const extraMonths = months % 12;
  if (years === 0) return countOf(months, 'mes', 'meses');
  if (extraMonths === 0) return countOf(years, 'año', 'años');
  return `${countOf(years, 'año', 'años')} y ${countOf(extraMonths, 'mes', 'meses')}`;
}

/** (1, "mes", "meses") → "1 mes" · (4, "mes", "meses") → "4 meses". */
function countOf(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
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
  const [year, month, day] = dateParts(iso);
  return Date.UTC(year, month - 1, day) / 86_400_000;
}

/** "2026-04-14T07:10:00-03:00" → [2026, 4, 14]. */
function dateParts(iso: string): number[] {
  return iso.slice(0, 10).split('-').map(Number);
}
