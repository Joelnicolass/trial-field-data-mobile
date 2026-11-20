import { View } from 'react-native';

import { EmptyState } from '@/ui/EmptyState';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { color } from '@/ui/theme';

// Pantalla vacía por ahora: acá van los datos del campo.
export default function CampoScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: color.fondo }}>
      <ScreenHeader title="Campo" />
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <EmptyState icon="bar-chart-2" title="Acá van los datos del campo" description="Stock, tacto, lluvia y animales." />
      </View>
    </View>
  );
}
