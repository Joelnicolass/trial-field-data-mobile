import type { Animal, CampoData } from '@/domain/campo';

import { animalCountLabel, toAnimalRow, toCampoHeader, toPalpationModel, toRainfallModel, toStockModel } from './mappers';

const NOW = '2026-11-18T07:10:00-03:00';

describe('toCampoHeader', () => {
  it('junta la localidad con las hectáreas, con formato argentino', () => {
    const header = toCampoHeader({ id: 'c_01', name: 'La Aurora', locality: 'Rauch, Buenos Aires', hectares: 1840.5 });
    expect(header.subtitle).toBe('Rauch, Buenos Aires · 1.840,5 ha');
  });
});

describe('toStockModel', () => {
  const stock: CampoData['stock'] = {
    date: '2026-11-18',
    total_head_count: 1215,
    by_category: [
      { category_id: 5, category_name: 'Novillo', head_count: 29, avg_weight_kg: null, last_weighing_date: null },
      { category_id: 1, category_name: 'Vaca', head_count: 1186, avg_weight_kg: 446.1, last_weighing_date: '2026-04-14' },
    ],
  };

  it('ordena de mayor a menor y escribe los números', () => {
    const model = toStockModel(stock, NOW);

    expect(model.total).toBe('1.215');
    expect(model.groups.map((group) => group.name)).toEqual(['Vaca', 'Novillo']);
    expect(model.groups[0]).toMatchObject({ count: '1.186', detail: '446,1 kg promedio · pesaje 14/04' });
  });

  it('dice "Sin pesaje" donde no hay peso, en vez de un cero', () => {
    expect(toStockModel(stock, NOW).groups[1].detail).toBe('Sin pesaje');
  });
});

describe('toPalpationModel', () => {
  it('escribe el porcentaje y deja la proporción para el anillo', () => {
    const model = toPalpationModel({ date: '2026-04-14', palpated: 180, pregnant: 151, empty: 29, pregnancy_rate: 83.9 }, NOW);
    expect(model).toMatchObject({ rate: '83,9 %', caption: '180 tactadas · 14/04' });
    expect(model.progress).toBeCloseTo(0.839);
  });
});

describe('toRainfallModel', () => {
  const rainfall: CampoData['rainfall'] = {
    gauge: 'Casco',
    unit: 'mm',
    historical_annual_avg_mm: 870,
    months: [
      { month: '2026-07', rainfall_mm: 0 },
      { month: '2026-09', rainfall_mm: null },
      { month: '2026-10', rainfall_mm: 82 },
      { month: '2026-11', rainfall_mm: 41, partial: true, until: '2026-11-16' },
    ],
  };

  it('distingue el mes sin registro del mes en cero', () => {
    const { bars } = toRainfallModel(rainfall, [], NOW);

    expect(bars[0]).toMatchObject({ label: 'jul', value: '0', missing: false });
    expect(bars[1]).toMatchObject({ label: 'sep', value: 's/d', missing: true });
  });

  it('suma al mes en curso lo anotado en el grupo y lo cuenta en el total', () => {
    const model = toRainfallModel(rainfall, [{ date: '2026-11-17', mm: 25 }], NOW);

    expect(model.bars[3]).toMatchObject({ value: '66', partial: true });
    expect(model.total).toBe('148');
    expect(model.note).toContain('Este mes van 66 mm');
  });

  it('la barra más alta mide 1 y las demás, en proporción', () => {
    const { bars } = toRainfallModel(rainfall, [], NOW);
    expect(bars[2].height).toBe(1);
    expect(bars[3].height).toBe(0.5);
  });
});

describe('toAnimalRow', () => {
  const animal: Animal = {
    id: 'a_0134',
    identifier: '0042',
    electronic_id: null,
    category_id: 1,
    category_name: 'Vaca',
    sex: 'H',
    breed: 'Aberdeen Angus negro',
    herd: 'Cabeza de parición',
    lote: 'La Loma',
    birth_date: '2016-09-03',
    last_weight_kg: 471.5,
    last_weighing_date: '2026-04-14',
    reproductive_status: 'pregnant',
    status: 'active',
    exit_date: null,
    notes: null,
  };

  it('arma la fila con sus textos y la etiqueta de estado', () => {
    expect(toAnimalRow(animal)).toEqual({
      id: 'a_0134',
      caravana: '0042',
      title: 'Vaca · Aberdeen Angus negro',
      place: 'Cabeza de parición · La Loma',
      weight: '471,5 kg',
      tag: { label: 'Preñada', status: 'activo' },
    });
  });

  it('sin caravana y sin peso no inventa valores', () => {
    const row = toAnimalRow({ ...animal, identifier: null, last_weight_kg: null, reproductive_status: null });
    expect(row).toMatchObject({ caravana: null, weight: '—', tag: null });
  });

  it('cuenta en singular y en plural', () => {
    expect(animalCountLabel(1)).toBe('1 animal');
    expect(animalCountLabel(1215)).toBe('1.215 animales');
  });
});
