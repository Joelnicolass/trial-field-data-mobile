import { typingMembers, type ChatState } from '@/domain/chat';
import type { AgentStatus } from '@/domain/types';

/** Lo que hace el agente, en palabras. Sin texto cuando no hace nada. */
export function agentActivity(status: AgentStatus): { text: string; slow: boolean } | null {
  if (status === 'thinking') return { text: 'El agente está pensando…', slow: false };
  if (status === 'slow') return { text: 'El agente está tardando más de lo normal…', slow: true };
  return null;
}

/** Quién está escribiendo: "Ramón está escribiendo…" o "Lucía y Mariano están escribiendo…". */
export function typingActivity(chat: ChatState): string | null {
  const names = typingMembers(chat)
    .filter((member) => member.id !== chat.me)
    .map((member) => member.short_name);

  if (names.length === 0) return null;
  if (names.length === 1) return `${names[0]} está escribiendo…`;
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]} están escribiendo…`;
}

/** La segunda línea de la barra superior: lo que pasa ahora o, si no pasa nada, cuántos son. */
export function statusLine(chat: ChatState): string {
  return typingActivity(chat) ?? agentActivity(chat.agentStatus)?.text ?? `${chat.members.length} integrantes`;
}
