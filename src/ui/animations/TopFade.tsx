import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

type Props = {
  /** Si hay algo más arriba que no se está viendo. */
  visible: boolean;
  /** El color del fondo sobre el que va: el degradé arranca en ese color. */
  tint: string;
  /** El mismo color, transparente: donde termina el degradé. */
  clear: string;
};

const HEIGHT = 28;

// Un degradé pegado al borde de arriba de una lista. Avisa que hay más
// contenido hacia arriba: lo de abajo se va perdiendo en el fondo en vez de
// cortarse en seco. No se puede tocar: lo de abajo sigue respondiendo.
export function TopFade({ visible, tint, clear }: Props) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.set(withTiming(visible ? 1 : 0, { duration: 180 }));
  }, [visible, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: HEIGHT,
          pointerEvents: 'none',
          backgroundImage: `linear-gradient(to bottom, ${tint}, ${clear})`,
        },
        style,
      ]}
    />
  );
}
