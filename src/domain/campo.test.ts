import { filterAnimals, groupStock, rainfallByMonth, rainfallTotal, type Animal, type RainfallMonth, type StockCategory } from './campo';

function category(id: number, headCount: number): StockCategory {
  return { category_id: id, category_name: `Categoría ${id}`, head_count: headCount, avg_weight_kg: null, last_weighing_date: null };
}

describe('groupStock', () => {
  it('ordena de mayor a menor cantidad de cabezas', () => {
    const groups = groupStock([category(1, 4), category(2, 186), category(3, 74)]);
    expect(groups.map((group) => group.headCount)).toEqual([186, 74, 4]);
  });

  it('con más de seis categorías deja las cinco más grandes y junta el resto en Otras', () => {
    const groups = groupStock([1, 2, 3, 4, 5, 6, 7, 8].map((id) => category(id, id * 10)));

    expect(groups).toHaveLength(6);
    expect(groups.slice(0, 5).map((group) => group.headCount)).toEqual([80, 70, 60, 50, 40]);
    expect(groups[5]).toMatchObject({ name: 'Otras', headCount: 30 + 20 + 10, categoryId: null });
  });
});

describe('rainfallByMonth', () => {
  const months: RainfallMonth[] = [
    { month: '2026-07', rainfall_mm: 0 },
    { month: '2026-09', rainfall_mm: null },
    { month: '2026-11', rainfall_mm: 41, partial: true, until: '2026-11-16' },
  ];

  it('un mes sin registro queda sin registro: no es cero', () => {
    const result = rainfallByMonth(months, []);
    expect(result.map((month) => month.mm)).toEqual([0, null, 41]);
  });

  it('suma al mes en curso la lluvia del grupo fechada después de `until`', () => {
    const result = rainfallByMonth(months, [{ date: '2026-11-17', mm: 23 }]);
    expect(result[2].mm).toBe(64);
  });

  it('si corrigen la lluvia, cuenta el valor nuevo', () => {
    const result = rainfallByMonth(months, [{ date: '2026-11-17', mm: 25 }]);
    expect(result[2].mm).toBe(66);
  });

  it('no suma lo que ya está en el número del pluviómetro', () => {
    const result = rainfallByMonth(months, [{ date: '2026-11-10', mm: 12 }]);
    expect(result[2].mm).toBe(41);
  });

  it('el total salta los meses sin registro', () => {
    expect(rainfallTotal(rainfallByMonth(months, []))).toBe(41);
  });
});

describe('filterAnimals', () => {
  const animal = (overrides: Partial<Animal>): Animal => ({
    id: 'a_1',
    identifier: '0042',
    electronic_id: null,
    category_id: 1,
    category_name: 'Vaca',
    sex: 'H',
    breed: 'Cruza',
    herd: 'Cabeza de parición',
    lote: 'La Loma',
    birth_date: '2019-01-01',
    last_weight_kg: null,
    last_weighing_date: null,
    reproductive_status: 'pregnant',
    status: 'active',
    exit_date: null,
    notes: null,
    ...overrides,
  });

  const animals = [
    animal({ id: 'a_1', identifier: '0042' }),
    animal({ id: 'a_2', identifier: '1429', category_id: 2, reproductive_status: null }),
    animal({ id: 'a_3', identifier: null, category_id: 4 }),
    animal({ id: 'a_4', identifier: '0850', status: 'sold' }),
  ];

  it('busca por una parte de la caravana', () => {
    expect(filterAnimals(animals, { query: '42' }).map((a) => a.id)).toEqual(['a_1', 'a_2']);
  });

  it('un animal sin caravana no aparece al buscar, pero sí sin búsqueda', () => {
    expect(filterAnimals(animals, { query: '0' }).some((a) => a.id === 'a_3')).toBe(false);
    expect(filterAnimals(animals, {})).toHaveLength(4);
  });

  it('combina categoría, estado reproductivo y estado', () => {
    const result = filterAnimals(animals, { categoryId: 1, reproductiveStatus: 'pregnant', status: 'active' });
    expect(result.map((a) => a.id)).toEqual(['a_1']);
  });
});
