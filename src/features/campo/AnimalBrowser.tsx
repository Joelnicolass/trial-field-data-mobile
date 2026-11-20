import { FlashList } from '@shopify/flash-list';
import { ScrollView, View } from 'react-native';

import { AppText } from '@/ui/AppText';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import { TextField } from '@/ui/TextField';
import { color, space } from '@/ui/theme';

import { AnimalRow } from './AnimalRow';
import type { AnimalListModel } from './useCampoScreen';

type Props = {
  /** La búsqueda, el filtro y los animales que quedan: todo viene del hook de la pantalla. */
  list: AnimalListModel;
};

// La lista de animales, con búsqueda por caravana y filtro por categoría.
// Usa FlashList porque el archivo real puede traer miles de animales.
export function AnimalBrowser({ list }: Props) {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ backgroundColor: color.superficie, paddingTop: space[12], gap: space[12], borderBottomWidth: 1, borderBottomColor: color.divisor }}>
        <View style={{ paddingHorizontal: space[16] }}>
          <TextField
            icon="search"
            placeholder="Buscar por caravana"
            value={list.query}
            onChangeText={list.setQuery}
            keyboardType="number-pad"
            returnKeyType="search"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space[16], gap: space[8] }}>
          <Chip label="Todas" selected={list.categoryId === null} onPress={() => list.setCategoryId(null)} />
          {list.categories.map((category) => (
            <Chip key={category.id} label={category.label} selected={list.categoryId === category.id} onPress={() => list.setCategoryId(category.id)} />
          ))}
        </ScrollView>

        <AppText variant="caption" tone="secundario" tabular style={{ paddingHorizontal: space[16], paddingBottom: space[8] }}>
          {list.countLabel}
        </AppText>
      </View>

      <FlashList
        data={list.rows}
        keyExtractor={(animal) => animal.id}
        renderItem={({ item }) => <AnimalRow animal={item} />}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState icon="search" title="No hay animales con esa caravana" description="Revisá el número o sacá el filtro de categoría." />
        }
      />
    </View>
  );
}
