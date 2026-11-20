import { useMemo } from 'react';

import { useCampoData } from '@/hooks/useCampoData';
import { useNow } from '@/hooks/useNow';

import { toAnimalDetail } from './mappers';
import type { AnimalDetailModel } from './model';

/**
 * Lo que la pantalla del detalle necesita, ya listo para dibujar.
 *
 *   servidor → datos → mappers → pantalla
 *
 * Busca el animal entre los datos del campo y lo pasa por el mapper. Devuelve
 * `null` si no hay ninguno con ese identificador: en web se puede llegar con
 * una dirección vieja o mal escrita.
 */
export function useAnimalScreen(id: string): AnimalDetailModel | null {
  const { animals } = useCampoData();
  const now = useNow();

  return useMemo(() => {
    const animal = animals.find((item) => item.id === id);
    return animal ? toAnimalDetail(animal, now) : null;
  }, [animals, id, now]);
}
