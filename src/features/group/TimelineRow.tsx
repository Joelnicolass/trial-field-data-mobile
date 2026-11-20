import { View } from 'react-native';

import { formatDate } from '@/domain/format';
import type { Dato, Member, MemberId, Message, Opens } from '@/server/mock-server';
import { space } from '@/ui/theme';

import { CenterLine } from './CenterLine';
import { MessageRow } from './MessageRow';
import type { Quote } from './ReplyQuote';
import { messageSnippet, type TimelineItem } from './timeline';
import { UnreadDivider } from './UnreadDivider';

export type TimelineContext = {
  me: MemberId;
  now: string;
  membersById: Map<string, Member>;
  messagesBySeq: Map<number, Message>;
  /** Cómo está ahora cada dato: la tarjeta muestra esto, no lo que decía el mensaje. */
  datos: Record<string, Dato>;
  onOpen: (opens: Opens) => void;
};

type Props = {
  item: TimelineItem;
  /** El renglón de arriba, para saber si el agente viene hablando. */
  previous: TimelineItem | undefined;
  context: TimelineContext;
};

// Un renglón de la lista del grupo: un día, el separador de "sin leer" o un mensaje.
export function TimelineRow({ item, previous, context }: Props) {
  return <View style={{ paddingHorizontal: space[16], paddingBottom: space[12] }}>{renderItem(item, previous, context)}</View>;
}

function renderItem(item: TimelineItem, previous: TimelineItem | undefined, context: TimelineContext) {
  if (item.kind === 'day') return <CenterLine text={formatDate(item.date, context.now)} />;
  if (item.kind === 'unread') return <UnreadDivider count={item.count} />;

  const { message } = item;
  const sender = context.membersById.get(message.sender_id);
  if (!sender) return null;

  const previousIsSameSender = previous?.kind === 'message' && previous.message.sender_id === message.sender_id;

  return (
    <MessageRow
      message={message}
      sender={sender}
      isMine={message.sender_id === context.me}
      mentionsMe={message.mentions.includes(context.me)}
      quote={quoteFor(message, context)}
      dato={message.dato ? context.datos[message.dato.id] : undefined}
      showAgentLabel={!previousIsSameSender}
      onOpen={context.onOpen}
    />
  );
}

// El mensaje al que responde este, resumido en una línea.
function quoteFor(message: Message, context: TimelineContext): Quote | undefined {
  if (message.reply_to === null) return undefined;
  const quoted = context.messagesBySeq.get(message.reply_to);
  if (!quoted) return undefined;

  const author = context.membersById.get(quoted.sender_id);
  return { author: author?.is_agent ? 'Agente' : (author?.short_name ?? ''), snippet: messageSnippet(quoted) };
}
