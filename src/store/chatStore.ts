// El estado del grupo, compartido por las dos pestañas. Es el único lugar
// que habla con el servidor, y lo hace a través de `chatApi`: no sabe si del
// otro lado está el servidor de prueba o uno real. Carga el grupo, escucha
// los eventos, envía, y le pasa cada novedad a las funciones puras del
// dominio, que devuelven el estado nuevo.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { AppState } from 'react-native';
import { create } from 'zustand';

import { ApiError, chatApi, serverNow } from '@/api';
import {
  applyEvent,
  changeAgentMode,
  chatFromSnapshot,
  dropActivity,
  dropExpiredTyping,
  endDatoSave,
  failDatoSave,
  failOutgoing,
  markVoiceNote,
  queueOutgoing,
  receiveMessage,
  receiveOlder,
  startDatoSave,
  TYPING_MS,
  type ChatState,
  type Outgoing,
} from '@/domain/chat';
import type { AgentMode, Dato, ServerEvent } from '@/domain/types';

type Status = 'idle' | 'loading' | 'ready' | 'error';

type ChatStore = {
  status: Status;
  /** `null` hasta que carga. */
  chat: ChatState | null;
  /** Carga el grupo y abre la conexión. Si falló, se puede llamar de nuevo para reintentar. */
  start: () => Promise<void>;
  /** Se están trayendo mensajes anteriores. */
  loadingOlder: boolean;
  /** Trae la página anterior a lo que hay cargado. No hace nada si no hay más o si ya está trayendo una. */
  loadOlder: () => Promise<void>;
  /** Avisa al servidor hasta qué mensaje leí. */
  markReadUpTo: (seq: number) => void;
  /** Manda un texto. Aparece al instante como "enviándose". */
  sendText: (text: string, replyTo?: number | null) => void;
  /**
   * Manda un audio. El servidor solo acepta texto: sale `text`, y la app
   * recuerda que fue un audio y cuánto duró para mostrarlo así.
   */
  sendVoice: (text: string, durationMs: number, replyTo?: number | null) => void;
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
  /** Cambia el modo del agente. Se elige desde "Info del grupo". */
  setAgentMode: (mode: AgentMode) => void;
};

// Errores en los que el dato ya está como tiene que estar: no hay nada que
// reintentar, solo avisar.
const NOTHING_TO_RETRY = ['stale_version', 'no_changes', 'not_found'];

/**
 * Cuántos mensajes se piden por vez. Es chico a propósito: el servidor de
 * prueba trae veinte, y con una página más grande no habría nada anterior
 * que cargar. Con un historial real serían treinta o cincuenta.
 */
const PAGE_SIZE = 10;

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
      const [snapshot, stored] = await Promise.all([chatApi.loadChat({ limit: PAGE_SIZE }), readStoredOutbox()]);
      startedAt = Date.now();
      set({ status: 'ready', chat: chatFromSnapshot(snapshot, stored) });

      openConnection();
      watchAppState();
    } catch {
      set({ status: 'error' });
    }
  },

  loadingOlder: false,
  loadOlder: async () => {
    const { chat, loadingOlder } = get();
    const oldest = chat?.messages[0];
    if (!chat?.hasOlder || !oldest || loadingOlder) return;

    set({ loadingOlder: true });
    try {
      const page = await chatApi.loadOlder({ before_seq: oldest.seq, limit: PAGE_SIZE });
      updateChat((current) => receiveOlder(current, page));
    } catch {
      // Sin señal no hay página: se puede volver a pedir.
    } finally {
      set({ loadingOlder: false });
    }
  },

  markReadUpTo: (seq) => chatApi.markRead(seq),

  sendText: (text, replyTo = null) => {
    // El identificador se genera una sola vez por mensaje: es lo que evita duplicados.
    deliver({ localId: Crypto.randomUUID(), text, replyTo, createdAt: currentTime() });
  },

  sendVoice: (text, durationMs, replyTo = null) => {
    const localId = Crypto.randomUUID();
    updateChat((chat) => markVoiceNote(chat, localId, durationMs));
    deliver({ localId, text, replyTo, createdAt: currentTime() });
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
    chatApi.setOnline(online);

    if (!online) {
      closeConnection();
      return;
    }

    // Al volver se retoma desde el último evento recibido: llega lo que se perdió.
    openConnection();
    // Y lo que no había salido se manda de nuevo, con su mismo identificador.
    resendInOrder(get().chat?.outbox.filter((item) => item.status === 'failed') ?? []);
  },

  setAgentMode: (mode) => {
    // El servidor lo cambia en el momento y no devuelve nada: no hay
    // respuesta que esperar ni error que mostrar.
    chatApi.setAgentMode(mode);
    updateChat((chat) => changeAgentMode(chat, mode));
  },

  completeDato: async (datoId, version, values) => {
    const filled = withoutEmpty(values);
    if (Object.keys(filled).length === 0) return;

    // Reintentar lo mismo usa el mismo identificador: así no se aplica dos veces.
    const previous = get().chat?.datoSaves[datoId];
    const localId = previous && sameValues(previous.values, filled) ? previous.localId : Crypto.randomUUID();

    updateChat((chat) => startDatoSave(chat, datoId, { localId, values: filled }));
    try {
      const change = await chatApi.completeDato({ local_id: localId, dato_id: datoId, values: filled, base_version: version });
      // El cambio también llega como evento: `receiveMessage` acepta los dos.
      updateChat((chat) => endDatoSave(receiveMessage(chat, change), datoId));
    } catch (error) {
      const code = error instanceof ApiError ? error.code : 'no_connection';
      if (NOTHING_TO_RETRY.includes(code)) {
        // Otro lo completó antes, o no había nada que cambiar: la tarjeta ya
        // muestra cómo quedó, porque ese cambio llegó como cualquier evento.
        updateChat((chat) => endDatoSave(chat, datoId));
        set({ noticeCode: code });
      } else {
        const field = error instanceof ApiError ? error.field : null;
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
    const message = await chatApi.send({ local_id: outgoing.localId, text: outgoing.text, reply_to: outgoing.replyTo });
    // El mismo mensaje también llega como evento: `receiveMessage` acepta los dos.
    updateChat((chat) => receiveMessage(chat, message));
  } catch {
    updateChat((chat) => failOutgoing(chat, outgoing.localId));
  }
}

/**
 * Abre la conexión pidiendo lo que pasó después del último evento que llegó
 * (`cursor`). Es la misma función para la primera vez y para volver después
 * de un corte: lo que se perdió llega por el camino de cualquier evento, y
 * si algo viene repetido no cambia nada.
 */
function openConnection() {
  const chat = useChatStore.getState().chat;
  if (!chat) return;

  disconnect?.();
  disconnect = chatApi.connect(handleEvent, { after_cursor: chat.cursor });
}

/** Cierra la conexión. Quién escribe y qué hace el agente dejan de valer: ya no se pueden actualizar. */
function closeConnection() {
  disconnect?.();
  disconnect = null;
  updateChat(dropActivity);
}

let watchingAppState = false;

// Con la app en segundo plano, el sistema termina cortando la conexión. Se
// la cierra a propósito al salir y se la retoma desde el cursor al volver:
// así el corte no depende de cuánto tarde el sistema en hacerlo.
function watchAppState() {
  if (watchingAppState) return;
  watchingAppState = true;

  AppState.addEventListener('change', (appState) => {
    if (appState === 'background') closeConnection();
    // Sin señal no se reabre: de eso se ocupa `setOnline` cuando vuelva.
    if (appState === 'active' && disconnect === null && useChatStore.getState().online) openConnection();
  });
}

/**
 * Manda de nuevo lo que no salió, de a uno y en el orden en que se escribió.
 * Mandarlos todos juntos no garantiza en qué orden los recibe el servidor:
 * el que termina primero queda primero en la conversación.
 */
async function resendInOrder(pending: Outgoing[]) {
  for (const outgoing of pending) await deliver(outgoing);
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
  const ms = Date.parse(serverNow) + (Date.now() - startedAt);
  return new Date(ms - 3 * 3600 * 1000).toISOString().slice(0, 19) + '-03:00';
}

const NO_DATOS: Record<string, Dato> = {};

/**
 * Cómo está ahora cada dato del grupo. Lo usan las dos pestañas.
 *
 * Los datos son una parte propia del estado: quien usa este hook se entera
 * solo cuando un dato cambia, no cada vez que llega un mensaje.
 */
export function useDatos(): Record<string, Dato> {
  return useChatStore((state) => state.chat?.datos ?? NO_DATOS);
}
