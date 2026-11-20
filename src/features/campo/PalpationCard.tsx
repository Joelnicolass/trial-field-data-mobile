import { View } from 'react-native';

import { AppText } from '@/ui/AppText';
import { Card } from '@/ui/Card';
import { ProgressRing } from '@/ui/ProgressRing';
import { estado, space } from '@/ui/theme';

import type { PalpationModel } from './model';

type Props = {
  palpation: PalpationModel;
  /** Se llegó a esta tarjeta desde el grupo. */
  highlighted?: boolean;
};

// Cómo dio el último tacto: el porcentaje de preñez y cuántas quedaron vacías.
export function PalpationCard({ palpation, highlighted }: Props) {
  return (
    <Card title="Último tacto" highlighted={highlighted}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[20] }}>
        <ProgressRing progress={palpation.progress} tint={estado.activo.texto} size={112}>
          <AppText variant="h3" tone="tinta" tabular>
            {palpation.rate}
          </AppText>
          <AppText variant="caption" tone="secundario" style={{ lineHeight: 14 }}>
            preñez
          </AppText>
        </ProgressRing>

        <View style={{ flex: 1, gap: space[8] }}>
          <Legend swatch={estado.activo.texto} value={palpation.pregnant} label="preñadas" />
          <Legend swatch={estado.archivado.borde} value={palpation.empty} label="vacías" />
          <AppText variant="caption" tone="secundario" tabular>
            {palpation.caption}
          </AppText>
        </View>
      </View>
    </Card>
  );
}

function Legend({ swatch, value, label }: { swatch: string; value: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[8] }}>
      <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: swatch }} />
      <AppText variant="h4" tone="tinta" tabular>
        {value}
      </AppText>
      <AppText>{label}</AppText>
    </View>
  );
}
