import { useRef, type ComponentRef, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { IconButton } from '@/ui/IconButton';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { SegmentedTabs } from '@/ui/SegmentedTabs';
import { color, space } from '@/ui/theme';

import { AnimalBrowser } from './AnimalBrowser';
import { PalpationCard } from './PalpationCard';
import { RainfallCard } from './RainfallCard';
import { StockCard } from './StockCard';
import type { CampoFocus, CampoSection, CampoTarget } from './target';
import { useCampoScreen } from './useCampoScreen';

const SECTIONS: { key: CampoSection; label: string }[] = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'animales', label: 'Animales' },
];

type Props = {
  /** Adónde abrir: la pestaña, la tarjeta y los filtros con los que se llegó. */
  target: CampoTarget;
  /** Vuelve al grupo. Solo se ofrece si se llegó desde ahí. */
  onBack: () => void;
};

// Los datos del campo: un resumen (stock, tacto y lluvia) y la lista de
// animales. Recibe del hook un modelo listo y lo dibuja.
export function CampoView({ target, onBack }: Props) {
  const screen = useCampoScreen(target);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  // Para bajar hasta la tarjeta que se vino a mirar hacen falta dos cosas, que
  // llegan en cualquier orden: dónde quedó esa tarjeta y que el resumen ya
  // sepa cuánto mide. Se baja cuando están las dos, una sola vez.
  const focusY = useRef<number | null>(null);
  const contentMeasured = useRef(false);
  const scrolled = useRef(false);

  function scrollToFocus() {
    if (scrolled.current || focusY.current === null || !contentMeasured.current) return;
    scrolled.current = true;
    scrollRef.current?.scrollTo({ y: focusY.current - space[8], animated: false });
  }

  // Envuelve una tarjeta del resumen. Si es la que se vino a mirar, anota
  // dónde quedó ubicada.
  function focusable(focus: CampoFocus, card: ReactNode) {
    if (target.focus !== focus) return card;
    return (
      <View
        onLayout={(event) => {
          focusY.current = event.nativeEvent.layout.y;
          scrollToFocus();
        }}
      >
        {card}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo }}>
      <ScreenHeader
        title={screen.header.title}
        titleLines={2}
        subtitle={screen.header.subtitle}
        left={target.fromGroup ? <IconButton icon="arrow-left" accessibilityLabel="Volver al grupo" tint={color.sobreNavy} onPress={onBack} /> : undefined}
      />
      <SegmentedTabs options={SECTIONS} value={screen.section} onChange={screen.setSection} />

      {screen.section === 'resumen' ? (
        <ScrollView
          ref={scrollRef}
          onContentSizeChange={() => {
            contentMeasured.current = true;
            scrollToFocus();
          }}
          contentContainerStyle={{ padding: space[16], gap: space[16] }}
        >
          {focusable('stock', <StockCard stock={screen.stock} onSelectCategory={screen.openCategory} highlighted={target.focus === 'stock'} />)}
          {focusable('palpation', <PalpationCard palpation={screen.palpation} highlighted={target.focus === 'palpation'} />)}
          {focusable('rainfall', <RainfallCard rainfall={screen.rainfall} highlighted={target.focus === 'rainfall'} />)}
        </ScrollView>
      ) : (
        <AnimalBrowser list={screen.animalList} />
      )}
    </View>
  );
}
