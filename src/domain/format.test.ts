import { formatDate, formatDuration, formatMonth, formatNumber, formatQuantity, formatTime, formatValue, MISSING } from './format';

const NOW = '2026-11-18T07:10:00-03:00';

describe('formatNumber', () => {
  it('usa punto para los miles y coma para los decimales', () => {
    expect(formatNumber(1840.5)).toBe('1.840,5');
    expect(formatNumber(83.9)).toBe('83,9');
  });

  it('no muestra decimales que no hacen falta', () => {
    expect(formatNumber(411)).toBe('411');
    expect(formatNumber(429.0)).toBe('429');
  });
});

describe('formatQuantity', () => {
  it('suma la unidad si hay', () => {
    expect(formatQuantity(23, 'mm')).toBe('23 mm');
    expect(formatQuantity(74)).toBe('74');
  });
});

describe('formatDate', () => {
  it('dice Hoy y Ayer en palabras', () => {
    expect(formatDate('2026-11-18', NOW)).toBe('Hoy');
    expect(formatDate('2026-11-17T18:40:31-03:00', NOW)).toBe('Ayer');
  });

  it('muestra día y mes, y el año solo si no es este', () => {
    expect(formatDate('2026-04-14', NOW)).toBe('14/04');
    expect(formatDate('2025-12-03', NOW)).toBe('03/12/2025');
  });
});

describe('formatTime, formatDuration y formatMonth', () => {
  it('leen la hora, la duración y el mes', () => {
    expect(formatTime('2026-11-18T07:08:44-03:00')).toBe('07:08');
    expect(formatDuration(38000)).toBe('0:38');
    expect(formatDuration(125000)).toBe('2:05');
    expect(formatMonth('2026-11')).toBe('nov');
  });
});

describe('formatValue', () => {
  it('formatea según el tipo del campo', () => {
    expect(formatValue(25, 'number', NOW, 'mm')).toBe('25 mm');
    expect(formatValue('2026-11-17', 'date', NOW)).toBe('Ayer');
    expect(formatValue('Aftosa bivalente', 'text', NOW)).toBe('Aftosa bivalente');
  });

  it('muestra una raya donde falta el valor', () => {
    expect(formatValue(null, 'number', NOW, 'kg')).toBe(MISSING);
  });
});
