// El servidor de prueba de la consigna, puesto detrás de la interfaz de la
// app. Es uno de los dos archivos que importan de `src/server/` (el otro es
// `index.ts`, que lee los datos del campo).

import { completeDato, connect, loadChat, markRead, send, ServerError, setAgentMode, setOnline } from '@/server/mock-server';

import { ApiError, type ChatApi } from './chatApi';

export const mockChatApi: ChatApi = {
  loadChat: () => translateErrors(loadChat()),
  connect,
  send: (input) => translateErrors(send(input)),
  completeDato: (input) => translateErrors(completeDato(input)),
  markRead,
  setAgentMode,
  setOnline,
};

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
