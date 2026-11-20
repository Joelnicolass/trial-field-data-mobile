import { useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import type { ChatState } from '@/domain/chat';

/** A cuántos puntos del final se considera que la lista está "abajo". */
const BOTTOM_THRESHOLD = 48;

/**
 * Cuenta los mensajes que llegaron mientras se leía más arriba.
 *
 * Si la lista está abajo, lo nuevo se ve al llegar y no hay nada que contar.
 * Si no, lo que llega se suma a `newCount` y la lista no se mueve: quien lee
 * decide cuándo bajar.
 */
export function useNewMessages(chat: ChatState | null) {
  const messages = chat?.messages ?? [];
  const lastSeq = messages[messages.length - 1]?.seq ?? 0;

  const [atBottom, setAtBottom] = useState(false);
  // El último mensaje que había cuando la lista estuvo abajo por última vez.
  // Hasta que eso pase, vale lo que había al abrir el grupo.
  const [seenAtBottomSeq, setSeenAtBottomSeq] = useState<number | null>(null);
  const seenSeq = seenAtBottomSeq ?? chat?.loadedUpToSeq ?? 0;

  function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const reachedBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - BOTTOM_THRESHOLD;

    setAtBottom(reachedBottom);
    if (reachedBottom) setSeenAtBottomSeq(lastSeq);
  }

  const newCount = atBottom ? 0 : messages.filter((message) => message.seq > seenSeq && message.sender_id !== chat?.me).length;

  return { atBottom, newCount, lastSeq, onScroll };
}
