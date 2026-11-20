import type { Dato, Message } from '@/server/mock-server';

import { datosOf, messagesBySeqOf } from './chatQueries';

const rain: Dato = {
  id: 'd_02',
  structure_name: 'rainfall',
  title: 'Lluvia',
  status: 'saved',
  version: 1,
  created_by: 'u_03',
  fields: [{ key: 'rainfall_mm', label: 'Milímetros', value: 23, type: 'number', unit: 'mm' }],
  missing_fields: [],
  suggestions: {},
  opens: null,
};

const vaccination: Dato = { ...rain, id: 'd_03', title: 'Vacunación', fields: [{ key: 'vaccine', label: 'Vacuna', value: 'Querato', type: 'text' }] };

function message(seq: number, overrides: Partial<Message> = {}): Message {
  return {
    seq,
    message_id: `m_${seq}`,
    sender_id: 'agent',
    type: 'text',
    created_at: '2026-11-18T07:00:00-03:00',
    text: null,
    reply_to: null,
    mentions: [],
    ...overrides,
  };
}

const rainChange = message(3, {
  type: 'dato_change',
  dato_change: {
    dato_id: 'd_02',
    action: 'edited',
    by: 'u_02',
    version: 2,
    status: 'saved',
    changes: [{ key: 'rainfall_mm', before: 23, after: 25 }],
  },
});

describe('datosOf', () => {
  const history = [message(1, { type: 'dato', dato: rain }), message(2, { type: 'dato', dato: vaccination })];

  it('con la misma lista de mensajes devuelve lo mismo, sin recalcular', () => {
    expect(datosOf(history)).toBe(datosOf(history));
  });

  it('un mensaje que no toca ningún dato deja todo como estaba', () => {
    const before = datosOf(history);
    expect(datosOf([...history, message(3)])).toBe(before);
  });

  it('un cambio en un dato no cambia a los demás', () => {
    const before = datosOf(history);
    const after = datosOf([...history, rainChange]);

    expect(after.d_02.fields[0].value).toBe(25);
    expect(after.d_03).toBe(before.d_03);
  });

  it('el dato que ya cambió sigue siendo el mismo objeto cuando llegan otros mensajes', () => {
    const changed = datosOf([...history, rainChange]);
    const later = datosOf([...history, rainChange, message(4)]);

    expect(later.d_02).toBe(changed.d_02);
  });
});

describe('messagesBySeqOf', () => {
  it('encuentra un mensaje por su número de orden', () => {
    const first = message(7);
    expect(messagesBySeqOf([first, message(8)]).get(7)).toBe(first);
  });
});
