import { Pressable, View } from 'react-native';

import { AppText } from '@/ui/AppText';
import { Icon } from '@/ui/Icon';
import { IconButton } from '@/ui/IconButton';
import { color, estado, space, toqueMinimo } from '@/ui/theme';

type Props = {
  /** El reloj, ya escrito: "0:03". */
  elapsed: string;
  /** Las alturas de las barras de la onda. */
  levels: number[];
  /** Si el punto rojo está prendido: parpadea mientras se graba. */
  dotOn: boolean;
  onCancel: () => void;
  onSend: () => void;
};

// Lo que se ve mientras se graba un audio, en el lugar del campo de texto:
// descartar a la izquierda, el reloj y la onda en el medio, enviar a la derecha.
export function RecordingBar({ elapsed, levels, dotOn, onCancel, onSend }: Props) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[8] }}>
      <IconButton icon="trash-2" accessibilityLabel="Descartar el audio" tint={color.secundario} onPress={onCancel} />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[8] }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: estado.error.texto, opacity: dotOn ? 1 : 0.25 }} />
        <AppText weight="600" tone="tinta" tabular>
          {elapsed}
        </AppText>
      </View>

      {/* Si las barras no entran, se corta lo que sobra. */}
      <View style={{ flex: 1, height: toqueMinimo, flexDirection: 'row', alignItems: 'center', gap: 3, overflow: 'hidden' }}>
        {levels.map((height, index) => (
          <View key={index} style={{ width: 3, height, borderRadius: 2, backgroundColor: color.primario }} />
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Enviar el audio"
        onPress={onSend}
        style={({ pressed }) => ({
          width: toqueMinimo,
          height: toqueMinimo,
          borderRadius: toqueMinimo / 2,
          backgroundColor: pressed ? color.primarioOscuroHover : color.primarioOscuro,
          alignItems: 'center',
          justifyContent: 'center',
        })}
      >
        <Icon name="send" size={20} tint={color.superficie} />
      </Pressable>
    </View>
  );
}
