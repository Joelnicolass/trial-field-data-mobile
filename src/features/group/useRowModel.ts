import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useNow } from '@/hooks/useNow';
import { useChatStore } from '@/store/chatStore';

import { toRow } from './mappers';
import type { GroupRow } from './model';
import { rowSources } from './rowSources';
import type { TimelineItem } from './timeline';

/**
 * El modelo de un renglón, listo para dibujar.
 *
 *   servidor → datos (store) → mappers → pantalla
 *
 * Cada renglón de la lista usa este hook por su cuenta. Mira del store solo
 * lo que usa (`rowSources`) y vuelve a armar su modelo únicamente cuando
 * algo de eso cambia. Un mensaje nuevo, o alguien escribiendo, no lo toca.
 */
export function useRowModel(item: TimelineItem): GroupRow | null {
  const now = useNow();

  // `useShallow` compara pieza por pieza: si son las mismas de antes, devuelve
  // el objeto anterior y este renglón no se entera del cambio en el store.
  const sources = useChatStore(useShallow((state) => (state.chat ? rowSources(state.chat, item, now) : null)));

  return useMemo(() => (sources ? toRow(item, sources) : null), [item, sources]);
}
