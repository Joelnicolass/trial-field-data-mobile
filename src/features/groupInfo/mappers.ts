// De los datos del grupo a lo que dibuja "Info del grupo".
//
//   servidor → datos (estado) → MAPPERS → pantalla
//
// Funciones puras: reciben el estado y la hora, y devuelven los tres bloques
// (quiénes están, el modo del agente y quién vio lo mío) con sus textos ya
// escritos.

import type { ChatState } from '@/domain/chat';
import { formatDate, formatTime } from '@/domain/format';
import { roleLabel } from '@/features/group/roles';
import { messageSnippet } from '@/features/group/timeline';
import type { AgentMode, Message, MessageType } from '@/domain/types';

import type { AgentModeModel, GroupInfoModel, MemberModel, SeenMessageModel } from './model';

/** Cuántos mensajes míos se listan, como mucho: los últimos. */
const MAX_MY_MESSAGES = 10;

/** Toda la pantalla, lista para dibujar. `now` es la hora actual, en ISO. */
export function toGroupInfo(chat: ChatState, now: string): GroupInfoModel {
  const myMessages = toMyMessages(chat, now);
  return {
    groupName: chat.name,
    // Cuenta también al agente, igual que la barra del grupo.
    membersTitle: chat.members.length === 1 ? '1 integrante' : `${chat.members.length} integrantes`,
    members: toMembers(chat),
    agentMode: toAgentMode(chat.agentMode),
    myMessages,
    noMessagesText: myMessages.length === 0 ? 'Todavía no mandaste ningún mensaje. Cuando mandes uno, acá vas a ver quién lo vio.' : null,
  };
}

// ── Integrantes ────────────────────────────────────────────────────────────

// Las personas en el orden en que las manda el servidor. El agente va al
// final: no es una persona.
function toMembers(chat: ChatState): MemberModel[] {
  const people = chat.members.filter((member) => !member.is_agent);
  const agents = chat.members.filter((member) => member.is_agent);
  return [...people, ...agents].map((member) => ({
    key: member.id,
    name: member.name,
    detail: member.is_agent ? 'Anota datos y responde consultas' : capitalize(roleLabel(member.role)),
    isMe: member.id === chat.me,
    isAgent: member.is_agent,
  }));
}

// "dueño" → "Dueño": acá el rol va solo en su renglón, no al lado del nombre.
function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// ── El agente ──────────────────────────────────────────────────────────────

// En qué orden se ofrecen los modos.
const MODES: AgentMode[] = ['detect', 'mention_only'];

// Lo único que cambia entre un modo y otro es cuándo anota un dato. Las
// consultas las responde siempre que lo mencionan, en los dos.
const MODE_TEXT: Record<AgentMode, { label: string; explanation: string }> = {
  detect: { label: 'Anota solo', explanation: 'Anota un dato apenas alguien lo cuenta, aunque no lo mencionen.' },
  mention_only: { label: 'Si lo mencionan', explanation: 'No anota por su cuenta: actúa solo cuando lo mencionan.' },
};

function toAgentMode(current: AgentMode): AgentModeModel {
  return {
    options: MODES.map((mode) => ({ key: mode, label: MODE_TEXT[mode].label, active: mode === current })),
    explanation: MODE_TEXT[current].explanation,
  };
}

// ── Quién vio mis mensajes ─────────────────────────────────────────────────

// Lo que cuenta como un mensaje mío: lo que escribí, grabé o fotografié. Un
// aviso del grupo ("Héctor agregó a Lucía") lleva mi id y no lo es.
const OWN_TYPES: MessageType[] = ['text', 'audio', 'photo'];

// Mis últimos mensajes, del más nuevo al más viejo, con quién vio cada uno.
// Lo que todavía no salió no entra: no llegó a nadie.
//
// Ojo: los `watermark` llegan solo con la carga inicial, porque el servidor no
// avisa cuando alguien lee. Lo que mando con la app abierta figura como "no
// lo vio nadie" hasta la próxima carga.
function toMyMessages(chat: ChatState, now: string): SeenMessageModel[] {
  // Quién lo pudo ver: las personas, sin contarme. El agente no es una persona.
  const readers = chat.members.filter((member) => !member.is_agent && member.id !== chat.me);

  return lastOwnMessages(chat).map((message) => {
    // Lo vio quien leyó hasta ese mensaje o más adelante.
    const names = readers.filter((reader) => reader.watermark >= message.seq).map((reader) => reader.short_name);
    return {
      key: message.message_id,
      snippet: messageSnippet(message),
      when: sentAt(message.created_at, now),
      seen: names.length > 0,
      seenBy: seenByText(names),
    };
  });
}

// Mis últimos mensajes, del más nuevo al más viejo. Se busca desde el final
// y se corta al juntar los que hacen falta: no se recorre todo el historial.
function lastOwnMessages(chat: ChatState): Message[] {
  const own: Message[] = [];
  for (let index = chat.messages.length - 1; index >= 0 && own.length < MAX_MY_MESSAGES; index--) {
    const message = chat.messages[index];
    if (message.sender_id === chat.me && OWN_TYPES.includes(message.type)) own.push(message);
  }
  return own;
}

// La hora si es de hoy; si no, alcanza con el día: "07:01", "Ayer", "16/11".
function sentAt(iso: string, now: string): string {
  const isToday = iso.slice(0, 10) === now.slice(0, 10);
  return isToday ? formatTime(iso) : formatDate(iso, now);
}

function seenByText(names: string[]): string {
  if (names.length === 0) return 'Todavía no lo vio nadie';
  if (names.length === 1) return `Lo vio ${names[0]}`;
  return `Lo vieron ${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;
}
