// El estado del grupo y cómo cambia con cada evento del servidor.
// TypeScript puro: no importa React ni el servidor (solo sus tipos), así que
// se prueba con tests comunes, sin teléfono.
//
// La regla de todo el archivo: aplicar el mismo evento dos veces, o en otro
// orden, tiene que dar el mismo resultado. El servidor entrega mensajes
// tarde y repetidos, y con esa regla ninguno de los dos casos rompe nada.

import type { AgentStatus, ChatSnapshot, Dato, DatoChange, Member, MemberId, Message, ServerEvent } from '@/server/mock-server';

/** Cuánto dura un "escribiendo" si esa persona no manda nada. El servidor no avisa cuando termina. */
export const TYPING_MS = 6000;

export type ChatState = {
  name: string;
  /** Quién soy yo dentro de `members`. */
  me: MemberId;
  members: Member[];
  /** Ordenados por `seq` y sin repetidos. */
  messages: Message[];
  /** Hasta qué mensaje había leído al abrir: debajo va "mensajes sin leer". */
  lastReadSeq: number;
  /** El último mensaje que había al abrir. Lo que llega después es "nuevo", no "sin leer". */
  loadedUpToSeq: number;
  /** Quién está escribiendo: id del miembro → momento en que se apaga (ms). */
  typingUntil: Record<MemberId, number>;
  agentStatus: AgentStatus;
  /** Último `cursor` recibido. Si la conexión se corta, se retoma desde acá. */
  cursor: number;
};

/** Arma el estado inicial con lo que devuelve `loadChat()`. */
export function chatFromSnapshot(snapshot: ChatSnapshot): ChatState {
  const me = snapshot.members.find((member) => member.id === snapshot.me);
  const messages = snapshot.messages.reduce(insertMessage, []);
  return {
    name: snapshot.name,
    me: snapshot.me,
    members: snapshot.members,
    messages,
    lastReadSeq: me?.watermark ?? 0,
    loadedUpToSeq: messages[messages.length - 1]?.seq ?? 0,
    typingUntil: {},
    agentStatus: 'idle',
    cursor: snapshot.cursor,
  };
}

/** Devuelve el estado que resulta de un evento. `now` es la hora actual en ms. */
export function applyEvent(state: ChatState, event: ServerEvent, now: number): ChatState {
  switch (event.type) {
    case 'message':
      return {
        ...state,
        messages: insertMessage(state.messages, event.message),
        // Si mandó algo, dejó de escribir.
        typingUntil: omit(state.typingUntil, event.message.sender_id),
        cursor: Math.max(state.cursor, event.cursor),
      };
    case 'typing':
      return { ...state, typingUntil: { ...state.typingUntil, [event.member_id]: now + TYPING_MS } };
    case 'agent_status':
      return { ...state, agentStatus: event.status };
  }
}

/** Apaga los "escribiendo" que ya vencieron. Si no venció ninguno, devuelve el mismo estado. */
export function dropExpiredTyping(state: ChatState, now: number): ChatState {
  const stillTyping = Object.entries(state.typingUntil).filter(([, until]) => until > now);
  if (stillTyping.length === Object.keys(state.typingUntil).length) return state;
  return { ...state, typingUntil: Object.fromEntries(stillTyping) };
}

/**
 * Suma un mensaje a la lista, en su lugar según `seq`.
 *
 * El servidor entrega en orden de llegada (`cursor`), que no es el de la
 * conversación (`seq`): un mensaje puede llegar tarde, y también repetido.
 * - Repetido (mismo `message_id`): la lista queda igual.
 * - Tarde (`seq` menor que el último): va en el medio, no al final.
 */
export function insertMessage(messages: Message[], message: Message): Message[] {
  if (messages.some((existing) => existing.message_id === message.message_id)) return messages;

  // Casi siempre va al final: se busca el lugar desde atrás.
  let index = messages.length;
  while (index > 0 && messages[index - 1].seq > message.seq) index--;

  return [...messages.slice(0, index), message, ...messages.slice(index)];
}

/** Las personas que están escribiendo, en el orden de `members`. */
export function typingMembers(state: ChatState): Member[] {
  return state.members.filter((member) => member.id in state.typingUntil);
}

// ── Datos ──────────────────────────────────────────────────────────────────

/**
 * Cómo está ahora cada dato del grupo.
 *
 * Un dato nace en un mensaje `dato` y después cambia con mensajes
 * `dato_change`. No se guarda aparte: se calcula repasando los mensajes en
 * orden. Así la tarjeta original siempre muestra el valor actual, y no hay
 * una segunda copia que pueda quedar desactualizada.
 */
export function currentDatos(messages: Message[]): Record<string, Dato> {
  const datos: Record<string, Dato> = {};

  for (const message of messages) {
    if (message.type === 'dato' && message.dato) {
      datos[message.dato.id] = message.dato;
    }
    if (message.type === 'dato_change' && message.dato_change) {
      const dato = datos[message.dato_change.dato_id];
      // Un cambio viejo o repetido no pisa uno más nuevo.
      if (dato && message.dato_change.version > dato.version) {
        datos[dato.id] = applyDatoChange(dato, message.dato_change);
      }
    }
  }

  return datos;
}

/** El dato después de un cambio. Devuelve uno nuevo: no toca el original. */
export function applyDatoChange(dato: Dato, change: DatoChange): Dato {
  const fields = dato.fields.map((field) => {
    const changed = change.changes.find((item) => item.key === field.key);
    return changed ? { ...field, value: changed.after } : field;
  });

  return {
    ...dato,
    fields,
    status: change.status,
    version: change.version,
    missing_fields: fields.filter((field) => field.value === null).map((field) => field.key),
  };
}

function omit<T>(record: Record<string, T>, key: string): Record<string, T> {
  if (!(key in record)) return record;
  const { [key]: _removed, ...rest } = record;
  return rest;
}
