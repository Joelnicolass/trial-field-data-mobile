import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useMemo } from 'react';

import { useChatStore } from '@/store/chatStore';

import { toMentionOptions, toNotice, toOfflineNotice } from './mappers';
import type { DatoModel, MentionOption } from './model';
import { initialIndexOf, timelineOf, type TimelineItem } from './timeline';
import { useNewMessages } from './useNewMessages';

const NO_ITEMS: TimelineItem[] = [];
const NO_MENTIONS: MentionOption[] = [];

/** Pide el grupo al abrir y dice cómo va la carga. */
export function useGroupStart() {
  const status = useChatStore((state) => state.status);
  const start = useChatStore((state) => state.start);

  // Al abrir: pedir el grupo y conectarse.
  useEffect(() => {
    start();
  }, [start]);

  return { status, retry: start };
}

/**
 * Lo que la lista y el campo de texto del grupo necesitan.
 *
 *   servidor → datos (store) → mappers → pantalla
 *
 * Cada parte de la pantalla mira del store solo lo que usa:
 * - acá, qué renglones hay y en qué orden (`timelineOf`), más los avisos;
 * - cada renglón, su propio modelo (`useRowModel`);
 * - la barra y el pie, quién escribe (`GroupHeader`, `ActivityFooter`).
 *
 * Por eso este hook no se entera cuando alguien escribe, y un mensaje nuevo
 * suma un renglón sin rearmar los demás.
 */
export function useGroupChat() {
  // `timelineOf` recuerda la lista anterior: devuelve la misma mientras no
  // entre ni salga un renglón, y conserva los elementos que no cambiaron.
  const items = useChatStore((state) =>
    state.chat ? timelineOf(state.chat.messages, state.chat.outbox, state.chat.me, state.chat.lastReadSeq, state.chat.loadedUpToSeq) : NO_ITEMS,
  );
  const members = useChatStore((state) => state.chat?.members);
  const me = useChatStore((state) => state.chat?.me);
  const noticeCode = useChatStore((state) => state.noticeCode);
  const online = useChatStore((state) => state.online);

  const markReadUpTo = useChatStore((state) => state.markReadUpTo);
  const sendText = useChatStore((state) => state.sendText);
  const sendVoice = useChatStore((state) => state.sendVoice);
  const retrySend = useChatStore((state) => state.retry);
  const completeDato = useChatStore((state) => state.completeDato);
  const dismissNotice = useChatStore((state) => state.dismissNotice);

  // Se calculan al dibujar: no se guardan en otro estado.
  const initialIndex = useMemo(() => initialIndexOf(items), [items]);
  const mentionOptions = useMemo(() => (members && me ? toMentionOptions(members, me) : NO_MENTIONS), [members, me]);
  const offlineNotice = useMemo(() => toOfflineNotice(online), [online]);
  const notice = toNotice(noticeCode);

  // Si la pestaña del grupo está a la vista.
  const focused = useIsFocused();
  const { atBottom, newCount, lastSeq, onScroll, onListReady } = useNewMessages(focused);

  // Al llegar al final, todo quedó leído: se le avisa al servidor.
  useEffect(() => {
    if (atBottom) markReadUpTo(lastSeq);
  }, [atBottom, lastSeq, markReadUpTo]);

  /** Completa lo que le falta a un dato. Manda la versión que se estaba viendo. */
  const complete = useCallback(
    (dato: DatoModel, values: Record<string, string>) => {
      completeDato(dato.datoId, dato.version, values);
    },
    [completeDato],
  );

  return {
    items,
    initialIndex,
    mentionOptions,
    notice,
    offlineNotice,
    newCount,
    atBottom: atBottom && focused,
    onScroll,
    onListReady,
    sendText,
    sendVoice,
    retrySend,
    completeDato: complete,
    dismissNotice,
  };
}
