import type { ChatSnapshot, Dato, Message } from '@/server/mock-server';

import { applyEvent, chatFromSnapshot, currentDatos, dropExpiredTyping, failOutgoing, insertMessage, queueOutgoing, receiveMessage, typingMembers, TYPING_MS } from './chat';

function message(seq: number, overrides: Partial<Message> = {}): Message {
  return {
    seq,
    message_id: `m_${seq}`,
    sender_id: 'u_02',
    type: 'text',
    created_at: '2026-11-18T07:00:00-03:00',
    text: `mensaje ${seq}`,
    reply_to: null,
    mentions: [],
    ...overrides,
  };
}

const snapshot: ChatSnapshot = {
  id: 'g_01',
  name: 'La Aurora · Hacienda',
  agent_mode: 'detect',
  me: 'u_01',
  members: [
    { id: 'u_01', name: 'Héctor Etcheverry', short_name: 'Héctor', role: 'owner', is_agent: false, watermark: 107 },
    { id: 'u_02', name: 'Mariano Sosa', short_name: 'Mariano', role: 'manager', is_agent: false, watermark: 114 },
    { id: 'u_04', name: 'Lucía Ferreyra', short_name: 'Lucía', role: 'vet', is_agent: false, watermark: 110 },
  ],
  messages: [message(113), message(114)],
  unsent: [],
  cursor: 0,
};

describe('insertMessage', () => {
  it('pone en su lugar un mensaje que llega tarde', () => {
    // El servidor entrega primero el 116 y después el 115.
    const afterFirst = insertMessage([message(114)], message(116));
    const afterLate = insertMessage(afterFirst, message(115));

    expect(afterLate.map((m) => m.seq)).toEqual([114, 115, 116]);
  });

  it('descarta un mensaje repetido', () => {
    const messages = [message(114), message(115)];
    expect(insertMessage(messages, message(115))).toBe(messages);
  });
});

describe('applyEvent', () => {
  const chat = chatFromSnapshot(snapshot);

  it('toma de mi watermark hasta dónde había leído', () => {
    expect(chat.lastReadSeq).toBe(107);
  });

  it('da lo mismo recibir un mensaje una vez o dos', () => {
    const event = { type: 'message', cursor: 1, message: message(115) } as const;
    const once = applyEvent(chat, event, 0);
    const twice = applyEvent(once, { ...event, cursor: 2 }, 0);

    expect(twice.messages).toEqual(once.messages);
    expect(twice.cursor).toBe(2);
  });

  it('marca a alguien escribiendo y lo apaga cuando manda un mensaje', () => {
    const typing = applyEvent(chat, { type: 'typing', member_id: 'u_04' }, 1000);
    expect(typingMembers(typing).map((m) => m.short_name)).toEqual(['Lucía']);

    const sent = applyEvent(typing, { type: 'message', cursor: 1, message: message(115, { sender_id: 'u_04' }) }, 2000);
    expect(typingMembers(sent)).toEqual([]);
  });

  it('apaga solo a los 6 segundos a quien escribe y nunca manda', () => {
    const typing = applyEvent(chat, { type: 'typing', member_id: 'u_02' }, 1000);

    expect(typingMembers(dropExpiredTyping(typing, 1000 + TYPING_MS - 1))).toHaveLength(1);
    expect(typingMembers(dropExpiredTyping(typing, 1000 + TYPING_MS))).toHaveLength(0);
  });

  it('guarda en qué está el agente', () => {
    expect(applyEvent(chat, { type: 'agent_status', status: 'slow' }, 0).agentStatus).toBe('slow');
  });
});

describe('currentDatos', () => {
  const rain: Dato = {
    id: 'd_02',
    structure_name: 'rainfall',
    title: 'Lluvia',
    status: 'saved',
    version: 1,
    created_by: 'u_03',
    fields: [
      { key: 'rainfall_mm', label: 'Milímetros', value: 23, type: 'number', unit: 'mm' },
      { key: 'date', label: 'Fecha', value: '2026-11-17', type: 'date' },
    ],
    missing_fields: [],
    suggestions: {},
    opens: null,
  };
  const datoMessage = message(104, { sender_id: 'agent', type: 'dato', dato: rain });
  const correction = message(116, {
    sender_id: 'agent',
    type: 'dato_change',
    dato_change: { dato_id: 'd_02', action: 'edited', by: 'u_02', version: 2, status: 'saved', changes: [{ key: 'rainfall_mm', before: 23, after: 25 }] },
  });

  it('aplica la corrección sobre el dato original', () => {
    const datos = currentDatos([datoMessage, correction]);

    expect(datos.d_02.version).toBe(2);
    expect(datos.d_02.fields[0].value).toBe(25);
    // El mensaje original no se toca: sigue diciendo 23.
    expect(rain.fields[0].value).toBe(23);
  });

  it('completa un dato al que le faltaba un campo', () => {
    const incomplete: Dato = {
      ...rain,
      id: 'd_03',
      status: 'incomplete',
      fields: [{ key: 'vaccine', label: 'Vacuna', value: null, type: 'text' }],
      missing_fields: ['vaccine'],
    };
    const completion = message(117, {
      sender_id: 'agent',
      type: 'dato_change',
      dato_change: { dato_id: 'd_03', action: 'completed', by: 'u_04', version: 2, status: 'saved', changes: [{ key: 'vaccine', before: null, after: 'Reproductiva' }] },
    });

    const datos = currentDatos([message(109, { sender_id: 'agent', type: 'dato', dato: incomplete }), completion]);

    expect(datos.d_03.status).toBe('saved');
    expect(datos.d_03.missing_fields).toEqual([]);
  });

  it('ignora un cambio de una versión que ya tiene', () => {
    const repeated = { ...correction, seq: 118, message_id: 'm_118' };
    const datos = currentDatos([datoMessage, correction, repeated]);

    expect(datos.d_02.version).toBe(2);
  });
});

describe('lo que mando yo', () => {
  const chat = chatFromSnapshot(snapshot);
  const outgoing = { localId: 'l_1', text: 'hola', replyTo: null, createdAt: '2026-11-18T07:10:00-03:00' };
  const confirmation = message(115, { sender_id: 'u_01', local_id: 'l_1', text: 'hola' });

  it('aparece al instante como "enviándose"', () => {
    expect(queueOutgoing(chat, outgoing).outbox).toEqual([{ ...outgoing, status: 'sending' }]);
  });

  it('si falla, queda en la lista para reintentar', () => {
    const failed = failOutgoing(queueOutgoing(chat, outgoing), 'l_1');
    expect(failed.outbox[0].status).toBe('failed');
  });

  it('reintentar lo vuelve a "enviándose" sin duplicarlo', () => {
    const retried = queueOutgoing(failOutgoing(queueOutgoing(chat, outgoing), 'l_1'), outgoing);
    expect(retried.outbox).toEqual([{ ...outgoing, status: 'sending' }]);
  });

  it('la confirmación saca al pendiente, llegue una vez o dos', () => {
    const sending = queueOutgoing(chat, outgoing);
    // Llega primero como respuesta al envío y después como evento.
    const byPromise = receiveMessage(sending, confirmation);
    const byEvent = applyEvent(byPromise, { type: 'message', cursor: 3, message: confirmation }, 0);

    expect(byEvent.outbox).toEqual([]);
    expect(byEvent.messages.filter((m) => m.message_id === 'm_115')).toHaveLength(1);
  });

  it('lo que quedó sin enviar de antes arranca como fallido', () => {
    const withUnsent = chatFromSnapshot(
      { ...snapshot, unsent: [{ local_id: 'l_viejo', sender_id: 'u_01', type: 'text', text: 'pendiente', mentions: [], created_at: '2026-11-18T07:02:06-03:00' }] },
      [{ ...outgoing, status: 'sending' }, { ...outgoing, localId: 'l_viejo', status: 'sending' }],
    );

    // El que viene del servidor y el guardado en la app, sin repetir el que está en los dos.
    expect(withUnsent.outbox.map((item) => [item.localId, item.status])).toEqual([
      ['l_viejo', 'failed'],
      ['l_1', 'failed'],
    ]);
  });
});
