import { View } from 'react-native';

import { AppText } from '@/ui/AppText';
import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import { color, space } from '@/ui/theme';

import type { MetricModel } from './model';

type Props = {
  metric: MetricModel;
  /** Si la tarjeta lleva a los datos del campo, toda ella se puede tocar. */
  onOpen?: () => void;
  /** Mantenerla apretada, cuando se puede tocar. */
  onLongPress?: () => void;
};

// La respuesta del agente a una consulta: un número principal y, si hay,
// un dato secundario. "151 vacas preñadas · 83,9 % de 180 tactadas".
export function MetricCard({ metric, onOpen, onLongPress }: Props) {
  return (
    <Card onPress={onOpen} onLongPress={onLongPress}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <AppText variant="caption" weight="600" tone="secundarioFuerte">
          {metric.title}
        </AppText>
        {onOpen ? <Icon name="chevron-right" size={18} tint={color.secundario} /> : null}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: space[8] }}>
        <AppText variant="h1" tone="tinta" tabular>
          {metric.value}
        </AppText>
        <AppText tone="cuerpo">{metric.unit}</AppText>
      </View>

      {metric.secondary ? (
        <AppText tone="cuerpo" tabular>
          {metric.secondary}
        </AppText>
      ) : null}
    </Card>
  );
}
