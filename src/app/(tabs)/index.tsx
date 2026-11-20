import { Link } from 'expo-router';
import { View } from 'react-native';

import { AppText } from '@/ui/AppText';
import { EmptyState } from '@/ui/EmptyState';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { color, space } from '@/ui/theme';

// Pantalla vacía por ahora: acá va el grupo.
export default function GroupScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: color.fondo }}>
      <ScreenHeader title="Grupo" />
      <View style={{ flex: 1, justifyContent: 'center', gap: space[16] }}>
        <EmptyState icon="message-circle" title="Acá va el grupo" description="Todavía no está conectado al servidor de prueba." />
        <Link href="/catalogo" style={{ alignSelf: 'center' }}>
          <AppText tone="primario" weight="600">
            Ver los componentes
          </AppText>
        </Link>
      </View>
    </View>
  );
}
