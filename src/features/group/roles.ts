import type { Member } from '@/server/mock-server';

// Cómo se nombra cada rol en el grupo, con las palabras de la consigna.
const ROLE_LABEL: Record<Member['role'], string> = {
  owner: 'dueño',
  manager: 'encargado',
  worker: 'peón',
  vet: 'veterinaria',
  agent: 'agente',
};

export function roleLabel(role: Member['role']): string {
  return ROLE_LABEL[role];
}
