import data from '@/server/mock-data.json';

/**
 * La hora que la app toma como actual. La consigna pide usar `now` de los
 * datos de prueba, no el reloj del teléfono: con ella se decide qué es "Hoy"
 * y qué es "Ayer". Está en un solo lugar para cambiarla el día que haya
 * un servidor real.
 */
export function useNow(): string {
  return data.now;
}
