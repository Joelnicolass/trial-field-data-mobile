import { serverNow } from '@/api';

/**
 * La hora que la app toma como actual. La consigna pide usar `now` de los
 * datos de prueba, no el reloj del teléfono: con ella se decide qué es "Hoy"
 * y qué es "Ayer". De dónde sale lo decide `src/api`.
 */
export function useNow(): string {
  return serverNow;
}
