import type { CampoData } from '@/domain/campo';
import data from '@/server/mock-data.json';

/**
 * Los datos del campo: stock, tacto, lluvia y animales. Hoy salen del archivo
 * de prueba; es el único lugar que habría que cambiar para pedirlos a un
 * servidor.
 */
export function useCampoData(): CampoData {
  // TypeScript deduce del JSON un tipo distinto por cada animal; `CampoData`
  // es la forma que la app usa de verdad.
  return data as unknown as CampoData;
}
