import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { color } from './theme';

type Props = {
  /** Cuánto del anillo va pintado: de 0 a 1. */
  progress: number;
  /** Color de la parte pintada. */
  tint: string;
  size?: number;
  strokeWidth?: number;
  /** Lo que va en el centro, por ejemplo el porcentaje. */
  children?: ReactNode;
};

// Un anillo que muestra una proporción. Se dibuja con un círculo cuyo borde
// es una sola línea punteada: un tramo pintado y un hueco. Corriendo ese
// hueco (`strokeDashoffset`) se pinta más o menos anillo.
export function ProgressRing({ progress, tint, size = 96, strokeWidth = 10, children }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(progress, 0), 1);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Girado un cuarto de vuelta para que arranque arriba y no a la derecha. */}
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={color.divisor} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={tint}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
        />
      </Svg>
      {children}
    </View>
  );
}
