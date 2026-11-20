import { FlashList } from '@shopify/flash-list';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { filterAnimals, type Animal, type StockCategory } from '@/domain/campo';
import { formatNumber } from '@/domain/format';
import { AppText } from '@/ui/AppText';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import { TextField } from '@/ui/TextField';
import { color, space } from '@/ui/theme';

import { AnimalRow } from './AnimalRow';

type Props = {
  animals: Animal[];
  /** Las categorías que existen: de acá salen los chips, no de una lista fija. */
  categories: StockCategory[];
  /** Categoría elegida al llegar, por ejemplo desde la tarjeta de stock. */
  initialCategoryId?: number | null;
};

// La lista de animales, con búsqueda por caravana y filtro por categoría.
// Usa FlashList porque el archivo real puede traer miles de animales.
export function AnimalBrowser({ animals, categories, initialCategoryId = null }: Props) {
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(initialCategoryId);

  const visible = useMemo(() => filterAnimals(animals, { query, categoryId, status: 'active' }), [animals, query, categoryId]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ backgroundColor: color.superficie, paddingTop: space[12], gap: space[12], borderBottomWidth: 1, borderBottomColor: color.divisor }}>
        <View style={{ paddingHorizontal: space[16] }}>
          <TextField icon="search" placeholder="Buscar por caravana" value={query} onChangeText={setQuery} keyboardType="number-pad" returnKeyType="search" />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space[16], gap: space[8] }}>
          <Chip label="Todas" selected={categoryId === null} onPress={() => setCategoryId(null)} />
          {categories.map((category) => (
            <Chip
              key={category.category_id}
              label={category.category_name}
              selected={categoryId === category.category_id}
              onPress={() => setCategoryId(category.category_id)}
            />
          ))}
        </ScrollView>

        <AppText variant="caption" tone="secundario" tabular style={{ paddingHorizontal: space[16], paddingBottom: space[8] }}>
          {visible.length === 1 ? '1 animal' : `${formatNumber(visible.length)} animales`}
        </AppText>
      </View>

      <FlashList
        data={visible}
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
