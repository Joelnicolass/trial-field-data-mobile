// El estado del grupo, compartido por las dos pestañas. Es el único lugar
// que habla con el servidor: carga el grupo, escucha los eventos, envía, y le
// pasa cada novedad a las funciones puras del dominio, que devuelven el
// estado nuevo.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { useMemo } from 'react';
import { create } from 'zustand';

import {
  applyEvent,
  chatFromSnapshot,
  currentDatos,
  dropExpiredTyping,
  failOutgoing,
  queueOutgoing,
  receiveMessage,
  TYPING_MS,
  type ChatState,
  type Outgoing,
} from '@/domain/chat';
import data from '@/server/mock-data.json';
import { connect, loadChat, markRead, send, type Dato, type ServerEvent } from '@/server/mock-server';

type Status = 'idle' | 'loading' | 'ready' | 'error';

type ChatStore = {
  status: Status;
  /** `null` hasta que carga. */
  chat: ChatState | null;
  /** Carga el grupo y abre la conexión. Si falló, se puede llamar de nuevo para reintentar. */
  start: () => Promise<void>;
  /** Avisa al servidor hasta qué mensaje leí. */
  markReadUpTo: (seq: number) => void;
  /** Manda un texto. Aparece al instante como "enviándose". */
  sendText: (text: string, replyTo?: number | null) => void;
  /** Vuelve a mandar algo que falló, con su mismo identificador. */
  retry: (localId: string) => void;
};

/** Dónde se guarda en el teléfono lo que no salió. */
const OUTBOX_KEY = 'grupo:sin-enviar';

/** Cierra la conexión abierta, si hay una. */
let disconnect: (() => void) | null = null;
/** Cuándo se abrió el grupo, para calcular la hora de lo que escribo. */
let startedAt = Date.now();

export const useChatStore = create<ChatStore>((set, get) => ({
  status: 'idle',
  chat: null,

  start: async () => {
    const { status } = get();
    if (status === 'loading' || status === 'ready') return;

    set({ status: 'loading' });
    try {
      const [snapshot, stored] = await Promise.all([loadChat(), readStoredOutbox()]);
      startedAt = Date.now();
      set({ status: 'ready', chat: chatFromSnapshot(snapshot, stored) });

      disconnect?.();
      // `after_cursor` pide solo lo que pasó después de la carga.
      disconnect = connect(handleEvent, { after_cursor: snapshot.cursor });
    } catch {
      set({ status: 'error' });
    }
  },

  markReadUpTo: (seq) => markRead(seq),

  sendText: (text, replyTo = null) => {
    // El identificador se genera una sola vez por mensaje: es lo que evita duplicados.
    deliver({ localId: Crypto.randomUUID(), text, replyTo, createdAt: currentTime() });
  },

  retry: (localId) => {
    const pending = get().chat?.outbox.find((item) => item.localId === localId);
    if (pending) deliver(pending);
  },
}));

// Lo que no salió se guarda en el teléfono cada vez que cambia, para
// encontrarlo al volver a abrir la app.
useChatStore.subscribe((state, previous) => {
  const outbox = state.chat?.outbox;
  if (outbox && outbox !== previous.chat?.outbox) {
    AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox)).catch(() => {});
  }
});

/** Muestra el mensaje como "enviándose", lo manda y anota cómo terminó. */
async function deliver(outgoing: Omit<Outgoing, 'status'>) {
  updateChat((chat) => queueOutgoing(chat, outgoing));
  try {
    const message = await send({ local_id: outgoing.localId, text: outgoing.text, reply_to: outgoing.replyTo });
    // El mismo mensaje también llega como evento: `receiveMessage` acepta los dos.
    updateChat((chat) => receiveMessage(chat, message));
  } catch {
    updateChat((chat) => failOutgoing(chat, outgoing.localId));
  }
}

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

async function readStoredOutbox(): Promise<Outgoing[]> {
  try {
    const raw = await AsyncStorage.getItem(OUTBOX_KEY);
    return raw ? (JSON.parse(raw) as Outgoing[]) : [];
  } catch {
    return [];
  }
}

// La hora de un mensaje que escribo. La consigna pide tomar `now` de los
// datos como la hora actual, así que se cuenta desde ahí, igual que el servidor.
function currentTime(): string {
  const ms = Date.parse(data.now) + (Date.now() - startedAt);
  return new Date(ms - 3 * 3600 * 1000).toISOString().slice(0, 19) + '-03:00';
}

/** Cómo está ahora cada dato del grupo. Lo usan las dos pestañas. */
export function useDatos(): Record<string, Dato> {
  const messages = useChatStore((state) => state.chat?.messages);
  return useMemo(() => (messages ? currentDatos(messages) : {}), [messages]);
}
