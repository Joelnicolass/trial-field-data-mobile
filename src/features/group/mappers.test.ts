import { chatFromSnapshot, currentDatos, failDatoSave, startDatoSave } from '@/domain/chat';
import type { ChatSnapshot, Dato, Message } from '@/server/mock-server';

import { toGroupScreen } from './mappers';
import type { GroupRow } from './model';

const NOW = '2026-11-18T07:10:00-03:00';

function message(seq: number, overrides: Partial<Message> = {}): Message {
  return {
    seq,
    message_id: `m_${seq}`,
    sender_id: 'u_03',
    type: 'text',
    created_at: '2026-11-18T07:04:02-03:00',
    text: `mensaje ${seq}`,
    reply_to: null,
    mentions: [],
    ...overrides,
  };
}

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
    { key: 'date', label: 'Fecha', value: '2026-11-17', type: 'date' },
  ],
  missing_fields: [],
  suggestions: {},
  opens: { view: 'data', section: 'rainfall', filter: null },
};

const vaccination: Dato = {
  id: 'd_03',
  structure_name: 'vaccination',
  title: 'Vacunación',
  status: 'incomplete',
  version: 1,
  created_by: 'u_03',
  fields: [
    { key: 'animals', label: 'Animales', value: '8 vaquillonas', type: 'text' },
    { key: 'vaccine', label: 'Vacuna', value: null, type: 'text' },
  ],
  missing_fields: ['vaccine'],
  suggestions: { vaccine: ['Aftosa bivalente', 'Querato'] },
  opens: null,
};

/** Arma la pantalla a partir de una lista de mensajes, como lo hace la app. */
function screenFor(messages: Message[]) {
  const snapshot: ChatSnapshot = {
    id: 'g_01',
    name: 'La Aurora · Hacienda',
    agent_mode: 'detect',
    me: 'u_01',
    members: [
      { id: 'u_01', name: 'Héctor Etcheverry', short_name: 'Héctor', role: 'owner', is_agent: false, watermark: 0 },
      { id: 'u_03', name: 'Ramón Benítez', short_name: 'Ramón', role: 'worker', is_agent: false, watermark: 0 },
      { id: 'agent', name: 'Agente', short_name: 'agente', role: 'agent', is_agent: true, watermark: 0 },
    ],
    messages,
    unsent: [],
    cursor: 0,
  };
  const chat = chatFromSnapshot({ ...snapshot, members: snapshot.members.map((m) => (m.id === 'u_01' ? { ...m, watermark: 999 } : m)) });
  return toGroupScreen(chat, currentDatos(chat.messages), NOW);
}

function rowOf<Kind extends GroupRow['kind']>(rows: GroupRow[], kind: Kind) {
  return rows.find((row): row is Extract<GroupRow, { kind: Kind }> => row.kind === kind);
}

describe('toGroupScreen', () => {
  it('a los demás les pone nombre y rol; a lo mío, no', () => {
    const { rows } = screenFor([message(1), message(2, { sender_id: 'u_01' })]);
    const people = rows.filter((row) => row.kind === 'person');

    expect(people[0]).toMatchObject({ author: 'Ramón · peón', isMine: false, time: '07:04' });
    expect(people[1]).toMatchObject({ author: null, isMine: true });
  });

  it('marca la mención a mí y resume el mensaje citado', () => {
    const { rows } = screenFor([message(1, { text: 'llovieron 23' }), message(2, { reply_to: 1, mentions: ['u_01'] })]);
    const reply = rows.filter((row) => row.kind === 'person')[1];

    expect(reply).toMatchObject({ mentionsMe: true, quote: { author: 'Ramón', snippet: 'llovieron 23' } });
  });

  it('un dato guardado sale con su número grande y el resto en filas ya escritas', () => {
    const { rows } = screenFor([message(1, { sender_id: 'agent', type: 'dato', text: 'Anoté la lluvia.', dato: rain })]);
    const agent = rowOf(rows, 'agent');

    expect(agent?.content).toMatchObject({
      kind: 'dato',
      dato: {
        status: { label: 'Guardado', tag: 'activo' },
        intro: 'Anoté la lluvia.',
        headline: '23 mm',
        fields: [
          { label: 'Pluviómetro', value: 'Casco' },
          { label: 'Fecha', value: 'Ayer' },
        ],
        missing: [],
      },
    });
  });

  it('un dato incompleto pide lo que falta, con sus sugerencias', () => {
    const { rows } = screenFor([message(1, { sender_id: 'agent', type: 'dato', text: 'Me falta qué vacuna usaste.', dato: vaccination })]);
    const content = rowOf(rows, 'agent')?.content;

    expect(content).toMatchObject({
      kind: 'dato',
      dato: { incomplete: true, missing: [{ key: 'vaccine', label: 'Vacuna', suggestions: ['Aftosa bivalente', 'Querato'] }] },
    });
  });

  it('si corrigen el dato, la misma tarjeta muestra el valor nuevo y queda la línea del cambio', () => {
    const { rows } = screenFor([
      message(1, { sender_id: 'agent', type: 'dato', text: 'Anoté la lluvia.', dato: rain }),
      message(2, {
        sender_id: 'agent',
        type: 'dato_change',
        text: 'Mariano corrigió la lluvia: 23 → 25 mm',
        dato_change: { dato_id: 'd_02', action: 'edited', by: 'u_02', version: 2, status: 'saved', changes: [{ key: 'rainfall_mm', before: 23, after: 25 }] },
      }),
    ]);

    expect(rowOf(rows, 'agent')?.content).toMatchObject({ kind: 'dato', dato: { headline: '25 mm', version: 2, intro: null } });
    expect(rowOf(rows, 'line')).toMatchObject({ text: 'Mariano corrigió la lluvia: 23 → 25 mm', isChange: true });
  });

  it('mientras se guarda lo marca, y si falla dice qué pasó sin perder el estado', () => {
    const chat = chatFromSnapshot({
      id: 'g_01',
      name: 'Grupo',
      agent_mode: 'detect',
      me: 'u_01',
      members: [
        { id: 'u_01', name: 'Héctor Etcheverry', short_name: 'Héctor', role: 'owner', is_agent: false, watermark: 999 },
        { id: 'agent', name: 'Agente', short_name: 'agente', role: 'agent', is_agent: true, watermark: 0 },
      ],
      messages: [message(1, { sender_id: 'agent', type: 'dato', text: 'Me falta qué vacuna usaste.', dato: vaccination })],
      unsent: [],
      cursor: 0,
    });
    const save = { localId: 'l_9', values: { vaccine: 'x' } };
    const datoOf = (state: typeof chat) => {
      const content = rowOf(toGroupScreen(state, currentDatos(state.messages), NOW).rows, 'agent')?.content;
      return content?.kind === 'dato' ? content.dato : undefined;
    };

    expect(datoOf(startDatoSave(chat, 'd_03', save))).toMatchObject({ saving: true, error: null });
    expect(datoOf(failDatoSave(startDatoSave(chat, 'd_03', save), 'd_03', 'no_connection'))).toMatchObject({
      saving: false,
      error: 'No se pudo guardar. Revisá tu conexión y probá de nuevo.',
    });
    // Un valor rechazado se marca en su campo, no en la tarjeta entera.
    const rejected = datoOf(failDatoSave(startDatoSave(chat, 'd_03', save), 'd_03', 'invalid_value', 'vaccine'));
    expect(rejected).toMatchObject({ error: null, missing: [{ key: 'vaccine', error: 'Ese valor no sirve. Revisalo y probá de nuevo.' }] });
  });

  it('avisa cuando otro completó el dato antes', () => {
    const chat = chatFromSnapshot({ id: 'g', name: 'Grupo', agent_mode: 'detect', me: 'u_01', members: [], messages: [], unsent: [], cursor: 0 });
    expect(toGroupScreen(chat, {}, NOW, 'stale_version').notice).toBe('Alguien lo completó antes que vos. La tarjeta muestra cómo quedó.');
    expect(toGroupScreen(chat, {}, NOW).notice).toBeNull();
  });

  it('en una tabla, lo que falta sale como una raya', () => {
    const { rows } = screenFor([
      message(1, {
        sender_id: 'agent',
        type: 'table',
        table: {
          title: 'Peso promedio',
          columns: [
            { key: 'name', label: 'Categoría', type: 'text' },
            { key: 'kg', label: 'Peso', type: 'number', unit: 'kg' },
          ],
          rows: [
            { name: 'Vaca', kg: 446.1 },
            { name: 'Novillo', kg: null },
          ],
        },
      }),
    ]);

    expect(rowOf(rows, 'agent')?.content).toMatchObject({
      kind: 'table',
      table: { columns: [{ align: 'left' }, { align: 'right' }], rows: [['Vaca', '446,1 kg'], ['Novillo', '—']] },
    });
  });

  it('el rótulo del agente va solo en el primero de dos mensajes seguidos', () => {
    const { rows } = screenFor([message(1, { sender_id: 'agent' }), message(2, { sender_id: 'agent' })]);
    const agents = rows.filter((row) => row.kind === 'agent');

    expect(agents.map((row) => row.showLabel)).toEqual([true, false]);
  });
});
