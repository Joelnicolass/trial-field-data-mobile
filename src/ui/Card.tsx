import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from './AppText';
import { color, radio, space } from './theme';

type Props = {
  children: ReactNode;
  title?: string;
  /** Si viene, toda la tarjeta se puede tocar. */
  onPress?: () => void;
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

export function Card({ children, title, onPress, style }: Props) {
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

  if (!onPress) return <View style={[BASE, style]}>{content}</View>;

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [BASE, style, pressed && { backgroundColor: color.inset }]}>
      {content}
    </Pressable>
  );
}
