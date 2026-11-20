import { Pressable, View } from 'react-native';

import { IconButton } from '@/ui/IconButton';
import { Icon } from '@/ui/Icon';
import { TextField } from '@/ui/TextField';
import { color, space, toqueMinimo } from '@/ui/theme';

import { ReplyQuote, type Quote } from './ReplyQuote';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  /** Con el campo vacío, el botón es el micrófono. */
  onMic: () => void;
  /** Suma una "@" para mencionar a alguien. */
  onMention: () => void;
  /** El mensaje al que se está respondiendo, si hay. */
  replyingTo?: Quote;
  onCancelReply?: () => void;
};

// Donde se escribe. Solo dibuja: qué se manda y a quién lo decide la pantalla.
export function Composer({ value, onChangeText, onSend, onMic, onMention, replyingTo, onCancelReply }: Props) {
  const hasText = value.trim() !== '';

  return (
    <View
      style={{
        backgroundColor: color.superficie,
        borderTopWidth: 1,
        borderTopColor: color.divisor,
        paddingHorizontal: space[8],
        paddingVertical: space[8],
        gap: space[8],
      }}
    >
      {replyingTo ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[8], paddingLeft: space[8] }}>
          <View style={{ flex: 1 }}>
            <ReplyQuote {...replyingTo} />
          </View>
          <IconButton icon="x" accessibilityLabel="Dejar de responder" tint={color.secundario} onPress={() => onCancelReply?.()} />
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space[4] }}>
        <IconButton icon="at-sign" accessibilityLabel="Mencionar a alguien" tint={color.secundario} onPress={onMention} />
        <View style={{ flex: 1 }}>
          <TextField placeholder="Escribí un mensaje" value={value} onChangeText={onChangeText} multiline />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={hasText ? 'Enviar' : 'Grabar un audio'}
          onPress={hasText ? onSend : onMic}
          style={({ pressed }) => ({
            width: toqueMinimo,
            height: toqueMinimo,
            borderRadius: toqueMinimo / 2,
            marginLeft: space[4],
            backgroundColor: pressed ? color.primarioOscuroHover : color.primarioOscuro,
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <Icon name={hasText ? 'send' : 'mic'} size={20} tint={color.superficie} />
        </Pressable>
      </View>
    </View>
  );
}
