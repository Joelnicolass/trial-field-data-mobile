import { membersByIdOf, messageBySeq, type ChatState } from '@/domain/chat';

import type { RowSources } from './mappers';
import type { TimelineItem } from './timeline';

/**
 * Lo que un renglón necesita del estado del grupo: el mensaje que cita, el
 * dato que muestra, su intento de guardado. Nada más.
 *
 * Es lo que hace que un renglón se entere solo de lo suyo: mientras estas
 * piezas sean las mismas, el renglón no se rearma ni se redibuja, pase lo
 * que pase en el resto del grupo.
 */
export function rowSources(chat: ChatState, item: TimelineItem, now: string): RowSources {
  const sources: RowSources = {
    me: chat.me,
    membersById: membersByIdOf(chat.members),
    now,
    quoted: undefined,
    voiceMs: undefined,
    dato: undefined,
    save: undefined,
  };

  if (item.kind === 'outgoing') {
    const { outgoing } = item;
    sources.quoted = outgoing.replyTo === null ? undefined : messageBySeq(chat.messages, outgoing.replyTo);
    sources.voiceMs = chat.voiceNotes[outgoing.localId];
  }

  if (item.kind === 'message') {
    const { message } = item;
    sources.quoted = message.reply_to === null ? undefined : messageBySeq(chat.messages, message.reply_to);
    sources.voiceMs = message.local_id ? chat.voiceNotes[message.local_id] : undefined;

    const datoId = message.type === 'dato' ? message.dato?.id : undefined;
    if (datoId) {
      sources.dato = chat.datos[datoId];
      sources.save = chat.datoSaves[datoId];
    }
  }

  return sources;
}
