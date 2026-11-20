import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { groupRainsFromDatos } from '@/domain/campo';
import { formatQuantity } from '@/domain/format';
import { AnimalBrowser } from '@/features/campo/AnimalBrowser';
import { PalpationCard } from '@/features/campo/PalpationCard';
import { RainfallCard } from '@/features/campo/RainfallCard';
import { StockCard } from '@/features/campo/StockCard';
import { useCampoData } from '@/hooks/useCampoData';
import { useDatos } from '@/store/chatStore';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { SegmentedTabs } from '@/ui/SegmentedTabs';
import { color, space } from '@/ui/theme';

type Section = 'resumen' | 'animales';

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'animales', label: 'Animales' },
];

// Los datos del campo: un resumen (stock, tacto y lluvia) y la lista de animales.
export default function CampoScreen() {
  const data = useCampoData();
  // Lo que se anota en el grupo cuenta acá: si alguien carga o corrige una
  // lluvia, el total del mes cambia solo.
  const datos = useDatos();
  const groupRains = groupRainsFromDatos(datos, data.rainfall.gauge);
  const [section, setSection] = useState<Section>('resumen');
  const [categoryId, setCategoryId] = useState<number | null>(null);

  // Tocar una categoría en el stock abre la lista ya filtrada.
  function openCategory(id: number) {
    setCategoryId(id);
    setSection('animales');
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo }}>
      <ScreenHeader title={data.campo.name} titleLines={2} subtitle={`${data.campo.locality} · ${formatQuantity(data.campo.hectares, 'ha')}`} />
      <SegmentedTabs options={SECTIONS} value={section} onChange={setSection} />

      {section === 'resumen' ? (
        <ScrollView contentContainerStyle={{ padding: space[16], gap: space[16] }}>
          <StockCard stock={data.stock} onSelectCategory={openCategory} />
          <PalpationCard palpation={data.palpation} />
          <RainfallCard rainfall={data.rainfall} groupRains={groupRains} />
        </ScrollView>
      ) : (
        // `key` reinicia la lista cuando se llega con otra categoría elegida.
        <AnimalBrowser key={categoryId ?? 'todas'} animals={data.animals} categories={data.stock.by_category} initialCategoryId={categoryId} />
      )}
    </View>
  );
}
