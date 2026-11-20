// El estado del grupo y cómo cambia con cada evento del servidor.
// TypeScript puro: no importa React ni el servidor (solo sus tipos), así que
// se prueba con tests comunes, sin teléfono.
//
// La regla de todo el archivo: aplicar el mismo evento dos veces, o en otro
// orden, tiene que dar el mismo resultado. El servidor entrega mensajes
// tarde y repetidos, y con esa regla ninguno de los dos casos rompe nada.

import type { AgentMode, AgentStatus, ChatSnapshot, Dato, DatoChange, Member, MemberId, Message, ServerEvent } from '@/server/mock-server';

import { memoizeLast } from './sharing';

/** Cuánto dura un "escribiendo" si esa persona no manda nada. El servidor no avisa cuando termina. */
export const TYPING_MS = 6000;

/** Un mensaje mío que todavía no salió: se está enviando o falló. */
export type Outgoing = {
  /** Identificador que genera la app. Reintentar con el mismo no duplica el mensaje. */
  localId: string;
  text: string;
  /** El `seq` del mensaje al que responde, si responde a alguno. */
  replyTo: number | null;
  createdAt: string;
  status: 'sending' | 'failed';
};

/** Un intento de completar un dato desde su tarjeta: se está guardando o falló. */
export type DatoSave = {
  /** Identificador del pedido. Reintentar con el mismo no lo aplica dos veces. */
  localId: string;
  /** Lo que se eligió para cada campo que faltaba: campo → valor. */
  values: Record<string, string>;
  status: 'saving' | 'failed';
  /** Por qué falló, con el código que devuelve el servidor. */
  errorCode: string | null;
  /** El campo cuyo valor no sirvió, si el error fue ese. */
  errorField: string | null;
};

export type ChatState = {
  name: string;
  /** Quién soy yo dentro de `members`. */
  me: MemberId;
  members: Member[];
  /** Ordenados por `seq` y sin repetidos. */
  messages: Message[];
  /** Lo mío que todavía no salió, en el orden en que lo escribí. */
  outbox: Outgoing[];
  /**
   * Cómo está ahora cada dato: id del dato → dato. Se actualiza cuando llega
   * el dato o un cambio suyo; un mensaje cualquiera no lo toca.
   */
  datos: Record<string, Dato>;
  /**
   * Qué mensajes hablan de cada dato (el que lo creó y sus cambios): id del
   * dato → sus `seq`, en orden. Con esto, al llegar un cambio se repasan solo
   * los mensajes de ese dato, no todo el historial.
   */
  datoSeqs: Record<string, number[]>;
  /** Los datos que estoy completando ahora: id del dato → su intento. */
  datoSaves: Record<string, DatoSave>;
  /**
   * Lo mío que mandé como audio: identificador del envío → duración (ms).
   * El servidor solo acepta texto, así que esto lo recuerda la app.
   */
  voiceNotes: Record<string, number>;
  /** Hasta qué mensaje había leído al abrir: debajo va "mensajes sin leer". */
  lastReadSeq: number;
  /** El último mensaje que había al abrir. Lo que llega después es "nuevo", no "sin leer". */
  loadedUpToSeq: number;
  /** Quién está escribiendo: id del miembro → momento en que se apaga (ms). */
  typingUntil: Record<MemberId, number>;
  agentStatus: AgentStatus;
  /** Cuándo anota el agente: apenas alguien cuenta un dato, o solo si lo mencionan. */
  agentMode: AgentMode;
  /** Último `cursor` recibido. Si la conexión se corta, se retoma desde acá. */
  cursor: number;
};

/**
 * Arma el estado inicial con lo que devuelve `loadChat()`.
 *
 * @param stored Lo que la app tenía guardado sin enviar de una vez anterior.
 */
export function chatFromSnapshot(snapshot: ChatSnapshot, stored: Outgoing[] = []): ChatState {
  const me = snapshot.members.find((member) => member.id === snapshot.me);
  const messages = sortedUnique(snapshot.messages);
  return {
    name: snapshot.name,
    me: snapshot.me,
    members: snapshot.members,
    messages,
    // Al abrir se repasa el historial una sola vez. Después, cada dato se
    // mantiene al día por su cuenta.
    datos: currentDatos(messages),
    datoSeqs: indexDatoSeqs(messages),
    outbox: initialOutbox(snapshot, stored),
    datoSaves: {},
    voiceNotes: {},
    lastReadSeq: me?.watermark ?? 0,
    loadedUpToSeq: messages[messages.length - 1]?.seq ?? 0,
    typingUntil: {},
    agentStatus: 'idle',
    agentMode: snapshot.agent_mode,
    cursor: snapshot.cursor,
  };
}

/** Devuelve el estado que resulta de un evento. `now` es la hora actual en ms. */
export function applyEvent(state: ChatState, event: ServerEvent, now: number): ChatState {
  switch (event.type) {
    case 'message':
      return { ...receiveMessage(state, event.message), cursor: Math.max(state.cursor, event.cursor) };
    case 'typing':
      return { ...state, typingUntil: { ...state.typingUntil, [event.member_id]: now + TYPING_MS } };
    case 'agent_status':
      return { ...state, agentStatus: event.status };
  }
}

/**
 * Suma un mensaje al grupo. Si es la confirmación de algo que mandé yo
 * (trae mi `local_id`), saca ese pendiente de la lista.
 *
 * Lo mío llega por dos caminos: como respuesta al enviar y como evento. Esta
 * función se llama en los dos, y la segunda vez no cambia nada.
 */
export function receiveMessage(state: ChatState, message: Message): ChatState {
  const messages = insertMessage(state.messages, message);
  // Un mensaje repetido deja la lista igual, y entonces tampoco toca su dato.
  const { datos, datoSeqs } = messages === state.messages ? state : withDatoOf(state, messages, message);

  return {
    ...state,
    messages,
    datos,
    datoSeqs,
    outbox: message.local_id ? state.outbox.filter((item) => item.localId !== message.local_id) : state.outbox,
    // Si mandó algo, dejó de escribir.
    typingUntil: omit(state.typingUntil, message.sender_id),
  };
}

/** Pone un mensaje mío como "enviándose". Sirve para el primer intento y para reintentar. */
export function queueOutgoing(state: ChatState, outgoing: Omit<Outgoing, 'status'>): ChatState {
  const sending: Outgoing = { ...outgoing, status: 'sending' };
  const exists = state.outbox.some((item) => item.localId === outgoing.localId);
  return {
    ...state,
    outbox: exists ? state.outbox.map((item) => (item.localId === outgoing.localId ? sending : item)) : [...state.outbox, sending],
  };
}

/** Marca como fallido un envío. Queda en la lista para reintentarlo. */
export function failOutgoing(state: ChatState, localId: string): ChatState {
  return { ...state, outbox: state.outbox.map((item) => (item.localId === localId ? { ...item, status: 'failed' } : item)) };
}

// Lo pendiente al abrir: lo que el servidor dice que no salió la vez
// anterior, más lo que la app tenía guardado. Nada de eso se está enviando
// ahora, así que todo arranca como fallido.
function initialOutbox(snapshot: ChatSnapshot, stored: Outgoing[]): Outgoing[] {
  const fromServer: Outgoing[] = snapshot.unsent.map((unsent) => ({
    localId: unsent.local_id,
    text: unsent.text,
    replyTo: null,
    createdAt: unsent.created_at,
    status: 'failed',
  }));
  const known = new Set(fromServer.map((item) => item.localId));
  const fromApp = stored.filter((item) => !known.has(item.localId)).map((item): Outgoing => ({ ...item, status: 'failed' }));
  return [...fromServer, ...fromApp];
}

/** Apaga los "escribiendo" que ya vencieron. Si no venció ninguno, devuelve el mismo estado. */
export function dropExpiredTyping(state: ChatState, now: number): ChatState {
  const stillTyping = Object.entries(state.typingUntil).filter(([, until]) => until > now);
  if (stillTyping.length === Object.keys(state.typingUntil).length) return state;
  return { ...state, typingUntil: Object.fromEntries(stillTyping) };
}

/** Anota que ese envío fue un audio, y cuánto duró. */
export function markVoiceNote(state: ChatState, localId: string, durationMs: number): ChatState {
  return { ...state, voiceNotes: { ...state.voiceNotes, [localId]: durationMs } };
}

/**
 * Borra quién escribe y en qué anda el agente. Se usa al quedarse sin señal:
 * esos avisos ya no se pueden actualizar, y uno viejo confunde. Al volver, el
 * servidor manda de nuevo el estado del agente.
 */
export function dropActivity(state: ChatState): ChatState {
  return { ...state, typingUntil: {}, agentStatus: 'idle' };
}

/** Cambia el modo del agente. Si ya estaba en ese, devuelve el mismo estado. */
export function changeAgentMode(state: ChatState, mode: AgentMode): ChatState {
  return state.agentMode === mode ? state : { ...state, agentMode: mode };
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
  // Lo normal: llega el más nuevo y va al final.
  const last = messages[messages.length - 1];
  if (!last || message.seq > last.seq) return [...messages, message];

  const index = seqIndex(messages, message.seq);
  // El `seq` identifica al mensaje: si ya hay uno con ese número, es un repetido.
  if (messages[index]?.seq === message.seq) return messages;

  return [...messages.slice(0, index), message, ...messages.slice(index)];
}

/**
 * En qué lugar de la lista está el mensaje con ese `seq` o, si no está, dónde
 * iría. La lista está ordenada, así que se busca partiéndola por la mitad
 * cada vez: con veinte mil mensajes se miran quince, no veinte mil.
 */
export function seqIndex(messages: Message[], seq: number): number {
  let low = 0;
  let high = messages.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (messages[middle].seq < seq) low = middle + 1;
    else high = middle;
  }
  return low;
}

/** El mensaje con ese `seq`, por ejemplo el que cita una respuesta. */
export function messageBySeq(messages: Message[], seq: number): Message | undefined {
  const found = messages[seqIndex(messages, seq)];
  return found?.seq === seq ? found : undefined;
}

/**
 * Cuántos mensajes de otros hay después de `seq`. Los nuevos están al final:
 * se cuenta desde atrás y se corta al llegar a lo ya visto.
 */
export function countNewerThan(messages: Message[], seq: number, me: MemberId): number {
  let count = 0;
  for (let index = messages.length - 1; index >= 0 && messages[index].seq > seq; index--) {
    if (messages[index].sender_id !== me) count++;
  }
  return count;
}

/** El historial como llega al abrir, ordenado por `seq` y sin repetidos. */
function sortedUnique(messages: Message[]): Message[] {
  const sorted = [...messages].sort((a, b) => a.seq - b.seq);
  return sorted.filter((message, index) => index === 0 || message.seq !== sorted[index - 1].seq);
}

/** Para encontrar a un miembro por su id. Recuerda la respuesta mientras la lista de miembros sea la misma. */
export const membersByIdOf = memoizeLast((members: Member[]) => new Map(members.map((member) => [member.id, member])));

/** Las personas que están escribiendo, en el orden de `members`. */
export function typingMembers(state: ChatState): Member[] {
  return state.members.filter((member) => member.id in state.typingUntil);
}

// ── Datos ──────────────────────────────────────────────────────────────────

/** Marca un dato como "guardando" con lo que se eligió. Sirve también para reintentar. */
export function startDatoSave(state: ChatState, datoId: string, save: Pick<DatoSave, 'localId' | 'values'>): ChatState {
  return { ...state, datoSaves: { ...state.datoSaves, [datoId]: { ...save, status: 'saving', errorCode: null, errorField: null } } };
}

/** El guardado falló: lo elegido no se pierde y se puede reintentar. */
export function failDatoSave(state: ChatState, datoId: string, errorCode: string, errorField: string | null = null): ChatState {
  const save = state.datoSaves[datoId];
  if (!save) return state;
  return { ...state, datoSaves: { ...state.datoSaves, [datoId]: { ...save, status: 'failed', errorCode, errorField } } };
}

/** Terminó el intento, haya salido bien o ya no haga falta. */
export function endDatoSave(state: ChatState, datoId: string): ChatState {
  return { ...state, datoSaves: omit(state.datoSaves, datoId) };
}

/**
 * Cómo está ahora cada dato del grupo.
 *
 * Un dato nace en un mensaje `dato` y después cambia con mensajes
 * `dato_change`. No se guarda aparte: se calcula repasando los mensajes en
 * orden. Así la tarjeta original siempre muestra el valor actual, y no hay
 * una segunda copia que pueda quedar desactualizada.
 */
/** De qué dato habla un mensaje: del que crea o del que cambia. `undefined` si no habla de ninguno. */
function datoIdOf(message: Message): string | undefined {
  if (message.type === 'dato') return message.dato?.id;
  if (message.type === 'dato_change') return message.dato_change?.dato_id;
  return undefined;
}

/** Qué mensajes hablan de cada dato: id del dato → sus `seq`, en orden. */
function indexDatoSeqs(messages: Message[]): Record<string, number[]> {
  const seqs: Record<string, number[]> = {};
  for (const message of messages) {
    const datoId = datoIdOf(message);
    if (datoId) (seqs[datoId] ??= []).push(message.seq);
  }
  return seqs;
}

/**
 * Si el mensaje trae un dato o un cambio, deja ese dato al día. Los demás
 * datos no se tocan: siguen siendo los mismos objetos.
 *
 * No aplica el cambio "encima" del dato que había: repasa los mensajes de
 * ese dato en orden, con la misma regla de siempre (`currentDatos`). Así el
 * resultado no depende del orden en que llegaron, y son pocos mensajes.
 */
function withDatoOf(state: ChatState, messages: Message[], message: Message): Pick<ChatState, 'datos' | 'datoSeqs'> {
  const datoId = datoIdOf(message);
  if (!datoId) return state;

  const seqs = [...(state.datoSeqs[datoId] ?? []), message.seq].sort((a, b) => a - b);
  const own = seqs.flatMap((seq) => messageBySeq(messages, seq) ?? []);
  const dato = currentDatos(own)[datoId];

  return {
    datoSeqs: { ...state.datoSeqs, [datoId]: seqs },
    // Un cambio que llega antes que su dato todavía no tiene sobre qué aplicarse.
    datos: dato ? { ...state.datos, [datoId]: dato } : state.datos,
  };
}

/**
 * Cómo queda cada dato después de repasar esos mensajes en orden. Se usa con
 * todo el historial al abrir y, después, solo con los mensajes de un dato.
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
