import { View } from 'react-native';

import { AppText } from './AppText';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { color, estado, radio, space } from './theme';

type Props = {
  message: string;
  onClose: () => void;
};

// Aviso de error de la guía: fondo blanco y el rojo solo en el ícono.
// Solo dibuja. Cuánto dura lo decide quien lo muestra, con `useAutoDismiss`.
export function ErrorNotice({ message, onClose }: Props) {
  return (
    <View
      accessibilityRole="alert"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space[8],
        paddingLeft: space[16],
        borderRadius: radio.tarjeta,
        borderWidth: 1,
        borderColor: color.divisor,
        backgroundColor: color.superficie,
        boxShadow: '0 8px 16px rgba(18, 25, 38, 0.24)',
      }}
    >
      <Icon name="x-circle" tint={estado.error.texto} />
      <AppText style={{ flex: 1 }}>{message}</AppText>
      <IconButton icon="x" accessibilityLabel="Cerrar aviso" tint={color.secundario} onPress={onClose} />
    </View>
  );
}
