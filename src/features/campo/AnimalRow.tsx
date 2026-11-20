import { View } from 'react-native';

import { AppText } from '@/ui/AppText';
import { Icon } from '@/ui/Icon';
import { Tag } from '@/ui/Tag';
import { color, space } from '@/ui/theme';

import type { AnimalRowModel } from './model';

type Props = {
  animal: AnimalRowModel;
};

// Un animal en la lista: la caravana es lo que se busca, así que va primero y grande.
export function AnimalRow({ animal }: Props) {
  return (
    <View
      style={{
        backgroundColor: color.superficie,
        paddingHorizontal: space[16],
        paddingVertical: space[12],
        borderBottomWidth: 1,
        borderBottomColor: color.divisor,
        gap: space[4],
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[8] }}>
        {/* El ícono de etiqueta dice que el número es la caravana, sin sumar texto. */}
        <Icon name="tag" size={14} tint={color.secundario} />
        <AppText variant="h4" tone={animal.caravana ? 'tinta' : 'secundario'} tabular>
          {animal.caravana ?? 'Sin caravana'}
        </AppText>
        <AppText style={{ flex: 1 }} numberOfLines={1}>
          {animal.title}
        </AppText>
        <AppText tone="tinta" weight="500" tabular>
          {animal.weight}
        </AppText>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[8] }}>
        {/* Hay potreros con nombres muy largos: se cortan en una línea. */}
        <AppText variant="caption" tone="secundario" numberOfLines={1} style={{ flex: 1 }}>
          {animal.place}
        </AppText>
        {animal.tag ? <Tag label={animal.tag.label} status={animal.tag.status} compact /> : null}
      </View>
    </View>
  );
}
