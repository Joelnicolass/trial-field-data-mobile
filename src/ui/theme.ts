// Tokens de la guía de diseño de FieldData, tal como vienen en
// `docs/consigna/guia-de-diseno.md`. Ningún componente escribe un color,
// un espacio o un tamaño de letra a mano: salen de acá.

export const color = {
  fondo: '#EEF2F6',
  superficie: '#FFFFFF',
  inset: '#F8FAFC',
  divisor: '#E3E8EF',
  tinta: '#121926',
  cuerpo: '#364152',
  secundario: '#697586',
  secundarioFuerte: '#4B5565',
  navy: '#243552',
  sobreNavy: '#E2E8F0',
  primarioOscuro: '#115293',
  primarioOscuroHover: '#0D4175',
  primario: '#1976D2',
  seleccionado: '#D0E6F6',
  teal: '#0077AD',
  chipBorde: '#D1D5DB',
  chipTexto: '#666666',
  lluvia: '#2196F3',
} as const;

export const estado = {
  activo: { texto: '#1C8300', fondo: '#E8F5E9', borde: '#1C8300' },
  vendido: { texto: '#5B21B6', fondo: '#EDE9FE', borde: '#5B21B6' },
  pendiente: { texto: '#AD8A00', fondo: '#FFF9E3', borde: '#AD8A00' },
  error: { texto: '#D32F2F', fondo: '#FFEBEE', borde: '#FFCDD2' },
  archivado: { texto: '#6B7280', fondo: '#F3F4F6', borde: '#9CA3AF' },
  info: { texto: '#075985', fondo: '#E0F2FE', borde: '#0077AD' },
  faltaDato: { texto: '#D84315', fondo: '#FBE9E7', borde: '#D84315' },
} as const;

// Color por orden, no por categoría: la que más cabezas tiene lleva el primero.
export const categorias = ['#0D47A1', '#00897B', '#F9A825', '#6A1B9A', '#C62828', '#2E7D32', '#4E7A9B', '#8D6E63'] as const;
export const otras = '#9CA3AF';

export const espacio = [4, 8, 12, 16, 20, 24, 32, 40] as const;

// Los mismos ocho pasos, con nombre. `space[16]` se lee mejor que `espacio[3]`,
// y TypeScript rechaza un paso que no esté en la escala, como `space[18]`.
export const space = { 4: 4, 8: 8, 12: 12, 16: 16, 20: 20, 24: 24, 32: 32, 40: 40 } as const;
export const radio = { boton: 8, chip: 8, tarjeta: 8, input: 8, hoja: 8, etiqueta: 5 } as const;
export const toqueMinimo = 44;

export const fuente = 'Inter';
export const tipo = {
  h1: { fontSize: 34, lineHeight: 40, fontWeight: '700' },
  h2: { fontSize: 24, lineHeight: 29, fontWeight: '700' },
  h3: { fontSize: 20, lineHeight: 23, fontWeight: '600' },
  h4: { fontSize: 16, lineHeight: 20, fontWeight: '600' },
  body1: { fontSize: 14, lineHeight: 19, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 20, fontWeight: '400' },
} as const;
