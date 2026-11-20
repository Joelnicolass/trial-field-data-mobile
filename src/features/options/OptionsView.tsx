import { ScrollView, View } from 'react-native';

import { AppText } from '@/ui/AppText';
import { Card } from '@/ui/Card';
import { IconButton } from '@/ui/IconButton';
import { LinkRow } from '@/ui/LinkRow';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { SwitchRow } from '@/ui/SwitchRow';
import { color, space } from '@/ui/theme';

type Props = {
  /** Si se está simulando que no hay señal. */
  offline: boolean;
  onToggleOffline: (offline: boolean) => void;
  onOpenCatalog: () => void;
  onClose: () => void;
};

// Las opciones para probar la app. Solo dibuja: qué hace cada una lo decide
// quien la usa.
export function OptionsView({ offline, onToggleOffline, onOpenCatalog, onClose }: Props) {
  return (
    <View style={{ flex: 1, backgroundColor: color.fondo }}>
      <ScreenHeader
        title="Opciones"
        subtitle="Para probar la app"
        left={<IconButton icon="arrow-left" accessibilityLabel="Volver" tint={color.sobreNavy} onPress={onClose} />}
      />

      <ScrollView contentContainerStyle={{ padding: space[16], gap: space[16] }}>
        <Card title="Conexión">
          <SwitchRow
            label="Simular que no hay señal"
            description="No llega nada del grupo y lo que mandes queda sin enviar. Al volver la señal llega lo que te perdiste y sale lo pendiente."
            value={offline}
            onValueChange={onToggleOffline}
          />
        </Card>

        <Card title="Diseño">
          <LinkRow icon="grid" label="Componentes" description="Las piezas base de la guía, todas en una pantalla." onPress={onOpenCatalog} />
        </Card>

        <AppText variant="caption" tone="secundario" style={{ textAlign: 'center' }}>
          Estas opciones no son parte del producto: están para mostrar cómo responde la app.
        </AppText>
      </ScrollView>
    </View>
  );
}
