import { View } from 'react-native';

import { rainfallByMonth, rainfallTotal, type CampoData, type GroupRain, type RainMonth } from '@/domain/campo';
import { formatDate, formatMonth, formatNumber, formatQuantity } from '@/domain/format';
import { useNow } from '@/hooks/useNow';
import { AppText } from '@/ui/AppText';
import { Card } from '@/ui/Card';
import { color, space } from '@/ui/theme';

type Props = {
  rainfall: CampoData['rainfall'];
  /** Las lluvias anotadas en el grupo: se suman al mes en curso. */
  groupRains: GroupRain[];
};

/** Alto de la barra del mes que más llovió. */
const CHART_HEIGHT = 96;

// Cuánto llovió mes a mes en el último año, y el total contra la media histórica.
export function RainfallCard({ rainfall, groupRains }: Props) {
  const now = useNow();
  const months = rainfallByMonth(rainfall.months, groupRains);
  const total = rainfallTotal(months);
  const highest = Math.max(...months.map((month) => month.mm ?? 0), 1);
  const current = months.find((month) => month.partial);

  return (
    <Card title="Lluvia">
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space[8] }}>
        <AppText variant="h1" tone="tinta" tabular>
          {formatNumber(total)}
        </AppText>
        <AppText>{rainfall.unit} en el último año</AppText>
      </View>
      <AppText variant="caption" tone="secundario" tabular>
        Pluviómetro {rainfall.gauge} · media histórica {formatQuantity(rainfall.historical_annual_avg_mm, rainfall.unit)}
      </AppText>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space[4], marginTop: space[8] }}>
        {months.map((month) => (
          <MonthBar key={month.month} month={month} highest={highest} />
        ))}
      </View>

      {current ? (
        <AppText variant="caption" tone="secundario" tabular>
          Este mes van {formatQuantity(current.mm ?? 0, rainfall.unit)}
          {current.until ? `: el pluviómetro hasta el ${formatDate(current.until, now)}, más lo anotado en el grupo.` : '.'}
        </AppText>
      ) : null}
    </Card>
  );
}

// Una barra por mes. Un mes sin registro no es un mes en cero: el primero se
// dibuja como un hueco punteado con "s/d"; el segundo, con su "0".
function MonthBar({ month, highest }: { month: RainMonth; highest: number }) {
  const missing = month.mm === null;
  const height = missing ? CHART_HEIGHT / 3 : Math.max(((month.mm ?? 0) / highest) * CHART_HEIGHT, 2);

  return (
    <View style={{ flex: 1, alignItems: 'center', gap: space[4] }}>
      <AppText variant="caption" tone={missing ? 'secundario' : 'tinta'} tabular style={{ fontSize: 12, lineHeight: 14 }}>
        {missing ? 's/d' : formatNumber(month.mm ?? 0, 0)}
      </AppText>
      <View
        style={{
          width: '100%',
          height,
          borderRadius: 3,
          backgroundColor: missing ? 'transparent' : color.lluvia,
          // El mes en curso todavía no terminó: va más claro.
          opacity: month.partial ? 0.55 : 1,
          borderWidth: missing ? 1 : 0,
          borderStyle: 'dashed',
          borderColor: color.chipBorde,
        }}
      />
      <AppText variant="caption" weight={month.partial ? '700' : '400'} tone={month.partial ? 'tinta' : 'secundario'} style={{ lineHeight: 14 }}>
        {formatMonth(month.month)}
      </AppText>
    </View>
  );
}
