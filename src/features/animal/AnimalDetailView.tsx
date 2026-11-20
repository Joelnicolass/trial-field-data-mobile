import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/ui/AppText';
import { Card } from '@/ui/Card';
import { EmptyState } from '@/ui/EmptyState';
import { IconButton } from '@/ui/IconButton';
import { KeyValueRow } from '@/ui/KeyValueRow';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { Tag } from '@/ui/Tag';
import { color, space } from '@/ui/theme';

import type { AnimalDetailModel } from './model';

type Props = {
  /** El animal, con todo ya escrito. `null` si no existe. */
  animal: AnimalDetailModel | null;
  onBack: () => void;
};

// El detalle de un animal: su estado y una tarjeta por tema. Recibe el modelo
// listo y lo dibuja.
export function AnimalDetailView({ animal, onBack }: Props) {
  // Esta pantalla no tiene las pestañas abajo: el contenido llega hasta el
  // borde y hay que dejarle lugar a la barra del sistema.
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo }}>
      <ScreenHeader
        title={animal?.title ?? 'Animal'}
        subtitle={animal?.subtitle}
        left={<IconButton icon="arrow-left" accessibilityLabel="Volver" tint={color.sobreNavy} onPress={onBack} />}
      />

      {animal ? (
        <ScrollView contentContainerStyle={{ padding: space[16], paddingBottom: space[16] + insets.bottom, gap: space[16] }}>
          <Tag label={animal.status.label} status={animal.status.status} />

          {animal.sections.map((section) => (
            <Card key={section.title} title={section.title}>
              <View>
                {section.rows.map((row) => (
                  <KeyValueRow key={row.label} label={row.label} value={row.value} />
                ))}
              </View>
            </Card>
          ))}

          {animal.notes ? (
            <Card title="Notas">
              <AppText>{animal.notes}</AppText>
            </Card>
          ) : null}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState
            icon="search"
            title="No encontramos ese animal"
            description="Volvé y buscalo por su caravana en la lista de animales."
            actionLabel="Volver"
            onAction={onBack}
          />
        </View>
      )}
    </View>
  );
}
