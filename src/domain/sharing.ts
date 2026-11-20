// Piezas para que lo que no cambió siga siendo el mismo objeto.
//
// React decide si vuelve a dibujar algo comparando si lo que recibe es "lo
// mismo de antes". Si una lista se rearma entera, todo parece nuevo aunque
// diga lo mismo, y se redibuja todo. Con estas funciones, un cambio en un
// elemento deja a los demás como estaban. No saben nada del grupo ni de
// React: sirven para cualquier lista.

/** Si las dos listas tienen los mismos elementos, uno por uno. */
export function sameItems(a: readonly unknown[], b: readonly unknown[]): boolean {
  return a.length === b.length && a.every((item, index) => Object.is(item, b[index]));
}

/** Si los dos objetos tienen las mismas propiedades con los mismos valores. No mira adentro de cada valor. */
export function sameProps(a: object, b: object): boolean {
  const keys = Object.keys(a);
  const valuesA = a as Record<string, unknown>;
  const valuesB = b as Record<string, unknown>;
  return keys.length === Object.keys(b).length && keys.every((key) => Object.is(valuesA[key], valuesB[key]));
}

/**
 * Envuelve una función para que recuerde su última respuesta: si la llaman
 * con los mismos argumentos, devuelve lo mismo sin volver a calcular.
 *
 * @param share Cómo reutilizar en la respuesta nueva las partes de la anterior que no cambiaron.
 */
export function memoizeLast<Args extends readonly unknown[], Result>(
  compute: (...args: Args) => Result,
  share: (previous: Result, next: Result) => Result = (_previous, next) => next,
): (...args: Args) => Result {
  return memoizeFromPrevious<Args, Result>((args, previous) => {
    const computed = compute(...args);
    return previous ? share(previous.result, computed) : computed;
  });
}

/**
 * Como `memoizeLast`, pero la función recibe además la respuesta anterior y
 * los argumentos con los que se había calculado. Sirve para armar la nueva a
 * partir de la anterior en vez de empezar de cero: si a una lista de mil se
 * le sumó uno, se suma uno.
 */
export function memoizeFromPrevious<Args extends readonly unknown[], Result>(
  compute: (args: Args, previous: { args: Args; result: Result } | null) => Result,
): (...args: Args) => Result {
  let last: { args: Args; result: Result } | null = null;

  return (...args: Args) => {
    if (last && sameItems(last.args, args)) return last.result;

    last = { args, result: compute(args, last) };
    return last.result;
  };
}

/**
 * La lista nueva, pero con los elementos de la anterior en los lugares donde
 * dicen lo mismo. Si no cambió nada, devuelve la lista anterior.
 *
 * @param keyOf Lo que identifica a un elemento: con eso se busca su versión anterior.
 */
export function shareList<Item extends object>(previous: Item[], next: Item[], keyOf: (item: Item) => string): Item[] {
  const before = new Map(previous.map((item) => [keyOf(item), item]));
  const shared = next.map((item) => {
    const same = before.get(keyOf(item));
    return same && sameProps(same, item) ? same : item;
  });
  return sameItems(previous, shared) ? previous : shared;
}

/**
 * Lo mismo que `shareList`, para un diccionario. Si no cambió nada, devuelve
 * el diccionario anterior.
 *
 * @param same Cuándo dos valores dicen lo mismo.
 */
export function shareRecord<Value>(
  previous: Record<string, Value>,
  next: Record<string, Value>,
  same: (a: Value, b: Value) => boolean,
): Record<string, Value> {
  const shared: Record<string, Value> = {};
  let changed = Object.keys(previous).length !== Object.keys(next).length;

  for (const [key, value] of Object.entries(next)) {
    const before = previous[key];
    const reuse = before !== undefined && (before === value || same(before, value));
    shared[key] = reuse ? before : value;
    if (!reuse) changed = true;
  }

  return changed ? shared : previous;
}
