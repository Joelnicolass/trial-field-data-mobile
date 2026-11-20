import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { memo, useCallback, type RefObject } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import { space } from '@/ui/theme';

import { ActivityFooter } from './ActivityFooter';
import type { DatoModel, OpenTarget, ReplyTarget } from './model';
import { itemType, type TimelineItem } from './timeline';
import { TimelineRow } from './TimelineRow';

type Props = {
  listRef: RefObject<FlashListRef<TimelineItem> | null>;
  /** Qué renglones hay y en qué orden. Cada uno arma su propio modelo. */
  items: TimelineItem[];
  /** En qué renglón abrir. */
  initialIndex: number;
  /** La lista está al final: lo que llegue se tiene que ver. */
  atBottom: boolean;
  /** Hasta cuándo seguir al final porque acabo de mandar algo (ms). */
  followUntil: RefObject<number>;
  /** La lista terminó de armarse por primera vez. Dice si abrió al final. */
  onListReady: (openedAtEnd: boolean) => void;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onOpen: (target: OpenTarget) => void;
  onRetry: (localId: string) => void;
  onComplete: (dato: DatoModel, values: Record<string, string>) => void;
  onReply: (target: ReplyTarget) => void;
};

const keyOf = (item: TimelineItem) => item.key;

// La lista del grupo. Abre parada en lo primero sin leer y no se mueve sola
// mientras se lee más arriba.
//
// `memo`: escribir en el campo de texto vuelve a dibujar la pantalla, pero
// la lista recibe lo mismo y React la saltea entera.
export const MessageList = memo(function MessageList({
  listRef,
  items,
  initialIndex,
  atBottom,
  followUntil,
  onListReady,
  onScroll,
  onOpen,
  onRetry,
  onComplete,
  onReply,
}: Props) {
  /** Si la lista ya estaba al final, la deja al final. Si se leía más arriba, no la mueve. */
  function stayAtEnd(animated: boolean) {
    if (atBottom || Date.now() < followUntil.current) listRef.current?.scrollToEnd({ animated });
  }

  // La misma función mientras no cambien las que recibe: si fuera nueva en
  // cada dibujo, la lista volvería a dibujar todos los renglones.
  const renderItem = useCallback(
    ({ item }: { item: TimelineItem }) => <TimelineRow item={item} onOpen={onOpen} onRetry={onRetry} onComplete={onComplete} onReply={onReply} />,
    [onOpen, onRetry, onComplete, onReply],
  );

  return (
    <FlashList
      ref={listRef}
      data={items}
      // Recién cuando la lista terminó de armarse se empieza a mirar si está al final.
      onLoad={() => onListReady(initialIndex === items.length - 1)}
      keyExtractor={keyOf}
      getItemType={itemType}
      renderItem={renderItem}
      initialScrollIndex={initialIndex}
      // La lista nunca baja por su cuenta: mantiene a la vista lo que se
      // estaba leyendo aunque arriba o abajo cambie algo.
      maintainVisibleContentPosition={{ autoscrollToBottomThreshold: 0 }}
      // Solo si ya estaba al final sigue a lo que llega...
      onContentSizeChange={() => stayAtEnd(true)}
      // ...y lo mismo cuando la lista se achica: sale el teclado o aparece la cita.
      onLayout={() => stayAtEnd(false)}
      onScroll={onScroll}
      scrollEventThrottle={64}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingTop: space[16] }}
      ListFooterComponent={ActivityFooter}
    />
  );
});
