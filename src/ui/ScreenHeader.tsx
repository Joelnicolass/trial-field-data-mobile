import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from './AppText';
import { color, space } from './theme';

type Props = {
  title: string;
  /** En cuántas líneas se corta un título largo. */
  titleLines?: number;
  /** Segunda línea, más chica: por ejemplo quién está escribiendo. */
  subtitle?: string;
  /** Lo que va a la izquierda del título, por ejemplo el botón para volver. */
  left?: ReactNode;
  /** Lo que va a la derecha: uno o más botones. */
  right?: ReactNode;
};

// Barra superior de la guía: navy con texto claro. Suma el alto de la barra
// de estado del sistema para que el título no quede debajo.
export function ScreenHeader({ title, titleLines = 1, subtitle, left, right }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        backgroundColor: color.navy,
        paddingTop: insets.top + space[8],
        paddingBottom: space[8],
        paddingHorizontal: space[16],
        flexDirection: 'row',
        alignItems: 'center',
        gap: space[8],
      }}
    >
      {left}
      <View style={{ flex: 1 }}>
        <AppText variant="h4" tone="sobreNavy" numberOfLines={titleLines}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" tone="sobreNavy" numberOfLines={1} style={{ opacity: 0.8 }}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right}
    </View>
  );
}
