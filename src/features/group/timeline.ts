// Convierte la lista de mensajes en lo que se dibuja en el chat: los
// mensajes, más un separador cada vez que cambia el día y otro donde empieza
// lo que no leí. Función pura: no sabe de React.

import type { MemberId, Message } from '@/server/mock-server';

export type TimelineItem =
  | { kind: 'day'; key: string; date: string }
  | { kind: 'unread'; key: string; count: number }
  | { kind: 'message'; key: string; message: Message };

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
 * @param marks    De dónde a dónde va lo "sin leer". Lo que llega con el
 *                 grupo abierto no entra: el número del separador no cambia
 *                 mientras se lee.
 */
export function buildTimeline(messages: Message[], marks: ReadMarks): TimelineItem[] {
  const unread = messages.filter(
    (message) => message.seq > marks.lastReadSeq && message.seq <= marks.loadedUpToSeq && message.sender_id !== marks.me,
  );
  const firstUnreadSeq = unread[0]?.seq;

  const items: TimelineItem[] = [];
  let currentDay = '';

  for (const message of messages) {
    const day = message.created_at.slice(0, 10);
    if (day !== currentDay) {
      currentDay = day;
      items.push({ kind: 'day', key: `day-${day}`, date: day });
    }
    if (message.seq === firstUnreadSeq) {
      items.push({ kind: 'unread', key: 'unread', count: unread.length });
    }
    items.push({ kind: 'message', key: message.message_id, message });
  }

  return items;
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
