import { ScrollView, View } from 'react-native';

import { AnimalBrowser } from '@/features/campo/AnimalBrowser';
import { PalpationCard } from '@/features/campo/PalpationCard';
import { RainfallCard } from '@/features/campo/RainfallCard';
import { StockCard } from '@/features/campo/StockCard';
import { useCampoScreen, type CampoSection } from '@/features/campo/useCampoScreen';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { SegmentedTabs } from '@/ui/SegmentedTabs';
import { color, space } from '@/ui/theme';

const SECTIONS: { key: CampoSection; label: string }[] = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'animales', label: 'Animales' },
];

// Los datos del campo: un resumen (stock, tacto y lluvia) y la lista de
// animales. Recibe del hook un modelo listo y lo dibuja.
export default function CampoScreen() {
  const screen = useCampoScreen();

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo }}>
      <ScreenHeader title={screen.header.title} titleLines={2} subtitle={screen.header.subtitle} />
      <SegmentedTabs options={SECTIONS} value={screen.section} onChange={screen.setSection} />

      {screen.section === 'resumen' ? (
        <ScrollView contentContainerStyle={{ padding: space[16], gap: space[16] }}>
          <StockCard stock={screen.stock} onSelectCategory={screen.openCategory} />
          <PalpationCard palpation={screen.palpation} />
          <RainfallCard rainfall={screen.rainfall} />
        </ScrollView>
      ) : (
        <AnimalBrowser list={screen.animalList} />
      )}
    </View>
  );
}
