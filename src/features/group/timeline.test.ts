import type { Message } from '@/domain/types';

import type { Outgoing } from '@/domain/chat';

import { buildTimeline, initialIndexOf, timelineOf } from './timeline';

function message(seq: number, day: string, senderId = 'u_02'): Message {
  return {
    seq,
    message_id: `m_${seq}`,
    sender_id: senderId,
    type: 'text',
    created_at: `${day}T07:00:00-03:00`,
    text: `mensaje ${seq}`,
    reply_to: null,
    mentions: [],
  };
}

const marks = { me: 'u_01', lastReadSeq: 107, loadedUpToSeq: 109 };

describe('buildTimeline', () => {
  it('pone un separador cada vez que cambia el día', () => {
    const items = buildTimeline([message(105, '2026-11-17'), message(106, '2026-11-18'), message(107, '2026-11-18')], [], marks);
    expect(items.map((item) => item.kind)).toEqual(['day', 'message', 'day', 'message', 'message']);
  });

  it('marca dónde empieza lo que no leí y cuenta cuántos son', () => {
    const items = buildTimeline([message(107, '2026-11-18'), message(108, '2026-11-18'), message(109, '2026-11-18')], [], marks);
    const unreadIndex = items.findIndex((item) => item.kind === 'unread');

    expect(items[unreadIndex]).toMatchObject({ kind: 'unread', count: 2 });
    expect(items[unreadIndex + 1]).toMatchObject({ kind: 'message', key: 'm_108' });
  });

  it('no cuenta como sin leer lo mío ni lo que llega con el grupo abierto', () => {
    const items = buildTimeline(
      [message(108, '2026-11-18'), message(109, '2026-11-18', 'u_01'), message(110, '2026-11-18')],
      [],
      marks,
    );
    expect(items.find((item) => item.kind === 'unread')).toMatchObject({ count: 1 });
  });

  it('lo mío que no salió va al final, en el orden en que lo escribí', () => {
    const outbox: Outgoing[] = [
      { localId: 'l_1', text: 'uno', replyTo: null, createdAt: '2026-11-18T07:10:00-03:00', status: 'failed' },
      { localId: 'l_2', text: 'dos', replyTo: null, createdAt: '2026-11-18T07:11:00-03:00', status: 'sending' },
    ];
    const items = buildTimeline([message(107, '2026-11-18')], outbox, marks);

    expect(items.slice(-2).map((item) => item.key)).toEqual(['local-l_1', 'local-l_2']);
  });

  it('dice si el renglón de arriba es del mismo remitente, y un separador corta la seguidilla', () => {
    const items = buildTimeline(
      [message(105, '2026-11-17', 'agent'), message(106, '2026-11-17', 'agent'), message(107, '2026-11-18', 'agent')],
      [],
      marks,
    );
    const follows = items.flatMap((item) => (item.kind === 'message' ? [item.followsSameSender] : []));

    expect(follows).toEqual([false, true, false]);
  });
});

describe('timelineOf', () => {
  const history = [message(105, '2026-11-18'), message(106, '2026-11-18')];
  const list = (messages: typeof history, outbox: Outgoing[] = NO_OUTBOX) => timelineOf(messages, outbox, 'u_01', 107, 109);
  const NO_OUTBOX: Outgoing[] = [];

  it('con lo mismo de antes devuelve la misma lista', () => {
    expect(list(history)).toBe(list(history));
  });

  it('un mensaje nuevo suma un renglón y deja los demás como estaban', () => {
    const before = list(history);
    const after = list([...history, message(110, '2026-11-18')]);

    expect(after).toHaveLength(before.length + 1);
    expect(after.slice(0, before.length)).toEqual(before);
    before.forEach((item, index) => expect(after[index]).toBe(item));
  });

  it('un mensaje que llega tarde entra en el medio sin cambiar a los que ya estaban', () => {
    const [first, last] = [message(105, '2026-11-18'), message(107, '2026-11-18', 'u_03')];
    const before = list([first, last]);
    const after = list([first, message(106, '2026-11-18', 'u_04'), last]);

    expect(after.find((item) => item.key === 'm_105')).toBe(before.find((item) => item.key === 'm_105'));
    expect(after.find((item) => item.key === 'm_107')).toBe(before.find((item) => item.key === 'm_107'));
  });

  it('cuando un pendiente cambia de estado, cambia solo ese renglón', () => {
    const sending: Outgoing = { localId: 'l_1', text: 'hola', replyTo: null, createdAt: '2026-11-18T07:10:00-03:00', status: 'sending' };
    const before = list(history, [sending]);
    const after = list(history, [{ ...sending, status: 'failed' }]);

    expect(after.at(-1)).not.toBe(before.at(-1));
    expect(after.slice(0, -1)).toEqual(before.slice(0, -1));
    expect(after[0]).toBe(before[0]);
  });
});

describe('timelineOf, cuando la lista crece', () => {
  // Cada test usa sus propios números de lectura para no heredar la memoria de otro.
  const grow = (messages: Message[], readUpTo: number) => timelineOf(messages, [], 'u_01', readUpTo, readUpTo);
  const full = (messages: Message[], readUpTo: number) => buildTimeline(messages, [], { me: 'u_01', lastReadSeq: readUpTo, loadedUpToSeq: readUpTo });

  it('sumando de a uno da lo mismo que armar todo de cero', () => {
    // Cambios de día, seguidillas del mismo remitente y remitentes alternados.
    const arrivals = [
      message(201, '2026-11-17', 'agent'),
      message(202, '2026-11-17', 'agent'),
      message(203, '2026-11-18', 'agent'),
      message(204, '2026-11-18', 'u_03'),
      message(205, '2026-11-18', 'u_03'),
      message(206, '2026-11-19', 'u_02'),
    ];
    let messages = [message(200, '2026-11-17', 'u_02')];
    grow(messages, 200);

    for (const arrival of arrivals) {
      messages = [...messages, arrival];
      expect(grow(messages, 200)).toEqual(full(messages, 200));
    }
  });

  it('al sumar al final, los renglones que ya estaban son los mismos objetos', () => {
    const first = [message(300, '2026-11-18'), message(301, '2026-11-18')];
    const before = grow(first, 301);
    const after = grow([...first, message(302, '2026-11-18'), message(303, '2026-11-19')], 301);

    before.forEach((item, index) => expect(after[index]).toBe(item));
    expect(after.slice(before.length).map((item) => item.kind)).toEqual(['message', 'day', 'message']);
  });

  it('si un mensaje entra en el medio, arma de nuevo y sigue dando lo mismo', () => {
    const first = [message(400, '2026-11-18', 'u_03'), message(402, '2026-11-18', 'u_03')];
    grow(first, 402);
    const withLate = [first[0], message(401, '2026-11-18', 'u_04'), first[1]];

    expect(grow(withLate, 402)).toEqual(full(withLate, 402));
  });
});

describe('initialIndexOf', () => {
  it('abre en lo primero sin leer o, si no hay, en el último renglón', () => {
    const withUnread = buildTimeline([message(107, '2026-11-18'), message(108, '2026-11-18')], [], marks);
    const allRead = buildTimeline([message(105, '2026-11-18'), message(106, '2026-11-18')], [], marks);

    expect(withUnread[initialIndexOf(withUnread)]).toMatchObject({ kind: 'unread' });
    expect(initialIndexOf(allRead)).toBe(allRead.length - 1);
  });
});
