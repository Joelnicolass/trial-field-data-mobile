import { View } from 'react-native';

import { AppText } from '@/ui/AppText';
import { Icon } from '@/ui/Icon';
import { color, space } from '@/ui/theme';

type Props = {
  /** El color que representa a la foto. */
  color: string;
  /** Ancho sobre alto, ya acotado para que entre en el chat. */
  aspectRatio: number;
  description: string;
  /** El epígrafe que escribió quien la mandó. */
  caption: string | null;
};

// Una foto. No hay imagen real: se dibuja un bloque del color que trae el
// mensaje, con la proporción de la foto y su descripción.
export function PhotoContent({ color: photoColor, aspectRatio, description, caption }: Props) {
  return (
    <View style={{ gap: space[8] }}>
      <View
        accessibilityRole="image"
        accessibilityLabel={description}
        style={{ width: 240, aspectRatio, borderRadius: 4, backgroundColor: photoColor, justifyContent: 'flex-end', padding: space[8], gap: space[4] }}
      >
        <Icon name="image" size={18} tint={color.superficie} />
        <AppText variant="caption" style={{ color: color.superficie, lineHeight: 16 }}>
          {description}
        </AppText>
      </View>
      {caption ? <AppText tone="tinta">{caption}</AppText> : null}
    </View>
  );
}
