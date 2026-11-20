import { View } from 'react-native';

import { AppText } from '@/ui/AppText';
import { estado, space } from '@/ui/theme';

type Props = {
  /** Ya escrito: "7 mensajes sin leer". */
  label: string;
};

// Marca dónde empieza lo que todavía no leí.
export function UnreadDivider({ label }: Props) {
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
