import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { useRef } from 'react';
import { View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { useAutoDismiss } from '@/hooks/useAutoDismiss';
import { ErrorNotice } from '@/ui/ErrorNotice';
import { space } from '@/ui/theme';

import { ActivityLine } from './ActivityLine';
import { Composer } from './Composer';
import { GroupRowView } from './GroupRowView';
import { MentionSuggestions } from './MentionSuggestions';
import type { DatoModel, GroupRow, GroupScreenModel, OpenTarget } from './model';
import { NewMessagesPill } from './NewMessagesPill';
import { useComposer } from './useComposer';

type Props = {
  model: GroupScreenModel;
  /** Cuántos mensajes llegaron mientras se leía más arriba. */
  newCount: number;
  /** La lista está al final: lo que llegue se tiene que ver. */
  atBottom: boolean;
  /** La lista terminó de armarse por primera vez. Dice si abrió al final. */
  onListReady: (openedAtEnd: boolean) => void;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onOpen: (target: OpenTarget) => void;
  /** `replyTo`: el mensaje al que se responde, si hay. */
  onSend: (text: string, replyTo: number | null) => void;
  onRetry: (localId: string) => void;
  onComplete: (dato: DatoModel, values: Record<string, string>) => void;
  onDismissNotice: () => void;
};

/** Cuánto dura un aviso abajo si nadie lo cierra, según la guía. */
const NOTICE_MS = 7000;

// La lista del grupo y el composer. Abre parada en lo primero sin leer y no
// se mueve sola mientras se lee más arriba.
export function GroupChatView({ model, newCount, atBottom, onScroll, onListReady, onOpen, onSend, onRetry, onComplete, onDismissNotice }: Props) {
  const listRef = useRef<FlashListRef<GroupRow>>(null);
  const composer = useComposer(model.mentionOptions, onSend);

  useAutoDismiss(model.notice !== null, onDismissNotice, NOTICE_MS);

  /** Si la lista ya estaba al final, la deja al final. Si se leía más arriba, no la mueve. */
  function stayAtEnd(animated: boolean) {
    if (atBottom) listRef.current?.scrollToEnd({ animated });
  }

  function send() {
    if (!composer.submit()) return;
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
          // Recién cuando la lista terminó de armarse se empieza a mirar si está al final.
          onLoad={() => onListReady(model.initialIndex === model.rows.length - 1)}
          keyExtractor={(row) => row.key}
          getItemType={(row) => row.kind}
          renderItem={({ item }) => <GroupRowView row={item} onOpen={onOpen} onRetry={onRetry} onComplete={onComplete} onReply={composer.replyTo} />}
          initialScrollIndex={model.initialIndex}
          // La lista nunca baja por su cuenta: mantiene a la vista lo que se
          // estaba leyendo aunque arriba o abajo cambie algo.
          maintainVisibleContentPosition={{ autoscrollToBottomThreshold: 0 }}
          // Solo si ya estaba al final sigue a lo que llega...
          onContentSizeChange={() => stayAtEnd(true)}
          // ...y lo mismo cuando la lista se achica: sale el teclado o aparece la cita.
          onLayout={() => stayAtEnd(false)}
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

        {/* Lo que flota sobre el final de la lista: el aviso o el botón de nuevos y,
            pegadas al campo de texto, las sugerencias. Así la lista no cambia de tamaño. */}
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, pointerEvents: 'box-none' }}>
          {model.notice ? (
            <View style={{ marginHorizontal: space[16], marginBottom: space[12] }}>
              <ErrorNotice message={model.notice} onClose={onDismissNotice} />
            </View>
          ) : newCount > 0 ? (
            <View style={{ alignSelf: 'flex-end', marginRight: space[16], marginBottom: space[12] }}>
              <NewMessagesPill count={newCount} onPress={() => listRef.current?.scrollToEnd({ animated: true })} />
            </View>
          ) : null}

          {composer.suggestions.length > 0 ? <MentionSuggestions options={composer.suggestions} onPick={composer.pickMention} /> : null}
        </View>
      </View>

      <Composer
        inputRef={composer.inputRef}
        value={composer.draft}
        onChangeText={composer.setDraft}
        onSend={send}
        onMic={() => {}}
        onMention={composer.startMention}
        replyingTo={composer.replyingTo?.quote}
        onCancelReply={composer.cancelReply}
      />
    </KeyboardAvoidingView>
  );
}
