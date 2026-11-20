import { useEffect, useMemo } from 'react';

import { useNow } from '@/hooks/useNow';
import { useChatStore, useDatos } from '@/store/chatStore';

import { toGroupScreen } from './mappers';
import { useNewMessages } from './useNewMessages';

/**
 * Lo que la pantalla del grupo necesita, ya listo para dibujar.
 *
 *   servidor → datos (store) → mappers → pantalla
 *
 * Este hook une las tres últimas partes: lee el estado, lo pasa por el mapper
 * y entrega el modelo. La pantalla no ve mensajes ni fechas crudas.
 */
export function useGroupScreen() {
  const status = useChatStore((state) => state.status);
  const chat = useChatStore((state) => state.chat);
  const start = useChatStore((state) => state.start);
  const markReadUpTo = useChatStore((state) => state.markReadUpTo);
  const sendText = useChatStore((state) => state.sendText);
  const retrySend = useChatStore((state) => state.retry);
  const datos = useDatos();
  const now = useNow();

  // Al abrir: pedir el grupo y conectarse.
  useEffect(() => {
    start();
  }, [start]);

  // Se calcula al dibujar: no se guarda en otro estado.
  const model = useMemo(() => (chat ? toGroupScreen(chat, datos, now) : null), [chat, datos, now]);

  const { atBottom, newCount, lastSeq, onScroll } = useNewMessages(chat);

  // Al llegar al final, todo quedó leído: se le avisa al servidor.
  useEffect(() => {
    if (atBottom) markReadUpTo(lastSeq);
  }, [atBottom, lastSeq, markReadUpTo]);

  return { status, model, retry: start, newCount, onScroll, sendText, retrySend };
}
