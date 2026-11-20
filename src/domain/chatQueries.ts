// Consultas sobre el estado del grupo: cómo está cada dato, qué mensaje tiene
// tal número, quién es tal miembro.
//
// Cada una recuerda su última respuesta. Si le preguntan con la misma lista,
// devuelve lo mismo sin recalcular, y cuando recalcula conserva los objetos
// que no cambiaron. Así quien mira un dato no se entera de que llegó un
// mensaje que no tiene nada que ver.
//
// Cuando la lista de mensajes cambia, todavía la recorren entera. Es el lugar
// donde después van los índices por identificador.

import type { Dato, Member, Message } from '@/server/mock-server';

import { currentDatos } from './chat';
import { memoizeLast, shareRecord } from './sharing';

/** Cómo está ahora cada dato del grupo: id del dato → dato. */
export const datosOf = memoizeLast(
  (messages: Message[]) => currentDatos(messages),
  (previous, next) => shareRecord(previous, next, sameDato),
);

/** Para encontrar un mensaje por su número de orden, por ejemplo el que cita una respuesta. */
export const messagesBySeqOf = memoizeLast((messages: Message[]) => new Map(messages.map((message) => [message.seq, message])));

/** Para encontrar a un miembro por su id. */
export const membersByIdOf = memoizeLast((members: Member[]) => new Map(members.map((member) => [member.id, member])));

// Dos datos dicen lo mismo si tienen la misma versión: cada cambio la sube.
// Se comparan también el estado y los valores para no depender solo de eso.
function sameDato(a: Dato, b: Dato): boolean {
  return (
    a.version === b.version &&
    a.status === b.status &&
    a.fields.length === b.fields.length &&
    a.fields.every((field, index) => field.key === b.fields[index].key && field.value === b.fields[index].value)
  );
}
