import { View } from 'react-native';

import { color } from './theme';

export type BarSegment = {
  key: string;
  value: number;
  color: string;
};

type Props = {
  segments: BarSegment[];
  height?: number;
};

// Una barra partida en tramos, cada uno del ancho que le toca por su valor.
export function StackedBar({ segments, height = 16 }: Props) {
  return (
    <View style={{ flexDirection: 'row', height, borderRadius: height / 2, overflow: 'hidden', backgroundColor: color.inset }}>
      {segments
        .filter((segment) => segment.value > 0)
        .map((segment) => (
          // `minWidth` deja ver un tramo muy chico (4 toros entre 411 cabezas).
          <View key={segment.key} style={{ flex: segment.value, minWidth: 4, backgroundColor: segment.color }} />
        ))}
    </View>
  );
}
