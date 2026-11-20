// De un animal a lo que dibuja la pantalla de su detalle.
//
//   servidor → datos → MAPPERS → pantalla
//
// Función pura: recibe el animal crudo y la hora, y devuelve textos listos.
// Lo que falta sale con una raya: nunca "null" ni un texto vacío.

import type { Animal } from '@/domain/campo';
import { formatAge, formatDate, formatQuantity, MISSING } from '@/domain/format';
import { exitTag, reproductiveTag } from '@/features/campo/animalTag';

import type { AnimalDetailModel, DetailSectionModel } from './model';

const SEX_LABEL: Record<string, string> = { H: 'Hembra', M: 'Macho' };

/** Por qué salió del campo, según su estado. */
const EXIT_REASON: Record<string, string> = { sold: 'Venta', dead: 'Muerte' };

export function toAnimalDetail(animal: Animal, now: string): AnimalDetailModel {
  // La misma decisión que la etiqueta de la lista: vendido, dado de baja o,
  // si no es ninguna de las dos, sigue en el campo.
  const exit = exitTag(animal);
  // De un animal que ya no está se muestra la edad que tenía al salir, no la de hoy.
  const ageDate = exit ? animal.exit_date : now;

  const sections: DetailSectionModel[] = [
    {
      title: 'Identificación',
      rows: [
        { label: 'Caravana', value: orMissing(animal.identifier) },
        { label: 'Caravana electrónica', value: orMissing(animal.electronic_id) },
        { label: 'Categoría', value: orMissing(animal.category_name) },
        { label: 'Sexo', value: SEX_LABEL[animal.sex] ?? orMissing(animal.sex) },
        { label: 'Raza', value: orMissing(animal.breed) },
      ],
    },
    {
      title: 'Edad y nacimiento',
      rows: [
        { label: exit ? 'Edad al salir' : 'Edad', value: ageDate ? formatAge(animal.birth_date, ageDate) : MISSING },
        { label: 'Nacimiento', value: dateOrMissing(animal.birth_date, now) },
      ],
    },
    {
      title: exit ? 'Última ubicación' : 'Ubicación',
      rows: [
        { label: 'Rodeo', value: orMissing(animal.herd) },
        { label: 'Potrero', value: orMissing(animal.lote) },
      ],
    },
    {
      title: 'Peso',
      rows: [
        { label: 'Último peso', value: animal.last_weight_kg == null ? MISSING : formatQuantity(animal.last_weight_kg, 'kg') },
        { label: 'Fecha del pesaje', value: dateOrMissing(animal.last_weighing_date, now) },
      ],
    },
  ];

  // Solo si tiene estado reproductivo: a un ternero o a un toro no se le arma la sección vacía.
  if (animal.reproductive_status) {
    sections.push({
      title: 'Reproducción',
      rows: [{ label: 'Estado', value: reproductiveTag(animal)?.label ?? animal.reproductive_status }],
    });
  }

  if (exit) {
    sections.push({
      title: 'Salida',
      rows: [
        { label: 'Motivo', value: EXIT_REASON[animal.status] ?? MISSING },
        { label: 'Fecha', value: dateOrMissing(animal.exit_date, now) },
      ],
    });
  }

  return {
    title: animal.identifier ? `Caravana ${animal.identifier}` : 'Sin caravana',
    subtitle: `${orMissing(animal.category_name)} · ${orMissing(animal.breed)}`,
    status: exit ?? { label: 'En el campo', status: 'activo' },
    sections,
    notes: animal.notes?.trim() || null,
  };
}

/** El texto, o la raya si no vino o vino vacío. */
function orMissing(value: string | null): string {
  return value || MISSING;
}

/** La fecha como la escribe la guía, o la raya si no vino. */
function dateOrMissing(iso: string | null, now: string): string {
  return iso ? formatDate(iso, now) : MISSING;
}
