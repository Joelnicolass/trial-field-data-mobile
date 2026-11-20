import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { useRef, useState } from 'react';
import { View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { space } from '@/ui/theme';

import { ActivityLine } from './ActivityLine';
import { Composer } from './Composer';
import { GroupRowView } from './GroupRowView';
import type { GroupRow, GroupScreenModel, OpenTarget } from './model';
import { NewMessagesPill } from './NewMessagesPill';

type Props = {
  model: GroupScreenModel;
  /** Cuántos mensajes llegaron mientras se leía más arriba. */
  newCount: number;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onOpen: (target: OpenTarget) => void;
};

// La lista del grupo y el composer. Abre parada en lo primero sin leer y no
// se mueve sola mientras se lee más arriba.
export function GroupChatView({ model, newCount, onScroll, onOpen }: Props) {
  const listRef = useRef<FlashListRef<GroupRow>>(null);
  const [draft, setDraft] = useState('');

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <FlashList
          ref={listRef}
          data={model.rows}
          keyExtractor={(row) => row.key}
          getItemType={(row) => row.kind}
          renderItem={({ item }) => <GroupRowView row={item} onOpen={onOpen} />}
          initialScrollIndex={model.initialIndex}
          // Si está cerca del final, sigue a lo que llega. Si no, no se mueve.
          maintainVisibleContentPosition={{ autoscrollToBottomThreshold: 0.2 }}
          onScroll={onScroll}
          scrollEventThrottle={64}
          contentContainerStyle={{ paddingTop: space[16] }}
          ListFooterComponent={
            <View style={{ paddingHorizontal: space[16], paddingBottom: space[12], gap: space[8] }}>
              {model.activity.map((activity) => (
                <ActivityLine key={activity.text} text={activity.text} slow={activity.slow} />
              ))}
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
