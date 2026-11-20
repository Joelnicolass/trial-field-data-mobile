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
  dropActivity,
  dropExpiredTyping,
  endDatoSave,
  failDatoSave,
  failOutgoing,
  queueOutgoing,
  receiveMessage,
  startDatoSave,
  TYPING_MS,
  type ChatState,
  type Outgoing,
} from '@/domain/chat';
import data from '@/server/mock-data.json';
import {
  completeDato,
  connect,
  loadChat,
  markRead,
  send,
  ServerError,
  setOnline as setServerOnline,
  type Dato,
  type ServerEvent,
} from '@/server/mock-server';

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
  /**
   * Completa lo que le falta a un dato. `version` es la que se estaba viendo:
   * si otro lo cambió antes, el servidor lo rechaza.
   */
  completeDato: (datoId: string, version: number, values: Record<string, string>) => Promise<void>;
  /** El código de algo que hay que avisar abajo. `null` si no hay nada. */
  noticeCode: string | null;
  dismissNotice: () => void;
  /** Si hay señal. Se cambia desde Opciones, para simular el corte. */
  online: boolean;
  setOnline: (online: boolean) => void;
};

// Errores en los que el dato ya está como tiene que estar: no hay nada que
// reintentar, solo avisar.
const NOTHING_TO_RETRY = ['stale_version', 'no_changes', 'not_found'];

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

  noticeCode: null,
  dismissNotice: () => set({ noticeCode: null }),

  online: true,
  setOnline: (online) => {
    set({ online });
    if (!online) updateChat(dropActivity);

    // Al volver, el servidor entrega por la conexión abierta lo que se perdió.
    setServerOnline(online);

    // Y lo que no había salido se manda de nuevo, con su mismo identificador.
    if (online) {
      const failed = get().chat?.outbox.filter((item) => item.status === 'failed') ?? [];
      failed.forEach(deliver);
    }
  },

  completeDato: async (datoId, version, values) => {
    const filled = withoutEmpty(values);
    if (Object.keys(filled).length === 0) return;

    // Reintentar lo mismo usa el mismo identificador: así no se aplica dos veces.
    const previous = get().chat?.datoSaves[datoId];
    const localId = previous && sameValues(previous.values, filled) ? previous.localId : Crypto.randomUUID();

    updateChat((chat) => startDatoSave(chat, datoId, { localId, values: filled }));
    try {
      const change = await completeDato({ local_id: localId, dato_id: datoId, values: filled, base_version: version });
      // El cambio también llega como evento: `receiveMessage` acepta los dos.
      updateChat((chat) => endDatoSave(receiveMessage(chat, change), datoId));
    } catch (error) {
      const code = error instanceof ServerError ? error.code : 'no_connection';
      if (NOTHING_TO_RETRY.includes(code)) {
        // Otro lo completó antes, o no había nada que cambiar: la tarjeta ya
        // muestra cómo quedó, porque ese cambio llegó como cualquier evento.
        updateChat((chat) => endDatoSave(chat, datoId));
        set({ noticeCode: code });
      } else {
        const field = error instanceof ServerError ? (error.field ?? null) : null;
        updateChat((chat) => failDatoSave(chat, datoId, code, field));
      }
    }
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

function withoutEmpty(values: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(values)
      .map(([key, value]) => [key, value.trim()])
      .filter(([, value]) => value !== ''),
  );
}

function sameValues(a: Record<string, string>, b: Record<string, string>): boolean {
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key]);
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
