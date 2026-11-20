import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { useRef, useState } from 'react';
import { View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { useAutoDismiss } from '@/hooks/useAutoDismiss';
import { ErrorNotice } from '@/ui/ErrorNotice';
import { space } from '@/ui/theme';

import { ActivityLine } from './ActivityLine';
import { Composer } from './Composer';
import { GroupRowView } from './GroupRowView';
import type { DatoModel, GroupRow, GroupScreenModel, OpenTarget } from './model';
import { NewMessagesPill } from './NewMessagesPill';

type Props = {
  model: GroupScreenModel;
  /** Cuántos mensajes llegaron mientras se leía más arriba. */
  newCount: number;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onOpen: (target: OpenTarget) => void;
  onSend: (text: string) => void;
  onRetry: (localId: string) => void;
  onComplete: (dato: DatoModel, values: Record<string, string>) => void;
  onDismissNotice: () => void;
};

/** Cuánto dura un aviso abajo si nadie lo cierra, según la guía. */
const NOTICE_MS = 7000;

// La lista del grupo y el composer. Abre parada en lo primero sin leer y no
// se mueve sola mientras se lee más arriba.
export function GroupChatView({ model, newCount, onScroll, onOpen, onSend, onRetry, onComplete, onDismissNotice }: Props) {
  const listRef = useRef<FlashListRef<GroupRow>>(null);
  const [draft, setDraft] = useState('');

  useAutoDismiss(model.notice !== null, onDismissNotice, NOTICE_MS);

  function send() {
    const text = draft.trim();
    if (text === '') return;

    onSend(text);
    setDraft('');
    // Lo que acabo de mandar tiene que verse: la lista baja hasta el final.
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }

  return (
    // Cuando sale el teclado, la lista se achica y el composer queda arriba de él.
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <FlashList
          ref={listRef}
          data={model.rows}
          keyExtractor={(row) => row.key}
          getItemType={(row) => row.kind}
          renderItem={({ item }) => <GroupRowView row={item} onOpen={onOpen} onRetry={onRetry} onComplete={onComplete} />}
          initialScrollIndex={model.initialIndex}
          // Si está cerca del final, sigue a lo que llega. Si no, no se mueve.
          maintainVisibleContentPosition={{ autoscrollToBottomThreshold: 0.2 }}
          onScroll={onScroll}
          scrollEventThrottle={64}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: space[16] }}
          ListFooterComponent={
            <View style={{ paddingHorizontal: space[16], paddingBottom: space[12], gap: space[8] }}>
              {model.activity.map((activity) => (
                <ActivityLine key={activity.text} text={activity.text} slow={activity.slow} />
              ))}
            </View>
          }
        />

        {model.notice ? (
          <View style={{ position: 'absolute', left: space[16], right: space[16], bottom: space[12] }}>
            <ErrorNotice message={model.notice} onClose={onDismissNotice} />
          </View>
        ) : null}

        {newCount > 0 && !model.notice ? (
          <View style={{ position: 'absolute', right: space[16], bottom: space[12] }}>
            <NewMessagesPill count={newCount} onPress={() => listRef.current?.scrollToEnd({ animated: true })} />
          </View>
        ) : null}
      </View>

      <Composer value={draft} onChangeText={setDraft} onSend={send} onMic={() => {}} onMention={() => setDraft((text) => `${text}@`)} />
    </KeyboardAvoidingView>
  );
}
