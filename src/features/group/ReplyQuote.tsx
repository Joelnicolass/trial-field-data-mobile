import { View } from 'react-native';

import { AppText } from '@/ui/AppText';
import { color, space } from '@/ui/theme';

import type { QuoteModel } from './model';

// El mensaje al que se responde, arriba del texto: quién lo dijo y una línea.
export function ReplyQuote({ author, snippet }: QuoteModel) {
  return (
    <View
      style={{
        borderLeftWidth: 3,
        borderLeftColor: color.teal,
        backgroundColor: color.inset,
        borderRadius: 4,
        paddingVertical: space[4],
        paddingHorizontal: space[8],
      }}
    >
      <AppText variant="caption" weight="600" style={{ color: color.teal, lineHeight: 16 }}>
        {author}
      </AppText>
      <AppText variant="caption" tone="secundario" numberOfLines={1} style={{ lineHeight: 16 }}>
        {snippet}
      </AppText>
    </View>
  );
}
