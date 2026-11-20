// Lo que la pantalla del detalle de un animal espera recibir: textos ya
// escritos. Lo arma `mappers.ts`.

import type { TagStatus } from '@/ui/Tag';

export type DetailRowModel = {
  /** "Último peso". */
  label: string;
  /** "471,5 kg", o una raya si falta. */
  value: string;
};

export type DetailSectionModel = {
  /** "Identificación", "Peso". */
  title: string;
  rows: DetailRowModel[];
};

export type AnimalDetailModel = {
  /** "Caravana 0042", o "Sin caravana" si todavía no tiene. */
  title: string;
  /** "Vaca · Aberdeen Angus negro". */
  subtitle: string;
  /** Si sigue en el campo, se vendió o se dio de baja. */
  status: { label: string; status: TagStatus };
  /** Una tarjeta por sección. Las que no corresponden a este animal no vienen. */
  sections: DetailSectionModel[];
  /** Lo que alguien dejó anotado sobre el animal. `null` si no hay nada. */
  notes: string | null;
};
