import { useEffect } from 'react';
import { useAnimatedStyle, useSharedValue, withSpring, withTiming, type WithSpringConfig } from 'react-native-reanimated';

/** Cómo entra algo: desde dónde, con qué tamaño y con qué resorte. */
export type Entrance = {
  /** Cuánto más a la derecha arranca, en puntos. Negativo: desde la izquierda. */
  fromX: number;
  /** Cuánto más abajo arranca. */
  fromY: number;
  /** De qué tamaño arranca: 1 es el suyo, 0.9 un poco más chico. */
  fromScale: number;
  /** El resorte con el que se asienta. Más masa y más freno: más pesado, menos rebote. */
  spring: WithSpringConfig;
  /** Cuánto tarda en hacerse visible. */
  fadeMs: number;
};

/**
 * La entrada de algo que acaba de aparecer: llega desde un costado, un poco
 * más chico, y se asienta con un rebote corto.
 *
 * De los doce principios: llega por un arco (se mueve en los dos ejes), se
 * estira al crecer y se pasa apenas de su lugar antes de quedarse quieto.
 *
 * @param id Qué es lo que entra. Cambia cuando el mismo componente pasa a
 *           mostrar otra cosa, como hace una lista que recicla sus renglones.
 * @param animate Si esta vez tiene que animarse. Si no, queda en su lugar.
 */
export function useEntrance(id: string, animate: boolean, entrance: Entrance) {
  // 0: recién llega. 1: en su lugar.
  const settled = useSharedValue(animate ? 0 : 1);
  const opacity = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (!animate) {
      settled.set(1);
      opacity.set(1);
      return;
    }
    settled.set(0);
    opacity.set(0);
    opacity.set(withTiming(1, { duration: entrance.fadeMs }));
    settled.set(withSpring(1, entrance.spring));
    // Solo cuando cambia lo que entra: el resto no tiene que volver a lanzarla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return useAnimatedStyle(() => {
    const pending = 1 - settled.value;
    return {
      opacity: opacity.value,
      transform: [
        { translateX: pending * entrance.fromX },
        { translateY: pending * entrance.fromY },
        { scale: entrance.fromScale + (1 - entrance.fromScale) * settled.value },
      ],
    };
  });
}
