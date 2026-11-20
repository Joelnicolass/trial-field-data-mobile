import { View } from 'react-native';

import { AppText } from './AppText';
import { estado, radio, space } from './theme';

export type TagStatus = keyof typeof estado;

type Props = {
  label: string;
  /** Un mismo estado lleva siempre el mismo color: se elige el estado, no el color. */
  status: TagStatus;
  /** Para filas apretadas: sin borde y más baja. */
  compact?: boolean;
};

// Etiqueta de estado de la guía: texto, fondo y borde salen del estado.
export function Tag({ label, status, compact = false }: Props) {
  const look = estado[status];
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        height: compact ? 20 : 24,
        paddingHorizontal: space[8],
        borderRadius: radio.etiqueta,
        borderWidth: compact ? 0 : 1,
        borderColor: look.borde,
        backgroundColor: look.fondo,
        justifyContent: 'center',
      }}
    >
      <AppText
        weight={compact ? '700' : '600'}
        style={{ fontSize: compact ? 11 : 13, lineHeight: compact ? 16 : 20, color: look.texto }}
      >
        {label}
      </AppText>
    </View>
  );
}
