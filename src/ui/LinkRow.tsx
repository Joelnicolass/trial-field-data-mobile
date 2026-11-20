import { Pressable, View } from 'react-native';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { color, space, toqueMinimo } from './theme';

type Props = {
  icon: IconName;
  label: string;
  /** Adónde lleva, en una línea. */
  description?: string;
  onPress: () => void;
};

// Una fila que lleva a otra pantalla: ícono, texto y la flecha.
export function LinkRow({ icon, label, description, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({ minHeight: toqueMinimo, flexDirection: 'row', alignItems: 'center', gap: space[12], opacity: pressed ? 0.6 : 1 })}
    >
      <Icon name={icon} size={20} tint={color.secundario} />
      <View style={{ flex: 1, gap: space[4] }}>
        <AppText weight="600" tone="tinta">
          {label}
        </AppText>
        {description ? (
          <AppText variant="caption" tone="secundario">
            {description}
          </AppText>
        ) : null}
      </View>
      <Icon name="chevron-right" size={18} tint={color.secundario} />
    </Pressable>
  );
}
