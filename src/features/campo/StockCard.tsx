import { Pressable, View } from 'react-native';

import { AppText } from '@/ui/AppText';
import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import { StackedBar } from '@/ui/StackedBar';
import { categorias, color, otras, space, toqueMinimo } from '@/ui/theme';

import type { StockGroupModel, StockModel } from './model';

type Props = {
  stock: StockModel;
  /** Tocar una categoría lleva a sus animales. */
  onSelectCategory: (categoryId: number) => void;
  /** Se llegó a esta tarjeta desde el grupo. */
  highlighted?: boolean;
};

// Cuántos animales hay y cómo se reparten por categoría.
export function StockCard({ stock, onSelectCategory, highlighted }: Props) {
  return (
    <Card title="Stock" highlighted={highlighted}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space[8] }}>
        <AppText variant="h1" tone="tinta" tabular>
          {stock.total}
        </AppText>
        <AppText>cabezas</AppText>
      </View>

      <StackedBar segments={stock.groups.map((group, index) => ({ key: group.key, value: group.value, color: colorFor(group, index) }))} />

      <View>
        {stock.groups.map((group, index) => {
          const { categoryId } = group;
          return (
            <Pressable
              key={group.key}
              disabled={categoryId === null}
              onPress={() => categoryId !== null && onSelectCategory(categoryId)}
              style={{
                minHeight: toqueMinimo,
                flexDirection: 'row',
                alignItems: 'center',
                gap: space[8],
                paddingVertical: space[8],
                borderTopWidth: 1,
                borderTopColor: color.divisor,
              }}
            >
              <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: colorFor(group, index) }} />
              <View style={{ flex: 1 }}>
                <AppText tone="tinta" weight="500">
                  {group.name}
                </AppText>
                <AppText variant="caption" tone="secundario" tabular style={{ lineHeight: 16 }}>
                  {group.detail}
                </AppText>
              </View>
              <AppText variant="h4" tone="tinta" tabular>
                {group.count}
              </AppText>
              {categoryId !== null ? <Icon name="chevron-right" size={16} tint={color.secundario} /> : null}
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

// El color sale del orden, no de la categoría: la que más tiene lleva el
// primero. "Otras" va en gris.
function colorFor(group: StockGroupModel, index: number): string {
  return group.categoryId === null ? otras : categorias[index % categorias.length];
}
