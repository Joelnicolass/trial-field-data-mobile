// El servidor de prueba de la consigna, puesto detrás de la interfaz de la
// app. Es uno de los dos archivos que importan de `src/server/` (el otro es
// `index.ts`, que lee los datos del campo).
//
// El servidor de prueba entrega el historial entero de una vez. La interfaz
// de la app lo pide por páginas, que es lo que haría un servidor real, así
// que este adaptador guarda el historial y lo reparte por tramos.

import { currentDatos, seqIndex } from '@/domain/chat';
import type { ChatOpening, HistoryPage, Message } from '@/domain/types';
import { completeDato, connect, loadChat, markRead, send, ServerError, setAgentMode, setOnline } from '@/server/mock-server';

import { ApiError, type ChatApi } from './chatApi';

/** Cuántos mensajes ya leídos se entregan antes del primero sin leer, para dar contexto. */
const READ_CONTEXT = 3;
/** Cuánto tarda en llegar una página. El servidor de prueba también demora sus respuestas. */
const PAGE_DELAY_MS = 350;

/** El historial que había al abrir, ordenado. De acá salen las páginas. */
let history: Message[] = [];
let online = true;

export const mockChatApi: ChatApi = {
  loadChat: async ({ limit }) => {
    const snapshot = await translateErrors(loadChat());
    history = [...snapshot.messages].sort((a, b) => a.seq - b.seq);

    const from = openingStart(history, limit, snapshot.members.find((member) => member.id === snapshot.me)?.watermark ?? 0, snapshot.me);
    const opening: ChatOpening = {
      ...snapshot,
      messages: history.slice(from),
      has_older: from > 0,
      datos: Object.values(currentDatos(history)),
    };
    return opening;
  },

  loadOlder: ({ before_seq, limit }) =>
    new Promise<HistoryPage>((resolve, reject) => {
      setTimeout(() => {
        if (!online) return reject(new ApiError('no_connection'));

        const until = seqIndex(history, before_seq);
        const from = Math.max(0, until - limit);
        resolve({ messages: history.slice(from, until), has_older: from > 0 });
      }, PAGE_DELAY_MS);
    }),

  connect,
  send: (input) => translateErrors(send(input)),
  completeDato: (input) => translateErrors(completeDato(input)),
  markRead,
  setAgentMode,
  setOnline: (value) => {
    online = value;
    setOnline(value);
  },
};

// Desde dónde se entrega el historial al abrir: los últimos `limit` mensajes
// o, si lo no leído empieza antes, desde un poco antes del primero sin leer.
// Nunca se abre con un no leído afuera.
function openingStart(messages: Message[], limit: number, readUpTo: number, me: string): number {
  const lastPage = Math.max(0, messages.length - limit);
  const firstUnread = messages.findIndex((message) => message.seq > readUpTo && message.sender_id !== me);
  if (firstUnread === -1) return lastPage;
  return Math.min(lastPage, Math.max(0, firstUnread - READ_CONTEXT));
}

// Los errores del servidor de prueba salen como errores de la app: así nadie
// más tiene que conocer su clase.
async function translateErrors<Result>(request: Promise<Result>): Promise<Result> {
  try {
    return await request;
  } catch (error) {
    if (error instanceof ServerError) throw new ApiError(error.code, error.field ?? null);
    // Cualquier otra falla se trata como un corte: es lo que se puede reintentar.
    throw new ApiError('no_connection');
  }
}
