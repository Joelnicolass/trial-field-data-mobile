import { Pressable } from 'react-native';

import { AppText } from '@/ui/AppText';
import { Icon } from '@/ui/Icon';
import { color, space, toqueMinimo } from '@/ui/theme';

type Props = {
  count: number;
  /** Baja hasta lo nuevo. */
  onPress: () => void;
};

// Aviso flotante: llegaron mensajes mientras leía más arriba. No mueve la
// lista: avisa, y bajar lo decide quien lee.
export function NewMessagesPill({ count, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${count} mensajes nuevos. Ir al final.`}
      onPress={onPress}
      style={{
        height: toqueMinimo,
        paddingHorizontal: space[16],
        borderRadius: toqueMinimo / 2,
        backgroundColor: color.primarioOscuro,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space[8],
        boxShadow: '0 3px 8px rgba(18, 25, 38, 0.24)',
      }}
    >
      <Icon name="arrow-down" size={18} tint={color.superficie} />
      <AppText weight="600" tabular style={{ color: color.superficie }}>
        {count === 1 ? '1 nuevo' : `${count} nuevos`}
      </AppText>
    </Pressable>
  );
}
