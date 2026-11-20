import { changeAgentMode, chatFromSnapshot } from '@/domain/chat';
import type { ChatSnapshot, Member, Message } from '@/domain/types';

import { toGroupInfo } from './mappers';

const NOW = '2026-11-18T07:10:00-03:00';

/** Un mensaje mío, salvo que `overrides` diga otra cosa. */
function message(seq: number, overrides: Partial<Message> = {}): Message {
  return {
    seq,
    message_id: `m_${seq}`,
    sender_id: 'u_01',
    type: 'text',
    created_at: '2026-11-18T07:01:20-03:00',
    text: `mensaje ${seq}`,
    reply_to: null,
    mentions: [],
    ...overrides,
  };
}

// El agente va primero a propósito: la pantalla lo tiene que mandar al final.
const members: Member[] = [
  { id: 'agent', name: 'Agente', short_name: 'agente', role: 'agent', is_agent: true, watermark: 114 },
  { id: 'u_01', name: 'Héctor Etcheverry', short_name: 'Héctor', role: 'owner', is_agent: false, watermark: 114 },
  { id: 'u_02', name: 'Mariano Sosa', short_name: 'Mariano', role: 'manager', is_agent: false, watermark: 114 },
  { id: 'u_03', name: 'Ramón Benítez', short_name: 'Ramón', role: 'worker', is_agent: false, watermark: 111 },
  { id: 'u_04', name: 'Lucía Ferreyra', short_name: 'Lucía', role: 'vet', is_agent: false, watermark: 110 },
];

/** Arma el grupo a partir de una lista de mensajes, como lo hace la app. */
function chatFor(messages: Message[], overrides: Partial<ChatSnapshot> = {}) {
  return chatFromSnapshot({
    id: 'g_01',
    name: 'La Aurora · Hacienda',
    agent_mode: 'detect',
    me: 'u_01',
    members,
    messages,
    unsent: [],
    cursor: 0,
    ...overrides,
  });
}

describe('toGroupInfo: quiénes están', () => {
  it('lista a cada persona con su nombre completo y su rol, y me marca a mí', () => {
    const info = toGroupInfo(chatFor([]), NOW);

    expect(info.groupName).toBe('La Aurora · Hacienda');
    expect(info.membersTitle).toBe('5 integrantes');
    expect(info.members.slice(0, 4)).toEqual([
      { key: 'u_01', name: 'Héctor Etcheverry', detail: 'Dueño', isMe: true, isAgent: false },
      { key: 'u_02', name: 'Mariano Sosa', detail: 'Encargado', isMe: false, isAgent: false },
      { key: 'u_03', name: 'Ramón Benítez', detail: 'Peón', isMe: false, isAgent: false },
      { key: 'u_04', name: 'Lucía Ferreyra', detail: 'Veterinaria', isMe: false, isAgent: false },
    ]);
  });

  it('el agente va al final y dice qué hace, no un rol', () => {
    const { members: rows } = toGroupInfo(chatFor([]), NOW);

    expect(rows[rows.length - 1]).toEqual({ key: 'agent', name: 'Agente', detail: 'Anota datos y responde consultas', isMe: false, isAgent: true });
  });

  it('con uno solo lo dice en singular', () => {
    expect(toGroupInfo(chatFor([], { members: [members[1]] }), NOW).membersTitle).toBe('1 integrante');
  });
});

describe('toGroupInfo: el modo del agente', () => {
  it('marca el modo actual y explica qué hace el agente en ese modo', () => {
    const chat = chatFor([]);

    expect(toGroupInfo(chat, NOW).agentMode).toEqual({
      options: [
        { key: 'detect', label: 'Anota solo', active: true },
        { key: 'mention_only', label: 'Si lo mencionan', active: false },
      ],
      explanation: 'Anota un dato apenas alguien lo cuenta, aunque no lo mencionen.',
    });

    const changed = toGroupInfo(changeAgentMode(chat, 'mention_only'), NOW).agentMode;
    expect(changed.options.map((option) => option.active)).toEqual([false, true]);
    expect(changed.explanation).toBe('No anota por su cuenta: actúa solo cuando lo mencionan.');
  });
});

describe('toGroupInfo: quién vio mis mensajes', () => {
  it('a un mensaje lo vio quien leyó hasta ahí o más adelante', () => {
    // Mariano leyó hasta el 114, Ramón hasta el 111 y Lucía hasta el 110.
    const { myMessages } = toGroupInfo(chatFor([message(105), message(111), message(112), message(115)]), NOW);

    expect(myMessages.map((item) => [item.key, item.seen, item.seenBy])).toEqual([
      ['m_115', false, 'Todavía no lo vio nadie'],
      ['m_112', true, 'Lo vio Mariano'],
      ['m_111', true, 'Lo vieron Mariano y Ramón'],
      ['m_105', true, 'Lo vieron Mariano, Ramón y Lucía'],
    ]);
  });

  it('no me cuenta a mí ni al agente, aunque hayamos leído hasta ahí', () => {
    // Al 114 llegamos el agente, Mariano y yo.
    const { myMessages } = toGroupInfo(chatFor([message(114)]), NOW);

    expect(myMessages[0].seenBy).toBe('Lo vio Mariano');
  });

  it('lista solo lo que mandé yo: ni lo de los demás ni los avisos del grupo', () => {
    const { myMessages } = toGroupInfo(
      chatFor([
        message(101, { sender_id: 'u_03' }),
        message(102, { type: 'system', text: 'Héctor agregó a Lucía' }),
        message(103),
        message(104, { sender_id: 'agent', type: 'dato_change', text: 'Héctor completó la vacunación' }),
      ]),
      NOW,
    );

    expect(myMessages.map((item) => item.key)).toEqual(['m_103']);
  });

  it('muestra los últimos diez, del más nuevo al más viejo', () => {
    const twelve = Array.from({ length: 12 }, (_, index) => message(101 + index));
    const { myMessages } = toGroupInfo(chatFor(twelve), NOW);

    expect(myMessages).toHaveLength(10);
    expect(myMessages[0].key).toBe('m_112');
    expect(myMessages[9].key).toBe('m_103');
  });

  it('resume cada uno en una línea, sea texto, audio o foto', () => {
    const { myMessages } = toGroupInfo(
      chatFor([
        message(101, { text: '@agente cuantas vacas preñadas tengo?' }),
        message(102, { type: 'audio', text: null, duration_ms: 3000, transcript: 'llovieron 14 en el casco' }),
        message(103, { type: 'photo', text: null, photo: { width: 4000, height: 3000, color: '#7C8F5B', description: 'Una pastura' } }),
      ]),
      NOW,
    );

    expect(myMessages.map((item) => item.snippet)).toEqual(['Foto', 'llovieron 14 en el casco', '@agente cuantas vacas preñadas tengo?']);
  });

  it('pone la hora si es de hoy y el día si es de antes', () => {
    const { myMessages } = toGroupInfo(
      chatFor([
        message(101, { created_at: '2026-11-16T10:02:13-03:00' }),
        message(102, { created_at: '2026-11-17T19:20:02-03:00' }),
        message(103, { created_at: '2026-11-18T07:01:20-03:00' }),
      ]),
      NOW,
    );

    expect(myMessages.map((item) => item.when)).toEqual(['07:01', 'Ayer', '16/11']);
  });

  it('si no mandé ninguno, lo dice en lugar de la lista', () => {
    const empty = toGroupInfo(chatFor([message(101, { sender_id: 'u_02' })]), NOW);
    expect(empty.myMessages).toEqual([]);
    expect(empty.noMessagesText).toBe('Todavía no mandaste ningún mensaje. Cuando mandes uno, acá vas a ver quién lo vio.');

    expect(toGroupInfo(chatFor([message(101)]), NOW).noMessagesText).toBeNull();
  });
});
