import { View } from 'react-native';

import { AppText } from './AppText';
import { color, space } from './theme';

type Props = {
  label: string;
  /** Ya formateado: esta fila no sabe de números ni de fechas. */
  value: string;
};

// Una fila "nombre → valor" dentro de una tarjeta: Cabezas 74, Peso 321,1 kg.
export function KeyValueRow({ label, value }: Props) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: space[12],
        paddingVertical: space[8],
        borderTopWidth: 1,
        borderTopColor: color.divisor,
      }}
    >
      <AppText>{label}</AppText>
      {/* `flexShrink` deja que un valor largo baje de línea sin empujar el nombre. */}
      <AppText weight="500" tone="tinta" tabular style={{ flexShrink: 1, textAlign: 'right' }}>
        {value}
      </AppText>
    </View>
  );
}
