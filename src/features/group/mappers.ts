// De los datos del grupo a lo que la pantalla dibuja.
//
//   servidor → datos (estado) → MAPPERS → pantalla
//
// Funciones puras: reciben el estado y la hora, y devuelven los renglones con
// sus textos ya escritos. Acá se decide y se formatea todo; los componentes
// solo ponen cada texto en su lugar.

import type { ChatState } from '@/domain/chat';
import { formatDate, formatDuration, formatNumber, formatQuantity, formatTime, formatValue } from '@/domain/format';
import type { Card, Dato, Field, Member, Message, Table } from '@/server/mock-server';

import type { ActivityModel, AgentContent, DatoModel, GroupRow, GroupScreenModel, MetricModel, PersonBody, QuoteModel, TableModel } from './model';
import { roleLabel } from './roles';
import { agentActivity, statusLine, typingActivity } from './statusLine';
import { buildTimeline, messageSnippet, type TimelineItem } from './timeline';

/** Lo que cada renglón necesita consultar mientras se arma. */
type Context = {
  chat: ChatState;
  now: string;
  /** Cómo está ahora cada dato. */
  datos: Record<string, Dato>;
  membersById: Map<string, Member>;
  messagesBySeq: Map<number, Message>;
};

/** Toda la pantalla del grupo, lista para dibujar. */
export function toGroupScreen(chat: ChatState, datos: Record<string, Dato>, now: string): GroupScreenModel {
  const context: Context = {
    chat,
    now,
    datos,
    membersById: new Map(chat.members.map((member) => [member.id, member])),
    messagesBySeq: new Map(chat.messages.map((message) => [message.seq, message])),
  };

  const timeline = buildTimeline(chat.messages, chat);
  const rows = timeline.flatMap((item, index) => toRow(item, timeline[index - 1], context) ?? []);
  const unreadIndex = rows.findIndex((row) => row.kind === 'unread');

  return {
    title: chat.name,
    statusLine: statusLine(chat),
    rows,
    initialIndex: unreadIndex >= 0 ? unreadIndex : rows.length - 1,
    activity: toActivity(chat),
  };
}

function toActivity(chat: ChatState): ActivityModel[] {
  const typing = typingActivity(chat);
  const agent = agentActivity(chat);
  return [...(typing ? [{ text: typing, slow: false }] : []), ...(agent ? [agent] : [])];
}

function toRow(item: TimelineItem, previous: TimelineItem | undefined, context: Context): GroupRow | null {
  if (item.kind === 'day') return { kind: 'day', key: item.key, label: formatDate(item.date, context.now) };
  if (item.kind === 'unread') {
    return { kind: 'unread', key: item.key, label: item.count === 1 ? '1 mensaje sin leer' : `${item.count} mensajes sin leer` };
  }

  const { message } = item;
  const sender = context.membersById.get(message.sender_id);
  if (!sender) return null;

  // Un aviso del grupo o quién cambió un dato: una línea, sin globo.
  if (message.type === 'system' || message.type === 'dato_change') {
    return { kind: 'line', key: item.key, text: message.text ?? '', isChange: message.type === 'dato_change' };
  }

  if (sender.is_agent) {
    const previousIsAgent = previous?.kind === 'message' && previous.message.sender_id === message.sender_id;
    return { kind: 'agent', key: item.key, time: formatTime(message.created_at), showLabel: !previousIsAgent, content: toAgentContent(message, context) };
  }

  const isMine = message.sender_id === context.chat.me;
  return {
    kind: 'person',
    key: item.key,
    author: isMine ? null : `${sender.short_name} · ${roleLabel(sender.role)}`,
    isMine,
    mentionsMe: message.mentions.includes(context.chat.me),
    time: formatTime(message.created_at),
    quote: toQuote(message, context),
    body: toPersonBody(message),
    delivery: null,
  };
}

// ── Personas ───────────────────────────────────────────────────────────────

function toPersonBody(message: Message): PersonBody {
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

/** El mensaje al que responde este, resumido en una línea. */
function toQuote(message: Message, context: Context): QuoteModel | null {
  if (message.reply_to === null) return null;
  const quoted = context.messagesBySeq.get(message.reply_to);
  if (!quoted) return null;

  const author = context.membersById.get(quoted.sender_id);
  return { author: author?.is_agent ? 'Agente' : (author?.short_name ?? ''), snippet: messageSnippet(quoted) };
}

// ── Agente ─────────────────────────────────────────────────────────────────

function toAgentContent(message: Message, context: Context): AgentContent {
  if (message.type === 'dato' && message.dato) {
    // La tarjeta muestra el dato como está ahora, no como era en este mensaje.
    const current = context.datos[message.dato.id] ?? message.dato;
    return { kind: 'dato', dato: toDatoModel(current, message, context.now) };
  }
  if (message.type === 'card' && message.card) return { kind: 'metric', metric: toMetricModel(message.card, context.now) };
  if (message.type === 'table' && message.table) return { kind: 'table', table: toTableModel(message.table, context.now) };
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
export function toDatoModel(dato: Dato, message: Message, now: string): DatoModel {
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
          }))
      : [],
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
