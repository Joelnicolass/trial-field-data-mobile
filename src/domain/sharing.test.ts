import { memoizeLast, sameProps, shareList, shareRecord } from './sharing';

describe('memoizeLast', () => {
  it('con los mismos argumentos no vuelve a calcular', () => {
    const compute = jest.fn((list: number[]) => list.map((n) => n * 2));
    const doubled = memoizeLast(compute);
    const list = [1, 2];

    expect(doubled(list)).toBe(doubled(list));
    expect(compute).toHaveBeenCalledTimes(1);
  });

  it('con otros argumentos calcula de nuevo', () => {
    const doubled = memoizeLast((list: number[]) => list.map((n) => n * 2));

    expect(doubled([1])).toEqual([2]);
    expect(doubled([3])).toEqual([6]);
  });

  it('le pasa a `share` la respuesta anterior y la nueva', () => {
    const lengths = memoizeLast(
      (words: string[]) => words.map((word) => ({ word, length: word.length })),
      (previous, next) => shareList(previous, next, (item) => item.word),
    );
    const first = lengths(['vaca', 'toro']);
    const second = lengths(['vaca', 'toro', 'novillo']);

    expect(second[0]).toBe(first[0]);
    expect(second).toHaveLength(3);
  });
});

describe('shareList', () => {
  const key = (item: { key: string }) => item.key;

  it('conserva los elementos que dicen lo mismo y cambia solo el que cambió', () => {
    const previous = [{ key: 'a', n: 1 }, { key: 'b', n: 2 }];
    const next = [{ key: 'a', n: 1 }, { key: 'b', n: 3 }];
    const shared = shareList(previous, next, key);

    expect(shared[0]).toBe(previous[0]);
    expect(shared[1]).toBe(next[1]);
  });

  it('si no cambió nada, devuelve la lista anterior', () => {
    const previous = [{ key: 'a', n: 1 }];
    expect(shareList(previous, [{ key: 'a', n: 1 }], key)).toBe(previous);
  });

  it('un elemento insertado en el medio no cambia a los demás', () => {
    const previous = [{ key: 'a', n: 1 }, { key: 'c', n: 3 }];
    const shared = shareList(previous, [{ key: 'a', n: 1 }, { key: 'b', n: 2 }, { key: 'c', n: 3 }], key);

    expect(shared[0]).toBe(previous[0]);
    expect(shared[2]).toBe(previous[1]);
  });
});

describe('shareRecord', () => {
  const sameVersion = (a: { version: number }, b: { version: number }) => a.version === b.version;

  it('conserva los valores que no cambiaron', () => {
    const previous = { d_1: { version: 1 }, d_2: { version: 1 } };
    const shared = shareRecord(previous, { d_1: { version: 1 }, d_2: { version: 2 } }, sameVersion);

    expect(shared.d_1).toBe(previous.d_1);
    expect(shared.d_2).not.toBe(previous.d_2);
  });

  it('si no cambió nada, devuelve el diccionario anterior', () => {
    const previous = { d_1: { version: 1 } };
    expect(shareRecord(previous, { d_1: { version: 1 } }, sameVersion)).toBe(previous);
  });
});

describe('sameProps', () => {
  it('compara las propiedades, no los objetos', () => {
    const inner = {};
    expect(sameProps({ a: 1, b: inner }, { a: 1, b: inner })).toBe(true);
    expect(sameProps({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(sameProps({ a: {} }, { a: {} })).toBe(false);
  });
});
