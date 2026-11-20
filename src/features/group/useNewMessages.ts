import { useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import type { MemberId, Message } from '@/server/mock-server';

/** A cuántos puntos del final se considera que la lista está "abajo". */
const BOTTOM_THRESHOLD = 48;

/**
 * Cuenta los mensajes que llegaron mientras se leía más arriba.
 *
 * Si la lista está abajo, lo nuevo se ve al llegar y no hay nada que contar.
 * Si no, lo que llega se suma a `newCount` y la lista no se mueve: quien lee
 * decide cuándo bajar.
 */
export function useNewMessages(messages: Message[], me: MemberId) {
  const lastSeq = messages[messages.length - 1]?.seq ?? 0;
  const [atBottom, setAtBottom] = useState(false);
  // El último mensaje que estaba cuando la lista estuvo abajo por última vez.
  const [seenSeq, setSeenSeq] = useState(lastSeq);

  function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const reachedBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - BOTTOM_THRESHOLD;

    setAtBottom(reachedBottom);
    if (reachedBottom) setSeenSeq(lastSeq);
  }

  const newCount = atBottom ? 0 : messages.filter((message) => message.seq > seenSeq && message.sender_id !== me).length;

  return { atBottom, newCount, lastSeq, onScroll };
}
