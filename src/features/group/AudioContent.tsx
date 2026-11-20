import { useRecyclingState } from '@shopify/flash-list';
import { Pressable, View } from 'react-native';

import { AppText } from '@/ui/AppText';
import { Icon } from '@/ui/Icon';
import { color, space, toqueMinimo } from '@/ui/theme';

type Props = {
  /** Ya escrita: "0:38". */
  duration: string;
  /** Lo que se dijo. Puede no estar: hay audios sin transcripción. */
  transcript: string | null;
};

// Alturas de las barras del dibujo del audio. No hay audio real: es siempre el mismo dibujo.
const BARS = [8, 14, 20, 12, 24, 16, 10, 22, 14, 18, 8, 16, 24, 12, 18, 10, 20, 14];

// Un audio: botón, dibujo de la onda, duración y, abajo, lo que se dijo.
// En el campo muchas veces no se puede escuchar: el texto es lo que se lee.
export function AudioContent({ duration, transcript }: Props) {
  // La lista reutiliza los renglones al desplazarse: esto vuelve a "cerrado"
  // cuando el renglón pasa a mostrar otro audio.
  const [expanded, setExpanded] = useRecyclingState(false, [transcript]);

  return (
    <View style={{ gap: space[8] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[12] }}>
        <View
          style={{
            width: toqueMinimo,
            height: toqueMinimo,
            borderRadius: toqueMinimo / 2,
            backgroundColor: color.primarioOscuro,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="play" size={18} tint={color.superficie} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          {BARS.map((height, index) => (
            <View key={index} style={{ width: 3, height, borderRadius: 2, backgroundColor: color.primario, opacity: 0.6 }} />
          ))}
        </View>
        <AppText variant="caption" tone="secundario" tabular>
          {duration}
        </AppText>
      </View>

      {transcript ? (
        // Tocar el texto lo abre entero o lo vuelve a tres líneas.
        <Pressable onPress={() => setExpanded((current) => !current)}>
          <AppText tone="tinta" numberOfLines={expanded ? undefined : 3}>
            {transcript}
          </AppText>
        </Pressable>
      ) : (
        <AppText variant="caption" tone="secundario">
          Sin transcripción
        </AppText>
      )}
    </View>
  );
}
