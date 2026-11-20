import { View } from 'react-native';

import { AppText } from '@/ui/AppText';
import { estado, space } from '@/ui/theme';

type Props = {
  count: number;
};

// Marca dónde empieza lo que todavía no leí.
export function UnreadDivider({ count }: Props) {
  const label = count === 1 ? '1 mensaje sin leer' : `${count} mensajes sin leer`;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[8] }}>
      <Line />
      <AppText variant="caption" weight="600" style={{ color: estado.info.texto }}>
        {label}
      </AppText>
      <Line />
    </View>
  );
}

function Line() {
  return <View style={{ flex: 1, height: 1, backgroundColor: estado.info.borde, opacity: 0.4 }} />;
}
