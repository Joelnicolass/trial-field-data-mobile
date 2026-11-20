import type { Animal } from '@/domain/campo';

import { toAnimalDetail } from './mappers';
import type { DetailRowModel } from './model';

const NOW = '2026-11-18T07:10:00-03:00';

const cow: Animal = {
  id: 'a_0134',
  identifier: '0042',
  electronic_id: '032286815009728',
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
  notes: 'Renguea de la pata trasera izquierda.',
};

// Un ternero recién nacido: todavía sin caravana, sin pesaje y sin tacto.
const newborn: Animal = {
  ...cow,
  id: 'a_0400',
  identifier: null,
  electronic_id: null,
  category_id: 3,
  category_name: 'Ternero',
  sex: 'M',
  breed: 'Cruza',
  birth_date: '2026-11-16',
  last_weight_kg: null,
  last_weighing_date: null,
  reproductive_status: null,
  notes: null,
};

/** Las filas de una sección, buscada por su título. */
function rowsOf(animal: Animal, title: string): DetailRowModel[] | undefined {
  return toAnimalDetail(animal, NOW).sections.find((section) => section.title === title)?.rows;
}

describe('toAnimalDetail', () => {
  it('escribe el título, la categoría con la raza y que sigue en el campo', () => {
    expect(toAnimalDetail(cow, NOW)).toMatchObject({
      title: 'Caravana 0042',
      subtitle: 'Vaca · Aberdeen Angus negro',
      status: { label: 'En el campo', status: 'activo' },
      notes: 'Renguea de la pata trasera izquierda.',
    });
  });

  it('arma una sección por tema, con los números y las fechas ya escritos', () => {
    expect(toAnimalDetail(cow, NOW).sections).toEqual([
      {
        title: 'Identificación',
        rows: [
          { label: 'Caravana', value: '0042' },
          { label: 'Caravana electrónica', value: '032286815009728' },
          { label: 'Categoría', value: 'Vaca' },
          { label: 'Sexo', value: 'Hembra' },
          { label: 'Raza', value: 'Aberdeen Angus negro' },
        ],
      },
      {
        title: 'Edad y nacimiento',
        rows: [
          { label: 'Edad', value: '10 años y 2 meses' },
          { label: 'Nacimiento', value: '03/09/2016' },
        ],
      },
      {
        title: 'Ubicación',
        rows: [
          { label: 'Rodeo', value: 'Cabeza de parición' },
          { label: 'Potrero', value: 'La Loma' },
        ],
      },
      {
        title: 'Peso',
        rows: [
          { label: 'Último peso', value: '471,5 kg' },
          { label: 'Fecha del pesaje', value: '14/04' },
        ],
      },
      { title: 'Reproducción', rows: [{ label: 'Estado', value: 'Preñada' }] },
    ]);
  });

  it('lo que falta va con una raya, nunca vacío', () => {
    const detail = toAnimalDetail(newborn, NOW);

    expect(detail).toMatchObject({ title: 'Sin caravana', subtitle: 'Ternero · Cruza', notes: null });
    expect(rowsOf(newborn, 'Identificación')).toEqual([
      { label: 'Caravana', value: '—' },
      { label: 'Caravana electrónica', value: '—' },
      { label: 'Categoría', value: 'Ternero' },
      { label: 'Sexo', value: 'Macho' },
      { label: 'Raza', value: 'Cruza' },
    ]);
    expect(rowsOf(newborn, 'Peso')).toEqual([
      { label: 'Último peso', value: '—' },
      { label: 'Fecha del pesaje', value: '—' },
    ]);
  });

  it('al recién nacido le cuenta la edad en días', () => {
    expect(rowsOf(newborn, 'Edad y nacimiento')).toEqual([
      { label: 'Edad', value: '2 días' },
      { label: 'Nacimiento', value: '16/11' },
    ]);
  });

  it('sin estado reproductivo no arma la sección, y si sigue en el campo tampoco la de salida', () => {
    expect(rowsOf(newborn, 'Reproducción')).toBeUndefined();
    expect(rowsOf(cow, 'Salida')).toBeUndefined();
  });

  it('una nota vacía es como no tener nota', () => {
    expect(toAnimalDetail({ ...cow, notes: '  ' }, NOW).notes).toBeNull();
  });

  describe('si ya no está en el campo', () => {
    const sold: Animal = { ...cow, reproductive_status: 'empty', status: 'sold', exit_date: '2026-05-20' };
    // Murió a los 26 días: la edad no sigue corriendo hasta hoy.
    const dead: Animal = { ...newborn, birth_date: '2026-08-19', status: 'dead', exit_date: '2026-09-14' };

    it('la etiqueta dice que se vendió o que se dio de baja', () => {
      expect(toAnimalDetail(sold, NOW).status).toEqual({ label: 'Vendida', status: 'vendido' });
      expect(toAnimalDetail(dead, NOW).status).toEqual({ label: 'Dado de baja', status: 'archivado' });
    });

    it('suma la sección de salida, con el motivo y la fecha', () => {
      expect(rowsOf(sold, 'Salida')).toEqual([
        { label: 'Motivo', value: 'Venta' },
        { label: 'Fecha', value: '20/05' },
      ]);
      expect(rowsOf(dead, 'Salida')).toEqual([
        { label: 'Motivo', value: 'Muerte' },
        { label: 'Fecha', value: '14/09' },
      ]);
    });

    it('la edad es la que tenía al salir, y la ubicación es la última', () => {
      expect(rowsOf(dead, 'Edad y nacimiento')?.[0]).toEqual({ label: 'Edad al salir', value: '26 días' });
      expect(rowsOf(sold, 'Edad y nacimiento')?.[0]).toEqual({ label: 'Edad al salir', value: '9 años y 8 meses' });
      expect(rowsOf(sold, 'Última ubicación')).toEqual([
        { label: 'Rodeo', value: 'Cabeza de parición' },
        { label: 'Potrero', value: 'La Loma' },
      ]);
      expect(rowsOf(sold, 'Ubicación')).toBeUndefined();
    });

    it('sin fecha de salida no inventa ni la fecha ni la edad', () => {
      const noDate: Animal = { ...sold, exit_date: null };

      expect(rowsOf(noDate, 'Salida')?.[1]).toEqual({ label: 'Fecha', value: '—' });
      expect(rowsOf(noDate, 'Edad y nacimiento')?.[0]).toEqual({ label: 'Edad al salir', value: '—' });
    });
  });
});
