// El estado del grupo, compartido por las dos pestañas. Es el único lugar
// que habla con el servidor: carga el grupo, escucha los eventos y le pasa
// cada uno a la función pura del dominio, que devuelve el estado nuevo.

import { useMemo } from 'react';
import { create } from 'zustand';

import { applyEvent, chatFromSnapshot, currentDatos, dropExpiredTyping, TYPING_MS, type ChatState } from '@/domain/chat';
import { connect, loadChat, markRead, type Dato, type ServerEvent } from '@/server/mock-server';

type Status = 'idle' | 'loading' | 'ready' | 'error';

type ChatStore = {
  status: Status;
  /** `null` hasta que carga. */
  chat: ChatState | null;
  /** Carga el grupo y abre la conexión. Si falló, se puede llamar de nuevo para reintentar. */
  start: () => Promise<void>;
  /** Avisa al servidor hasta qué mensaje leí. */
  markReadUpTo: (seq: number) => void;
};

/** Cierra la conexión abierta, si hay una. */
let disconnect: (() => void) | null = null;

export const useChatStore = create<ChatStore>((set, get) => ({
  status: 'idle',
  chat: null,

  start: async () => {
    const { status } = get();
    if (status === 'loading' || status === 'ready') return;

    set({ status: 'loading' });
    try {
      const snapshot = await loadChat();
      set({ status: 'ready', chat: chatFromSnapshot(snapshot) });

      disconnect?.();
      // `after_cursor` pide solo lo que pasó después de la carga.
      disconnect = connect(handleEvent, { after_cursor: snapshot.cursor });
    } catch {
      set({ status: 'error' });
    }
  },

  markReadUpTo: (seq) => markRead(seq),
}));

function handleEvent(event: ServerEvent) {
  updateChat((chat) => applyEvent(chat, event, Date.now()));

  // "Escribiendo" no tiene evento de fin: se programa su apagado.
  if (event.type === 'typing') {
    setTimeout(() => updateChat((chat) => dropExpiredTyping(chat, Date.now())), TYPING_MS);
  }
}

function updateChat(change: (chat: ChatState) => ChatState) {
  useChatStore.setState((state) => (state.chat ? { chat: change(state.chat) } : state));
}

/** Cómo está ahora cada dato del grupo. Lo usan las dos pestañas. */
export function useDatos(): Record<string, Dato> {
  const messages = useChatStore((state) => state.chat?.messages);
  return useMemo(() => (messages ? currentDatos(messages) : {}), [messages]);
}
