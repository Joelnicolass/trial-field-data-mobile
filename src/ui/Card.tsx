import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from './AppText';
import { color, radio, space } from './theme';

type Props = {
  children: ReactNode;
  title?: string;
  /** Si viene, toda la tarjeta se puede tocar. */
  onPress?: () => void;
  /** La marca con el borde en teal: es a la que se vino a mirar. */
  highlighted?: boolean;
  style?: StyleProp<ViewStyle>;
};

// Tarjeta de la guía: plana, con borde de 1 px y sin sombra.
const BASE: ViewStyle = {
  backgroundColor: color.superficie,
  borderWidth: 1,
  borderColor: color.divisor,
  borderRadius: radio.tarjeta,
  padding: space[20],
  gap: space[8],
};

// El borde resaltado es 1 px más ancho: se saca ese punto del relleno para
// que lo de adentro no cambie de tamaño.
const HIGHLIGHT: ViewStyle = { borderColor: color.teal, borderWidth: 2, padding: space[20] - 1 };

export function Card({ children, title, onPress, highlighted = false, style }: Props) {
  const content = (
    <>
      {title ? (
        <AppText variant="h4" tone="tinta">
          {title}
        </AppText>
      ) : null}
      {children}
    </>
  );

  if (!onPress) return <View style={[BASE, highlighted && HIGHLIGHT, style]}>{content}</View>;

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [BASE, highlighted && HIGHLIGHT, style, pressed && { backgroundColor: color.inset }]}>
      {content}
    </Pressable>
  );
}
