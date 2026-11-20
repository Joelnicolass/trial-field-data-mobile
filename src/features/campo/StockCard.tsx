import { Pressable, View } from 'react-native';

import { groupStock, type CampoData, type StockGroup } from '@/domain/campo';
import { formatDate, formatNumber, formatQuantity } from '@/domain/format';
import { useNow } from '@/hooks/useNow';
import { AppText } from '@/ui/AppText';
import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import { StackedBar } from '@/ui/StackedBar';
import { categorias, color, otras, space, toqueMinimo } from '@/ui/theme';

type Props = {
  stock: CampoData['stock'];
  /** Tocar una categoría lleva a sus animales. */
  onSelectCategory?: (categoryId: number) => void;
};

// Cuántos animales hay y cómo se reparten por categoría.
export function StockCard({ stock, onSelectCategory }: Props) {
  const now = useNow();
  const groups = groupStock(stock.by_category);

  return (
    <Card title="Stock">
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space[8] }}>
        <AppText variant="h1" tone="tinta" tabular>
          {formatNumber(stock.total_head_count)}
        </AppText>
        <AppText>cabezas</AppText>
      </View>

      <StackedBar segments={groups.map((group, index) => ({ key: group.name, value: group.headCount, color: colorFor(group, index) }))} />

      <View>
        {groups.map((group, index) => {
          const { categoryId } = group;
          return (
            <Pressable
              key={group.name}
              disabled={categoryId === null || !onSelectCategory}
              onPress={() => categoryId !== null && onSelectCategory?.(categoryId)}
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
                  {weightLine(group, now)}
                </AppText>
              </View>
              <AppText variant="h4" tone="tinta" tabular>
                {formatNumber(group.headCount)}
              </AppText>
              {categoryId !== null && onSelectCategory ? <Icon name="chevron-right" size={16} tint={color.secundario} /> : null}
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

// El color sale del orden, no de la categoría: la que más tiene lleva el primero.
function colorFor(group: StockGroup, index: number): string {
  return group.categoryId === null ? otras : categorias[index % categorias.length];
}

function weightLine(group: StockGroup, now: string): string {
  if (group.avgWeightKg === null || group.lastWeighingDate === null) return 'Sin pesaje';
  return `${formatQuantity(group.avgWeightKg, 'kg')} promedio · pesaje ${formatDate(group.lastWeighingDate, now)}`;
}
