import { View } from 'react-native';

import { formatTime } from '@/domain/format';
import type { Dato, Message, Opens } from '@/server/mock-server';
import { AppText } from '@/ui/AppText';
import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import { color, space } from '@/ui/theme';

import { DatoCard } from './DatoCard';
import { MetricCard } from './MetricCard';
import { TableCard } from './TableCard';

type Props = {
  message: Message;
  /** El dato de este mensaje como está ahora, con las correcciones posteriores. */
  dato?: Dato;
  /** Cuando el agente manda dos seguidos, el rótulo va solo en el primero. */
  showLabel?: boolean;
  onOpen?: (opens: Opens) => void;
  onComplete?: (datoId: string, values: Record<string, string>) => void;
};

// Lo que manda el agente. No es una persona y se tiene que notar de un
// vistazo: no lleva globo ni nombre de persona, ocupa todo el ancho y va
// siempre en una tarjeta.
export function AgentMessage({ message, dato, showLabel = true, onOpen, onComplete }: Props) {
  return (
    <View style={{ gap: space[4] }}>
      {showLabel ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[4] }}>
          <Icon name="cpu" size={14} tint={color.teal} />
          <AppText variant="caption" weight="600" style={{ color: color.teal, lineHeight: 16 }}>
            Agente
          </AppText>
          <AppText variant="caption" tone="secundario" tabular style={{ lineHeight: 16 }}>
            · {formatTime(message.created_at)}
          </AppText>
        </View>
      ) : null}
      <Content message={message} dato={dato} onOpen={onOpen} onComplete={onComplete} />
    </View>
  );
}

function Content({ message, dato, onOpen, onComplete }: Omit<Props, 'showLabel'>) {
  if (message.type === 'dato' && dato) {
    const { opens } = dato;
    return (
      <DatoCard
        dato={dato}
        intro={message.text}
        onOpen={opens && onOpen ? () => onOpen(opens) : undefined}
        onComplete={onComplete ? (values) => onComplete(dato.id, values) : undefined}
      />
    );
  }

  if (message.type === 'card' && message.card) {
    const { opens } = message.card;
    return <MetricCard metric={message.card} onOpen={opens && onOpen ? () => onOpen(opens) : undefined} />;
  }

  if (message.type === 'table' && message.table) {
    return <TableCard table={message.table} />;
  }

  // Una respuesta en palabras.
  return (
    <Card>
      <AppText tone="tinta">{message.text}</AppText>
    </Card>
  );
}
