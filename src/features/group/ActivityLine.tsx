import { ActivityIndicator, View } from 'react-native';

import { AppText } from '@/ui/AppText';
import { color, estado, space } from '@/ui/theme';

type Props = {
  /** "Lucía y Mariano están escribiendo…" o "El agente está pensando…". */
  text: string;
  /** Cuando el agente tarda más de lo normal: va en el color de "demorado". */
  slow?: boolean;
};

// Lo que está pasando ahora, al final del chat: quién escribe y en qué está el agente.
export function ActivityLine({ text, slow = false }: Props) {
  const tint = slow ? estado.pendiente.texto : color.secundarioFuerte;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[8] }}>
      <ActivityIndicator size="small" color={tint} />
      <AppText variant="caption" weight="500" style={{ color: tint }}>
        {text}
      </AppText>
    </View>
  );
}
