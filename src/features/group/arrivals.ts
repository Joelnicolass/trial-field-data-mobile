// Qué renglones acaban de llegar y cómo entra cada uno.
//
// Un renglón se anima una sola vez, cuando llega. No se anima al abrir el
// grupo, ni al desplazar la lista, ni al cargar mensajes anteriores. Para
// saberlo se recuerda hasta dónde llegaba la lista la última vez que se
// dibujó: lo que está más allá es nuevo.

import type { Entrance } from '@/ui/animations/useEntrance';

import type { GroupRow } from './model';
import type { TimelineItem } from './timeline';

/** El número de orden más alto que ya se dibujó. */
let lastSeqDrawn = 0;
/** Lo mío que ya se dibujó, por el identificador que le puso la app. */
const ownDrawn = new Set<string>();

/** Si este renglón es algo que acaba de llegar y todavía no se mostró. */
export function isArriving(item: TimelineItem): boolean {
  if (item.kind === 'outgoing') return !ownDrawn.has(item.outgoing.localId);
  if (item.kind !== 'message') return false;

  // Lo mío ya entró cuando lo mandé: su confirmación no vuelve a entrar.
  const { local_id: localId, seq } = item.message;
  if (localId && ownDrawn.has(localId)) return false;
  return seq > lastSeqDrawn;
}

/** Anota que estos renglones ya se dibujaron. La lista lo llama después de cada dibujo. */
export function rememberDrawn(items: TimelineItem[]) {
  for (const item of items) {
    if (item.kind === 'outgoing') ownDrawn.add(item.outgoing.localId);
    if (item.kind === 'message') {
      lastSeqDrawn = Math.max(lastSeqDrawn, item.message.seq);
      if (item.message.local_id) ownDrawn.add(item.message.local_id);
    }
  }
}

// Lo que escribió otro entra desde abajo a la izquierda, liviano, con un rebote corto.
const FROM_OTHERS: Entrance = { fromX: -10, fromY: 12, fromScale: 0.94, spring: { damping: 13, stiffness: 190, mass: 0.7 }, fadeMs: 160 };
// Lo mío sale del campo de texto: viene de abajo a la derecha y más rápido.
const FROM_ME: Entrance = { fromX: 18, fromY: 20, fromScale: 0.9, spring: { damping: 14, stiffness: 240, mass: 0.6 }, fadeMs: 120 };
// Una tarjeta del agente pesa más: sube despacio y casi no rebota.
const FROM_AGENT: Entrance = { fromX: 0, fromY: 18, fromScale: 0.97, spring: { damping: 20, stiffness: 150, mass: 1 }, fadeMs: 220 };
// Un aviso o un separador solo aparece.
const QUIET: Entrance = { fromX: 0, fromY: 4, fromScale: 1, spring: { damping: 20, stiffness: 200, mass: 0.6 }, fadeMs: 200 };

/** Cómo entra un renglón según qué es. */
export function entranceOf(row: GroupRow): Entrance {
  if (row.kind === 'person') return row.isMine ? FROM_ME : FROM_OTHERS;
  if (row.kind === 'agent') return FROM_AGENT;
  return QUIET;
}
