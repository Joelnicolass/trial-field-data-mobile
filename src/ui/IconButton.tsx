import { Pressable } from 'react-native';

import { Icon, type IconName } from './Icon';
import { color, toqueMinimo } from './theme';

type Props = {
  icon: IconName;
  onPress: () => void;
  /** Lo que lee el lector de pantalla: un ícono solo no dice nada. */
  accessibilityLabel: string;
  tint?: string;
  disabled?: boolean;
};

// Un ícono que se toca. Aunque el dibujo sea chico, el área mide 44 × 44:
// en el campo se toca con el pulgar y a veces con guantes.
export function IconButton({ icon, onPress, accessibilityLabel, tint = color.cuerpo, disabled = false }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        width: toqueMinimo,
        height: toqueMinimo,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.4 : pressed ? 0.6 : 1,
      })}
    >
      <Icon name={icon} size={22} tint={tint} />
    </Pressable>
  );
}
