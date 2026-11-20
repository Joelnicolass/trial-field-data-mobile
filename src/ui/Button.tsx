import { ActivityIndicator, Pressable } from 'react-native';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { color, radio, space } from './theme';

export type ButtonVariant = 'primary' | 'outlined' | 'neutral';

type Props = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  disabled?: boolean;
  /** Muestra un indicador en lugar del texto y no deja tocar. */
  loading?: boolean;
};

// Los tres botones de la guía. `pressed` es el color mientras se toca.
const LOOK: Record<ButtonVariant, { background: string; pressed: string; border: string; text: string }> = {
  primary: { background: color.primarioOscuro, pressed: color.primarioOscuroHover, border: 'transparent', text: color.superficie },
  outlined: { background: 'transparent', pressed: color.seleccionado, border: 'rgba(25, 118, 210, 0.5)', text: color.primario },
  neutral: { background: 'transparent', pressed: color.inset, border: color.divisor, text: color.secundario },
};

export function Button({ label, onPress, variant = 'primary', icon, disabled = false, loading = false }: Props) {
  const look = LOOK[variant];
  const blocked = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked, busy: loading }}
      disabled={blocked}
      onPress={onPress}
      style={({ pressed }) => ({
        height: 46,
        paddingHorizontal: space[20],
        borderRadius: radio.boton,
        borderWidth: 1,
        borderColor: look.border,
        backgroundColor: pressed ? look.pressed : look.background,
        opacity: disabled ? 0.5 : 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: space[8],
      })}
    >
      {loading ? (
        <ActivityIndicator color={look.text} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={18} tint={look.text} /> : null}
          <AppText weight="600" style={{ fontSize: 15, lineHeight: 20, color: look.text }}>
            {label}
          </AppText>
        </>
      )}
    </Pressable>
  );
}
