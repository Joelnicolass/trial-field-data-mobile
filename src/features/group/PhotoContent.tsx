import { View } from 'react-native';

import type { Message } from '@/server/mock-server';
import { AppText } from '@/ui/AppText';
import { Icon } from '@/ui/Icon';
import { color, space } from '@/ui/theme';

type Props = {
  photo: NonNullable<Message['photo']>;
  /** El epígrafe que escribió quien la mandó. */
  caption: string | null;
};

// Una foto. No hay imagen real: se dibuja un bloque del color que trae el
// mensaje, con la proporción de la foto y su descripción.
export function PhotoContent({ photo, caption }: Props) {
  // Una panorámica o una foto muy alta no pueden ocupar toda la pantalla.
  const aspectRatio = Math.min(Math.max(photo.width / photo.height, 0.8), 2.2);

  return (
    <View style={{ gap: space[8] }}>
      <View
        accessibilityRole="image"
        accessibilityLabel={photo.description}
        style={{
          width: 240,
          aspectRatio,
          borderRadius: 4,
          backgroundColor: photo.color,
          justifyContent: 'flex-end',
          padding: space[8],
          gap: space[4],
        }}
      >
        <Icon name="image" size={18} tint={color.superficie} />
        <AppText variant="caption" style={{ color: color.superficie, lineHeight: 16 }}>
          {photo.description}
        </AppText>
      </View>
      {caption ? <AppText tone="tinta">{caption}</AppText> : null}
    </View>
  );
}
