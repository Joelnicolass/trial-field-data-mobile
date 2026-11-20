// La lista del chat, renglón por renglón: los mensajes, un separador cada vez
// que cambia el día, otro donde empieza lo que no leí y, al final, lo mío que
// todavía no salió.
//
// Cada elemento es liviano: dice qué renglón es y de dónde sale, no cómo se
// dibuja. Eso lo arma cada renglón por su cuenta (`mappers.ts`). Así la lista
// cambia solo cuando entra o sale un renglón.

import type { Outgoing } from '@/domain/chat';
import { memoizeLast, shareList } from '@/domain/sharing';
import type { MemberId, Message } from '@/server/mock-server';

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
 * @param messages Ordenados por `seq`.
 * @param outbox   Lo mío que todavía no salió, en el orden en que lo escribí.
 * @param marks    De dónde a dónde va lo "sin leer". Lo que llega con el
 *                 grupo abierto no entra: el número del separador no cambia
 *                 mientras se lee.
 */
export function buildTimeline(messages: Message[], outbox: Outgoing[], marks: ReadMarks): TimelineItem[] {
  const unread = messages.filter(
    (message) => message.seq > marks.lastReadSeq && message.seq <= marks.loadedUpToSeq && message.sender_id !== marks.me,
  );
  const firstUnreadSeq = unread[0]?.seq;

  const items: TimelineItem[] = [];
  let currentDay = '';
  // Quién mandó el renglón de arriba. Un separador corta la seguidilla.
  let senderAbove: MemberId | null = null;

  for (const message of messages) {
    const day = message.created_at.slice(0, 10);
    if (day !== currentDay) {
      currentDay = day;
      senderAbove = null;
      items.push({ kind: 'day', key: `day-${day}`, date: day });
    }
    if (message.seq === firstUnreadSeq) {
      senderAbove = null;
      items.push({ kind: 'unread', key: 'unread', count: unread.length });
    }
    items.push({ kind: 'message', key: message.message_id, message, followsSameSender: senderAbove === message.sender_id });
    senderAbove = message.sender_id;
  }

  for (const outgoing of outbox) {
    items.push({ kind: 'outgoing', key: `local-${outgoing.localId}`, outgoing });
  }

  return items;
}

/**
 * La misma lista, recordando la anterior: si no cambió nada devuelve la
 * misma, y si cambió conserva los elementos que siguen igual. Un mensaje
 * nuevo es un elemento nuevo; los demás no se tocan.
 */
export const timelineOf = memoizeLast(
  (messages: Message[], outbox: Outgoing[], me: MemberId, lastReadSeq: number, loadedUpToSeq: number) =>
    buildTimeline(messages, outbox, { me, lastReadSeq, loadedUpToSeq }),
  (previous, next) => shareList(previous, next, (item) => item.key),
);

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
