import { Pressable, View } from 'react-native';

import { formatTime } from '@/domain/format';
import type { Member, Message } from '@/server/mock-server';
import { AppText } from '@/ui/AppText';
import { Icon, type IconName } from '@/ui/Icon';
import { color, estado, radio, space } from '@/ui/theme';

import { AudioContent } from './AudioContent';
import { MentionText } from './MentionText';
import { PhotoContent } from './PhotoContent';
import { ReplyQuote, type Quote } from './ReplyQuote';
import { roleLabel } from './roles';

/** En qué está un mensaje mío. Los de los demás no tienen estado. */
export type DeliveryStatus = 'sending' | 'sent' | 'failed';

type Props = {
  message: Message;
  sender: Member;
  /** Los míos van a la derecha y sin nombre. */
  isMine: boolean;
  /** Una mención a mí tiene que verse aunque pase rápido por el chat. */
  mentionsMe?: boolean;
  /** El mensaje al que responde, si responde a alguno. */
  quote?: Quote;
  deliveryStatus?: DeliveryStatus;
  onRetry?: () => void;
};

const STATUS_ICON: Record<DeliveryStatus, IconName> = { sending: 'clock', sent: 'check', failed: 'alert-circle' };

// Lo que manda una persona: texto, audio o foto, dentro de un globo.
export function PersonMessage({ message, sender, isMine, mentionsMe = false, quote, deliveryStatus, onRetry }: Props) {
  const failed = deliveryStatus === 'failed';

  return (
    <View style={{ alignItems: isMine ? 'flex-end' : 'flex-start', gap: space[4] }}>
      {isMine ? null : (
        <AppText variant="caption" weight="600" tone="secundarioFuerte" style={{ lineHeight: 16 }}>
          {sender.short_name} · {roleLabel(sender.role)}
        </AppText>
      )}

      <View
        style={{
          maxWidth: '86%',
          gap: space[8],
          padding: space[12],
          borderRadius: radio.tarjeta,
          borderWidth: 1,
          borderColor: isMine ? color.seleccionado : color.divisor,
          backgroundColor: isMine ? color.seleccionado : color.superficie,
          // La barra azul a la izquierda marca que me nombraron.
          borderLeftWidth: mentionsMe ? 4 : 1,
          borderLeftColor: mentionsMe ? color.primario : isMine ? color.seleccionado : color.divisor,
        }}
      >
        {quote ? <ReplyQuote {...quote} /> : null}
        <Content message={message} />

        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: space[4] }}>
          <AppText variant="caption" tone="secundario" tabular style={{ lineHeight: 16 }}>
            {formatTime(message.created_at)}
          </AppText>
          {deliveryStatus ? (
            <Icon name={STATUS_ICON[deliveryStatus]} size={14} tint={failed ? estado.error.texto : color.secundario} />
          ) : null}
        </View>
      </View>

      {failed ? (
        <Pressable accessibilityRole="button" onPress={onRetry} hitSlop={12}>
          <AppText variant="caption" weight="600" style={{ color: estado.error.texto }}>
            No se envió · Reintentar
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

// El contenido cambia según el tipo de mensaje; el globo es el mismo.
function Content({ message }: { message: Message }) {
  if (message.type === 'audio') {
    return <AudioContent durationMs={message.duration_ms ?? 0} transcript={message.transcript ?? null} />;
  }
  if (message.type === 'photo' && message.photo) {
    return <PhotoContent photo={message.photo} caption={message.text} />;
  }
  return <MentionText text={message.text ?? ''} />;
}
