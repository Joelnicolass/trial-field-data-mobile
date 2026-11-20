// Adónde abrir Campo cuando se llega desde una tarjeta del grupo.
//
// El servidor dice adónde lleva cada tarjeta (`opens`). Eso viaja en la
// dirección de la pantalla como textos, y Campo lo vuelve a leer para saber
// en qué pestaña abrir, qué tarjeta mostrar y con qué filtro. Funciones puras.

import type { Opens } from '@/domain/types';

export type CampoSection = 'resumen' | 'animales';

/** Las tarjetas del resumen a las que se puede ir directo. */
export type CampoFocus = 'stock' | 'palpation' | 'rainfall';

export type CampoTarget = {
  section: CampoSection;
  /** La tarjeta del resumen que hay que mostrar. `null` si no se pidió ninguna. */
  focus: CampoFocus | null;
  categoryId: number | null;
  reproductiveStatus: string | null;
  /** Rodeo. */
  herd: string | null;
  /** Para mostrar un solo animal. */
  animalId: string | null;
  /** Cambia en cada visita: así Campo vuelve a abrir aunque se toque dos veces la misma tarjeta. */
  visit: string;
  /** Se llegó desde el grupo: hay que ofrecer volver. */
  fromGroup: boolean;
};

/** Lo que viaja en la dirección de la pantalla. Solo textos. */
export type CampoParams = Partial<Record<'section' | 'focus' | 'categoryId' | 'reproductiveStatus' | 'herd' | 'animalId' | 'visit', string>>;

const FOCUSABLE: readonly string[] = ['stock', 'palpation', 'rainfall'];

/** De lo que dice una tarjeta del grupo a los textos de la dirección. */
export function opensToParams(opens: Opens, visit: string): CampoParams {
  // Una tarjeta que lleva a un animal muestra la lista con solo ese animal.
  if (opens.view === 'animal') {
    return { section: 'animales', animalId: opens.animal_id, visit };
  }

  if (opens.section === 'animals') {
    const filter = opens.filter ?? {};
    return {
      section: 'animales',
      categoryId: filter.category_id === undefined ? undefined : String(filter.category_id),
      reproductiveStatus: filter.reproductive_status,
      herd: filter.herd,
      visit,
    };
  }

  return { section: 'resumen', focus: opens.section, visit };
}

/** De los textos de la dirección a lo que Campo tiene que abrir. Sin textos, abre en el resumen. */
export function paramsToTarget(params: CampoParams): CampoTarget {
  return {
    section: params.section === 'animales' ? 'animales' : 'resumen',
    focus: params.focus && FOCUSABLE.includes(params.focus) ? (params.focus as CampoFocus) : null,
    categoryId: params.categoryId ? Number(params.categoryId) : null,
    reproductiveStatus: params.reproductiveStatus ?? null,
    herd: params.herd ?? null,
    animalId: params.animalId ?? null,
    visit: params.visit ?? 'inicio',
    fromGroup: params.visit !== undefined,
  };
}
