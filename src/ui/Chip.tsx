import { Pressable } from 'react-native';

import { AppText } from './AppText';
import { color, radio, space } from './theme';

type Props = {
  label: string;
  selected?: boolean;
  onPress: () => void;
};

// Chip de filtro de la guía. El activo va en teal, con el fondo al 8 %.
export function Chip({ label, selected = false, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      // El chip mide 32 de alto: `hitSlop` lleva el área de toque a 44.
      hitSlop={{ top: 6, bottom: 6 }}
      style={{
        height: 32,
        paddingHorizontal: space[12],
        borderRadius: radio.chip,
        borderWidth: 1,
        borderColor: selected ? color.teal : color.chipBorde,
        backgroundColor: selected ? 'rgba(0, 119, 173, 0.08)' : color.superficie,
        justifyContent: 'center',
      }}
    >
      <AppText style={{ lineHeight: 20, color: selected ? color.teal : color.chipTexto }}>{label}</AppText>
    </Pressable>
  );
}
