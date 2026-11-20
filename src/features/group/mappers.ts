// De los datos del grupo a lo que la pantalla dibuja.
//
//   servidor → datos (estado) → MAPPERS → pantalla
//
// Funciones puras, una por cada parte de la pantalla. La más importante es
// `toRow`: recibe un renglón de la lista y lo que ese renglón necesita, y
// devuelve su modelo con los textos ya escritos. Como cada renglón se arma
// por separado, un cambio en uno no obliga a rearmar los demás.

import type { DatoSave } from '@/domain/chat';
import { formatDate, formatDuration, formatNumber, formatQuantity, formatTime, formatValue } from '@/domain/format';
import type { AgentStatus, Card, Dato, Field, Member, MemberId, Message, Table } from '@/server/mock-server';

import type {
  ActivityModel,
  AgentContent,
  DatoModel,
  GroupRow,
  MentionOption,
  MetricModel,
  PersonBody,
  QuoteModel,
  ReplyTarget,
  TableModel,
} from './model';
import { roleLabel } from './roles';
import { agentActivity } from './statusLine';
import { messageSnippet, type TimelineItem } from './timeline';

/**
 * Lo que un renglón necesita para armarse, además de su propio mensaje. Lo
 * junta `rowSources`. Si nada de esto cambia, el renglón tampoco.
 */
export type RowSources = {
  /** Quién soy yo. */
  me: MemberId;
  membersById: Map<string, Member>;
  /** La hora actual, en ISO. */
  now: string;
  /** El mensaje al que este responde, si responde a alguno. */
  quoted: Message | undefined;
  /** Cuánto duró, si lo mandé como audio. */
  voiceMs: number | undefined;
  /** Cómo está ahora el dato que lleva este mensaje, si lleva uno. */
  dato: Dato | undefined;
  /** El intento de completar ese dato, si hay uno. */
  save: DatoSave | undefined;
};

/** El modelo de un renglón. `null` si el mensaje es de alguien que no está en el grupo. */
export function toRow(item: TimelineItem, sources: RowSources): GroupRow | null {
  if (item.kind === 'day') return { kind: 'day', key: item.key, label: formatDate(item.date, sources.now) };
  if (item.kind === 'unread') {
    return { kind: 'unread', key: item.key, label: item.count === 1 ? '1 mensaje sin leer' : `${item.count} mensajes sin leer` };
  }
  if (item.kind === 'outgoing') return toOutgoingRow(item, sources);

  const { message } = item;
  const sender = sources.membersById.get(message.sender_id);
  if (!sender) return null;

  // Un aviso del grupo o quién cambió un dato: una línea, sin globo.
  if (message.type === 'system' || message.type === 'dato_change') {
    return { kind: 'line', key: item.key, text: message.text ?? '', isChange: message.type === 'dato_change' };
  }

  if (sender.is_agent) {
    return {
      kind: 'agent',
      key: item.key,
      time: formatTime(message.created_at),
      // El rótulo va solo en el primero de varios mensajes seguidos del agente.
      showLabel: !item.followsSameSender,
      content: toAgentContent(message, sources),
      reply: toReplyTarget(message, sources),
    };
  }

  const isMine = message.sender_id === sources.me;
  return {
    kind: 'person',
    key: item.key,
    author: isMine ? null : `${sender.short_name} · ${roleLabel(sender.role)}`,
    isMine,
    mentionsMe: message.mentions.includes(sources.me),
    time: formatTime(message.created_at),
    quote: sources.quoted ? toQuoteOf(sources.quoted, sources) : null,
    body: toPersonBody(message, sources.voiceMs),
    delivery: isMine ? 'sent' : null,
    localId: null,
    reply: toReplyTarget(message, sources),
  };
}

/** Un mensaje mío que se está enviando o falló: se ve como cualquiera de los míos, con su estado. */
function toOutgoingRow(item: Extract<TimelineItem, { kind: 'outgoing' }>, sources: RowSources): GroupRow {
  const { outgoing } = item;
  return {
    kind: 'person',
    key: item.key,
    author: null,
    isMine: true,
    mentionsMe: false,
    time: formatTime(outgoing.createdAt),
    quote: sources.quoted ? toQuoteOf(sources.quoted, sources) : null,
    body: toOwnBody(outgoing.text, sources.voiceMs),
    delivery: outgoing.status,
    localId: outgoing.localId,
    // Todavía no tiene número de orden: no se le puede responder.
    reply: null,
  };
}

// ── El resto de la pantalla ────────────────────────────────────────────────

// A quién puedo mencionar: todos menos yo. El agente va primero, porque es a
// quien más se le pregunta.
export function toMentionOptions(members: Member[], me: MemberId): MentionOption[] {
  const others = members.filter((member) => member.id !== me);
  return [...others.filter((member) => member.is_agent), ...others.filter((member) => !member.is_agent)].map((member) => ({
    key: member.id,
    name: member.short_name,
    detail: member.is_agent ? 'anota datos y responde consultas' : `${member.name} · ${roleLabel(member.role)}`,
    isAgent: member.is_agent,
  }));
}

// Lo que se avisa abajo cuando completar un dato no hizo falta o no se pudo.
const NOTICE: Record<string, string> = {
  stale_version: 'Alguien lo completó antes que vos. La tarjeta muestra cómo quedó.',
  no_changes: 'Ya tenía ese valor. No hubo nada que guardar.',
  not_found: 'Ese dato ya no está en el grupo.',
};

/** El aviso de abajo, ya escrito. `null` si no hay nada que avisar. */
export function toNotice(noticeCode: string | null): string | null {
  return noticeCode ? (NOTICE[noticeCode] ?? null) : null;
}

/**
 * El aviso de que no hay señal: qué pasa y qué va a pasar con lo que se
 * mande, como pide la guía para los errores. `null` cuando hay señal.
 */
export function toOfflineNotice(online: boolean): { title: string; text: string } | null {
  return online ? null : { title: 'Sin conexión', text: 'Lo que mandes sale solo cuando vuelva la señal.' };
}

/**
 * Lo que pasa ahora, para el pie de la lista.
 *
 * @param typing Quién escribe, ya escrito ("Ramón está escribiendo…"), o `null`.
 */
export function toActivity(typing: string | null, agentStatus: AgentStatus): ActivityModel[] {
  const agent = agentActivity(agentStatus);
  return [...(typing ? [{ text: typing, slow: false }] : []), ...(agent ? [agent] : [])];
}

// ── Personas ───────────────────────────────────────────────────────────────

function toPersonBody(message: Message, voiceMs: number | undefined): PersonBody {
  // Lo que mandé como audio vuelve del servidor como texto: acá recupera su forma.
  if (voiceMs !== undefined) return toOwnBody(message.text ?? '', voiceMs);

  if (message.type === 'audio') {
    return { kind: 'audio', duration: formatDuration(message.duration_ms ?? 0), transcript: message.transcript ?? null };
  }
  if (message.type === 'photo' && message.photo) {
    const { photo } = message;
    // Una panorámica o una foto muy alta no pueden ocupar toda la pantalla.
    const aspectRatio = Math.min(Math.max(photo.width / photo.height, 0.8), 2.2);
    return { kind: 'photo', color: photo.color, aspectRatio, description: photo.description, caption: message.text };
  }
  return { kind: 'text', text: message.text ?? '' };
}

/** Lo mío: un audio con lo que dije si lo grabé, o el texto. */
function toOwnBody(text: string, voiceMs: number | undefined): PersonBody {
  if (voiceMs === undefined) return { kind: 'text', text };
  return { kind: 'audio', duration: formatDuration(voiceMs), transcript: text };
}

/** Lo que hace falta para responderle a este mensaje. */
function toReplyTarget(message: Message, sources: RowSources): ReplyTarget {
  return { seq: message.seq, quote: toQuoteOf(message, sources) };
}

/** Un mensaje resumido en una línea, para citarlo. */
function toQuoteOf(quoted: Message, sources: RowSources): QuoteModel {
  const author = sources.membersById.get(quoted.sender_id);
  return { author: author?.is_agent ? 'Agente' : (author?.short_name ?? ''), snippet: messageSnippet(quoted) };
}

// ── Agente ─────────────────────────────────────────────────────────────────

function toAgentContent(message: Message, sources: RowSources): AgentContent {
  if (message.type === 'dato' && message.dato) {
    // La tarjeta muestra el dato como está ahora, no como era en este mensaje.
    return { kind: 'dato', dato: toDatoModel(sources.dato ?? message.dato, message, sources.now, sources.save) };
  }
  if (message.type === 'card' && message.card) return { kind: 'metric', metric: toMetricModel(message.card, sources.now) };
  if (message.type === 'table' && message.table) return { kind: 'table', table: toTableModel(message.table, sources.now) };
  return { kind: 'text', text: message.text ?? '' };
}

const DATO_STATUS: Record<Dato['status'], DatoModel['status']> = {
  saved: { label: 'Guardado', tag: 'activo' },
  incomplete: { label: 'Falta un dato', tag: 'faltaDato' },
  deleted: { label: 'Eliminado', tag: 'archivado' },
};

/**
 * Un dato, listo para su tarjeta. No asume qué campos trae: los que tienen
 * valor van como filas, cada uno según su tipo, y los que faltan se piden.
 */
export function toDatoModel(dato: Dato, message: Message, now: string, save?: DatoSave): DatoModel {
  const incomplete = dato.status === 'incomplete';
  const headline = findHeadline(dato.fields);
  // Lo que dijo el agente ("Me falta qué vacuna usaste.") deja de valer si
  // alguien cambió el dato después.
  const changedSince = message.dato !== undefined && dato.version > message.dato.version;

  return {
    datoId: dato.id,
    version: dato.version,
    title: dato.title,
    status: DATO_STATUS[dato.status],
    incomplete,
    intro: changedSince ? null : message.text,
    headline: headline ? formatValue(headline.value, headline.type, now, headline.unit) : null,
    fields: dato.fields
      .filter((field) => field.value !== null && field !== headline)
      .map((field) => ({ label: field.label, value: formatValue(field.value, field.type, now, field.unit) })),
    missing: incomplete
      ? dato.fields
          .filter((field) => field.value === null)
          .map((field) => ({
            key: field.key,
            label: field.label,
            suggestions: dato.suggestions[field.key] ?? [],
            numeric: field.type === 'number',
            placeholder: field.unit ? `${field.label} (${field.unit})` : field.label,
            error: save?.errorCode === 'invalid_value' && save.errorField === field.key ? 'Ese valor no sirve. Revisalo y probá de nuevo.' : null,
          }))
      : [],
    saving: save?.status === 'saving',
    // Un valor rechazado se marca en su campo; cualquier otra falla va acá.
    error: save?.status === 'failed' && save.errorCode !== 'invalid_value' ? 'No se pudo guardar. Revisá tu conexión y probá de nuevo.' : null,
    opens: dato.opens,
  };
}

// Si el dato tiene un número con unidad (23 mm), ese es el titular y va grande.
function findHeadline(fields: Field[]): Field | undefined {
  return fields.find((field) => field.type === 'number' && typeof field.value === 'number' && field.unit !== undefined);
}

function toMetricModel(card: Card, now: string): MetricModel {
  return {
    title: `${card.title} · ${formatDate(card.date, now)}`,
    value: formatNumber(card.value),
    unit: card.unit,
    secondary: card.secondary ? `${formatQuantity(card.secondary.value, card.secondary.unit)} ${card.secondary.text}` : null,
    opens: card.opens,
  };
}

// Las columnas y las filas vienen del servidor: no se asume cuántas son.
function toTableModel(table: Table, now: string): TableModel {
  return {
    title: table.title,
    // El texto va a la izquierda; los números y las fechas, a la derecha.
    columns: table.columns.map((column) => ({ label: column.label, align: column.type === 'text' ? 'left' : 'right' })),
    rows: table.rows.map((row) => table.columns.map((column) => formatValue(row[column.key] ?? null, column.type, now, column.unit))),
  };
}
