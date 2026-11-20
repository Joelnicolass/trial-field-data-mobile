import { View } from 'react-native';

import type { CampoData } from '@/domain/campo';
import { formatDate, formatNumber } from '@/domain/format';
import { useNow } from '@/hooks/useNow';
import { AppText } from '@/ui/AppText';
import { Card } from '@/ui/Card';
import { StackedBar } from '@/ui/StackedBar';
import { estado, space } from '@/ui/theme';

type Props = {
  palpation: CampoData['palpation'];
};

// Cómo dio el último tacto: el porcentaje de preñez y cuántas quedaron vacías.
export function PalpationCard({ palpation }: Props) {
  const now = useNow();

  return (
    <Card title="Último tacto">
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space[8] }}>
        <AppText variant="h1" tone="tinta" tabular>
          {formatNumber(palpation.pregnancy_rate)} %
        </AppText>
        <AppText>de preñez</AppText>
      </View>

      <StackedBar
        segments={[
          { key: 'pregnant', value: palpation.pregnant, color: estado.activo.texto },
          { key: 'empty', value: palpation.empty, color: estado.archivado.borde },
        ]}
      />

      <View style={{ flexDirection: 'row', gap: space[16] }}>
        <Legend swatch={estado.activo.texto} value={palpation.pregnant} label="preñadas" />
        <Legend swatch={estado.archivado.borde} value={palpation.empty} label="vacías" />
      </View>

      <AppText variant="caption" tone="secundario" tabular>
        {formatNumber(palpation.palpated)} tactadas · {formatDate(palpation.date, now)}
      </AppText>
    </Card>
  );
}

function Legend({ swatch, value, label }: { swatch: string; value: number; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[4] }}>
      <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: swatch }} />
      <AppText tone="tinta" weight="600" tabular>
        {formatNumber(value)}
      </AppText>
      <AppText>{label}</AppText>
    </View>
  );
}
