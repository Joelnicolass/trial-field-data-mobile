import { memo } from 'react';

import { GroupRowView } from './GroupRowView';
import type { DatoModel, OpenTarget, ReplyTarget } from './model';
import type { TimelineItem } from './timeline';
import { useRowModel } from './useRowModel';

type Props = {
  item: TimelineItem;
  onOpen: (target: OpenTarget) => void;
  onRetry: (localId: string) => void;
  onComplete: (dato: DatoModel, values: Record<string, string>) => void;
  onReply: (target: ReplyTarget) => void;
};

// Un renglón de la lista. Arma su propio modelo con `useRowModel` y se lo
// pasa a `GroupRowView`, que solo dibuja.
//
// `memo`: cuando la lista se vuelve a dibujar, React saltea este renglón si
// recibe lo mismo que antes. Por eso lo que llega acá tiene que ser estable:
// el mismo `item` mientras el mensaje no cambie y las mismas funciones.
export const TimelineRow = memo(function TimelineRow({ item, onOpen, onRetry, onComplete, onReply }: Props) {
  const row = useRowModel(item);
  if (!row) return null;

  return <GroupRowView row={row} onOpen={onOpen} onRetry={onRetry} onComplete={onComplete} onReply={onReply} />;
});
