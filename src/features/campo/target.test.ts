import { opensToParams, paramsToTarget } from './target';

describe('de una tarjeta del grupo a Campo', () => {
  it('una tarjeta de lluvia abre el resumen, en la lluvia', () => {
    const params = opensToParams({ view: 'data', section: 'rainfall', filter: null }, 'v1');
    expect(paramsToTarget(params)).toMatchObject({ section: 'resumen', focus: 'rainfall', fromGroup: true });
  });

  it('la tarjeta de preñez abre los animales con su filtro', () => {
    const params = opensToParams(
      { view: 'data', section: 'animals', filter: { category_id: 1, reproductive_status: 'pregnant', status: 'active' } },
      'v2',
    );
    expect(paramsToTarget(params)).toMatchObject({ section: 'animales', categoryId: 1, reproductiveStatus: 'pregnant', herd: null, animalId: null });
  });

  it('un dato con rodeo lleva ese rodeo', () => {
    const params = opensToParams({ view: 'data', section: 'animals', filter: { category_id: 3, herd: 'Cabeza de parición', status: 'active' } }, 'v3');
    expect(paramsToTarget(params)).toMatchObject({ categoryId: 3, herd: 'Cabeza de parición' });
  });

  it('una tarjeta que lleva a un animal muestra la lista con solo ese animal', () => {
    const params = opensToParams({ view: 'animal', animal_id: 'a_0134' }, 'v4');
    expect(paramsToTarget(params)).toMatchObject({ section: 'animales', animalId: 'a_0134' });
  });

  it('sin nada en la dirección abre el resumen, sin ofrecer volver', () => {
    expect(paramsToTarget({})).toMatchObject({ section: 'resumen', focus: null, categoryId: null, fromGroup: false });
  });

  it('cada visita es distinta, aunque sea la misma tarjeta', () => {
    const opens = { view: 'data', section: 'stock', filter: null } as const;
    expect(paramsToTarget(opensToParams(opens, 'a')).visit).not.toBe(paramsToTarget(opensToParams(opens, 'b')).visit);
  });
});
