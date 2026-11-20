import { View } from 'react-native';

import { AppText } from '@/ui/AppText';
import { Card } from '@/ui/Card';
import { color, space } from '@/ui/theme';

import type { RainBarModel, RainfallModel } from './model';

type Props = {
  rainfall: RainfallModel;
  /** Se llegó a esta tarjeta desde el grupo. */
  highlighted?: boolean;
};

/** Alto, en puntos, de la barra del mes que más llovió. */
const CHART_HEIGHT = 96;

// Cuánto llovió mes a mes en el último año, y el total contra la media histórica.
export function RainfallCard({ rainfall, highlighted }: Props) {
  return (
    <Card title="Lluvia" highlighted={highlighted}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space[8] }}>
        <AppText variant="h1" tone="tinta" tabular>
          {rainfall.total}
        </AppText>
        <AppText>{rainfall.totalCaption}</AppText>
      </View>
      <AppText variant="caption" tone="secundario" tabular>
        {rainfall.source}
      </AppText>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space[4], marginTop: space[8] }}>
        {rainfall.bars.map((bar) => (
          <MonthBar key={bar.key} bar={bar} />
        ))}
      </View>

      {rainfall.note ? (
        <AppText variant="caption" tone="secundario" tabular>
          {rainfall.note}
        </AppText>
      ) : null}
    </Card>
  );
}

// Una barra por mes. El mes sin registro se dibuja como un hueco punteado;
// el mes en curso, más claro, porque todavía no terminó.
function MonthBar({ bar }: { bar: RainBarModel }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: space[4] }}>
      <AppText variant="caption" tone={bar.missing ? 'secundario' : 'tinta'} tabular style={{ lineHeight: 14 }}>
        {bar.value}
      </AppText>
      <View
        style={{
          width: '100%',
          height: bar.height * CHART_HEIGHT,
          borderRadius: 3,
          backgroundColor: bar.missing ? 'transparent' : color.lluvia,
          opacity: bar.partial ? 0.55 : 1,
          borderWidth: bar.missing ? 1 : 0,
          borderStyle: 'dashed',
          borderColor: color.chipBorde,
        }}
      />
      <AppText variant="caption" weight={bar.partial ? '700' : '400'} tone={bar.partial ? 'tinta' : 'secundario'} style={{ lineHeight: 14 }}>
        {bar.label}
      </AppText>
    </View>
  );
}
