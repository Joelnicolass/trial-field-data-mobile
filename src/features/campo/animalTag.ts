import type { Animal } from '@/domain/campo';
import type { TagStatus } from '@/ui/Tag';

export type AnimalTag = { label: string; status: TagStatus };

/**
 * La etiqueta de un animal en la lista. Si ya no está en el campo, manda eso
 * (vendido o dado de baja); si está, su estado reproductivo. Sin nada que
 * decir, no lleva etiqueta.
 */
export function animalTag(animal: Animal): AnimalTag | null {
  const female = animal.sex === 'H';

  if (animal.status === 'sold') return { label: female ? 'Vendida' : 'Vendido', status: 'vendido' };
  if (animal.status !== 'active') return { label: female ? 'Dada de baja' : 'Dado de baja', status: 'archivado' };

  if (animal.reproductive_status === 'pregnant') return { label: 'Preñada', status: 'activo' };
  if (animal.reproductive_status === 'empty') return { label: 'Vacía', status: 'archivado' };
  return null;
}
