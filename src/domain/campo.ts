// Los datos del campo y las cuentas que se hacen con ellos: el stock agrupado
// para dibujarlo, la lluvia mes a mes (con lo que se anota en el grupo) y el
// filtro de animales. TypeScript puro, con tests.

export type StockCategory = {
  category_id: number;
  category_name: string;
  head_count: number;
  avg_weight_kg: number | null;
  last_weighing_date: string | null;
};

export type RainfallMonth = {
  /** "2026-11". */
  month: string;
  /** `null` es "sin registro". No es cero. */
  rainfall_mm: number | null;
  /** El mes en curso viene parcial: tiene datos hasta `until`. */
  partial?: boolean;
  until?: string;
};

export type Animal = {
  id: string;
  /** La caravana. Un ternero recién nacido puede no tenerla. */
  identifier: string | null;
  electronic_id: string | null;
  category_id: number;
  category_name: string;
  sex: string;
  breed: string;
  /** Rodeo. */
  herd: string;
  /** Potrero. */
  lote: string;
  birth_date: string;
  last_weight_kg: number | null;
  last_weighing_date: string | null;
  reproductive_status: string | null;
  /** "active", "sold" o "dead". */
  status: string;
  exit_date: string | null;
  notes: string | null;
};

export type CampoData = {
  now: string;
  campo: { id: string; name: string; locality: string; hectares: number };
  stock: { date: string; total_head_count: number; by_category: StockCategory[] };
  palpation: { date: string; palpated: number; pregnant: number; empty: number; pregnancy_rate: number };
  rainfall: { gauge: string; unit: string; historical_annual_avg_mm: number; months: RainfallMonth[] };
  animals: Animal[];
};

// ── Stock ──────────────────────────────────────────────────────────────────

/** Cuántos grupos entran en el teléfono. Si hay más categorías, las más chicas se juntan. */
const MAX_STOCK_GROUPS = 6;

export type StockGroup = {
  name: string;
  headCount: number;
  avgWeightKg: number | null;
  lastWeighingDate: string | null;
  /** `null` en el grupo "Otras", que junta varias categorías. */
  categoryId: number | null;
};

/**
 * Las categorías de mayor a menor cantidad de cabezas, que es el orden en que
 * la guía asigna los colores. Con más de seis, quedan las cinco más grandes
 * y el resto se junta en "Otras".
 */
export function groupStock(categories: StockCategory[]): StockGroup[] {
  const sorted = [...categories].sort((a, b) => b.head_count - a.head_count);
  const toGroup = (category: StockCategory): StockGroup => ({
    name: category.category_name,
    headCount: category.head_count,
    avgWeightKg: category.avg_weight_kg,
    lastWeighingDate: category.last_weighing_date,
    categoryId: category.category_id,
  });

  if (sorted.length <= MAX_STOCK_GROUPS) return sorted.map(toGroup);

  const biggest = sorted.slice(0, MAX_STOCK_GROUPS - 1);
  const rest = sorted.slice(MAX_STOCK_GROUPS - 1);
  const others: StockGroup = {
    name: 'Otras',
    headCount: rest.reduce((sum, category) => sum + category.head_count, 0),
    avgWeightKg: null,
    lastWeighingDate: null,
    categoryId: null,
  };
  return [...biggest.map(toGroup), others];
}

// ── Lluvia ─────────────────────────────────────────────────────────────────

/** Una lluvia anotada en el grupo. */
export type GroupRain = { date: string; mm: number };

export type RainMonth = {
  month: string;
  /** Lo del pluviómetro más lo anotado en el grupo. `null` si no hay registro. */
  mm: number | null;
  partial: boolean;
  until: string | null;
};

/**
 * La lluvia de cada mes. Una lluvia anotada en el grupo se suma a su mes solo
 * si el mes viene parcial y la fecha es posterior a `until`: lo anterior ya
 * está en el número del pluviómetro. Si después la corrigen, alcanza con
 * volver a llamar a esta función con el valor nuevo.
 */
export function rainfallByMonth(months: RainfallMonth[], groupRains: GroupRain[]): RainMonth[] {
  return months.map((month) => {
    const added = groupRains
      .filter((rain) => rain.date.startsWith(month.month) && month.partial === true && (!month.until || rain.date > month.until))
      .reduce((sum, rain) => sum + rain.mm, 0);

    const hasRecord = month.rainfall_mm !== null || added > 0;
    return {
      month: month.month,
      mm: hasRecord ? (month.rainfall_mm ?? 0) + added : null,
      partial: month.partial === true,
      until: month.until ?? null,
    };
  });
}

/** El total de los meses que tienen registro. */
export function rainfallTotal(months: RainMonth[]): number {
  return months.reduce((sum, month) => sum + (month.mm ?? 0), 0);
}

// ── Animales ───────────────────────────────────────────────────────────────

export type AnimalFilter = {
  /** Lo que se escribe en el buscador: parte de la caravana. */
  query?: string;
  categoryId?: number | null;
  reproductiveStatus?: string;
  herd?: string;
  status?: string;
  /** Para mostrar un solo animal. */
  animalId?: string;
};

/** Los animales que cumplen todo lo que pide el filtro. Lo que no viene en el filtro no se mira. */
export function filterAnimals(animals: Animal[], filter: AnimalFilter): Animal[] {
  const query = filter.query?.trim() ?? '';

  return animals.filter(
    (animal) =>
      (query === '' || (animal.identifier ?? '').includes(query)) &&
      (filter.categoryId == null || animal.category_id === filter.categoryId) &&
      (!filter.reproductiveStatus || animal.reproductive_status === filter.reproductiveStatus) &&
      (!filter.herd || animal.herd === filter.herd) &&
      (!filter.status || animal.status === filter.status) &&
      (!filter.animalId || animal.id === filter.animalId),
  );
}
