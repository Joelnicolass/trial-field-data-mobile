import type { FlashListRef } from '@shopify/flash-list';
import { useRef } from 'react';
import { View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { useAutoDismiss } from '@/hooks/useAutoDismiss';
import { Banner } from '@/ui/Banner';
import { ErrorNotice } from '@/ui/ErrorNotice';
import { space } from '@/ui/theme';

import { Composer } from './Composer';
import { MentionSuggestions } from './MentionSuggestions';
import { MessageList } from './MessageList';
import type { OpenTarget } from './model';
import { NewMessagesPill } from './NewMessagesPill';
import type { TimelineItem } from './timeline';
import { useComposer } from './useComposer';
import { useGroupChat } from './useGroupChat';

type Props = {
  /** Abre en Campo lo que indica una tarjeta. */
  onOpen: (target: OpenTarget) => void;
};

/** Cuánto dura un aviso abajo si nadie lo cierra, según la guía. */
const NOTICE_MS = 7000;

/** Cuánto sigue la lista al final después de enviar algo. */
const FOLLOW_AFTER_SEND_MS = 1000;

// La lista del grupo, lo que flota sobre ella y el campo de texto.
//
// Escribir una letra vuelve a dibujar este componente, porque acá vive el
// borrador. La lista no: está memoizada y recibe siempre lo mismo.
export function GroupChatView({ onOpen }: Props) {
  const chat = useGroupChat();
  const composer = useComposer(chat.mentionOptions, { onSend: chat.sendText, onSendVoice: chat.sendVoice });
  const listRef = useRef<FlashListRef<TimelineItem>>(null);

  useAutoDismiss(chat.notice !== null, chat.dismissNotice, NOTICE_MS);

  // Hasta cuándo la lista sigue al final porque acabo de mandar algo.
  const followUntil = useRef(0);

  /** Lo que acabo de mandar tiene que verse: la lista baja hasta el final. */
  function showWhatISent() {
    // El renglón nuevo se mide un instante después (en la web se nota). Durante
    // ese rato la lista sigue al final aunque todavía no haya llegado.
    followUntil.current = Date.now() + FOLLOW_AFTER_SEND_MS;
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }

  function sendVoice(durationMs: number) {
    composer.submitVoice(durationMs);
    showWhatISent();
  }

  function send() {
    if (composer.submit()) showWhatISent();
  }

  return (
    // Cuando sale el teclado, la lista se achica y el composer queda arriba de él.
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      {chat.offlineNotice ? <Banner icon="wifi-off" title={chat.offlineNotice.title} text={chat.offlineNotice.text} /> : null}

      <View style={{ flex: 1 }}>
        <MessageList
          listRef={listRef}
          items={chat.items}
          initialIndex={chat.initialIndex}
          atBottom={chat.atBottom}
          followUntil={followUntil}
          onListReady={chat.onListReady}
          onScroll={chat.onScroll}
          onLoadOlder={chat.loadOlder}
          onOpen={onOpen}
          onRetry={chat.retrySend}
          onComplete={chat.completeDato}
          onReply={composer.replyTo}
        />

        {/* Lo que flota sobre el final de la lista: el aviso o el botón de nuevos y,
            pegadas al campo de texto, las sugerencias. Así la lista no cambia de tamaño. */}
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, pointerEvents: 'box-none' }}>
          {chat.notice ? (
            <View style={{ marginHorizontal: space[16], marginBottom: space[12] }}>
              <ErrorNotice message={chat.notice} onClose={chat.dismissNotice} />
            </View>
          ) : chat.newCount > 0 ? (
            <View style={{ alignSelf: 'flex-end', marginRight: space[16], marginBottom: space[12] }}>
              <NewMessagesPill count={chat.newCount} onPress={() => listRef.current?.scrollToEnd({ animated: true })} />
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
        onSendVoice={sendVoice}
        onMention={composer.startMention}
        replyingTo={composer.replyingTo?.quote}
        onCancelReply={composer.cancelReply}
      />
    </KeyboardAvoidingView>
  );
}
