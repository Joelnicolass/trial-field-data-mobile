import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { formatDate } from '@/domain/format';
import { ActivityLine } from '@/features/group/ActivityLine';
import { CenterLine } from '@/features/group/CenterLine';
import { Composer } from '@/features/group/Composer';
import { LAST_READ_SEQ, ME, MEMBERS, MESSAGES, OUTGOING } from '@/features/group/fixtures';
import { MessageRow } from '@/features/group/MessageRow';
import { NewMessagesPill } from '@/features/group/NewMessagesPill';
import type { Quote } from '@/features/group/ReplyQuote';
import { buildTimeline, messageSnippet } from '@/features/group/timeline';
import { UnreadDivider } from '@/features/group/UnreadDivider';
import { useNow } from '@/hooks/useNow';
import type { Message } from '@/server/mock-server';
import { IconButton } from '@/ui/IconButton';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { color, space } from '@/ui/theme';

const membersById = new Map(MEMBERS.map((member) => [member.id, member]));
const messagesBySeq = new Map(MESSAGES.map((message) => [message.seq, message]));

// El grupo, por ahora con datos de muestra: sirve para ver el diseño de cada
// tipo de mensaje. Cuando se conecte al servidor, los datos salen de ahí.
export default function GroupScreen() {
  const router = useRouter();
  const now = useNow();
  const [draft, setDraft] = useState('');

  const timeline = buildTimeline(MESSAGES, LAST_READ_SEQ, ME);

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo }}>
      <ScreenHeader
        title="La Aurora · Hacienda"
        subtitle="Lucía y Mariano están escribiendo…"
        right={<IconButton icon="grid" accessibilityLabel="Ver los componentes" tint={color.sobreNavy} onPress={() => router.push('/catalogo')} />}
      />

      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: space[16], gap: space[12] }}>
          {timeline.map((item, index) => {
            if (item.kind === 'day') return <CenterLine key={item.key} text={formatDate(item.date, now)} />;
            if (item.kind === 'unread') return <UnreadDivider key={item.key} count={item.count} />;

            const { message } = item;
            const previous = timeline[index - 1];
            const previousIsAgent = previous?.kind === 'message' && previous.message.sender_id === message.sender_id;

            return (
              <MessageRow
                key={item.key}
                message={message}
                sender={membersById.get(message.sender_id)!}
                isMine={message.sender_id === ME}
                mentionsMe={message.mentions.includes(ME)}
                quote={quoteFor(message)}
                dato={message.dato}
                showAgentLabel={!previousIsAgent}
                onOpen={() => router.navigate('/campo')}
                onComplete={() => {}}
              />
            );
          })}

          {OUTGOING.map(({ message, status }) => (
            <MessageRow
              key={message.message_id}
              message={message}
              sender={membersById.get(ME)!}
              isMine
              mentionsMe={false}
              quote={quoteFor(message)}
              showAgentLabel={false}
              deliveryStatus={status}
              onRetry={() => {}}
            />
          ))}

          <ActivityLine text="Lucía y Mariano están escribiendo…" />
          <ActivityLine text="El agente está tardando más de lo normal…" slow />
        </ScrollView>

        <View style={{ position: 'absolute', right: space[16], bottom: space[12] }}>
          <NewMessagesPill count={3} onPress={() => {}} />
        </View>
      </View>

      <Composer value={draft} onChangeText={setDraft} onSend={() => setDraft('')} onMic={() => {}} onMention={() => setDraft((text) => `${text}@`)} />
    </View>
  );
}

// El mensaje al que responde este, resumido en una línea.
function quoteFor(message: Message): Quote | undefined {
  if (message.reply_to === null) return undefined;
  const quoted = messagesBySeq.get(message.reply_to);
  if (!quoted) return undefined;
  const author = membersById.get(quoted.sender_id);
  return { author: author?.is_agent ? 'Agente' : (author?.short_name ?? ''), snippet: messageSnippet(quoted) };
}
