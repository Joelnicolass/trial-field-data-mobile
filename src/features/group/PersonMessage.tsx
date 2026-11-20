import { Pressable, View } from 'react-native';

import { AppText } from '@/ui/AppText';
import { Icon, type IconName } from '@/ui/Icon';
import { color, estado, radio, space } from '@/ui/theme';

import { AudioContent } from './AudioContent';
import { MentionText } from './MentionText';
import type { DeliveryStatus, GroupRow, PersonBody } from './model';
import { PhotoContent } from './PhotoContent';
import { ReplyQuote } from './ReplyQuote';

type Props = {
  row: Extract<GroupRow, { kind: 'person' }>;
  onRetry?: () => void;
};

const STATUS_ICON: Record<DeliveryStatus, IconName> = { sending: 'clock', sent: 'check', failed: 'alert-circle' };

// Lo que manda una persona: texto, audio o foto, dentro de un globo.
// Los míos van a la derecha y sin nombre.
export function PersonMessage({ row, onRetry }: Props) {
  const { isMine, mentionsMe, delivery } = row;
  const failed = delivery === 'failed';

  return (
    <View style={{ alignItems: isMine ? 'flex-end' : 'flex-start', gap: space[4] }}>
      {row.author ? (
        <AppText variant="caption" weight="600" tone="secundarioFuerte" style={{ lineHeight: 16 }}>
          {row.author}
        </AppText>
      ) : null}

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
        {row.quote ? <ReplyQuote {...row.quote} /> : null}
        <Body body={row.body} />

        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: space[4] }}>
          <AppText variant="caption" tone="secundario" tabular style={{ lineHeight: 16 }}>
            {row.time}
          </AppText>
          {delivery ? <Icon name={STATUS_ICON[delivery]} size={14} tint={failed ? estado.error.texto : color.secundario} /> : null}
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
function Body({ body }: { body: PersonBody }) {
  if (body.kind === 'audio') return <AudioContent duration={body.duration} transcript={body.transcript} />;
  if (body.kind === 'photo') {
    return <PhotoContent color={body.color} aspectRatio={body.aspectRatio} description={body.description} caption={body.caption} />;
  }
  return <MentionText text={body.text} />;
}
