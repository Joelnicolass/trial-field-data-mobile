import { Pressable, ScrollView, View } from 'react-native';

import { AppText } from '@/ui/AppText';
import { Icon } from '@/ui/Icon';
import { color, space, toqueMinimo } from '@/ui/theme';

import type { MentionOption } from './model';

type Props = {
  options: MentionOption[];
  onPick: (option: MentionOption) => void;
};

// Cuatro renglones y medio: el medio renglón deja ver que hay más para desplazar.
const MAX_HEIGHT = toqueMinimo * 4.5;

// A quién mencionar, mientras se escribe el nombre después de la "@".
// Tocar un renglón completa la mención.
export function MentionSuggestions({ options, onPick }: Props) {
  return (
    <ScrollView
      // Tocar una sugerencia no tiene que cerrar el teclado.
      keyboardShouldPersistTaps="always"
      style={{ maxHeight: MAX_HEIGHT, backgroundColor: color.superficie, borderTopWidth: 1, borderTopColor: color.divisor }}
    >
      {options.map((option) => (
        <Pressable
          key={option.key}
          accessibilityRole="button"
          accessibilityLabel={`Mencionar a ${option.name}`}
          onPress={() => onPick(option)}
          style={({ pressed }) => ({
            minHeight: toqueMinimo,
            flexDirection: 'row',
            alignItems: 'center',
            gap: space[12],
            paddingHorizontal: space[16],
            backgroundColor: pressed ? color.inset : color.superficie,
          })}
        >
          {/* El agente no es una persona: lleva su ícono y su color. */}
          <Icon name={option.isAgent ? 'cpu' : 'user'} size={18} tint={option.isAgent ? color.teal : color.secundario} />
          <AppText weight="600" tone="tinta">
            @{option.name}
          </AppText>
          <View style={{ flex: 1 }}>
            <AppText variant="caption" tone="secundario" numberOfLines={1}>
              {option.detail}
            </AppText>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}
