import { View } from 'react-native';

import { space } from '@/ui/theme';

import { AgentMessage } from './AgentMessage';
import { CenterLine } from './CenterLine';
import type { GroupRow, OpenTarget } from './model';
import { PersonMessage } from './PersonMessage';
import { UnreadDivider } from './UnreadDivider';

type Props = {
  row: GroupRow;
  onOpen: (target: OpenTarget) => void;
  /** Vuelve a mandar un mensaje mío que falló. */
  onRetry: (localId: string) => void;
};

// Un renglón de la lista del grupo. Acá solo se elige con qué pieza se
// dibuja cada tipo; qué dice cada una ya viene resuelto en `row`.
export function GroupRowView({ row, onOpen, onRetry }: Props) {
  return <View style={{ paddingHorizontal: space[16], paddingBottom: space[12] }}>{renderRow(row, onOpen, onRetry)}</View>;
}

function renderRow(row: GroupRow, onOpen: Props['onOpen'], onRetry: Props['onRetry']) {
  switch (row.kind) {
    case 'day':
      return <CenterLine text={row.label} />;
    case 'unread':
      return <UnreadDivider label={row.label} />;
    case 'line':
      return <CenterLine text={row.text} icon={row.isChange ? 'edit-3' : undefined} />;
    case 'person':
      return <PersonMessage row={row} onRetry={row.localId ? () => onRetry(row.localId!) : undefined} />;
    case 'agent':
      return <AgentMessage row={row} onOpen={onOpen} />;
  }
}
