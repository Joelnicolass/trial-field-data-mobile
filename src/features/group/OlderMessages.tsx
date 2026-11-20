import { ActivityIndicator, Pressable, View } from 'react-native';

import { useChatStore } from '@/store/chatStore';
import { AppText } from '@/ui/AppText';
import { color, toqueMinimo } from '@/ui/theme';

// Arriba de todo en la lista: trae los mensajes anteriores. Se cargan solos
// al llegar arriba; el botón está por si el desplazamiento no alcanzó a
// avisar. Cuando no queda nada más viejo, no ocupa lugar.
//
// Se suscribe por su cuenta, como la barra y el pie: cargar no redibuja la
// lista, salvo los renglones que entran.
export function OlderMessages() {
  const hasOlder = useChatStore((state) => state.chat?.hasOlder ?? false);
  const loading = useChatStore((state) => state.loadingOlder);
  const loadOlder = useChatStore((state) => state.loadOlder);

  if (!hasOlder) return null;

  return (
    // El alto es fijo: que aparezca la rueda no mueve lo que se está leyendo.
    <View style={{ height: toqueMinimo, alignItems: 'center', justifyContent: 'center' }}>
      {loading ? (
        <ActivityIndicator color={color.primarioOscuro} />
      ) : (
        <Pressable accessibilityRole="button" onPress={loadOlder} hitSlop={8}>
          <AppText variant="caption" weight="600" tone="primario">
            Ver mensajes anteriores
          </AppText>
        </Pressable>
      )}
    </View>
  );
}
