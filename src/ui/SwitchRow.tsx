import { Pressable, Switch, View } from 'react-native';

import { AppText } from './AppText';
import { color, space, toqueMinimo } from './theme';

type Props = {
  label: string;
  /** Qué cambia al prenderlo. */
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

// Una opción que se prende o se apaga. Se puede tocar toda la fila, no solo
// el interruptor.
export function SwitchRow({ label, description, value, onValueChange }: Props) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      onPress={() => onValueChange(!value)}
      style={{ minHeight: toqueMinimo, flexDirection: 'row', alignItems: 'center', gap: space[12] }}
    >
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
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: color.divisor, true: color.primario }}
        thumbColor={color.superficie}
      />
    </Pressable>
  );
}
