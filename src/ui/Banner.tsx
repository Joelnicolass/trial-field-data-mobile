import { View } from 'react-native';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { color, estado, space } from './theme';

type Props = {
  icon: IconName;
  /** Qué pasó. */
  title: string;
  /** Qué hacer, o qué va a pasar. */
  text: string;
};

// Una franja de aviso a todo el ancho, debajo de la barra superior. Queda
// fija mientras dure el problema. El rojo va solo en el ícono, nunca de
// fondo, como pide la guía.
export function Banner({ icon, title, text }: Props) {
  return (
    <View
      accessibilityRole="alert"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space[12],
        paddingHorizontal: space[16],
        paddingVertical: space[8],
        backgroundColor: color.superficie,
        borderBottomWidth: 1,
        borderBottomColor: color.divisor,
      }}
    >
      <Icon name={icon} size={18} tint={estado.error.texto} />
      <View style={{ flex: 1 }}>
        <AppText variant="caption" weight="600" tone="tinta">
          {title}
        </AppText>
        <AppText variant="caption" tone="secundario">
          {text}
        </AppText>
      </View>
    </View>
  );
}
