import { memo } from 'react';
import Animated from 'react-native-reanimated';

import { useEntrance } from '@/ui/animations/useEntrance';

import { entranceOf, isArriving } from './arrivals';
import { GroupRowView } from './GroupRowView';
import type { DatoModel, GroupRow, OpenTarget, ReplyTarget } from './model';
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

  return <ArrivingRow item={item} row={row} onOpen={onOpen} onRetry={onRetry} onComplete={onComplete} onReply={onReply} />;
});

// El renglón, con su entrada: si acaba de llegar, aparece animado según qué
// es. Lo que ya estaba al abrir, o entra al desplazar, queda quieto.
function ArrivingRow({ item, row, onOpen, onRetry, onComplete, onReply }: Props & { row: GroupRow }) {
  const entrance = useEntrance(item.key, isArriving(item), entranceOf(row));

  return (
    // Crece desde la esquina de donde sale: lo mío, desde la derecha.
    <Animated.View style={[{ transformOrigin: row.kind === 'person' && row.isMine ? 'right bottom' : 'left bottom' }, entrance]}>
      <GroupRowView row={row} onOpen={onOpen} onRetry={onRetry} onComplete={onComplete} onReply={onReply} />
    </Animated.View>
  );
}
