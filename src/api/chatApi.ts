// Lo que la app le pide al servidor del grupo. Es una interfaz: quien la
// cumple puede ser el servidor de prueba de hoy o uno real mañana, y el resto
// de la app no se entera.

import type { AgentMode, ChatOpening, ErrorCode, HistoryPage, Message, ServerEvent } from '@/domain/types';

export type ChatApi = {
  /**
   * El grupo como está al abrir: miembros, datos, lo que quedó sin enviar, el
   * cursor y el tramo más reciente del historial.
   *
   * @param options.limit Cuántos mensajes traer. Si hay más sin leer que eso, vienen todos los no leídos.
   */
  loadChat(options: { limit: number }): Promise<ChatOpening>;
  /** Los mensajes anteriores a `before_seq`, de a una página. */
  loadOlder(input: { before_seq: number; limit: number }): Promise<HistoryPage>;
  /**
   * Abre la conexión por la que llegan los eventos. Devuelve cómo cerrarla.
   *
   * @param options.after_cursor Pide solo lo que pasó después de ese punto.
   */
  connect(onEvent: (event: ServerEvent) => void, options?: { after_cursor?: number }): () => void;
  /** Manda un texto. `local_id` lo pone la app: reintentar con el mismo no duplica. */
  send(input: { local_id: string; text: string; reply_to?: number | null }): Promise<Message>;
  /** Completa lo que le falta a un dato. `base_version` es la versión que se estaba viendo. */
  completeDato(input: { local_id: string; dato_id: string; values: Record<string, string | number>; base_version: number }): Promise<Message>;
  /** Avisa hasta qué mensaje leí. */
  markRead(seq: number): void;
  /** Cambia cuándo anota el agente. */
  setAgentMode(mode: AgentMode): void;
  /** Simula quedarse sin señal y recuperarla. Existe porque el servidor es de prueba. */
  setOnline(online: boolean): void;
};

/** Un pedido que el servidor rechazó, o que no llegó. */
export class ApiError extends Error {
  code: ErrorCode;
  /** El campo que causó el rechazo, cuando el valor no sirve. */
  field: string | null;

  constructor(code: ErrorCode, field: string | null = null) {
    super(code);
    this.name = 'ApiError';
    this.code = code;
    this.field = field;
  }
}
