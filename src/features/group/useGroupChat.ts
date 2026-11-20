import { useEffect, useMemo } from 'react';

import type { Member, Message } from '@/server/mock-server';
import { useChatStore, useDatos } from '@/store/chatStore';

import { buildTimeline } from './timeline';

/**
 * Todo lo que la pantalla del grupo necesita para dibujarse: el estado del
 * grupo, lo que hay que listar y cómo buscar un miembro o un mensaje.
 * Al montarse pide el grupo al servidor.
 */
export function useGroupChat() {
  const status = useChatStore((state) => state.status);
  const chat = useChatStore((state) => state.chat);
  const start = useChatStore((state) => state.start);
  const datos = useDatos();

  useEffect(() => {
    start();
  }, [start]);

  const timeline = useMemo(() => (chat ? buildTimeline(chat.messages, chat) : []), [chat]);

  // Para encontrar rápido quién mandó un mensaje y cuál es el mensaje citado.
  const membersById = useMemo(() => new Map<string, Member>(chat?.members.map((member) => [member.id, member])), [chat?.members]);
  const messagesBySeq = useMemo(() => new Map<number, Message>(chat?.messages.map((message) => [message.seq, message])), [chat?.messages]);

  return { status, chat, datos, timeline, membersById, messagesBySeq, retry: start };
}
