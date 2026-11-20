import type { Message } from '@/server/mock-server';

import { buildTimeline } from './timeline';

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
    const items = buildTimeline([message(105, '2026-11-17'), message(106, '2026-11-18'), message(107, '2026-11-18')], marks);
    expect(items.map((item) => item.kind)).toEqual(['day', 'message', 'day', 'message', 'message']);
  });

  it('marca dónde empieza lo que no leí y cuenta cuántos son', () => {
    const items = buildTimeline([message(107, '2026-11-18'), message(108, '2026-11-18'), message(109, '2026-11-18')], marks);
    const unreadIndex = items.findIndex((item) => item.kind === 'unread');

    expect(items[unreadIndex]).toMatchObject({ kind: 'unread', count: 2 });
    expect(items[unreadIndex + 1]).toMatchObject({ kind: 'message', key: 'm_108' });
  });

  it('no cuenta como sin leer lo mío ni lo que llega con el grupo abierto', () => {
    const items = buildTimeline(
      [message(108, '2026-11-18'), message(109, '2026-11-18', 'u_01'), message(110, '2026-11-18')],
      marks,
    );
    expect(items.find((item) => item.kind === 'unread')).toMatchObject({ count: 1 });
  });
});
