import { useCallback, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import { countNewerThan } from '@/domain/chat';
import type { Message } from '@/domain/types';
import { useChatStore } from '@/store/chatStore';

/** A cuántos puntos del final se considera que la lista está "abajo". */
const BOTTOM_THRESHOLD = 48;

const NO_MESSAGES: Message[] = [];

/**
 * Cuenta los mensajes que llegaron mientras se leía más arriba.
 *
 * Si la lista está abajo, lo nuevo se ve al llegar y no hay nada que contar.
 * Si no, lo que llega se suma a `newCount` y la lista no se mueve: quien lee
 * decide cuándo bajar.
 *
 * @param focused Si la pestaña del grupo está a la vista.
 */
export function useNewMessages(focused: boolean) {
  const messages = useChatStore((state) => state.chat?.messages ?? NO_MESSAGES);
  const me = useChatStore((state) => state.chat?.me);
  const loadedUpToSeq = useChatStore((state) => state.chat?.loadedUpToSeq ?? 0);
  const lastSeq = messages[messages.length - 1]?.seq ?? 0;

  const [atBottom, setAtBottom] = useState(false);
  // Mientras la lista se arma por primera vez, su tamaño cambia varias veces
  // y por un instante "parece" estar al final. Hasta que termina no se le cree.
  const [listReady, setListReady] = useState(false);
  // El último mensaje que había cuando la lista estuvo abajo por última vez.
  // Hasta que eso pase, vale lo que había al abrir el grupo.
  const [seenAtBottomSeq, setSeenAtBottomSeq] = useState<number | null>(null);
  const seenSeq = seenAtBottomSeq ?? loadedUpToSeq;

  // Las dos funciones van a la lista, que está memoizada: con `useCallback`
  // son las mismas mientras no cambie lo que usan, y la lista no se redibuja.

  /** La lista terminó de armarse. `openedAtEnd`: abrió al final porque no había nada sin leer. */
  const onListReady = useCallback(
    (openedAtEnd: boolean) => {
      setListReady(true);
      setAtBottom(openedAtEnd);
      if (openedAtEnd) setSeenAtBottomSeq(lastSeq);
    },
    [lastSeq],
  );

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      // Con otra pestaña a la vista la lista puede avisar medidas que no son
      // las reales: no se las toma en cuenta.
      if (!listReady || !focused) return;
      const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
      if (layoutMeasurement.height === 0) return;
      const reachedBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - BOTTOM_THRESHOLD;

      setAtBottom(reachedBottom);
      if (reachedBottom) setSeenAtBottomSeq(lastSeq);
    },
    [listReady, focused, lastSeq],
  );

  const newCount = atBottom || !me ? 0 : countNewerThan(messages, seenSeq, me);

  return { atBottom, newCount, lastSeq, onScroll, onListReady };
}
