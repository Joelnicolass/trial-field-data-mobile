// La lista del chat, renglón por renglón: los mensajes, un separador cada vez
// que cambia el día, otro donde empieza lo que no leí y, al final, lo mío que
// todavía no salió.
//
// Cada elemento es liviano: dice qué renglón es y de dónde sale, no cómo se
// dibuja. Eso lo arma cada renglón por su cuenta (`mappers.ts`). Así la lista
// cambia solo cuando entra o sale un renglón.

import type { Outgoing } from '@/domain/chat';
import { memoizeFromPrevious, memoizeLast, sameItems, shareList } from '@/domain/sharing';
import type { MemberId, Message } from '@/domain/types';

export type TimelineItem =
  | { kind: 'day'; key: string; date: string }
  | { kind: 'unread'; key: string; count: number }
  | {
      kind: 'message';
      key: string;
      message: Message;
      /** El renglón de arriba es un mensaje del mismo remitente. */
      followsSameSender: boolean;
    }
  | { kind: 'outgoing'; key: string; outgoing: Outgoing };

export type ReadMarks = {
  /** Mi id: lo que mandé yo nunca cuenta como sin leer. */
  me: MemberId;
  /** Hasta qué mensaje leí la última vez (mi `watermark`). */
  lastReadSeq: number;
  /** El último mensaje que había al abrir el grupo. */
  loadedUpToSeq: number;
};

/**
 * La lista entera, armada de cero.
 *
 * @param messages Ordenados por `seq`.
 * @param outbox   Lo mío que todavía no salió, en el orden en que lo escribí.
 * @param marks    De dónde a dónde va lo "sin leer". Lo que llega con el
 *                 grupo abierto no entra: el número del separador no cambia
 *                 mientras se lee.
 */
export function buildTimeline(messages: Message[], outbox: Outgoing[], marks: ReadMarks): TimelineItem[] {
  return [...buildMessageItems(messages, marks), ...outbox.map(toOutgoingItem)];
}

function buildMessageItems(messages: Message[], marks: ReadMarks): TimelineItem[] {
  const unread = messages.filter(
    (message) => message.seq > marks.lastReadSeq && message.seq <= marks.loadedUpToSeq && message.sender_id !== marks.me,
  );
  const firstUnreadSeq = unread[0]?.seq;

  const items: TimelineItem[] = [];
  messages.forEach((message, index) => {
    pushMessage(items, message, messages[index - 1], message.seq === firstUnreadSeq ? unread.length : 0);
  });
  return items;
}

/**
 * Suma a `items` lo que le toca a un mensaje: el separador de día si con él
 * cambia el día, el de "sin leer" si es el primero sin leer, y el mensaje.
 *
 * @param above       El mensaje que queda arriba en la lista, si hay.
 * @param unreadCount Cuántos sin leer empiezan en este mensaje. 0 si ninguno.
 */
function pushMessage(items: TimelineItem[], message: Message, above: Message | undefined, unreadCount: number) {
  const day = dayOf(message);
  // Un separador corta la seguidilla de mensajes de un mismo remitente.
  let afterSeparator = false;

  if (!above || dayOf(above) !== day) {
    items.push({ kind: 'day', key: `day-${day}`, date: day });
    afterSeparator = true;
  }
  if (unreadCount > 0) {
    items.push({ kind: 'unread', key: 'unread', count: unreadCount });
    afterSeparator = true;
  }
  items.push({
    kind: 'message',
    key: message.message_id,
    message,
    followsSameSender: !afterSeparator && above?.sender_id === message.sender_id,
  });
}

function dayOf(message: Message): string {
  return message.created_at.slice(0, 10);
}

function toOutgoingItem(outgoing: Outgoing): TimelineItem {
  return { kind: 'outgoing', key: `local-${outgoing.localId}`, outgoing };
}

const keyOf = (item: TimelineItem) => item.key;

// Los renglones de los mensajes, recordando los de la vez anterior.
//
// Lo normal es que lleguen mensajes nuevos al final: en ese caso se suman
// sus renglones y los que ya estaban ni se miran. Solo si un mensaje entró
// en el medio (llegó tarde) se arma todo de nuevo, conservando los renglones
// que siguen igual.
const messageItemsOf = memoizeFromPrevious<readonly [Message[], MemberId, number, number], TimelineItem[]>((args, previous) => {
  const [messages, me, lastReadSeq, loadedUpToSeq] = args;

  const from = previous ? appendedFrom(previous.args, args) : null;
  if (previous && from !== null) {
    const items = [...previous.result];
    // Lo que llega con el grupo abierto no cuenta como "sin leer": no hay separador que sumar.
    for (let index = from; index < messages.length; index++) pushMessage(items, messages[index], messages[index - 1], 0);
    return items;
  }

  const built = buildMessageItems(messages, { me, lastReadSeq, loadedUpToSeq });
  return previous ? shareList(previous.result, built, keyOf) : built;
});

/**
 * Desde qué lugar los mensajes son nuevos, si lo único que pasó es que se
 * sumaron al final. `null` si cambió otra cosa y hay que armar todo de nuevo.
 */
function appendedFrom(
  before: readonly [Message[], MemberId, number, number],
  after: readonly [Message[], MemberId, number, number],
): number | null {
  const [messagesBefore, ...marksBefore] = before;
  const [messagesAfter, ...marksAfter] = after;
  if (!sameItems(marksBefore, marksAfter)) return null;

  const count = messagesBefore.length;
  if (count === 0 || messagesAfter.length <= count) return null;
  // Si el que era el último sigue en su lugar, nada entró antes que él.
  if (messagesAfter[count - 1] !== messagesBefore[count - 1]) return null;
  // Un mensaje anterior a la carga podría ser el primero sin leer: mejor armar de nuevo.
  if (messagesAfter[count].seq <= after[3]) return null;

  return count;
}

const outgoingItemsOf = memoizeLast(
  (outbox: Outgoing[]) => outbox.map(toOutgoingItem),
  (previous, next) => shareList(previous, next, keyOf),
);

// Las dos partes en una sola lista. Sin nada pendiente, es la de los mensajes tal cual.
const joinItems = memoizeLast((messageItems: TimelineItem[], outgoingItems: TimelineItem[]) =>
  outgoingItems.length === 0 ? messageItems : [...messageItems, ...outgoingItems],
);

/**
 * La misma lista que `buildTimeline`, recordando la anterior: si no cambió
 * nada devuelve la misma, y un mensaje nuevo suma su renglón sin tocar ni
 * volver a mirar los demás.
 */
export function timelineOf(messages: Message[], outbox: Outgoing[], me: MemberId, lastReadSeq: number, loadedUpToSeq: number): TimelineItem[] {
  return joinItems(messageItemsOf(messages, me, lastReadSeq, loadedUpToSeq), outgoingItemsOf(outbox));
}

/** En qué renglón abrir: lo primero sin leer o, si no hay, el último. */
export function initialIndexOf(items: TimelineItem[]): number {
  const unreadIndex = items.findIndex((item) => item.kind === 'unread');
  return unreadIndex >= 0 ? unreadIndex : items.length - 1;
}

/** Con qué otros renglones puede compartir molde la lista al reciclar: los que se dibujan parecido. */
export function itemType(item: TimelineItem): string {
  return item.kind === 'message' ? `message-${item.message.type}` : item.kind;
}

/** Una línea que resume un mensaje, para citarlo cuando alguien le responde. */
export function messageSnippet(message: Message): string {
  if (message.type === 'audio') return message.transcript ?? 'Audio';
  if (message.type === 'photo') return message.text ?? 'Foto';
  if (message.type === 'dato') return message.dato?.title ?? 'Dato';
  if (message.type === 'card') return message.card?.title ?? 'Tarjeta';
  if (message.type === 'table') return message.table?.title ?? 'Tabla';
  return message.text ?? '';
}
