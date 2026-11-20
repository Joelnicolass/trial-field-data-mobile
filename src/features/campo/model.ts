// Lo que la pantalla de Campo espera recibir: textos ya escritos y medidas
// ya calculadas. Lo arma `mappers.ts`.

import type { TagStatus } from '@/ui/Tag';

export type CampoHeaderModel = {
  title: string;
  /** "Rauch, Buenos Aires · 1.840,5 ha". */
  subtitle: string;
};

export type StockGroupModel = {
  key: string;
  name: string;
  /** Las cabezas, ya escritas: "186". */
  count: string;
  /** Las cabezas como número, para el ancho de su tramo en la barra. */
  value: number;
  /** "446,1 kg promedio · pesaje 14/04" o "Sin pesaje". */
  detail: string;
  /** `null` en "Otras", que junta varias categorías y no se puede abrir. */
  categoryId: number | null;
};

export type StockModel = {
  total: string;
  /** De mayor a menor: el color sale de la posición. */
  groups: StockGroupModel[];
};

export type PalpationModel = {
  /** "83,9 %". */
  rate: string;
  /** La misma proporción de 0 a 1, para el anillo. */
  progress: number;
  pregnant: string;
  empty: string;
  /** "180 tactadas · 14/04". */
  caption: string;
};

export type RainBarModel = {
  key: string;
  /** "nov". */
  label: string;
  /** "66", o "s/d" si el mes no tiene registro. */
  value: string;
  /** Alto de la barra, de 0 a 1. */
  height: number;
  /** El mes en curso, que todavía no terminó. */
  partial: boolean;
  /** Sin registro: no es lo mismo que cero. */
  missing: boolean;
};

export type RainfallModel = {
  total: string;
  /** "mm en el último año". */
  totalCaption: string;
  /** "Pluviómetro Casco · media histórica 870 mm". */
  source: string;
  bars: RainBarModel[];
  /** Qué incluye el mes en curso. `null` si no hay mes parcial. */
  note: string | null;
};

export type AnimalRowModel = {
  id: string;
  /** `null` si todavía no tiene. */
  caravana: string | null;
  /** "Ternero · Hereford". */
  title: string;
  /** "Cabeza de parición · La Loma". */
  place: string;
  /** "79,9 kg", o una raya si no tiene pesaje. */
  weight: string;
  tag: { label: string; status: TagStatus } | null;
};

export type CategoryChipModel = { id: number; label: string };
