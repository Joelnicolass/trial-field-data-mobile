import type { ChatSnapshot, Dato, Message } from './types';

import {
  applyEvent,
  changeAgentMode,
  chatFromSnapshot,
  countNewerThan,
  currentDatos,
  dropActivity,
  dropExpiredTyping,
  endDatoSave,
  failDatoSave,
  failOutgoing,
  insertMessage,
  markVoiceNote,
  messageBySeq,
  queueOutgoing,
  receiveMessage,
  receiveOlder,
  seqIndex,
  startDatoSave,
  typingMembers,
  TYPING_MS,
} from './chat';

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

  it('descarta un repetido que no es el último', () => {
    const messages = [message(114), message(115), message(116)];
    expect(insertMessage(messages, message(114))).toBe(messages);
  });
});

describe('buscar en la lista ordenada', () => {
  // Con huecos en los números, como cuando un mensaje todavía no llegó.
  const messages = [message(10), message(20), message(30), message(40)];

  it('encuentra un mensaje por su número', () => {
    expect(messageBySeq(messages, 30)).toBe(messages[2]);
    expect(messageBySeq(messages, 10)).toBe(messages[0]);
    expect(messageBySeq(messages, 40)).toBe(messages[3]);
  });

  it('no inventa uno que no está', () => {
    expect(messageBySeq(messages, 25)).toBeUndefined();
    expect(messageBySeq(messages, 99)).toBeUndefined();
    expect(messageBySeq([], 1)).toBeUndefined();
  });

  it('dice dónde iría uno que falta', () => {
    expect(seqIndex(messages, 5)).toBe(0);
    expect(seqIndex(messages, 25)).toBe(2);
    expect(seqIndex(messages, 99)).toBe(4);
  });

  it('cuenta lo que llegó después de un número, sin lo mío', () => {
    const mixed = [message(10), message(20, { sender_id: 'u_01' }), message(30), message(40)];

    expect(countNewerThan(mixed, 10, 'u_01')).toBe(2);
    expect(countNewerThan(mixed, 40, 'u_01')).toBe(0);
    expect(countNewerThan(mixed, 0, 'u_01')).toBe(3);
  });
});

describe('al abrir', () => {
  it('ordena el historial y saca los repetidos, venga como venga', () => {
    const chat = chatFromSnapshot({ ...snapshot, messages: [message(114), message(112), message(113), message(112)] });
    expect(chat.messages.map((m) => m.seq)).toEqual([112, 113, 114]);
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

  it('al quedarse sin señal borra quién escribe y en qué anda el agente', () => {
    const busy = applyEvent(applyEvent(chat, { type: 'typing', member_id: 'u_04' }, 1000), { type: 'agent_status', status: 'thinking' }, 1000);
    const offline = dropActivity(busy);

    expect(typingMembers(offline)).toEqual([]);
    expect(offline.agentStatus).toBe('idle');
  });
});

describe('el modo del agente', () => {
  const chat = chatFromSnapshot(snapshot);

  it('arranca en el que dice el servidor', () => {
    expect(chat.agentMode).toBe('detect');
    expect(chatFromSnapshot({ ...snapshot, agent_mode: 'mention_only' }).agentMode).toBe('mention_only');
  });

  it('se cambia sin tocar nada más del grupo', () => {
    const changed = changeAgentMode(chat, 'mention_only');

    expect(changed).toEqual({ ...chat, agentMode: 'mention_only' });
    // El estado anterior no se toca.
    expect(chat.agentMode).toBe('detect');
  });

  it('elegir el modo en el que ya estaba devuelve el mismo estado', () => {
    expect(changeAgentMode(chat, 'detect')).toBe(chat);
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

describe('el dato como parte del estado', () => {
  const rain: Dato = {
    id: 'd_02',
    structure_name: 'rainfall',
    title: 'Lluvia',
    status: 'saved',
    version: 1,
    created_by: 'u_03',
    fields: [
      { key: 'rainfall_mm', label: 'Milímetros', value: 23, type: 'number', unit: 'mm' },
      { key: 'gauge', label: 'Pluviómetro', value: 'Casco', type: 'text' },
    ],
    missing_fields: [],
    suggestions: {},
    opens: null,
  };
  const other: Dato = { ...rain, id: 'd_05' };

  const change = (seq: number, version: number, key: string, after: string | number) =>
    message(seq, {
      sender_id: 'agent',
      type: 'dato_change',
      dato_change: { dato_id: 'd_02', action: 'edited', by: 'u_02', version, status: 'saved', changes: [{ key, before: null, after }] },
    });

  const base = chatFromSnapshot({
    ...snapshot,
    messages: [message(104, { sender_id: 'agent', type: 'dato', dato: rain }), message(105, { sender_id: 'agent', type: 'dato', dato: other })],
  });

  it('al abrir ya tiene cada dato', () => {
    expect(base.datos.d_02).toBe(rain);
    expect(base.datos.d_05).toBe(other);
  });

  it('un mensaje que no habla de ningún dato deja los datos como estaban', () => {
    expect(receiveMessage(base, message(120)).datos).toBe(base.datos);
  });

  it('un cambio actualiza su dato y no toca a los demás', () => {
    const changed = receiveMessage(base, change(120, 2, 'rainfall_mm', 25));

    expect(changed.datos.d_02).toMatchObject({ version: 2, fields: [{ value: 25 }, { value: 'Casco' }] });
    expect(changed.datos.d_05).toBe(base.datos.d_05);
  });

  it('el mismo cambio dos veces no cambia nada la segunda', () => {
    const once = receiveMessage(base, change(120, 2, 'rainfall_mm', 25));
    expect(receiveMessage(once, change(120, 2, 'rainfall_mm', 25))).toMatchObject({ datos: once.datos, messages: once.messages });
  });

  it('dos cambios que llegan al revés dan lo mismo que en orden', () => {
    const first = change(120, 2, 'rainfall_mm', 25);
    const second = change(121, 3, 'gauge', 'Loma');

    const inOrder = receiveMessage(receiveMessage(base, first), second);
    const reversed = receiveMessage(receiveMessage(base, second), first);

    expect(reversed.datos.d_02).toEqual(inOrder.datos.d_02);
    expect(reversed.datos.d_02).toMatchObject({ version: 3, fields: [{ value: 25 }, { value: 'Loma' }] });
  });

  it('un cambio que llega antes que su dato se aplica cuando el dato llega', () => {
    const empty = chatFromSnapshot({ ...snapshot, messages: [] });
    const early = receiveMessage(empty, change(120, 2, 'rainfall_mm', 25));
    expect(early.datos.d_02).toBeUndefined();

    const complete = receiveMessage(early, message(104, { sender_id: 'agent', type: 'dato', dato: rain }));
    expect(complete.datos.d_02).toMatchObject({ version: 2, fields: [{ value: 25 }, { value: 'Casco' }] });
  });

  it('da lo mismo que repasar todo el historial', () => {
    const events = [change(120, 2, 'rainfall_mm', 25), message(121), change(122, 3, 'gauge', 'Loma')];
    const state = events.reduce(receiveMessage, base);

    expect(state.datos).toEqual(currentDatos(state.messages));
  });
});

describe('el historial por tramos', () => {
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
  const corrected: Dato = { ...rain, version: 2, fields: [{ ...rain.fields[0], value: 25 }] };

  const datoMessage = message(104, { sender_id: 'agent', type: 'dato', dato: rain });
  const change = (seq: number, version: number, after: number) =>
    message(seq, {
      sender_id: 'agent',
      type: 'dato_change',
      dato_change: { dato_id: 'd_02', action: 'edited', by: 'u_02', version, status: 'saved', changes: [{ key: 'rainfall_mm', before: null, after }] },
    });

  // Al abrir llegó solo lo último: el mensaje que creó la lluvia quedó en una página anterior.
  const opened = chatFromSnapshot({ ...snapshot, messages: [message(113), message(114)], has_older: true, datos: [corrected] });

  it('al abrir conoce los datos aunque su mensaje no esté cargado', () => {
    expect(opened.hasOlder).toBe(true);
    expect(opened.messages.map((m) => m.seq)).toEqual([113, 114]);
    expect(opened.datos.d_02).toBe(corrected);
  });

  it('un cambio se aplica sobre el dato conocido si su mensaje original no está cargado', () => {
    const changed = receiveMessage(opened, change(120, 3, 30));
    expect(changed.datos.d_02).toMatchObject({ version: 3, fields: [{ value: 30 }] });
  });

  it('una página anterior entra arriba, en orden y sin repetidos', () => {
    const older = receiveOlder(opened, { messages: [message(111), message(112), message(113)], has_older: true });

    expect(older.messages.map((m) => m.seq)).toEqual([111, 112, 113, 114]);
    expect(older.hasOlder).toBe(true);
    // Los que ya estaban son los mismos objetos.
    expect(older.messages[3]).toBe(opened.messages[1]);
  });

  it('la última página avisa que no hay más', () => {
    expect(receiveOlder(opened, { messages: [message(112)], has_older: false }).hasOlder).toBe(false);
  });

  it('cargar el mensaje que creó un dato no cambia cómo está ahora', () => {
    const changed = receiveMessage(opened, change(120, 3, 30));
    // Llega la página con el dato original (23 mm) y su primera corrección (25 mm).
    const withBase = receiveOlder(changed, { messages: [datoMessage, change(110, 2, 25)], has_older: false });

    expect(withBase.datos.d_02).toMatchObject({ version: 3, fields: [{ value: 30 }] });
    expect(withBase.datos.d_02).toEqual(currentDatos(withBase.messages).d_02);
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

  it('recuerda que fue un audio aunque el servidor lo confirme como texto', () => {
    const voice = markVoiceNote(queueOutgoing(chat, outgoing), 'l_1', 3200);
    const confirmed = receiveMessage(voice, confirmation);

    expect(confirmed.outbox).toEqual([]);
    expect(confirmed.voiceNotes).toEqual({ l_1: 3200 });
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

describe('completar un dato', () => {
  const chat = chatFromSnapshot(snapshot);
  const save = { localId: 'l_9', values: { vaccine: 'Querato' } };

  it('queda "guardando" con lo que se eligió', () => {
    expect(startDatoSave(chat, 'd_03', save).datoSaves.d_03).toEqual({ ...save, status: 'saving', errorCode: null, errorField: null });
  });

  it('si falla, lo elegido no se pierde y se sabe por qué', () => {
    const failed = failDatoSave(startDatoSave(chat, 'd_03', save), 'd_03', 'invalid_value', 'vaccine');
    expect(failed.datoSaves.d_03).toMatchObject({ values: { vaccine: 'Querato' }, status: 'failed', errorCode: 'invalid_value', errorField: 'vaccine' });
  });

  it('al terminar, el intento se borra', () => {
    expect(endDatoSave(startDatoSave(chat, 'd_03', save), 'd_03').datoSaves).toEqual({});
  });
});
