import type { ComponentProps } from 'react';
import { Platform, TextInput, View, type TextStyle } from 'react-native';

import { AppText, fontFamily } from './AppText';
import { Icon, type IconName } from './Icon';
import { color, estado, radio, space, tipo, toqueMinimo } from './theme';

// Todo lo de un `TextInput` (incluido `ref`, para darle foco), más dos extras.
type Props = ComponentProps<typeof TextInput> & {
  icon?: IconName;
  /** Qué pasó y qué hacer, debajo del campo. */
  error?: string;
};

// En la web el navegador dibuja su propio recuadro de foco adentro del campo,
// y acá el borde ya lo pone el contenedor. `'none'` es un valor que solo
// existe en la web: por eso no está en los tipos de React Native.
const NO_FOCUS_RING = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : null;

// Campo de texto sobre el fondo hundido de la guía. Acepta todo lo que
// acepta un `TextInput`: teclado numérico, varias líneas, etc.
export function TextField({ icon, error, style, ref, ...rest }: Props) {
  return (
    <View style={{ gap: space[4] }}>
      <View
        style={{
          minHeight: toqueMinimo,
          flexDirection: 'row',
          alignItems: 'center',
          gap: space[8],
          paddingHorizontal: space[12],
          borderRadius: radio.input,
          borderWidth: 1,
          borderColor: error ? estado.error.texto : color.divisor,
          backgroundColor: color.inset,
        }}
      >
        {icon ? <Icon name={icon} size={18} tint={color.secundario} /> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={color.secundario}
          {...rest}
          style={[
            { flex: 1, paddingVertical: space[8], fontFamily: fontFamily('400'), fontSize: tipo.body1.fontSize, color: color.tinta },
            NO_FOCUS_RING,
            style,
          ]}
        />
      </View>
      {error ? (
        <AppText variant="caption" style={{ color: estado.error.texto }}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
