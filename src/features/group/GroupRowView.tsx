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
};

// Un renglón de la lista del grupo. Acá solo se elige con qué pieza se
// dibuja cada tipo; qué dice cada una ya viene resuelto en `row`.
export function GroupRowView({ row, onOpen }: Props) {
  return <View style={{ paddingHorizontal: space[16], paddingBottom: space[12] }}>{renderRow(row, onOpen)}</View>;
}

function renderRow(row: GroupRow, onOpen: (target: OpenTarget) => void) {
  switch (row.kind) {
    case 'day':
      return <CenterLine text={row.label} />;
    case 'unread':
      return <UnreadDivider label={row.label} />;
    case 'line':
      return <CenterLine text={row.text} icon={row.isChange ? 'edit-3' : undefined} />;
    case 'person':
      return <PersonMessage row={row} />;
    case 'agent':
      return <AgentMessage row={row} onOpen={onOpen} />;
  }
}
