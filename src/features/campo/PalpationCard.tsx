import { View } from 'react-native';

import type { CampoData } from '@/domain/campo';
import { formatDate, formatNumber } from '@/domain/format';
import { useNow } from '@/hooks/useNow';
import { AppText } from '@/ui/AppText';
import { Card } from '@/ui/Card';
import { ProgressRing } from '@/ui/ProgressRing';
import { estado, space } from '@/ui/theme';

type Props = {
  palpation: CampoData['palpation'];
};

// Cómo dio el último tacto: el porcentaje de preñez y cuántas quedaron vacías.
export function PalpationCard({ palpation }: Props) {
  const now = useNow();

  return (
    <Card title="Último tacto">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[20] }}>
        <ProgressRing progress={palpation.pregnancy_rate / 100} tint={estado.activo.texto} size={112}>
          <AppText variant="h3" tone="tinta" tabular>
            {formatNumber(palpation.pregnancy_rate)} %
          </AppText>
          <AppText variant="caption" tone="secundario" style={{ lineHeight: 14 }}>
            preñez
          </AppText>
        </ProgressRing>

        <View style={{ flex: 1, gap: space[8] }}>
          <Legend swatch={estado.activo.texto} value={palpation.pregnant} label="preñadas" />
          <Legend swatch={estado.archivado.borde} value={palpation.empty} label="vacías" />
          <AppText variant="caption" tone="secundario" tabular>
            {formatNumber(palpation.palpated)} tactadas · {formatDate(palpation.date, now)}
          </AppText>
        </View>
      </View>
    </Card>
  );
}

function Legend({ swatch, value, label }: { swatch: string; value: number; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[8] }}>
      <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: swatch }} />
      <AppText variant="h4" tone="tinta" tabular>
        {formatNumber(value)}
      </AppText>
      <AppText>{label}</AppText>
    </View>
  );
}
