import { View } from 'react-native';

import type { Animal } from '@/domain/campo';
import { formatQuantity, MISSING } from '@/domain/format';
import { AppText } from '@/ui/AppText';
import { Tag } from '@/ui/Tag';
import { color, space } from '@/ui/theme';

import { animalTag } from './animalTag';

type Props = {
  animal: Animal;
};

// Un animal en la lista: la caravana es lo que se busca, así que va primero y grande.
export function AnimalRow({ animal }: Props) {
  const tag = animalTag(animal);

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
        {animal.identifier ? (
          <AppText variant="h4" tone="tinta" tabular>
            {animal.identifier}
          </AppText>
        ) : (
          <AppText variant="h4" tone="secundario">
            Sin caravana
          </AppText>
        )}
        <AppText style={{ flex: 1 }} numberOfLines={1}>
          {animal.category_name} · {animal.breed}
        </AppText>
        <AppText tone="tinta" weight="500" tabular>
          {animal.last_weight_kg === null ? MISSING : formatQuantity(animal.last_weight_kg, 'kg')}
        </AppText>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[8] }}>
        {/* Hay potreros con nombres muy largos: se cortan en una línea. */}
        <AppText variant="caption" tone="secundario" numberOfLines={1} style={{ flex: 1 }}>
          {animal.herd} · {animal.lote}
        </AppText>
        {tag ? <Tag label={tag.label} status={tag.status} compact /> : null}
      </View>
    </View>
  );
}
