import { Pressable, View } from 'react-native';

import { AppText } from '@/ui/AppText';
import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import { color, space } from '@/ui/theme';

import { DatoCard } from './DatoCard';
import { MetricCard } from './MetricCard';
import type { AgentContent, DatoModel, GroupRow, OpenTarget } from './model';
import { TableCard } from './TableCard';

type Props = {
  row: Extract<GroupRow, { kind: 'agent' }>;
  /** Abre en Campo lo que indica la tarjeta. */
  onOpen: (target: OpenTarget) => void;
  onComplete: (dato: DatoModel, values: Record<string, string>) => void;
  /** Empieza a responderle a este mensaje. */
  onReply: () => void;
};

// Lo que manda el agente. No es una persona y se tiene que notar de un
// vistazo: no lleva globo ni nombre de persona, ocupa todo el ancho y va
// siempre en una tarjeta.
export function AgentMessage({ row, onOpen, onComplete, onReply }: Props) {
  return (
    <View style={{ gap: space[4] }}>
      {row.showLabel ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[4] }}>
          <Icon name="cpu" size={14} tint={color.teal} />
          <AppText variant="caption" weight="600" style={{ color: color.teal, lineHeight: 16 }}>
            Agente
          </AppText>
          <AppText variant="caption" tone="secundario" tabular style={{ lineHeight: 16 }}>
            · {row.time}
          </AppText>
        </View>
      ) : null}
      {/* Mantener apretada la tarjeta la responde. */}
      <Pressable onLongPress={onReply}>
        <Content content={row.content} onOpen={onOpen} onComplete={onComplete} onReply={onReply} />
      </Pressable>
    </View>
  );
}

function Content({ content, onOpen, onComplete, onReply }: { content: AgentContent } & Pick<Props, 'onOpen' | 'onComplete' | 'onReply'>) {
  if (content.kind === 'dato') {
    const { dato } = content;
    const { opens } = dato;
    return (
      <DatoCard
        dato={dato}
        onOpen={opens ? () => onOpen(opens) : undefined}
        onComplete={(values) => onComplete(dato, values)}
      />
    );
  }

  if (content.kind === 'metric') {
    const { opens } = content.metric;
    // Esta tarjeta se toca entera, así que el toque largo se lo lleva ella.
    return <MetricCard metric={content.metric} onOpen={opens ? () => onOpen(opens) : undefined} onLongPress={onReply} />;
  }

  if (content.kind === 'table') return <TableCard table={content.table} />;

  // Una respuesta en palabras.
  return (
    <Card>
      <AppText tone="tinta">{content.text}</AppText>
    </Card>
  );
}
