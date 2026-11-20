import { campoData } from '@/api';
import type { CampoData } from '@/domain/campo';

/**
 * Los datos del campo: stock, tacto, lluvia y animales. De dónde salen lo
 * decide `src/api`: hoy es el archivo de prueba.
 */
export function useCampoData(): CampoData {
  return campoData;
}
