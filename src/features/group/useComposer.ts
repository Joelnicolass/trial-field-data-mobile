import { useRef, useState, type ComponentRef } from 'react';
import type { TextInput } from 'react-native';

import { applyMention, matchMentions, startMention } from './mentions';
import type { MentionOption, ReplyTarget } from './model';
import { pickPhrase } from './voice';

/** Cómo sale lo que se escribe o se graba. `replyTo` es el mensaje citado, si hay. */
type Senders = {
  onSend: (text: string, replyTo: number | null) => void;
  onSendVoice: (text: string, durationMs: number, replyTo: number | null) => void;
};

/**
 * Lo que se está escribiendo en el grupo: el texto, a quién se menciona y a
 * qué mensaje se responde. La pantalla solo dibuja lo que este hook devuelve.
 *
 * @param mentionOptions A quién se puede mencionar.
 */
export function useComposer(mentionOptions: MentionOption[], { onSend, onSendVoice }: Senders) {
  const [draft, setDraft] = useState('');
  const [replyingTo, setReplyingTo] = useState<ReplyTarget | null>(null);
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);

  // Las sugerencias salen del texto: se calculan al dibujar, no se guardan.
  const suggestions = matchMentions(mentionOptions, draft);

  /** Manda lo escrito. Devuelve `false` si no había nada que mandar. */
  function submit(): boolean {
    const text = draft.trim();
    if (text === '') return false;

    onSend(text, replyingTo?.seq ?? null);
    setDraft('');
    setReplyingTo(null);
    return true;
  }

  return {
    draft,
    setDraft,
    inputRef,
    suggestions,
    /** Completa la mención que se venía escribiendo. */
    pickMention: (option: MentionOption) => setDraft((text) => applyMention(text, option.name)),
    /** Suma una "@" y deja el teclado listo para escribir el nombre. */
    startMention: () => {
      setDraft(startMention);
      inputRef.current?.focus();
    },
    replyingTo,
    /** Empieza a responderle a un mensaje. */
    replyTo: (target: ReplyTarget) => {
      setReplyingTo(target);
      inputRef.current?.focus();
    },
    cancelReply: () => setReplyingTo(null),
    submit,
    /** Manda un audio. No se grabó nada: sale una frase al azar de las que el agente entiende. */
    submitVoice: (durationMs: number) => {
      onSendVoice(pickPhrase(Math.random()), durationMs, replyingTo?.seq ?? null);
      setReplyingTo(null);
    },
  };
}
