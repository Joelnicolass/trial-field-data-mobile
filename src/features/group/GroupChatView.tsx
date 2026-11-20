import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import type { ChatState } from '@/domain/chat';
import { useNow } from '@/hooks/useNow';
import type { Dato, Member, Message, Opens } from '@/server/mock-server';
import { useChatStore } from '@/store/chatStore';
import { space } from '@/ui/theme';

import { ActivityLine } from './ActivityLine';
import { Composer } from './Composer';
import { NewMessagesPill } from './NewMessagesPill';
import { agentActivity, typingActivity } from './statusLine';
import type { TimelineItem } from './timeline';
import { TimelineRow, type TimelineContext } from './TimelineRow';
import { useNewMessages } from './useNewMessages';

type Props = {
  chat: ChatState;
  timeline: TimelineItem[];
  datos: Record<string, Dato>;
  membersById: Map<string, Member>;
  messagesBySeq: Map<number, Message>;
  onOpen: (opens: Opens) => void;
};

// La lista del grupo y el composer. Abre parada en lo primero sin leer y no
// se mueve sola mientras se lee más arriba.
export function GroupChatView({ chat, timeline, datos, membersById, messagesBySeq, onOpen }: Props) {
  const now = useNow();
  const listRef = useRef<FlashListRef<TimelineItem>>(null);
  const [draft, setDraft] = useState('');
  const { atBottom, newCount, lastSeq, onScroll } = useNewMessages(chat.messages, chat.me);
  const markReadUpTo = useChatStore((state) => state.markReadUpTo);

  // Al llegar al final, todo quedó leído: se le avisa al servidor.
  useEffect(() => {
    if (atBottom) markReadUpTo(lastSeq);
  }, [atBottom, lastSeq, markReadUpTo]);

  const context: TimelineContext = useMemo(
    () => ({ me: chat.me, now, membersById, messagesBySeq, datos, onOpen }),
    [chat.me, now, membersById, messagesBySeq, datos, onOpen],
  );

  // Dónde abrir: en el separador de "sin leer" o, si no hay, al final.
  const unreadIndex = timeline.findIndex((item) => item.kind === 'unread');
  const initialIndex = unreadIndex >= 0 ? unreadIndex : timeline.length - 1;

  const typing = typingActivity(chat);
  const agent = agentActivity(chat);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <FlashList
          ref={listRef}
          data={timeline}
          // Cuando cambia un dato hay que volver a dibujar su tarjeta.
          extraData={context}
          keyExtractor={(item) => item.key}
          getItemType={(item) => item.kind}
          renderItem={({ item, index }) => <TimelineRow item={item} previous={timeline[index - 1]} context={context} />}
          initialScrollIndex={initialIndex}
          // Si está cerca del final, sigue a lo que llega. Si no, no se mueve.
          maintainVisibleContentPosition={{ autoscrollToBottomThreshold: 0.2 }}
          onScroll={onScroll}
          scrollEventThrottle={64}
          contentContainerStyle={{ paddingTop: space[16] }}
          ListFooterComponent={
            <View style={{ paddingHorizontal: space[16], paddingBottom: space[12], gap: space[8] }}>
              {typing ? <ActivityLine text={typing} /> : null}
              {agent ? <ActivityLine text={agent.text} slow={agent.slow} /> : null}
            </View>
          }
        />

        {newCount > 0 ? (
          <View style={{ position: 'absolute', right: space[16], bottom: space[12] }}>
            <NewMessagesPill count={newCount} onPress={() => listRef.current?.scrollToEnd({ animated: true })} />
          </View>
        ) : null}
      </View>

      {/* Todavía no envía: escribir y mandar llega en el próximo paso. */}
      <Composer value={draft} onChangeText={setDraft} onSend={() => setDraft('')} onMic={() => {}} onMention={() => setDraft((text) => `${text}@`)} />
    </View>
  );
}
